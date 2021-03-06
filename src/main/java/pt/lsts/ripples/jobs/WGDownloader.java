package pt.lsts.ripples.jobs;

import com.firebase.client.AuthData;
import com.firebase.client.Firebase;
import com.firebase.client.Firebase.AuthResultHandler;
import com.firebase.client.FirebaseError;
import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.util.FileCopyUtils;
import pt.lsts.ripples.domain.assets.SystemAddress;
import pt.lsts.ripples.domain.wg.*;
import pt.lsts.ripples.repo.main.AISDataRepository;
import pt.lsts.ripples.repo.main.EnvDataRepository;
import pt.lsts.ripples.util.RipplesUtils;

import javax.annotation.PostConstruct;
import java.io.*;
import java.net.*;
import java.text.SimpleDateFormat;
import java.util.*;

@Component
public class WGDownloader {

	@Value("${wgms.user}")
	private String user;

	@Value("${wgms.pass}")
	private String password;
	
	@Value("${ais.db}")
	private String aisDB;
	
	@Value("${skip.db.initialization}")
	boolean skip_initialization;

	
	@Autowired
	private EnvDataRepository envRepo;
	
	@Autowired
	private AISDataRepository aisRepo;
	
	@Autowired
	private RipplesUtils ripples;
	
	private final Logger logger = LoggerFactory.getLogger(WGDownloader.class);
	
	/**
	 * Liquid Robotics data portal URL to query wg sensors data
	 */
	private final String URL = "https://dataportal.liquidr.net/firehose/?";
	private final String RIPPLESURL = "http://ripples.lsts.pt/api/v1/systems";
	private static final String firebaseUrl = "https://neptus.firebaseio.com/";
	private Firebase _firebase = null;
	private final double METERPSECS_KNOTS = 1.94384449;
	private final int imcID = 0x2801;
	private SimpleDateFormat fmt = new SimpleDateFormat("YYYY-MM-dd'T'HH:mm:ssZ");


	/**
	 * WG SV3-127 id in the data portal
	 */
	private final String vids = "1315596328";

	private void processData(String data) {
		JsonParser parser = new JsonParser();
		try {
			JsonArray root = parser.parse(data).getAsJsonArray();
			Gson gson = new Gson();
			final TreeSet<PosDatum> newPositions = new TreeSet<>(new Comparator<PosDatum>() {
				@Override
				public int compare(PosDatum o1, PosDatum o2) {
					return o1.getTimestamp().compareTo(o2.getTimestamp());
				}
			});
			SystemAddress addr = ripples.getOrCreate("wg-sv3-127");
			
			root.forEach(element -> {
				JsonObject jo = element.getAsJsonArray().get(0).getAsJsonObject();
				logger.info(""+jo);
				if (jo.get("kind").getAsString().equals("CTD")) {
					logger.info("Getting CTD data...");
					WGCtd ctd = gson.fromJson(jo, WGCtd.class);
					LinkedHashMap<String, Double> vals = new LinkedHashMap<>();
					vals.put("conductivity", ctd.getConductivity());
					vals.put("temperature", ctd.getTemperature());
					vals.put("salinity", ctd.getSalinity());
					vals.put("pressure", ctd.getPressure());
					ripples.setReceivedData(addr, ctd.getLatitude(), ctd.getLongitude(), new Date(ctd.getTime()), vals);
				}
				else if (jo.get("kind").getAsString().equals("Waveglider")) {
					logger.info("Getting Position data...");
					WGPosition pos = gson.fromJson(jo, WGPosition.class);
					ripples.setPosition(addr, pos.getLatitude(), pos.getLongitude(), new Date(pos.getTime()), true);
				}
				else if (jo.get("kind").getAsString().equals("AIS") && jo.get("aistype").getAsString().equals("positionreport")) {
					logger.info("Getting AIS data...");
					WGAIS ais = gson.fromJson(jo, WGAIS.class);
					ShipsDatum datum = new ShipsDatum();
					datum.setLatitude(ais.getLatitude());
					datum.setLongitude(ais.getLongitude());
					
					//TODO RESOLVE Ship name in BD using mmsi or aishub
					logger.info("Resolving MMSI: "+ais.getMMSI());
					AISDatum aisdata = aisRepo.findById(ais.getMMSI()).orElse(AISDatum.getDefault(ais.getMMSI()));
					datum.setUid(ais.getMMSI());
					datum.setSource(aisdata.getSource());
					datum.setTimestamp(new Date(ais.getTime()));
					datum.setSog(ais.getSOG());
					datum.setType(aisdata.getType());
					sendToFirebase(datum);
				}
				else {
					logger.warn("ignored "+jo);
				}
			});
			
			if(!newPositions.isEmpty()) {
				logger.info("Sending position to ripples");
				sendToRipples(getPosJson(newPositions.descendingIterator().next()));
			}
			logger.info("Finished getting data.");
		}
		catch (Exception e) {
			e.printStackTrace();
		}
	}
	
