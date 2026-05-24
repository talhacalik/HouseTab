package org.calik.sharedhomefinance.domain.invitation.service;

import org.calik.sharedhomefinance.domain.invitation.dto.CreateInvitationRequest;
import org.calik.sharedhomefinance.domain.invitation.dto.InvitationResponse;

import java.util.List;

public interface InvitationService {

    /** OWNER bir ev için davet oluşturur. */
    InvitationResponse createInvitation(String firebaseUid, Long homeId, CreateInvitationRequest request);

    /** OWNER, bir eve ait bekleyen davetleri listeler. */
    List<InvitationResponse> getPendingInvitations(String firebaseUid, Long homeId);

    /** Kullanıcı kendi email'ine gelen bekleyen davetleri listeler. */
    List<InvitationResponse> getMyPendingInvitations(String firebaseUid);

    /** Kullanıcı daveti kabul eder → üyelik oluşturulur. */
    void acceptInvitation(String firebaseUid, Long invitationId);

    /** Kullanıcı daveti reddeder. */
    void rejectInvitation(String firebaseUid, Long invitationId);

    /** OWNER bekleyen bir daveti iptal eder. */
    void cancelInvitation(String firebaseUid, Long homeId, Long invitationId);

    /** OWNER, eve katılım için 6 karakterlik davet kodu üretir. */
    InvitationResponse generateInviteCode(String firebaseUid, Long homeId);

    /** Kullanıcı davet koduyla eve katılır. */
    void joinByInviteCode(String firebaseUid, String inviteCode);

    /** OWNER, evin aktif davet kodunu getirir. */
    InvitationResponse getActiveInviteCode(String firebaseUid, Long homeId);
}