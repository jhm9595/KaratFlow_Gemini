import os

# 1. Update .env file
env_path = 'backend/.env'
if os.path.exists(env_path):
    with open(env_path, 'r', encoding='utf-8') as f:
        content = f.read()
    if 'KRX_API_EXPIRY' not in content:
        with open(env_path, 'a', encoding='utf-8') as f:
            f.write('\nKRX_API_EXPIRY=2027-09-11\n')
else:
    with open(env_path, 'w', encoding='utf-8') as f:
        f.write('KRX_API_EXPIRY=2027-09-11\n')

# 2. Create SystemHealthController.java
controller_code = """package com.minibig.karatflow.backend.web;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/system/health")
@RequiredArgsConstructor
public class SystemHealthController {

    @Value("${krx.api.expiry:2027-09-11}") // Fallback default
    private String krxApiExpiry;

    @GetMapping("/alerts")
    public ResponseEntity<List<Map<String, Object>>> getSystemAlerts() {
        List<Map<String, Object>> alerts = new ArrayList<>();
        
        try {
            LocalDate expiryDate = LocalDate.parse(krxApiExpiry, DateTimeFormatter.ofPattern("yyyy-MM-dd"));
            LocalDate today = LocalDate.now();
            long daysBetween = ChronoUnit.DAYS.between(today, expiryDate);
            
            if (daysBetween <= 30 && daysBetween >= 0) {
                Map<String, Object> alert = new HashMap<>();
                alert.put("severity", "warn");
                alert.put("summary", "API 만료 임박");
                alert.put("detail", "KRX 인증키 유효기간이 " + daysBetween + "일 남았습니다. (만료일: " + krxApiExpiry + ") 갱신이 필요합니다.");
                alerts.add(alert);
            } else if (daysBetween < 0) {
                Map<String, Object> alert = new HashMap<>();
                alert.put("severity", "error");
                alert.put("summary", "API 만료됨");
                alert.put("detail", "KRX 인증키 유효기간이 만료되었습니다. 즉시 갱신해 주세요.");
                alerts.add(alert);
            }
        } catch (Exception e) {
            // 날짜 파싱 오류 무시
        }

        return ResponseEntity.ok(alerts);
    }
}
"""

with open('backend/src/main/java/com/minibig/karatflow/backend/web/SystemHealthController.java', 'w', encoding='utf-8') as f:
    f.write(controller_code)

print("Backend Controller created and .env updated.")