	@PostConstruct
	public void initialData() {
		
		if (skip_initialization) {
			logger.info("Skipping DB initialization");
			return;
		}
		
		try {
			Authenticator.setDefault(new Authenticator() {
				protected PasswordAuthentication getPasswordAuthentication() {
					return new PasswordAuthentication(user, password.toCharArray());
					
				}
			});
		} catch (Exception e) {
			e.printStackTrace();
		}
		logger.info("Retrieving initial data...");	
		
		// if there is no data...
		if(!aisRepo.findAll().iterator().hasNext())
			loadAISdata();
		
		// retrieve CTD from last 30 days
		if (!envRepo.findBySource("wg-sv3-127").iterator().hasNext())
			processData(getData("CTD", "-30d"));
		
		// retrieve any recent state data
		processData(getData("AIS,Waveglider", "-10m"));		
	}
	
	@Scheduled(fixedRate = 180_000)
	public void updateWGData() {
		if (!skip_initialization){
			logger.info("retrieving ctd...");
			processData(getData("CTD,AIS,Waveglider", "-3m"));
		}
	}
		
	
	private void loadAISdata() {
		BufferedReader reader = null;
		InputStream is = getClass().getClassLoader().getResourceAsStream(aisDB);
		try {
			reader = new BufferedReader(new InputStreamReader(is));
		} catch (Exception e1) {
			e1.printStackTrace();
		}
		reader.lines().forEach(line -> {
			String[] entry = line.split(",");
			if(entry.length > 4) { //imo,mmsi,name,flag,type
				long m = Long.parseLong(entry[1].replaceAll("\"", ""));
				AISDatum ais = new AISDatum();
				ais.setUid(m);
				ais.setSource(entry[2].replaceAll("\"", ""));
				ais.setFlag(entry[3].replaceAll("\"", ""));
				ais.setTimestamp(new Date(System.currentTimeMillis()));
				aisRepo.save(ais);
			}
		});
		logger.info("Loaded "+aisRepo.count()+" entries onto AIS DB");
		
	}
	
	public static String getQueryParam(String param, String value) {
		StringBuilder sb = new StringBuilder();
		sb.append(param);
		sb.append('=');
		sb.append(value);
		return sb.toString();
	}

	public String getVehicleID() {
		return getQueryParam("vids", vids);
	}

	private String getQuery(String param, String start) {
		StringJoiner sj = new StringJoiner("&", URL, "");
		String end = "-0m";
		sj.add(getQueryParam("start", start));
		sj.add(getQueryParam("end", end));
		sj.add(getQueryParam("format", "json"));
		sj.add(getQueryParam("kinds", param));
		sj.add(getVehicleID());

		return sj.toString();
	}

	public String getData(String p, String start) {
		String query_url = getQuery(p, start);
		String dataPath = getQueryData(query_url, p);
		return dataPath;
	}

