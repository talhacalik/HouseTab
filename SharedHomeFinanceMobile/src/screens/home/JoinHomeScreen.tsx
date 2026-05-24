import React, { useRef, useLayoutEffect } from 'react';
import {
  View,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Text,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgUri } from 'react-native-svg';
import { Asset } from 'expo-asset';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { joinHome } from '../../services/homeService';
import { HomeSelectionStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { useTranslation } from 'react-i18next';

type Nav = StackNavigationProp<HomeSelectionStackParamList, 'JoinHome'>;

const illustrationUri = Asset.fromModule(
  require('../../../assets/illustrations/join-home.svg'),
).uri;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const ILLUSTRATION_HEIGHT = screenHeight * 0.22;
const btnVerticalPadding = screenHeight * 0.022;
const btnHorizontalPadding = screenWidth * 0.05;

type FormData = { inviteCode: string };

export default function JoinHomeScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();
  const inputRef = useRef<TextInput>(null);

  const schema = yup.object({
    inviteCode: yup
      .string()
      .required(t('home.inviteCodeRequired'))
      .min(6, t('home.inviteCodeLength'))
      .max(6, t('home.inviteCodeLength')),
  });

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, []);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: { inviteCode: '' },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => joinHome(data.inviteCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homes'] });
      navigation.goBack();
    },
    onError: () => {
      Toast.show({
        type: 'error',
        text1: t('home.invalidInviteCode'),
        text2: t('home.invalidInviteCodeMsg'),
      });
    },
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="chevron-back-outline" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('home.joinHome')}</Text>
        <View style={styles.headerBtn} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* Illustration */}
          <View style={styles.illustrationWrapper}>
            <SvgUri width="100%" height={ILLUSTRATION_HEIGHT} uri={illustrationUri} />
          </View>

          {/* Title */}
          <Text style={styles.title}>{t('home.enterInviteCode')}</Text>

          {/* Description */}
          <Text style={styles.description}>
            {t('home.joinDescription')}
          </Text>

          {/* Label */}
          <Text style={styles.label}>{t('home.labelInviteCode')}</Text>

          {/* Code boxes card */}
          <Controller
            control={control}
            name="inviteCode"
            render={({ field: { onChange, value = '' } }) => (
              <View style={styles.inputContainer}>
                {Array.from({ length: 6 }).map((_, index) => {
                  const char = value[index] ?? '';
                  const isFilled = index < value.length;
                  return (
                    <View
                      key={index}
                      style={[
                        styles.codeBox,
                        { borderColor: isFilled ? colors.primary : colors.border },
                      ]}
                    >
                      <Text style={styles.codeChar}>{char}</Text>
                    </View>
                  );
                })}
                <TextInput
                  ref={inputRef}
                  value={value}
                  onChangeText={(text) => onChange(text.toUpperCase())}
                  maxLength={6}
                  autoCapitalize="characters"
                  style={styles.hiddenInput}
                />
              </View>
            )}
          />

          {errors.inviteCode && (
            <Text style={styles.errorText}>{errors.inviteCode.message}</Text>
          )}

          {/* Gradient button */}
          <TouchableOpacity
            onPress={handleSubmit((data) => mutation.mutate(data))}
            disabled={mutation.isPending}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.button, { paddingVertical: btnVerticalPadding, marginHorizontal: btnHorizontalPadding }]}
            >
              {mutation.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonLabel}>{t('home.joinHome')}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Info card */}
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={18} color={colors.primary} style={styles.infoIcon} />
            <Text style={styles.infoText}>
              {t('home.codeOneTimeUse')}
            </Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: colors.background,
  },
  headerBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  content: {
    padding: 24,
  },
  illustrationWrapper: {
    width: '100%',
    paddingHorizontal: 32,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: colors.subText,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 11,
    color: colors.subText,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 12,
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
    borderColor: 'transparent',
    borderRadius: 0,
  },
  codeBox: {
    width: 52,
    height: 64,
    borderRadius: 14,
    borderWidth: 2,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeChar: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  hiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
    color: 'transparent',
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    marginBottom: 8,
  },
  button: {
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 0,
    alignSelf: 'center',
  },
  infoIcon: {
    marginRight: 8,
  },
  infoText: {
    fontSize: 13,
    color: colors.subText,
    lineHeight: 20,
  },
});
