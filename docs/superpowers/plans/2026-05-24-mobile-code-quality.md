# Mobile Code Quality Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Üç mobile sağlık sorununu gider: ForgotPassword ekranını çalışır hale getir, API URL'lerini ortam değişkenine taşı, TypeScript `any` tip hatalarını düzelt.

**Architecture:** ForgotPassword için backend endpoint gerekmez — Firebase SDK'nın `sendPasswordResetEmail` metodu kullanılır. API URL konfigürasyonu `app.json` `extra` alanı + `expo-constants` üzerinden yapılır. TypeScript any düzeltmeleri her dosyada ayrı ayrı uygulanır.

**Tech Stack:** React Native + Expo, TypeScript, @react-native-firebase/auth, expo-constants

---

## Dosya Haritası

| Dosya | İşlem |
|-------|-------|
| `SharedHomeFinanceMobile/src/screens/auth/ForgotPasswordScreen.tsx` | Güncelle — Firebase password reset |
| `SharedHomeFinanceMobile/app.json` | Güncelle — extra.apiUrl ekle |
| `SharedHomeFinanceMobile/src/services/apiClient.ts` | Güncelle — Constants kullan |
| `SharedHomeFinanceMobile/src/services/authService.ts` | Güncelle — Constants kullan |
| `SharedHomeFinanceMobile/src/screens/auth/LoginScreen.tsx` | Güncelle — any → typed |
| `SharedHomeFinanceMobile/src/screens/auth/RegisterScreen.tsx` | Güncelle — any → typed |
| `SharedHomeFinanceMobile/src/screens/profile/EditProfileScreen.tsx` | Güncelle — any → typed |
| `SharedHomeFinanceMobile/src/screens/home/CreateHomeScreen.tsx` | Güncelle — any → typed |
| `SharedHomeFinanceMobile/src/screens/home/EditHomeScreen.tsx` | Güncelle — any → typed |
| `SharedHomeFinanceMobile/src/screens/home/InviteMemberScreen.tsx` | Güncelle — any → typed |
| `SharedHomeFinanceMobile/src/screens/home/MemberListScreen.tsx` | Güncelle — any → typed |
| `SharedHomeFinanceMobile/src/screens/home/HomeSettingsScreen.tsx` | Güncelle — any → typed |
| `SharedHomeFinanceMobile/src/screens/expense/EditExpenseScreen.tsx` | Güncelle — any → typed |
| `SharedHomeFinanceMobile/src/screens/expense/AddExpenseScreen.tsx` | Güncelle — any → typed |
| `SharedHomeFinanceMobile/src/screens/expense/ExpenseDetailScreen.tsx` | Güncelle — any → typed |
| `SharedHomeFinanceMobile/src/screens/debt/DebtDetailScreen.tsx` | Güncelle — any → typed |
| `SharedHomeFinanceMobile/src/screens/analytics/AIReportScreen.tsx` | Güncelle — any → typed |

---

## Task 1: ForgotPasswordScreen — Firebase Password Reset

**Files:**
- Modify: `SharedHomeFinanceMobile/src/screens/auth/ForgotPasswordScreen.tsx`

Mevcut `onSubmit` sadece 1 saniyelik fake bekleyiş yapıyor. Firebase `sendPasswordResetEmail` ile kullanıcıya gerçek sıfırlama e-postası gönderilecek.

- [ ] **Step 1: ForgotPasswordScreen.tsx'i oku**

`c:\Users\talha\IdeaProjects\HouseTab\SharedHomeFinanceMobile\src\screens\auth\ForgotPasswordScreen.tsx` dosyasını oku.

- [ ] **Step 2: import satırlarını güncelle**

Dosyanın en üstünde mevcut importlara şunu ekle:

```typescript
import { getAuth, sendPasswordResetEmail, FirebaseError } from '@react-native-firebase/auth';
```

- [ ] **Step 3: onSubmit fonksiyonunu değiştir**

