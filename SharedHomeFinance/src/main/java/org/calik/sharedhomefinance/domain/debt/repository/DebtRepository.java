package org.calik.sharedhomefinance.domain.debt.repository;

import org.calik.sharedhomefinance.domain.debt.entity.Debt;
import org.calik.sharedhomefinance.domain.debt.entity.DebtStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface DebtRepository extends JpaRepository<Debt, Long> {

    List<Debt> findAllByExpenseId(Long expenseId);

    boolean existsByExpenseIdAndStatusNot(Long expenseId, DebtStatus status);

    long countByExpenseId(Long expenseId);

    long countByExpenseIdAndStatus(Long expenseId, DebtStatus status);

    void deleteAllByExpenseIdAndStatus(Long expenseId, DebtStatus status);

    /** Evdeki tüm aktif (ödenmemiş) borçlar */
    List<Debt> findAllByHomeIdAndStatus(Long homeId, DebtStatus status);

    /** Kullanıcının borçlu olduğu kayıtlar */
    List<Debt> findAllByHomeIdAndBorrowerId(Long homeId, Long borrowerId);

    /** Kullanıcının alacaklı olduğu kayıtlar */
    List<Debt> findAllByHomeIdAndCreditorId(Long homeId, Long creditorId);

    Optional<Debt> findByIdAndHomeId(Long id, Long homeId);

    /** Borçlu → alacaklı yönündeki tüm borçların özeti (analytics için) */
    @Query("""
            SELECT d FROM Debt d
            WHERE d.home.id = :homeId
              AND d.borrower.id = :borrowerId
              AND d.creditor.id = :creditorId
              AND d.status = 'PENDING'
            """)
    List<Debt> findPendingBetween(
            @Param("homeId") Long homeId,
            @Param("borrowerId") Long borrowerId,
            @Param("creditorId") Long creditorId
    );

    /** Kullanıcının toplam borcu (PENDING + MARKED_AS_PAID) */
    @Query("""
            SELECT COALESCE(SUM(d.amount), 0) FROM Debt d
            WHERE d.home.id = :homeId
              AND d.borrower.id = :userId
              AND d.status IN ('PENDING', 'MARKED_AS_PAID')
            """)
    BigDecimal sumPendingDebtByUser(
            @Param("homeId") Long homeId,
            @Param("userId") Long userId
    );

    /** Kullanıcının toplam alacağı (PENDING + MARKED_AS_PAID) */
    @Query("""
            SELECT COALESCE(SUM(d.amount), 0) FROM Debt d
            WHERE d.home.id = :homeId
              AND d.creditor.id = :userId
              AND d.status IN ('PENDING', 'MARKED_AS_PAID')
            """)
    BigDecimal sumPendingCreditByUser(
            @Param("homeId") Long homeId,
            @Param("userId") Long userId
    );
}