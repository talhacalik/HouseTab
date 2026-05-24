import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { generateMonthlyReport, getMonthlyReports } from '../../services/aiService';
import { useHome } from '../../context/HomeContext';
import { colors } from '../../theme/colors';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { useTranslation } from 'react-i18next';

function processBold(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <Text key={i} style={styles.reportBold}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    return part;
  });
}

function renderReport(text: string): React.ReactNode[] {
  return text.split('\n').map((line, index) => {
    if (line.startsWith('## ') || line.startsWith('# ')) {
      return (
        <Text key={index} style={styles.reportHeading}>
          {line.replace(/^#{1,2} /, '')}
        </Text>
      );
    }
    if (line.startsWith('- ') || line.startsWith('* ')) {
      return (
        <View key={index} style={styles.reportBulletRow}>
          <Text style={styles.reportBulletDot}>{'•  '}</Text>
          <Text style={styles.reportBulletText}>{processBold(line.slice(2))}</Text>
        </View>
      );
    }
    if (line.trim() === '') {
      return <View key={index} style={styles.reportSpacer} />;
    }
    return (
      <Text key={index} style={styles.reportParagraph}>
        {processBold(line)}
      </Text>
    );
  });
}

const YEARS = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i);

export default function AIReportScreen() {
  const { t } = useTranslation();
  const { i18n: i18nInstance } = useTranslation();
  const locale = i18nInstance.language === 'en' ? 'en-US' : 'tr-TR';
  const { activeHome } = useHome();

  const MONTHS = [
    { value: 1, label: t('analytics.months.jan') },
    { value: 2, label: t('analytics.months.feb') },
    { value: 3, label: t('analytics.months.mar') },
    { value: 4, label: t('analytics.months.apr') },
    { value: 5, label: t('analytics.months.may') },
    { value: 6, label: t('analytics.months.jun') },
    { value: 7, label: t('analytics.months.jul') },
    { value: 8, label: t('analytics.months.aug') },
    { value: 9, label: t('analytics.months.sep') },
    { value: 10, label: t('analytics.months.oct') },
    { value: 11, label: t('analytics.months.nov') },
    { value: 12, label: t('analytics.months.dec') },
  ];
  const homeId = activeHome?.id ?? 0;
  const queryClient = useQueryClient();

  const now = new Date();
  const [language, setLanguage] = useState<'TR' | 'EN'>('TR');
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [report, setReport] = useState<string | null>(null);
  const [reportMeta, setReportMeta] = useState<{ month: number; year: number } | null>(null);

  const { data: savedReports } = useQuery({
    queryKey: ['monthly-reports', homeId],
    queryFn: () => getMonthlyReports(homeId),
    enabled: !!homeId,
  });

  const mutation = useMutation({
    mutationFn: () => generateMonthlyReport(homeId, language, selectedYear, selectedMonth),
    onSuccess: (data) => {
      setReport(data.report);
      setReportMeta({ month: data.month, year: data.year });
      queryClient.invalidateQueries({ queryKey: ['monthly-reports', homeId] });
    },
    onError: (error: Error) => {
      Toast.show({
        type: 'error',
        text1: t('common.errorTitle'),
        text2: (error as { response?: { data?: { message?: string } } }).response?.data?.message ?? t('analytics.reportGenerateError'),
      });
    },
  });

  const monthLabel = now.toLocaleDateString(locale, { month: 'long', year: 'numeric' });

  const reportMonthLabel = reportMeta
    ? new Date(reportMeta.year, reportMeta.month - 1).toLocaleDateString(locale, {
        month: 'long',
        year: 'numeric',
      })
    : new Date(selectedYear, selectedMonth - 1).toLocaleDateString(locale, {
        month: 'long',
        year: 'numeric',
      });

  function handleGenerate() {
    setReport(null);
    mutation.mutate();
  }

  async function handleShare() {
    if (!report) return;
    try {
      const fileName = `housetab-rapor-${selectedYear}-${String(selectedMonth).padStart(2, '0')}.txt`;
      const fileUri = FileSystem.documentDirectory + fileName;
      await FileSystem.writeAsStringAsync(fileUri, report, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/plain',
          dialogTitle: t('analytics.shareDialogTitle'),
        });
      } else {
        Toast.show({ type: 'info', text1: t('analytics.sharingNotAvailable') });
      }
    } catch (e) {
      Toast.show({ type: 'error', text1: t('common.errorTitle'), text2: t('analytics.reportShareError') });
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header kartı */}
      <LinearGradient
        colors={['#1E40AF', '#0D9488']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerCard}
      >
        <View style={styles.headerDecor} />
        <Ionicons name="analytics-outline" size={32} color="#FFFFFF" style={styles.headerIcon} />
        <Text style={styles.headerTitle}>{t('analytics.aiReportTitle')}</Text>
        <Text style={styles.headerSub}>
          {new Date(selectedYear, selectedMonth - 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' })}
        </Text>
      </LinearGradient>

      {/* Dil seçimi */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { textTransform: 'uppercase' }]}>{t('analytics.reportLanguage')}</Text>
        <View style={styles.langRow}>
          <TouchableOpacity
            style={[styles.langBtn, language === 'TR' && styles.langBtnActive]}
            onPress={() => setLanguage('TR')}
          >
            <Text style={[styles.langBtnText, language === 'TR' && styles.langBtnTextActive]}>
              {t('analytics.langTR')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.langBtn, language === 'EN' && styles.langBtnActive]}
            onPress={() => setLanguage('EN')}
          >
            <Text style={[styles.langBtnText, language === 'EN' && styles.langBtnTextActive]}>
              {t('analytics.langEN')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Dönem seçimi */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { textTransform: 'uppercase' }]}>{t('analytics.selectPeriod')}</Text>

        {/* Seçili dönem badge */}
        <View style={styles.selectedBadge}>
          <View style={styles.selectedBadgeDot} />
          <Text style={styles.selectedBadgeText}>
            {new Date(selectedYear, selectedMonth - 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' })}
          </Text>
        </View>

        {/* Yıl seçimi */}
        <View style={styles.monthGrid}>
          {YEARS.map((year) => (
            <TouchableOpacity
              key={year}
              style={[styles.monthBtn, selectedYear === year && styles.monthBtnActive]}
              onPress={() => setSelectedYear(year)}
            >
              <Text style={[styles.monthBtnText, selectedYear === year && styles.monthBtnTextActive]}>
                {year}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.periodDivider} />

        {/* Ay seçimi — 3'lü grid */}
        <View style={styles.monthGrid}>
          {MONTHS.map((m) => {
            const isFuture = selectedYear === now.getFullYear() && m.value > now.getMonth() + 1;
            return (
              <TouchableOpacity
                key={m.value}
                style={[
                  styles.monthBtn,
                  selectedMonth === m.value && styles.monthBtnActive,
                  isFuture && styles.monthBtnDisabled,
                ]}
                onPress={() => !isFuture && setSelectedMonth(m.value)}
                disabled={isFuture}
              >
                <Text style={[
                  styles.monthBtnText,
                  selectedMonth === m.value && styles.monthBtnTextActive,
                  isFuture && styles.monthBtnTextDisabled,
                ]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Geçmiş Raporlar */}
      {(savedReports ?? []).length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { textTransform: 'uppercase' }]}>{t('analytics.savedReports')}</Text>
          {(savedReports ?? []).map((r, index) => {
            const label = new Date(r.year, r.month - 1).toLocaleDateString(locale, {
              month: 'long',
              year: 'numeric',
            });
            return (
              <View
                key={index}
                style={[styles.historyItem, index > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}
              >
                <View style={styles.historyItemIcon}>
                  <Ionicons name="document-text-outline" size={16} color={colors.primary} />
                </View>
                <View style={styles.historyItemInfo}>
                  <Text style={styles.historyItemLabel}>{label}</Text>
                  <Text style={styles.historyItemLang}>{r.language === 'TR' ? t('analytics.langTurkishLabel') : t('analytics.langEnglishLabel')}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Oluştur butonu */}
      <TouchableOpacity
        onPress={handleGenerate}
        disabled={mutation.isPending}
        style={styles.btn}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={['#1E40AF', '#0D9488']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.btnGradient}
        >
          {mutation.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.btnLabel}>{t('analytics.generateReport')}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>

      {/* Loading */}
      {mutation.isPending && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t('analytics.reportLoading')}</Text>
          <Text style={styles.loadingSubText}>{t('analytics.reportLoadingSub')}</Text>
        </View>
      )}

      {/* Rapor */}
      {report && !mutation.isPending && (
        <View style={styles.reportCard}>
          <View style={styles.reportHeader}>
            <Ionicons name="document-text-outline" size={20} color={colors.primary} />
            <View style={styles.reportHeaderText}>
              <Text style={styles.reportTitle}>{t('analytics.monthlyAnalysisReport')}</Text>
              <Text style={styles.reportSubTitle}>{reportMonthLabel}</Text>
            </View>
          </View>
          <View style={styles.reportDivider} />
          <View style={styles.reportBody}>{renderReport(report)}</View>
        </View>
      )}
      {report && !mutation.isPending && (
        <TouchableOpacity
          onPress={handleShare}
          style={styles.shareBtn}
          activeOpacity={0.8}
        >
          <Ionicons name="share-outline" size={18} color={colors.primary} />
          <Text style={styles.shareBtnText}>{t('analytics.shareReport')}</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 48 },

  headerCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  headerDecor: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  headerIcon: { marginBottom: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)' },

  section: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.subText,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  langRow: { flexDirection: 'row', gap: 10 },
  langBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  langBtnActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(37,99,235,0.1)',
  },
  langBtnText: { fontSize: 14, color: colors.subText, fontWeight: '500' },
  langBtnTextActive: { color: colors.primary, fontWeight: '700' },

  btn: { borderRadius: 50, overflow: 'hidden', marginBottom: 20 },
  btnGradient: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center', borderRadius: 50 },
  btnLabel: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },

  loadingBox: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 32,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  loadingSubText: {
    fontSize: 13,
    color: colors.subText,
  },

  reportCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  reportHeaderText: { flex: 1 },
  reportTitle: { fontSize: 15, fontWeight: 'bold', color: colors.text },
  reportSubTitle: { fontSize: 12, color: colors.subText, marginTop: 2 },
  reportDivider: { height: 1, backgroundColor: colors.border, marginBottom: 16 },
  reportBody: { gap: 2 },

  reportHeading: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 12,
    marginBottom: 4,
  },
  reportParagraph: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
  },
  reportBold: {
    fontWeight: '700',
    color: colors.text,
  },
  reportBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 2,
  },
  reportBulletDot: {
    fontSize: 14,
    color: colors.primary,
    lineHeight: 22,
  },
  reportBulletText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
  },
  reportSpacer: { height: 8 },

  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(37,99,235,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(37,99,235,0.3)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  selectedBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  selectedBadgeText: {
    fontSize: 12,
    color: '#60A5FA',
    fontWeight: '600',
  },
  periodDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  monthBtn: {
    width: '30%',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  monthBtnActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(37,99,235,0.15)',
  },
  monthBtnDisabled: { opacity: 0.3 },
  monthBtnText: { fontSize: 12, color: colors.subText, fontWeight: '500' },
  monthBtnTextActive: { color: '#60A5FA', fontWeight: '700' },
  monthBtnTextDisabled: { color: colors.textHint },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginTop: 12,
  },
  shareBtnText: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: '600',
  },

  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  historyItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(37,99,235,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyItemInfo: { flex: 1 },
  historyItemLabel: { fontSize: 14, color: colors.text, fontWeight: '500' },
  historyItemLang: { fontSize: 12, color: colors.subText, marginTop: 2 },
});
