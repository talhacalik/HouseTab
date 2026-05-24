import React from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  getMyProfile,
  getUserSettings,
  updateUserSettings,
  UserSettings,
} from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import { useHome } from '../../context/HomeContext';
import { MainTabParamList, MainStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../../i18n';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Profile'>,
  StackNavigationProp<MainStackParamList>
>;

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function SettingsRow({
  icon,
  label,
  onPress,
  right,
  danger,
  isFirst,
}: {
  icon: IoniconsName;
  label: string;
  onPress?: () => void;
  right?: React.ReactNode;
  danger?: boolean;
  isFirst?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.settingsRow, !isFirst && styles.settingsRowBorder]}
      onPress={onPress}
      activeOpacity={onPress ? 0.6 : 1}
    >
      <View style={[styles.rowIconWrap, danger && styles.rowIconDanger]}>
        <Ionicons name={icon} size={18} color={danger ? colors.danger : colors.primary} />
      </View>
      <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
      <View style={styles.rowRight}>{right}</View>
    </TouchableOpacity>
  );
}

function SkeletonBox({ style }: { style?: object }) {
  return <View style={[styles.skeleton, style]} />;
}

const COLOR_OPTIONS: Record<string, [string, string]> = {
  '#1E40AF': ['#1E40AF', '#0D9488'],
  '#7C3AED': ['#7C3AED', '#EC4899'],
  '#D97706': ['#D97706', '#DC2626'],
  '#065F46': ['#065F46', '#10B981'],
  '#1E3A5F': ['#1E3A5F', '#2563EB'],
  '#831843': ['#831843', '#F43F5E'],
};

export default function ProfileScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();
  const { activeHome, setActiveHome, clearHomes } = useHome();
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: getMyProfile,
  });

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['user-settings'],
    queryFn: getUserSettings,
  });

  const settingsMutation = useMutation({
    mutationFn: (s: Partial<UserSettings>) => updateUserSettings(s),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings'] });
    },
    onError: () => {
      Toast.show({ type: 'error', text1: t('profile.errorTitle'), text2: t('profile.errorSettings') });
    },
  });

  async function handleSettingChange(key: keyof UserSettings, value: UserSettings[keyof UserSettings]) {
    await settingsMutation.mutateAsync({
      language: settings?.language ?? 'TR',
      theme: settings?.theme ?? 'LIGHT',
      notificationEnabled: settings?.notificationEnabled ?? true,
      [key]: value,
    });
    if (key === 'language') {
      const lang = value === 'TR' ? 'tr' : 'en';
      await i18n.changeLanguage(lang);
      await AsyncStorage.setItem('app_language', lang);
    }
  }

  function handleLogout() {
    Alert.alert(t('profile.logoutConfirmTitle'), t('profile.logoutConfirmMessage'), [
      { text: t('profile.logoutConfirmCancel'), style: 'cancel' },
      {
        text: t('profile.logout'),
        style: 'destructive',
        onPress: async () => {
          queryClient.clear();
          clearHomes();
          await logout();
        },
      },
    ]);
  }

  const displayName = profile?.name ?? user?.fullName ?? '';
  const displayEmail = profile?.email ?? user?.email ?? '';
  const avatarLetter = displayName.charAt(0).toUpperCase() || '?';
  const avatarColors: [string, string] = profile?.avatarColor && COLOR_OPTIONS[profile.avatarColor]
    ? COLOR_OPTIONS[profile.avatarColor]
    : ['#1E40AF', '#0D9488'];

  if (profileLoading || settingsLoading || !user) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <SkeletonBox style={styles.skeletonProfile} />
        <SkeletonBox style={styles.skeletonSection} />
        <SkeletonBox style={styles.skeletonSection} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          <LinearGradient
            colors={avatarColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarCircle}
          >
            {profile?.avatarEmoji ? (
              <Text style={styles.avatarEmoji}>{profile.avatarEmoji}</Text>
            ) : (
              <Text style={styles.avatarLetter}>{avatarLetter}</Text>
            )}
          </LinearGradient>
          <Text style={styles.profileName}>{displayName}</Text>
          <Text style={styles.profileEmail}>{displayEmail}</Text>
          <LinearGradient
            colors={['#1E40AF', '#0D9488']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.editBtnGradient}
          >
            <TouchableOpacity
              style={styles.editBtnInner}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <Text style={styles.editBtnText}>{t('profile.editProfile')}</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.settingsTitle')}</Text>

          <SettingsRow
            icon="language-outline"
            label={t('profile.language')}
            isFirst
            onPress={() =>
              Alert.alert(t('profile.selectLanguage'), '', [
                { text: t('profile.languageTR'), onPress: () => handleSettingChange('language', 'TR') },
                { text: t('profile.languageEN'), onPress: () => handleSettingChange('language', 'EN') },
                { text: t('common.cancel'), style: 'cancel' },
              ])
            }
            right={
              <Text style={styles.rowValue}>{settings?.language ?? 'TR'}</Text>
            }
          />

          <SettingsRow
            icon="notifications-outline"
            label={t('profile.notifications')}
            right={
              <Switch
                value={settings?.notificationEnabled ?? true}
                onValueChange={(val) =>
                  settingsMutation.mutate({
                    language: settings?.language ?? 'TR',
                    theme: settings?.theme ?? 'LIGHT',
                    notificationEnabled: val,
                  })
                }
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            }
          />

          <SettingsRow
            icon="home-outline"
            label={t('profile.activeHome')}
            onPress={() => setActiveHome(null)}
            right={
              <View style={styles.rowRightGroup}>
                <Text style={styles.rowValue} numberOfLines={1}>
                  {activeHome?.name ?? ''}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.subText} />
              </View>
            }
          />

          {activeHome && (
            <SettingsRow
              icon="settings-outline"
              label={t('profile.homeSettings')}
              onPress={() => navigation.navigate('HomeSettings')}
            />
          )}

          <SettingsRow
            icon="analytics-outline"
            label={t('profile.aiReport')}
            onPress={() => navigation.navigate('AIReport')}
            right={<Ionicons name="chevron-forward" size={16} color={colors.subText} />}
          />
        </View>

        <View style={styles.section}>
          <SettingsRow
            icon="log-out-outline"
            label={t('profile.logout')}
            onPress={handleLogout}
            danger
            isFirst
          />
        </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 40 },

  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarLetter: { fontSize: 32, fontWeight: 'bold', color: '#FFFFFF' },
  avatarEmoji: { fontSize: 36 },
  profileName: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
  profileEmail: { fontSize: 14, color: colors.subText, marginBottom: 16 },
  editBtnGradient: { padding: 2, borderRadius: 50 },
  editBtnInner: {
    backgroundColor: colors.background,
    borderRadius: 50,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  editBtnText: { color: colors.primary, fontSize: 14, fontWeight: '600' },

  section: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.subText,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 2,
  },

  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  settingsRowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rowIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(37,99,235,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rowIconDanger: { backgroundColor: 'rgba(239,68,68,0.12)' },
  rowLabel: { flex: 1, fontSize: 15, color: colors.text },
  rowLabelDanger: { color: colors.danger },
  rowRight: { alignItems: 'center', justifyContent: 'center' },
  rowRightGroup: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowValue: { fontSize: 14, color: colors.subText },

  skeleton: { backgroundColor: colors.surfaceElevated, borderRadius: 16 },
  skeletonProfile: { height: 220, marginBottom: 16 },
  skeletonSection: { height: 160, marginBottom: 16 },
});
