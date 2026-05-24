package org.calik.sharedhomefinance.domain.debt.service;

import org.calik.sharedhomefinance.domain.debt.dto.DebtResponse;
import org.calik.sharedhomefinance.domain.debt.dto.DebtSummaryResponse;
import org.calik.sharedhomefinance.domain.expense.entity.Expense;

import java.util.List;

public interface DebtService {

    /**
     * Gider kaydedilince çağrılır.
     * paidBy hariç tüm ev üyelerine eşit pay borç üretir.
     */
    void generateDebts(Expense expense);

    /** Evdeki tüm PENDING borçları listeler. */
    List<DebtResponse> getHomeDebts(String firebaseUid, Long homeId);

    /** Kullanıcının borçlu olduğu kayıtları listeler. */
    List<DebtResponse> getMyDebts(String firebaseUid, Long homeId);

    /** Kullanıcının alacaklı olduğu kayıtları listeler. */
    List<DebtResponse> getMyCredits(String firebaseUid, Long homeId);

    /** Evdeki iki kullanıcı arasındaki net borç özetleri. */
    List<DebtSummaryResponse> getHomeSummary(String firebaseUid, Long homeId);

    /** Gidere ait borçları listeler. */
    List<DebtResponse> getDebtsByExpense(String firebaseUid, Long homeId, Long expenseId);

    /** Tek borç kaydını getirir. */
    DebtResponse getDebtById(String firebaseUid, Long homeId, Long debtId);

    /** Borrower → ödeme yaptı olarak işaretler (PENDING → MARKED_AS_PAID). */
    DebtResponse markAsPaid(String firebaseUid, Long homeId, Long debtId);

    /** Creditor → ödemeyi onaylar (MARKED_AS_PAID → CONFIRMED). */
    DebtResponse confirmPayment(String firebaseUid, Long homeId, Long debtId);

    /** Creditor → ödemeyi reddeder (MARKED_AS_PAID → PENDING). */
    DebtResponse rejectPayment(String firebaseUid, Long homeId, Long debtId);
}