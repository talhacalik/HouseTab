package org.calik.sharedhomefinance.domain.analytics.controller;

import lombok.RequiredArgsConstructor;
import org.calik.sharedhomefinance.common.exception.UnauthorizedException;
import org.calik.sharedhomefinance.common.response.ApiResponse;
import org.calik.sharedhomefinance.domain.analytics.dto.*;
import org.calik.sharedhomefinance.domain.analytics.service.AnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/homes/{homeId}/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    /**
     * GET /api/homes/{homeId}/analytics/monthly
     * Mevcut ayın toplam harcaması ve gider sayısı.
     */
    @GetMapping("/monthly")
    public ResponseEntity<ApiResponse<MonthlyAnalyticsResponse>> getMonthlyAnalytics(
            Authentication authentication,
            @PathVariable Long homeId
    ) {
        MonthlyAnalyticsResponse response = analyticsService.getMonthlyAnalytics(
                extractUid(authentication), homeId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /**
     * GET /api/homes/{homeId}/analytics/categories
     * Mevcut ay, kategori bazlı harcama dağılımı ve yüzdeleri.
     */
    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<CategoryAnalyticsResponse>>> getCategoryAnalytics(
            Authentication authentication,
            @PathVariable Long homeId
    ) {
        List<CategoryAnalyticsResponse> response = analyticsService.getCategoryAnalytics(
                extractUid(authentication), homeId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /**
     * GET /api/homes/{homeId}/analytics/members
     * Mevcut ay, üye bazlı ödenen harcama tutarları ve yüzdeleri.
     */
    @GetMapping("/members")
    public ResponseEntity<ApiResponse<List<MemberAnalyticsResponse>>> getMemberAnalytics(
            Authentication authentication,
            @PathVariable Long homeId
    ) {
        List<MemberAnalyticsResponse> response = analyticsService.getMemberAnalytics(
                extractUid(authentication), homeId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /**
     * GET /api/homes/{homeId}/analytics/personal
     * Kullanıcının bu evdeki toplam borcu, alacağı ve net bakiyesi.
     */
    @GetMapping("/personal")
    public ResponseEntity<ApiResponse<PersonalAnalyticsResponse>> getPersonalAnalytics(
            Authentication authentication,
            @PathVariable Long homeId
    ) {
        PersonalAnalyticsResponse response = analyticsService.getPersonalAnalytics(
                extractUid(authentication), homeId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    private String extractUid(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new UnauthorizedException();
        }
        return authentication.getPrincipal().toString();
    }
}