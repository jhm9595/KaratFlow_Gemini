package com.minibig.karatflow.backend.security;

import com.minibig.karatflow.backend.domain.User;
import com.minibig.karatflow.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
public class SecurityUtils {

    private final UserRepository userRepository;

    public Optional<User> getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            // Default demo fallback user if no auth token is provided
            return userRepository.findAll().stream().findFirst();
        }

        String principal = auth.getName();
        if (principal == null || principal.isBlank()) {
            return userRepository.findAll().stream().findFirst();
        }

        Optional<User> userOpt = userRepository.findByOauthProviderId(principal);
        if (userOpt.isPresent()) return userOpt;

        userOpt = userRepository.findAll().stream()
                .filter(u -> principal.equalsIgnoreCase(u.getEmail()) || principal.equalsIgnoreCase(u.getUsername()))
                .findFirst();
        if (userOpt.isPresent()) return userOpt;

        // Auto-provision user record for new authenticated user
        User newUser = User.builder()
                .oauthProviderId(principal.contains("@") ? "user_" + Math.abs(principal.hashCode()) : principal)
                .email(principal.contains("@") ? principal : principal + "@karatflow.com")
                .username(principal.contains("@") ? principal.split("@")[0] : principal)
                .role("ROLE_USER")
                .build();
        return Optional.of(userRepository.save(newUser));
    }

    public Long getCurrentUserId() {
        return getCurrentUser().map(User::getId).orElse(1L);
    }

    public boolean isDemoSession() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal());
    }
}
