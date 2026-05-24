package org.calik.sharedhomefinance.domain.analytics.service;

import org.calik.sharedhomefinance.domain.analytics.dto.*;

import java.util.List;

public interface AnalyticsService {

    /** Mevcut ayın toplam harcaması ve gider sayısı. */
    MonthlyAnalyticsResponse getMonthlyAnalytics(String firebaseUid, Long homeId);

    /** Mevcut ay, kategori bazlı harcama dağılımı ve yüzdeleri. */
    List<CategoryAnalyticsResponse> getCategoryAnalytics(String firebaseUid, Long homeId);

    /** Mevcut ay, üye bazlı ödenen harcama tutarları ve yüzdeleri. */
    List<MemberAnalyticsResponse> getMemberAnalytics(String firebaseUid, Long homeId);

    /** Kullanıcının bu evdeki toplam borcu, alacağı ve net bakiyesi. */
    PersonalAnalyticsResponse getPersonalAnalytics(String firebaseUid, Long homeId);
}