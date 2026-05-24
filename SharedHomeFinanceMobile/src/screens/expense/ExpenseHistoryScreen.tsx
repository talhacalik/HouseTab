import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import {
  getExpenseHistory,
  getExpense,
  ExpenseVersion,
  ExpenseDetail,
} from '../../services/expenseService';
import { useHome } from '../../context/HomeContext';
import { MainStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { useTranslation } from 'react-i18next';

type RouteProps = RouteProp<MainStackParamList, 'ExpenseHistory'>;

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

function formatCurrency(amount: number): string {
  return `₺${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getNewTitle(
  history: ExpenseVersion[],
  index: number,
  expense: ExpenseDetail | undefined,
): string | undefined {
  for (let i = index - 1; i >= 0; i--) {
    if (history[i].previousTitle !== undefined) return history[i].previousTitle;
  }
  return expense?.title ?? expense?.description;
}

function getNewAmount(
  history: ExpenseVersion[],
  index: number,
  expense: ExpenseDetail | undefined,
): number | undefined {
  for (let i = index - 1; i >= 0; i--) {
    if (history[i].previousAmount !== undefined) return history[i].previousAmount;
  }
  return expense?.amount;
}

function getNewDescription(
  history: ExpenseVersion[],
  index: number,
  expense: ExpenseDetail | undefined,
): string | undefined {
  for (let i = index - 1; i >= 0; i--) {
    if (history[i].previousDescription !== undefined) return history[i].previousDescription;
  }
  return expense?.description;
}

function valueStyle(
  isChanged: boolean,
  role: 'old' | 'new',
): object {
  if (!isChanged) {
    if (role === 'old') return { color: '#EF4444', fontSize: 13 };
    return { color: '#F59E0B', fontSize: 13 };
  }
  if (role === 'old')
    return { color: '#EF4444', textDecorationLine: 'line-through' as const, fontSize: 13 };
  return { color: '#10B981', fontWeight: '600' as const, fontSize: 13 };
}

function SkeletonCard() {
  return <View style={styles.skeleton} />;
}

export default function ExpenseHistoryScreen() {
  const { t } = useTranslation();
  const { i18n: i18nInstance } = useTranslation();
  const locale = i18nInstance.language === 'en' ? 'en-US' : 'tr-TR';
  const route = useRoute<RouteProps>();
  const { activeHome } = useHome();
  const homeId = activeHome?.id ?? 0;
  const { expenseId } = route.params;

  const { data: expense } = useQuery({
    queryKey: ['expense', homeId, expenseId],
    queryFn: () => getExpense(homeId, expenseId),
  });

  const { data: history, isLoading } = useQuery({
    queryKey: ['expense-history', homeId, expenseId],
    queryFn: () => getExpenseHistory(homeId, expenseId),
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </View>
    );
  }

  if (!history || history.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="time-outline" size={48} color={colors.subText} />
        <Text style={styles.emptyText}>{t('expense.noHistory')}</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={history}
      keyExtractor={item => String(item.id)}
      renderItem={({ item, index }) => {
        const isLast = index === history.length - 1;

        const newTitle =
          item.previousTitle !== undefined
            ? getNewTitle(history, index, expense)
            : undefined;
        const newAmount =
          item.previousAmount !== undefined
            ? getNewAmount(history, index, expense)
            : undefined;
        const newDescription =
          item.previousDescription !== undefined
            ? getNewDescription(history, index, expense)
            : undefined;

        const titleChanged = newTitle !== undefined && newTitle !== item.previousTitle;
        const amountChanged = newAmount !== undefined && newAmount !== item.previousAmount;
        const descriptionChanged =
          newDescription !== undefined && newDescription !== item.previousDescription;

        return (
          <View style={styles.itemRow}>
            <View style={styles.timeline}>
              <View style={styles.dot} />
              {!isLast && <View style={styles.line} />}
            </View>
            <View style={[styles.card, isLast && styles.lastCard]}>
              <Text style={styles.headerName}>{item.editedByName}</Text>
              <Text style={styles.headerDate}>{formatEditDate(item.editedAt, locale)}</Text>
              {item.editNote ? (
                <Text style={styles.editNote}>{t('expense.editReasonPrefix')}{item.editNote}</Text>
              ) : null}

              {item.previousTitle !== undefined && (
                <View style={styles.changeRow}>
                  <Ionicons name="text-outline" size={13} color={colors.subText} />
                  <Text style={styles.changeText}>
                    {t('expense.changeTitle')}
                    <Text style={valueStyle(titleChanged, 'old')}>{item.previousTitle}</Text>
                    {newTitle !== undefined ? (
                      <Text>
                        {' → '}
                        <Text style={valueStyle(titleChanged, 'new')}>{newTitle}</Text>
                      </Text>
                    ) : null}
                  </Text>
                </View>
              )}

              {item.previousAmount !== undefined && (
                <View style={styles.changeRow}>
                  <Ionicons name="cash-outline" size={13} color={colors.subText} />
                  <Text style={styles.changeText}>
                    {t('expense.changeAmount')}
                    <Text style={valueStyle(amountChanged, 'old')}>
                      {formatCurrency(item.previousAmount)}
                    </Text>
                    {newAmount !== undefined ? (
                      <Text>
                        {' → '}
                        <Text style={valueStyle(amountChanged, 'new')}>
                          {formatCurrency(newAmount)}
                        </Text>
                      </Text>
                    ) : null}
                  </Text>
                </View>
              )}

              {item.previousDescription !== undefined && (
                <View style={styles.changeRow}>
                  <Ionicons name="document-text-outline" size={13} color={colors.subText} />
                  <Text style={styles.changeText}>
                    {t('expense.changeNotes')}
                    <Text style={valueStyle(descriptionChanged, 'old')}>
                      {item.previousDescription}
                    </Text>
                    {newDescription !== undefined ? (
                      <Text>
                        {' → '}
                        <Text style={valueStyle(descriptionChanged, 'new')}>
                          {newDescription}
                        </Text>
                      </Text>
                    ) : null}
                  </Text>
                </View>
              )}
            </View>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 40 },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.background,
  },
  emptyText: { fontSize: 15, color: colors.subText },
  skeleton: {
    height: 110,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  timeline: {
    width: 24,
    alignItems: 'center',
    paddingTop: 4,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.primaryDark,
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border,
    marginTop: 2,
  },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginLeft: 12,
    marginBottom: 16,
  },
  lastCard: {
    marginBottom: 0,
  },
  headerName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  headerDate: {
    fontSize: 12,
    color: colors.subText,
    marginTop: 2,
    marginBottom: 8,
  },
  editNote: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FCD34D',
    marginBottom: 8,
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.25)',
    borderRadius: 8,
    padding: 8,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 4,
  },
  changeText: {
    fontSize: 13,
    color: colors.subText,
    flex: 1,
    flexWrap: 'wrap',
  },
});
