package com.drivesmart.api.controller;

import com.drivesmart.api.dto.NotificationDto;
import com.drivesmart.api.entity.Notification;
import com.drivesmart.api.exception.ApiException;
import com.drivesmart.api.repository.NotificationRepository;
import com.drivesmart.api.security.CurrentUser;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationRepository notificationRepository;

    public NotificationController(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @GetMapping
    public List<NotificationDto> list() {
        return notificationRepository.findTop50ByUserIdOrderByCreatedAtDesc(CurrentUser.require()).stream()
                .map(n -> new NotificationDto(n.getId(), n.getMessage(), n.isRead(), n.getCreatedAt()))
                .toList();
    }

    @PutMapping("/{id}/read")
    public NotificationDto markRead(@PathVariable String id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Notification not found"));
        if (!notification.getUser().getId().equals(CurrentUser.require())) {
            throw ApiException.notFound("Notification not found");
        }
        notification.setRead(true);
        notificationRepository.save(notification);
        return new NotificationDto(notification.getId(), notification.getMessage(), notification.isRead(), notification.getCreatedAt());
    }

    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllRead() {
        String userId = CurrentUser.require();
        List<Notification> unread = notificationRepository.findByUserIdAndReadFalse(userId);
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
        return ResponseEntity.noContent().build();
    }
}
