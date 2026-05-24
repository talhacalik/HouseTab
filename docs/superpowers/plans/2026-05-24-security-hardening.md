# Security Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Kimlik bilgilerini kaynak koddan kaldırarak env var'lara taşı, geçersiz token sızıntısını kapat, konsol loglarını temizle ve üretim güvenliğini sağla.

**Architecture:** Backend'de Spring Boot profile sistemi kullanılır: `application.properties` yalnızca `${VAR:default}` şablonları içerir, gerçek değerler `application-local.properties` (gitignored) veya Railway env vars'dan gelir. Firebase credentials production'da JSON string env var üzerinden yüklenir. Mobile'da console.log'lar kaldırılır.

**Tech Stack:** Spring Boot 3.2.5, Java 21, React Native + Expo (TypeScript), Firebase Admin SDK, PostgreSQL

---

## Dosya Haritası

| Dosya | İşlem | Sebep |
|-------|-------|-------|
| `/.gitignore` | Oluştur | Root düzeyinde secret exclusion yok |
| `SharedHomeFinance/.gitignore` | Güncelle | application-local.properties ekle |
| `SharedHomeFinance/src/main/resources/application.properties` | Güncelle | Hardcoded değerleri `${VAR:default}` ile değiştir |
| `SharedHomeFinance/src/main/resources/application-local.properties.example` | Oluştur | Dev template (commit edilir, gerçek değer içermez) |
| `SharedHomeFinance/src/main/resources/application-prod.properties` | Oluştur | Production-safe DDL, request size limit |
| `SharedHomeFinance/src/main/java/.../config/FirebaseConfig.java` | Güncelle | Env var JSON → file fallback |
| `SharedHomeFinance/src/main/java/.../config/FirebaseTokenFilter.java` | Güncelle | Geçersiz token'da 401 döndür, devam etme |
| `SharedHomeFinanceMobile/src/services/authService.ts` | Güncelle | 3 console.log kaldır |
| `SharedHomeFinanceMobile/src/context/AuthContext.tsx` | Güncelle | 3 console.log kaldır |
| `SharedHomeFinanceMobile/src/screens/auth/LoginScreen.tsx` | Güncelle | 3 console.log kaldır |
| `SharedHomeFinanceMobile/src/screens/auth/ForgotPasswordScreen.tsx` | Güncelle | 1 console.log kaldır |

---

## Task 1: Root ve Backend .gitignore Güncelleme

**Files:**
- Create: `/.gitignore`
- Modify: `SharedHomeFinance/.gitignore`

- [ ] **Step 1: Root .gitignore oluştur**

`c:\Users\talha\IdeaProjects\HouseTab\.gitignore` dosyasını oluştur:

```gitignore
# Secrets — never commit these
serviceAccountKey.json
google-services.json
GoogleService-Info.plist
*.env
.env
.env.local
.env.production

# Local property overrides
application-local.properties
application-local.yml
application-*.properties
!application-local.properties.example
!application-prod.properties

# Keystores
*.jks
*.p8
*.p12
*.key
*.mobileprovision
*.pem

# OS
.DS_Store
Thumbs.db
```

- [ ] **Step 2: Backend .gitignore'a application-local.properties ekle**

`SharedHomeFinance/.gitignore` dosyasının sonuna şunu ekle:

```gitignore

### Local Config ###
application-local.properties
```

---

## Task 2: Backend application.properties — Credentials'ı Env Var'a Taşı

**Files:**
- Modify: `SharedHomeFinance/src/main/resources/application.properties`
- Create: `SharedHomeFinance/src/main/resources/application-local.properties.example`

- [ ] **Step 1: application.properties içindeki hardcoded değerleri kaldır**

