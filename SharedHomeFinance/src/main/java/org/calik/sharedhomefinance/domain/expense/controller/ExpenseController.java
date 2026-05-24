package org.calik.sharedhomefinance.domain.expense.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.calik.sharedhomefinance.common.exception.UnauthorizedException;
import org.calik.sharedhomefinance.common.response.ApiResponse;
import org.calik.sharedhomefinance.domain.expense.dto.*;
import org.calik.sharedhomefinance.domain.expense.service.ExpenseService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/homes/{homeId}/expenses")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;

    /**
     * POST /api/homes/{homeId}/expenses
     * Yeni gider ekler. Tüm üyeler ekleyebilir.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<ExpenseResponse>> createExpense(
            Authentication authentication,
            @PathVariable Long homeId,
            @Valid @RequestBody CreateExpenseRequest request
    ) {
        ExpenseResponse response = expenseService.createExpense(
                extractUid(authentication), homeId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Gider eklendi.", response));
    }

    /**
     * GET /api/homes/{homeId}/expenses
     * İptal edilmemiş giderleri sayfalı listeler.
     * Varsayılan: expenseDate DESC, sayfa boyutu 20.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<ExpenseResponse>>> getExpenses(
            Authentication authentication,
            @PathVariable Long homeId,
            @PageableDefault(size = 20, sort = "expenseDate", direction = Sort.Direction.DESC)
            Pageable pageable
    ) {
        Page<ExpenseResponse> page = expenseService.getExpenses(
                extractUid(authentication), homeId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(page));
    }

    /**
     * GET /api/homes/{homeId}/expenses/category/{categoryId}
     * Kategoriye göre filtrelenmiş harcamaları sayfalı listeler.
     */
    @GetMapping("/category/{categoryId}")
    public ResponseEntity<ApiResponse<Page<ExpenseResponse>>> getExpensesByCategory(
            Authentication authentication,
            @PathVariable Long homeId,
            @PathVariable Long categoryId,
            @PageableDefault(size = 20, sort = "expenseDate", direction = Sort.Direction.DESC)
            Pageable pageable
    ) {
        Page<ExpenseResponse> page = expenseService.getExpensesByCategory(
                extractUid(authentication), homeId, categoryId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(page));
    }

    /**
     * GET /api/homes/{homeId}/expenses/{expenseId}
     * Gider detayını getirir.
     */
    @GetMapping("/{expenseId}")
    public ResponseEntity<ApiResponse<ExpenseResponse>> getExpense(
            Authentication authentication,
            @PathVariable Long homeId,
            @PathVariable Long expenseId
    ) {
        ExpenseResponse response = expenseService.getExpense(
                extractUid(authentication), homeId, expenseId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /**
     * PUT /api/homes/{homeId}/expenses/{expenseId}
     * Gideri günceller. Yetki kuralı: OWNER her zaman,
     * MEMBER yalnızca kendi gideri + allow_member_expense_edit=true ise.
     */
    @PutMapping("/{expenseId}")
    public ResponseEntity<ApiResponse<ExpenseResponse>> updateExpense(
            Authentication authentication,
            @PathVariable Long homeId,
            @PathVariable Long expenseId,
            @Valid @RequestBody UpdateExpenseRequest request
    ) {
        ExpenseResponse response = expenseService.updateExpense(
                extractUid(authentication), homeId, expenseId, request);
        return ResponseEntity.ok(ApiResponse.ok("Gider güncellendi.", response));
    }

    /**
     * POST /api/homes/{homeId}/expenses/{expenseId}/cancel
     * Gideri iptal eder. cancel_note zorunludur. Silme yoktur.
     */
    @PostMapping("/{expenseId}/cancel")
    public ResponseEntity<ApiResponse<ExpenseResponse>> cancelExpense(
            Authentication authentication,
            @PathVariable Long homeId,
            @PathVariable Long expenseId,
            @Valid @RequestBody CancelExpenseRequest request
    ) {
        ExpenseResponse response = expenseService.cancelExpense(
                extractUid(authentication), homeId, expenseId, request);
        return ResponseEntity.ok(ApiResponse.ok("Gider iptal edildi.", response));
    }

    /**
     * GET /api/homes/{homeId}/expenses/{expenseId}/history
     * Giderin düzenleme geçmişini döner.
     */
    @GetMapping("/{expenseId}/history")
    public ResponseEntity<ApiResponse<List<ExpenseVersionResponse>>> getExpenseHistory(
            Authentication authentication,
            @PathVariable Long homeId,
            @PathVariable Long expenseId
    ) {
        List<ExpenseVersionResponse> history = expenseService.getExpenseHistory(
                extractUid(authentication), homeId, expenseId);
        return ResponseEntity.ok(ApiResponse.ok(history));
    }

    private String extractUid(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new UnauthorizedException();
        }
        return authentication.getPrincipal().toString();
    }
}