package com.minibig.karatflow.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Collections;

@Service
public class BusinessVerificationService {

    @Value("${irs.api.key:mock-key}")
    private String irsApiKey;

    private static final String API_URL = "https://api.odcloud.kr/api/nts-businessman/v1/status?serviceKey=";

    public Map<String, Object> verifyBusinessNumber(String businessNumber) {
        String sanitizedNumber = businessNumber.replaceAll("[^0-9]", "");
        
        // Mock logic for local testing when real API key is not present
        if ("mock-key".equals(irsApiKey) || irsApiKey.isEmpty()) {
            return mockVerification(sanitizedNumber);
        }

        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("b_no", Collections.singletonList(sanitizedNumber));

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(API_URL + irsApiKey, entity, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                List<Map<String, Object>> data = (List<Map<String, Object>>) response.getBody().get("data");
                if (data != null && !data.isEmpty()) {
                    Map<String, Object> result = data.get(0);
                    String bSttCd = (String) result.get("b_stt_cd");
                    
                    Map<String, Object> parsedResult = new HashMap<>();
                    parsedResult.put("businessNumber", sanitizedNumber);
                    parsedResult.put("statusCode", bSttCd); // "01": 계속사업자, "02": 휴업자, "03": 폐업자
                    parsedResult.put("statusName", result.get("b_stt"));
                    parsedResult.put("taxType", result.get("tax_type"));
                    
                    return parsedResult;
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        return mockVerification(sanitizedNumber); // Fallback to mock on error
    }

    private Map<String, Object> mockVerification(String number) {
        Map<String, Object> mockResult = new HashMap<>();
        mockResult.put("businessNumber", number);
        
        // Let's make "1234567890" act as a closed business for testing
        if ("1234567890".equals(number)) {
            mockResult.put("statusCode", "03");
            mockResult.put("statusName", "폐업자");
            mockResult.put("taxType", "부가가치세 면세사업자");
        } else {
            mockResult.put("statusCode", "01");
            mockResult.put("statusName", "계속사업자");
            mockResult.put("taxType", "부가가치세 일반과세자");
        }
        
        mockResult.put("isMock", true);
        return mockResult;
    }
}
