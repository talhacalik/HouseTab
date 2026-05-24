package org.calik.sharedhomefinance.domain.debt.dto;

import org.calik.sharedhomefinance.domain.debt.entity.Debt;
import org.calik.sharedhomefinance.domain.debt.entity.DebtStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record DebtResponse(
        Long id,
        Long expenseId,
        String expenseTitle,
        LocalDateTime expenseDate,
        Long homeId,
        Long borrowerId,
        String borrowerName,
        String borrowerAvatarEmoji,
        String borrowerAvatarColor,
        Long creditorId,
        String creditorName,
        String creditorAvatarEmoji,
        String creditorAvatarColor,
        BigDecimal amount,
        DebtStatus status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static DebtResponse from(Debt debt) {
        return new DebtResponse(
                debt.getId(),
                debt.getExpense().getId(),
                debt.getExpense().getTitle(),
                debt.getExpense().getExpenseDate(),
                debt.getHome().getId(),
                debt.getBorrower().getId(),
                debt.getBorrower().getName(),
                debt.getBorrower().getAvatarEmoji(),
                debt.getBorrower().getAvatarColor(),
                debt.getCreditor().getId(),
                debt.getCreditor().getName(),
                debt.getCreditor().getAvatarEmoji(),
                debt.getCreditor().getAvatarColor(),
                debt.getAmount(),
                debt.getStatus(),
                debt.getCreatedAt(),
                debt.getUpdatedAt()
        );
    }
}