Mevcut:
```typescript
  const onSubmit = async (data: FormData) => {
    // TODO: API bağlantısı eklenecek
    await new Promise(r => setTimeout(r, 1000));
  };
```

Yeni hali:
```typescript
  const onSubmit = async (data: FormData) => {
    const auth = getAuth();
    await sendPasswordResetEmail(auth, data.email);
  };
```

- [ ] **Step 4: Doğrula — form submit başarılı mesajı gösteriyor mu?**

Uygulamayı çalıştır, ForgotPassword ekranına git, geçerli bir e-posta gir ve gönder. `isSubmitSuccessful` true olunca ekranda başarı mesajı görünmeli (`t('auth.forgotPasswordSuccess')`).

---

## Task 2: API URL Konfigürasyonu — expo-constants

**Files:**
- Modify: `SharedHomeFinanceMobile/app.json`
- Modify: `SharedHomeFinanceMobile/src/services/apiClient.ts`
- Modify: `SharedHomeFinanceMobile/src/services/authService.ts`

Şu an her iki dosyada da `Platform.OS === 'android' ? 'http://10.0.2.2:8080/api' : 'http://localhost:8080/api'` hardcoded. `app.json`'a `extra.apiUrl` eklenerek `Constants.expoConfig?.extra?.apiUrl` üzerinden okunacak.

- [ ] **Step 1: app.json'ı oku**

`c:\Users\talha\IdeaProjects\HouseTab\SharedHomeFinanceMobile\app.json` dosyasını oku.

- [ ] **Step 2: app.json'ı güncelle — extra.apiUrl ekle**

`"extra"` bloğunu şu şekilde güncelle (mevcut `eas` içeriğini koru):

```json
"extra": {
  "eas": {
    "projectId": "babfa143-8c74-48c7-97c3-eaeeba4ef836"
  },
  "apiUrl": "http://10.0.2.2:8080/api"
}
```

Production için EAS Build'de `EXPO_PUBLIC_API_URL` env var veya `eas.json` override kullanılır; bu değer yalnızca local emulator geliştirmesi içindir.

- [ ] **Step 3: apiClient.ts'i oku ve güncelle**

`c:\Users\talha\IdeaProjects\HouseTab\SharedHomeFinanceMobile\src\services\apiClient.ts` dosyasını oku. Sonra tüm içeriği şununla değiştir:

```typescript
import axios from 'axios';
import Constants from 'expo-constants';
import { getToken } from './authService';

const BASE_URL: string =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  'http://10.0.2.2:8080/api';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
```

- [ ] **Step 4: authService.ts'teki hardcoded URL'yi kaldır**

`c:\Users\talha\IdeaProjects\HouseTab\SharedHomeFinanceMobile\src\services\authService.ts` dosyasını oku.

`const API_URL = Platform.OS === 'android' ? ... : ...` bloğunu şununla değiştir:

```typescript
import Constants from 'expo-constants';

const API_URL: string =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  'http://10.0.2.2:8080/api';
```

`import { Platform } from 'react-native';` satırını kaldır (artık kullanılmıyor).

- [ ] **Step 5: Doğrula**

```bash
grep -rn "10.0.2.2" c:\Users\talha\IdeaProjects\HouseTab\SharedHomeFinanceMobile\src\
```

Beklenen: sıfır sonuç (hardcoded URL kalmadı).

---

## Task 3: TypeScript `any` Tip Hatalarını Düzelt

**Files:**
- Modify: (aşağıdaki 12 dosya)

Tüm `onError: (error: any)` → `onError: (error: Error)` ve `catch (error: any)` → `catch (error: unknown)` dönüşümleri. `catch (error: unknown)` bloklarında `error.message` yerine `error instanceof Error ? error.message : String(error)` kullanılır.

Tüm dosyaları **tek task'ta** işle — hepsi aynı mekanik değişiklik.

- [ ] **Step 1: Her dosyayı oku ve `any` kullanımlarını bul**

