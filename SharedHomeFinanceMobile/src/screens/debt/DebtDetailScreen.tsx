import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  getExpenseDebts,
  markAsPaid,
  confirmPayment,
  rejectPayment,
} from '../../services/debtService';
import { useHome } from '../../context/HomeContext';
import { useAuth } from '../../context/AuthContext';
import { MainStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { useTranslation } from 'react-i18next';

type Nav = StackNavigationProp<MainStackParamList, 'DebtDetail'>;
type RouteProps = RouteProp<MainStackParamList, 'DebtDetail'>;

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  PENDING: { bg: 'rgba(245,158,11,0.15)', text: '#F59E0B', border: 'rgba(245,158,11,0.3)' },
  MARKED_AS_PAID: { bg: 'rgba(255,255,255,0.2)', text: '#FFFFFF', border: 'rgba(255,255,255,0.45)' },
  PAID: { bg: 'rgba(16,185,129,0.15)', text: colors.secondary, border: 'rgba(16,185,129,0.3)' },
  CONFIRMED: { bg: 'rgba(16,185,129,0.15)', text: colors.secondary, border: 'rgba(16,185,129,0.3)' },
  REJECTED: { bg: 'rgba(239,68,68,0.12)', text: colors.danger, border: 'rgba(239,68,68,0.25)' },
};

