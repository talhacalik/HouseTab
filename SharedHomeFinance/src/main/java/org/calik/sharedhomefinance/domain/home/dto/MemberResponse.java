package org.calik.sharedhomefinance.domain.home.dto;

import org.calik.sharedhomefinance.domain.home.entity.HomeMembership;
import org.calik.sharedhomefinance.domain.home.entity.HomeRole;

import java.time.LocalDateTime;

public record MemberResponse(
        Long userId,
        String name,
        String email,
        String profilePhotoUrl,
        String avatarEmoji,
        String avatarColor,
        HomeRole role,
        LocalDateTime joinedAt
) {
    public static MemberResponse from(HomeMembership membership) {
        return new MemberResponse(
                membership.getUser().getId(),
                membership.getUser().getName(),
                membership.getUser().getEmail(),
                membership.getUser().getProfilePhotoUrl(),
                membership.getUser().getAvatarEmoji(),
                membership.getUser().getAvatarColor(),
                membership.getRole(),
                membership.getJoinedAt()
        );
    }
}