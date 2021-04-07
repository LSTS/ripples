package pt.lsts.ripples.jobs;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import pt.lsts.ripples.services.MissionsFetcher;

@Component
public class MissionsUpdater {

    private final Logger logger = LoggerFactory.getLogger(MissionsUpdater.class);

    @Autowired
    MissionsFetcher missionsUpdater;

    @Scheduled(fixedRate = 600_000)
    public void scheduleFixedRateTask() {

        logger.info("Update missions");
        missionsUpdater.fetchMissions();

    }

}
