import os

base_path = 'backend/src/main/java/com/minibig/karatflow/backend'
config_path = os.path.join(base_path, 'config')
web_path = os.path.join(base_path, 'web')

os.makedirs(config_path, exist_ok=True)
os.makedirs(web_path, exist_ok=True)

files = {
    os.path.join(config_path, 'WebConfig.java'): '''package com.minibig.karatflow.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns("http://localhost:5173", "http://127.0.0.1:5173")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
''',
    os.path.join(web_path, 'OrderController.java'): '''package com.minibig.karatflow.backend.web;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getActiveOrders() {
        // Dummy data for now, eventually will pull from OrderService
        List<Map<String, Object>> mockOrders = List.of(
            Map.of("id", 1, "design", "R-101", "stage", "CAD", "isHold", false, "date", "2026-08-17"),
            Map.of("id", 2, "design", "N-202", "stage", "PLATING", "isHold", true, "date", "2026-08-16"),
            Map.of("id", 3, "design", "E-303", "stage", "INSPECTION", "isHold", false, "date", "2026-08-15")
        );
        return ResponseEntity.ok(mockOrders);
    }

    @PostMapping("/{workOrderId}/hold")
    public ResponseEntity<Map<String, String>> putOrderOnHold(@PathVariable Long workOrderId) {
        Map<String, String> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "WorkOrder " + workOrderId + " placed on HOLD.");
        return ResponseEntity.ok(response);
    }
}
'''
}

for path, content in files.items():
    with open(path, 'w') as f:
        f.write(content)

print("WebConfig and Controllers created.")
