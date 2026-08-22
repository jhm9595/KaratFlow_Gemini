package com.minibig.karatflow.backend.web;

import com.minibig.karatflow.backend.service.BusinessVerificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/business")
@RequiredArgsConstructor
public class BusinessVerificationController {

    private final BusinessVerificationService businessVerificationService;

    @PostMapping("/verify")
    public ResponseEntity<Map<String, Object>> verifyBusiness(@RequestBody Map<String, String> payload) {
        String businessNumber = payload.get("businessNumber");
        if (businessNumber == null || businessNumber.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Business number is required"));
        }
        
        Map<String, Object> result = businessVerificationService.verifyBusinessNumber(businessNumber);
        return ResponseEntity.ok(result);
    }
}
