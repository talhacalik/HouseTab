package org.calik.sharedhomefinance.domain.home.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.calik.sharedhomefinance.domain.home.entity.SplitType;

public record UpdateHomeRequest(

        @NotBlank(message = "Ev adı boş olamaz.")
        @Size(min = 2, max = 100, message = "Ev adı 2-100 karakter arasında olmalıdır.")
        String name,

        @Size(max = 255, message = "Açıklama en fazla 255 karakter olabilir.")
        String description,

        SplitType defaultSplitType,

        boolean allowMemberExpenseEdit
) {}