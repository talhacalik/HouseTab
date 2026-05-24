package org.calik.sharedhomefinance.domain.user.dto;

public record AvatarUpdateRequest(
        String avatarEmoji,
        String avatarColor
) {}
