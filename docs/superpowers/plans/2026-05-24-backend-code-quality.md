# Backend Code Quality Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Kalan beş backend sağlık sorununu gider: güvenlik başlıkları, sayfalama limiti, Gemini tip güvenliği, aylık rapor bildirimi ve servis katmanı unit testleri.

**Architecture:** Her task bağımsızdır; sıralı uygulama gerekmez. Test task'ı Mockito kullanır; entegrasyon testi yoktur, Spring context açılmaz. Gemini response DTO'ları GeminiClient içinde private record olarak tanımlanır.

**Tech Stack:** Spring Boot 3.2.5, Java 21, JUnit 5, Mockito, Spring Security

---

## Dosya Haritası

| Dosya | İşlem |
|-------|-------|
| `SharedHomeFinance/src/main/java/.../config/SecurityConfig.java` | Güncelle — headers + CORS |
| `SharedHomeFinance/src/main/resources/application.properties` | Güncelle — pageable max-page-size |
| `SharedHomeFinance/src/main/java/.../ai/GeminiClient.java` | Güncelle — typed response DTOs |
| `SharedHomeFinance/src/main/java/.../notification/entity/NotificationType.java` | Güncelle — MONTHLY_REPORT ekle |
| `SharedHomeFinance/src/main/java/.../home/repository/HomeMembershipRepository.java` | Güncelle — findByHomeIdAndRole ekle |
| `SharedHomeFinance/src/main/java/.../ai/GeminiAIService.java` | Güncelle — monthly report TODO implement |
| `SharedHomeFinance/src/test/java/.../domain/user/service/UserServiceImplTest.java` | Oluştur — unit testler |

---

## Task 1: SecurityConfig — Security Headers + CORS

**Files:**
- Modify: `SharedHomeFinance/src/main/java/org/calik/sharedhomefinance/config/SecurityConfig.java`

Spring Security varsayılan olarak bazı güvenlik başlıklarını ekler ama `X-Frame-Options` ve CORS ayarları eksik.

- [ ] **Step 1: SecurityConfig.java'yı oku**

`c:\Users\talha\IdeaProjects\HouseTab\SharedHomeFinance\src\main\java\org\calik\sharedhomefinance\config\SecurityConfig.java` dosyasını oku.

- [ ] **Step 2: SecurityConfig.java'yı güncelle**

```java
package org.calik.sharedhomefinance.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final FirebaseTokenFilter firebaseTokenFilter;

    public SecurityConfig(FirebaseTokenFilter firebaseTokenFilter) {
        this.firebaseTokenFilter = firebaseTokenFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .headers(headers -> headers
                        .frameOptions(frame -> frame.deny())
                        .contentTypeOptions(Customizer.withDefaults())
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/actuator/health").permitAll()
                        .anyRequest().authenticated()
                )
                .addFilterBefore(firebaseTokenFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }
}
```

- [ ] **Step 3: Backend'i başlat ve sağlık endpoint'ini kontrol et**

```bash
curl -i http://localhost:8080/actuator/health
```

Beklenen response header'larında: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`

---

## Task 2: Sayfalama Max Page Size

**Files:**
- Modify: `SharedHomeFinance/src/main/resources/application.properties`

`@PageableDefault` varsayılan boyutu sınırlar ama client `size=10000` parametresi gönderebilir. Spring Data Web bunu otomatik kırpar.

- [ ] **Step 1: application.properties'i oku**

`c:\Users\talha\IdeaProjects\HouseTab\SharedHomeFinance\src\main\resources\application.properties` dosyasını oku.

- [ ] **Step 2: Pageable max page size ekle**

`server.tomcat.max-http-post-size=1048576` satırından sonraya şunu ekle:

```properties
spring.data.web.pageable.max-page-size=100
```

- [ ] **Step 3: Doğrula**

Dosyayı oku ve satırın eklendiğini doğrula.

---

## Task 3: GeminiClient — Typed Response DTOs

**Files:**
- Modify: `SharedHomeFinance/src/main/java/org/calik/sharedhomefinance/ai/GeminiClient.java`

Mevcut kod `ResponseEntity<Map>` raw type kullanıyor ve `@SuppressWarnings("unchecked")` ile cast yapıyor. Gemini API yanıt yapısına uygun private record'lar tanımlanarak cast'ler tamamen ortadan kalkar.

- [ ] **Step 1: GeminiClient.java'yı oku**

`c:\Users\talha\IdeaProjects\HouseTab\SharedHomeFinance\src\main\java\org\calik\sharedhomefinance\ai\GeminiClient.java` dosyasını oku.

- [ ] **Step 2: GeminiClient.java'yı güncelle**

