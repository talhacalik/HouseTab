import React, { useLayoutEffect } from 'react';
import {
  View,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { createHome } from '../../services/homeService';
import { HomeSelectionStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { useTranslation } from 'react-i18next';

type Nav = StackNavigationProp<HomeSelectionStackParamList, 'CreateHome'>;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const btnVerticalPadding = screenHeight * 0.022;
const btnHorizontalPadding = screenWidth * 0.05;
const ILLUSTRATION_HEIGHT = screenHeight * 0.25;
const illustrationUri = Asset.fromModule(
  require('../../../assets/illustrations/creat-home.svg'),
).uri;

type FormData = {
  name: string;
};

export default function CreateHomeScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();

  const schema = yup.object({
    name: yup.string().required(t('home.nameRequired')).min(3, t('home.nameMin3')).max(50, t('home.nameMax50')),
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
    defaultValues: { name: '' },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      createHome(data.name, 'EQUAL', true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homes'] });
      navigation.goBack();
    },
    onError: (error: Error) => {
      Toast.show({
        type: 'error',
        text1: t('common.errorTitle'),
        text2: (error as { response?: { data?: { message?: string } } }).response?.data?.message ?? t('home.createError'),
      });
    },
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="chevron-back-outline" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('home.createHome')}</Text>
        <View style={styles.headerBtn} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          <View style={styles.illustrationWrapper}>
            <SvgUri width="100%" height={ILLUSTRATION_HEIGHT} uri={illustrationUri} />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{t('home.homeName')}</Text>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  mode="flat"
                  placeholder={t('home.homeNamePlaceholder')}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={!!errors.name}
                  style={styles.input}
                  placeholderTextColor={colors.textHint}
                  underlineColor="transparent"
                  activeUnderlineColor="transparent"
                  textColor={colors.text}
                  theme={{ colors: { onSurfaceVariant: colors.subText } }}
                  maxLength={50}
                />
              )}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name.message}</Text>}
          </View>

          <TouchableOpacity
            onPress={handleSubmit((data) => mutation.mutate(data))}
            disabled={mutation.isPending}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#1E40AF', '#0D9488']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.button, { paddingVertical: btnVerticalPadding, marginHorizontal: btnHorizontalPadding }]}
            >
              {mutation.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonLabel}>{t('home.createHome')}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: colors.background,
  },
  headerBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  content: { padding: 24 },
  illustrationWrapper: { width: '100%', paddingHorizontal: 32, marginBottom: 16 },
  inputContainer: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingTop: 10,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 11,
    color: colors.subText,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  input: {
    backgroundColor: 'transparent',
    fontSize: 15,
    color: colors.text,
    paddingHorizontal: 0,
    height: 44,
  },
  errorText: { fontSize: 12, color: colors.danger, marginBottom: 8, marginTop: 4 },
  button: { borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  buttonLabel: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});
