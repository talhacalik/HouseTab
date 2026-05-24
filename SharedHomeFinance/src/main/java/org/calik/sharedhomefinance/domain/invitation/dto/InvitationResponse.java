package org.calik.sharedhomefinance.domain.invitation.dto;

import org.calik.sharedhomefinance.domain.invitation.entity.Invitation;
import org.calik.sharedhomefinance.domain.invitation.entity.InvitationStatus;

import java.time.LocalDateTime;

public record InvitationResponse(
        Long id,
        String inviteCode,
        Long homeId,
        String homeName,
        String invitedEmail,
        String invitedByName,
        InvitationStatus status,
        LocalDateTime expiresAt,
        LocalDateTime createdAt
) {
    public static InvitationResponse from(Invitation invitation) {
        return new InvitationResponse(
                invitation.getId(),
                invitation.getInviteCode(),
                invitation.getHome().getId(),
                invitation.getHome().getName(),
                invitation.getInvitedEmail(),
                invitation.getInvitedBy().getName(),
                invitation.getStatus(),
                invitation.getExpiresAt(),
                invitation.getCreatedAt()
        );
    }
}