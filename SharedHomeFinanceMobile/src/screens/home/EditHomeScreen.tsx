import React, { useEffect } from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Toast from 'react-native-toast-message';
import { getHome, updateHome } from '../../services/homeService';
import { useHome } from '../../context/HomeContext';
import { MainStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { useTranslation } from 'react-i18next';

type Nav = StackNavigationProp<MainStackParamList, 'EditHome'>;

interface FormValues {
  name: string;
  description: string;
}

export default function EditHomeScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();
  const { activeHome, setActiveHome } = useHome();
  const homeId = activeHome?.id ?? 0;

  const schema = yup.object({
    name: yup
      .string()
      .required(t('home.nameRequired'))
      .min(2, t('home.nameMin2'))
      .max(100, t('home.nameMax100')),
    description: yup.string().max(255, t('home.descriptionMax')).optional().default(''),
  });

  const { data: home, isLoading } = useQuery({
    queryKey: ['home', homeId],
    queryFn: () => getHome(homeId),
    enabled: !!homeId,
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  useEffect(() => {
    if (home) {
      reset({
        name: home.name,
        description: home.description ?? '',
      });
    }
  }, [home, reset]);

  const mutation = useMutation({
    mutationFn: (data: FormValues) =>
      updateHome(homeId, {
        name: data.name,
        description: data.description || undefined,
      }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['home', homeId] });
      queryClient.invalidateQueries({ queryKey: ['homes'] });
      if (activeHome) {
        setActiveHome({ ...activeHome, name: updated.name });
      }
      Toast.show({ type: 'success', text1: t('home.updateSuccess') });
      navigation.goBack();
    },
    onError: (error: Error) => {
      Toast.show({
        type: 'error',
        text1: t('common.errorTitle'),
        text2: (error as { response?: { data?: { message?: string } } }).response?.data?.message ?? t('home.updateError'),
      });
    },
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        {Array.from({ length: 4 }).map((_, i) => (
          <View key={i} style={styles.skeleton} />
        ))}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>{t('home.labelHomeName')}</Text>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                mode="flat"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder={t('home.homeNameEditPlaceholder')}
                error={!!errors.name}
                style={styles.input}
                underlineColor="transparent"
                activeUnderlineColor="transparent"
                textColor={colors.text}
                placeholderTextColor={colors.textHint}
                maxLength={100}
                theme={{ colors: { onSurfaceVariant: colors.subText } }}
              />
            )}
          />
        </View>
        {errors.name && <Text style={styles.errorText}>{errors.name.message}</Text>}

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>{t('home.labelDescription')}</Text>
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                mode="flat"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder={t('home.descriptionPlaceholder')}
                error={!!errors.description}
                style={[styles.input, { height: 8, minHeight: 44, maxHeight: 200 }]}
                underlineColor="transparent"
                activeUnderlineColor="transparent"
                textColor={colors.text}
                placeholderTextColor={colors.textHint}
                multiline
                maxLength={255}
                contentStyle={{ paddingTop: 8, textAlignVertical: 'top' }}
                theme={{ colors: { onSurfaceVariant: colors.subText } }}
              />
            )}
          />
        </View>
        {errors.description && (
          <Text style={styles.errorText}>{errors.description.message}</Text>
        )}

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
              <Text style={styles.btnLabel}>{t('common.save')}</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 40 },

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
  errorText: { fontSize: 12, color: colors.danger, marginTop: 4, marginBottom: 4 },


  btn: { borderRadius: 50, overflow: 'hidden'},
  btnGradient: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center', borderRadius: 50 },
  btnLabel: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },

  skeleton: {
    height: 56,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
  },
});
