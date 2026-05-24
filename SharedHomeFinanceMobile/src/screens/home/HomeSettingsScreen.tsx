import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { getHome, leaveHome } from '../../services/homeService';
import { useHome } from '../../context/HomeContext';
import { useAuth } from '../../context/AuthContext';
import { MainStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { useTranslation } from 'react-i18next';

type Nav = StackNavigationProp<MainStackParamList, 'HomeSettings'>;

function formatCurrency(amount: number): string {
  return `₺${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateString: string | undefined, locale: string): string {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function SkeletonBox({ style }: { style?: object }) {
  return <View style={[styles.skeleton, style]} />;
}

export default function HomeSettingsScreen() {
  const { t } = useTranslation();
  const { i18n: i18nInstance } = useTranslation();
  const locale = i18nInstance.language === 'en' ? 'en-US' : 'tr-TR';
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();
  const { activeHome, setActiveHome } = useHome();
  const { user } = useAuth();
  const homeId = activeHome?.id ?? 0;
  const isOwner = activeHome?.role === 'OWNER';

  const { data: home, isLoading } = useQuery({
    queryKey: ['home', homeId],
    queryFn: () => getHome(homeId),
    enabled: !!homeId,
  });

  const leaveMutation = useMutation({
    mutationFn: () => leaveHome(homeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homes'] });
      setActiveHome(null);
    },
    onError: (error: Error) => {
      Toast.show({
        type: 'error',
        text1: t('common.errorTitle'),
        text2: (error as { response?: { data?: { message?: string } } }).response?.data?.message ?? t('home.leaveError'),
      });
    },
  });

  function handleLeave() {
    Alert.alert(
      t('home.leaveHome'),
      t('home.leaveHomeMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('home.leaveHomeConfirm'),
          style: 'destructive',
          onPress: () => leaveMutation.mutate(),
        },
      ],
    );
  }

  if (isLoading) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <SkeletonBox style={styles.skeletonCard} />
        <SkeletonBox style={styles.skeletonCard} />
        <SkeletonBox style={styles.skeletonCard} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Ev Bilgileri */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { textTransform: 'uppercase' }]}>{t('home.sectionInfo')}</Text>
        <InfoRow label={t('home.homeName')} value={home?.name ?? ''} />
        <InfoRow label={t('home.memberCountLabel')} value={t('home.memberCountFormat', { count: home?.memberCount ?? 0 })} />
{home?.createdAt ? (
          <InfoRow label={t('home.createdAtLabel')} value={formatDate(home.createdAt, locale)} />
        ) : null}
{home?.totalExpense !== undefined ? (
          <InfoRow label={t('home.totalExpenseLabel')} value={formatCurrency(home.totalExpense)} />
        ) : null}
{home?.description ? (
          <InfoRow label={t('home.descriptionLabel')} value={home.description} />
        ) : null}
      </View>

      {/* Owner Aksiyonlar */}
      {isOwner && (
        <View style={[styles.section, { paddingBottom: 5 }]}>
          <Text style={[styles.sectionTitle, { textTransform: 'uppercase' }]}>{t('home.sectionManagement')}</Text>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation.navigate('EditHome')}
            activeOpacity={0.7}
          >
            <View style={styles.actionRowIcon}>
              <Ionicons name="pencil-outline" size={18} color={colors.primary} />
            </View>
            <Text style={styles.actionRowText}>{t('home.editSettings')}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.subText} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionRow, styles.actionRowBorder]}
            onPress={() => navigation.navigate('MemberList')}
            activeOpacity={0.7}
          >
            <View style={styles.actionRowIcon}>
              <Ionicons name="people-outline" size={18} color={colors.primary} />
            </View>
            <Text style={styles.actionRowText}>{t('home.manageMembers')}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.subText} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionRow, styles.actionRowBorder]}
            onPress={() => navigation.navigate('InviteMember')}
            activeOpacity={0.7}
          >
            <View style={styles.actionRowIcon}>
              <Ionicons name="person-add-outline" size={18} color={colors.primary} />
            </View>
            <Text style={styles.actionRowText}>{t('home.inviteAction')}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.subText} />
          </TouchableOpacity>
        </View>
      )}

      {/* Danger */}
      <View>
        <TouchableOpacity
          style={styles.leaveBtn}
          onPress={handleLeave}
          disabled={leaveMutation.isPending}
          activeOpacity={0.7}
        >
          <View style={styles.leaveBtnIcon}>
            <Ionicons name="log-out-outline" size={18} color={colors.danger} />
          </View>
          <Text style={styles.leaveBtnText}>
            {leaveMutation.isPending ? t('home.leavingLoading') : t('home.leaveHome')}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 40 },

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
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: { fontSize: 14, color: colors.subText },
  infoValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
    marginLeft: 16,
  },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    gap: 12,
  },
  actionRowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionRowIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(37,99,235,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionRowText: { flex: 1, fontSize: 15, color: colors.text, fontWeight: '500' },
  leaveBtn: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  leaveBtnIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(239,68,68,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  leaveBtnText: { flex: 1, fontSize: 15, color: colors.danger, fontWeight: '500' },

  skeleton: { backgroundColor: colors.surfaceElevated, borderRadius: 16 },
  skeletonCard: { height: 140, marginBottom: 16 },
});
