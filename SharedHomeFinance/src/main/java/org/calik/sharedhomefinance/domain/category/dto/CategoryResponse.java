package org.calik.sharedhomefinance.domain.category.dto;

import org.calik.sharedhomefinance.domain.category.entity.Category;

public record CategoryResponse(
        Long id,
        String name,
        String icon,
        boolean systemCategory,
        Long homeId
) {
    public static CategoryResponse from(Category category) {
        return new CategoryResponse(
                category.getId(),
                category.getName(),
                category.getIcon(),
                category.isSystemCategory(),
                category.getHome() != null ? category.getHome().getId() : null
        );
    }
}