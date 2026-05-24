package org.calik.sharedhomefinance.domain.category.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateCategoryRequest(

        @NotBlank(message = "Kategori adı boş olamaz.")
        @Size(min = 1, max = 50, message = "Kategori adı en fazla 50 karakter olabilir.")
        String name,

        @NotBlank(message = "İkon boş olamaz.")
        String icon
) {}