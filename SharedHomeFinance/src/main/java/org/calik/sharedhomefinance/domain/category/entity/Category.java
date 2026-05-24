package org.calik.sharedhomefinance.domain.category.entity;

import jakarta.persistence.*;
import lombok.*;
import org.calik.sharedhomefinance.domain.home.entity.Home;

@Entity
@Table(name = "categories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String icon;

    /**
     * null → sistem kategorisi (tüm evlere görünür)
     * dolu → o eve özel kategori
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "home_id")
    private Home home;

    public boolean isSystemCategory() {
        return this.home == null;
    }
}