`application.properties` dosyasını şu şekilde güncelle (default'lar boş veya güvenli placeholder):

```properties
spring.application.name=SharedHomeFinance

# PostgreSQL
spring.datasource.url=jdbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5432}/${DB_NAME:sharedhomefinance}
spring.datasource.username=${DB_USERNAME:postgres}
spring.datasource.password=${DB_PASSWORD:}
spring.datasource.driver-class-name=org.postgresql.Driver

# JPA / Hibernate
spring.jpa.hibernate.ddl-auto=${DDL_AUTO:update}
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.format_sql=true

# Firebase
firebase.service-account-path=${FIREBASE_SERVICE_ACCOUNT_PATH:serviceAccountKey.json}

# Gemini API
gemini.api.key=${GEMINI_API_KEY:}
gemini.model=${GEMINI_MODEL:gemini-2.0-flash-001}

# Server
server.port=${PORT:8080}
server.tomcat.max-http-post-size=1048576

spring.jpa.open-in-view=false

# Encoding
server.servlet.encoding.charset=UTF-8
server.servlet.encoding.enabled=true
server.servlet.encoding.force=true
```

- [ ] **Step 2: Developer template dosyası oluştur**

`SharedHomeFinance/src/main/resources/application-local.properties.example` dosyasını oluştur:

```properties
# Bu dosyayı kopyala: application-local.properties
# application-local.properties .gitignore'a eklidir — commit ETME

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sharedhomefinance
DB_USERNAME=postgres
DB_PASSWORD=your_strong_password_here

# Firebase — serviceAccountKey.json dosyasını src/main/resources/ altına koy
# VEYA: FIREBASE_SERVICE_ACCOUNT_JSON env var'ına JSON içeriğini yapıştır
FIREBASE_SERVICE_ACCOUNT_PATH=serviceAccountKey.json

# Gemini API Key — Google AI Studio'dan al: https://aistudio.google.com/apikey
GEMINI_API_KEY=your_gemini_api_key_here
```

- [ ] **Step 3: Gerçek değerleri içeren local properties oluştur**

`SharedHomeFinance/src/main/resources/application-local.properties` dosyasını oluştur (gitignore'da, commit edilmeyecek):

```properties
# Gerçek değerler — commit ETME
spring.datasource.password=1234
gemini.api.key=BURAYA_ROTATED_GEMINI_KEY_YAZ
```

> **NOT:** Şu an `application.properties`'deki Gemini key (`AIzaSyDJwnL8tzftcLoXDNRmRsTv78D7d-06-z4`) ve DB password (`1234`) açıkta. Bu plan uygulandıktan sonra:
> 1. [Google AI Studio](https://aistudio.google.com/apikey)'da bu key'i hemen sil ve yenisini oluştur
> 2. DB şifresini güçlü bir değerle değiştir
> 3. `application-local.properties`'e yeni değerleri yaz

---

## Task 3: FirebaseConfig — Env Var JSON Desteği

**Files:**
- Modify: `SharedHomeFinance/src/main/java/org/calik/sharedhomefinance/config/FirebaseConfig.java`

Production'da `serviceAccountKey.json` dosyası bulunmaz; Railway'de `FIREBASE_SERVICE_ACCOUNT_JSON` env var'ına JSON içeriği yapıştırılır. Kod önce env var'ı dener, yoksa dosyayı okur.

- [ ] **Step 1: FirebaseConfig.java'yı güncelle**

```java
package org.calik.sharedhomefinance.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import jakarta.annotation.PostConstruct;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

@Configuration
public class FirebaseConfig {

    private static final Logger log = LoggerFactory.getLogger(FirebaseConfig.class);

    @Value("${firebase.service-account-path}")
    private String serviceAccountPath;

    @PostConstruct
    public void initialize() throws IOException {
        if (!FirebaseApp.getApps().isEmpty()) {
            return;
        }

        InputStream serviceAccount = resolveCredentials();

        FirebaseOptions options = FirebaseOptions.builder()
                .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                .build();

        FirebaseApp.initializeApp(options);
        log.info("Firebase başarıyla başlatıldı.");
    }

    private InputStream resolveCredentials() throws IOException {
        String json = System.getenv("FIREBASE_SERVICE_ACCOUNT_JSON");
        if (json != null && !json.isBlank()) {
            log.info("Firebase credentials env var'dan yükleniyor.");
            return new ByteArrayInputStream(json.getBytes(StandardCharsets.UTF_8));
        }
        log.info("Firebase credentials dosyadan yükleniyor: {}", serviceAccountPath);
        return new ClassPathResource(serviceAccountPath).getInputStream();
    }
}
```

- [ ] **Step 2: Backend'i yeniden başlat ve Firebase'in çalıştığını doğrula**

```bash
cd SharedHomeFinance
./mvnw spring-boot:run
```

Beklenen log: `Firebase başarıyla başlatıldı.`

---

## Task 4: application-prod.properties Oluştur

**Files:**
- Create: `SharedHomeFinance/src/main/resources/application-prod.properties`

Railway'de `SPRING_PROFILES_ACTIVE=prod` env var'ı ile aktive edilir. Production'da DDL auto devre dışı, SQL log kapalı.

- [ ] **Step 1: application-prod.properties oluştur**

```properties
# Production overrides — Railway'de SPRING_PROFILES_ACTIVE=prod yap

# DDL: production'da schema otomatik değişmesin
spring.jpa.hibernate.ddl-auto=validate

# SQL logları production'da kapalı
spring.jpa.show-sql=false

# Request size limit
server.tomcat.max-http-post-size=1048576

# Firebase production'da env var'dan yüklenir (FIREBASE_SERVICE_ACCOUNT_JSON)
# Gemini key env var'dan: GEMINI_API_KEY
# DB credentials env var'dan: DB_USERNAME, DB_PASSWORD, DB_HOST, DB_NAME
```

---

## Task 5: FirebaseTokenFilter — Geçersiz Token'da 401 Dön

**Files:**
- Modify: `SharedHomeFinance/src/main/java/org/calik/sharedhomefinance/config/FirebaseTokenFilter.java`

Mevcut kodda geçersiz token geldiğinde exception yakalanıyor ama `filterChain.doFilter()` yine de çağrılıyor. Security context boş kalıyor ve Spring Security `anyRequest().authenticated()` kuralı teorik olarak koruyor ama defensive coding gerektiriyor.

- [ ] **Step 1: FirebaseTokenFilter.java'yı güncelle**

```java
package org.calik.sharedhomefinance.config;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class FirebaseTokenFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(FirebaseTokenFilter.class);
    private static final String BEARER_PREFIX = "Bearer ";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String token = extractToken(request);

        if (!StringUtils.hasText(token)) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(token);
            String uid = decodedToken.getUid();

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(uid, null, List.of());

            authentication.setDetails(decodedToken);
            SecurityContextHolder.getContext().setAuthentication(authentication);

        } catch (FirebaseAuthException ex) {
            log.warn("Geçersiz Firebase token reddedildi: {}", ex.getMessage());
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write(
                    "{\"success\":false,\"message\":\"Geçersiz veya süresi dolmuş token\",\"data\":null}"
            );
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String extractToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (StringUtils.hasText(header) && header.startsWith(BEARER_PREFIX)) {
            return header.substring(BEARER_PREFIX.length());
        }
        return null;
    }
}
```

- [ ] **Step 2: Davranışı manuel doğrula**

Geçersiz token ile istek at:
```bash
curl -X GET http://localhost:8080/api/homes \
  -H "Authorization: Bearer gecersiz_token_12345"
```

Beklenen: HTTP 401, `{"success":false,"message":"Geçersiz veya süresi dolmuş token",...}`

---

## Task 6: Mobile — console.log Temizleme

**Files:**
- Modify: `SharedHomeFinanceMobile/src/services/authService.ts`
- Modify: `SharedHomeFinanceMobile/src/context/AuthContext.tsx`
- Modify: `SharedHomeFinanceMobile/src/screens/auth/LoginScreen.tsx`
- Modify: `SharedHomeFinanceMobile/src/screens/auth/ForgotPasswordScreen.tsx`

- [ ] **Step 1: authService.ts — 3 console.log kaldır (satır 58, 64, 67)**

`emailLogin` fonksiyonunda:

```typescript
export async function emailLogin(
  email: string,
  password: string,
): Promise<BackendAuthResponse> {
  try {
    const auth = getAuth();
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const { user } = credential;
    const firebaseToken = await getIdToken(user);
    return await syncWithBackend(firebaseToken, user.displayName, user.email, user.photoURL);
  } catch (error: any) {
    throw error;
  }
}
```

- [ ] **Step 2: AuthContext.tsx — 3 console.log kaldır (satır 74, 76, 79)**

`login` callback'inden console.log satırlarını kaldır:

```typescript
const login = useCallback(async (user: User, token: string) => {
    await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify({ token, user }));
    setToken(token);
    setUser(user);
    try {
      const settings = await getUserSettings();
      const lang = settings.language === 'EN' ? 'en' : 'tr';
      await i18n.changeLanguage(lang);
      await AsyncStorage.setItem('app_language', lang);
    } catch {
      // Ayar yüklenemezse varsayılan dil (tr) korunur, sessizce geç
    }
    registerFcmToken();
  }, []);
```

- [ ] **Step 3: LoginScreen.tsx — 3 console.log kaldır (satır 88, 92, 98)**

LoginScreen.tsx dosyasını oku, `onSubmit` veya form submit handler'daki 3 console.log satırını kaldır.

- [ ] **Step 4: ForgotPasswordScreen.tsx — 1 console.log kaldır (satır 78)**

ForgotPasswordScreen.tsx dosyasını oku, `console.log('ForgotPassword:', data)` satırını kaldır.

- [ ] **Step 5: Temizliği doğrula**

```bash
grep -rn "console.log" SharedHomeFinanceMobile/src/
```

Beklenen çıktı: boş (sıfır sonuç).

---

## Task 7: serviceAccountKey.json Temizleme

**Files:**
- Delete: `SharedHomeFinance/src/main/resources/serviceAccountKey.json`

Task 3 tamamlandıktan sonra (FirebaseConfig env var desteği eklenince) bu dosya artık gerekmez.

> **ÖNEMLİ:** Bu adımı Task 3 onaylandıktan sonra yap. Dosya silinince backend yalnızca `FIREBASE_SERVICE_ACCOUNT_JSON` env var'ına veya local `application-local.properties`'deki path'e bakacak.

- [ ] **Step 1: Dosyayı sil**

`SharedHomeFinance/src/main/resources/serviceAccountKey.json` dosyasını sil.

- [ ] **Step 2: Backend'i yeniden başlat — env var olmadan çalışmaz olmalı**

```bash
cd SharedHomeFinance
./mvnw spring-boot:run
```

`FIREBASE_SERVICE_ACCOUNT_JSON` env var'ı yoksa ve `serviceAccountKey.json` dosyası yoksa başlatma hatası alınmalı (beklenen davranış). Local dev için `application-local.properties`'e `firebase.service-account-path` ekle ve dosyayı sadece local koy.

- [ ] **Step 3: Local dev için dosyayı geri koy**

Mevcut `serviceAccountKey.json` içeriğini sil, dosyayı `SharedHomeFinance/src/main/resources/` altına kopyala (bu sefer git tarafından izlenmeyecek çünkü .gitignore'da).

---

## Özet: Railway Production Env Vars

Bu plan tamamlandıktan sonra Railway'de şu env vars'ları set et:

```
SPRING_PROFILES_ACTIVE=prod
DB_HOST=<railway postgres host>
DB_PORT=5432
DB_NAME=sharedhomefinance
DB_USERNAME=<db user>
DB_PASSWORD=<güçlü şifre>
FIREBASE_SERVICE_ACCOUNT_JSON=<serviceAccountKey.json içeriğini buraya yapıştır>
GEMINI_API_KEY=<yeni key — eski key rotate et>
```
