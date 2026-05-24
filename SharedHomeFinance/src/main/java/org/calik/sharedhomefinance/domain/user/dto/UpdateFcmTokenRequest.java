package org.calik.sharedhomefinance.domain.user.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateFcmTokenRequest(

        @NotBlank(message = "FCM token boş olamaz.")
        String fcmToken
) {}
