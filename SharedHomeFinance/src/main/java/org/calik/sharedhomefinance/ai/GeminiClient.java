package org.calik.sharedhomefinance.ai;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Component
public class GeminiClient {

    private static final Logger log = LoggerFactory.getLogger(GeminiClient.class);

    private static final String BASE_URL =
            "https://generativelanguage.googleapis.com/v1/models/%s:generateContent?key=%s";

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.model}")
    private String model;

    private final RestTemplate restTemplate;

    public GeminiClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record GeminiResponse(List<Candidate> candidates) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record Candidate(Content content) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record Content(List<Part> parts) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record Part(String text) {}

    public String generate(String prompt) {
        String url = String.format(BASE_URL, model, apiKey);

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(
                                Map.of("text", prompt)
                        ))
                )
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        try {
            ResponseEntity<GeminiResponse> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    new HttpEntity<>(requestBody, headers),
                    GeminiResponse.class
            );

            return extractText(response.getBody());

        } catch (Exception ex) {
            log.error("Gemini API istegi basarisiz: {}", ex.getMessage());
            return "";
        }
    }

    private String extractText(GeminiResponse body) {
        if (body == null || body.candidates() == null || body.candidates().isEmpty()) return "";
        Content content = body.candidates().get(0).content();
        if (content == null || content.parts() == null || content.parts().isEmpty()) return "";
        String text = content.parts().get(0).text();
        return text == null ? "" : text.strip();
    }
}