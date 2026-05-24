package org.calik.sharedhomefinance.domain.expense.dto;

import org.calik.sharedhomefinance.domain.expense.entity.Expense;
import org.calik.sharedhomefinance.domain.expense.entity.ExpenseStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ExpenseResponse(
        Long id,
        Long homeId,
        String title,
        String description,
        BigDecimal amount,
        LocalDateTime expenseDate,
        Long createdByUserId,
        String createdByName,
        Long paidByUserId,
        String paidByName,
        Long categoryId,
        String categoryName,
        ExpenseStatus status,
        String cancelNote,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        boolean allDebtsConfirmed
) {
    public static ExpenseResponse from(Expense expense) {
        return new ExpenseResponse(
                expense.getId(),
                expense.getHome().getId(),
                expense.getTitle(),
                expense.getDescription(),
                expense.getAmount(),
                expense.getExpenseDate(),
                expense.getCreatedBy().getId(),
                expense.getCreatedBy().getName(),
                expense.getPaidBy().getId(),
                expense.getPaidBy().getName(),
                expense.getCategory() != null ? expense.getCategory().getId() : null,
                expense.getCategory() != null ? expense.getCategory().getName() : null,
                expense.getStatus(),
                expense.getCancelNote(),
                expense.getCreatedAt(),
                expense.getUpdatedAt(),
                false
        );
    }

    public static ExpenseResponse from(Expense expense, boolean allDebtsConfirmed) {
        return new ExpenseResponse(
                expense.getId(),
                expense.getHome().getId(),
                expense.getTitle(),
                expense.getDescription(),
                expense.getAmount(),
                expense.getExpenseDate(),
                expense.getCreatedBy().getId(),
                expense.getCreatedBy().getName(),
                expense.getPaidBy().getId(),
                expense.getPaidBy().getName(),
                expense.getCategory() != null ? expense.getCategory().getId() : null,
                expense.getCategory() != null ? expense.getCategory().getName() : null,
                expense.getStatus(),
                expense.getCancelNote(),
                expense.getCreatedAt(),
                expense.getUpdatedAt(),
                allDebtsConfirmed
        );
    }
}