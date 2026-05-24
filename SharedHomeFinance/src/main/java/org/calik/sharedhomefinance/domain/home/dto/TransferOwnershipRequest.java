package org.calik.sharedhomefinance.domain.home.dto;

import jakarta.validation.constraints.NotNull;

public record TransferOwnershipRequest(

        @NotNull(message = "Yeni sahip kullanıcı id'si boş olamaz.")
        Long newOwnerUserId
) {}