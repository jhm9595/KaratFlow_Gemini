package com.minibig.karatflow.backend.repository;

import com.minibig.karatflow.backend.domain.Design;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DesignRepository extends JpaRepository<Design, Long> {
}
