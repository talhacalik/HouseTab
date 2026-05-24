package org.calik.sharedhomefinance.domain.invitation.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.calik.sharedhomefinance.common.exception.UnauthorizedException;
import org.calik.sharedhomefinance.common.response.ApiResponse;
import org.calik.sharedhomefinance.domain.invitation.dto.CreateInvitationRequest;
import org.calik.sharedhomefinance.domain.invitation.dto.InvitationResponse;
import org.calik.sharedhomefinance.domain.invitation.dto.JoinByCodeRequest;
import org.calik.sharedhomefinance.domain.invitation.service.InvitationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class InvitationController {

    private final InvitationService invitationService;

    /**
     * POST /api/homes/{homeId}/invitations
     * OWNER bir ev için email bazlı davet oluşturur.
     */
    @PostMapping("/api/homes/{homeId}/invitations")
    public ResponseEntity<ApiResponse<InvitationResponse>> createInvitation(
            Authentication authentication,
            @PathVariable Long homeId,
            @Valid @RequestBody CreateInvitationRequest request
    ) {
        InvitationResponse response = invitationService.createInvitation(
                extractUid(authentication), homeId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Davet gönderildi.", response));
    }

    /**
     * GET /api/homes/{homeId}/invitations
     * OWNER, bir evin bekleyen davetlerini listeler.
     */
    @GetMapping("/api/homes/{homeId}/invitations")
    public ResponseEntity<ApiResponse<List<InvitationResponse>>> getPendingInvitations(
            Authentication authentication,
            @PathVariable Long homeId
    ) {
        List<InvitationResponse> invitations = invitationService.getPendingInvitations(
                extractUid(authentication), homeId);
        return ResponseEntity.ok(ApiResponse.ok(invitations));
    }

    /**
     * DELETE /api/homes/{homeId}/invitations/{invitationId}
     * OWNER bekleyen bir daveti iptal eder.
     */
    @DeleteMapping("/api/homes/{homeId}/invitations/{invitationId}")
    public ResponseEntity<ApiResponse<Void>> cancelInvitation(
            Authentication authentication,
            @PathVariable Long homeId,
            @PathVariable Long invitationId
    ) {
        invitationService.cancelInvitation(extractUid(authentication), homeId, invitationId);
        return ResponseEntity.ok(ApiResponse.ok("Davet iptal edildi.", null));
    }

    /**
     * GET /api/invitations/my
     * Kullanıcının email'ine gelen bekleyen davetleri listeler.
     */
    @GetMapping("/api/invitations/my")
    public ResponseEntity<ApiResponse<List<InvitationResponse>>> getMyPendingInvitations(
            Authentication authentication
    ) {
        List<InvitationResponse> invitations = invitationService.getMyPendingInvitations(
                extractUid(authentication));
        return ResponseEntity.ok(ApiResponse.ok(invitations));
    }

    /**
     * POST /api/invitations/{invitationId}/accept
     * Kullanıcı daveti kabul eder → HomeMembership oluşturulur.
     */
    @PostMapping("/api/invitations/{invitationId}/accept")
    public ResponseEntity<ApiResponse<Void>> acceptInvitation(
            Authentication authentication,
            @PathVariable Long invitationId
    ) {
        invitationService.acceptInvitation(extractUid(authentication), invitationId);
        return ResponseEntity.ok(ApiResponse.ok("Davet kabul edildi.", null));
    }

    /**
     * POST /api/invitations/{invitationId}/reject
     * Kullanıcı daveti reddeder.
     */
    @PostMapping("/api/invitations/{invitationId}/reject")
    public ResponseEntity<ApiResponse<Void>> rejectInvitation(
            Authentication authentication,
            @PathVariable Long invitationId
    ) {
        invitationService.rejectInvitation(extractUid(authentication), invitationId);
        return ResponseEntity.ok(ApiResponse.ok("Davet reddedildi.", null));
    }

    /**
     * POST /api/homes/{homeId}/invitations/generate-code
     * OWNER, eve katılım için 6 karakterlik davet kodu üretir.
     */
    @PostMapping("/api/homes/{homeId}/invitations/generate-code")
    public ResponseEntity<ApiResponse<InvitationResponse>> generateInviteCode(
            @PathVariable Long homeId,
            Authentication authentication
    ) {
        String uid = extractUid(authentication);
        return ResponseEntity.ok(ApiResponse.ok(invitationService.generateInviteCode(uid, homeId)));
    }

    /**
     * POST /api/invitations/join
     * Kullanıcı davet koduyla eve katılır.
     */
    @PostMapping("/api/invitations/join")
    public ResponseEntity<ApiResponse<Void>> joinByInviteCode(
            @RequestBody @Valid JoinByCodeRequest request,
            Authentication authentication
    ) {
        String uid = extractUid(authentication);
        invitationService.joinByInviteCode(uid, request.inviteCode());
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    /**
     * GET /api/homes/{homeId}/invitations/active-code
     * OWNER, evin aktif davet kodunu getirir.
     */
    @GetMapping("/api/homes/{homeId}/invitations/active-code")
    public ResponseEntity<ApiResponse<InvitationResponse>> getActiveInviteCode(
            @PathVariable Long homeId,
            Authentication authentication
    ) {
        String uid = extractUid(authentication);
        return ResponseEntity.ok(ApiResponse.ok(invitationService.getActiveInviteCode(uid, homeId)));
    }

    private String extractUid(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new UnauthorizedException();
        }
        return authentication.getPrincipal().toString();
    }
}