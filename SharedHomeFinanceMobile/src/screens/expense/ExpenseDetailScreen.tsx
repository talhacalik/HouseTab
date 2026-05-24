import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Modal,
  TextInput as RNTextInput,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getExpense, cancelExpense, getExpenseHistory } from '../../services/expenseService';
import { useHome } from '../../context/HomeContext';
import { useAuth } from '../../context/AuthContext';
import { MainStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { useTranslation } from 'react-i18next';

type Nav = StackNavigationProp<MainStackParamList, 'ExpenseDetail'>;
type RouteProps = RouteProp<MainStackParamList, 'ExpenseDetail'>;

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

function formatEditDate(dateString: string, locale: string): string {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '';
  return (
    d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }) +
    '  ' +
    d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
  );
}

function SkeletonBox({ style }: { style?: object }) {
  return <View style={[styles.skeleton, style]} />;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

export default function ExpenseDetailScreen() {
  const { t } = useTranslation();
  const { i18n: i18nInstance } = useTranslation();
  const locale = i18nInstance.language === 'en' ? 'en-US' : 'tr-TR';
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProps>();
  const queryClient = useQueryClient();
  const { activeHome } = useHome();
  const { user } = useAuth();
  const homeId = activeHome?.id ?? 0;
  const { expenseId } = route.params;

  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelNote, setCancelNote] = useState('');

  const { data: expense, isLoading } = useQuery({
    queryKey: ['expense', homeId, expenseId],
    queryFn: () => getExpense(homeId, expenseId),
  });

  const cancelMutation = useMutation({
    mutationFn: (note: string) => cancelExpense(homeId, expenseId, note),
    onSuccess: () => {
      setCancelModalVisible(false);
      setCancelNote('');
      queryClient.invalidateQueries({ queryKey: ['expenses', homeId] });
      queryClient.invalidateQueries({ queryKey: ['analytics', 'monthly', homeId] });
      queryClient.invalidateQueries({ queryKey: ['analytics', 'personal', homeId] });
      queryClient.invalidateQueries({ queryKey: ['debts', 'my', homeId] });
      navigation.goBack();
    },
    onError: (error: Error) => {
      Toast.show({
        type: 'error',
        text1: t('common.errorTitle'),
        text2: (error as { response?: { data?: { message?: string } } }).response?.data?.message ?? t('expense.cancelError'),
      });
    },
  });

  function handleCancelSubmit() {
    if (cancelNote.trim().length < 10) {
      Toast.show({ type: 'error', text1: t('expense.cancelNoteMin') });
      return;
    }
    cancelMutation.mutate(cancelNote.trim());
  }

  function handleCancelClose() {
    setCancelModalVisible(false);
    setCancelNote('');
  }

  const isCancelled = expense?.status === 'CANCELLED';
  const isEdited = expense?.status === 'EDITED';
  const isPaid = expense?.allDebtsConfirmed === true && !isCancelled;

  const { data: history } = useQuery({
    queryKey: ['expense-history', homeId, expenseId],
    queryFn: () => getExpenseHistory(homeId, expenseId),
    enabled: isEdited,
  });
  const canEdit =
    !isCancelled && !isPaid && expense?.createdByUserId === user?.id;

  if (isLoading) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <SkeletonBox style={styles.skeletonTitle} />
        <SkeletonBox style={styles.skeletonCard} />
        <SkeletonBox style={styles.skeletonCard} />
      </ScrollView>
    );
  }

  if (!expense) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
        <Text style={styles.errorText}>{t('expense.notFound')}</Text>
      </View>
    );
  }

  const statusConfig = isPaid
    ? { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)', dot: colors.secondary, text: t('expense.statusPaid'), textColor: colors.secondary }
    : isCancelled
    ? { bg: 'rgba(239,68,68,0.2)', border: 'rgba(239,68,68,0.4)', dot: colors.danger, text: t('expense.statusCancelled'), textColor: colors.danger }
    : isEdited
    ? { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)', dot: '#F59E0B', text: t('expense.statusEdited'), textColor: '#F59E0B' }
    : { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)', dot: colors.secondary, text: t('expense.statusActive'), textColor: colors.secondary };

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        {/* Tutar başlık */}
        <LinearGradient
          colors={['#1E40AF', '#0D9488']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.amountCard}
        >
          <View style={styles.amountCardDecor} />
          <Text style={styles.amountLabel}>{t('expense.totalAmount')}</Text>
          <Text style={styles.amountValue}>{formatCurrency(expense.amount)}</Text>
          <Text style={styles.amountMeta}>{expense.title ?? expense.description}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg, borderColor: statusConfig.border }]}>
            <View style={[styles.statusDot, { backgroundColor: statusConfig.dot }]} />
            <Text style={[styles.statusText, { color: statusConfig.textColor }]}>{statusConfig.text}</Text>
          </View>
        </LinearGradient>

        {/* Düzenleme Bilgisi */}
        {isEdited && (
          <View style={styles.editedBanner}>
            <Ionicons name="create-outline" size={20} color="#FCD34D" style={{ marginTop: 2 }} />
            <View style={styles.editedBannerText}>
              <View style={styles.editedBannerRow}>
                <Text style={styles.editedBannerTitle}>{t('expense.editedBannerTitle')}</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('ExpenseHistory', { expenseId })}
                >
                  <Text style={styles.editedBannerLink}>{t('expense.viewHistory')}</Text>
                </TouchableOpacity>
              </View>
              {history?.[0] && (
                <>
                  {history[0].editNote ? (
                    <Text style={styles.editedBannerNote}>
                      {t('expense.editReasonPrefix')}{history[0].editNote}
                    </Text>
                  ) : null}
                  <Text style={styles.editedBannerMeta}>
                    {history[0].editedByName}
                    {history[0].editedAt
                      ? `  ·  ${formatEditDate(history[0].editedAt, locale)}`
                      : ''}
                  </Text>
                </>
              )}
            </View>
          </View>
        )}

        {/* İptal Bilgisi */}
        {isCancelled && (
          <View style={styles.cancelledBanner}>
            <Ionicons name="close-circle" size={20} color={colors.danger} />
            <View style={styles.cancelledBannerText}>
              <Text style={styles.cancelledBannerTitle}>{t('expense.cancelledBannerTitle')}</Text>
              {expense.cancelNote ? (
                <Text style={styles.cancelledBannerNote}>
                  {t('expense.cancelReasonPrefix')}{expense.cancelNote}
                </Text>
              ) : null}
            </View>
          </View>
        )}

        {/* Detaylar */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { textTransform: 'uppercase' }]}>{t('expense.sectionDetails')}</Text>
          {/* Kategori chip */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('expense.category')}</Text>
            <View style={styles.categoryChip}>
              <Text style={styles.categoryChipText}>{expense.categoryName ?? expense.category}</Text>
            </View>
          </View>
          <DetailRow label={t('expense.date')} value={formatDate(expense.expenseDate ?? expense.date, t('dashboard.noDate'), locale)} />
          <DetailRow label={t('expense.paidBy')} value={expense.paidByName} />
          {expense.description ? (
            <DetailRow label={t('expense.notes')} value={expense.description} />
          ) : null}
        </View>

        {/* Borç dağılımı */}
        {(expense.shares ?? []).length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { textTransform: 'uppercase' }]}>{t('expense.debtDistribution')}</Text>
            {(expense.shares ?? []).map((share, index) => (
              <View
                key={share.userId}
                style={[
                  styles.shareRow,
                  index === (expense.shares?.length ?? 0) - 1 && styles.lastRow,
                ]}
              >
                <LinearGradient
                  colors={
                    index % 3 === 0
                      ? ['#2563EB', '#0D9488']
                      : index % 3 === 1
                      ? ['#7C3AED', '#EC4899']
                      : ['#D97706', '#DC2626']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.shareAvatar}
                >
                  <Text style={styles.shareAvatarText}>
                    {share.userName.charAt(0).toUpperCase()}
                  </Text>
                </LinearGradient>
                <Text style={styles.shareName} numberOfLines={1}>{share.userName}</Text>
                <View style={styles.shareRight}>
                  <Text style={styles.shareAmount}>{formatCurrency(share.amount)}</Text>
                  {share.paid ? (
                    <View style={styles.paidBadge}>
                      <Text style={styles.paidText}>{t('expense.statusPaid')}</Text>
                    </View>
                  ) : (
                    <View style={styles.unpaidBadge}>
                      <Text style={styles.unpaidText}>{t('expense.statusPending')}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Aksiyonlar */}
        {canEdit && (
          <View style={styles.actions}>
            <LinearGradient
              colors={['#1E40AF', '#0D9488']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.editBtnGradient}
            >
              <TouchableOpacity
                style={styles.editBtnInner}
                onPress={() => navigation.navigate('EditExpense', { expenseId: expense.id })}
              >
                <Text style={styles.editBtnText}>{t('common.edit')}</Text>
              </TouchableOpacity>
            </LinearGradient>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setCancelModalVisible(true)}
              disabled={cancelMutation.isPending}
            >
              <Text style={styles.cancelBtnText}>{t('expense.cancelAction')}</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>

      {/* İptal Modal */}
      <Modal
        visible={cancelModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCancelClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{t('expense.cancelModalTitle')}</Text>
            <Text style={styles.modalSubtitle}>{t('expense.cancelModalSubtitle')}</Text>
            <RNTextInput
              style={styles.modalInput}
              value={cancelNote}
              onChangeText={setCancelNote}
              placeholder={t('expense.cancelPlaceholder')}
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              maxLength={255}
              autoFocus
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalBtnSecondary}
                onPress={handleCancelClose}
                disabled={cancelMutation.isPending}
              >
                <Text style={styles.modalBtnSecondaryText}>{t('expense.cancelModalDismiss')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtnDanger, cancelMutation.isPending && styles.modalBtnDisabled]}
                onPress={handleCancelSubmit}
                disabled={cancelMutation.isPending}
              >
                <Text style={styles.modalBtnDangerText}>
                  {cancelMutation.isPending ? t('expense.cancellingLoading') : t('expense.cancelAction')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  errorText: { fontSize: 16, color: colors.danger },

  amountCard: {
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  amountCardDecor: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  amountLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', letterSpacing: 0.8 },
  amountValue: { fontSize: 38, fontWeight: '800', color: '#fff', letterSpacing: -1 },
  amountMeta: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 6 },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 10,
    alignSelf: 'center',
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
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
    borderBottomColor: colors.inputBg,
  },
  detailLabel: { fontSize: 14, color: colors.subText },
  detailValue: { fontSize: 14, color: colors.text, fontWeight: '500', flex: 1, textAlign: 'right', marginLeft: 16 },
  lastRow: { borderBottomWidth: 0 },

  categoryChip: {
    backgroundColor: 'rgba(37,99,235,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(37,99,235,0.3)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  categoryChipText: { fontSize: 12, color: '#60A5FA', fontWeight: '600' },

  shareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.inputBg,
  },
  shareAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  shareAvatarText: { fontSize: 14, fontWeight: 'bold', color: '#FFFFFF' },
  shareName: { flex: 1, fontSize: 14, color: colors.text },
  shareRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  shareAmount: { fontSize: 14, fontWeight: '700', color: colors.text },
  paidBadge: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  paidText: { fontSize: 11, color: colors.secondary, fontWeight: '600' },
  unpaidBadge: {
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.25)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  unpaidText: { fontSize: 11, color: '#F59E0B', fontWeight: '600' },

  actions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  editBtnGradient: { flex: 1, padding: 2, borderRadius: 50 },
  editBtnInner: {
    backgroundColor: colors.background,
    borderRadius: 50,
    paddingVertical: 13,
    alignItems: 'center',
  },
  editBtnText: { color: colors.primary, fontSize: 15, fontWeight: '700' },
  cancelBtn: {
    flex: 1,
    backgroundColor: colors.danger,
    borderRadius: 50,
    paddingVertical: 13,
    alignItems: 'center',
  },
  cancelBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  editedBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.25)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  editedBannerText: { flex: 1 },
  editedBannerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  editedBannerTitle: { fontSize: 14, fontWeight: '600', color: '#FCD34D' },
  editedBannerLink: { fontSize: 13, color: '#F59E0B', fontWeight: '600' },
  editedBannerNote: { fontSize: 12, color: '#FCD34D', marginTop: 2 },
  editedBannerMeta: { fontSize: 11, color: 'rgba(252,211,77,0.7)', marginTop: 4 },

  cancelledBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  cancelledBannerText: { flex: 1 },
  cancelledBannerTitle: { fontSize: 14, fontWeight: '600', color: colors.danger },
  cancelledBannerNote: { fontSize: 13, color: 'rgba(239,68,68,0.8)', marginTop: 4 },

  skeleton: { backgroundColor: colors.surfaceElevated, borderRadius: 8 },
  skeletonTitle: { height: 28, width: '50%', marginBottom: 16 },
  skeletonCard: { height: 120, borderRadius: 16, marginBottom: 16 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    width: '100%',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    color: colors.subText,
    marginBottom: 14,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    minHeight: 80,
    backgroundColor: colors.background,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  modalBtnSecondary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  modalBtnSecondaryText: {
    fontSize: 15,
    color: colors.subText,
    fontWeight: '500',
  },
  modalBtnDanger: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.danger,
    alignItems: 'center',
  },
  modalBtnDisabled: { opacity: 0.6 },
  modalBtnDangerText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
