package com.minibig.karatflow.backend.repository;

import com.minibig.karatflow.backend.domain.SubcontractTask;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SubcontractTaskRepository extends JpaRepository<SubcontractTask, Long> {
    List<SubcontractTask> findByOrderId(Long orderId);
}
