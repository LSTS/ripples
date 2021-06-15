package pt.lsts.ripples.repo.main;

import java.util.List;

import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import pt.lsts.ripples.domain.shared.PollutionLocation;

@Repository
public interface PollutionDataRepository extends CrudRepository<PollutionLocation, Long> {
    List<PollutionLocation> findByStatus(String source);
}