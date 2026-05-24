import React, { useCallback, useLayoutEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  BackHandler,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useHome } from '../../context/HomeContext';
import { MainTabParamList, MainStackParamList } from '../../navigation/types';
import {
  getMonthlyAnalytics,
  getPersonalAnalytics,
} from '../../services/analyticsService';
import { getExpenses } from '../../services/expenseService';
import { getMyDebts } from '../../services/debtService';
import { getNotifications } from '../../services/notificationService';
import { colors } from '../../theme/colors';
import { useTranslation } from 'react-i18next';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Dashboard'>,
  StackNavigationProp<MainStackParamList>
>;

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const AVATAR_COLOR_OPTIONS: Record<string, [string, string]> = {
  '#1E40AF': ['#1E40AF', '#0D9488'],
  '#7C3AED': ['#7C3AED', '#EC4899'],
  '#D97706': ['#D97706', '#DC2626'],
  '#065F46': ['#065F46', '#10B981'],
  '#1E3A5F': ['#1E3A5F', '#2563EB'],
  '#831843': ['#831843', '#F43F5E'],
};
const DEBT_AVATAR_FALLBACKS: [string, string][] = [
  ['#2563EB', '#0D9488'],
  ['#7C3AED', '#EC4899'],
  ['#D97706', '#DC2626'],
];

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

function SkeletonBox({ style }: { style?: object }) {
  return <View style={[styles.skeleton, style]} />;
}