function formatCurrency(amount: number): string {
  return `₺${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateString: string | undefined, noDateLabel: string, locale: string): string {
  if (!dateString) return noDateLabel;
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return noDateLabel;
  return (
    d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Istanbul' }) +
    '  ' +
    d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' })
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function SkeletonBox({ style }: { style?: object }) {
  return <View style={[styles.skeleton, style]} />;
}

export default function DebtDetailScreen() {
  const { t } = useTranslation();
  const { i18n: i18nInstance } = useTranslation();
  const locale = i18nInstance.language === 'en' ? 'en-US' : 'tr-TR';
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProps>();
  const queryClient = useQueryClient();
  const { activeHome } = useHome();
  const { user } = useAuth();
  const homeId = activeHome?.id ?? 0;
  const { debtId, expenseId, rejected: routeRejected } = route.params;
  const [isRejected, setIsRejected] = useState<boolean>(routeRejected ?? false);

  const statusLabels: Record<string, string> = {
    PENDING: t('debt.statusPending'),
    MARKED_AS_PAID: t('debt.statusMarkedAsPaid'),
    PAID: t('debt.statusPaid'),
    CONFIRMED: t('debt.statusConfirmed'),
    REJECTED: t('debt.statusRejected'),
  };

  const { data: debts, isLoading } = useQuery({
    queryKey: ['expense-debts', homeId, expenseId],
    queryFn: () => getExpenseDebts(homeId, expenseId),
    enabled: expenseId > 0,
    staleTime: 0,
  });

  const debt = debts?.find((d) => d.id === debtId);

  function invalidateDebts() {
    queryClient.invalidateQueries({ queryKey: ['debts', 'my', homeId] });
    queryClient.invalidateQueries({ queryKey: ['debts', 'credits', homeId] });
    queryClient.invalidateQueries({ queryKey: ['expense-debts', homeId, expenseId] });
    queryClient.invalidateQueries({ queryKey: ['analytics', 'personal', homeId] });
  }

  function onMutationError(error: Error, fallback: string) {
    Toast.show({
      type: 'error',
      text1: t('common.errorTitle'),
      text2: (error as { response?: { data?: { message?: string } } }).response?.data?.message ?? fallback,
    });
  }

  const paidMutation = useMutation({
    mutationFn: () => markAsPaid(homeId, debtId),
    onSuccess: () => { invalidateDebts(); navigation.goBack(); },
    onError: (e: Error) => onMutationError(e, t('debt.operationFailed')),
  });

  const confirmMutation = useMutation({
    mutationFn: () => confirmPayment(homeId, debtId),
    onSuccess: () => { invalidateDebts(); navigation.goBack(); },
    onError: (e: Error) => onMutationError(e, t('debt.confirmFailed')),
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectPayment(homeId, debtId),
    onSuccess: () => { setIsRejected(true); invalidateDebts(); },
    onError: (e: Error) => onMutationError(e, t('debt.rejectFailed')),
  });

  const anyPending = paidMutation.isPending || confirmMutation.isPending || rejectMutation.isPending;

  if (isLoading) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <SkeletonBox style={styles.skeletonBig} />
        <SkeletonBox style={styles.skeletonCard} />
        <SkeletonBox style={styles.skeletonCard} />
      </ScrollView>
    );
  }

  if (!debt) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
        <Text style={styles.errorText}>{t('debt.notFound')}</Text>
      </View>
    );
  }

  const isBorrower = debt.borrowerId === Number(user?.id);
  const isCreditor = debt.creditorId === Number(user?.id);
  const statusColor = STATUS_COLORS[debt.status] ?? STATUS_COLORS.PENDING;
  const gradientColors = isBorrower
    ? (['#991B1B', '#EF4444'] as const)
    : (['#065F46', '#10B981'] as const);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.amountCard}
      >
        <View style={styles.amountCardCircle} />
        <Text style={styles.amountLabel}>
          {isBorrower ? t('debt.amountLabelBorrower') : t('debt.amountLabelCreditor')}
        </Text>
        <Text style={styles.amountValue}>{formatCurrency(debt.amount)}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor.bg, borderWidth: 1, borderColor: statusColor.border }]}>
          <Text style={[styles.statusText, { color: statusColor.text }]}>
            {statusLabels[debt.status] ?? debt.status}
          </Text>
        </View>
      </LinearGradient>

      {(isRejected || debt.status === 'REJECTED') && (
        <View style={styles.rejectedBanner}>
          <Ionicons name="close-circle-outline" size={18} color={colors.danger} />
          <Text style={styles.rejectedBannerText}>{t('debt.rejectedInfo')}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { textTransform: 'uppercase' }]}>{t('debt.sectionExpense')}</Text>
        <DetailRow label={t('debt.expenseTitleLabel')} value={debt.expenseTitle} />
        <DetailRow label={t('debt.expenseDateLabel')} value={formatDate(debt.expenseDate, t('dashboard.noDate'), locale)} />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { textTransform: 'uppercase' }]}>{t('debt.sectionParties')}</Text>
        <DetailRow label={t('debt.creditorLabel')} value={debt.creditorName} />
        <DetailRow label={t('debt.borrowerLabel')} value={debt.borrowerName} />
      </View>

      {isBorrower && debt.status === 'PENDING' && (
        <TouchableOpacity
          onPress={() =>
            Alert.alert(
              t('debt.markPaidTitle'),
              t('debt.markPaidMessage'),
              [
                { text: t('debt.markPaidDismiss'), style: 'cancel' },
                { text: t('debt.markPaidConfirm'), onPress: () => paidMutation.mutate() },
              ],
            )
          }
          disabled={anyPending}
          style={styles.btn}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#1E40AF', '#0D9488']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.btnGradient}
          >
            {paidMutation.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.btnLabel}>{t('debt.markPaidBtn')}</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      )}

      {isCreditor && debt.status === 'MARKED_AS_PAID' && (
        <View style={styles.actions}>
          <LinearGradient
            colors={['#991B1B', '#EF4444']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.btn, { flex: 1, padding: 2, borderRadius: 12 }]}
          >
            <TouchableOpacity
              onPress={() => rejectMutation.mutate()}
              disabled={anyPending}
              style={styles.rejectInner}
              activeOpacity={0.85}
            >
              {rejectMutation.isPending ? (
                <ActivityIndicator size="small" color={colors.danger} />
              ) : (
                <Text style={[styles.btnLabel, { color: colors.danger }]}>{t('debt.rejectBtn')}</Text>
              )}
            </TouchableOpacity>
          </LinearGradient>

          <LinearGradient
            colors={['#065F46', '#10B981']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.btn, { flex: 1, padding: 2, borderRadius: 12 }]}
          >
            <TouchableOpacity
              onPress={() => confirmMutation.mutate()}
              disabled={anyPending}
              style={styles.rejectInner}
              activeOpacity={0.85}
            >
              {confirmMutation.isPending ? (
                <ActivityIndicator size="small" color={colors.secondary} />
              ) : (
                <Text style={[styles.btnLabel, { color: colors.secondary }]}>{t('debt.confirmBtn')}</Text>
              )}
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  errorText: { fontSize: 16, color: colors.danger },

  amountCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
    overflow: 'hidden',
  },
  amountCardCircle: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -40,
    right: -40,
  },
  amountLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  amountValue: { fontSize: 36, fontWeight: 'bold', color: '#FFFFFF' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 12, fontWeight: '600' },

  section: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.subText,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: { fontSize: 14, color: colors.subText },
  detailValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
    marginLeft: 16,
  },

  btn: { marginTop: 4, borderRadius: 12, overflow: 'hidden' },
  btnGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  btnLabel: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  rejectInner: {
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  rejectedBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  rejectedBannerText: {
    flex: 1,
    fontSize: 13,
    color: colors.danger,
    lineHeight: 19,
  },

  skeleton: { backgroundColor: colors.surfaceElevated, borderRadius: 16 },
  skeletonBig: { height: 160, marginBottom: 16 },
  skeletonCard: { height: 120, marginBottom: 16 },
});
