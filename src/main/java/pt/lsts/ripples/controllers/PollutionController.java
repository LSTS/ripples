package pt.lsts.ripples.controllers;

import java.io.OutputStreamWriter;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Optional;

import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.RestController;

import pt.lsts.ripples.domain.shared.ExternalServer;
import pt.lsts.ripples.domain.shared.PollutionLocation;
import pt.lsts.ripples.domain.shared.ObstaclePosition;
import pt.lsts.ripples.repo.main.ExternalServerRepository;
import pt.lsts.ripples.repo.main.PollutionDataRepository;
import pt.lsts.ripples.repo.main.ObstacleDataRepository;
import pt.lsts.ripples.util.HTTPResponse;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

@RestController
public class PollutionController {

    @Autowired
    WebSocketsController wsController;

    @Autowired
    PollutionDataRepository repo;

    @Autowired
    ExternalServerRepository repoServer;

    @Autowired
    ObstacleDataRepository repoObstacles;

    private final Logger logger = LoggerFactory.getLogger(PollutionController.class);

    @RequestMapping(path = { "/pollution", "/pollution/" }, method = RequestMethod.GET)
    public List<PollutionLocation> listPollution() {
        ArrayList<PollutionLocation> pollutionList = new ArrayList<>();
        repo.findAll().forEach(pollutionList::add);
        return pollutionList;
    }

    @PreAuthorize("hasRole('SCIENTIST')")
    @PostMapping(path = { "/pollution/{id}" }, consumes = "application/json")
    public ResponseEntity<HTTPResponse> createPollution(@RequestBody PollutionLocation asset, @PathVariable String id) {

        Optional<PollutionLocation> optPollutionMarker = repo.findById(Long.valueOf(id));
        if (optPollutionMarker.isPresent()) {
            PollutionLocation updatePollutionInfo = optPollutionMarker.get();
            updatePollutionInfo.setDescription(asset.getDescription());
            updatePollutionInfo.setRadius(asset.getRadius());
            updatePollutionInfo.setLatitude(asset.getLatitude());
            updatePollutionInfo.setLongitude(asset.getLongitude());
            repo.save(updatePollutionInfo);
            wsController.sendPollutionAssetFromServerToClients(updatePollutionInfo);
        } else {
            repo.save(asset);
            wsController.sendPollutionAssetFromServerToClients(asset);
            logger.info("Added pollution marker: " + asset.getId());
        }

        return new ResponseEntity<>(new HTTPResponse("success", "Added pollution marker"), HttpStatus.OK);
    }

    @PostMapping(path = { "/pollution/{id}/{status}" })
    public ResponseEntity<HTTPResponse> updatePollutionStatus(@PathVariable String id, @PathVariable String status) {

        Optional<PollutionLocation> optPollutionMarker = repo.findById(Long.valueOf(id));
        if (optPollutionMarker.isPresent()) {
            PollutionLocation updatePollutionInfo = optPollutionMarker.get();
            updatePollutionInfo.setStatus(status);
            repo.save(updatePollutionInfo);
            wsController.sendPollutionAssetFromServerToClients(updatePollutionInfo);
            logger.info("Pollution marker " + updatePollutionInfo.getId() + " update status: "
                    + updatePollutionInfo.getId());
        } else {
            return new ResponseEntity<>(new HTTPResponse("error", "Pollution status cannot be updated"), HttpStatus.OK);
        }

        return new ResponseEntity<>(new HTTPResponse("success", "Pollution status updated"), HttpStatus.OK);
    }

    @PreAuthorize("hasRole('SCIENTIST')")
    @PostMapping(path = { "/pollution/sync/" })
    public ResponseEntity<HTTPResponse> syncAllPollutionMarkers(@RequestBody String server) {

        ArrayList<PollutionLocation> pollutionList = new ArrayList<>();
        repo.findByStatus("Created").forEach(pollutionList::add);

        ArrayList<ObstaclePosition> obstaclesList = new ArrayList<>();
        repoObstacles.findAll().forEach(obstaclesList::add);

        JSONObject jsonObject = new JSONObject();
        jsonObject.put("Id", new Date().hashCode());
        jsonObject.put("Focus", pollutionList);
        jsonObject.put("Obstacles", obstaclesList);
        System.out.println(jsonObject.toString());

        final String SERVERURL = server.replaceAll("\"", "");

        // send to external server
        try {
            URL url = new URL(SERVERURL);
            HttpURLConnection httpCon = (HttpURLConnection) url.openConnection();
            httpCon.setDoOutput(true);
            httpCon.setRequestMethod("POST");
            httpCon.setRequestProperty("Content-Type", "application/json");

            OutputStreamWriter out = new OutputStreamWriter(httpCon.getOutputStream());
            out.write(jsonObject.toString());
            out.close();
            httpCon.getInputStream();
            String response = httpCon.getResponseMessage();
            if (response.equals(Integer.toString(HttpURLConnection.HTTP_OK))) {
                // update pollution status
                for (PollutionLocation pollutionLocation : pollutionList) {
                    pollutionLocation.setStatus("Synched");
                    repo.save(pollutionLocation);
                    wsController.sendPollutionAssetFromServerToClients(pollutionLocation);
                }
                logger.info("Pollution markers synched with the external server: " + SERVERURL);
                return new ResponseEntity<>(new HTTPResponse("success", "Pollution markers synched"), HttpStatus.OK);
            } else {
                logger.warn("Pollution markers cannot be synched with the external server: " + SERVERURL);
                return new ResponseEntity<>(new HTTPResponse("error", "Pollution markers cannot be synched"), HttpStatus.OK);
            }
        } catch (Exception e) {
            logger.warn("Pollution markers cannot be synched with the external server: " + SERVERURL);
            e.printStackTrace();
            return new ResponseEntity<>(new HTTPResponse("error", "Pollution markers cannot be synched"), HttpStatus.OK);
        }
    }

