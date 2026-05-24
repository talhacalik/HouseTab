package org.calik.sharedhomefinance.domain.user.service;

import org.calik.sharedhomefinance.domain.user.dto.AvatarUpdateRequest;
import org.calik.sharedhomefinance.domain.user.dto.RegisterRequest;
import org.calik.sharedhomefinance.domain.user.dto.UpdateProfileRequest;
import org.calik.sharedhomefinance.domain.user.dto.UserResponse;
import org.calik.sharedhomefinance.domain.user.entity.User;

import java.util.Optional;

public interface UserService {

    /**
     * Firebase token doğrulandıktan sonra çağrılır.
     * Kullanıcı yoksa oluşturur, varsa mevcut kaydı döner.
     */
    UserResponse registerOrLogin(String firebaseUid, RegisterRequest request);

    UserResponse getMyProfile(String firebaseUid);

    UserResponse updateProfile(String firebaseUid, UpdateProfileRequest request);

    UserResponse updateAvatar(String firebaseUid, AvatarUpdateRequest request);

    /**
     * Diğer domain'lerin iç kullanımı için — entity döner.
     */
    User getByFirebaseUid(String firebaseUid);

    User getById(Long userId);

    /** Davet akışında email ile kullanıcı sorgulamak için. */
    Optional<User> findByEmail(String email);

    /** FCM token güncelle — push bildirim için. */
    void updateFcmToken(String firebaseUid, String fcmToken);
}