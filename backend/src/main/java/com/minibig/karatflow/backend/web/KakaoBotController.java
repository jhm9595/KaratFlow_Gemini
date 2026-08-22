package com.minibig.karatflow.backend.web;

import com.minibig.karatflow.backend.service.KakaoBotService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/kakao/webhook")
@RequiredArgsConstructor
@CrossOrigin(originPatterns = "*") // 카카오 서버에서 접근 가능하도록
public class KakaoBotController {

    private final KakaoBotService kakaoBotService;

    @PostMapping("/order-status")
    public ResponseEntity<Map<String, Object>> getOrderStatus(@RequestBody Map<String, Object> payload) {
        Map<String, Object> response = kakaoBotService.handleOrderStatusRequest(payload);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/cancel-preview")
    public ResponseEntity<Map<String, Object>> getCancelPreview(@RequestBody Map<String, Object> payload) {
        try {
            Map<String, Object> response = kakaoBotService.handleCancelPreviewRequest(payload);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            java.io.StringWriter sw = new java.io.StringWriter();
            e.printStackTrace(new java.io.PrintWriter(sw));
            return ResponseEntity.status(500).body(Map.of("error", String.valueOf(e.getMessage()), "stacktrace", sw.toString()));
        }
    }
}
