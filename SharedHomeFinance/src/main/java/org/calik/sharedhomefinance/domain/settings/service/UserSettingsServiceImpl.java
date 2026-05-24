package org.calik.sharedhomefinance.domain.settings.service;

import lombok.RequiredArgsConstructor;
import org.calik.sharedhomefinance.common.exception.ResourceNotFoundException;
import org.calik.sharedhomefinance.domain.settings.dto.UpdateUserSettingsRequest;
import org.calik.sharedhomefinance.domain.settings.dto.UserSettingsResponse;
import org.calik.sharedhomefinance.domain.settings.entity.Language;
import org.calik.sharedhomefinance.domain.settings.entity.Theme;
import org.calik.sharedhomefinance.domain.settings.entity.UserSettings;
import org.calik.sharedhomefinance.domain.settings.repository.UserSettingsRepository;
import org.calik.sharedhomefinance.domain.user.entity.User;
import org.calik.sharedhomefinance.domain.user.service.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserSettingsServiceImpl implements UserSettingsService {

    private final UserSettingsRepository userSettingsRepository;
    private final UserService userService;

    @Override
    @Transactional(readOnly = true)
    public UserSettingsResponse getSettings(String firebaseUid) {
        User user = userService.getByFirebaseUid(firebaseUid);
        UserSettings settings = findOrCreate(user);
        return UserSettingsResponse.from(settings);
    }

    @Override
    @Transactional
    public UserSettingsResponse updateSettings(String firebaseUid, UpdateUserSettingsRequest request) {
        User user = userService.getByFirebaseUid(firebaseUid);
        UserSettings settings = findOrCreate(user);

        settings.setLanguage(request.language());
        settings.setTheme(request.theme());
        settings.setNotificationEnabled(request.notificationEnabled());

        return UserSettingsResponse.from(userSettingsRepository.save(settings));
    }

    @Override
    @Transactional
    public void createDefaultSettings(User user) {
        if (userSettingsRepository.findByUserId(user.getId()).isPresent()) {
            return;
        }

        UserSettings defaults = UserSettings.builder()
                .user(user)
                .language(Language.TR)
                .theme(Theme.LIGHT)
                .notificationEnabled(true)
                .build();

        userSettingsRepository.save(defaults);
    }

    // ── private helpers ──────────────────────────────────────────────────────

    /**
     * Ayarlar yoksa (örn. eski kayıtlar) varsayılan oluşturur ve döner.
     */
    private UserSettings findOrCreate(User user) {
        return userSettingsRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    UserSettings defaults = UserSettings.builder()
                            .user(user)
                            .language(Language.TR)
                            .theme(Theme.LIGHT)
                            .notificationEnabled(true)
                            .build();
                    return userSettingsRepository.save(defaults);
                });
    }
}