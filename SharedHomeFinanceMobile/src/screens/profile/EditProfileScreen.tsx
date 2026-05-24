import React, { useEffect, useState } from 'react';
import {
  View,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getAuth, sendPasswordResetEmail } from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { getMyProfile, updateProfile, updateAvatar } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import { MainStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { useTranslation } from 'react-i18next';

type Nav = StackNavigationProp<MainStackParamList, 'EditProfile'>;

const schema = yup.object({
  name: yup
    .string()
    .required('İsim zorunludur')
    .min(2, 'En az 2 karakter olmalıdır')
    .max(50, 'En fazla 50 karakter olabilir'),
});

type FormData = { name: string };

const EMOJI_OPTIONS = ['😀','😎','🐱','🦊','🐻','🐼','🦁','🐯','🦄','🐸','🐙','🦋','🌟','🔥','💎','🎮','🎵','🏆','🚀','❤️','🌈','⚡','🍕','🎨'];

const COLOR_OPTIONS = [
  ['#1E40AF', '#0D9488'],
  ['#7C3AED', '#EC4899'],
  ['#D97706', '#DC2626'],
  ['#065F46', '#10B981'],
  ['#1E3A5F', '#2563EB'],
  ['#831843', '#F43F5E'],
];

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();
  const { updateUser, user } = useAuth();
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: getMyProfile,
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: { name: '' },
  });

  const displayEmail = profile?.email ?? user?.email ?? '';
  const displayName = profile?.name ?? user?.fullName ?? '';
  const avatarLetter = displayName.charAt(0).toUpperCase() || '?';

  const avatarColors = (() => {
    if (selectedColor) {
      const found = COLOR_OPTIONS.find(c => c[0] === selectedColor);
      if (found) return found as [string, string];
    }
    const saved = profile?.avatarColor;
    if (saved) {
      const found = COLOR_OPTIONS.find(c => c[0] === saved);
      if (found) return found as [string, string];
    }
    return ['#1E40AF', '#0D9488'] as [string, string];
  })();

  useEffect(() => {
    if (profile) reset({ name: profile.name });
  }, [profile]);

  function handlePasswordReset() {
    const email = displayEmail;
    if (!email) return;
    Alert.alert(
      t('profile.passwordResetTitle'),
      `${email} ${t('profile.passwordResetMessage')}`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.passwordResetSend'),
          onPress: async () => {
            try {
              const firebaseAuth = getAuth();
              await sendPasswordResetEmail(firebaseAuth, email);
              Toast.show({ type: 'success', text1: t('profile.emailSent'), text2: t('profile.emailSentMessage') });
            } catch {
              Toast.show({ type: 'error', text1: t('profile.errorTitle'), text2: t('profile.emailSentError') });
            }
          },
        },
      ],
    );
  }

  const mutation = useMutation({
    mutationFn: (data: FormData) => updateProfile(data.name),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      updateUser({ id: updated.id, email: updated.email, fullName: updated.name });
      Toast.show({ type: 'success', text1: t('profile.profileUpdated') });
      navigation.goBack();
    },
    onError: (error: Error) => {
      Toast.show({
        type: 'error',
        text1: t('profile.errorTitle'),
        text2: (error as { response?: { data?: { message?: string } } }).response?.data?.message ?? t('profile.profileUpdateError'),
      });
    },
  });

  const avatarMutation = useMutation({
    mutationFn: () => updateAvatar({
      avatarEmoji: selectedEmoji || profile?.avatarEmoji || undefined,
      avatarColor: selectedColor || profile?.avatarColor || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setAvatarModalVisible(false);
      Toast.show({ type: 'success', text1: t('profile.avatarUpdated') });
    },
    onError: () => {
      Toast.show({ type: 'error', text1: t('profile.errorTitle'), text2: t('profile.avatarUpdateError') });
    },
  });

  function handleResetAvatar() {
    setSelectedEmoji('');
    setSelectedColor('');
    avatarMutation.mutate();
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatarSection}>
          <View>
            <TouchableOpacity onPress={() => setAvatarModalVisible(true)} activeOpacity={0.8}>
              <LinearGradient
                colors={avatarColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarCircle}
              >
                {profile?.avatarEmoji || selectedEmoji ? (
                  <Text style={styles.avatarEmoji}>{profile?.avatarEmoji ?? selectedEmoji}</Text>
                ) : (
                  <Text style={styles.avatarLetter}>{avatarLetter}</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
            <View style={styles.avatarEditBadge}>
              <Ionicons name="pencil" size={12} color="#fff" />
            </View>
          </View>
          <Text style={styles.avatarName}>{displayName}</Text>
          <Text style={styles.avatarEmail}>{displayEmail}</Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>{t('profile.nameLabel')}</Text>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                mode="flat"
                placeholder={t('profile.namePlaceholder')}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={!!errors.name}
                style={styles.input}
                underlineColor="transparent"
                activeUnderlineColor="transparent"
                textColor={colors.text}
                placeholderTextColor={colors.textHint}
                maxLength={50}
                autoFocus
                theme={{ colors: { onSurfaceVariant: colors.subText } }}
              />
            )}
          />
        </View>
        {errors.name && <Text style={styles.error}>{errors.name.message}</Text>}

        <View style={[styles.inputContainer, { marginTop: 0 }]}>
          <Text style={styles.inputLabel}>{t('profile.emailLabel')}</Text>
          <View style={styles.readonlyRow}>
            <Text style={styles.readonlyText}>{displayEmail}</Text>
            <View style={styles.readonlyBadge}>
              <Text style={styles.readonlyBadgeText}>{t('profile.emailReadonly')}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.passwordBtn}
          onPress={handlePasswordReset}
          activeOpacity={0.7}
        >
          <View style={styles.passwordBtnIcon}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.primary} />
          </View>
          <Text style={styles.passwordBtnText}>{t('profile.passwordReset')}</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.subText} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSubmit((data) => mutation.mutate(data))}
          disabled={mutation.isPending}
          style={styles.btn}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#1E40AF', '#0D9488']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.btnGradient}
          >
            {mutation.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.btnLabel}>Kaydet</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
      <Modal
        visible={avatarModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setSelectedColor('');
          setSelectedEmoji('');
          setAvatarModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('profile.avatarSelectTitle')}</Text>
              <TouchableOpacity onPress={() => {
                setSelectedColor('');
                setSelectedEmoji('');
                setAvatarModalVisible(false);
              }}>
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Önizleme */}
            <View style={styles.modalPreview}>
              <LinearGradient
                colors={avatarColors}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.modalAvatarCircle}
              >
                <Text style={styles.modalAvatarEmoji}>
                  {selectedEmoji || profile?.avatarEmoji || avatarLetter}
                </Text>
              </LinearGradient>
            </View>

            {/* Emoji seçimi */}
            <Text style={styles.modalSectionTitle}>{t('profile.emojiLabel')}</Text>
            <FlatList
              data={EMOJI_OPTIONS}
              keyExtractor={(item) => item}
              numColumns={6}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.emojiBtn,
                    (selectedEmoji === item || (!selectedEmoji && profile?.avatarEmoji === item)) && styles.emojiBtnSelected,
                  ]}
                  onPress={() => setSelectedEmoji(item)}
                >
                  <Text style={styles.emojiText}>{item}</Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.emojiGrid}
            />

            {/* Renk seçimi */}
            <Text style={styles.modalSectionTitle}>{t('profile.colorLabel')}</Text>
            <View style={styles.colorRow}>
              {COLOR_OPTIONS.map((colorPair, index) => {
                const isSelected = selectedColor === colorPair[0] || (!selectedColor && profile?.avatarColor === colorPair[0]);
                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => setSelectedColor(colorPair[0])}
                    style={styles.colorBtnWrap}
                  >
                    <LinearGradient
                      colors={colorPair as [string, string]}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                      style={styles.colorBtn}
                    >
                      {isSelected && (
                        <Ionicons name="checkmark" size={18} color="#fff" />
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              onPress={() => {
                setSelectedEmoji('');
                setSelectedColor('');
                updateAvatar({ avatarEmoji: '', avatarColor: '' })
                  .then(() => {
                    queryClient.invalidateQueries({ queryKey: ['profile'] });
                    setAvatarModalVisible(false);
                    Toast.show({ type: 'success', text1: t('profile.avatarReset') });
                  })
                  .catch(() => {
                    Toast.show({ type: 'error', text1: t('profile.errorTitle'), text2: t('profile.avatarResetError') });
                  });
              }}
              style={styles.resetBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.resetBtnText}>{t('profile.avatarResetDefault')}</Text>
            </TouchableOpacity>

            {/* Kaydet butonu */}
            <TouchableOpacity
              onPress={() => avatarMutation.mutate()}
              disabled={avatarMutation.isPending}
              style={styles.btn}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#1E40AF', '#0D9488']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.btnGradient}
              >
                {avatarMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.btnLabel}>{t('common.save')}</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20 },
  inputContainer: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingTop: 10,
    marginBottom: 16,
  },
  inputLabel: { fontSize: 11, color: colors.subText, letterSpacing: 0.5, marginBottom: 2 },
  input: { backgroundColor: 'transparent', fontSize: 15, paddingHorizontal: 0, height: 44 },
  error: { fontSize: 12, color: colors.danger, marginTop: 4 },
  btn: { borderRadius: 50, overflow: 'hidden', marginTop: 16 },
  btnGradient: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center', borderRadius: 50 },
  btnLabel: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },

  avatarSection: { alignItems: 'center', paddingVertical: 24, marginBottom: 8 },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarLetter: { fontSize: 32, fontWeight: 'bold', color: '#FFFFFF' },
  avatarName: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 4 },
  avatarEmail: { fontSize: 13, color: colors.subText },

  readonlyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  readonlyText: { fontSize: 15, color: colors.textSecondary, flex: 1 },
  readonlyBadge: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  readonlyBadgeText: { fontSize: 11, color: colors.subText, fontWeight: '600' },

  passwordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 12,
  },
  passwordBtnIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(37,99,235,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  passwordBtnText: { flex: 1, fontSize: 15, color: colors.text, fontWeight: '500' },

  avatarEditBadge: {
    position: 'absolute', right: 0, bottom: 0,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: colors.background,
  },
  avatarEmoji: { fontSize: 36 },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  modalPreview: { alignItems: 'center', marginBottom: 20 },
  modalAvatarCircle: {
    width: 72, height: 72, borderRadius: 36,
    justifyContent: 'center', alignItems: 'center',
  },
  modalAvatarEmoji: { fontSize: 32 },
  modalSectionTitle: {
    fontSize: 11, fontWeight: '700', color: colors.subText,
    letterSpacing: 0.5, marginBottom: 10,
  },
  emojiGrid: { marginBottom: 16 },
  emojiBtn: {
    flex: 1, aspectRatio: 1, margin: 4,
    borderRadius: 10, justifyContent: 'center', alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
  },
  emojiBtnSelected: {
    backgroundColor: 'rgba(37,99,235,0.2)',
    borderWidth: 2, borderColor: colors.primary,
  },
  emojiText: { fontSize: 24 },
  colorRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  colorBtnWrap: { flex: 1 },
  colorBtn: { height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  resetBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  resetBtnText: {
    fontSize: 14,
    color: colors.subText,
    fontWeight: '500',
  },
});
