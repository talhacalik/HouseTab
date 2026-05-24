import React, { useLayoutEffect, useEffect, useRef } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  AppState,
  AppStateStatus,
} from 'react-native';
import { Text } from 'react-native-paper';
import { Swipeable } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  Notification,
} from '../../services/notificationService';
import { getDebtById } from '../../services/debtService';
import { useHome } from '../../context/HomeContext';
import { MainStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { useTranslation } from 'react-i18next';

type Nav = StackNavigationProp<MainStackParamList, 'NotificationScreen'>;

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const TYPE_ICONS: Record<string, IoniconsName> = {
  EXPENSE: 'receipt-outline',
  DEBT: 'swap-horizontal-outline',
  PAYMENT: 'cash-outline',
  SYSTEM: 'information-circle-outline',
};

function formatDate(dateString: string, locale: string): string {
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function SkeletonCard() {
  return <View style={styles.skeletonCard} />;
}

const DEBT_NOTIFICATION_TYPES = new Set([
  'DEBT_MARKED_AS_PAID',
  'DEBT_CONFIRMED',
  'DEBT_REJECTED',
]);

function isExpenseNotification(type: string): boolean {
  return type === 'EXPENSE' || type.startsWith('EXPENSE_');
}

export default function NotificationScreen() {
  const { t } = useTranslation();
  const { i18n: i18nInstance } = useTranslation();
  const locale = i18nInstance.language === 'en' ? 'en-US' : 'tr-TR';
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();
  const { activeHome } = useHome();
  const homeId = activeHome?.id ?? 0;
  const swipeableRefs = useRef<Map<number, Swipeable>>(new Map());

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
  });

  const appState = useRef(AppState.currentState);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, [queryClient]);

  const readMutation = useMutation({
    mutationFn: (id: number) => markAsRead(id),
    onMutate: async (id: number) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const previous = queryClient.getQueryData<Notification[]>(['notifications']);
      queryClient.setQueryData<Notification[]>(['notifications'], (old) =>
        (old ?? []).map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['notifications'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const readAllMutation = useMutation({
    mutationFn: markAllAsRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const previous = queryClient.getQueryData<Notification[]>(['notifications']);
      queryClient.setQueryData<Notification[]>(['notifications'], (old) =>
        (old ?? []).map((n) => ({ ...n, read: true }))
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['notifications'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteNotification(id),
    onMutate: async (id: number) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const previous = queryClient.getQueryData<Notification[]>(['notifications']);
      queryClient.setQueryData<Notification[]>(['notifications'], (old) =>
        (old ?? []).filter((n) => n.id !== id)
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['notifications'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const hasUnread = (notifications ?? []).some((n) => !n.read);

  useLayoutEffect(() => {
    navigation.setOptions({ headerRight: () => null });
  }, [navigation]);

  function closeAllSwipeables(exceptId?: number) {
    swipeableRefs.current.forEach((ref, id) => {
      if (id !== exceptId) ref.close();
    });
  }

  function renderRightActions(id: number) {
    return (
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => {
          swipeableRefs.current.get(id)?.close();
          deleteMutation.mutate(id);
        }}
        activeOpacity={0.8}
      >
        <Ionicons name="trash-outline" size={22} color="#fff" />
      </TouchableOpacity>
    );
  }

  function renderCard({ item }: { item: Notification }) {
    const icon: IoniconsName = TYPE_ICONS[item.type] ?? 'notifications-outline';

    return (
      <Swipeable
        ref={(ref) => {
          if (ref) swipeableRefs.current.set(item.id, ref);
          else swipeableRefs.current.delete(item.id);
        }}
        renderRightActions={() => renderRightActions(item.id)}
        onSwipeableOpen={() => closeAllSwipeables(item.id)}
        overshootRight={false}
        friction={2}
      >
        <TouchableOpacity
          style={[styles.card, !item.read && styles.cardUnread]}
          onPress={async () => {
            closeAllSwipeables();
            if (!item.read) readMutation.mutate(item.id);
            if (isExpenseNotification(item.type) && item.referenceId) {
              navigation.navigate('ExpenseDetail', { expenseId: item.referenceId });
            } else if (DEBT_NOTIFICATION_TYPES.has(item.type) && item.referenceId && homeId) {
              try {
                const debt = await getDebtById(homeId, item.referenceId);
                navigation.navigate('DebtDetail', {
                  debtId: debt.id,
                  expenseId: debt.expenseId ?? 0,
                  rejected: item.type === 'DEBT_REJECTED',
                });
              } catch {}
            }
          }}
          activeOpacity={0.7}
        >
          <View style={[styles.iconWrap, !item.read && styles.iconWrapUnread]}>
            <Ionicons name={icon} size={20} color={item.read ? colors.subText : colors.primary} />
          </View>
          <View style={styles.cardBody}>
            <View style={styles.cardTop}>
              <Text style={[styles.title, !item.read && styles.titleUnread]} numberOfLines={1}>
                {item.title}
              </Text>
              {!item.read && <View style={styles.unreadDot} />}
              <Text style={styles.date}>{formatDate(item.createdAt, locale)}</Text>
            </View>
            <Text style={styles.message} numberOfLines={2}>{item.body}</Text>
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications ?? []}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderCard}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          hasUnread ? (
            <TouchableOpacity
              onPress={() => readAllMutation.mutate()}
              disabled={readAllMutation.isPending}
              style={styles.markAllRow}
              activeOpacity={0.6}
            >
              <Text style={styles.markAllText}>{t('notification.markAllRead')}</Text>
            </TouchableOpacity>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={64} color={colors.subText} />
            <Text style={styles.emptyText}>{t('notification.empty')}</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: 16, paddingBottom: 24 },
  separator: { height: 8 },

  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardUnread: { backgroundColor: 'rgba(37,99,235,0.1)', borderColor: 'rgba(37,99,235,0.25)' },

  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconWrapUnread: { backgroundColor: 'rgba(37,99,235,0.2)' },

  cardBody: { flex: 1 },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  title: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.text },
  titleUnread: { color: colors.primary },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: 6,
  },
  message: { fontSize: 13, color: colors.subText, lineHeight: 18, marginTop: 2 },
  date: { fontSize: 11, color: colors.subText, marginLeft: 'auto', paddingLeft: 8 },

  deleteAction: {
    backgroundColor: colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    width: 64,
    borderRadius: 12,
    marginLeft: 8,
  },

  markAllRow: {
    alignItems: 'flex-end',
    paddingBottom: 10,
  },
  markAllText: { fontSize: 12, color: colors.primary, fontWeight: '500' },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingTop: 80,
  },
  emptyText: { fontSize: 16, color: colors.subText },

  skeletonCard: {
    height: 80,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 8,
  },
});
