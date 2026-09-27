package com.minibig.karatflow.backend.repository;

import com.minibig.karatflow.backend.domain.EventNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventNotificationRepository extends JpaRepository<EventNotification, Long> {
    List<EventNotification> findTop50ByOrderByCreatedAtDesc();
}
