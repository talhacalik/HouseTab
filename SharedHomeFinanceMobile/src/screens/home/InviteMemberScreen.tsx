import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { inviteMember, generateInviteCode, getActiveInvitation } from '../../services/homeService';
import { useHome } from '../../context/HomeContext';
import { colors } from '../../theme/colors';
import { useTranslation } from 'react-i18next';

type FormData = { email: string };

export default function InviteMemberScreen() {
  const { t } = useTranslation();
  const { activeHome } = useHome();
  const homeId = activeHome?.id ?? 0;
  const queryClient = useQueryClient();
  const [localInviteCode, setLocalInviteCode] = useState<string | null>(null);

  const schema = yup.object({
    email: yup
      .string()
      .required(t('auth.emailRequired'))
      .email(t('auth.emailValidation')),
  });

  const { data: activeInvitation, isLoading: codeLoading } = useQuery({
    queryKey: ['active-invitation', homeId],
    queryFn: () => getActiveInvitation(homeId),
    enabled: !!homeId,
    retry: false,
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: { email: '' },
  });

  const generateMutation = useMutation({
    mutationFn: () => generateInviteCode(homeId),
    onSuccess: (data) => {
      setLocalInviteCode(data.inviteCode ?? null);
      queryClient.invalidateQueries({ queryKey: ['active-invitation', homeId] });
      Toast.show({ type: 'success', text1: t('home.codeGenerated') });
    },
    onError: () => {
      Toast.show({ type: 'error', text1: t('common.errorTitle'), text2: t('home.codeGenerateError') });
    },
  });

  const inviteMutation = useMutation({
    mutationFn: (data: FormData) => inviteMember(homeId, data.email),
    onSuccess: () => {
      Toast.show({ type: 'success', text1: t('home.inviteSent') });
      reset();
    },
    onError: (error: Error) => {
      Toast.show({
        type: 'error',
        text1: t('common.errorTitle'),
        text2: (error as { response?: { data?: { message?: string } } }).response?.data?.message ?? t('home.inviteError'),
      });
    },
  });

  const displayCode = localInviteCode ?? activeInvitation?.inviteCode ?? null;

  async function handleCopy() {
    if (!displayCode) return;
    await Clipboard.setStringAsync(displayCode);
    Toast.show({ type: 'success', text1: t('home.codeCopied') });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Davet Kodu */}
      <LinearGradient
        colors={['#1E40AF', '#0D9488']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.codeCard}
      >
        <View style={styles.codeDecor} />
        <Text style={styles.codeLabel}>{t('home.inviteCode')}</Text>
        {codeLoading ? (
          <View style={styles.skeletonCode} />
        ) : (
          <Text style={styles.codeText}>{displayCode ?? '—'}</Text>
        )}
        <Text style={styles.codeHint}>{t('home.inviteCodeHint')}</Text>
        <LinearGradient
          colors={['#1E40AF', '#0D9488']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.copyBtn}
        >
          <TouchableOpacity
            style={styles.copyBtnInner}
            onPress={handleCopy}
            disabled={codeLoading || !displayCode}
            activeOpacity={0.7}
          >
            <Ionicons name="copy-outline" size={16} color="#fff" />
            <Text style={styles.copyBtnText}>{t('home.copyCode')}</Text>
          </TouchableOpacity>
        </LinearGradient>
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          activeOpacity={0.7}
        >
          {generateMutation.isPending ? (
            <ActivityIndicator size="small" color="rgba(255,255,255,0.8)" />
          ) : (
            <>
              <Ionicons name="refresh-outline" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.refreshBtnText}>{t('home.generateNewCode')}</Text>
            </>
          )}
        </TouchableOpacity>
      </LinearGradient>

      {/* E-posta Daveti */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="mail-outline" size={18} color={colors.primary} />
          <Text style={styles.sectionTitle}>{t('home.emailInviteTitle')}</Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>{t('home.labelEmail')}</Text>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                mode="flat"
                placeholder={t('home.emailPlaceholder')}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={!!errors.email}
                style={styles.input}
                underlineColor="transparent"
                activeUnderlineColor="transparent"
                textColor={colors.text}
                placeholderTextColor={colors.textHint}
                keyboardType="email-address"
                autoCapitalize="none"
                theme={{ colors: { onSurfaceVariant: colors.subText } }}
              />
            )}
          />
        </View>
        {errors.email && <Text style={styles.error}>{errors.email.message}</Text>}

        <TouchableOpacity
          onPress={handleSubmit((data) => inviteMutation.mutate(data))}
          disabled={inviteMutation.isPending}
          style={styles.btn}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#1E40AF', '#0D9488']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.btnGradient}
          >
            {inviteMutation.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.btnLabel}>{t('home.sendInvite')}</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 40 },

  codeCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  codeDecor: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  codeLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 12 },
  codeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 6,
    marginBottom: 10,
  },
  codeHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  copyBtn: { marginTop: 4, padding: 2, borderRadius: 50 },
  copyBtnInner: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 50, paddingVertical: 10, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 8 },
  copyBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  skeletonCode: {
    height: 40,
    width: 160,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 8,
    marginBottom: 10,
  },

  section: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text },
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
  btn: { borderRadius: 50, overflow: 'hidden', marginTop: 8 },
  btnGradient: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center', borderRadius: 50 },
  btnLabel: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, opacity: 0.8 },
  refreshBtnText: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
});
