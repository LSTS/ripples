package pt.lsts.ripples.domain.shared;

import java.util.*;

import javax.persistence.ElementCollection;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.GeneratedValue;

@Entity
public class ObstaclePosition {

    @Id
    @GeneratedValue
    private Long id;

    private String description;

    @ElementCollection
	public List<Double[]> positions = new ArrayList<Double[]>();;

    private Date timestamp;
    private String user;

    public ObstaclePosition() {
        this.setDescription("");
        this.setTimestamp(new Date());
        this.setUser("");
    }

    public ObstaclePosition(String desc, Date time, String user) {
        this.setDescription(desc);
        this.setTimestamp(time);
        this.setUser(user);
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

    public Date getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Date time) {
        this.timestamp = time;
    }

    public String getUser() {
        return user;
    }

    public void setUser(String user) {
        this.user = user;
    }

    public List<Double[]> getPositions() {
        return positions;
    }
    
    public void addPosition(Double[] newPos) {
        this.positions.add(newPos);
    }

    public void addPositions(List<Double[]> newPos) {
        this.positions = newPos;
    }
}