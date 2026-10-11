package com.minibig.karatflow.backend.repository;
import com.minibig.karatflow.backend.domain.ProcessTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;
public interface ProcessTemplateRepository extends JpaRepository<ProcessTemplate, Long> {
    Optional<ProcessTemplate> findByTemplateCode(String templateCode);
    List<ProcessTemplate> findByUserIdOrIsDefaultTrue(Long userId);
    List<ProcessTemplate> findByCompanyIdOrIsDefaultTrue(Long companyId);
}
