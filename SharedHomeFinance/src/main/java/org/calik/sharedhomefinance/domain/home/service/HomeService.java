package org.calik.sharedhomefinance.domain.home.service;

import org.calik.sharedhomefinance.domain.home.dto.*;
import org.calik.sharedhomefinance.domain.home.entity.Home;

import java.util.List;

public interface HomeService {

    HomeResponse createHome(String firebaseUid, CreateHomeRequest request);

    HomeResponse getHome(String firebaseUid, Long homeId);

    List<HomeResponse> getMyHomes(String firebaseUid);

    HomeResponse updateHome(String firebaseUid, Long homeId, UpdateHomeRequest request);

    List<MemberResponse> getMembers(String firebaseUid, Long homeId);

    void transferOwnership(String firebaseUid, Long homeId, TransferOwnershipRequest request);

    void leaveHome(String firebaseUid, Long homeId);

    void removeMember(String firebaseUid, Long homeId, Long targetUserId);

    /** Diğer domain'lerin iç kullanımı için */
    Home getHomeById(Long homeId);

    void validateMembership(Long homeId, Long userId);

    void validateOwnership(Long homeId, Long userId);
}