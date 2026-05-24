package org.calik.sharedhomefinance.domain.invitation.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record CreateInvitationRequest(

        @NotBlank(message = "Email boş olamaz.")
        @Email(message = "Geçerli bir email adresi giriniz.")
        String email
) {}