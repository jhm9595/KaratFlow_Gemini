package com.minibig.karatflow.backend.repository;

import com.minibig.karatflow.backend.domain.Company;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CompanyRepository extends JpaRepository<Company, Long> {
}
