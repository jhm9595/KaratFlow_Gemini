package com.minibig.karatflow.backend.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class HandshakeDTO {
    private Long id;
    private String requesterCompanyName;
    private String targetCompanyName;
    private String status;
    private String pinCode;
    private LocalDateTime createdAt;
}
