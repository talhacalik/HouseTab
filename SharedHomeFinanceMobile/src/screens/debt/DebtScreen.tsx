import React, { useState } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { getMyDebts, getMyCredits, Debt } from '../../services/debtService';
import { useHome } from '../../context/HomeContext';
import { MainTabParamList, MainStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { useTranslation } from 'react-i18next';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Debts'>,
  StackNavigationProp<MainStackParamList>
>;

type TabKey = 'debts' | 'credits';

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  PENDING: { bg: 'rgba(245,158,11,0.15)', text: '#F59E0B', border: 'rgba(245,158,11,0.3)' },
  MARKED_AS_PAID: { bg: 'rgba(99,102,241,0.15)', text: '#6366F1', border: 'rgba(99,102,241,0.3)' },
  PAID: { bg: 'rgba(16,185,129,0.15)', text: colors.secondary, border: 'rgba(16,185,129,0.3)' },
  CONFIRMED: { bg: 'rgba(16,185,129,0.15)', text: colors.secondary, border: 'rgba(16,185,129,0.3)' },
  REJECTED: { bg: 'rgba(239,68,68,0.12)', text: colors.danger, border: 'rgba(239,68,68,0.25)' },
};

function formatCurrency(amount: number): string {
  return `₺${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateString: string | undefined, locale: string): string {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
}

const COLOR_OPTIONS: Record<string, [string, string]> = {
  '#1E40AF': ['#1E40AF', '#0D9488'],
  '#7C3AED': ['#7C3AED', '#EC4899'],
  '#D97706': ['#D97706', '#DC2626'],
  '#065F46': ['#065F46', '#10B981'],
  '#1E3A5F': ['#1E3A5F', '#2563EB'],
  '#831843': ['#831843', '#F43F5E'],
};

function SkeletonCard() {
  return <View style={styles.skeletonCard} />;
}

export default function DebtScreen() {
  const { t } = useTranslation();
  const { i18n: i18nInstance } = useTranslation();
  const locale = i18nInstance.language === 'en' ? 'en-US' : 'tr-TR';
  const navigation = useNavigation<Nav>();
  const { activeHome } = useHome();
  const homeId = activeHome?.id ?? 0;
  const [activeTab, setActiveTab] = useState<TabKey>('debts');

  const statusLabels: Record<string, string> = {
    PENDING: t('debt.statusPending'),
    MARKED_AS_PAID: t('debt.statusMarkedAsPaid'),
    PAID: t('debt.statusPaid'),
    CONFIRMED: t('debt.statusConfirmed'),
    REJECTED: t('debt.statusRejected'),
  };

  const { data: myDebts, isLoading: debtsLoading } = useQuery({
    queryKey: ['debts', 'my', homeId],
    queryFn: () => getMyDebts(homeId),
    enabled: !!activeHome?.id,
  });

  const { data: myCredits, isLoading: creditsLoading } = useQuery({
    queryKey: ['debts', 'credits', homeId],
    queryFn: () => getMyCredits(homeId),
    enabled: !!activeHome?.id,
  });

  const isLoading = activeTab === 'debts' ? debtsLoading : creditsLoading;
  const listData = activeTab === 'debts' ? (myDebts ?? []) : (myCredits ?? []);
  const emptyText = activeTab === 'debts' ? t('debt.emptyDebts') : t('debt.emptyCredits');

  const total = listData
    .filter(item => item.status === 'PENDING' || item.status === 'MARKED_AS_PAID')
    .reduce((sum, item) => sum + item.amount, 0);
  const activeCount = listData.filter(item => item.status === 'PENDING').length;
  const awaitingCount = listData.filter(item => item.status === 'MARKED_AS_PAID').length;
  const paidCount = listData.filter(
    item => item.status === 'PAID' || item.status === 'CONFIRMED',
  ).length;

  function renderDebtCard({ item, index }: { item: Debt; index: number }) {
    const statusColor = STATUS_COLORS[item.status] ?? STATUS_COLORS.PENDING;
    const otherPerson = activeTab === 'debts' ? item.creditorName : item.borrowerName;
    const avatarColor = activeTab === 'debts' ? item.creditorAvatarColor : item.borrowerAvatarColor;
    const avatarEmoji = activeTab === 'debts' ? item.creditorAvatarEmoji : item.borrowerAvatarEmoji;

    const gradientColors: [string, string] = avatarColor && COLOR_OPTIONS[avatarColor]
      ? COLOR_OPTIONS[avatarColor]
      : index % 3 === 0
        ? ['#2563EB', '#0D9488']
        : index % 3 === 1
          ? ['#7C3AED', '#EC4899']
          : ['#D97706', '#DC2626'];

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate('DebtDetail', {
            debtId: item.id,
            expenseId: item.expenseId ?? 0,
            rejected: item.status === 'REJECTED',
          })
        }
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatar}
        >
          {avatarEmoji ? (
            <Text style={styles.avatarEmoji}>{avatarEmoji}</Text>
          ) : (
            <Text style={styles.avatarText}>{otherPerson.charAt(0).toUpperCase()}</Text>
          )}
        </LinearGradient>
        <View style={styles.cardInfo}>
          <Text style={styles.personName} numberOfLines={1}>{otherPerson}</Text>
          <Text style={styles.expenseTitle} numberOfLines={1}>{item.expenseTitle}</Text>
          {item.expenseDate ? (
            <Text style={styles.date}>{formatDate(item.expenseDate, locale)}</Text>
          ) : null}
        </View>
        <View style={styles.cardRight}>
          <Text style={[
            styles.amount,
            activeTab === 'debts' ? styles.debtAmount : styles.creditAmount,
          ]}>
            {formatCurrency(item.amount)}
          </Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: statusColor.bg, borderWidth: 1, borderColor: statusColor.border },
          ]}>
            <Text style={[styles.statusText, { color: statusColor.text }]}>
              {statusLabels[item.status] ?? item.status}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'debts' && styles.tabActive]}
          onPress={() => setActiveTab('debts')}
        >
          <Text style={[styles.tabLabel, activeTab === 'debts' && styles.tabLabelActive]}>
            {t('debt.tabDebts')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'credits' && styles.tabActive]}
          onPress={() => setActiveTab('credits')}
        >
          <Text style={[styles.tabLabel, activeTab === 'credits' && styles.tabLabelActive]}>
            {t('debt.tabCredits')}
          </Text>
        </TouchableOpacity>
      </View>

      {!isLoading && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>
            {activeTab === 'debts' ? t('debt.totalOwe') : t('debt.totalOwed')}
          </Text>
          <Text style={[
            styles.summaryTotal,
            { color: activeTab === 'debts' ? colors.danger : colors.secondary },
          ]}>
            {formatCurrency(total)}
          </Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryMetric}>
              <Text style={styles.summaryMetricValue}>{activeCount}</Text>
              <Text style={styles.summaryMetricLabel}>{t('debt.activeLabel')}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryMetric}>
              <Text style={styles.summaryMetricValue}>{awaitingCount}</Text>
              <Text style={styles.summaryMetricLabel}>{t('debt.awaitingLabel')}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryMetric}>
              <Text style={styles.summaryMetricValue}>{paidCount}</Text>
              <Text style={styles.summaryMetricLabel}>{t('debt.paidLabel')}</Text>
            </View>
          </View>
        </View>
      )}

      {isLoading ? (
        <View style={styles.skeletonContainer}>
          {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item, index }) => renderDebtCard({ item, index })}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle-outline" size={64} color={colors.subText} />
              <Text style={styles.emptyText}>{emptyText}</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: colors.primary },
  tabLabel: { fontSize: 14, fontWeight: '600', color: colors.subText },
  tabLabelActive: { color: colors.primary },

  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    margin: 14,
    marginBottom: 4,
    padding: 16,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.subText,
    textAlign: 'center',
    marginBottom: 4,
  },
  summaryTotal: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  summaryMetric: { alignItems: 'center', flex: 1 },
  summaryMetricValue: { fontSize: 18, fontWeight: '700', color: colors.text },
  summaryMetricLabel: { fontSize: 11, color: colors.subText, marginTop: 2 },
  summaryDivider: { width: 1, height: 32, backgroundColor: colors.border },

  list: { padding: 16, paddingBottom: 24 },
  separator: { height: 10 },
  skeletonContainer: { padding: 16, gap: 10 },
  skeletonCard: { height: 80, backgroundColor: colors.surfaceElevated, borderRadius: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' },
  avatarEmoji: { fontSize: 22 },
  cardInfo: { flex: 1, marginRight: 8 },
  personName: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 2 },
  expenseTitle: { fontSize: 12, color: colors.subText, marginBottom: 2 },
  date: { fontSize: 11, color: colors.subText },
  cardRight: { alignItems: 'flex-end', gap: 6 },
  amount: { fontSize: 15, fontWeight: '700' },
  debtAmount: { color: colors.danger },
  creditAmount: { color: colors.secondary },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '600' },
  emptyState: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingTop: 80,
  },
  emptyText: { fontSize: 16, color: colors.subText },
});
