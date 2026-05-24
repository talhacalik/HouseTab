package org.calik.sharedhomefinance.domain.expense.repository;

import org.calik.sharedhomefinance.domain.expense.entity.Expense;
import org.calik.sharedhomefinance.domain.expense.entity.ExpenseStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    Page<Expense> findAllByHomeIdAndStatusNot(Long homeId, ExpenseStatus status, Pageable pageable);

    Page<Expense> findAllByHomeId(Long homeId, Pageable pageable);

    Optional<Expense> findByIdAndHomeId(Long id, Long homeId);

    @Query("""
            SELECT e FROM Expense e
            WHERE e.home.id = :homeId
              AND e.status != 'CANCELLED'
              AND e.expenseDate BETWEEN :start AND :end
            ORDER BY e.expenseDate DESC
            """)
    List<Expense> findByHomeIdAndDateRange(
            @Param("homeId") Long homeId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    @Query("""
            SELECT e FROM Expense e
            WHERE e.home.id = :homeId
              AND e.status != 'CANCELLED'
              AND e.paidBy.id = :userId
            """)
    List<Expense> findByHomeIdAndPaidBy(
            @Param("homeId") Long homeId,
            @Param("userId") Long userId
    );

    /** Evin tüm zamanki toplam harcaması (ACTIVE + EDITED) */
    @Query("""
            SELECT COALESCE(SUM(e.amount), 0) FROM Expense e
            WHERE e.home.id = :homeId
              AND e.status IN ('ACTIVE', 'EDITED')
            """)
    java.math.BigDecimal sumAllByHomeId(@Param("homeId") Long homeId);

    /** Aylık toplam harcama (ACTIVE + EDITED) */
    @Query("""
            SELECT COALESCE(SUM(e.amount), 0) FROM Expense e
            WHERE e.home.id = :homeId
              AND e.status IN ('ACTIVE', 'EDITED')
              AND e.expenseDate BETWEEN :start AND :end
            """)
    BigDecimal sumByHomeIdAndDateRange(
            @Param("homeId") Long homeId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    /** Kullanıcının dahil olduğu harcamaların aylık toplamı */
    @Query("""
            SELECT COALESCE(SUM(e.amount), 0) FROM Expense e
            WHERE e.home.id = :homeId
              AND e.status IN ('ACTIVE', 'EDITED')
              AND e.expenseDate BETWEEN :start AND :end
              AND (
                e.createdBy.id = :userId
                OR e.paidBy.id = :userId
                OR EXISTS (SELECT d FROM Debt d WHERE d.expense = e AND d.borrower.id = :userId)
              )
            """)
    BigDecimal sumByHomeIdAndDateRangeForUser(
            @Param("homeId") Long homeId,
            @Param("userId") Long userId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    /** Kategori bazlı harcama toplamları [categoryId, categoryName, toplam] */
    @Query("""
            SELECT e.category.id, e.category.name, SUM(e.amount)
            FROM Expense e
            WHERE e.home.id = :homeId
              AND e.status IN ('ACTIVE', 'EDITED')
              AND e.expenseDate BETWEEN :start AND :end
              AND e.category IS NOT NULL
            GROUP BY e.category.id, e.category.name
            """)
    List<Object[]> sumByCategoryAndDateRange(
            @Param("homeId") Long homeId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    /** Kişi bazlı ödenen harcama toplamları [userId, userName, toplam] */
    @Query("""
            SELECT e.paidBy.id, e.paidBy.name, SUM(e.amount)
            FROM Expense e
            WHERE e.home.id = :homeId
              AND e.status IN ('ACTIVE', 'EDITED')
              AND e.expenseDate BETWEEN :start AND :end
            GROUP BY e.paidBy.id, e.paidBy.name
            """)
    List<Object[]> sumByMemberAndDateRange(
            @Param("homeId") Long homeId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    /** Anomali tespiti: belirli kategori + ev için dönem toplamı */
    @Query("""
            SELECT COALESCE(SUM(e.amount), 0) FROM Expense e
            WHERE e.home.id = :homeId
              AND e.category.id = :categoryId
              AND e.status IN ('ACTIVE', 'EDITED')
              AND e.expenseDate BETWEEN :start AND :end
            """)
    BigDecimal sumByCategoryHomeAndDateRange(
            @Param("homeId") Long homeId,
            @Param("categoryId") Long categoryId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    /** Kategori bazlı sayfalı harcama listesi */
    @Query("""
        SELECT e FROM Expense e
        WHERE e.home.id = :homeId
          AND e.category.id = :categoryId
          AND e.status != 'CANCELLED'
        ORDER BY e.expenseDate DESC
        """)
    Page<Expense> findAllByHomeIdAndCategoryId(
            @Param("homeId") Long homeId,
            @Param("categoryId") Long categoryId,
            Pageable pageable
    );

    /** Kullanıcının oluşturduğu, ödediği veya borçlu/alacaklı olduğu harcamalar */
    @Query(value = """
        SELECT DISTINCT e FROM Expense e
        LEFT JOIN e.participantIds p
        WHERE e.home.id = :homeId
          AND (
            e.createdBy.id = :userId
            OR e.paidBy.id = :userId
            OR p = :userId
            OR EXISTS (SELECT d FROM Debt d WHERE d.expense = e AND d.borrower.id = :userId)
          )
        """,
        countQuery = """
        SELECT COUNT(DISTINCT e) FROM Expense e
        LEFT JOIN e.participantIds p
        WHERE e.home.id = :homeId
          AND (
            e.createdBy.id = :userId
            OR e.paidBy.id = :userId
            OR p = :userId
            OR EXISTS (SELECT d FROM Debt d WHERE d.expense = e AND d.borrower.id = :userId)
          )
        """)
    Page<Expense> findByHomeIdForUser(
            @Param("homeId") Long homeId,
            @Param("userId") Long userId,
            Pageable pageable
    );

    /** Kategori + kullanıcı filtreli sayfalı harcama listesi */
    @Query(value = """
        SELECT DISTINCT e FROM Expense e
        LEFT JOIN e.participantIds p
        WHERE e.home.id = :homeId
          AND e.category.id = :categoryId
          AND e.status != 'CANCELLED'
          AND (
            e.createdBy.id = :userId
            OR e.paidBy.id = :userId
            OR p = :userId
            OR EXISTS (SELECT d FROM Debt d WHERE d.expense = e AND d.borrower.id = :userId)
          )
        """,
        countQuery = """
        SELECT COUNT(DISTINCT e) FROM Expense e
        LEFT JOIN e.participantIds p
        WHERE e.home.id = :homeId
          AND e.category.id = :categoryId
          AND e.status != 'CANCELLED'
          AND (
            e.createdBy.id = :userId
            OR e.paidBy.id = :userId
            OR p = :userId
            OR EXISTS (SELECT d FROM Debt d WHERE d.expense = e AND d.borrower.id = :userId)
          )
        """)
    Page<Expense> findByHomeIdAndCategoryIdForUser(
            @Param("homeId") Long homeId,
            @Param("categoryId") Long categoryId,
            @Param("userId") Long userId,
            Pageable pageable
    );
}
