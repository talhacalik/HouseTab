package org.calik.sharedhomefinance.domain.analytics.service;

import lombok.RequiredArgsConstructor;
import org.calik.sharedhomefinance.domain.analytics.dto.*;
import org.calik.sharedhomefinance.domain.debt.repository.DebtRepository;
import org.calik.sharedhomefinance.domain.expense.entity.ExpenseStatus;
import org.calik.sharedhomefinance.domain.expense.repository.ExpenseRepository;
import org.calik.sharedhomefinance.domain.home.service.HomeService;
import org.calik.sharedhomefinance.domain.user.entity.User;
import org.calik.sharedhomefinance.domain.user.service.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AnalyticsServiceImpl implements AnalyticsService {

    private final ExpenseRepository expenseRepository;
    private final DebtRepository debtRepository;
    private final HomeService homeService;
    private final UserService userService;

    @Override
    @Transactional(readOnly = true)
    public MonthlyAnalyticsResponse getMonthlyAnalytics(String firebaseUid, Long homeId) {
        User user = userService.getByFirebaseUid(firebaseUid);
        homeService.validateMembership(homeId, user.getId());

        LocalDateTime[] range = currentMonthRange();

        BigDecimal total = expenseRepository.sumByHomeIdAndDateRangeForUser(homeId, user.getId(), range[0], range[1]);

        int count = expenseRepository
                .findByHomeIdAndDateRange(homeId, range[0], range[1])
                .stream()
                .filter(e -> (e.getStatus() == ExpenseStatus.ACTIVE || e.getStatus() == ExpenseStatus.EDITED)
                        && (e.getCreatedBy().getId().equals(user.getId())
                            || e.getPaidBy().getId().equals(user.getId())))
                .mapToInt(e -> 1)
                .sum();

        return new MonthlyAnalyticsResponse(
                range[0].getYear(),
                range[0].getMonthValue(),
                total,
                count
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryAnalyticsResponse> getCategoryAnalytics(String firebaseUid, Long homeId) {
        User user = userService.getByFirebaseUid(firebaseUid);
        homeService.validateMembership(homeId, user.getId());

        LocalDateTime[] range = currentMonthRange();

        List<Object[]> rows = expenseRepository.sumByCategoryAndDateRange(homeId, range[0], range[1]);

        BigDecimal grandTotal = rows.stream()
                .map(r -> (BigDecimal) r[2])
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return rows.stream()
                .map(r -> new CategoryAnalyticsResponse(
                        (Long) r[0],
                        (String) r[1],
                        (BigDecimal) r[2],
                        calculatePercentage((BigDecimal) r[2], grandTotal)
                ))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<MemberAnalyticsResponse> getMemberAnalytics(String firebaseUid, Long homeId) {
        User user = userService.getByFirebaseUid(firebaseUid);
        homeService.validateMembership(homeId, user.getId());

        LocalDateTime[] range = currentMonthRange();

        List<Object[]> rows = expenseRepository.sumByMemberAndDateRange(homeId, range[0], range[1]);

        BigDecimal grandTotal = rows.stream()
                .map(r -> (BigDecimal) r[2])
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return rows.stream()
                .map(r -> new MemberAnalyticsResponse(
                        (Long) r[0],
                        (String) r[1],
                        (BigDecimal) r[2],
                        calculatePercentage((BigDecimal) r[2], grandTotal)
                ))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public PersonalAnalyticsResponse getPersonalAnalytics(String firebaseUid, Long homeId) {
        User user = userService.getByFirebaseUid(firebaseUid);
        homeService.validateMembership(homeId, user.getId());

        BigDecimal totalDebt   = debtRepository.sumPendingDebtByUser(homeId, user.getId());
        BigDecimal totalCredit = debtRepository.sumPendingCreditByUser(homeId, user.getId());
        BigDecimal netBalance  = totalCredit.subtract(totalDebt);

        return new PersonalAnalyticsResponse(
                user.getId(),
                user.getName(),
                totalDebt,
                totalCredit,
                netBalance
        );
    }

    // ── private helpers ──────────────────────────────────────────────────────

    /** Mevcut ayın ilk ve son günü. */
    private LocalDateTime[] currentMonthRange() {
        LocalDateTime now   = LocalDateTime.now();
        LocalDateTime start = now.withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        LocalDateTime end   = now.withDayOfMonth(now.toLocalDate().lengthOfMonth()).withHour(23).withMinute(59).withSecond(59);
        return new LocalDateTime[]{start, end};
    }

    private double calculatePercentage(BigDecimal part, BigDecimal total) {
        if (total.compareTo(BigDecimal.ZERO) == 0) return 0.0;
        return part.multiply(BigDecimal.valueOf(100))
                .divide(total, 2, RoundingMode.HALF_UP)
                .doubleValue();
    }
}