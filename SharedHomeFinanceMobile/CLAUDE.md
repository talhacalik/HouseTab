# HouseTab — Proje Rehberi

## Proje Hakkında
Ev arkadaşlarının ortak harcamalarını takip ettiği,
borç/alacak yönetimi yaptığı mobil uygulama.
Hedef kitle: Üniversite öğrencileri ve ev arkadaşları.
Para birimi: Sadece Türk Lirası (₺)

## Teknoloji Stack
- React Native + Expo (Managed Workflow)
- TypeScript
- React Navigation (Stack + Bottom Tab)
- React Native Paper (UI bileşenleri)
- Axios (API istekleri)
- Context API (Global state)
- i18n (TR/EN dil desteği)
- Firebase Auth SDK (Giriş/kayıt)
- Firebase FCM (Push notification)
- @expo/vector-icons (İkonlar)
- expo-font (Özel fontlar)

## Backend API
- Base URL: http://10.0.2.2:8080/api (Android emulator)
- Base URL: http://localhost:8080/api (iOS)
- JWT token her istekte header'a eklenir
- Authorization: Bearer {token}

## Renk Paleti
- Primary: #2563EB (Mavi)
- Secondary: #10B981 (Yeşil - alacak)
- Danger: #EF4444 (Kırmızı - borç)
- Background: #F9FAFB (Açık gri)
- Surface: #FFFFFF (Beyaz)
- Text: #111827 (Koyu)
- SubText: #6B7280 (Gri)

## Klasör Yapısı
src/
├── screens/          → Ekranlar
│   ├── auth/         → Login, Register
│   ├── home/         → HomeSelection, CreateHome
│   ├── expense/      → ExpenseList, AddExpense, ExpenseDetail
│   ├── debt/         → DebtList, DebtDetail
│   ├── analytics/    → Dashboard, AIReport
│   └── profile/      → Profile, Settings
├── components/       → Tekrar kullanılabilir bileşenler
├── navigation/       → Navigation yapısı
├── context/          → Global state (Auth, Theme, Home)
├── services/         → API çağrıları
├── i18n/             → TR/EN çeviriler
├── hooks/            → Custom hooks
└── utils/            → Yardımcı fonksiyonlar

## Ekran Listesi
Auth:
- SplashScreen
- LoginScreen
- RegisterScreen

Home Yönetimi:
- HomeSelectionScreen
- CreateHomeScreen
- HomeSettingsScreen
- MemberListScreen
- InviteMemberScreen

Ana Uygulama (Bottom Tab):
- DashboardScreen
- ExpenseListScreen
- AddExpenseScreen
- DebtScreen
- ProfileScreen

Detay Ekranları:
- ExpenseDetailScreen
- DebtDetailScreen
- NotificationScreen
- AIReportScreen

## Navigation Yapısı
RootNavigator
├── AuthStack (giriş yapılmamışsa)
│   ├── SplashScreen
│   ├── LoginScreen
│   └── RegisterScreen
├── HomeSelectionStack (ev seçilmemişse)
│   ├── HomeSelectionScreen
│   └── CreateHomeScreen
└── MainStack (giriş + ev seçilmişse)
    └── BottomTabNavigator
        ├── Dashboard
        ├── Expenses
        ├── Debts
        └── Profile

## Mimari Kurallar
- Her ekran kendi klasöründe olur
- API çağrıları sadece services/ klasöründen yapılır
- Global state Context API ile yönetilir
- Tema renkleri theme/ dosyasından import edilir
- String'ler direkt yazılmaz, i18n kullanılır
- Her bileşen TypeScript ile yazılır

## Environment Variables
- .env dosyası kullan
- API_URL=http://10.0.2.2:8080/api (geliştirme)
- API_URL=https://sharedhomefinance.railway.app/api (production)
- Firebase config değerleri .env'de saklanır
- .env dosyası .gitignore'a eklenir
- expo-constants ile env değişkenleri okunur

## State Management
Local state → useState, Context API
Server state → React Query (@tanstack/react-query)
- API çağrıları React Query ile yapılır
- Cache yönetimi otomatik
- Loading ve error state otomatik gelir
- Context API sadece: Auth, Theme, ActiveHome

## Hata ve Loading Yönetimi
- Her API çağrısında loading skeleton göster
- Hata durumunda kullanıcıya mesaj göster
- İnternet yoksa offline mesajı göster
- Error boundary kullan
- Toast mesajları için react-native-toast-message

## Form Yönetimi
- Tüm formlar React Hook Form ile yazılır
- Validasyon için Yup kullanılır
- Örnek: Login, Register, AddExpense formları

## Güvenlik
- Firebase token SecureStore'da saklanır (expo-secure-store)
- AsyncStorage hassas veri için KULLANILMAZ
- Token her API isteğinde header'a eklenir
- Token süresi dolunca otomatik yenilenir

## Ekranlar Arası Parametre Geçişi
- React Navigation params kullanılır
- Her ekranın TypeScript tipi tanımlanır
- Örnek:
  ExpenseList → ExpenseDetail: { expenseId: number }
  DebtList → DebtDetail: { debtId: number }

## Performans Kuralları
- Liste ekranlarında FlatList kullan, ScrollView değil
- Gereksiz re-render önlemek için useMemo, useCallback kullan
- Resimler için expo-image kullan
- Büyük listeler için pagination uygula

## Geliştirme Komutları
- npx expo start → Uygulamayı başlat
- n → Versiyon sorusuna hayır de
- a → Android emulator'de aç
