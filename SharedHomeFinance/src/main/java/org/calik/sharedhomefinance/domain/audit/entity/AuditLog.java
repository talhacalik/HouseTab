package org.calik.sharedhomefinance.domain.audit.entity;

import jakarta.persistence.*;
import lombok.*;
import org.calik.sharedhomefinance.domain.user.entity.User;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "entity_type", nullable = false)
    private AuditEntityType entityType;

    @Column(name = "entity_id", nullable = false)
    private Long entityId;

    @Enumerated(EnumType.STRING)
    @Column(name = "action_type", nullable = false)
    private AuditActionType actionType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "changed_by", nullable = false)
    private User changedBy;

    @Column(name = "timestamp", nullable = false, updatable = false)
    private LocalDateTime timestamp;

    /** Değişiklik anındaki entity'nin JSON hali */
    @Column(name = "json_snapshot", columnDefinition = "TEXT")
    private String jsonSnapshot;

    @PrePersist
    protected void onCreate() {
        this.timestamp = LocalDateTime.now();
    }
}
