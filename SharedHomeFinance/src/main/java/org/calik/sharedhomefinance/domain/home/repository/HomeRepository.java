package org.calik.sharedhomefinance.domain.home.repository;

import org.calik.sharedhomefinance.domain.home.entity.Home;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface HomeRepository extends JpaRepository<Home, Long> {

    @Query("""
            SELECT h FROM Home h
            JOIN HomeMembership m ON m.home = h
            WHERE m.user.id = :userId
            """)
    List<Home> findAllByMemberUserId(@Param("userId") Long userId);
}