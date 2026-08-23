package com.minibig.karatflow.backend.repository;

import com.minibig.karatflow.backend.domain.WorkOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface WorkOrderRepository extends JpaRepository<WorkOrder, Long> {
    
    // Custom query to find the work_order by order_id since they are related via order_items
    @Query(value = "SELECT w.* FROM work_orders w " +
                   "JOIN order_items oi ON w.order_item_id = oi.order_item_id " +
                   "WHERE oi.order_id = :orderId LIMIT 1", nativeQuery = true)
    Optional<WorkOrder> findByOrderId(@Param("orderId") Long orderId);
    @Query(value = "SELECT w.* FROM work_orders w " +
                   "JOIN order_items oi ON w.order_item_id = oi.order_item_id " +
                   "WHERE oi.order_id = :orderId", nativeQuery = true)
    java.util.List<WorkOrder> findAllByOrderId(@Param("orderId") Long orderId);
}
