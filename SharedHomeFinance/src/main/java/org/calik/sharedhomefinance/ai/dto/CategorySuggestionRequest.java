package org.calik.sharedhomefinance.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CategorySuggestionRequest(

        @NotBlank(message = "Gider başlığı boş olamaz.")
        @Size(min = 2, max = 150, message = "Başlık 2-150 karakter arasında olmalıdır.")
        String title
) {}