export default function DashboardScreen() {
  const { t } = useTranslation();
  const { i18n: i18nInstance } = useTranslation();
  const locale = i18nInstance.language === 'en' ? 'en-US' : 'tr-TR';
  const navigation = useNavigation<Nav>();
  const { activeHome, setActiveHome } = useHome();
  const insets = useSafeAreaInsets();
  const homeId = activeHome?.id ?? 0;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation, activeHome, setActiveHome]);

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        Alert.alert(
          t('dashboard.exitAppTitle'),
          t('dashboard.exitAppMessage'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('dashboard.exitAppConfirm'), style: 'destructive', onPress: () => BackHandler.exitApp() },
          ],
          { cancelable: true },
        );
        return true;
      });
      return () => subscription.remove();
    }, []),
  );

  const { data: monthly, isLoading: monthlyLoading } = useQuery({
    queryKey: ['analytics', 'monthly', homeId],
    queryFn: () => getMonthlyAnalytics(homeId),
    enabled: !!activeHome?.id,
  });

  const { data: personal, isLoading: personalLoading } = useQuery({
    queryKey: ['analytics', 'personal', homeId],
    queryFn: () => getPersonalAnalytics(homeId),
    enabled: !!activeHome?.id,
  });

  const { data: myDebts, isLoading: debtLoading } = useQuery({
    queryKey: ['debts', 'my', homeId],
    queryFn: () => getMyDebts(homeId),
    enabled: !!activeHome?.id,
  });
  const activeDebts = (myDebts ?? []).filter(
    d => d.status === 'PENDING' || d.status === 'MARKED_AS_PAID',
  );
  const totalActiveDebt = activeDebts.reduce((sum, d) => sum + d.amount, 0);

  const { data: expensesPage, isLoading: expensesLoading } = useQuery({
    queryKey: ['expenses', homeId, 0, 5],
    queryFn: () => getExpenses(homeId, 0, 5),
    enabled: !!activeHome?.id,
  });

  const { data: notificationList } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
  });
  const hasUnread = (notificationList ?? []).some((n) => !n.read);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['left', 'right', 'bottom']}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => setActiveHome(null)} style={styles.headerBtn}>
          <Ionicons name="chevron-back-outline" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{activeHome?.name ?? t('dashboard.title')}</Text>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.navigate('NotificationScreen')}
        >
          <View>
            <Ionicons
              name={hasUnread ? 'notifications' : 'notifications-outline'}
              size={26}
              color={colors.text}
            />
            {hasUnread && <View style={styles.notifBadgeDot} />}
          </View>
        </TouchableOpacity>
      </View>
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Özet Kartı */}
      <TouchableOpacity
        onPress={() => navigation.navigate('CategoryAnalytics')}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={['#1E40AF', '#0D9488']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.summaryCard}
        >
          <Text style={styles.summaryLabel}>{t('dashboard.monthTotal')}</Text>
          {monthlyLoading ? (
            <SkeletonBox style={styles.skeletonAmountLg} />
          ) : (
            <Text style={styles.summaryAmount}>
              {formatCurrency(monthly?.totalAmount ?? 0)}
            </Text>
          )}
          <View style={styles.summaryRow}>
            <View style={styles.miniCard}>
              <Text style={styles.summaryItemLabel}>{t('debt.owe')}</Text>
              {personalLoading ? (
                <SkeletonBox style={styles.skeletonAmountSm} />
              ) : (
                <Text style={styles.debtAmount}>
                  {formatCurrency(personal?.totalDebt ?? 0)}
                </Text>
              )}
            </View>
            <View style={styles.miniCard}>
              <Text style={styles.summaryItemLabel}>{t('debt.owed')}</Text>
              {personalLoading ? (
                <SkeletonBox style={styles.skeletonAmountSm} />
              ) : (
                <Text style={styles.creditAmount}>
                  {formatCurrency(personal?.totalCredit ?? 0)}
                </Text>
              )}
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Borçlarım */}
      <View style={styles.section}>
        <View style={[styles.sectionHeader, { alignItems: 'flex-start' }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>{t('debt.tabDebts')}</Text>
            {!debtLoading && activeDebts.length > 0 && (
              <Text style={styles.debtMeta}>
                {activeDebts.length} bekleyen · -{formatCurrency(totalActiveDebt)}
              </Text>
            )}
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('Debts')}
            style={{ paddingTop: 2 }}
          >
            <Text style={styles.seeAll}>{t('dashboard.seeAll')}</Text>
          </TouchableOpacity>
        </View>

        {debtLoading ? (
          <>
            <SkeletonBox style={styles.skeletonRow} />
            <SkeletonBox style={styles.skeletonRow} />
            <SkeletonBox style={styles.skeletonRow} />
          </>
        ) : activeDebts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle-outline" size={28} color={colors.secondary} />
            <Text style={styles.emptyText}>{t('debt.emptyDebts')}</Text>
          </View>
        ) : (
          activeDebts.slice(0, 3).map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.myDebtRow,
                index === Math.min(activeDebts.length, 3) - 1 && styles.lastRow,
              ]}
            >
              <LinearGradient
                colors={
                  item.creditorAvatarColor && AVATAR_COLOR_OPTIONS[item.creditorAvatarColor]
                    ? AVATAR_COLOR_OPTIONS[item.creditorAvatarColor]
                    : DEBT_AVATAR_FALLBACKS[index % DEBT_AVATAR_FALLBACKS.length]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.debtAvatar}
              >
                {item.creditorAvatarEmoji ? (
                  <Text style={styles.debtAvatarEmoji}>{item.creditorAvatarEmoji}</Text>
                ) : (
                  <Text style={styles.debtAvatarInitial}>
                    {item.creditorName.charAt(0).toUpperCase()}
                  </Text>
                )}
              </LinearGradient>

              <View style={styles.debtRowContent}>
                <View style={styles.debtRowTop}>
                  <Text style={styles.debtCreditorName} numberOfLines={1}>
                    {item.creditorName}
                  </Text>
                  <Text style={styles.debtRowAmount}>
                    -{formatCurrency(item.amount)}
                  </Text>
                </View>
                <View style={styles.debtRowBottom}>
                  <Text style={styles.debtExpenseLabel} numberOfLines={1}>
                    {item.expenseTitle}
                  </Text>
                  {item.status === 'MARKED_AS_PAID' && (
                    <View style={styles.awaitingBadge}>
                      <Text style={styles.awaitingBadgeText}>
                        {t('debt.statusMarkedAsPaid')}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Son Harcamalar */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('dashboard.recentExpenses')}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Expenses')}>
            <Text style={styles.seeAll}>{t('dashboard.seeAll')}</Text>
          </TouchableOpacity>
        </View>

        {expensesLoading ? (
          <>
            <SkeletonBox style={styles.skeletonRow} />
            <SkeletonBox style={styles.skeletonRow} />
            <SkeletonBox style={styles.skeletonRow} />
          </>
        ) : !(expensesPage?.content ?? []).length ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={32} color={colors.subText} />
            <Text style={styles.emptyText}>{t('expense.noExpense')}</Text>
          </View>
        ) : (
          (expensesPage?.content ?? []).map((expense, index) => (
            <View
              key={expense.id}
              style={[
                styles.expenseRow,
                index === (expensesPage?.content.length ?? 1) - 1 && styles.lastRow,
              ]}
            >
              <View style={styles.expenseIcon}>
                <Ionicons
                  name={CATEGORY_ICONS[(expense.categoryName ?? expense.category ?? '').toLowerCase()] ?? 'ellipsis-horizontal-outline'}
                  size={20}
                  color={colors.primary}
                />
              </View>
              <View style={styles.expenseInfo}>
                <Text style={styles.expenseName} numberOfLines={1}>
                  {expense.title ?? expense.description}
                </Text>
                <Text style={styles.expenseDate}>{formatDate(expense.expenseDate ?? expense.date, t('dashboard.noDate'), locale)}</Text>
              </View>
              <Text style={styles.expenseAmount}>{formatCurrency(expense.amount)}</Text>
            </View>
          ))
        )}
      </View>

    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: colors.background,
  },
  headerBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifBadgeDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
    borderWidth: 1.5,
    borderColor: colors.background,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 0.3,
    flex: 1,
    textAlign: 'center',
  },
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 32 },

  // Summary card
  summaryCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  summaryLabel: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 6 },
  summaryAmount: { fontSize: 34, fontWeight: '800', color: '#FFFFFF', marginBottom: 16 },
  summaryRow: { flexDirection: 'row', gap: 10 },
  miniCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  summaryItemLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  debtAmount: { fontSize: 16, fontWeight: '700', color: '#FCA5A5' },
  creditAmount: { fontSize: 16, fontWeight: '700', color: '#6EE7B7' },

  // Sections
  section: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  seeAll: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  emptyState: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  emptyText: { fontSize: 14, color: colors.subText, textAlign: 'center' },
  lastRow: { borderBottomWidth: 0 },

  // My debt rows
  debtMeta: {
    fontSize: 12,
    color: colors.subText,
    marginTop: 3,
    fontWeight: '500',
  },
  myDebtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  debtAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  debtAvatarEmoji: { fontSize: 19 },
  debtAvatarInitial: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  debtRowContent: { flex: 1, gap: 3 },
  debtRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  debtRowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  debtCreditorName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  debtRowAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.danger,
    letterSpacing: -0.3,
  },
  debtExpenseLabel: {
    fontSize: 12,
    color: colors.subText,
    flex: 1,
    marginRight: 6,
  },
  awaitingBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    backgroundColor: 'rgba(99,102,241,0.15)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.25)',
  },
  awaitingBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#818CF8',
  },

  // Expense rows
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  expenseIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(37, 99, 235, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  expenseInfo: { flex: 1 },
  expenseName: { fontSize: 14, fontWeight: '600', color: colors.text },
  expenseDate: { fontSize: 12, color: colors.subText, marginTop: 2 },
  expenseAmount: { fontSize: 14, fontWeight: '700', color: colors.text },

  // Skeletons
  skeleton: { backgroundColor: colors.surfaceElevated, borderRadius: 8 },
  skeletonAmountLg: { height: 38, width: '55%', marginBottom: 16 },
  skeletonAmountSm: { height: 22, width: 80 },
  skeletonRow: { height: 52, borderRadius: 12, marginBottom: 8 },
});
