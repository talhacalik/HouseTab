package org.calik.sharedhomefinance.ai;

import lombok.RequiredArgsConstructor;
import org.calik.sharedhomefinance.ai.dto.*;
import org.calik.sharedhomefinance.domain.analytics.dto.CategoryAnalyticsResponse;
import org.calik.sharedhomefinance.domain.analytics.dto.MemberAnalyticsResponse;
import org.calik.sharedhomefinance.domain.analytics.dto.MonthlyAnalyticsResponse;
import org.calik.sharedhomefinance.domain.analytics.service.AnalyticsService;
import org.calik.sharedhomefinance.domain.expense.repository.ExpenseRepository;
import org.calik.sharedhomefinance.domain.home.entity.Home;
import org.calik.sharedhomefinance.domain.home.entity.HomeRole;
import org.calik.sharedhomefinance.domain.home.repository.HomeMembershipRepository;
import org.calik.sharedhomefinance.domain.home.repository.HomeRepository;
import org.calik.sharedhomefinance.domain.home.service.HomeService;
import org.calik.sharedhomefinance.domain.notification.entity.NotificationType;
import org.calik.sharedhomefinance.domain.notification.service.NotificationService;
import org.calik.sharedhomefinance.domain.user.entity.User;
import org.calik.sharedhomefinance.domain.user.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class GeminiAIService implements AIService {

    private static final Logger log = LoggerFactory.getLogger(GeminiAIService.class);

    private static final List<String> SYSTEM_CATEGORIES =
            List.of("Market", "Kira", "Fatura", "Yemek", "Temizlik", "Ulaşım", "Eğlence", "Diğer");

    private final GeminiClient geminiClient;
    private final UserService userService;
    private final HomeService homeService;
    private final AnalyticsService analyticsService;
    private final ExpenseRepository expenseRepository;
    private final HomeRepository homeRepository;
    private final NotificationService notificationService;
    private final MonthlyReportRepository monthlyReportRepository;
    private final HomeMembershipRepository membershipRepository;

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

    // ── 1. Kategori önerisi ──────────────────────────────────────────────────

    @Override
    public CategorySuggestionResponse suggestCategory(String firebaseUid,
                                                       CategorySuggestionRequest request) {
        userService.getByFirebaseUid(firebaseUid); // yetki kontrolü

        String categories = String.join(", ", SYSTEM_CATEGORIES);
        String prompt = """
                Bir ev harcama uygulamasında kullanılmak üzere aşağıdaki gider başlığına
                en uygun kategoriyi belirle.

                Gider başlığı: "%s"
                Kategori seçenekleri: %s

                Yanıtını şu formatta ver:
                KATEGORİ: <seçilen kategori>
                AÇIKLAMA: <kısa gerekçe>
                """.formatted(request.title(), categories);

        String raw = geminiClient.generate(prompt);
        return parseCategorySuggestion(raw);
    }

    private CategorySuggestionResponse parseCategorySuggestion(String raw) {
        String category = "Diğer";
        String reasoning = "";

        for (String line : raw.lines().toList()) {
            if (line.startsWith("KATEGORİ:")) {
                String parsed = line.replace("KATEGORİ:", "").strip();
                if (SYSTEM_CATEGORIES.contains(parsed)) category = parsed;
            } else if (line.startsWith("AÇIKLAMA:")) {
                reasoning = line.replace("AÇIKLAMA:", "").strip();
            }
        }
        return new CategorySuggestionResponse(category, reasoning);
    }

    // ── 2. Aylık rapor ───────────────────────────────────────────────────────

    @Override
    @Transactional
    public MonthlyReportResponse generateMonthlyReport(String firebaseUid,
                                                        MonthlyReportRequest request) {
        User user = userService.getByFirebaseUid(firebaseUid);
        homeService.validateMembership(request.homeId(), user.getId());

        int year = request.year() != null ? request.year() : LocalDateTime.now().getYear();
        int month = request.month() != null ? request.month() : LocalDateTime.now().getMonthValue();
        String reportText = buildReport(request.homeId(), request.language(), year, month);

        Home home = homeService.getHomeById(request.homeId());
        int finalYear = year;
        int finalMonth = month;
        String finalLanguage = request.language().toUpperCase();

        monthlyReportRepository.findByHomeIdAndYearAndMonthAndLanguage(
                request.homeId(), finalYear, finalMonth, finalLanguage)
            .ifPresentOrElse(
                existing -> existing.setReport(reportText),
                () -> monthlyReportRepository.save(
                    MonthlyReport.builder()
                        .home(home)
                        .year(finalYear)
                        .month(finalMonth)
                        .language(finalLanguage)
                        .report(reportText)
                        .build()
                )
            );

        return MonthlyReportResponse.of(request.homeId(), finalLanguage, reportText, finalYear, finalMonth);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MonthlyReportResponse> getMonthlyReports(String firebaseUid, Long homeId) {
        User user = userService.getByFirebaseUid(firebaseUid);
        homeService.validateMembership(homeId, user.getId());
        return monthlyReportRepository.findAllByHomeIdOrderByYearDescMonthDesc(homeId)
                .stream()
                .map(r -> MonthlyReportResponse.of(homeId, r.getLanguage(), r.getReport(), r.getYear(), r.getMonth()))
                .toList();
    }

    @Override
    public void generateMonthlyReportsForAllHomes() {
        List<Home> homes = homeRepository.findAll();
        log.info("Aylık otomatik rapor başlatıldı. {} ev işlenecek.", homes.size());

        for (Home home : homes) {
            try {
                int prevMonth = LocalDateTime.now().minusMonths(1).getMonthValue();
                int prevYear = LocalDateTime.now().minusMonths(1).getYear();
                String report = buildReport(home.getId(), "TR", prevYear, prevMonth);
                membershipRepository.findByHomeIdAndRole(home.getId(), HomeRole.OWNER)
                        .ifPresent(owner -> notificationService.sendToUser(
                                owner.getUser().getId(),
                                NotificationType.MONTHLY_REPORT,
                                "Aylik Rapor Hazir",
                                home.getName() + " icin " + prevYear + "/" + prevMonth + " raporu olusturuldu.",
                                home.getId()
                        ));
                log.info("Ev [{}] için aylık rapor oluşturuldu.", home.getName());
            } catch (Exception ex) {
                log.error("Ev [id={}] için rapor üretilemedi: {}", home.getId(), ex.getMessage());
            }
        }
    }

    private String buildReport(Long homeId, String language, int year, int month) {
        MonthlyAnalyticsResponse monthly = getMonthlyDataInternal(homeId, year, month);
        List<CategoryAnalyticsResponse> categories = getCategoryDataInternal(homeId, year, month);
        List<MemberAnalyticsResponse> members = getMemberDataInternal(homeId, year, month);

        String categoryLines = categories.stream()
                .map(c -> "  - %s: %.2f ₺ (%%%s)".formatted(
                        c.categoryName(), c.totalAmount(), c.percentage()))
                .collect(Collectors.joining("\n"));

        String memberLines = members.stream()
                .map(m -> "  - %s: %.2f ₺ (%%%s)".formatted(
                        m.userName(), m.totalPaid(), m.percentage()))
                .collect(Collectors.joining("\n"));

        boolean isTurkish = "TR".equalsIgnoreCase(language);

        String prompt = isTurkish
                ? buildTurkishPrompt(monthly, categoryLines, memberLines)
                : buildEnglishPrompt(monthly, categoryLines, memberLines);

        String result = geminiClient.generate(prompt);
        return result.isBlank() ? "Rapor oluşturulamadı." : result;
    }

    private String buildTurkishPrompt(MonthlyAnalyticsResponse monthly,
                                       String categoryLines, String memberLines) {
        return """
                Aşağıdaki ev harcama verilerini kullanarak %d/%d dönemi için
                samimi ve anlaşılır bir Türkçe aylık rapor yaz. 3-4 cümle yeterli.

                Toplam harcama: %.2f ₺ (%d gider)
                Kategori dağılımı:
                %s
                Kişi bazlı ödemeler:
                %s
                """.formatted(
                monthly.year(), monthly.month(),
                monthly.totalAmount(), monthly.expenseCount(),
                categoryLines, memberLines);
    }

    private String buildEnglishPrompt(MonthlyAnalyticsResponse monthly,
                                       String categoryLines, String memberLines) {
        return """
                Using the household expense data below, write a friendly and clear
                English monthly report for %d/%d. 3-4 sentences is enough.

                Total spending: %.2f ₺ (%d expenses)
                Category breakdown:
                %s
                Member payments:
                %s
                """.formatted(
                monthly.year(), monthly.month(),
                monthly.totalAmount(), monthly.expenseCount(),
                categoryLines, memberLines);
    }

    // Analytics service'i doğrudan firebaseUid olmadan çağırmak için
    // repository'ler üzerinden minimal veri çekiyoruz.
    private MonthlyAnalyticsResponse getMonthlyDataInternal(Long homeId, int year, int month) {
        LocalDateTime start = LocalDateTime.of(year, month, 1, 0, 0, 0);
        LocalDateTime end = start.withDayOfMonth(start.toLocalDate().lengthOfMonth()).withHour(23).withMinute(59).withSecond(59);
        BigDecimal total = expenseRepository.sumByHomeIdAndDateRange(homeId, start, end);
        int count = expenseRepository.findByHomeIdAndDateRange(homeId, start, end).size();
        return new MonthlyAnalyticsResponse(start.getYear(), start.getMonthValue(), total, count);
    }

    private List<CategoryAnalyticsResponse> getCategoryDataInternal(Long homeId, int year, int month) {
        LocalDateTime start = LocalDateTime.of(year, month, 1, 0, 0, 0);
        LocalDateTime end = start.withDayOfMonth(start.toLocalDate().lengthOfMonth()).withHour(23).withMinute(59).withSecond(59);
        BigDecimal grand = expenseRepository.sumByHomeIdAndDateRange(homeId, start, end);

        return expenseRepository.sumByCategoryAndDateRange(homeId, start, end).stream()
                .map(r -> new CategoryAnalyticsResponse(
                        (Long) r[0], (String) r[1], (BigDecimal) r[2],
                        calculatePercentage((BigDecimal) r[2], grand)))
                .toList();
    }

    private List<MemberAnalyticsResponse> getMemberDataInternal(Long homeId, int year, int month) {
        LocalDateTime start = LocalDateTime.of(year, month, 1, 0, 0, 0);
        LocalDateTime end = start.withDayOfMonth(start.toLocalDate().lengthOfMonth()).withHour(23).withMinute(59).withSecond(59);
        BigDecimal grand = expenseRepository.sumByHomeIdAndDateRange(homeId, start, end);

        return expenseRepository.sumByMemberAndDateRange(homeId, start, end).stream()
                .map(r -> new MemberAnalyticsResponse(
                        (Long) r[0], (String) r[1], (BigDecimal) r[2],
                        calculatePercentage((BigDecimal) r[2], grand)))
                .toList();
    }

    // ── 3. Anomali tespiti ───────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public AnomalyDetectionResponse detectAnomaly(String firebaseUid,
                                                   AnomalyDetectionRequest request) {
        User user = userService.getByFirebaseUid(firebaseUid);
        homeService.validateMembership(request.homeId(), user.getId());

        BigDecimal threeMonthAverage = calculateThreeMonthAverage(
                request.homeId(), request.categoryId());

        String prompt = buildAnomalyPrompt(request, threeMonthAverage);
        String raw = geminiClient.generate(prompt);

        AnomalyDetectionResponse result = parseAnomalyResponse(raw, threeMonthAverage, request.amount());

        if (result.anomaly()) {
            notificationService.sendToHomeMembers(
                    request.homeId(), null,
                    NotificationType.ANOMALY_DETECTED,
                    "Anormal Harcama Tespit Edildi",
                    "\"" + request.title() + "\" gideri normalin üzerinde: " + result.message(),
                    null
            );
        }

        return result;
    }

    private BigDecimal calculateThreeMonthAverage(Long homeId, Long categoryId) {
        LocalDateTime start = LocalDateTime.now().minusMonths(3).withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        LocalDateTime end   = LocalDateTime.now().minusDays(1).withHour(23).withMinute(59).withSecond(59);

        BigDecimal threeMonthSum = expenseRepository
                .sumByCategoryHomeAndDateRange(homeId, categoryId, start, end);

        return threeMonthSum.divide(BigDecimal.valueOf(3), 2, RoundingMode.HALF_UP);
    }

    private String buildAnomalyPrompt(AnomalyDetectionRequest request, BigDecimal average) {
        return """
                Bir ev harcama uygulamasında anormal harcama tespiti yapılıyor.

                Gider: "%s"
                Tutar: %.2f ₺
                Bu kategori için son 3 aylık ortalama: %.2f ₺

                Bu harcama anormal mi? Kısa ve net cevap ver:
                ANORMAL: <EVET veya HAYIR>
                MESAJ: <Türkçe kısa açıklama>
                """.formatted(request.title(), request.amount(), average);
    }

    private AnomalyDetectionResponse parseAnomalyResponse(String raw, BigDecimal average,
                                                            BigDecimal current) {
        boolean anomaly = false;
        String message = "";

        for (String line : raw.lines().toList()) {
            if (line.startsWith("ANORMAL:")) {
                anomaly = line.replace("ANORMAL:", "").strip().equalsIgnoreCase("EVET");
            } else if (line.startsWith("MESAJ:")) {
                message = line.replace("MESAJ:", "").strip();
            }
        }

        if (message.isBlank()) {
            message = anomaly
                    ? "Bu harcama normalin üzerinde görünüyor."
                    : "Bu harcama normal aralıkta.";
        }

        return new AnomalyDetectionResponse(anomaly, message, average, current);
    }

    // ── private helpers ──────────────────────────────────────────────────────

    private double calculatePercentage(BigDecimal part, BigDecimal total) {
        if (total.compareTo(BigDecimal.ZERO) == 0) return 0.0;
        return part.multiply(BigDecimal.valueOf(100))
                .divide(total, 2, RoundingMode.HALF_UP)
                .doubleValue();
    }
}