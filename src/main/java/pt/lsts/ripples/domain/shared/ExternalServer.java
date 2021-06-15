package pt.lsts.ripples.domain.shared;

import javax.persistence.Entity;
import javax.persistence.Id;

import com.eclipsesource.json.JsonObject;

@Entity
public class ExternalServer {
    
    @Id
    private String name;

    private String ip_address;

    public ExternalServer() { }

    public ExternalServer(String name, String ip) {
        this.setName(name);
        this.setIP(ip);
    }

    @Override
    public String toString() {
        JsonObject json = new JsonObject();
        json.add("name", name);
        json.add("ip", ip_address);
        return json.toString();
    }

    public String getName() {
        return name;
    }

    public void setName(String name){
        this.name = name;
    }

    public String getIP() {
        return ip_address;
    }

    public void setIP(String ip){
        this.ip_address = ip;
    }

}
