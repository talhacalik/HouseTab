import React from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../../navigation/types';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getCategoryAnalytics, CategoryAnalytics } from '../../services/analyticsService';
import { useHome } from '../../context/HomeContext';
import { colors } from '../../theme/colors';
import { useTranslation } from 'react-i18next';

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

const CHART_COLORS = [
  '#2563EB',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#F97316',
];

function formatCurrency(amount: number): string {
  return `₺${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function SkeletonCard() {
  return <View style={styles.skeleton} />;
}

function PieChart({ data, total, totalLabel }: { data: CategoryAnalytics[]; total: number; totalLabel: string }) {
  const circumference = 2 * Math.PI * 56;
  let cumulative = 0;

  return (
    <Svg width={160} height={160}>
      <Circle
        cx={80}
        cy={80}
        r={56}
        fill="none"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth={28}
        transform="rotate(-90, 80, 80)"
      />
      {data.map((item, index) => {
        const arcLength = (item.percentage / 100) * circumference;
        const offset = -cumulative;
        cumulative += arcLength;
        return (
          <Circle
            key={item.categoryId}
            cx={80}
            cy={80}
            r={56}
            fill="none"
            stroke={CHART_COLORS[index % CHART_COLORS.length]}
            strokeWidth={28}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={offset}
            transform="rotate(-90, 80, 80)"
          />
        );
      })}
      <Circle cx={80} cy={80} r={42} fill={colors.primaryDark} />
      <SvgText
        x={80}
        y={75}
        textAnchor="middle"
        fontSize={11}
        fill="rgba(255,255,255,0.7)"
      >
        {totalLabel}
      </SvgText>
      <SvgText
        x={80}
        y={92}
        textAnchor="middle"
        fontSize={13}
        fontWeight="bold"
        fill="#FFFFFF"
      >
        {formatCurrency(total)}
      </SvgText>
    </Svg>
  );
}

export default function CategoryAnalyticsScreen() {
  const { t } = useTranslation();
  const { i18n: i18nInstance } = useTranslation();
  const locale = i18nInstance.language === 'en' ? 'en-US' : 'tr-TR';
  const { activeHome } = useHome();
  const homeId = activeHome?.id ?? 0;
  const navigation = useNavigation<StackNavigationProp<MainStackParamList>>();
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get('window').width;

  const { data, isLoading } = useQuery({
    queryKey: ['analytics', 'categories', homeId],
    queryFn: () => getCategoryAnalytics(homeId),
    enabled: !!homeId,
  });

  const sorted = [...(data ?? [])].sort((a, b) => b.totalAmount - a.totalAmount);
  const total = sorted.reduce((sum, c) => sum + c.totalAmount, 0);

  const now = new Date();
  const monthLabel = now.toLocaleDateString(locale, { month: 'long', year: 'numeric' });

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
        <View style={styles.skeletonHeader} />
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </View>
    );
  }

  function renderItem({ item, index }: { item: CategoryAnalytics; index: number }) {
    const barColor = CHART_COLORS[index % CHART_COLORS.length];
    const icon = CATEGORY_ICONS[item.categoryName.toLowerCase()] ?? 'ellipsis-horizontal-outline';
    const clampedPct = Math.min(Math.max(item.percentage, 0), 100);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('CategoryExpenses', {
          categoryId: item.categoryId,
          categoryName: item.categoryName,
        })}
        activeOpacity={0.7}
      >
        <View style={styles.cardRow}>
          <View style={[styles.iconWrap, { backgroundColor: `${barColor}18` }]}>
            <Ionicons name={icon} size={20} color={barColor} />
          </View>
          <Text style={styles.categoryName} numberOfLines={1}>
            {item.categoryName}
          </Text>
          <View style={styles.cardRight}>
            <Text style={styles.amount}>{formatCurrency(item.totalAmount)}</Text>
            <Text style={styles.pct}>{item.percentage.toFixed(1)}%</Text>
          </View>
        </View>
        <View style={styles.barBg}>
          <View
            style={[
              styles.barFill,
              { width: `${clampedPct}%` as any, backgroundColor: barColor },
            ]}
          />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('analytics.categoryAnalyticsTitle')}</Text>
      </View>

      <FlatList
        style={styles.list}
        contentContainerStyle={styles.content}
        data={sorted}
        keyExtractor={item => String(item.categoryId)}
        renderItem={renderItem}
        ListHeaderComponent={
          <>
            <LinearGradient
              colors={['#1E40AF', '#0D9488']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientCard}
            >
              <Text style={styles.gradientLabel}>{t('analytics.thisMonthTotal')}</Text>
              <Text style={styles.gradientAmount}>{formatCurrency(total)}</Text>
              <Text style={styles.gradientMonth}>{monthLabel}</Text>
              <View style={styles.chartContainer}>
                <PieChart data={sorted} total={total} totalLabel={t('analytics.totalLabel')} />
              </View>
              <View style={styles.legend}>
                {sorted.map((item, index) => (
                  <View key={item.categoryId} style={styles.legendItem}>
                    <View
                      style={[
                        styles.legendDot,
                        { backgroundColor: CHART_COLORS[index % CHART_COLORS.length] },
                      ]}
                    />
                    <Text style={styles.legendText}>
                      {item.categoryName} {item.percentage.toFixed(1)}%
                    </Text>
                  </View>
                ))}
              </View>
            </LinearGradient>
            <Text style={styles.sectionLabel}>{t('analytics.categoriesLabel')}</Text>
          </>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="pie-chart-outline" size={52} color={colors.subText} />
            <Text style={styles.emptyText}>{t('analytics.noExpensesThisMonth')}</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },

  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    bottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },

  gradientCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  gradientLabel: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 6 },
  gradientAmount: { fontSize: 32, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
  gradientMonth: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 16 },

  chartContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },

  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
  },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.subText,
    letterSpacing: 0.5,
    marginBottom: 10,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  cardRight: { alignItems: 'flex-end', gap: 2 },
  amount: { fontSize: 14, fontWeight: '700', color: colors.text },
  pct: { fontSize: 12, color: colors.subText },

  barBg: {
    height: 6,
    backgroundColor: colors.inputBg,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: 6,
    borderRadius: 3,
  },

  empty: {
    alignItems: 'center',
    gap: 12,
    paddingTop: 60,
  },
  emptyText: { fontSize: 15, color: colors.subText },

  skeleton: {
    height: 88,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  skeletonHeader: {
    height: 116,
    backgroundColor: colors.surface,
    borderRadius: 16,
    margin: 16,
    marginBottom: 6,
  },
});
