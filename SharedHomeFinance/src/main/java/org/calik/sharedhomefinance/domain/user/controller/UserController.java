package org.calik.sharedhomefinance.domain.user.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.calik.sharedhomefinance.common.exception.UnauthorizedException;
import org.calik.sharedhomefinance.common.response.ApiResponse;
import org.calik.sharedhomefinance.domain.user.dto.AvatarUpdateRequest;
import org.calik.sharedhomefinance.domain.user.dto.RegisterRequest;
import org.calik.sharedhomefinance.domain.user.dto.UpdateFcmTokenRequest;
import org.calik.sharedhomefinance.domain.user.dto.UpdateProfileRequest;
import org.calik.sharedhomefinance.domain.user.dto.UserResponse;
import org.calik.sharedhomefinance.domain.user.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * POST /api/users/register
     * Mobil uygulama Firebase login sonrası bu endpoint'i çağırır.
     * Kullanıcı yoksa oluşturur, varsa mevcut profili döner.
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserResponse>> register(
            Authentication authentication,
            @Valid @RequestBody RegisterRequest request
    ) {
        String firebaseUid = extractUid(authentication);
        UserResponse response = userService.registerOrLogin(firebaseUid, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Kayıt başarılı.", response));
    }

    /**
     * GET /api/users/me
     * Token'daki uid ile kendi profilini getirir.
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getMyProfile(Authentication authentication) {
        String firebaseUid = extractUid(authentication);
        UserResponse response = userService.getMyProfile(firebaseUid);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /**
     * PUT /api/users/me
     * İsim ve profil fotoğrafı güncellemesi.
     */
    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
            Authentication authentication,
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        String firebaseUid = extractUid(authentication);
        UserResponse response = userService.updateProfile(firebaseUid, request);
        return ResponseEntity.ok(ApiResponse.ok("Profil güncellendi.", response));
    }

    /**
     * PUT /api/users/me/avatar
     * Emoji ve renk bazlı avatar günceller.
     */
    @PutMapping("/me/avatar")
    public ResponseEntity<ApiResponse<UserResponse>> updateAvatar(
            Authentication authentication,
            @RequestBody AvatarUpdateRequest request
    ) {
        UserResponse response = userService.updateAvatar(
                extractUid(authentication), request);
        return ResponseEntity.ok(ApiResponse.ok("Avatar güncellendi.", response));
    }

    /**
     * PUT /api/users/me/fcm-token
     * Mobil uygulama FCM token'ını sunucuya kaydeder.
     * Uygulama açıldığında veya token yenilendiğinde çağrılır.
     */
    @PutMapping("/me/fcm-token")
    public ResponseEntity<ApiResponse<Void>> updateFcmToken(
            Authentication authentication,
            @Valid @RequestBody UpdateFcmTokenRequest request
    ) {
        userService.updateFcmToken(extractUid(authentication), request.fcmToken());
        return ResponseEntity.ok(ApiResponse.ok("FCM token güncellendi.", null));
    }

    private String extractUid(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new UnauthorizedException();
        }
        return authentication.getPrincipal().toString();
    }
}