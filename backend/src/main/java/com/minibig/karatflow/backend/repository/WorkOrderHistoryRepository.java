package com.minibig.karatflow.backend.repository;

import com.minibig.karatflow.backend.domain.WorkOrderHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface WorkOrderHistoryRepository extends JpaRepository<WorkOrderHistory, Long> {
    List<WorkOrderHistory> findByWorkOrderIdOrderByStepOrderAsc(Long workOrderId);
}
