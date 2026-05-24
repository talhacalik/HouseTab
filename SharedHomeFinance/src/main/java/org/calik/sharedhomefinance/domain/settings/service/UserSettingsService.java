package org.calik.sharedhomefinance.domain.settings.service;

import org.calik.sharedhomefinance.domain.settings.dto.UpdateUserSettingsRequest;
import org.calik.sharedhomefinance.domain.settings.dto.UserSettingsResponse;
import org.calik.sharedhomefinance.domain.user.entity.User;

public interface UserSettingsService {

    UserSettingsResponse getSettings(String firebaseUid);

    UserSettingsResponse updateSettings(String firebaseUid, UpdateUserSettingsRequest request);

    /**
     * Kayıt akışında UserServiceImpl tarafından çağrılır.
     * Varsayılan: TR, LIGHT, notification_enabled=true.
     */
    void createDefaultSettings(User user);
}
