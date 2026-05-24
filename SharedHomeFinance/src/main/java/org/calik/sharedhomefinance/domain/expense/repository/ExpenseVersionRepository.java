package org.calik.sharedhomefinance.domain.expense.repository;

import org.calik.sharedhomefinance.domain.expense.entity.ExpenseVersion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExpenseVersionRepository extends JpaRepository<ExpenseVersion, Long> {

    List<ExpenseVersion> findAllByExpenseIdOrderByEditedAtDesc(Long expenseId);
}