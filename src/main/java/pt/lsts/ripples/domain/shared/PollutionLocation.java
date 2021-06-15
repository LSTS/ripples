package pt.lsts.ripples.domain.shared;

import java.util.Date;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;

import com.eclipsesource.json.JsonObject;

@Entity
public class PollutionLocation {

    @Id
    @GeneratedValue
    private Long id;

    private String description;
    private long radius;
    private double latitude;
    private double longitude;
    private Date timestamp;
    private String status;
    private String user;

    public PollutionLocation() {
    }

    public PollutionLocation(String desc, long rad, double lat, double lon, Date time, String user) {
        this.setDescription(desc);
        this.setRadius(rad);
        this.setLatitude(lat);
        this.setLongitude(lon);
        this.setTimestamp(time);
        this.setUser(user);
    }

    @Override
    public String toString() {
        JsonObject json = new JsonObject();
        json.add("id", id);
        json.add("description", description);
        json.add("radius", radius);
        json.add("latitude", latitude);
        json.add("longitude", longitude);
        json.add("timestamp", timestamp.toString());
        json.add("status", status);
        json.add("user", user);
        return json.toString();
    }

    public Long getId() {
        return id;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String desc) {
        this.description = desc;
    }

    public long getRadius() {
        return radius;
    }

    public void setRadius(long rad) {
        this.radius = rad;
    }

    public double getLatitude() {
        return latitude;
    }

    public void setLatitude(double lat) {
        this.latitude = lat;
    }

    public double getLongitude() {
        return longitude;
    }

    public void setLongitude(double lon) {
        this.longitude = lon;
    }

    public Date getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Date time) {
        this.timestamp = time;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getUser() {
        return user;
    }

    public void setUser(String user) {
        this.user = user;
    }

}
