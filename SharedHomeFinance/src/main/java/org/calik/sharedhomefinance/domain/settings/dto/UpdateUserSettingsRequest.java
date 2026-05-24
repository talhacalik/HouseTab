package org.calik.sharedhomefinance.domain.settings.dto;

import jakarta.validation.constraints.NotNull;
import org.calik.sharedhomefinance.domain.settings.entity.Language;
import org.calik.sharedhomefinance.domain.settings.entity.Theme;

public record UpdateUserSettingsRequest(

        @NotNull(message = "Dil seçimi boş olamaz.")
        Language language,

        @NotNull(message = "Tema seçimi boş olamaz.")
        Theme theme,

        boolean notificationEnabled
) {}
