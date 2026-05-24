package org.calik.sharedhomefinance.ai;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.calik.sharedhomefinance.ai.dto.*;
import org.calik.sharedhomefinance.common.exception.UnauthorizedException;
import org.calik.sharedhomefinance.common.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AIController {

    private final AIService aiService;

    /**
     * POST /api/ai/suggest-category
     * Gider başlığından sistem kategorisi önerir.
     * Örnek istek: { "title": "Şok market alışveriş" }
     */
    @PostMapping("/suggest-category")
    public ResponseEntity<ApiResponse<CategorySuggestionResponse>> suggestCategory(
            Authentication authentication,
            @Valid @RequestBody CategorySuggestionRequest request
    ) {
        CategorySuggestionResponse response = aiService.suggestCategory(
                extractUid(authentication), request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /**
     * POST /api/ai/monthly-report
     * Mevcut ay harcamalarını analiz ederek doğal dil raporu üretir.
     * Türkçe veya İngilizce (language: "TR" | "EN").
     */
    @PostMapping("/monthly-report")
    public ResponseEntity<ApiResponse<MonthlyReportResponse>> generateMonthlyReport(
            Authentication authentication,
            @Valid @RequestBody MonthlyReportRequest request
    ) {
        MonthlyReportResponse response = aiService.generateMonthlyReport(
                extractUid(authentication), request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /**
     * POST /api/ai/detect-anomaly
     * Yeni giderin kategori ortalamasına göre anormal olup olmadığını tespit eder.
     */
    @PostMapping("/detect-anomaly")
    public ResponseEntity<ApiResponse<AnomalyDetectionResponse>> detectAnomaly(
            Authentication authentication,
            @Valid @RequestBody AnomalyDetectionRequest request
    ) {
        AnomalyDetectionResponse response = aiService.detectAnomaly(
                extractUid(authentication), request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /**
     * GET /api/ai/monthly-reports/{homeId}
     * Evin daha önce üretilmiş aylık raporlarını listeler.
     */
    @GetMapping("/monthly-reports/{homeId}")
    public ResponseEntity<ApiResponse<List<MonthlyReportResponse>>> getMonthlyReports(
            Authentication authentication,
            @PathVariable Long homeId
    ) {
        List<MonthlyReportResponse> reports = aiService.getMonthlyReports(
                extractUid(authentication), homeId);
        return ResponseEntity.ok(ApiResponse.ok(reports));
    }

    private String extractUid(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new UnauthorizedException();
        }
        return authentication.getPrincipal().toString();
    }
}