package org.calik.sharedhomefinance.ai.dto;

import jakarta.validation.constraints.NotNull;

public record MonthlyReportRequest(

        @NotNull(message = "Ev id'si boş olamaz.")
        Long homeId,

        /** "TR" veya "EN". Varsayılan: "TR". */
        String language,

        Integer year,
        Integer month
) {
    public String language() {
        return (language == null || language.isBlank()) ? "TR" : language.toUpperCase();
    }
}