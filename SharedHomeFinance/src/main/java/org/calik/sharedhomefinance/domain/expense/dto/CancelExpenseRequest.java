package org.calik.sharedhomefinance.domain.expense.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CancelExpenseRequest(

        @NotBlank(message = "İptal notu zorunludur.")
        @Size(min = 3, max = 255, message = "İptal notu 3-255 karakter arasında olmalıdır.")
        String cancelNote
) {}