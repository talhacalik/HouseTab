package org.calik.sharedhomefinance.domain.category.repository;

import org.calik.sharedhomefinance.domain.category.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    /** Sistem kategorileri (home_id IS NULL) */
    List<Category> findAllByHomeIsNull();

    /** Bir eve özel kategoriler */
    List<Category> findAllByHomeId(Long homeId);

    /** Sistem + o evin kategorileri birlikte */
    @Query("SELECT c FROM Category c WHERE c.home IS NULL OR c.home.id = :homeId ORDER BY c.name ASC")
    List<Category> findAllAvailableForHome(@Param("homeId") Long homeId);

    boolean existsByNameAndHomeIsNull(String name);

    boolean existsByNameAndHomeId(String name, Long homeId);
}
