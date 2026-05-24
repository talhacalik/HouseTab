package org.calik.sharedhomefinance.domain.expense.service;

import org.calik.sharedhomefinance.common.exception.BusinessException;
import org.calik.sharedhomefinance.common.exception.ForbiddenException;
import org.calik.sharedhomefinance.common.exception.ResourceNotFoundException;
import org.calik.sharedhomefinance.domain.audit.entity.AuditActionType;
import org.calik.sharedhomefinance.domain.audit.entity.AuditEntityType;
import org.calik.sharedhomefinance.domain.audit.service.AuditLogService;
import org.calik.sharedhomefinance.domain.category.entity.Category;
import org.calik.sharedhomefinance.domain.category.service.CategoryService;
import org.calik.sharedhomefinance.domain.debt.entity.DebtStatus;
import org.calik.sharedhomefinance.domain.debt.repository.DebtRepository;
import org.calik.sharedhomefinance.domain.debt.service.DebtService;
import org.calik.sharedhomefinance.domain.expense.dto.*;
import org.calik.sharedhomefinance.domain.expense.entity.Expense;
import org.calik.sharedhomefinance.domain.expense.entity.ExpenseStatus;
import org.calik.sharedhomefinance.domain.expense.entity.ExpenseVersion;
import org.calik.sharedhomefinance.domain.expense.repository.ExpenseRepository;
import org.calik.sharedhomefinance.domain.expense.repository.ExpenseVersionRepository;
import org.calik.sharedhomefinance.domain.home.entity.Home;
import org.calik.sharedhomefinance.domain.home.service.HomeService;
import org.calik.sharedhomefinance.domain.notification.entity.NotificationType;
import org.calik.sharedhomefinance.domain.notification.service.NotificationService;
import org.calik.sharedhomefinance.domain.user.entity.User;
import org.calik.sharedhomefinance.domain.user.service.UserService;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ExpenseServiceImpl implements ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final ExpenseVersionRepository expenseVersionRepository;
    private final HomeService homeService;
    private final UserService userService;
    private final CategoryService categoryService;
    private final DebtRepository debtRepository;
    private final DebtService debtService;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    public ExpenseServiceImpl(ExpenseRepository expenseRepository,
                               ExpenseVersionRepository expenseVersionRepository,
                               HomeService homeService,
                               UserService userService,
                               CategoryService categoryService,
                               DebtRepository debtRepository,
                               @Lazy DebtService debtService,
                               @Lazy NotificationService notificationService,
                               AuditLogService auditLogService) {
        this.expenseRepository = expenseRepository;
        this.expenseVersionRepository = expenseVersionRepository;
        this.homeService = homeService;
        this.userService = userService;
        this.categoryService = categoryService;
        this.debtRepository = debtRepository;
        this.debtService = debtService;
        this.notificationService = notificationService;
        this.auditLogService = auditLogService;
    }

    @Override
    @Transactional
    public ExpenseResponse createExpense(String firebaseUid, Long homeId,
                                         CreateExpenseRequest request) {
        User creator = userService.getByFirebaseUid(firebaseUid);
        homeService.validateMembership(homeId, creator.getId());
        Home home = homeService.getHomeById(homeId);

        User paidBy = userService.getById(request.paidByUserId());
        homeService.validateMembership(homeId, paidBy.getId());

        Category category = resolveCategory(request.categoryId(), homeId);

        Expense expense = Expense.builder()
                .home(home)
                .title(request.title())
                .description(request.description())
                .amount(request.amount())
                .expenseDate(request.expenseDate())
                .createdBy(creator)
                .paidBy(paidBy)
                .category(category)
                .status(ExpenseStatus.ACTIVE)
                .participantIds(request.participantIds())
                .build();

        expenseRepository.save(expense);
        debtService.generateDebts(expense);

        notificationService.sendToHomeMembers(
                homeId, creator.getId(),
                NotificationType.EXPENSE_ADDED,
                "Yeni Gider",
                creator.getName() + " yeni bir gider ekledi: " + expense.getTitle(),
                expense.getId()
        );
        auditLogService.log(AuditEntityType.EXPENSE, expense.getId(),
                AuditActionType.CREATED, creator.getId(),
                "amount=" + expense.getAmount() + ", title=" + expense.getTitle());

        return ExpenseResponse.from(expense);
    }

    @Override
    @Transactional(readOnly = true)
    public ExpenseResponse getExpense(String firebaseUid, Long homeId, Long expenseId) {
        User user = userService.getByFirebaseUid(firebaseUid);
        homeService.validateMembership(homeId, user.getId());
        Expense expense = getExpenseEntityById(expenseId, homeId);
        long totalDebts = debtRepository.countByExpenseId(expense.getId());
        long confirmedDebts = debtRepository.countByExpenseIdAndStatus(expense.getId(), DebtStatus.CONFIRMED);
        boolean allConfirmed = totalDebts > 0 && totalDebts == confirmedDebts;
        return ExpenseResponse.from(expense, allConfirmed);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ExpenseResponse> getExpenses(String firebaseUid, Long homeId, Pageable pageable) {
        User user = userService.getByFirebaseUid(firebaseUid);
        homeService.validateMembership(homeId, user.getId());
        return expenseRepository
                .findByHomeIdForUser(homeId, user.getId(), pageable)
                .map(expense -> {
                    long totalDebts = debtRepository.countByExpenseId(expense.getId());
                    long confirmedDebts = debtRepository.countByExpenseIdAndStatus(expense.getId(), DebtStatus.CONFIRMED);
                    boolean allConfirmed = totalDebts > 0 && totalDebts == confirmedDebts;
                    return ExpenseResponse.from(expense, allConfirmed);
                });
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ExpenseResponse> getExpensesByCategory(String firebaseUid, Long homeId, Long categoryId, Pageable pageable) {
        User user = userService.getByFirebaseUid(firebaseUid);
        homeService.validateMembership(homeId, user.getId());
        return expenseRepository
                .findByHomeIdAndCategoryIdForUser(homeId, categoryId, user.getId(), pageable)
                .map(expense -> {
                    long totalDebts = debtRepository.countByExpenseId(expense.getId());
                    long confirmedDebts = debtRepository.countByExpenseIdAndStatus(expense.getId(), DebtStatus.CONFIRMED);
                    boolean allConfirmed = totalDebts > 0 && totalDebts == confirmedDebts;
                    return ExpenseResponse.from(expense, allConfirmed);
                });
    }

    @Override
    @Transactional
    public ExpenseResponse updateExpense(String firebaseUid, Long homeId, Long expenseId,
                                          UpdateExpenseRequest request) {
        User editor = userService.getByFirebaseUid(firebaseUid);
        homeService.validateMembership(homeId, editor.getId());

        Expense expense = getExpenseEntityById(expenseId, homeId);
        validateNotCancelled(expense);
        validateEditPermission(expense, editor);

        ExpenseVersion version = ExpenseVersion.builder()
                .expense(expense)
                .previousAmount(expense.getAmount())
                .previousTitle(expense.getTitle())
                .previousDescription(expense.getDescription())
                .editNote(request.editNote())
                .editedBy(editor)
                .build();

        expenseVersionRepository.save(version);

        Category category = resolveCategory(request.categoryId(), homeId);

        expense.setTitle(request.title());
        expense.setDescription(request.description());
        expense.setAmount(request.amount());
        expense.setExpenseDate(request.expenseDate());
        expense.setCategory(category);
        expense.setStatus(ExpenseStatus.EDITED);

        expenseRepository.save(expense);

        debtRepository.deleteAllByExpenseIdAndStatus(expense.getId(), DebtStatus.PENDING);
        debtService.generateDebts(expense);

        notificationService.sendToHomeMembers(
                homeId, editor.getId(),
                NotificationType.EXPENSE_UPDATED,
                "Gider Güncellendi",
                editor.getName() + " bir gideri güncelledi: " + expense.getTitle(),
                expense.getId()
        );
        auditLogService.log(AuditEntityType.EXPENSE, expense.getId(),
                AuditActionType.UPDATED, editor.getId(),
                "newAmount=" + expense.getAmount() + ", title=" + expense.getTitle());

        return ExpenseResponse.from(expense);
    }

    @Override
    @Transactional
    public ExpenseResponse cancelExpense(String firebaseUid, Long homeId, Long expenseId,
                                          CancelExpenseRequest request) {
        User user = userService.getByFirebaseUid(firebaseUid);
        homeService.validateMembership(homeId, user.getId());

        Expense expense = getExpenseEntityById(expenseId, homeId);
        validateNotCancelled(expense);
        validateEditPermission(expense, user);

        expense.setStatus(ExpenseStatus.CANCELLED);
        expense.setCancelNote(request.cancelNote());

        expenseRepository.save(expense);

        notificationService.sendToHomeMembers(
                homeId, user.getId(),
                NotificationType.EXPENSE_CANCELLED,
                "Gider İptal Edildi",
                user.getName() + " bir gideri iptal etti: " + expense.getTitle(),
                expense.getId()
        );
        auditLogService.log(AuditEntityType.EXPENSE, expense.getId(),
                AuditActionType.CANCELLED, user.getId(),
                "cancelNote=" + request.cancelNote());

        return ExpenseResponse.from(expense);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExpenseVersionResponse> getExpenseHistory(String firebaseUid, Long homeId,
                                                           Long expenseId) {
        User user = userService.getByFirebaseUid(firebaseUid);
        homeService.validateMembership(homeId, user.getId());
        getExpenseEntityById(expenseId, homeId);

        return expenseVersionRepository
                .findAllByExpenseIdOrderByEditedAtDesc(expenseId)
                .stream()
                .map(ExpenseVersionResponse::from)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Expense getExpenseEntityById(Long expenseId, Long homeId) {
        return expenseRepository.findByIdAndHomeId(expenseId, homeId)
                .orElseThrow(() -> new ResourceNotFoundException("Gider", expenseId));
    }

    // ── private helpers ──────────────────────────────────────────────────────

    private void validateNotCancelled(Expense expense) {
        if (expense.getStatus() == ExpenseStatus.CANCELLED) {
            throw new BusinessException(
                    "İptal edilmiş giderler üzerinde işlem yapılamaz.",
                    "EXPENSE_CANCELLED"
            );
        }
    }

    private void validateEditPermission(Expense expense, User editor) {
        boolean isCreator = expense.getCreatedBy().getId().equals(editor.getId());
        if (!isCreator) {
            throw new ForbiddenException("Bu gideri düzenleme yetkiniz yok.");
        }
    }

    private Category resolveCategory(Long categoryId, Long homeId) {
        if (categoryId == null) return null;
        return categoryService.getCategoryByIdAndHome(categoryId, homeId);
    }
}
