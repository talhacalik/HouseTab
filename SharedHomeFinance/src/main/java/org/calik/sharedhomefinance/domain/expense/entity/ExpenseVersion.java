package org.calik.sharedhomefinance.domain.expense.entity;

import jakarta.persistence.*;
import lombok.*;
import org.calik.sharedhomefinance.domain.user.entity.User;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "expense_versions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExpenseVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expense_id", nullable = false)
    private Expense expense;

    @Column(name = "previous_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal previousAmount;

    @Column(name = "previous_title", nullable = false)
    private String previousTitle;

    @Column(name = "previous_description")
    private String previousDescription;

    @Column(name = "edit_note")
    private String editNote;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "edited_by", nullable = false)
    private User editedBy;

    @Column(name = "edited_at", nullable = false, updatable = false)
    private LocalDateTime editedAt;

    @PrePersist
    protected void onCreate() {
        this.editedAt = LocalDateTime.now();
    }
}