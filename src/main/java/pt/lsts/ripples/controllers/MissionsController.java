package pt.lsts.ripples.controllers;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import pt.lsts.ripples.domain.shared.Mission;
import pt.lsts.ripples.repo.main.MissionDataRepository;
import pt.lsts.ripples.services.MissionsFetcher;

@RestController
public class MissionsController {

	@Autowired
	MissionsFetcher missionsUpdater;

	@Autowired
	MissionDataRepository repo;

	@RequestMapping(path = { "/missions", "/missions/" }, method = RequestMethod.GET)
	public List<Mission> listAIS() {
		ArrayList<Mission> missionList = new ArrayList<>();
		missionsUpdater.fetchMissions();
		repo.findAll().forEach(missionList::add);
		return missionList;
	}
}