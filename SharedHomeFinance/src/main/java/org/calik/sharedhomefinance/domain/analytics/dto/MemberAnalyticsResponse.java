package org.calik.sharedhomefinance.domain.analytics.dto;

import java.math.BigDecimal;

public record MemberAnalyticsResponse(
        Long userId,
        String userName,
        BigDecimal totalPaid,
        double percentage
) {}