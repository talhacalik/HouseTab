package org.calik.sharedhomefinance.domain.debt.service;

import lombok.RequiredArgsConstructor;
import org.calik.sharedhomefinance.common.exception.BusinessException;
import org.calik.sharedhomefinance.common.exception.ForbiddenException;
import org.calik.sharedhomefinance.common.exception.ResourceNotFoundException;
import org.calik.sharedhomefinance.domain.audit.entity.AuditActionType;
import org.calik.sharedhomefinance.domain.audit.entity.AuditEntityType;
import org.calik.sharedhomefinance.domain.audit.service.AuditLogService;
import org.calik.sharedhomefinance.domain.debt.dto.DebtResponse;
import org.calik.sharedhomefinance.domain.debt.dto.DebtSummaryResponse;
import org.calik.sharedhomefinance.domain.debt.entity.Debt;
import org.calik.sharedhomefinance.domain.debt.entity.DebtStatus;
import org.calik.sharedhomefinance.domain.debt.repository.DebtRepository;
import org.calik.sharedhomefinance.domain.expense.entity.Expense;
import org.calik.sharedhomefinance.domain.home.entity.HomeMembership;
import org.calik.sharedhomefinance.domain.home.repository.HomeMembershipRepository;
import org.calik.sharedhomefinance.domain.home.service.HomeService;
import org.calik.sharedhomefinance.domain.notification.entity.NotificationType;
import org.calik.sharedhomefinance.domain.notification.service.NotificationService;
import org.calik.sharedhomefinance.domain.user.entity.User;
import org.calik.sharedhomefinance.domain.user.service.UserService;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DebtServiceImpl implements DebtService {

    private final DebtRepository debtRepository;
    private final HomeMembershipRepository membershipRepository;
    private final HomeService homeService;
    private final UserService userService;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    public DebtServiceImpl(DebtRepository debtRepository,
                            HomeMembershipRepository membershipRepository,
                            HomeService homeService,
                            UserService userService,
                            @Lazy NotificationService notificationService,
                            AuditLogService auditLogService) {
        this.debtRepository = debtRepository;
        this.membershipRepository = membershipRepository;
        this.homeService = homeService;
        this.userService = userService;
        this.notificationService = notificationService;
        this.auditLogService = auditLogService;
    }

    @Override
    @Transactional
    public void generateDebts(Expense expense) {
        List<Long> participantIds = expense.getParticipantIds();
        Long paidById = expense.getPaidBy().getId();

        List<User> borrowers;
        BigDecimal share;

        if (participantIds == null || participantIds.isEmpty()) {
            List<HomeMembership> memberships = membershipRepository
                    .findAllByHomeId(expense.getHome().getId());

            borrowers = memberships.stream()
                    .map(HomeMembership::getUser)
                    .filter(u -> !u.getId().equals(paidById))
                    .toList();

            if (borrowers.isEmpty()) return;

            int count = borrowers.size() + 1;
            share = expense.getAmount()
                    .divide(BigDecimal.valueOf(count), 2, RoundingMode.HALF_UP);
        } else {
            boolean paidByInList = participantIds.contains(paidById);

            borrowers = participantIds.stream()
                    .filter(id -> !id.equals(paidById))
                    .map(userService::getById)
                    .toList();

            if (borrowers.isEmpty()) return;

            int divisor = paidByInList
                    ? participantIds.size() + 1
                    : participantIds.size();
            share = expense.getAmount()
                    .divide(BigDecimal.valueOf(divisor), 2, RoundingMode.HALF_UP);
        }

        List<Debt> debts = new ArrayList<>();
        for (User borrower : borrowers) {
            debts.add(Debt.builder()
                    .expense(expense)
                    .home(expense.getHome())
                    .borrower(borrower)
                    .creditor(expense.getPaidBy())
                    .amount(share)
                    .status(DebtStatus.PENDING)
                    .build());
        }

        debtRepository.saveAll(debts);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DebtResponse> getHomeDebts(String firebaseUid, Long homeId) {
        User user = userService.getByFirebaseUid(firebaseUid);
        homeService.validateMembership(homeId, user.getId());

        return debtRepository.findAllByHomeIdAndStatus(homeId, DebtStatus.PENDING)
                .stream()
                .map(DebtResponse::from)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<DebtResponse> getMyDebts(String firebaseUid, Long homeId) {
        User user = userService.getByFirebaseUid(firebaseUid);
        homeService.validateMembership(homeId, user.getId());

        return debtRepository.findAllByHomeIdAndBorrowerId(homeId, user.getId())
                .stream()
                .map(DebtResponse::from)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<DebtResponse> getMyCredits(String firebaseUid, Long homeId) {
        User user = userService.getByFirebaseUid(firebaseUid);
        homeService.validateMembership(homeId, user.getId());

        return debtRepository.findAllByHomeIdAndCreditorId(homeId, user.getId())
                .stream()
                .map(DebtResponse::from)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<DebtSummaryResponse> getHomeSummary(String firebaseUid, Long homeId) {
        User user = userService.getByFirebaseUid(firebaseUid);
        homeService.validateMembership(homeId, user.getId());

        List<Debt> pendingDebts = debtRepository.findAllByHomeIdAndStatus(homeId, DebtStatus.PENDING);

        // borrowerId-creditorId çiftlerine göre topla
        Map<String, List<Debt>> grouped = pendingDebts.stream()
                .collect(Collectors.groupingBy(
                        d -> d.getBorrower().getId() + "-" + d.getCreditor().getId()
                ));

        return grouped.values().stream()
                .map(group -> {
                    Debt first = group.get(0);
                    BigDecimal total = group.stream()
                            .map(Debt::getAmount)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    return new DebtSummaryResponse(
                            first.getBorrower().getId(),
                            first.getBorrower().getName(),
                            first.getCreditor().getId(),
                            first.getCreditor().getName(),
                            total
                    );
                })
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public DebtResponse getDebtById(String firebaseUid, Long homeId, Long debtId) {
        User user = userService.getByFirebaseUid(firebaseUid);
        homeService.validateMembership(homeId, user.getId());
        Debt debt = getDebtForHome(debtId, homeId);
        return DebtResponse.from(debt);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DebtResponse> getDebtsByExpense(String firebaseUid, Long homeId, Long expenseId) {
        User user = userService.getByFirebaseUid(firebaseUid);
        homeService.validateMembership(homeId, user.getId());

        return debtRepository.findAllByExpenseId(expenseId)
                .stream()
                .map(DebtResponse::from)
                .toList();
    }

    @Override
    @Transactional
    public DebtResponse markAsPaid(String firebaseUid, Long homeId, Long debtId) {
        User borrower = userService.getByFirebaseUid(firebaseUid);
        Debt debt = getDebtForHome(debtId, homeId);

        if (!debt.getBorrower().getId().equals(borrower.getId())) {
            throw new ForbiddenException("Yalnızca borçlu bu işlemi yapabilir.");
        }
        if (debt.getStatus() != DebtStatus.PENDING) {
            throw new BusinessException(
                    "Yalnızca bekleyen borçlar ödendi olarak işaretlenebilir.",
                    "DEBT_NOT_PENDING"
            );
        }

        debt.setStatus(DebtStatus.MARKED_AS_PAID);
        debtRepository.save(debt);

        notificationService.sendToUser(
                debt.getCreditor().getId(),
                NotificationType.DEBT_MARKED_AS_PAID,
                "Ödeme Bildirimi",
                debt.getBorrower().getName() + " borcunu ödedi.",
                debt.getId()
        );
        auditLogService.log(AuditEntityType.DEBT, debt.getId(),
                AuditActionType.STATUS_CHANGED, borrower.getId(), "status=MARKED_AS_PAID");

        return DebtResponse.from(debt);
    }

    @Override
    @Transactional
    public DebtResponse confirmPayment(String firebaseUid, Long homeId, Long debtId) {
        User creditor = userService.getByFirebaseUid(firebaseUid);
        Debt debt = getDebtForHome(debtId, homeId);

        if (!debt.getCreditor().getId().equals(creditor.getId())) {
            throw new ForbiddenException("Yalnızca alacaklı bu işlemi yapabilir.");
        }
        if (debt.getStatus() != DebtStatus.MARKED_AS_PAID) {
            throw new BusinessException(
                    "Yalnızca ödendi işaretlenmiş borçlar onaylanabilir.",
                    "DEBT_NOT_MARKED_AS_PAID"
            );
        }

        debt.setStatus(DebtStatus.CONFIRMED);
        debtRepository.save(debt);

        notificationService.sendToUser(
                debt.getBorrower().getId(),
                NotificationType.DEBT_CONFIRMED,
                "Ödeme Onaylandı",
                creditor.getName() + " ödemenizi onayladı.",
                debt.getId()
        );
        auditLogService.log(AuditEntityType.DEBT, debt.getId(),
                AuditActionType.STATUS_CHANGED, creditor.getId(), "status=CONFIRMED");

        return DebtResponse.from(debt);
    }

    @Override
    @Transactional
    public DebtResponse rejectPayment(String firebaseUid, Long homeId, Long debtId) {
        User creditor = userService.getByFirebaseUid(firebaseUid);
        Debt debt = getDebtForHome(debtId, homeId);

        if (!debt.getCreditor().getId().equals(creditor.getId())) {
            throw new ForbiddenException("Yalnızca alacaklı bu işlemi yapabilir.");
        }
        if (debt.getStatus() != DebtStatus.MARKED_AS_PAID) {
            throw new BusinessException(
                    "Yalnızca ödendi işaretlenmiş borçlar reddedilebilir.",
                    "DEBT_NOT_MARKED_AS_PAID"
            );
        }

        debt.setStatus(DebtStatus.PENDING);
        debtRepository.save(debt);

        notificationService.sendToUser(
                debt.getBorrower().getId(),
                NotificationType.DEBT_REJECTED,
                "Ödeme Reddedildi",
                creditor.getName() + " ödemenizi reddetti. Lütfen tekrar gönderin.",
                debt.getId()
        );
        auditLogService.log(AuditEntityType.DEBT, debt.getId(),
                AuditActionType.STATUS_CHANGED, creditor.getId(), "status=PENDING(rejected)");

        return DebtResponse.from(debt);
    }

    // ── private helpers ──────────────────────────────────────────────────────

    private Debt getDebtForHome(Long debtId, Long homeId) {
        return debtRepository.findByIdAndHomeId(debtId, homeId)
                .orElseThrow(() -> new ResourceNotFoundException("Borç", debtId));
    }
}