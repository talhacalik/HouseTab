package org.calik.sharedhomefinance.ai;

import jakarta.persistence.*;
import lombok.*;
import org.calik.sharedhomefinance.domain.home.entity.Home;

import java.time.LocalDateTime;

@Entity
@Table(name = "monthly_reports",
       uniqueConstraints = @UniqueConstraint(columnNames = {"home_id", "year", "month", "language"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MonthlyReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "home_id", nullable = false)
    private Home home;

    @Column(nullable = false)
    private int year;

    @Column(nullable = false)
    private int month;

    @Column(nullable = false, length = 10)
    private String language;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String report;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
