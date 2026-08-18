package com.minibig.karatflow.backend.web;

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