	/**
	 * Returns file path where the queried data as written
	 * 
	 * @param req
	 *            request query
	 * @return File path to data
	 */
	private String getQueryData(String req, String param) {
		try {
			CookieHandler.setDefault(new CookieManager(null, CookiePolicy.ACCEPT_ALL));
			HttpURLConnection conn = (HttpURLConnection) new java.net.URL(req).openConnection();
			ByteArrayOutputStream baos = new ByteArrayOutputStream();
			FileCopyUtils.copy(conn.getInputStream(), baos);
			conn.getInputStream().close();
			return baos.toString();
		} catch (IOException e) {
			e.printStackTrace();
		}
		return null;
	}
	
	 /**
     * Adapted from https://github.com/paulosousadias/mbari-pos-ripples/blob/master/src/main/java/pt/lsts/mbari/Positions.java#L206
     * @param datum json object to send to ripples
     */
    public void sendToRipples(JsonObject obj){
    	logger.info("Sending state to "+RIPPLESURL);
		try {
			URL url = null;
			try {
				url = new URL(RIPPLESURL);
				HttpURLConnection httpCon = (HttpURLConnection) url.openConnection();
				httpCon.setDoOutput(true);
				httpCon.setRequestMethod("PUT");
				httpCon.setRequestProperty("Content-Type", "application/json");

				
				OutputStreamWriter out = new OutputStreamWriter(httpCon.getOutputStream());
				out.write(obj.toString());
				out.close();
				httpCon.getInputStream();
				String response = httpCon.getResponseMessage();
				if(response.equals(Integer.toString(HttpURLConnection.HTTP_OK)))
					logger.info("Sent: "+obj.getAsString());
				else
					logger.warn("Got: "+response+" from "+RIPPLESURL);
			}
			catch (Exception e) {
				e.printStackTrace();
			}
		}
		catch (Exception e) {
			e.printStackTrace();
		}
    }
    
    /**
     * Adapted from https://github.com/zepinto/aiscaster/blob/master/src/info/zepinto/aiscast/Ais2Ripples.java#L61
     * @param datum - AIS data
     */
	private void sendToFirebase(ShipsDatum data) {
		
    	if(getFirebase() != null && data.getSource()!=null){
			if (data.getUid() < 0.2) {
				Firebase ship = getFirebase().child("ships/" + data.getSource()).getRef();
				if (ship != null)
					ship.removeValue();
			} else {
				Map<String, Object> loc = new LinkedHashMap<>();
				Map<String, Object> state = new LinkedHashMap<>();
				loc.put("latitude", data.getLatitude());
				loc.put("longitude", data.getLongitude());
				loc.put("heading", data.getHeading());
				loc.put("speed", data.getSog());
				state.put("position", loc);
				state.put("updated_at", data.getTimestamp().getTime());
				state.put("type", data.getType());
				if (getFirebase() != null) {
					getFirebase().child("ships/" + data.getSource()).getRef().updateChildren(state);
				}
			}
    	}
	}

	/**
	 * @param datum
	 * @return
	 */
	public JsonObject getPosJson(PosDatum datum) {
		JsonObject obj = new JsonObject();
    	JsonArray coords = new JsonArray();
    	coords.add(datum.getLatitude());
    	coords.add(datum.getLongitude());
    	obj.addProperty("imcid", imcID);
    	obj.addProperty("name", datum.getSource());
    	obj.add("coordinates",coords);
    	obj.addProperty("iridium", "");
    	obj.addProperty("created_at", fmt.format(datum.getTimestamp()));
    	obj.addProperty("updated_at", fmt.format(datum.getUpdated_at()));
    	obj.addProperty("speed", datum.getSpeed()/ METERPSECS_KNOTS);
		return obj;
	}
    
	Firebase getFirebase() {
    	if (_firebase == null) {
			_firebase = new Firebase(firebaseUrl);
			_firebase.authAnonymously(new AuthResultHandler() {
				@Override
				public void onAuthenticationError(FirebaseError error) {
					error.toException().printStackTrace();
					_firebase = null;
				}

				@Override
				public void onAuthenticated(AuthData authData) {
					logger.debug("Authenticated with firebase");
				}
			});
			if (_firebase != null) {
				Firebase.goOnline();
			}
		}
    	return _firebase;
    }
}