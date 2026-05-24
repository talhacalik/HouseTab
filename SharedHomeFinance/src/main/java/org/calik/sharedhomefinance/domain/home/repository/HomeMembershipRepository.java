package org.calik.sharedhomefinance.domain.home.repository;

import org.calik.sharedhomefinance.domain.home.entity.HomeMembership;
import org.calik.sharedhomefinance.domain.home.entity.HomeRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface HomeMembershipRepository extends JpaRepository<HomeMembership, Long> {

    Optional<HomeMembership> findByHomeIdAndUserId(Long homeId, Long userId);

    List<HomeMembership> findAllByHomeId(Long homeId);

    boolean existsByHomeIdAndUserId(Long homeId, Long userId);

    boolean existsByHomeIdAndUserIdAndRole(Long homeId, Long userId, HomeRole role);

    long countByHomeIdAndRole(Long homeId, HomeRole role);

    long countByHomeId(Long homeId);

    Optional<HomeMembership> findByHomeIdAndRole(Long homeId, HomeRole role);
}