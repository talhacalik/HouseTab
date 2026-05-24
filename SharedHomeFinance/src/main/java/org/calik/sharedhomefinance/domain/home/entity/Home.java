package org.calik.sharedhomefinance.domain.home.entity;

import jakarta.persistence.*;
import lombok.*;
import org.calik.sharedhomefinance.domain.user.entity.User;

import java.time.LocalDateTime;

@Entity
@Table(name = "homes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Home {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "default_split_type", nullable = false)
    private SplitType defaultSplitType;

    @Column(name = "allow_member_expense_edit", nullable = false)
    private boolean allowMemberExpenseEdit;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}