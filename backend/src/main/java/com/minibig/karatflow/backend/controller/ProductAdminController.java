package com.minibig.karatflow.backend.controller;

import com.minibig.karatflow.backend.domain.Design;
import com.minibig.karatflow.backend.domain.OrderItem;
import com.minibig.karatflow.backend.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductAdminController {

    private final ProductService productService;

    @GetMapping
    
    @PostMapping
    public ResponseEntity<Design> createProduct(@RequestBody Map<String, Object> payload) {
        String brand = (String) payload.get("brand");
        String designCode = (String) payload.get("designCode");
        String name = (String) payload.get("name");
        String imageUrl = (String) payload.get("imageUrl");
        java.math.BigDecimal baseLaborFee = payload.get("baseLaborFee") != null ? new java.math.BigDecimal(payload.get("baseLaborFee").toString()) : null;
        return ResponseEntity.ok(productService.createProduct(brand, designCode, name, baseLaborFee, imageUrl));
    }

    public ResponseEntity<List<Design>> getAllProducts() {
        return ResponseEntity.ok(productService.getAllProducts());
    }

    @GetMapping("/candidates")
    public ResponseEntity<List<OrderItem>> getCandidates() {
        return ResponseEntity.ok(productService.getUnmappedCandidates());
    }

    @PostMapping("/candidates/{orderItemId}/confirm")
    public ResponseEntity<Design> confirmCandidate(@PathVariable Long orderItemId, @RequestBody Map<String, Object> payload) {
        String brand = (String) payload.get("brand");
        String designCode = (String) payload.get("designCode");
        String name = (String) payload.get("name");
        java.math.BigDecimal baseLaborFee = payload.get("baseLaborFee") != null ? new java.math.BigDecimal(payload.get("baseLaborFee").toString()) : null;
        
        return ResponseEntity.ok(productService.confirmProduct(orderItemId, brand, designCode, name, baseLaborFee));
    }

    @PostMapping("/candidates/{orderItemId}/map/{designId}")
    public ResponseEntity<OrderItem> mapCandidate(@PathVariable Long orderItemId, @PathVariable Long designId) {
        return ResponseEntity.ok(productService.mapToExistingProduct(orderItemId, designId));
    }
}
