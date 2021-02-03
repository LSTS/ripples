package pt.lsts.ripples.services;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.Optional;
import java.util.TimeZone;

import javax.annotation.PostConstruct;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.web.client.RestTemplate;

import pt.lsts.ripples.controllers.WebSocketsController;
import pt.lsts.ripples.domain.shared.Mission;
import pt.lsts.ripples.repo.main.MissionDataRepository;

@Component
public class MissionsFetcher {

    @Autowired 
    MissionDataRepository repo;

    @Autowired
    WebSocketsController wsController;

    @Value("${mission-repository-api.url:http://ripples.lsts.pt:3002/missions}")
	private String url;

    private final Logger logger = LoggerFactory.getLogger(MissionsFetcher.class);   

    @PostConstruct
    public void init() {
        logger.info("MissionsFetcher url: " + url);
        fetchMissions();
    }

    public void fetchMissions() {

        try {
            RestTemplate restTemplate = new RestTemplate();
            String result = restTemplate.getForObject(url, String.class);

            JSONArray jsonarray = new JSONArray(result);

            for (int i = 0; i < jsonarray.length(); i++) {
                JSONObject jsonObject = jsonarray.getJSONObject(i);

                // adicionar ao repositorio
                String mission = (String) jsonObject.get("mission");
                String d = (String) jsonObject.get("date");
                String loc = (String) jsonObject.get("location");
                String plan = (String) jsonObject.get("plan");
                String vehicle = (String) jsonObject.get("vehicle");
                String path = (String) jsonObject.get("srcPath");
                JSONObject boundingBox = (JSONObject) jsonObject.get("boundingBox");
                
                /*
                logger.info("mission:     " + mission);
                logger.info("date:        " + d);
                logger.info("location:    " + loc);
                logger.info("plan:        " + plan);
                logger.info("vehicle:     " + vehicle);
                logger.info("path:        " + path);
                logger.info("boundingBox: " + boundingBox);
                */
                
                final SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
      
                String dateString = d;
                formatter.setTimeZone(TimeZone.getTimeZone("UTC"));
                Date date = formatter.parse(dateString);

                Optional<Mission> optMission = repo.findById((String) jsonObject.get("srcPath"));
                if(!optMission.isPresent()){
                    Mission newMission = new Mission(mission, date, loc, plan, vehicle, path);
                    newMission.setBoundingBox(boundingBox);
                    repo.save(newMission);
                    wsController.sendMissionUpdateFromServerToCLients(newMission);

                    logger.info("Mission added: " + newMission.toString());
                }
            }
        } catch (Exception e) {
            logger.error("Unable to parse misisons", e);
        }

    }

}
