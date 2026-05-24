package org.calik.sharedhomefinance.domain.debt.controller;

import lombok.RequiredArgsConstructor;
import org.calik.sharedhomefinance.common.exception.UnauthorizedException;
import org.calik.sharedhomefinance.common.response.ApiResponse;
import org.calik.sharedhomefinance.domain.debt.dto.DebtResponse;
import org.calik.sharedhomefinance.domain.debt.dto.DebtSummaryResponse;
import org.calik.sharedhomefinance.domain.debt.service.DebtService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/homes/{homeId}")
@RequiredArgsConstructor
public class DebtController {

    private final DebtService debtService;

    /**
     * GET /api/homes/{homeId}/debts
     * Evdeki tüm PENDING borçları listeler.
     */
    @GetMapping("/debts")
    public ResponseEntity<ApiResponse<List<DebtResponse>>> getHomeDebts(
            Authentication authentication,
            @PathVariable Long homeId
    ) {
        List<DebtResponse> debts = debtService.getHomeDebts(extractUid(authentication), homeId);
        return ResponseEntity.ok(ApiResponse.ok(debts));
    }

    /**
     * GET /api/homes/{homeId}/debts/my
     * Kullanıcının bu evdeki borçlu olduğu kayıtları listeler.
     */
    @GetMapping("/debts/my")
    public ResponseEntity<ApiResponse<List<DebtResponse>>> getMyDebts(
            Authentication authentication,
            @PathVariable Long homeId
    ) {
        List<DebtResponse> debts = debtService.getMyDebts(extractUid(authentication), homeId);
        return ResponseEntity.ok(ApiResponse.ok(debts));
    }

    /**
     * GET /api/homes/{homeId}/debts/credits
     * Kullanıcının bu evdeki alacaklı olduğu kayıtları listeler.
     */
    @GetMapping("/debts/credits")
    public ResponseEntity<ApiResponse<List<DebtResponse>>> getMyCredits(
            Authentication authentication,
            @PathVariable Long homeId
    ) {
        List<DebtResponse> credits = debtService.getMyCredits(extractUid(authentication), homeId);
        return ResponseEntity.ok(ApiResponse.ok(credits));
    }

    /**
     * GET /api/homes/{homeId}/debts/summary
     * Evdeki net borç özetlerini döner (kim kime ne kadar borçlu).
     */
    @GetMapping("/debts/summary")
    public ResponseEntity<ApiResponse<List<DebtSummaryResponse>>> getHomeSummary(
            Authentication authentication,
            @PathVariable Long homeId
    ) {
        List<DebtSummaryResponse> summary = debtService.getHomeSummary(
                extractUid(authentication), homeId);
        return ResponseEntity.ok(ApiResponse.ok(summary));
    }

    /**
     * GET /api/homes/{homeId}/debts/{debtId}
     * Tek borç kaydını getirir.
     */
    @GetMapping("/debts/{debtId}")
    public ResponseEntity<ApiResponse<DebtResponse>> getDebtById(
            Authentication authentication,
            @PathVariable Long homeId,
            @PathVariable Long debtId
    ) {
        DebtResponse debt = debtService.getDebtById(extractUid(authentication), homeId, debtId);
        return ResponseEntity.ok(ApiResponse.ok(debt));
    }

    /**
     * GET /api/homes/{homeId}/expenses/{expenseId}/debts
     * Bir gidere ait borçları listeler.
     */
    @GetMapping("/expenses/{expenseId}/debts")
    public ResponseEntity<ApiResponse<List<DebtResponse>>> getDebtsByExpense(
            Authentication authentication,
            @PathVariable Long homeId,
            @PathVariable Long expenseId
    ) {
        List<DebtResponse> debts = debtService.getDebtsByExpense(
                extractUid(authentication), homeId, expenseId);
        return ResponseEntity.ok(ApiResponse.ok(debts));
    }

    /**
     * POST /api/homes/{homeId}/debts/{debtId}/mark-as-paid
     * Borrower: ödeme yaptığını bildirir (PENDING → MARKED_AS_PAID).
     */
    @PostMapping("/debts/{debtId}/mark-as-paid")
    public ResponseEntity<ApiResponse<DebtResponse>> markAsPaid(
            Authentication authentication,
            @PathVariable Long homeId,
            @PathVariable Long debtId
    ) {
        DebtResponse response = debtService.markAsPaid(extractUid(authentication), homeId, debtId);
        return ResponseEntity.ok(ApiResponse.ok("Ödeme bildirildi.", response));
    }

    /**
     * POST /api/homes/{homeId}/debts/{debtId}/confirm
     * Creditor: ödemeyi onaylar (MARKED_AS_PAID → CONFIRMED).
     */
    @PostMapping("/debts/{debtId}/confirm")
    public ResponseEntity<ApiResponse<DebtResponse>> confirmPayment(
            Authentication authentication,
            @PathVariable Long homeId,
            @PathVariable Long debtId
    ) {
        DebtResponse response = debtService.confirmPayment(
                extractUid(authentication), homeId, debtId);
        return ResponseEntity.ok(ApiResponse.ok("Ödeme onaylandı.", response));
    }

    /**
     * POST /api/homes/{homeId}/debts/{debtId}/reject
     * Creditor: ödemeyi reddeder (MARKED_AS_PAID → PENDING).
     */
    @PostMapping("/debts/{debtId}/reject")
    public ResponseEntity<ApiResponse<DebtResponse>> rejectPayment(
            Authentication authentication,
            @PathVariable Long homeId,
            @PathVariable Long debtId
    ) {
        DebtResponse response = debtService.rejectPayment(
                extractUid(authentication), homeId, debtId);
        return ResponseEntity.ok(ApiResponse.ok("Ödeme reddedildi, borç beklemeye alındı.", response));
    }

    private String extractUid(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new UnauthorizedException();
        }
        return authentication.getPrincipal().toString();
    }
}