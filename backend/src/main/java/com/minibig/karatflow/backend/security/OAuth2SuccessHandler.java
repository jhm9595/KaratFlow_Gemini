package com.minibig.karatflow.backend.security;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider;

    @Value("${app.frontend-url:http://localhost:5555}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        String subject = authentication.getName();
        if (authentication.getPrincipal() instanceof org.springframework.security.oauth2.core.user.OAuth2User oauthUser) {
            if (oauthUser.getAttributes().containsKey("kakao_account") || oauthUser.getAttributes().containsKey("id")) {
                subject = "kakao_" + oauthUser.getAttributes().get("id");
            } else if (oauthUser.getAttributes().containsKey("sub")) {
                subject = "google_" + oauthUser.getAttributes().get("sub");
            }
        }
        String token = jwtTokenProvider.generateToken(subject, authentication.getAuthorities());
        // Redirect to frontend with token
        String redirectUrl = frontendUrl.replaceAll("/+$", "") + "/oauth2/redirect?token=" + token;
        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}