    @PreAuthorize("hasRole('SCIENTIST') or hasRole('ADMINISTRATOR')")
    @PostMapping(path = { "/pollution/remove/{id}", "/pollution/remove/{id}/" })
    public ResponseEntity<HTTPResponse> deletePollution(@PathVariable String id) {
        repo.deleteById(Long.valueOf(id));
        logger.info("Pollution markers removed: " + id);
        return new ResponseEntity<>(new HTTPResponse("Success", "Pollution marker was deleted"), HttpStatus.OK);
    }

    @PreAuthorize("hasRole('SCIENTIST')")
    @RequestMapping(path = { "/pollution/serverAll", "/pollution/serverAll/" }, method = RequestMethod.GET)
    public List<ExternalServer> pollutionServerAll() {
        ArrayList<ExternalServer> serverList = new ArrayList<>();
        repoServer.findAll().forEach(serverList::add);
        return serverList;
    }

    @PreAuthorize("hasRole('SCIENTIST') or hasRole('ADMINISTRATOR')")
    @GetMapping(path = { "/pollution/server", "/pollution/server/" })
    public @ResponseBody String pollutionServer() {
        Optional<ExternalServer> opt = repoServer.findByName("ramp_pollution");
        String serverUrl = "";
        if (opt.isPresent()) {
            serverUrl = opt.get().getIP();
        }
        return serverUrl;
    }

    @PreAuthorize("hasRole('SCIENTIST') or hasRole('ADMINISTRATOR')")
    @PostMapping(path = { "/pollution/server/" })
    public ResponseEntity<HTTPResponse> updatePollutionServer(@RequestBody String ip) {

        Optional<ExternalServer> opt = repoServer.findByName("ramp_pollution");
        if (opt.isPresent()) {
            ExternalServer server = opt.get();
            server.setIP(ip);
            repoServer.save(server);
        } else {
            ExternalServer newServer = new ExternalServer("ramp_pollution", ip);
            repoServer.save(newServer);
        }

        logger.info("Pollution server updated: " + ip);
        return new ResponseEntity<>(new HTTPResponse("success", "Pollution server updated"), HttpStatus.OK);
    }

    @RequestMapping(path = { "/pollution/obstacles", "/pollution/obstacles/" }, method = RequestMethod.GET)
    public List<ObstaclePosition> listObstacles() {
        ArrayList<ObstaclePosition> obstaclesList = new ArrayList<>();
        repoObstacles.findAll().forEach(obstaclesList::add);
        return obstaclesList;
    }

    @PreAuthorize("hasRole('SCIENTIST')")
    @PostMapping(path = { "/pollution/obstacle" }, consumes = "application/json")
    public ResponseEntity<HTTPResponse> createObstacle(@RequestBody ObstaclePosition asset) {

        ObstaclePosition newObstacle = new ObstaclePosition(asset.getDescription(), asset.getTimestamp(),
                asset.getUser());
        for (Double[] pos : asset.getPositions()) {
            newObstacle.addPosition(pos);
        }
        repoObstacles.save(newObstacle);
        wsController.sendObstacleAssetFromServerToClients(newObstacle);

        return new ResponseEntity<>(new HTTPResponse("success", "Added obstacle polygon"), HttpStatus.OK);
    }

    @PreAuthorize("hasRole('SCIENTIST') or hasRole('ADMINISTRATOR')")
    @PostMapping(path = { "/pollution/remove/obstacle/{id}", "/pollution/remove/obstacle/{id}/" })
    public ResponseEntity<HTTPResponse> deleteObstacle(@PathVariable String id) {
        repoObstacles.deleteById(Long.valueOf(id));
        logger.info("Obstacle removed: " + id);
        return new ResponseEntity<>(new HTTPResponse("Success", "Obstacle was deleted"), HttpStatus.OK);
    }

    @PreAuthorize("hasRole('SCIENTIST')")
    @RequestMapping(path = { "/pollution/alert", "/pollution/alert/" }, method = RequestMethod.GET)
    public ResponseEntity<String> listAlert() {

        ArrayList<PollutionLocation> pollutionList = new ArrayList<>();
        repo.findByStatus("Created").forEach(pollutionList::add);

        ArrayList<ObstaclePosition> obstaclesList = new ArrayList<>();
        repoObstacles.findAll().forEach(obstaclesList::add);

        JSONObject jsonObject = new JSONObject();
        jsonObject.put("Id", new Date().hashCode());
        jsonObject.put("Focus", pollutionList);
        jsonObject.put("Obstacles", obstaclesList);

        return new ResponseEntity<>(jsonObject.toString(), HttpStatus.OK);
    }
}