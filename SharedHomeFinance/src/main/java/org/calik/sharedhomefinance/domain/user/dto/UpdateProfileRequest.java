package org.calik.sharedhomefinance.domain.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(

        @NotBlank(message = "İsim boş olamaz.")
        @Size(min = 2, max = 100, message = "İsim 2-100 karakter arasında olmalıdır.")
        String name,

        String profilePhotoUrl
) {}