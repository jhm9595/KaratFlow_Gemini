package com.minibig.karatflow.backend.security;

import com.minibig.karatflow.backend.domain.User;
import com.minibig.karatflow.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        String registrationId = userRequest.getClientRegistration().getRegistrationId();

        String providerId = "";
        String name = "";
        String email = "";
        String profileImageUrl = "";

        if ("kakao".equals(registrationId)) {
            providerId = "kakao_" + oAuth2User.getAttributes().get("id");
            Map<String, Object> kakaoAccount = (Map<String, Object>) oAuth2User.getAttributes().get("kakao_account");
            if (kakaoAccount != null) {
                email = (String) kakaoAccount.get("email");
                Map<String, Object> profile = (Map<String, Object>) kakaoAccount.get("profile");
                if (profile != null) {
                    name = (String) profile.get("nickname");
                    profileImageUrl = (String) profile.get("profile_image_url");
                }
            }
        } else if ("google".equals(registrationId)) {
            providerId = "google_" + oAuth2User.getAttributes().get("sub");
            name = (String) oAuth2User.getAttributes().get("name");
            email = (String) oAuth2User.getAttributes().get("email");
            profileImageUrl = (String) oAuth2User.getAttributes().get("picture");
        }

        final String finalProviderId = providerId;
        final String finalName = name;
        final String finalEmail = email;
        final String finalProfileImageUrl = profileImageUrl;

        User user = userRepository.findByOauthProviderId(providerId)
                .map(existingUser -> {
                    existingUser.setUsername(finalName);
                    existingUser.setProfileImageUrl(finalProfileImageUrl);
                    return userRepository.save(existingUser);
                })
                .orElseGet(() -> userRepository.save(User.builder()
                        .oauthProviderId(finalProviderId)
                        .username(finalName)
                        .email(finalEmail)
                        .profileImageUrl(finalProfileImageUrl)
                        .role("ROLE_USER")
                        .build()));

        return new DefaultOAuth2User(
                Collections.singletonList(new SimpleGrantedAuthority(user.getRole())),
                oAuth2User.getAttributes(),
                "kakao".equals(registrationId) ? "id" : "sub"
        );
    }
}
