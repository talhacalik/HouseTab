package org.calik.sharedhomefinance.domain.settings.dto;

import org.calik.sharedhomefinance.domain.settings.entity.Language;
import org.calik.sharedhomefinance.domain.settings.entity.Theme;
import org.calik.sharedhomefinance.domain.settings.entity.UserSettings;

import java.time.LocalDateTime;

public record UserSettingsResponse(
        Long userId,
        Language language,
        Theme theme,
        boolean notificationEnabled,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static UserSettingsResponse from(UserSettings settings) {
        return new UserSettingsResponse(
                settings.getUserId(),
                settings.getLanguage(),
                settings.getTheme(),
                settings.isNotificationEnabled(),
                settings.getCreatedAt(),
                settings.getUpdatedAt()
        );
    }
}
