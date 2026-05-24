package org.calik.sharedhomefinance.domain.expense.dto;

import org.calik.sharedhomefinance.domain.expense.entity.ExpenseVersion;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ExpenseVersionResponse(
        Long id,
        BigDecimal previousAmount,
        String previousTitle,
        String previousDescription,
        String editNote,
        Long editedByUserId,
        String editedByName,
        LocalDateTime editedAt
) {
    public static ExpenseVersionResponse from(ExpenseVersion version) {
        return new ExpenseVersionResponse(
                version.getId(),
                version.getPreviousAmount(),
                version.getPreviousTitle(),
                version.getPreviousDescription(),
                version.getEditNote(),
                version.getEditedBy().getId(),
                version.getEditedBy().getName(),
                version.getEditedAt()
        );
    }
}