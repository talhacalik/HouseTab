package org.calik.sharedhomefinance.domain.home.service;

import lombok.RequiredArgsConstructor;
import org.calik.sharedhomefinance.common.exception.BusinessException;
import org.calik.sharedhomefinance.common.exception.ForbiddenException;
import org.calik.sharedhomefinance.common.exception.ResourceNotFoundException;
import org.calik.sharedhomefinance.domain.home.dto.*;
import org.calik.sharedhomefinance.domain.home.entity.Home;
import org.calik.sharedhomefinance.domain.home.entity.HomeMembership;
import org.calik.sharedhomefinance.domain.home.entity.HomeRole;
import org.calik.sharedhomefinance.domain.home.entity.SplitType;
import org.calik.sharedhomefinance.domain.expense.repository.ExpenseRepository;
import org.calik.sharedhomefinance.domain.home.repository.HomeMembershipRepository;
import org.calik.sharedhomefinance.domain.home.repository.HomeRepository;
import org.calik.sharedhomefinance.domain.user.entity.User;
import org.calik.sharedhomefinance.domain.user.service.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class HomeServiceImpl implements HomeService {

    private final HomeRepository homeRepository;
    private final HomeMembershipRepository membershipRepository;
    private final UserService userService;
    private final ExpenseRepository expenseRepository;

    @Override
    @Transactional
    public HomeResponse createHome(String firebaseUid, CreateHomeRequest request) {
        User owner = userService.getByFirebaseUid(firebaseUid);

        SplitType splitType = request.defaultSplitType() != null
                ? request.defaultSplitType()
                : SplitType.EQUAL;

        Home home = Home.builder()
                .name(request.name())
                .description(request.description())
                .defaultSplitType(splitType)
                .allowMemberExpenseEdit(request.allowMemberExpenseEdit())
                .createdBy(owner)
                .build();

        homeRepository.save(home);

        HomeMembership membership = HomeMembership.builder()
                .home(home)
                .user(owner)
                .role(HomeRole.OWNER)
                .build();

        membershipRepository.save(membership);

        return HomeResponse.from(home, HomeRole.OWNER, 1);
    }

    @Override
    @Transactional(readOnly = true)
    public HomeResponse getHome(String firebaseUid, Long homeId) {
        User user = userService.getByFirebaseUid(firebaseUid);
        Home home = getHomeById(homeId);
        HomeMembership membership = membershipRepository.findByHomeIdAndUserId(homeId, user.getId())
                .orElseThrow(() -> new ForbiddenException("Bu eve erişim yetkiniz yok."));
        int memberCount = (int) membershipRepository.countByHomeId(homeId);
        java.math.BigDecimal totalExpense = expenseRepository.sumAllByHomeId(homeId);
        return HomeResponse.from(home, membership.getRole(), memberCount, totalExpense);
    }

    @Override
    @Transactional(readOnly = true)
    public List<HomeResponse> getMyHomes(String firebaseUid) {
        User user = userService.getByFirebaseUid(firebaseUid);
        return homeRepository.findAllByMemberUserId(user.getId())
                .stream()
                .map(home -> {
                    HomeMembership membership = membershipRepository
                            .findByHomeIdAndUserId(home.getId(), user.getId())
                            .orElseThrow();
                    int memberCount = (int) membershipRepository.countByHomeId(home.getId());
                    return HomeResponse.from(home, membership.getRole(), memberCount);
                })
                .toList();
    }

    @Override
    @Transactional
    public HomeResponse updateHome(String firebaseUid, Long homeId, UpdateHomeRequest request) {
        User user = userService.getByFirebaseUid(firebaseUid);
        Home home = getHomeById(homeId);
        validateOwnership(homeId, user.getId());

        home.setName(request.name());
        home.setDescription(request.description());
        if (request.defaultSplitType() != null) {
            home.setDefaultSplitType(request.defaultSplitType());
        }
        home.setAllowMemberExpenseEdit(request.allowMemberExpenseEdit());

        Home saved = homeRepository.save(home);
        int memberCount = (int) membershipRepository.countByHomeId(homeId);
        return HomeResponse.from(saved, HomeRole.OWNER, memberCount);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MemberResponse> getMembers(String firebaseUid, Long homeId) {
        User user = userService.getByFirebaseUid(firebaseUid);
        validateMembership(homeId, user.getId());
        return membershipRepository.findAllByHomeId(homeId)
                .stream()
                .map(MemberResponse::from)
                .toList();
    }

    @Override
    @Transactional
    public void transferOwnership(String firebaseUid, Long homeId, TransferOwnershipRequest request) {
        User currentOwner = userService.getByFirebaseUid(firebaseUid);
        validateOwnership(homeId, currentOwner.getId());

        if (currentOwner.getId().equals(request.newOwnerUserId())) {
            throw new BusinessException("Sahiplik zaten size ait.", "ALREADY_OWNER");
        }

        HomeMembership newOwnerMembership = membershipRepository
                .findByHomeIdAndUserId(homeId, request.newOwnerUserId())
                .orElseThrow(() -> new BusinessException(
                        "Belirtilen kullanıcı bu evin üyesi değil.",
                        "USER_NOT_MEMBER"
                ));

        HomeMembership currentOwnerMembership = membershipRepository
                .findByHomeIdAndUserId(homeId, currentOwner.getId())
                .orElseThrow();

        currentOwnerMembership.setRole(HomeRole.MEMBER);
        newOwnerMembership.setRole(HomeRole.OWNER);

        membershipRepository.save(currentOwnerMembership);
        membershipRepository.save(newOwnerMembership);
    }

    @Override
    @Transactional
    public void leaveHome(String firebaseUid, Long homeId) {
        User user = userService.getByFirebaseUid(firebaseUid);
        HomeMembership membership = membershipRepository
                .findByHomeIdAndUserId(homeId, user.getId())
                .orElseThrow(() -> new BusinessException(
                        "Bu evin üyesi değilsiniz.",
                        "NOT_A_MEMBER"
                ));

        if (membership.getRole() == HomeRole.OWNER) {
            long memberCount = membershipRepository.countByHomeIdAndRole(homeId, HomeRole.MEMBER);
            if (memberCount > 0) {
                throw new BusinessException(
                        "Evden ayrılmadan önce sahipliği başka bir üyeye devretmelisiniz.",
                        "OWNER_MUST_TRANSFER"
                );
            }
        }

        membershipRepository.delete(membership);
    }

    @Override
    @Transactional
    public void removeMember(String firebaseUid, Long homeId, Long targetUserId) {
        User owner = userService.getByFirebaseUid(firebaseUid);
        validateOwnership(homeId, owner.getId());

        if (owner.getId().equals(targetUserId)) {
            throw new BusinessException(
                    "Kendinizi üyelikten çıkaramazsınız. Bunun yerine evi terk edin.",
                    "CANNOT_REMOVE_SELF"
            );
        }

        HomeMembership membership = membershipRepository
                .findByHomeIdAndUserId(homeId, targetUserId)
                .orElseThrow(() -> new BusinessException(
                        "Belirtilen kullanıcı bu evin üyesi değil.",
                        "USER_NOT_MEMBER"
                ));

        membershipRepository.delete(membership);
    }

    @Override
    @Transactional(readOnly = true)
    public Home getHomeById(Long homeId) {
        return homeRepository.findById(homeId)
                .orElseThrow(() -> new ResourceNotFoundException("Ev", homeId));
    }

    @Override
    public void validateMembership(Long homeId, Long userId) {
        if (!membershipRepository.existsByHomeIdAndUserId(homeId, userId)) {
            throw new ForbiddenException("Bu eve erişim yetkiniz yok.");
        }
    }

    @Override
    public void validateOwnership(Long homeId, Long userId) {
        if (!membershipRepository.existsByHomeIdAndUserIdAndRole(homeId, userId, HomeRole.OWNER)) {
            throw new ForbiddenException("Bu işlem için ev sahibi olmanız gerekir.");
        }
    }
}