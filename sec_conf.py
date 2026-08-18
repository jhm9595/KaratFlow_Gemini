import os

config_path = 'backend/src/main/java/com/minibig/karatflow/backend/config'
sec_file = os.path.join(config_path, 'SecurityConfig.java')

content = '''package com.minibig.karatflow.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import static org.springframework.security.config.Customizer.withDefaults;

@Configuration
public class SecurityConfig {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(withDefaults())
            .csrf(AbstractHttpConfigurer::disable)
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/**", "/ws-alerts/**").permitAll()
                .anyRequest().authenticated()
            );
        return http.build();
    }
}
'''
with open(sec_file, 'w') as f:
    f.write(content)

print("SecurityConfig created.")
