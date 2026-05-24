import React, { useMemo, useState } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { getExpenses, Expense } from '../../services/expenseService';
import { getMyDebts, getMyCredits } from '../../services/debtService';
import { useHome } from '../../context/HomeContext';
import { MainTabParamList, MainStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { useTranslation } from 'react-i18next';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Expenses'>,
  StackNavigationProp<MainStackParamList>
>;

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const CATEGORY_ICONS: Record<string, IoniconsName> = {
  // İngilizce
  food: 'restaurant-outline',
  rent: 'home-outline',
  bills: 'flash-outline',
  cleaning: 'brush-outline',
  other: 'ellipsis-horizontal-outline',
  // Türkçe
  'market': 'cart-outline',
  'yemek': 'restaurant-outline',
  'fatura': 'flash-outline',
  'kira': 'home-outline',
  'temizlik': 'brush-outline',
  'ulaşım': 'car-outline',
  'eğlence': 'musical-notes-outline',
  'sağlık': 'medical-outline',
  'diğer': 'ellipsis-horizontal-outline',
};

function formatCurrency(amount: number): string {
  return `₺${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateString: string | undefined, noDateLabel: string, locale: string): string {
  if (!dateString) return noDateLabel;
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return noDateLabel;
  return (
    d.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Europe/Istanbul',
    }) +
    '  ' +
    d.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Istanbul',
    })
  );
}

function getDateLabel(
  dateString: string | undefined,
  todayLabel: string,
  yesterdayLabel: string,
  otherLabel: string,
  locale: string,
): string {
  if (!dateString) return otherLabel;
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return otherLabel;
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const dStr = d.toDateString();
  if (dStr === today.toDateString()) return todayLabel;
  if (dStr === yesterday.toDateString()) return yesterdayLabel;
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Istanbul' });
}

type ListItem =
  | { type: 'header'; label: string }
  | { type: 'expense'; data: Expense }
  | { type: 'month-header'; label: string; monthKey: string; count: number; expanded: boolean };

function getMonthKey(dateString: string | undefined): string {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthLabel(monthKey: string, locale: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  const d = new Date(year, month - 1, 1);
  const label = d.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function SkeletonCard() {
  return <View style={styles.skeletonCard} />;
}

export default function ExpenseListScreen() {
  const { t } = useTranslation();
  const { i18n: i18nInstance } = useTranslation();
  const locale = i18nInstance.language === 'en' ? 'en-US' : 'tr-TR';
  const navigation = useNavigation<Nav>();
  const { activeHome } = useHome();
  const homeId = activeHome?.id ?? 0;

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ['expenses', homeId],
    queryFn: ({ pageParam }) => getExpenses(homeId, pageParam, 10),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.totalPages > allPages.length ? allPages.length : undefined,
    enabled: !!activeHome?.id,
  });

  const { data: myDebts } = useQuery({
    queryKey: ['debts', 'my', homeId],
    queryFn: () => getMyDebts(homeId),
    enabled: !!activeHome?.id,
  });

  const { data: myCredits } = useQuery({
    queryKey: ['debts', 'credits', homeId],
    queryFn: () => getMyCredits(homeId),
    enabled: !!activeHome?.id,
  });

  const debtStatusByExpense = useMemo(() => {
    const map: Record<number, string> = {};
    for (const d of myCredits ?? []) {
      if (d.expenseId) map[d.expenseId] = d.status;
    }
    for (const d of myDebts ?? []) {
      if (d.expenseId) map[d.expenseId] = d.status;
    }
    return map;
  }, [myDebts, myCredits]);

  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  function toggleMonth(key: string) {
    setExpandedMonths(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const expenses = data?.pages.flatMap((p) => p.content) ?? [];

  const currentMonthKey = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const groupedData: ListItem[] = useMemo(() => {
    const items: ListItem[] = [];
    const monthGroups: Record<string, Expense[]> = {};

    for (const expense of expenses) {
      const key = getMonthKey(expense.expenseDate ?? expense.date);
      if (!monthGroups[key]) monthGroups[key] = [];
      monthGroups[key].push(expense);
    }

    const sortedMonths = Object.keys(monthGroups).sort((a, b) => b.localeCompare(a));

    for (const monthKey of sortedMonths) {
      const monthExpenses = monthGroups[monthKey];
      const isCurrentMonth = monthKey === currentMonthKey;

      if (isCurrentMonth) {
        let lastLabel = '';
        for (const expense of monthExpenses) {
          const label = getDateLabel(expense.expenseDate ?? expense.date, t('expense.dateToday'), t('expense.dateYesterday'), t('expense.dateOther'), locale);
          if (label !== lastLabel) {
            items.push({ type: 'header', label });
            lastLabel = label;
          }
          items.push({ type: 'expense', data: expense });
        }
      } else {
        const isExpanded = expandedMonths.has(monthKey);
        items.push({
          type: 'month-header',
          label: getMonthLabel(monthKey, locale),
          monthKey,
          count: monthExpenses.length,
          expanded: isExpanded,
        });

        if (isExpanded) {
          let lastLabel = '';
          for (const expense of monthExpenses) {
            const label = getDateLabel(expense.expenseDate ?? expense.date, t('expense.dateToday'), t('expense.dateYesterday'), t('expense.dateOther'), locale);
            if (label !== lastLabel) {
              items.push({ type: 'header', label });
              lastLabel = label;
            }
            items.push({ type: 'expense', data: expense });
          }
        }
      }
    }

    return items;
  }, [expenses, expandedMonths, currentMonthKey, locale, t]);

  const DEBT_STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    PENDING: { bg: 'rgba(245,158,11,0.15)', text: '#F59E0B', border: 'rgba(245,158,11,0.3)' },
    MARKED_AS_PAID: { bg: 'rgba(99,102,241,0.15)', text: '#6366F1', border: 'rgba(99,102,241,0.3)' },
    CONFIRMED: { bg: 'rgba(16,185,129,0.15)', text: colors.secondary, border: 'rgba(16,185,129,0.3)' },
    REJECTED: { bg: 'rgba(239,68,68,0.12)', text: colors.danger, border: 'rgba(239,68,68,0.25)' },
  };
  const debtStatusLabels: Record<string, string> = {
    PENDING: t('debt.statusPending'),
    MARKED_AS_PAID: t('debt.statusMarkedAsPaid'),
    CONFIRMED: t('debt.statusConfirmed'),
    REJECTED: t('debt.statusRejected'),
  };

  function renderExpenseCard({ item }: { item: Expense }) {
    const isCancelled = item.status === 'CANCELLED';
    const isEdited = item.status === 'EDITED';
    const isActive = item.status === 'ACTIVE' || !item.status;
    const isPaid = item.allDebtsConfirmed === true && !isCancelled;
    const debtStatus = debtStatusByExpense[item.id];
    const debtColor = debtStatus ? DEBT_STATUS_COLORS[debtStatus] : null;
    return (
      <TouchableOpacity
        style={[styles.card, isCancelled && styles.cardCancelled]}
        onPress={() => navigation.navigate('ExpenseDetail', { expenseId: item.id })}
      >
        <View style={[styles.categoryIcon, isCancelled && styles.categoryIconCancelled]}>
          <Ionicons
            name={CATEGORY_ICONS[(item.categoryName ?? item.category ?? '').toLowerCase()] ?? 'ellipsis-horizontal-outline'}
            size={24}
            color={isCancelled ? colors.textHint : colors.primary}
          />
        </View>
        <View style={styles.cardInfo}>
          <Text
            style={[styles.description, isCancelled && styles.textCancelled]}
            numberOfLines={1}
          >
            {item.title ?? item.description}
          </Text>
          <Text style={[styles.meta, isCancelled && styles.textCancelled]}>
            {item.paidByName} · {formatDate(item.expenseDate ?? item.date, t('dashboard.noDate'), locale)}
          </Text>
        </View>
        <View style={styles.cardRight}>
          <Text style={[styles.amount, isCancelled && styles.amountCancelled]}>
            {formatCurrency(item.amount)}
          </Text>
          {debtColor && !isCancelled && (
            <View style={[styles.badge, { backgroundColor: debtColor.bg, borderWidth: 1, borderColor: debtColor.border }]}>
              <Text style={[styles.badgeText, { color: debtColor.text }]}>
                {debtStatusLabels[debtStatus!] ?? debtStatus}
              </Text>
            </View>
          )}
          {!debtColor && isCancelled && (
            <View style={[styles.badge, styles.badgeCancelled]}>
              <Text style={styles.badgeCancelledText}>{t('expense.statusCancelled')}</Text>
            </View>
          )}
          {!debtColor && !isCancelled && isPaid && (
            <View style={[styles.badge, styles.badgePaid]}>
              <Text style={styles.badgePaidText}>{t('expense.statusPaid')}</Text>
            </View>
          )}
          {!debtColor && !isCancelled && !isPaid && isEdited && (
            <View style={[styles.badge, styles.badgeEdited]}>
              <Text style={styles.badgeEditedText}>{t('expense.statusEdited')}</Text>
            </View>
          )}
          {!debtColor && !isCancelled && !isPaid && !isEdited && isActive && (
            <View style={[styles.badge, styles.badgeActive]}>
              <Text style={styles.badgeActiveText}>{t('expense.statusActive')}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={groupedData}
        keyExtractor={(item, index) =>
          item.type === 'expense' ? item.data.id.toString() : `header-${index}`
        }
        renderItem={({ item }) => {
          if (item.type === 'month-header') {
            return (
              <TouchableOpacity
                style={styles.monthHeader}
                onPress={() => toggleMonth(item.monthKey)}
                activeOpacity={0.7}
              >
                <Text style={styles.monthHeaderLabel}>{item.label}</Text>
                <View style={styles.monthHeaderRight}>
                  <Text style={styles.monthHeaderCount}>
                    {t('expense.monthExpenseCount', { count: item.count })}
                  </Text>
                  <Ionicons
                    name={item.expanded ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={colors.subText}
                  />
                </View>
              </TouchableOpacity>
            );
          }
          if (item.type === 'header') {
            return <Text style={styles.sectionLabel}>{item.label}</Text>;
          }
          return renderExpenseCard({ item: item.data });
        }}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={({ leadingItem }) =>
          leadingItem?.type === 'header' || leadingItem?.type === 'month-header' ? null : <View style={styles.separator} />
        }
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color={colors.subText} />
            <Text style={styles.emptyText}>{t('expense.noExpense')}</Text>
          </View>
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={{ marginVertical: 16 }}
            />
          ) : null
        }
      />
      <TouchableOpacity
        onPress={() => navigation.navigate('AddExpense')}
        style={styles.fab}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={['#1E40AF', '#0D9488']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 88 },
  separator: { height: 8 },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.subText,
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 8,
    marginHorizontal: 4,
  },

  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  monthHeaderLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  monthHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  monthHeaderCount: {
    fontSize: 12,
    color: colors.subText,
  },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingTop: 80,
  },
  emptyText: { fontSize: 16, color: colors.subText },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: `${colors.primary}26`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardInfo: { flex: 1 },
  description: { fontSize: 17, fontWeight: '600', color: colors.text, marginBottom: 3 },
  meta: { fontSize: 14, color: colors.subText },
  amount: { fontSize: 17, fontWeight: '700', color: colors.text },
  cardRight: { alignItems: 'flex-end', gap: 4, marginLeft: 8 },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-end',
  },
  badgeCancelled: { backgroundColor: `${colors.danger}33`, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  badgeEdited: { backgroundColor: `${colors.warning}33`, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  badgeCancelledText: { fontSize: 11, fontWeight: '600', color: colors.danger },
  badgeEditedText: { fontSize: 11, fontWeight: '600', color: colors.warning },
  badgeActive: { backgroundColor: 'rgba(16,185,129,0.15)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  badgeActiveText: { fontSize: 11, fontWeight: '600', color: colors.secondary },
  badgePaid: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgePaidText: { fontSize: 11, fontWeight: '600', color: colors.secondary },
  badgeText: { fontSize: 11, fontWeight: '600' },
  cardCancelled: { backgroundColor: colors.surfaceElevated },
  categoryIconCancelled: { backgroundColor: colors.surfaceElevated },
  textCancelled: { color: colors.textHint },
  amountCancelled: { color: colors.textHint, textDecorationLine: 'line-through' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skeletonCard: {
    height: 72,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 10,
  },
});
