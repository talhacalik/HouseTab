package org.calik.sharedhomefinance.domain.notification.controller;

import lombok.RequiredArgsConstructor;
import org.calik.sharedhomefinance.common.exception.UnauthorizedException;
import org.calik.sharedhomefinance.common.response.ApiResponse;
import org.calik.sharedhomefinance.domain.notification.dto.NotificationResponse;
import org.calik.sharedhomefinance.domain.notification.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * GET /api/notifications
     * Okunmamışlar önce, sonra tarihe göre azalan sırada listeler.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getMyNotifications(
            Authentication authentication
    ) {
        List<NotificationResponse> notifications = notificationService.getMyNotifications(
                extractUid(authentication));
        return ResponseEntity.ok(ApiResponse.ok(notifications));
    }

    /**
     * PUT /api/notifications/{id}/read
     * Tek bir bildirimi okundu olarak işaretler.
     */
    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            Authentication authentication,
            @PathVariable Long id
    ) {
        notificationService.markAsRead(extractUid(authentication), id);
        return ResponseEntity.ok(ApiResponse.ok("Bildirim okundu olarak işaretlendi.", null));
    }

    /**
     * PUT /api/notifications/read-all
     * Tüm bildirimleri okundu olarak işaretler.
     */
    @PutMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(Authentication authentication) {
        notificationService.markAllAsRead(extractUid(authentication));
        return ResponseEntity.ok(ApiResponse.ok("Tüm bildirimler okundu olarak işaretlendi.", null));
    }

    /**
     * DELETE /api/notifications/{id}
     * Bildirimi siler.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteNotification(
            Authentication authentication,
            @PathVariable Long id
    ) {
        notificationService.deleteNotification(extractUid(authentication), id);
        return ResponseEntity.ok(ApiResponse.ok("Bildirim silindi.", null));
    }

    private String extractUid(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new UnauthorizedException();
        }
        return authentication.getPrincipal().toString();
    }
}
