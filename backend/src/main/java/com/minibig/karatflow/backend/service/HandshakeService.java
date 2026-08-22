package com.minibig.karatflow.backend.service;

import com.minibig.karatflow.backend.domain.Company;
import com.minibig.karatflow.backend.domain.CompanyPartnership;
import com.minibig.karatflow.backend.dto.HandshakeDTO;
import com.minibig.karatflow.backend.repository.CompanyPartnershipRepository;
import com.minibig.karatflow.backend.repository.CompanyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HandshakeService {

    private final CompanyPartnershipRepository partnershipRepository;
    private final CompanyRepository companyRepository;

    @Transactional
    public HandshakeDTO requestHandshake(Long requesterCompanyId) {
        Company requester = companyRepository.findById(requesterCompanyId)
                .orElseThrow(() -> new IllegalArgumentException("Company not found"));
        
        // For simulation, we assume they just want to connect to a dummy manufacturer ID 2.
        Company target = companyRepository.findById(2L).orElse(requester);

        String pin = String.format("%06d", new Random().nextInt(999999));

        CompanyPartnership cp = CompanyPartnership.builder()
                .requesterCompany(requester)
                .targetCompany(target)
                .status("PENDING")
                .pinCode(pin)
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusDays(1))
                .build();

        cp = partnershipRepository.save(cp);
        return mapToDTO(cp);
    }

    @Transactional
    public HandshakeDTO verifyHandshake(String pinCode) {
        CompanyPartnership cp = partnershipRepository.findByPinCodeAndStatus(pinCode, "PENDING")
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired PIN code"));
        
        cp.setStatus("APPROVED");
        cp = partnershipRepository.save(cp);
        return mapToDTO(cp);
    }

    @Transactional(readOnly = true)
    public List<HandshakeDTO> getHandshakes(Long companyId) {
        return partnershipRepository.findByRequesterCompanyIdOrTargetCompanyId(companyId, companyId)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    private HandshakeDTO mapToDTO(CompanyPartnership cp) {
        return HandshakeDTO.builder()
                .id(cp.getId())
                .requesterCompanyName(cp.getRequesterCompany() != null ? cp.getRequesterCompany().getName() : "Unknown")
                .targetCompanyName(cp.getTargetCompany() != null ? cp.getTargetCompany().getName() : "Unknown")
                .status(cp.getStatus())
                .pinCode(cp.getPinCode())
                .createdAt(cp.getCreatedAt())
                .build();
    }
}
