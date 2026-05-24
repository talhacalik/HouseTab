package org.calik.sharedhomefinance.domain.analytics.dto;

import java.math.BigDecimal;

public record MonthlyAnalyticsResponse(
        int year,
        int month,
        BigDecimal totalAmount,
        int expenseCount
) {}