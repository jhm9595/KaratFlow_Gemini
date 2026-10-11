package com.minibig.karatflow.backend.web;

import com.minibig.karatflow.backend.domain.User;
import com.minibig.karatflow.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    @GetMapping("/me")
    public ResponseEntity<?> getMyProfile(@RequestParam(value = "oauthProviderId", required = false) String oauthProviderId) {
        Optional<User> userOpt = Optional.empty();
        
        if (oauthProviderId != null && !oauthProviderId.isBlank()) {
            userOpt = userRepository.findByOauthProviderId(oauthProviderId);
        }
        
        if (userOpt.isEmpty()) {
            // Return first user or default profile
            userOpt = userRepository.findAll().stream().findFirst();
        }

        if (userOpt.isEmpty()) {
            Map<String, Object> fallback = new HashMap<>();
            fallback.put("id", 1L);
            fallback.put("username", "KaratFlow 회원");
            fallback.put("email", "user@karatflow.com");
            fallback.put("oauthProviderId", "kakao_demo");
            fallback.put("googleLinked", false);
            fallback.put("kakaoLinked", true);
            return ResponseEntity.ok(fallback);
        }

        User user = userOpt.get();
        Map<String, Object> res = new HashMap<>();
        res.put("id", user.getId());
        res.put("username", user.getUsername());
        res.put("email", user.getEmail());
        res.put("profileImageUrl", user.getProfileImageUrl());
        res.put("role", user.getRole());
        res.put("oauthProviderId", user.getOauthProviderId());
        res.put("kakaoBotUserKey", user.getKakaoBotUserKey());
        
        boolean googleLinked = (user.getOauthProviderId() != null && user.getOauthProviderId().startsWith("google_")) || user.getGoogleProviderId() != null;
        boolean kakaoLinked = (user.getOauthProviderId() != null && user.getOauthProviderId().startsWith("kakao_")) || user.getKakaoProviderId() != null;
        
        res.put("googleLinked", googleLinked);
        res.put("kakaoLinked", kakaoLinked);
        res.put("googleProviderId", user.getGoogleProviderId());
        res.put("kakaoProviderId", user.getKakaoProviderId());

        return ResponseEntity.ok(res);
    }

    @PostMapping("/me/link-account")
    public ResponseEntity<?> linkAccount(
            @RequestParam("userId") Long userId,
            @RequestParam("provider") String provider,
            @RequestParam("providerId") String providerId) {

        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("User not found");
        }

        User user = userOpt.get();
        if ("google".equalsIgnoreCase(provider)) {
            user.setGoogleProviderId(providerId);
        } else if ("kakao".equalsIgnoreCase(provider)) {
            user.setKakaoProviderId(providerId);
        }

        userRepository.save(user);

        Map<String, Object> res = new HashMap<>();
        res.put("status", "success");
        res.put("message", provider.toUpperCase() + " 계정이 성공적으로 연동되었습니다.");
        return ResponseEntity.ok(res);
    }
}
