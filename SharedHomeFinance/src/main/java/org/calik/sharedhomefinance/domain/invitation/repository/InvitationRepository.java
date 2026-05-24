package org.calik.sharedhomefinance.domain.invitation.repository;

import org.calik.sharedhomefinance.domain.invitation.entity.Invitation;
import org.calik.sharedhomefinance.domain.invitation.entity.InvitationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface InvitationRepository extends JpaRepository<Invitation, Long> {

    List<Invitation> findAllByHomeIdAndStatus(Long homeId, InvitationStatus status);

    List<Invitation> findAllByInvitedEmailAndStatus(String email, InvitationStatus status);

    Optional<Invitation> findByIdAndInvitedEmail(Long id, String email);

    boolean existsByHomeIdAndInvitedEmailAndStatus(Long homeId, String email, InvitationStatus status);

    Optional<Invitation> findByInviteCodeAndStatus(String inviteCode, InvitationStatus status);

    Optional<Invitation> findFirstByHomeIdAndInviteCodeIsNotNullAndStatusOrderByCreatedAtDesc(
            Long homeId, InvitationStatus status);

    @Modifying
    @Query("""
            UPDATE Invitation i SET i.status = 'EXPIRED'
            WHERE i.status = 'PENDING'
            AND i.expiresAt < :now
            """)
    int expireOldInvitations(@Param("now") LocalDateTime now);
}