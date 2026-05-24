package org.calik.sharedhomefinance.domain.debt.dto;

import java.math.BigDecimal;

/**
 * İki kullanıcı arasındaki net borç özetini taşır.
 * "borrowerName kişisi creditorName kişisine totalAmount ₺ borçlu."
 */
public record DebtSummaryResponse(
        Long borrowerId,
        String borrowerName,
        Long creditorId,
        String creditorName,
        BigDecimal totalAmount
) {}