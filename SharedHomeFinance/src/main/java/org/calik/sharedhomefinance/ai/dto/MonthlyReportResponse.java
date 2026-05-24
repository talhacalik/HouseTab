package org.calik.sharedhomefinance.ai.dto;

import java.time.LocalDate;

public record MonthlyReportResponse(
        Long homeId,
        int year,
        int month,
        String language,
        String report
) {
    public static MonthlyReportResponse of(Long homeId, String language, String report) {
        LocalDate now = LocalDate.now();
        return new MonthlyReportResponse(homeId, now.getYear(), now.getMonthValue(),
                language, report);
    }

    public static MonthlyReportResponse of(Long homeId, String language, String report, int year, int month) {
        return new MonthlyReportResponse(homeId, year, month, language, report);
    }
}