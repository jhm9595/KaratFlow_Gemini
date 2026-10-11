package com.minibig.karatflow.backend.service;

import com.minibig.karatflow.backend.domain.Order;
import com.minibig.karatflow.backend.domain.SubcontractTask;
import com.minibig.karatflow.backend.dto.SubcontractTaskDTO;
import com.minibig.karatflow.backend.repository.OrderRepository;
import com.minibig.karatflow.backend.repository.SubcontractTaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SubcontractService {

    private final SubcontractTaskRepository subcontractTaskRepository;
    private final OrderRepository orderRepository;

    @Transactional(readOnly = true)
    public List<SubcontractTaskDTO> getSubcontractsByOrderId(Long orderId) {
        return subcontractTaskRepository.findByOrderId(orderId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public SubcontractTaskDTO dispatch(Long orderId, SubcontractTaskDTO req) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        SubcontractTask task = SubcontractTask.builder()
                .order(order)
                .taskName(req.getTaskName())
                .subcontractorName(req.getSubcontractorName())
                .dispatchedWeightG(req.getDispatchedWeightG() != null ? req.getDispatchedWeightG() : BigDecimal.ZERO)
                .agreedLaborFee(req.getAgreedLaborFee() != null ? req.getAgreedLaborFee() : BigDecimal.ZERO)
                .status("DISPATCHED")
                .dispatchedAt(LocalDateTime.now())
                .build();

        task = subcontractTaskRepository.save(task);
        return mapToDTO(task);
    }

    @Transactional
    public SubcontractTaskDTO receive(Long taskId, BigDecimal receivedWeightG) {
        SubcontractTask task = subcontractTaskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));

        task.setReceivedWeightG(receivedWeightG);
        if (task.getDispatchedWeightG() != null && receivedWeightG != null) {
            task.setLossWeightG(task.getDispatchedWeightG().subtract(receivedWeightG));
        } else {
            task.setLossWeightG(BigDecimal.ZERO);
        }
        task.setStatus("RECEIVED");
        task.setReceivedAt(LocalDateTime.now());

        return mapToDTO(task);
    }

    private SubcontractTaskDTO mapToDTO(SubcontractTask task) {
        return SubcontractTaskDTO.builder()
                .id(task.getId())
                .orderId(task.getOrder().getId())
                .taskName(task.getTaskName())
                .subcontractorName(task.getSubcontractorName())
                .dispatchedWeightG(task.getDispatchedWeightG())
                .receivedWeightG(task.getReceivedWeightG())
                .lossWeightG(task.getLossWeightG())
                .agreedLaborFee(task.getAgreedLaborFee())
                .status(task.getStatus())
                .dispatchedAt(task.getDispatchedAt())
                .receivedAt(task.getReceivedAt())
                .build();
    }
}
