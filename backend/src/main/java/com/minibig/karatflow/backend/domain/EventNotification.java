package com.minibig.karatflow.backend.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "event_notifications")
@Getter @Setter
@NoArgsConstructor
public class EventNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long orderId;
    private String orderNo;

    @Column(nullable = false, length = 500)
    private String message;

    private String stageName;

    @Column(nullable = false)
    private Boolean isRead = false;

    private LocalDateTime createdAt = LocalDateTime.now();

    public EventNotification(Long orderId, String orderNo, String message, String stageName) {
        this.orderId = orderId;
        this.orderNo = orderNo;
        this.message = message;
        this.stageName = stageName;
        this.isRead = false;
        this.createdAt = LocalDateTime.now();
    }
}
