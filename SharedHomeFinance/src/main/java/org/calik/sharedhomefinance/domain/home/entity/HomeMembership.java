package org.calik.sharedhomefinance.domain.home.entity;

import jakarta.persistence.*;
import lombok.*;
import org.calik.sharedhomefinance.domain.user.entity.User;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "home_memberships",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_home_user",
                columnNames = {"home_id", "user_id"}
        )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HomeMembership {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "home_id", nullable = false)
    private Home home;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private HomeRole role;

    @Column(name = "joined_at", nullable = false, updatable = false)
    private LocalDateTime joinedAt;

    @PrePersist
    protected void onCreate() {
        this.joinedAt = LocalDateTime.now();
    }
}