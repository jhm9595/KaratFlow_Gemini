package com.minibig.karatflow.backend.web;

import com.minibig.karatflow.backend.domain.EventNotification;
import com.minibig.karatflow.backend.repository.EventNotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class EventNotificationController {

    private final EventNotificationRepository eventNotificationRepository;

    @GetMapping
    public ResponseEntity<List<EventNotification>> getNotifications() {
        return ResponseEntity.ok(eventNotificationRepository.findTop50ByOrderByCreatedAtDesc());
    }

    @PostMapping("/{id}/read")
    @Transactional
    public ResponseEntity<EventNotification> markAsRead(@PathVariable Long id) {
        return eventNotificationRepository.findById(id).map(notif -> {
            notif.setIsRead(true);
            EventNotification saved = eventNotificationRepository.save(notif);
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/read-all")
    @Transactional
    public ResponseEntity<Map<String, Object>> markAllAsRead() {
        List<EventNotification> all = eventNotificationRepository.findAll();
        for (EventNotification n : all) {
            n.setIsRead(true);
        }
        eventNotificationRepository.saveAll(all);
        return ResponseEntity.ok(Map.of("status", "success", "count", all.size()));
    }
}
