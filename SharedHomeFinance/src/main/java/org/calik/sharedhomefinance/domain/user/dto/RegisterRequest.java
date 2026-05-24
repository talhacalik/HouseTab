package org.calik.sharedhomefinance.domain.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record RegisterRequest(

        String name,

        @NotBlank(message = "Email boş olamaz.")
        @Email(message = "Geçerli bir email adresi giriniz.")
        String email,

        String profilePhotoUrl
) {}