```java
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
```

- [ ] **Step 3: Derleme hatası yok mu doğrula**

```bash
cd SharedHomeFinance && ./mvnw compile -q
```

Beklenen: hata yok, başarıyla derlendi.

---

## Task 4: Aylık Rapor Bildirimi — TODO'yu Tamamla

**Files:**
- Modify: `SharedHomeFinance/src/main/java/org/calik/sharedhomefinance/domain/notification/entity/NotificationType.java`
- Modify: `SharedHomeFinance/src/main/java/org/calik/sharedhomefinance/domain/home/repository/HomeMembershipRepository.java`
- Modify: `SharedHomeFinance/src/main/java/org/calik/sharedhomefinance/ai/GeminiAIService.java`

`generateMonthlyReportsForAllHomes()` metodunda `// TODO: Adım 9 — NotificationService ile OWNER'a FCM bildirimi gönder` satırı var. OWNER'ı bulup `sendToUser` çağrısı yapılacak.

- [ ] **Step 1: NotificationType enum'a MONTHLY_REPORT ekle**

`c:\Users\talha\IdeaProjects\HouseTab\SharedHomeFinance\src\main\java\org\calik\sharedhomefinance\domain\notification\entity\NotificationType.java` dosyasını oku, sonra güncelle:

```java
package org.calik.sharedhomefinance.domain.notification.entity;

public enum NotificationType {
    EXPENSE_ADDED,
    EXPENSE_UPDATED,
    EXPENSE_CANCELLED,
    DEBT_MARKED_AS_PAID,
    DEBT_CONFIRMED,
    DEBT_REJECTED,
    INVITATION_RECEIVED,
    ANOMALY_DETECTED,
    MONTHLY_REPORT
}
```

- [ ] **Step 2: HomeMembershipRepository'ye findByHomeIdAndRole ekle**

`c:\Users\talha\IdeaProjects\HouseTab\SharedHomeFinance\src\main\java\org\calik\sharedhomefinance\domain\home\repository\HomeMembershipRepository.java` dosyasını oku, sonra interface'e şu satırı ekle (mevcut metodların sonuna):

```java
Optional<HomeMembership> findByHomeIdAndRole(Long homeId, HomeRole role);
```

- [ ] **Step 3: GeminiAIService.java'da TODO'yu implement et**

`c:\Users\talha\IdeaProjects\HouseTab\SharedHomeFinance\src\main\java\org\calik\sharedhomefinance\ai\GeminiAIService.java` dosyasını oku.

`generateMonthlyReportsForAllHomes()` metodunda şu satırı:
```java
// TODO: Adım 9 — NotificationService ile OWNER'a FCM bildirimi gönder
```

Şu kodla değiştir:
```java
membershipRepository.findByHomeIdAndRole(home.getId(), HomeRole.OWNER)
        .ifPresent(owner -> notificationService.sendToUser(
                owner.getUser().getId(),
                NotificationType.MONTHLY_REPORT,
                "Aylık Rapor Hazır",
                home.getName() + " için " + prevYear + "/" + prevMonth + " raporu oluşturuldu.",
                home.getId()
        ));
```

GeminiAIService'e şu import'ları da ekle (mevcut importlara):
```java
import org.calik.sharedhomefinance.domain.home.entity.HomeRole;
import org.calik.sharedhomefinance.domain.home.repository.HomeMembershipRepository;
```

Ve constructor'a `HomeMembershipRepository membershipRepository` parametresi ekle:

Mevcut constructor'ı bul (GeminiClient, UserService... parametreleri olan) ve `HomeMembershipRepository membershipRepository` parametresini ve `this.membershipRepository = membershipRepository;` atamasını ekle.

GeminiAIService'de mevcut field listesine şunu ekle:
```java
private final HomeMembershipRepository membershipRepository;
```

Ve mevcut constructor'ın tamamını şununla değiştir:
```java
public GeminiAIService(GeminiClient geminiClient,
                        UserService userService,
                        HomeService homeService,
                        AnalyticsService analyticsService,
                        ExpenseRepository expenseRepository,
                        HomeRepository homeRepository,
                        @Lazy NotificationService notificationService,
                        MonthlyReportRepository monthlyReportRepository,
                        HomeMembershipRepository membershipRepository) {
    this.geminiClient = geminiClient;
    this.userService = userService;
    this.homeService = homeService;
    this.analyticsService = analyticsService;
    this.expenseRepository = expenseRepository;
    this.homeRepository = homeRepository;
    this.notificationService = notificationService;
    this.monthlyReportRepository = monthlyReportRepository;
    this.membershipRepository = membershipRepository;
}
```

