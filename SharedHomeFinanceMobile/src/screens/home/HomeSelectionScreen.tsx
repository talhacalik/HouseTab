import React from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery } from '@tanstack/react-query';
import { getMyHomes, Home } from '../../services/homeService';
import { useHome } from '../../context/HomeContext';
import { HomeSelectionStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { useTranslation } from 'react-i18next';

type Nav = StackNavigationProp<HomeSelectionStackParamList, 'HomeSelectionMain'>;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const btnHorizontalPadding = screenWidth * 0.05;
const btnVerticalPadding = screenHeight * 0.022;

export default function HomeSelectionScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const { setActiveHome } = useHome();

  const { data: homes, isLoading, isError, refetch } = useQuery({
    queryKey: ['homes'],
    queryFn: getMyHomes,
  });

  function handleSelectHome(home: Home) {
    setActiveHome(home);
  }

  function renderHomeCard({ item }: { item: Home }) {
    const isOwner = item.role === 'OWNER';
    return (
      <TouchableOpacity style={styles.card} onPress={() => handleSelectHome(item)}>
        <View style={styles.cardLeft}>
          <Text style={styles.homeName}>{item.name}</Text>
          <View style={styles.memberRow}>
            <Ionicons name="people-outline" size={16} color={colors.subText} />
            <Text style={styles.memberCount}>{t('home.memberCountFormat', { count: item.memberCount })}</Text>
          </View>
        </View>
        <View style={styles.cardRight}>
          <View style={[
            styles.roleBadge,
            {
              backgroundColor: isOwner ? 'rgba(37,99,235,0.25)' : 'rgba(13,148,136,0.25)',
              borderWidth: 1,
              borderColor: isOwner ? 'rgba(37,99,235,0.35)' : 'rgba(13,148,136,0.35)',
            },
          ]}>
            <Text style={[styles.roleText, { color: isOwner ? '#93C5FD' : '#5EEAD4' }]}>
              {isOwner ? t('home.roleOwner') : t('home.roleMember')}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.borderLight} />
        </View>
      </TouchableOpacity>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{t('home.loadError')}</Text>
        <Button
          mode="outlined"
          onPress={() => refetch()}
          style={styles.retryButton}
          textColor={colors.text}
        >
          {t('common.retry')}
        </Button>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {navigation.canGoBack() && (
        <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back-outline" size={26} color={colors.text} />
          <Text style={styles.backText}>{t('common.back')}</Text>
        </TouchableOpacity>
      )}

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Ionicons name="home-outline" size={28} color="#60A5FA" />
            <View>
              <Text style={styles.title}>{t('home.myHomes')}</Text>
              <Text style={styles.subtitle}>{t('home.selectHomeSubtitle')}</Text>
            </View>
          </View>
          <View style={styles.homesCountBadge}>
            <Text style={styles.homesCountText}>{t('home.homesCountFormat', { count: (homes ?? []).length })}</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={homes ?? []}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderHomeCard}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="home-outline" size={56} color={colors.borderLight} />
            <Text style={styles.emptyText}>{t('home.noHomeYet')}</Text>
          </View>
        }
      />

      <View style={styles.footer}>
        <TouchableOpacity
          onPress={() => navigation.navigate('CreateHome')}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#1E40AF', '#0D9488']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.primaryButton, { paddingVertical: btnVerticalPadding, marginHorizontal: btnHorizontalPadding }]}
          >
            <Text style={styles.primaryButtonLabel}>{t('home.createHomeBtn')}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <LinearGradient
          colors={['#1E40AF', '#0D9488']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.outlinedButtonGradient, { marginHorizontal: btnHorizontalPadding, marginTop: 0 }]}
        >
          <TouchableOpacity
            onPress={() => navigation.navigate('JoinHome')}
            activeOpacity={0.85}
            style={[styles.outlinedButtonInner, { paddingVertical: btnVerticalPadding }]}
          >
            <Text style={styles.outlinedButtonLabel}>{t('home.joinWithCode')}</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 24,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 13,
    color: colors.subText,
    marginTop: 3,
  },
  homesCountBadge: {
    borderRadius: 50,
    paddingHorizontal: 14,
    paddingVertical: 5,
    backgroundColor: colors.surfaceElevated,
  },
  homesCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  listContent: { flexGrow: 1, padding: 16 },
  separator: { height: 10 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 15, color: colors.subText, textAlign: 'center' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardLeft: {
    flex: 1,
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  homeName: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 8 },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  memberCount: { fontSize: 13, color: colors.subText },
  roleBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  roleText: {
    fontSize: 13,
    fontWeight: '600',
  },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 16, paddingBottom: 0 },
  backText: { fontSize: 16, color: colors.text },
  footer: { padding: 16, paddingBottom: screenHeight * 0.06, gap: 12 },
  primaryButton: {
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  outlinedButtonGradient: {
    borderRadius: 50,
    padding: 2,
  },
  outlinedButtonInner: {
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  outlinedButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  errorText: { fontSize: 16, color: colors.danger, textAlign: 'center', marginBottom: 16 },
  retryButton: { borderColor: colors.border },
});
