package org.calik.sharedhomefinance.domain.user.service;

import org.calik.sharedhomefinance.common.exception.BusinessException;
import org.calik.sharedhomefinance.common.exception.ResourceNotFoundException;
import org.calik.sharedhomefinance.domain.settings.service.UserSettingsService;
import org.calik.sharedhomefinance.domain.user.dto.AvatarUpdateRequest;
import org.calik.sharedhomefinance.domain.user.dto.RegisterRequest;
import org.calik.sharedhomefinance.domain.user.dto.UpdateProfileRequest;
import org.calik.sharedhomefinance.domain.user.dto.UserResponse;
import org.calik.sharedhomefinance.domain.user.entity.User;
import org.calik.sharedhomefinance.domain.user.repository.UserRepository;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserSettingsService userSettingsService;

    public UserServiceImpl(UserRepository userRepository,
                           @Lazy UserSettingsService userSettingsService) {
        this.userRepository = userRepository;
        this.userSettingsService = userSettingsService;
    }

    @Override
    @Transactional
    public UserResponse registerOrLogin(String firebaseUid, RegisterRequest request) {
        return userRepository.findByFirebaseUid(firebaseUid)
                .map(UserResponse::from)
                .orElseGet(() -> {
                    if (userRepository.existsByEmail(request.email())) {
                        throw new BusinessException(
                                "Bu email adresi zaten kayıtlı.",
                                "EMAIL_ALREADY_EXISTS"
                        );
                    }
                    String name = (request.name() != null && !request.name().isBlank())
                            ? request.name()
                            : request.email().split("@")[0];
                    User newUser = User.builder()
                            .firebaseUid(firebaseUid)
                            .name(name)
                            .email(request.email())
                            .profilePhotoUrl(request.profilePhotoUrl())
                            .build();
                    userRepository.save(newUser);
                    userSettingsService.createDefaultSettings(newUser);
                    return UserResponse.from(newUser);
                });
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getMyProfile(String firebaseUid) {
        return UserResponse.from(getByFirebaseUid(firebaseUid));
    }

    @Override
    @Transactional
    public UserResponse updateProfile(String firebaseUid, UpdateProfileRequest request) {
        User user = getByFirebaseUid(firebaseUid);
        user.setName(request.name());
        user.setProfilePhotoUrl(request.profilePhotoUrl());
        return UserResponse.from(userRepository.save(user));
    }

    @Override
    @Transactional
    public UserResponse updateAvatar(String firebaseUid, AvatarUpdateRequest request) {
        User user = getByFirebaseUid(firebaseUid);
        if (request.avatarEmoji() != null) {
            user.setAvatarEmoji(request.avatarEmoji().isEmpty() ? null : request.avatarEmoji());
        }
        if (request.avatarColor() != null) {
            user.setAvatarColor(request.avatarColor().isEmpty() ? null : request.avatarColor());
        }
        return UserResponse.from(userRepository.save(user));
    }

    @Override
    @Transactional(readOnly = true)
    public User getByFirebaseUid(String firebaseUid) {
        return userRepository.findByFirebaseUid(firebaseUid)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Kullanıcı bulunamadı. firebaseUid=" + firebaseUid
                ));
    }

    @Override
    @Transactional(readOnly = true)
    public User getById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı", userId));
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    @Override
    @Transactional
    public void updateFcmToken(String firebaseUid, String fcmToken) {
        User user = getByFirebaseUid(firebaseUid);
        user.setFcmToken(fcmToken);
        userRepository.save(user);
    }
}