package org.calik.sharedhomefinance.ai.dto;

public record CategorySuggestionResponse(
        String suggestedCategory,
        String reasoning
) {}