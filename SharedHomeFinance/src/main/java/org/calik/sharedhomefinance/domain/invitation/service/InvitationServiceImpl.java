package org.calik.sharedhomefinance.domain.invitation.service;

import lombok.RequiredArgsConstructor;
import org.calik.sharedhomefinance.common.exception.BusinessException;
import org.calik.sharedhomefinance.common.exception.ForbiddenException;
import org.calik.sharedhomefinance.common.exception.ResourceNotFoundException;
import org.calik.sharedhomefinance.domain.home.entity.Home;
import org.calik.sharedhomefinance.domain.home.entity.HomeMembership;
import org.calik.sharedhomefinance.domain.home.entity.HomeRole;
import org.calik.sharedhomefinance.domain.home.repository.HomeMembershipRepository;
import org.calik.sharedhomefinance.domain.home.service.HomeService;
import org.calik.sharedhomefinance.domain.invitation.dto.CreateInvitationRequest;
import org.calik.sharedhomefinance.domain.invitation.dto.InvitationResponse;
import org.calik.sharedhomefinance.domain.invitation.entity.Invitation;
import org.calik.sharedhomefinance.domain.invitation.entity.InvitationStatus;
import org.calik.sharedhomefinance.domain.invitation.repository.InvitationRepository;
import org.calik.sharedhomefinance.domain.notification.entity.NotificationType;
import org.calik.sharedhomefinance.domain.notification.service.NotificationService;
import org.calik.sharedhomefinance.domain.user.entity.User;
import org.calik.sharedhomefinance.domain.user.service.UserService;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class InvitationServiceImpl implements InvitationService {

    private static final int INVITATION_VALIDITY_HOURS = 48;

    private final InvitationRepository invitationRepository;
    private final HomeMembershipRepository membershipRepository;
    private final HomeService homeService;
    private final UserService userService;
    private final NotificationService notificationService;

    public InvitationServiceImpl(InvitationRepository invitationRepository,
                                  HomeMembershipRepository membershipRepository,
                                  HomeService homeService,
                                  UserService userService,
                                  @Lazy NotificationService notificationService) {
        this.invitationRepository = invitationRepository;
        this.membershipRepository = membershipRepository;
        this.homeService = homeService;
        this.userService = userService;
        this.notificationService = notificationService;
    }

    @Override
    @Transactional
    public InvitationResponse createInvitation(String firebaseUid, Long homeId,
                                               CreateInvitationRequest request) {
        User owner = userService.getByFirebaseUid(firebaseUid);
        Home home = homeService.getHomeById(homeId);
        homeService.validateOwnership(homeId, owner.getId());

        String invitedEmail = request.email().toLowerCase().strip();

        // Davet edilecek kişi zaten üye mi?
        userService.findByEmail(invitedEmail).ifPresent(invitedUser -> {
            if (membershipRepository.existsByHomeIdAndUserId(homeId, invitedUser.getId())) {
                throw new BusinessException(
                        "Bu kullanıcı zaten evin üyesi.",
                        "ALREADY_MEMBER"
                );
            }
        });

        // Aynı adrese bekleyen davet var mı?
        if (invitationRepository.existsByHomeIdAndInvitedEmailAndStatus(
                homeId, invitedEmail, InvitationStatus.PENDING)) {
            throw new BusinessException(
                    "Bu email adresine zaten bekleyen bir davet mevcut.",
                    "INVITATION_ALREADY_PENDING"
            );
        }

        Invitation invitation = Invitation.builder()
                .home(home)
                .invitedEmail(invitedEmail)
                .invitedBy(owner)
                .status(InvitationStatus.PENDING)
                .expiresAt(LocalDateTime.now().plusHours(INVITATION_VALIDITY_HOURS))
                .build();

        invitationRepository.save(invitation);

        // Davet edilen kullanıcı sistemde kayıtlıysa bildirim gönder
        userService.findByEmail(invitedEmail).ifPresent(invitedUser ->
                notificationService.sendToUser(
                        invitedUser.getId(),
                        NotificationType.INVITATION_RECEIVED,
                        "Eve Davet Edildiniz",
                        owner.getName() + " sizi \"" + home.getName() + "\" evine davet etti.",
                        invitation.getId()
                )
        );

        return InvitationResponse.from(invitation);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InvitationResponse> getPendingInvitations(String firebaseUid, Long homeId) {
        User owner = userService.getByFirebaseUid(firebaseUid);
        homeService.validateOwnership(homeId, owner.getId());

        return invitationRepository
                .findAllByHomeIdAndStatus(homeId, InvitationStatus.PENDING)
                .stream()
                .map(InvitationResponse::from)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<InvitationResponse> getMyPendingInvitations(String firebaseUid) {
        User user = userService.getByFirebaseUid(firebaseUid);

        return invitationRepository
                .findAllByInvitedEmailAndStatus(user.getEmail(), InvitationStatus.PENDING)
                .stream()
                // Süresi geçmiş ama henüz DB'de EXPIRED işaretlenmemiş olanları filtrele
                .filter(inv -> !inv.isExpired())
                .map(InvitationResponse::from)
                .toList();
    }

    @Override
    @Transactional
    public void acceptInvitation(String firebaseUid, Long invitationId) {
        User user = userService.getByFirebaseUid(firebaseUid);
        Invitation invitation = findPendingInvitationForUser(invitationId, user.getEmail());

        if (membershipRepository.existsByHomeIdAndUserId(invitation.getHome().getId(), user.getId())) {
            throw new BusinessException("Zaten bu evin üyesisiniz.", "ALREADY_MEMBER");
        }

        invitation.setStatus(InvitationStatus.ACCEPTED);
        invitationRepository.save(invitation);

        HomeMembership membership = HomeMembership.builder()
                .home(invitation.getHome())
                .user(user)
                .role(HomeRole.MEMBER)
                .build();

        membershipRepository.save(membership);
    }

    @Override
    @Transactional
    public void rejectInvitation(String firebaseUid, Long invitationId) {
        User user = userService.getByFirebaseUid(firebaseUid);
        Invitation invitation = findPendingInvitationForUser(invitationId, user.getEmail());

        invitation.setStatus(InvitationStatus.REJECTED);
        invitationRepository.save(invitation);
    }

    @Override
    @Transactional
    public void cancelInvitation(String firebaseUid, Long homeId, Long invitationId) {
        User owner = userService.getByFirebaseUid(firebaseUid);
        homeService.validateOwnership(homeId, owner.getId());

        Invitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new ResourceNotFoundException("Davet", invitationId));

        if (!invitation.getHome().getId().equals(homeId)) {
            throw new ForbiddenException("Bu davet bu eve ait değil.");
        }

        if (invitation.getStatus() != InvitationStatus.PENDING) {
            throw new BusinessException(
                    "Sadece bekleyen davetler iptal edilebilir.",
                    "INVITATION_NOT_PENDING"
            );
        }

        invitation.setStatus(InvitationStatus.EXPIRED);
        invitationRepository.save(invitation);
    }

    @Override
    @Transactional
    public InvitationResponse generateInviteCode(String firebaseUid, Long homeId) {
        User user = userService.getByFirebaseUid(firebaseUid);
        Home home = homeService.getHomeById(homeId);
        homeService.validateOwnership(homeId, user.getId());

        invitationRepository
                .findFirstByHomeIdAndInviteCodeIsNotNullAndStatusOrderByCreatedAtDesc(
                        homeId, InvitationStatus.PENDING)
                .ifPresent(existing -> {
                    existing.setStatus(InvitationStatus.EXPIRED);
                    invitationRepository.save(existing);
                });

        String code = UUID.randomUUID().toString().replace("-", "").substring(0, 6).toUpperCase();

        Invitation invitation = Invitation.builder()
                .home(home)
                .invitedBy(user)
                .inviteCode(code)
                .invitedEmail(null)
                .status(InvitationStatus.PENDING)
                .expiresAt(LocalDateTime.now().plusHours(24))
                .build();

        return InvitationResponse.from(invitationRepository.save(invitation));
    }

    @Override
    @Transactional
    public void joinByInviteCode(String firebaseUid, String inviteCode) {
        User user = userService.getByFirebaseUid(firebaseUid);

        String code = inviteCode.toUpperCase().strip();

        Invitation invitation = invitationRepository
                .findByInviteCodeAndStatus(code, InvitationStatus.PENDING)
                .orElseThrow(() -> new ResourceNotFoundException("Geçersiz veya kullanılmış davet kodu"));

        if (invitation.isExpired()) {
            invitation.setStatus(InvitationStatus.EXPIRED);
            invitationRepository.save(invitation);
            throw new BusinessException("Davet kodunun süresi dolmuş.", "INVITE_EXPIRED");
        }

        Home home = invitation.getHome();

        if (membershipRepository.existsByHomeIdAndUserId(home.getId(), user.getId())) {
            throw new BusinessException("Bu evin zaten üyesisiniz.", "ALREADY_MEMBER");
        }

        HomeMembership membership = HomeMembership.builder()
                .home(home)
                .user(user)
                .role(HomeRole.MEMBER)
                .build();

        membershipRepository.save(membership);

        invitation.setStatus(InvitationStatus.ACCEPTED);
        invitationRepository.save(invitation);
    }

    @Override
    @Transactional
    public InvitationResponse getActiveInviteCode(String firebaseUid, Long homeId) {
        User user = userService.getByFirebaseUid(firebaseUid);
        homeService.validateOwnership(homeId, user.getId());

        Invitation invitation = invitationRepository
                .findFirstByHomeIdAndInviteCodeIsNotNullAndStatusOrderByCreatedAtDesc(
                        homeId, InvitationStatus.PENDING)
                .orElseThrow(() -> new ResourceNotFoundException("Aktif davet kodu bulunamadı"));

        if (invitation.isExpired()) {
            invitation.setStatus(InvitationStatus.EXPIRED);
            invitationRepository.save(invitation);
            throw new ResourceNotFoundException("Davet kodunun süresi dolmuş");
        }

        return InvitationResponse.from(invitation);
    }

    // ── private helpers ──────────────────────────────────────────────────────

    private Invitation findPendingInvitationForUser(Long invitationId, String email) {
        Invitation invitation = invitationRepository
                .findByIdAndInvitedEmail(invitationId, email)
                .orElseThrow(() -> new ResourceNotFoundException("Davet", invitationId));

        if (invitation.getStatus() != InvitationStatus.PENDING) {
            throw new BusinessException(
                    "Bu davet artık geçerli değil.",
                    "INVITATION_NOT_PENDING"
            );
        }

        if (invitation.isExpired()) {
            invitation.setStatus(InvitationStatus.EXPIRED);
            invitationRepository.save(invitation);
            throw new BusinessException(
                    "Bu davetin süresi dolmuştur.",
                    "INVITATION_EXPIRED"
            );
        }

        return invitation;
    }
}