package org.calik.sharedhomefinance.domain.category.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.calik.sharedhomefinance.common.exception.UnauthorizedException;
import org.calik.sharedhomefinance.common.response.ApiResponse;
import org.calik.sharedhomefinance.domain.category.dto.CategoryResponse;
import org.calik.sharedhomefinance.domain.category.dto.CreateCategoryRequest;
import org.calik.sharedhomefinance.domain.category.service.CategoryService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/homes/{homeId}/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    /**
     * GET /api/homes/{homeId}/categories
     * Sistem kategorileri + o evin özel kategorilerini döner.
     * Üye olan herkes görebilir.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getAvailableCategories(
            Authentication authentication,
            @PathVariable Long homeId
    ) {
        List<CategoryResponse> categories = categoryService.getAvailableCategories(
                extractUid(authentication), homeId);
        return ResponseEntity.ok(ApiResponse.ok(categories));
    }

    /**
     * POST /api/homes/{homeId}/categories
     * O eve özel yeni kategori oluşturur. Sadece OWNER yapabilir.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<CategoryResponse>> createCustomCategory(
            Authentication authentication,
            @PathVariable Long homeId,
            @Valid @RequestBody CreateCategoryRequest request
    ) {
        CategoryResponse response = categoryService.createCustomCategory(
                extractUid(authentication), homeId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Kategori oluşturuldu.", response));
    }

    /**
     * DELETE /api/homes/{homeId}/categories/{categoryId}
     * Eve özel bir kategoriyi siler. Sistem kategorisi silinemez. Sadece OWNER yapabilir.
     */
    @DeleteMapping("/{categoryId}")
    public ResponseEntity<ApiResponse<Void>> deleteCustomCategory(
            Authentication authentication,
            @PathVariable Long homeId,
            @PathVariable Long categoryId
    ) {
        categoryService.deleteCustomCategory(extractUid(authentication), homeId, categoryId);
        return ResponseEntity.ok(ApiResponse.ok("Kategori silindi.", null));
    }

    private String extractUid(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new UnauthorizedException();
        }
        return authentication.getPrincipal().toString();
    }
}