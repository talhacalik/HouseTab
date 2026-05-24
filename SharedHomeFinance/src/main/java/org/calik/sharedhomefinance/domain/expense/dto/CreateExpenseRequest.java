package org.calik.sharedhomefinance.domain.expense.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record CreateExpenseRequest(

        @NotBlank(message = "Gider başlığı boş olamaz.")
        @Size(min = 2, max = 150, message = "Başlık 2-150 karakter arasında olmalıdır.")
        String title,

        @Size(max = 500, message = "Açıklama en fazla 500 karakter olabilir.")
        String description,

        @NotNull(message = "Tutar boş olamaz.")
        @DecimalMin(value = "0.01", message = "Tutar 0'dan büyük olmalıdır.")
        @Digits(integer = 10, fraction = 2, message = "Geçersiz tutar formatı.")
        BigDecimal amount,

        @NotNull(message = "Gider tarihi boş olamaz.")
        LocalDateTime expenseDate,

        @NotNull(message = "Ödemeyi yapan kullanıcı belirtilmelidir.")
        Long paidByUserId,

        Long categoryId,

        // null veya boş ise tüm ev üyeleri dahil edilir
        List<Long> participantIds
) {}