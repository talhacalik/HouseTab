package org.calik.sharedhomefinance.domain.expense.service;

import org.calik.sharedhomefinance.domain.expense.dto.*;
import org.calik.sharedhomefinance.domain.expense.entity.Expense;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ExpenseService {

    ExpenseResponse createExpense(String firebaseUid, Long homeId, CreateExpenseRequest request);

    ExpenseResponse getExpense(String firebaseUid, Long homeId, Long expenseId);

    Page<ExpenseResponse> getExpenses(String firebaseUid, Long homeId, Pageable pageable);

    Page<ExpenseResponse> getExpensesByCategory(String firebaseUid, Long homeId, Long categoryId, Pageable pageable);

    ExpenseResponse updateExpense(String firebaseUid, Long homeId, Long expenseId,
                                  UpdateExpenseRequest request);

    ExpenseResponse cancelExpense(String firebaseUid, Long homeId, Long expenseId,
                                  CancelExpenseRequest request);

    List<ExpenseVersionResponse> getExpenseHistory(String firebaseUid, Long homeId, Long expenseId);

    /** Diğer domain'lerin iç kullanımı için — entity döner. */
    Expense getExpenseEntityById(Long expenseId, Long homeId);
}
