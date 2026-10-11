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
        
        if ("mock-key".equals(irsApiKey) || irsApiKey == null || irsApiKey.trim().isEmpty()) {
            Map<String, Object> errResult = new HashMap<>();
            errResult.put("businessNumber", sanitizedNumber);
            errResult.put("statusCode", "ERROR");
            errResult.put("statusName", "API 키 미설정");
            errResult.put("taxType", "국세청 사업자 검증 API 키(irs.api.key)가 설정되지 않았습니다.");
            return errResult;
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

        Map<String, Object> failResult = new HashMap<>();
        failResult.put("businessNumber", sanitizedNumber);
        failResult.put("statusCode", "ERROR");
        failResult.put("statusName", "검증 실패");
        failResult.put("taxType", "국세청 API 조회가 실패했습니다. 사업자번호를 확인해 주세요.");
        return failResult;
    }
}
