import React from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { getExpensesByCategory, Expense } from '../../services/expenseService';
import { useHome } from '../../context/HomeContext';
import { MainStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { useTranslation } from 'react-i18next';

type Nav = StackNavigationProp<MainStackParamList, 'CategoryExpenses'>;
type RouteProps = RouteProp<MainStackParamList, 'CategoryExpenses'>;

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const CATEGORY_ICONS: Record<string, IoniconsName> = {
  food: 'restaurant-outline',
  rent: 'home-outline',
  bills: 'flash-outline',
  cleaning: 'brush-outline',
  other: 'ellipsis-horizontal-outline',
  market: 'cart-outline',
  yemek: 'restaurant-outline',
  fatura: 'flash-outline',
  kira: 'home-outline',
  temizlik: 'brush-outline',
  'ulaşım': 'car-outline',
  'eğlence': 'musical-notes-outline',
  'sağlık': 'medical-outline',
  'diğer': 'ellipsis-horizontal-outline',
};

function formatCurrency(amount: number): string {
  return `₺${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateString: string | undefined, locale: string): string {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Istanbul',
  }) + '  ' + d.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Istanbul',
  });
}

function SkeletonCard() {
  return <View style={styles.skeletonCard} />;
}

export default function CategoryExpensesScreen() {
  const { t } = useTranslation();
  const { i18n: i18nInstance } = useTranslation();
  const locale = i18nInstance.language === 'en' ? 'en-US' : 'tr-TR';
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProps>();
  const { activeHome } = useHome();
  const homeId = activeHome?.id ?? 0;
  const { categoryId, categoryName } = route.params;

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ['expenses', 'category', homeId, categoryId],
    queryFn: ({ pageParam }) => getExpensesByCategory(homeId, categoryId, pageParam, 10),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.totalPages > allPages.length ? allPages.length : undefined,
    enabled: !!homeId && !!categoryId,
  });

  const expenses = data?.pages.flatMap((p) => p.content) ?? [];

  function renderExpenseCard({ item }: { item: Expense }) {
    const isCancelled = item.status === 'CANCELLED';
    const isEdited = item.status === 'EDITED';
    const icon = CATEGORY_ICONS[(item.categoryName ?? item.category ?? '').toLowerCase()] ?? 'ellipsis-horizontal-outline';

    return (
      <TouchableOpacity
        style={[styles.card, isCancelled && styles.cardCancelled]}
        onPress={() => navigation.navigate('ExpenseDetail', { expenseId: item.id })}
      >
        <View style={[styles.categoryIcon, isCancelled && styles.categoryIconCancelled]}>
          <Ionicons
            name={icon}
            size={24}
            color={isCancelled ? colors.textHint : colors.primary}
          />
        </View>
        <View style={styles.cardInfo}>
          <Text style={[styles.description, isCancelled && styles.textCancelled]} numberOfLines={1}>
            {item.title ?? item.description}
          </Text>
          <Text style={[styles.meta, isCancelled && styles.textCancelled]}>
            {item.paidByName} · {formatDate(item.expenseDate ?? item.date, locale)}
          </Text>
        </View>
        <View style={styles.cardRight}>
          <Text style={[styles.amount, isCancelled && styles.amountCancelled]}>
            {formatCurrency(item.amount)}
          </Text>
          {isCancelled && (
            <View style={[styles.badge, styles.badgeCancelled]}>
              <Text style={styles.badgeCancelledText}>{t('analytics.badgeCancelled')}</Text>
            </View>
          )}
          {isEdited && (
            <View style={[styles.badge, styles.badgeEdited]}>
              <Text style={styles.badgeEditedText}>{t('analytics.badgeEdited')}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
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
        data={expenses}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderExpenseCard}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color={colors.subText} />
            <Text style={styles.emptyText}>{t('analytics.noExpensesInCategory')}</Text>
          </View>
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 16 }} />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: 16, paddingBottom: 40 },
  separator: { height: 8 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardCancelled: { backgroundColor: colors.surfaceElevated },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: `${colors.primary}26`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryIconCancelled: { backgroundColor: colors.surfaceElevated },
  cardInfo: { flex: 1 },
  description: { fontSize: 17, fontWeight: '600', color: colors.text, marginBottom: 3 },
  meta: { fontSize: 14, color: colors.subText },
  amount: { fontSize: 17, fontWeight: '700', color: colors.text },
  cardRight: { alignItems: 'flex-end', gap: 4, marginLeft: 8 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  badgeCancelled: { backgroundColor: `${colors.danger}33` },
  badgeEdited: { backgroundColor: `${colors.warning}33` },
  badgeCancelledText: { fontSize: 10, fontWeight: '600', color: colors.danger },
  badgeEditedText: { fontSize: 10, fontWeight: '600', color: colors.warning },
  textCancelled: { color: colors.textHint },
  amountCancelled: { color: colors.textHint, textDecorationLine: 'line-through' },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingTop: 80,
  },
  emptyText: { fontSize: 16, color: colors.subText },

  skeletonCard: {
    height: 72,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 10,
  },
});
