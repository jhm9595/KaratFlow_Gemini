package com.minibig.karatflow.backend.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String oauthProviderId; // e.g., "google_12345" or "kakao_67890"

    private String email;
    private String username;
    private String profileImageUrl;
    
    private String role; // "ROLE_USER", "ROLE_ADMIN", "ROLE_VENDOR"
}
