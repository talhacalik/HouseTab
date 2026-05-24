package org.calik.sharedhomefinance.ai;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class MonthlyReportScheduler {

    private static final Logger log = LoggerFactory.getLogger(MonthlyReportScheduler.class);

    private final AIService aiService;

    /**
     * Her ayın 1'inde saat 09:00'da tüm evler için aylık rapor üretir.
     * Üretilen raporlar Adım 9 (FCM) tamamlandıktan sonra OWNER'a bildirim olarak iletilecek.
     */
    @Scheduled(cron = "0 0 9 1 * *")
    public void generateMonthlyReports() {
        log.info("Aylık rapor zamanlanmış görevi başladı.");
        try {
            aiService.generateMonthlyReportsForAllHomes();
        } catch (Exception ex) {
            log.error("Aylık rapor görevi hata ile sonuçlandı: {}", ex.getMessage());
        }
        log.info("Aylık rapor zamanlanmış görevi tamamlandı.");
    }
}