Şu dosyaları sırayla oku:
1. `c:\Users\talha\IdeaProjects\HouseTab\SharedHomeFinanceMobile\src\services\authService.ts`
2. `c:\Users\talha\IdeaProjects\HouseTab\SharedHomeFinanceMobile\src\screens\auth\LoginScreen.tsx`
3. `c:\Users\talha\IdeaProjects\HouseTab\SharedHomeFinanceMobile\src\screens\auth\RegisterScreen.tsx`
4. `c:\Users\talha\IdeaProjects\HouseTab\SharedHomeFinanceMobile\src\screens\profile\EditProfileScreen.tsx`
5. `c:\Users\talha\IdeaProjects\HouseTab\SharedHomeFinanceMobile\src\screens\home\CreateHomeScreen.tsx`
6. `c:\Users\talha\IdeaProjects\HouseTab\SharedHomeFinanceMobile\src\screens\home\EditHomeScreen.tsx`
7. `c:\Users\talha\IdeaProjects\HouseTab\SharedHomeFinanceMobile\src\screens\debt\DebtDetailScreen.tsx`
8. `c:\Users\talha\IdeaProjects\HouseTab\SharedHomeFinanceMobile\src\screens\home\InviteMemberScreen.tsx`
9. `c:\Users\talha\IdeaProjects\HouseTab\SharedHomeFinanceMobile\src\screens\home\MemberListScreen.tsx`
10. `c:\Users\talha\IdeaProjects\HouseTab\SharedHomeFinanceMobile\src\screens\home\HomeSettingsScreen.tsx`
11. `c:\Users\talha\IdeaProjects\HouseTab\SharedHomeFinanceMobile\src\screens\expense\EditExpenseScreen.tsx`
12. `c:\Users\talha\IdeaProjects\HouseTab\SharedHomeFinanceMobile\src\screens\expense\AddExpenseScreen.tsx`
13. `c:\Users\talha\IdeaProjects\HouseTab\SharedHomeFinanceMobile\src\screens\expense\ExpenseDetailScreen.tsx`
14. `c:\Users\talha\IdeaProjects\HouseTab\SharedHomeFinanceMobile\src\screens\analytics\AIReportScreen.tsx`

- [ ] **Step 2: Dönüşüm kurallarını uygula**

Her dosyada şu değişiklikleri yap:

**React Query `onError` callback'leri:**
```typescript
// Önce:
onError: (error: any) => { ... error.message ... }
// Sonra:
onError: (error: Error) => { ... error.message ... }
```

**`catch` blokları — `error.message` kullanılıyorsa:**
```typescript
// Önce:
} catch (error: any) {
  setError(error.message);
}
// Sonra:
} catch (error: unknown) {
  setError(error instanceof Error ? error.message : String(error));
}
```

**`catch` blokları — sadece `throw error` yapılıyorsa:**
```typescript
// Önce:
} catch (error: any) {
  throw error;
}
// Sonra:
} catch (error: unknown) {
  throw error;
}
```

**`catch` blokları — `error.code` ve `error.message` ikisi de kullanılıyorsa (Firebase error):**
```typescript
// Önce:
} catch (err: any) {
  if (err.code === 'auth/wrong-password') { ... }
  setErrorMsg(err.message);
}
// Sonra:
} catch (err: unknown) {
  const firebaseErr = err as { code?: string; message?: string };
  if (firebaseErr.code === 'auth/wrong-password') { ... }
  setErrorMsg(firebaseErr.message ?? String(err));
}
```

**`DebtDetailScreen`'deki `onMutationError(error: any, fallback: string)` fonksiyonu:**
```typescript
// Önce:
function onMutationError(error: any, fallback: string) {
// Sonra:
function onMutationError(error: Error, fallback: string) {
```

- [ ] **Step 3: Doğrula**

```bash
grep -rn ": any" c:\Users\talha\IdeaProjects\HouseTab\SharedHomeFinanceMobile\src\
```

Beklenen: sıfır sonuç.
