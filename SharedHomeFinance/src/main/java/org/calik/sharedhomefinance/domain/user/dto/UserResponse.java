package org.calik.sharedhomefinance.domain.user.dto;

import org.calik.sharedhomefinance.domain.user.entity.User;

import java.time.LocalDateTime;

public record UserResponse(
        Long id,
        String name,
        String email,
        String profilePhotoUrl,
        String avatarEmoji,
        String avatarColor,
        LocalDateTime createdAt
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getProfilePhotoUrl(),
                user.getAvatarEmoji(),
                user.getAvatarColor(),
                user.getCreatedAt()
        );
    }
}