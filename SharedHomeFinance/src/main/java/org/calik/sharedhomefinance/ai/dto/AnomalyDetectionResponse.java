package org.calik.sharedhomefinance.ai.dto;

import java.math.BigDecimal;

public record AnomalyDetectionResponse(
        boolean anomaly,
        String message,
        BigDecimal threeMonthAverage,
        BigDecimal currentAmount
) {}