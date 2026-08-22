package com.minibig.karatflow.backend.repository;

import com.minibig.karatflow.backend.domain.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
}