- [ ] **Step 4: Derle**

```bash
cd SharedHomeFinance && ./mvnw compile -q
```

Beklenen: hata yok.

---

## Task 5: UserServiceImpl Unit Testleri

**Files:**
- Create: `SharedHomeFinance/src/test/java/org/calik/sharedhomefinance/domain/user/service/UserServiceImplTest.java`

Spring context açılmaz. Mockito ile `UserRepository` ve `UserSettingsService` mock'lanır.

- [ ] **Step 1: Test dosyasını oluştur**

`c:\Users\talha\IdeaProjects\HouseTab\SharedHomeFinance\src\test\java\org\calik\sharedhomefinance\domain\user\service\UserServiceImplTest.java` dosyasını oluştur:

```java
package org.calik.sharedhomefinance.domain.user.service;

import org.calik.sharedhomefinance.common.exception.BusinessException;
import org.calik.sharedhomefinance.common.exception.ResourceNotFoundException;
import org.calik.sharedhomefinance.domain.settings.service.UserSettingsService;
import org.calik.sharedhomefinance.domain.user.dto.RegisterRequest;
import org.calik.sharedhomefinance.domain.user.dto.UserResponse;
import org.calik.sharedhomefinance.domain.user.entity.User;
import org.calik.sharedhomefinance.domain.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserSettingsService userSettingsService;

    @InjectMocks
    private UserServiceImpl userService;

    private User existingUser;
    private RegisterRequest registerRequest;

    @BeforeEach
    void setUp() {
        existingUser = User.builder()
                .firebaseUid("uid-123")
                .name("Test User")
                .email("test@example.com")
                .build();

        registerRequest = new RegisterRequest("Test User", "test@example.com", null);
    }

    @Test
    void registerOrLogin_whenUserExists_returnsExistingUserWithoutSaving() {
        when(userRepository.findByFirebaseUid("uid-123")).thenReturn(Optional.of(existingUser));

        UserResponse result = userService.registerOrLogin("uid-123", registerRequest);

        assertThat(result.email()).isEqualTo("test@example.com");
        verify(userRepository, never()).save(any());
        verify(userSettingsService, never()).createDefaultSettings(any());
    }

    @Test
    void registerOrLogin_whenUserNotExists_createsNewUser() {
        when(userRepository.findByFirebaseUid("uid-new")).thenReturn(Optional.empty());
        when(userRepository.existsByEmail("test@example.com")).thenReturn(false);
        User saved = User.builder()
                .firebaseUid("uid-new")
                .name("Test User")
                .email("test@example.com")
                .build();
        when(userRepository.save(any(User.class))).thenReturn(saved);

        UserResponse result = userService.registerOrLogin("uid-new", registerRequest);

        assertThat(result.email()).isEqualTo("test@example.com");
        verify(userRepository).save(any(User.class));
        verify(userSettingsService).createDefaultSettings(any(User.class));
    }

    @Test
    void registerOrLogin_whenEmailAlreadyExists_throwsBusinessException() {
        when(userRepository.findByFirebaseUid("uid-new")).thenReturn(Optional.empty());
        when(userRepository.existsByEmail("test@example.com")).thenReturn(true);

        assertThatThrownBy(() -> userService.registerOrLogin("uid-new", registerRequest))
                .isInstanceOf(BusinessException.class);

        verify(userRepository, never()).save(any());
    }

    @Test
    void getByFirebaseUid_whenNotFound_throwsResourceNotFoundException() {
        when(userRepository.findByFirebaseUid("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getByFirebaseUid("missing"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getByFirebaseUid_whenFound_returnsUser() {
        when(userRepository.findByFirebaseUid("uid-123")).thenReturn(Optional.of(existingUser));

        User result = userService.getByFirebaseUid("uid-123");

        assertThat(result.getFirebaseUid()).isEqualTo("uid-123");
    }
}
```

- [ ] **Step 2: RegisterRequest record'unu kontrol et**

`RegisterRequest` DTO'sunun constructor parametrelerini (`name`, `email`, `profilePhotoUrl`) doğrulamak için şu dosyayı oku:
`c:\Users\talha\IdeaProjects\HouseTab\SharedHomeFinance\src\main\java\org\calik\sharedhomefinance\domain\user\dto\RegisterRequest.java`

Eğer field isimleri farklıysa test setUp'ını uygun şekilde güncelle.

- [ ] **Step 3: Testleri çalıştır**

```bash
cd SharedHomeFinance && ./mvnw test -Dtest=UserServiceImplTest -q
```

Beklenen: `Tests run: 5, Failures: 0, Errors: 0`
