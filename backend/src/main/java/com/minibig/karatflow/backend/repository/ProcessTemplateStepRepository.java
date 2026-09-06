package com.minibig.karatflow.backend.repository;

import com.minibig.karatflow.backend.domain.ProcessTemplateStep;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProcessTemplateStepRepository extends JpaRepository<ProcessTemplateStep, Long> {
}
