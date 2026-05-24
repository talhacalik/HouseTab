package org.calik.sharedhomefinance.domain.analytics.dto;

import java.math.BigDecimal;

public record CategoryAnalyticsResponse(
        Long categoryId,
        String categoryName,
        BigDecimal totalAmount,
        double percentage
) {}