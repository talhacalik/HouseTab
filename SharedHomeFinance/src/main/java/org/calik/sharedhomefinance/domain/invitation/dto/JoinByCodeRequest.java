package org.calik.sharedhomefinance.domain.invitation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record JoinByCodeRequest(

        @NotBlank(message = "Davet kodu zorunludur")
        @Size(min = 6, max = 6, message = "Davet kodu 6 karakter olmalıdır")
        String inviteCode
) {}
