package pt.lsts.ripples.domain.shared;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import javax.persistence.ElementCollection;
import javax.persistence.Entity;
import javax.persistence.Id;

import com.eclipsesource.json.JsonObject;

import org.json.JSONObject;

@Entity
public class Mission {

    @Id
    private String srcPath;

    private String mission;
    private Date date;
    private String location;
    private String plan;
    private String vehicle;
    //private JSONObject boundingBox;

    @ElementCollection
	private Map<String,Double> bbox;
    

    public Mission() {
    }

    public Mission(String mis, Date date, String loc, String plan, String veh, String path) {
        this.setMission(mis);
        this.setDate(date);
        this.setLocation(loc);
        this.setPlan(plan);
        this.setVehicle(veh);
        this.setPath(path);
    }

    @Override
    public String toString() {
        JsonObject json = new JsonObject();
        json.add("mission", mission);
        json.add("location", location);
        json.add("plan", plan);
        json.add("vehicle", vehicle);
        json.add("date", date.toString());
        json.add("path", srcPath);
        return json.toString();
    }

    public String getMission() {
        return mission;
    }

    public void setMission(String mis) {
        this.mission = mis;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String loc) {
        this.location = loc;
    }

    public String getVehicle() {
        return vehicle;
    }

    public void setVehicle(String vehicle) {
        this.vehicle = vehicle;
    }

    public String getPlan() {
        return plan;
    }

    public void setPlan(String plan) {
        this.plan = plan;
    }

    public String getPath() {
        return srcPath;
    }

    public void setPath(String path) {
        this.srcPath = path;
    }

    public Date getDate(){
        return date;
    }

    public void setDate(Date date){
        this.date = date;
    }




    public Map<String,Double> getBoundingBox() {
		return bbox;
	}

	public void setBoundingBox(JSONObject currentDirection) {
		this.bbox = this.boudinBoxFromJsonArray(currentDirection);
    }

    public Map<String, Double> boudinBoxFromJsonArray(JSONObject arr) {
        Map<String, Double> map = new HashMap<>();

        try {
            map.put("minX", (double) arr.get("minX"));
            map.put("minY", (double) arr.get("minY"));
            map.put("maxX", (double) arr.get("maxX"));
            map.put("maxY", (double) arr.get("maxY"));
            
        } catch (Exception e) {
            e.printStackTrace();
        }

        /*
		try {
			for (int i = 0; i < arr.length(); i++) {  
				String source = arr.getJSONObject(i).getString("source");
				Double value = arr.getJSONObject(i).getDouble("value");
				map.put(source, value);
			}
		} catch (JSONException e) {
			e.printStackTrace();
        }
        */
		return map;
	}
    
}
