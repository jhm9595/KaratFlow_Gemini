package com.minibig.karatflow.backend.web;

import com.minibig.karatflow.backend.domain.EventNotification;
import com.minibig.karatflow.backend.repository.EventNotificationRepository;
import com.minibig.karatflow.backend.security.SecurityUtils;
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
    private final SecurityUtils securityUtils;

    @GetMapping
    public ResponseEntity<List<EventNotification>> getNotifications() {
        Long currentUserId = securityUtils.getCurrentUserId();
        List<EventNotification> list = eventNotificationRepository.findAll().stream()
                .filter(n -> n.getUserId() != null && currentUserId != null && n.getUserId().equals(currentUserId))
                .sorted((a, b) -> {
                    if (a.getCreatedAt() == null || b.getCreatedAt() == null) return 0;
                    return b.getCreatedAt().compareTo(a.getCreatedAt());
                })
                .limit(50)
                .toList();
        return ResponseEntity.ok(list);
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
        Long currentUserId = securityUtils.getCurrentUserId();
        List<EventNotification> all = eventNotificationRepository.findAll().stream()
                .filter(n -> n.getUserId() != null && currentUserId != null && n.getUserId().equals(currentUserId))
                .toList();
        for (EventNotification n : all) {
            n.setIsRead(true);
        }
        eventNotificationRepository.saveAll(all);
        return ResponseEntity.ok(Map.of("status", "success", "count", all.size()));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> deleteNotification(@PathVariable Long id) {
        eventNotificationRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
