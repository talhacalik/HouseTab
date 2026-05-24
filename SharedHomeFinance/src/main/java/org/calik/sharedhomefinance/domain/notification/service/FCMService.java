package org.calik.sharedhomefinance.domain.notification.service;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.Message;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class FCMService {

    private static final Logger log = LoggerFactory.getLogger(FCMService.class);

    /**
     * Tek bir cihaza push bildirimi gönderir.
     * FCM token boşsa sessizce atlar (sadece DB kaydı yeterli).
     */
    public void sendPushNotification(String fcmToken, String title, String body) {
        if (!StringUtils.hasText(fcmToken)) {
            return;
        }

        Message message = Message.builder()
                .setToken(fcmToken)
                .setNotification(com.google.firebase.messaging.Notification.builder()
                        .setTitle(title)
                        .setBody(body)
                        .build())
                .build();

        try {
            String messageId = FirebaseMessaging.getInstance().send(message);
            log.debug("FCM bildirimi gönderildi: {}", messageId);
        } catch (FirebaseMessagingException ex) {
            log.warn("FCM bildirimi gönderilemedi (token: {}...): {}",
                    fcmToken.length() > 10 ? fcmToken.substring(0, 10) : fcmToken,
                    ex.getMessage());
        }
    }
}
