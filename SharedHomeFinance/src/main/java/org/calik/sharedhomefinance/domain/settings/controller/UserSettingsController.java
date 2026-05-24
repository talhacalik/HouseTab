package org.calik.sharedhomefinance.domain.settings.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.calik.sharedhomefinance.common.exception.UnauthorizedException;
import org.calik.sharedhomefinance.common.response.ApiResponse;
import org.calik.sharedhomefinance.domain.settings.dto.UpdateUserSettingsRequest;
import org.calik.sharedhomefinance.domain.settings.dto.UserSettingsResponse;
import org.calik.sharedhomefinance.domain.settings.service.UserSettingsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users/settings")
@RequiredArgsConstructor
public class UserSettingsController {

    private final UserSettingsService userSettingsService;

    /**
     * GET /api/users/settings
     * Kullanıcının uygulama ayarlarını getirir.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<UserSettingsResponse>> getSettings(
            Authentication authentication
    ) {
        UserSettingsResponse response = userSettingsService.getSettings(
                extractUid(authentication));
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /**
     * PUT /api/users/settings
     * Dil, tema ve bildirim tercihlerini günceller.
     */
    @PutMapping
    public ResponseEntity<ApiResponse<UserSettingsResponse>> updateSettings(
            Authentication authentication,
            @Valid @RequestBody UpdateUserSettingsRequest request
    ) {
        UserSettingsResponse response = userSettingsService.updateSettings(
                extractUid(authentication), request);
        return ResponseEntity.ok(ApiResponse.ok("Ayarlar güncellendi.", response));
    }

    private String extractUid(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new UnauthorizedException();
        }
        return authentication.getPrincipal().toString();
    }
}