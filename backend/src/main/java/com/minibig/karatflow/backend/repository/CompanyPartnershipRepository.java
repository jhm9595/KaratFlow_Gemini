package com.minibig.karatflow.backend.repository;

import com.minibig.karatflow.backend.domain.CompanyPartnership;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CompanyPartnershipRepository extends JpaRepository<CompanyPartnership, Long> {
    
    // Find a pending partnership by PIN
    Optional<CompanyPartnership> findByPinCodeAndStatus(String pinCode, String status);
    
    // Find all partnerships where the company is either requester or target
    List<CompanyPartnership> findByRequesterCompanyIdOrTargetCompanyId(Long requesterId, Long targetId);
}
