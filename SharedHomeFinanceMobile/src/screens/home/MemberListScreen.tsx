import React from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { getMembers, removeMember, Member } from '../../services/homeService';
import { useHome } from '../../context/HomeContext';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { useTranslation } from 'react-i18next';

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

export default function MemberListScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { activeHome } = useHome();
  const { user } = useAuth();
  const homeId = activeHome?.id ?? 0;
  const isOwner = activeHome?.role === 'OWNER';

  const { data: members, isLoading } = useQuery({
    queryKey: ['members', homeId],
    queryFn: () => getMembers(homeId),
    enabled: !!homeId,
  });

  const removeMutation = useMutation({
    mutationFn: (userId: number) => removeMember(homeId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', homeId] });
      queryClient.invalidateQueries({ queryKey: ['home', homeId] });
      Toast.show({ type: 'success', text1: t('home.memberRemoved') });
    },
    onError: (error: Error) => {
      Toast.show({
        type: 'error',
        text1: t('common.errorTitle'),
        text2: (error as { response?: { data?: { message?: string } } }).response?.data?.message ?? t('home.removeMemberError'),
      });
    },
  });

  function handleRemove(member: Member) {
    Alert.alert(
      t('home.removeMemberTitle'),
      t('home.removeMemberMessage', { name: member.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('home.removeMemberConfirm'),
          style: 'destructive',
          onPress: () => removeMutation.mutate(member.id),
        },
      ],
    );
  }

  function renderMemberCard({ item, index }: { item: Member; index: number }) {
    const isSelf = item.id === Number(user?.id);
    const canRemove = isOwner && !isSelf && item.role !== 'OWNER';

    const gradientColors: [string, string] = item.avatarColor && COLOR_OPTIONS[item.avatarColor]
      ? COLOR_OPTIONS[item.avatarColor]
      : index % 3 === 0
        ? ['#2563EB', '#0D9488']
        : index % 3 === 1
          ? ['#7C3AED', '#EC4899']
          : ['#D97706', '#DC2626'];

    return (
      <View style={styles.card}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatar}
        >
          {item.avatarEmoji ? (
            <Text style={styles.avatarEmoji}>{item.avatarEmoji}</Text>
          ) : (
            <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
          )}
        </LinearGradient>
        <View style={styles.cardInfo}>
          <Text style={styles.name}>{item.name}{isSelf ? t('home.selfLabel') : ''}</Text>
          <Text style={styles.email} numberOfLines={1}>{item.email}</Text>
        </View>
        <View style={styles.cardRight}>
          <View style={[
            styles.roleBadge,
            item.role === 'OWNER'
              ? { backgroundColor: 'rgba(37,99,235,0.2)', borderWidth: 1, borderColor: 'rgba(37,99,235,0.4)' }
              : { backgroundColor: 'rgba(16,185,129,0.15)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)' },
          ]}>
            <Text style={[styles.roleText, { color: item.role === 'OWNER' ? '#60A5FA' : colors.secondary }]}>
              {item.role === 'OWNER' ? t('home.roleOwner') : t('home.roleMember')}
            </Text>
          </View>
          {canRemove && (
            <TouchableOpacity
              onPress={() => handleRemove(item)}
              disabled={removeMutation.isPending}
              style={styles.removeBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.removeBtnText}>{t('home.removeMemberConfirm')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={members ?? []}
        keyExtractor={(item) => item.id?.toString() ?? Math.random().toString()}
        renderItem={({ item, index }) => renderMemberCard({ item, index })}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>{t('home.noMembers')}</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: 16, paddingBottom: 24 },
  separator: { height: 10 },
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
  avatarText: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' },
  avatarEmoji: { fontSize: 22 },
  cardInfo: { flex: 1, marginRight: 8 },
  name: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 2 },
  email: { fontSize: 12, color: colors.subText },
  cardRight: { alignItems: 'flex-end', gap: 4 },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  roleText: { fontSize: 11, color: '#FFFFFF', fontWeight: '600' },
  removeBtn: { marginTop: 4, paddingVertical: 4, paddingHorizontal: 8 },
  removeBtnText: { fontSize: 13, color: colors.danger, fontWeight: '600' },
  emptyState: { flex: 1, alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, color: colors.subText },
  skeletonCard: {
    height: 72,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 10,
  },
});
