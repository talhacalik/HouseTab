package org.calik.sharedhomefinance.ai.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record AnomalyDetectionRequest(

        @NotNull(message = "Ev id'si boş olamaz.")
        Long homeId,

        @NotBlank(message = "Gider başlığı boş olamaz.")
        String title,

        @NotNull(message = "Tutar boş olamaz.")
        @DecimalMin(value = "0.01", message = "Tutar 0'dan büyük olmalıdır.")
        @Digits(integer = 10, fraction = 2, message = "Geçersiz tutar formatı.")
        BigDecimal amount,

        @NotNull(message = "Kategori id'si boş olamaz.")
        Long categoryId
) {}