package org.calik.sharedhomefinance.ai;

import org.calik.sharedhomefinance.ai.dto.*;

import java.util.List;

public interface AIService {

    /**
     * Gider başlığından en uygun sistemi kategoriyi önerir.
     */
    CategorySuggestionResponse suggestCategory(String firebaseUid, CategorySuggestionRequest request);

    /**
     * Evin mevcut ay harcamalarını analiz ederek doğal dil raporu üretir.
     */
    MonthlyReportResponse generateMonthlyReport(String firebaseUid, MonthlyReportRequest request);

    /**
     * Yeni giderin kategori ortalamasına göre anormal olup olmadığını tespit eder.
     */
    AnomalyDetectionResponse detectAnomaly(String firebaseUid, AnomalyDetectionRequest request);

    /**
     * Evin daha önce üretilmiş aylık raporlarını listeler.
     */
    List<MonthlyReportResponse> getMonthlyReports(String firebaseUid, Long homeId);

    /**
     * Scheduler tarafından çağrılır — tüm evler için aylık rapor üretir.
     */
    void generateMonthlyReportsForAllHomes();
}