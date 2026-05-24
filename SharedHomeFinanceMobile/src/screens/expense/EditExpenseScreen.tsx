import React, { useEffect, useState } from 'react';
import {
  View,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getExpense, updateExpense } from '../../services/expenseService';
import { getCategories } from '../../services/categoryService';
import { useHome } from '../../context/HomeContext';
import { MainStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { useTranslation } from 'react-i18next';

type Nav = StackNavigationProp<MainStackParamList, 'EditExpense'>;
type RouteProps = RouteProp<MainStackParamList, 'EditExpense'>;

type FormData = {
  title: string;
  amount: number;
  categoryId: number | null | undefined;
  description: string | undefined;
  editNote: string;
};

const CATEGORY_ICONS: Record<string, string> = {
  fatura: 'flash-outline',
  eğlence: 'musical-notes-outline',
  market: 'cart-outline',
  kira: 'home-outline',
  yemek: 'restaurant-outline',
  temizlik: 'brush-outline',
  ulaşım: 'car-outline',
  sağlık: 'medical-outline',
  diğer: 'ellipsis-horizontal-outline',
  food: 'restaurant-outline',
  rent: 'home-outline',
  bills: 'flash-outline',
  cleaning: 'brush-outline',
  other: 'ellipsis-horizontal-outline',
};

function SkeletonBox({ style }: { style?: object }) {
  return <View style={[styles.skeleton, style]} />;
}

export default function EditExpenseScreen() {
  const { t } = useTranslation();
  const schema = yup.object({
    title: yup
      .string()
      .required(t('expense.titleRequired'))
      .min(2, t('expense.titleMin'))
      .max(150, t('expense.titleMax150')),
    amount: yup
      .number()
      .required(t('expense.amountRequired'))
      .positive(t('expense.amountPositive'))
      .typeError(t('expense.amountInvalid')),
    categoryId: yup.number().optional().nullable().typeError(t('expense.categoryTypeError')),
    description: yup.string().max(500, t('expense.descriptionMax')).optional(),
    editNote: yup
      .string()
      .required(t('expense.editNoteRequired'))
      .min(5, t('expense.editNoteMin')),
  });
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProps>();
  const queryClient = useQueryClient();
  const { activeHome } = useHome();
  const homeId = activeHome?.id ?? 0;
  const { expenseId } = route.params;

  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

  const { data: expense, isLoading: expenseLoading } = useQuery({
    queryKey: ['expense', homeId, expenseId],
    queryFn: () => getExpense(homeId, expenseId),
    enabled: !!homeId && !!expenseId,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories', homeId],
    queryFn: () => getCategories(homeId),
    enabled: !!homeId,
  });

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema) as unknown as Resolver<FormData>,
    defaultValues: {
      title: '',
      amount: undefined,
      categoryId: undefined,
      description: '',
      editNote: '',
    },
  });

  useEffect(() => {
    if (expense) {
      reset({
        title: expense.title ?? expense.description ?? '',
        amount: expense.amount,
        categoryId: expense.categoryId ?? undefined,
        description: expense.description ?? '',
        editNote: '',
      });
    }
  }, [expense, reset]);

  const selectedCategoryId = watch('categoryId');
  const selectedCategory = categories?.find((c) => c.id === selectedCategoryId);

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      updateExpense(homeId, expenseId, {
        title: data.title,
        description: data.description || undefined,
        amount: data.amount,
        expenseDate: expense?.expenseDate ?? expense?.date ?? new Date().toISOString(),
        categoryId: data.categoryId ?? undefined,
        editNote: data.editNote,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', homeId] });
      queryClient.invalidateQueries({ queryKey: ['expense', homeId, expenseId] });
      queryClient.invalidateQueries({ queryKey: ['analytics', 'monthly', homeId] });
      queryClient.invalidateQueries({ queryKey: ['analytics', 'personal', homeId] });
      queryClient.invalidateQueries({ queryKey: ['debts', 'my', homeId] });
      Toast.show({ type: 'success', text1: t('expense.updateSuccess') });
      navigation.goBack();
    },
    onError: (error: Error) => {
      Toast.show({
        type: 'error',
        text1: t('common.errorTitle'),
        text2: (error as { response?: { data?: { message?: string } } }).response?.data?.message ?? t('expense.updateError'),
      });
    },
  });

  if (expenseLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.skeletonContent}>
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonBox key={i} style={styles.skeletonField} />
          ))}
        </View>
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
        onStartShouldSetResponder={() => {
          if (categoryDropdownOpen) { setCategoryDropdownOpen(false); return true; }
          return false;
        }}
      >

        {/* BAŞLIK */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>{t('expense.labelTitle')}</Text>
          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                mode="flat"
                placeholder={t('expense.titlePlaceholderEdit')}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={!!errors.title}
                style={styles.input}
                underlineColor="transparent"
                activeUnderlineColor="transparent"
                textColor={colors.text}
                placeholderTextColor={colors.textHint}
                maxLength={150}
                theme={{ colors: { onSurfaceVariant: colors.subText } }}
              />
            )}
          />
        </View>
        {errors.title && <Text style={styles.errorText}>{errors.title.message}</Text>}

        {/* TUTAR */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>{t('expense.labelAmount')}</Text>
          <Controller
            control={control}
            name="amount"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 16, color: colors.subText, marginRight: 4, marginTop: 2 }}>₺</Text>
                <TextInput
                  mode="flat"
                  placeholder="0,00"
                  value={value?.toString()}
                  onChangeText={(t) => onChange(parseFloat(t.replace(',', '.')) || undefined)}
                  onBlur={onBlur}
                  error={!!errors.amount}
                  style={[styles.input, { flex: 1 }]}
                  underlineColor="transparent"
                  activeUnderlineColor="transparent"
                  textColor={colors.text}
                  placeholderTextColor={colors.textHint}
                  theme={{ colors: { onSurfaceVariant: colors.subText } }}
                  keyboardType="decimal-pad"
                />
              </View>
            )}
          />
        </View>
        {errors.amount && <Text style={styles.errorText}>{errors.amount.message}</Text>}

        {/* KATEGORİ */}
        <View style={{ zIndex: categoryDropdownOpen ? 100 : 1, marginBottom: 16 }}>
          <Controller
            control={control}
            name="categoryId"
            render={({ field: { onChange } }) => (
              <>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setCategoryDropdownOpen(prev => !prev)}
                  activeOpacity={0.7}
                >
                  <Text style={selectedCategory ? styles.pickerText : styles.pickerPlaceholder}>
                    {selectedCategory?.name ?? t('expense.categorySelectOptional')}
                  </Text>
                  <Ionicons
                    name={categoryDropdownOpen ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={colors.subText}
                  />
                </TouchableOpacity>
                {categoryDropdownOpen && (
                  <View style={styles.dropdown}>
                    {(categories ?? []).map((cat) => {
                      const isSelected = cat.id === selectedCategoryId;
                      const iconName = (CATEGORY_ICONS[cat.name.toLowerCase()] ?? 'ellipsis-horizontal-outline') as any;
                      return (
                        <TouchableOpacity
                          key={cat.id}
                          style={[styles.dropdownItem, isSelected && styles.dropdownItemSelected]}
                          onPress={() => {
                            onChange(cat.id);
                            setCategoryDropdownOpen(false);
                          }}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.dropdownIcon, isSelected && styles.dropdownIconSelected]}>
                            <Ionicons name={iconName} size={18} color={colors.primary} />
                          </View>
                          <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextSelected]}>
                            {cat.name}
                          </Text>
                          {isSelected && (
                            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </>
            )}
          />
        </View>

        {/* AÇIKLAMA / NOTLAR */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>{t('expense.labelDescription')}</Text>
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                mode="flat"
                placeholder={t('expense.descriptionPlaceholder')}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                style={[styles.input, { height: undefined, minHeight: 44, maxHeight: 200 }]}
                underlineColor="transparent"
                activeUnderlineColor="transparent"
                textColor={colors.text}
                placeholderTextColor={colors.textHint}
                multiline
                maxLength={500}
                contentStyle={{ paddingTop: 8, textAlignVertical: 'top' }}
                theme={{ colors: { onSurfaceVariant: colors.subText } }}
              />
            )}
          />
        </View>
        {errors.description && <Text style={styles.errorText}>{errors.description.message}</Text>}

        {/* DÜZENLEME SEBEBİ */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>{t('expense.labelEditNote')}</Text>
          <Controller
            control={control}
            name="editNote"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                mode="flat"
                placeholder={t('expense.editNotePlaceholder')}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={!!errors.editNote}
                style={[styles.input, { height: undefined, minHeight: 44, maxHeight: 200 }]}
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

        {/* INFO BANNER */}
        <View style={styles.editNoteBanner}>
          <Ionicons name="information-circle-outline" size={16} color="#60A5FA" />
          <Text style={styles.editNoteInfo}>{t('expense.editNoteInfo')}</Text>
        </View>
        {errors.editNote && <Text style={styles.errorText}>{errors.editNote.message}</Text>}

        {/* KAYDET */}
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
  content: { padding: 20, paddingBottom: 40 },

  inputContainer: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingTop: 10,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 11,
    color: colors.subText,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  input: { backgroundColor: 'transparent', fontSize: 15, paddingHorizontal: 0, height: 44 },
  errorText: { fontSize: 12, color: colors.danger, marginTop: 4, marginBottom: 4 },

  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  pickerText: { fontSize: 15, color: colors.text },
  pickerPlaceholder: { fontSize: 15, color: colors.subText },
  dropdown: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 4,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 13,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownItemSelected: { backgroundColor: `${colors.primary}1A` },
  dropdownIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: `${colors.primary}1A`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownIconSelected: { backgroundColor: `${colors.primary}26` },
  dropdownItemText: { flex: 1, fontSize: 15, color: colors.textSecondary },
  dropdownItemTextSelected: { color: colors.primary, fontWeight: '600' },

  editNoteBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(37,99,235,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(37,99,235,0.25)',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    marginBottom: 14,
  },
  editNoteInfo: { color: '#60A5FA', fontSize: 12, flex: 1 },

  btn: { borderRadius: 50, overflow: 'hidden', marginTop: 8 },
  btnGradient: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center', borderRadius: 50 },
  btnLabel: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },

  skeletonContent: { padding: 20 },
  skeleton: { backgroundColor: colors.surfaceElevated, borderRadius: 8 },
  skeletonField: { height: 56, marginBottom: 20 },
});
