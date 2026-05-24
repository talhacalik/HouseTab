package org.calik.sharedhomefinance.domain.notification.service;

import org.calik.sharedhomefinance.domain.notification.dto.NotificationResponse;
import org.calik.sharedhomefinance.domain.notification.entity.NotificationType;

import java.util.List;

public interface NotificationService {

    List<NotificationResponse> getMyNotifications(String firebaseUid);

    void markAsRead(String firebaseUid, Long notificationId);

    void markAllAsRead(String firebaseUid);

    void deleteNotification(String firebaseUid, Long notificationId);

    /**
     * Tek bir kullanıcıya bildirim gönder.
     * DB'ye kaydeder + FCM token varsa push atar.
     */
    void sendToUser(Long userId, NotificationType type, String title, String body,
                    Long referenceId);

    /**
     * Evdeki tüm üyelere bildirim gönder.
     * excludeUserId → bildirimi tetikleyen kişi hariç tutulur.
     */
    void sendToHomeMembers(Long homeId, Long excludeUserId, NotificationType type,
                           String title, String body, Long referenceId);
}
