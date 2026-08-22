package com.minibig.karatflow.backend.web;

import com.minibig.karatflow.backend.dto.HandshakeDTO;
import com.minibig.karatflow.backend.service.HandshakeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/handshake")
@RequiredArgsConstructor
public class HandshakeController {

    private final HandshakeService handshakeService;

    // Use dummy companyId=1 for simulation
    private final Long MY_COMPANY_ID = 1L;

    @GetMapping
    public ResponseEntity<List<HandshakeDTO>> getHandshakes() {
        return ResponseEntity.ok(handshakeService.getHandshakes(MY_COMPANY_ID));
    }

    @PostMapping("/request")
    public ResponseEntity<HandshakeDTO> requestHandshake() {
        return ResponseEntity.ok(handshakeService.requestHandshake(MY_COMPANY_ID));
    }

    @PostMapping("/verify")
    public ResponseEntity<HandshakeDTO> verifyHandshake(@RequestBody Map<String, String> payload) {
        String pinCode = payload.get("pinCode");
        return ResponseEntity.ok(handshakeService.verifyHandshake(pinCode));
    }
}
