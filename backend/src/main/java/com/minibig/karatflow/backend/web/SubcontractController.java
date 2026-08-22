package com.minibig.karatflow.backend.web;

import com.minibig.karatflow.backend.dto.SubcontractTaskDTO;
import com.minibig.karatflow.backend.service.SubcontractService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders/{orderId}/subcontracts")
@RequiredArgsConstructor
public class SubcontractController {

    private final SubcontractService subcontractService;

    @GetMapping
    public ResponseEntity<List<SubcontractTaskDTO>> getSubcontracts(@PathVariable Long orderId) {
        return ResponseEntity.ok(subcontractService.getSubcontractsByOrderId(orderId));
    }

    @PostMapping("/dispatch")
    public ResponseEntity<SubcontractTaskDTO> dispatchSubcontract(
            @PathVariable Long orderId,
            @RequestBody SubcontractTaskDTO req) {
        return ResponseEntity.ok(subcontractService.dispatch(orderId, req));
    }

    @PutMapping("/{taskId}/receive")
    public ResponseEntity<SubcontractTaskDTO> receiveSubcontract(
            @PathVariable Long orderId, // not used directly but good for path
            @PathVariable Long taskId,
            @RequestBody SubcontractTaskDTO req) {
        return ResponseEntity.ok(subcontractService.receive(taskId, req.getReceivedWeightG()));
    }
}
