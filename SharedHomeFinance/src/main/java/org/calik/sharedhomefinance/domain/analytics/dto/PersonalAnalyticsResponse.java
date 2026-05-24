package org.calik.sharedhomefinance.domain.analytics.dto;

import java.math.BigDecimal;

public record PersonalAnalyticsResponse(
        Long userId,
        String userName,
        BigDecimal totalDebt,       // kullanıcının toplam borcu
        BigDecimal totalCredit,     // kullanıcının toplam alacağı
        BigDecimal netBalance       // pozitif → net alacaklı, negatif → net borçlu
) {}