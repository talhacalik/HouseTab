package org.calik.sharedhomefinance.domain.notification.service;

import lombok.RequiredArgsConstructor;
import org.calik.sharedhomefinance.common.exception.ForbiddenException;
import org.calik.sharedhomefinance.common.exception.ResourceNotFoundException;
import org.calik.sharedhomefinance.domain.home.entity.HomeMembership;
import org.calik.sharedhomefinance.domain.home.repository.HomeMembershipRepository;
import org.calik.sharedhomefinance.domain.notification.dto.NotificationResponse;
import org.calik.sharedhomefinance.domain.notification.entity.Notification;
import org.calik.sharedhomefinance.domain.notification.entity.NotificationType;
import org.calik.sharedhomefinance.domain.notification.repository.NotificationRepository;
import org.calik.sharedhomefinance.domain.user.entity.User;
import org.calik.sharedhomefinance.domain.user.service.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final HomeMembershipRepository membershipRepository;
    private final UserService userService;
    private final FCMService fcmService;

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> getMyNotifications(String firebaseUid) {
        User user = userService.getByFirebaseUid(firebaseUid);
        return notificationRepository.findAllByUserId(user.getId())
                .stream()
                .map(NotificationResponse::from)
                .toList();
    }

    @Override
    @Transactional
    public void markAsRead(String firebaseUid, Long notificationId) {
        User user = userService.getByFirebaseUid(firebaseUid);
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Bildirim", notificationId));

        if (!notification.getUser().getId().equals(user.getId())) {
            throw new ForbiddenException("Bu bildirime erişim yetkiniz yok.");
        }

        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Override
    @Transactional
    public void markAllAsRead(String firebaseUid) {
        User user = userService.getByFirebaseUid(firebaseUid);
        notificationRepository.markAllAsRead(user.getId());
    }

    @Override
    @Transactional
    public void deleteNotification(String firebaseUid, Long notificationId) {
        User user = userService.getByFirebaseUid(firebaseUid);
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Bildirim", notificationId));

        if (!notification.getUser().getId().equals(user.getId())) {
            throw new ForbiddenException("Bu bildirime erişim yetkiniz yok.");
        }

        notificationRepository.delete(notification);
    }

    @Override
    @Transactional
    public void sendToUser(Long userId, NotificationType type, String title, String body,
                           Long referenceId) {
        User user = userService.getById(userId);

        Notification notification = Notification.builder()
                .user(user)
                .type(type)
                .title(title)
                .body(body)
                .referenceId(referenceId)
                .build();

        notificationRepository.save(notification);
        fcmService.sendPushNotification(user.getFcmToken(), title, body);
    }

    @Override
    @Transactional
    public void sendToHomeMembers(Long homeId, Long excludeUserId, NotificationType type,
                                  String title, String body, Long referenceId) {
        List<HomeMembership> memberships = membershipRepository.findAllByHomeId(homeId);

        memberships.stream()
                .map(HomeMembership::getUser)
                .filter(u -> !u.getId().equals(excludeUserId))
                .forEach(u -> sendToUser(u.getId(), type, title, body, referenceId));
    }
}
