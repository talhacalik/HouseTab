# HouseTab — Proje Rehberi

## Proje Hakkında
Ev arkadaşlarının ortak harcamalarını takip ettiği,
borç/alacak yönetimi yaptığı mobil uygulama.
Hedef kitle: Üniversite öğrencileri ve ev arkadaşları.
Para birimi: Sadece Türk Lirası (₺)

## Teknoloji Stack
- Backend: Spring Boot 3.2.5 (Java 21)
- Veritabanı: PostgreSQL
- Kimlik Doğrulama: Firebase Authentication
- Push Bildirim: Firebase FCM
- Yapay Zeka: Gemini API
- Mobil: React Native (TypeScript)

## Mimari
Layered Architecture:
Controller → Service → Repository → Entity

Kurallar:
- Controller sadece HTTP isteği/cevabı yönetir
- İş mantığı Service katmanındadır
- Entity dışarı çıkmaz, her endpoint DTO kullanır
- Tüm hatalar GlobalExceptionHandler yönetir
- Her işlemde kullanıcının ev yetkisi kontrol edilir
- AIService interface bazlı yazılır

## Paket Yapısı
org.calik.sharedhomefinance
├── domain
│   ├── user
│   │   ├── entity
│   │   ├── dto
│   │   ├── repository
│   │   ├── service
│   │   └── controller
│   ├── home
│   ├── expense
│   ├── debt
│   ├── category
│   ├── analytics
│   ├── notification
│   └── audit
├── ai
│   ├── AIService (interface)
│   └── GeminiAIService (implementation)
├── config
│   ├── FirebaseConfig
│   ├── SecurityConfig
│   └── ApplicationConfig
└── common
├── exception
│   └── GlobalExceptionHandler
└── response
└── ApiResponse

## Roller
OWNER: Ev ayarları, üye yönetimi, davet oluşturma
MEMBER: Sadece finansal işlemler

## Entity Listesi
- User: id, firebase_uid, name, email, profile_photo_url, createdAt
- Home: id, name, description, default_split_type, allow_member_expense_edit, createdAt, createdBy
- HomeMembership: id, home_id, user_id, role(OWNER/MEMBER), joinedAt
- Invitation: id, home_id, invited_email, invited_by, status(PENDING/ACCEPTED/REJECTED/EXPIRED), expires_at, createdAt
- Category: id, name, icon, home_id (null ise sistem kategorisi)
- Expense: id, home_id, title, description, amount, expense_date, created_by, paid_by, category_id, status(ACTIVE/EDITED/CANCELLED), createdAt, updatedAt
- ExpenseVersion: id, expense_id, previous_amount, previous_title, previous_description, edit_note, edited_by, edited_at
- Debt: id, expense_id, home_id, borrower_id, creditor_id, amount, status(PENDING/MARKED_AS_PAID/CONFIRMED/REJECTED), createdAt, updatedAt
- Notification: id, user_id, type, title, body, reference_id, is_read, createdAt
- AuditLog: id, entity_type, entity_id, action_type, changed_by, timestamp, json_snapshot
- UserSettings: user_id, language(TR/EN), theme(LIGHT/DARK/SYSTEM), notification_enabled, createdAt, updatedAt

## Önemli Kurallar
- Multi-currency YOK, sadece ₺
- Redis YOK
- WebSocket YOK
- Giderler silinemez, sadece iptal edilir (cancel_note zorunlu)
- Bir evde yalnızca 1 OWNER olabilir
- OWNER ayrılmadan önce rol devretmek zorundadır

## AI Özellikleri (Gemini API)
1. POST /api/ai/suggest-category → Gider başlığından kategori öner
2. POST /api/ai/monthly-report → Aylık doğal dil raporu üret
3. POST /api/ai/detect-anomaly → Anormal harcama tespit et

## Geliştirme Sırası
1. Config: FirebaseConfig, SecurityConfig, GlobalExceptionHandler
2. User domain
3. Home + Membership + Invitation domain
4. Category domain
5. Expense + ExpenseVersion domain
6. Debt domain (otomatik borç üretimi)
7. Analytics
8. AI entegrasyonu (Gemini)
9. Notification + Firebase FCM
10. AuditLog