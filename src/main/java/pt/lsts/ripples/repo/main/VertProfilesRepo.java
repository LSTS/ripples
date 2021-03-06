package pt.lsts.ripples.repo.main;

import java.util.Date;

import org.springframework.data.repository.CrudRepository;

import org.springframework.stereotype.Repository;
import pt.lsts.ripples.domain.soi.VerticalProfileData;
@Repository
public interface VertProfilesRepo extends CrudRepository<VerticalProfileData, Long> {
	Iterable<VerticalProfileData> findByTimestampAfter(Date since);
	Iterable<VerticalProfileData> findBySystem(String sourceName);
	Iterable<VerticalProfileData> findByType(String sampleType);
}
