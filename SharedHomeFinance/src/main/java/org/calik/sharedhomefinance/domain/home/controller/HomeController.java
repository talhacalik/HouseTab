package org.calik.sharedhomefinance.domain.home.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.calik.sharedhomefinance.common.exception.UnauthorizedException;
import org.calik.sharedhomefinance.common.response.ApiResponse;
import org.calik.sharedhomefinance.domain.home.dto.*;
import org.calik.sharedhomefinance.domain.home.service.HomeService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/homes")
@RequiredArgsConstructor
public class HomeController {

    private final HomeService homeService;

    /**
     * POST /api/homes
     * Yeni ev oluşturur. Oluşturan kullanıcı otomatik OWNER olur.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<HomeResponse>> createHome(
            Authentication authentication,
            @Valid @RequestBody CreateHomeRequest request
    ) {
        HomeResponse response = homeService.createHome(extractUid(authentication), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Ev oluşturuldu.", response));
    }

    /**
     * GET /api/homes/my
     * Kullanıcının üye olduğu tüm evleri listeler.
     */
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<HomeResponse>>> getMyHomes(Authentication authentication) {
        List<HomeResponse> homes = homeService.getMyHomes(extractUid(authentication));
        return ResponseEntity.ok(ApiResponse.ok(homes));
    }

    /**
     * GET /api/homes/{homeId}
     * Evin detaylarını getirir. Sadece üyeler erişebilir.
     */
    @GetMapping("/{homeId}")
    public ResponseEntity<ApiResponse<HomeResponse>> getHome(
            Authentication authentication,
            @PathVariable Long homeId
    ) {
        HomeResponse response = homeService.getHome(extractUid(authentication), homeId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /**
     * PUT /api/homes/{homeId}
     * Ev bilgilerini günceller. Sadece OWNER yapabilir.
     */
    @PutMapping("/{homeId}")
    public ResponseEntity<ApiResponse<HomeResponse>> updateHome(
            Authentication authentication,
            @PathVariable Long homeId,
            @Valid @RequestBody UpdateHomeRequest request
    ) {
        HomeResponse response = homeService.updateHome(extractUid(authentication), homeId, request);
        return ResponseEntity.ok(ApiResponse.ok("Ev güncellendi.", response));
    }

    /**
     * GET /api/homes/{homeId}/members
     * Ev üyelerini listeler. Sadece üyeler görebilir.
     */
    @GetMapping("/{homeId}/members")
    public ResponseEntity<ApiResponse<List<MemberResponse>>> getMembers(
            Authentication authentication,
            @PathVariable Long homeId
    ) {
        List<MemberResponse> members = homeService.getMembers(extractUid(authentication), homeId);
        return ResponseEntity.ok(ApiResponse.ok(members));
    }

    /**
     * POST /api/homes/{homeId}/transfer-ownership
     * Sahipliği başka bir üyeye devreder. Sadece OWNER yapabilir.
     */
    @PostMapping("/{homeId}/transfer-ownership")
    public ResponseEntity<ApiResponse<Void>> transferOwnership(
            Authentication authentication,
            @PathVariable Long homeId,
            @Valid @RequestBody TransferOwnershipRequest request
    ) {
        homeService.transferOwnership(extractUid(authentication), homeId, request);
        return ResponseEntity.ok(ApiResponse.ok("Sahiplik devredildi.", null));
    }

    /**
     * DELETE /api/homes/{homeId}/members/{userId}
     * OWNER, bir üyeyi evden çıkarır.
     */
    @DeleteMapping("/{homeId}/members/{userId}")
    public ResponseEntity<ApiResponse<Void>> removeMember(
            Authentication authentication,
            @PathVariable Long homeId,
            @PathVariable Long userId
    ) {
        homeService.removeMember(extractUid(authentication), homeId, userId);
        return ResponseEntity.ok(ApiResponse.ok("Üye evden çıkarıldı.", null));
    }

    /**
     * DELETE /api/homes/{homeId}/leave
     * Kullanıcı evi terk eder. OWNER ise önce devir zorunludur.
     */
    @DeleteMapping("/{homeId}/leave")
    public ResponseEntity<ApiResponse<Void>> leaveHome(
            Authentication authentication,
            @PathVariable Long homeId
    ) {
        homeService.leaveHome(extractUid(authentication), homeId);
        return ResponseEntity.ok(ApiResponse.ok("Evden ayrıldınız.", null));
    }

    private String extractUid(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new UnauthorizedException();
        }
        return authentication.getPrincipal().toString();
    }
}