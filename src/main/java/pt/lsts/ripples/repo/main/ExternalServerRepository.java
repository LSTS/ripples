package pt.lsts.ripples.repo.main;

import java.util.Optional;

import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import pt.lsts.ripples.domain.shared.ExternalServer;

@Repository
public interface ExternalServerRepository extends CrudRepository<ExternalServer, String>{
    Optional<ExternalServer> findByName(String name);
}