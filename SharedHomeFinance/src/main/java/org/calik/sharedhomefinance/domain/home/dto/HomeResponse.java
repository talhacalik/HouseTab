package org.calik.sharedhomefinance.domain.home.dto;

import org.calik.sharedhomefinance.domain.home.entity.Home;
import org.calik.sharedhomefinance.domain.home.entity.HomeRole;
import org.calik.sharedhomefinance.domain.home.entity.SplitType;

import java.time.LocalDateTime;

public record HomeResponse(
        Long id,
        String name,
        String description,
        SplitType defaultSplitType,
        boolean allowMemberExpenseEdit,
        Long createdById,
        String createdByName,
        LocalDateTime createdAt,
        int memberCount,
        HomeRole role,
        java.math.BigDecimal totalExpense
) {
    public static HomeResponse from(Home home, HomeRole role, int memberCount) {
        return new HomeResponse(
                home.getId(),
                home.getName(),
                home.getDescription(),
                home.getDefaultSplitType(),
                home.isAllowMemberExpenseEdit(),
                home.getCreatedBy().getId(),
                home.getCreatedBy().getName(),
                home.getCreatedAt(),
                memberCount,
                role,
                null
        );
    }

    public static HomeResponse from(Home home, HomeRole role, int memberCount, java.math.BigDecimal totalExpense) {
        return new HomeResponse(
                home.getId(),
                home.getName(),
                home.getDescription(),
                home.getDefaultSplitType(),
                home.isAllowMemberExpenseEdit(),
                home.getCreatedBy().getId(),
                home.getCreatedBy().getName(),
                home.getCreatedAt(),
                memberCount,
                role,
                totalExpense
        );
    }
}