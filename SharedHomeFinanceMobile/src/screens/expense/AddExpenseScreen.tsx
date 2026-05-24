import React, { useState } from 'react';
import {
  View,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { createExpense } from '../../services/expenseService';
import { getCategories } from '../../services/categoryService';
import { getMembers } from '../../services/homeService';
import { useHome } from '../../context/HomeContext';
import { useAuth } from '../../context/AuthContext';
import { MainStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { useTranslation } from 'react-i18next';

type Nav = StackNavigationProp<MainStackParamList, 'AddExpense'>;
type ParticipantMode = 'ALL' | 'SPECIFIC';

type FormData = {
  title: string;
  amount: number;
  categoryId: number;
  notes: string | undefined;
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

export default function AddExpenseScreen() {
  const { t } = useTranslation();
  const schema = yup.object({
    title: yup
      .string()
      .required(t('expense.titleRequired'))
      .min(2, t('expense.titleMin'))
      .max(100, t('expense.titleMax100')),
    amount: yup
      .number()
      .required(t('expense.amountRequired'))
      .positive(t('expense.amountPositive'))
      .typeError(t('expense.amountInvalid')),
    categoryId: yup
      .number()
      .required(t('expense.categoryRequired'))
      .typeError(t('expense.categoryInvalid')),
    notes: yup.string().max(255, t('expense.notesMax')).optional(),
  });
  const participantModeOptions: { value: ParticipantMode; label: string }[] = [
    { value: 'ALL', label: t('expense.participantAll') },
    { value: 'SPECIFIC', label: t('expense.participantSpecific') },
  ];
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();
  const { activeHome } = useHome();
  const { user } = useAuth();
  const homeId = activeHome?.id ?? 0;

  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [participantMode, setParticipantMode] = useState<ParticipantMode>('ALL');
  const [selectedParticipants, setSelectedParticipants] = useState<number[]>([]);

  const { data: categories } = useQuery({
    queryKey: ['categories', homeId],
    queryFn: () => getCategories(homeId),
  });

  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ['members', homeId],
    queryFn: () => getMembers(homeId),
    enabled: participantMode === 'SPECIFIC',
  });

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema) as unknown as Resolver<FormData>,
  });

  const selectedCategoryId = watch('categoryId');
  const selectedCategory = categories?.find((c) => c.id === selectedCategoryId);

  function toggleParticipant(id: number) {
    setSelectedParticipants((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  }

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      createExpense(homeId, {
        title: data.title,
        description: data.notes,
        amount: data.amount,
        categoryId: data.categoryId,
        expenseDate: (() => {
          const now = new Date();
          const offset = now.getTimezoneOffset() * 60000;
          return new Date(now.getTime() - offset).toISOString().slice(0, -1);
        })(),
        paidByUserId: Number(user!.id),
        participantIds: participantMode === 'ALL' ? null : selectedParticipants,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', homeId] });
      queryClient.invalidateQueries({ queryKey: ['analytics', 'monthly', homeId] });
      queryClient.invalidateQueries({ queryKey: ['analytics', 'personal', homeId] });
      queryClient.invalidateQueries({ queryKey: ['debts', 'my', homeId] });
      navigation.goBack();
    },
    onError: (error: Error) => {
      Toast.show({
        type: 'error',
        text1: t('common.errorTitle'),
        text2: (error as { response?: { data?: { message?: string } } }).response?.data?.message ?? t('expense.addError'),
      });
    },
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
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
                placeholder={t('expense.titlePlaceholder')}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={!!errors.title}
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
        {errors.title && <Text style={styles.error}>{errors.title.message}</Text>}

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
        {errors.amount && <Text style={styles.error}>{errors.amount.message}</Text>}

        {/* KATEGORİ */}
        <View style={{ zIndex: categoryDropdownOpen ? 100 : 1, marginBottom: 16 }}>
          <Controller
            control={control}
            name="categoryId"
            render={({ field: { onChange } }) => (
              <>
                <TouchableOpacity
                  style={[styles.pickerButton, !!errors.categoryId && styles.pickerButtonError]}
                  onPress={() => setCategoryDropdownOpen(prev => !prev)}
                  activeOpacity={0.7}
                >
                  <Text style={selectedCategory ? styles.pickerText : styles.pickerPlaceholder}>
                    {selectedCategory?.name ?? t('expense.categorySelect')}
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
        {errors.categoryId && <Text style={styles.error}>{errors.categoryId.message}</Text>}

        {/* Katılımcılar */}
        <View style={styles.participantsContainer}>
          <Text style={styles.inputLabel}>{t('expense.labelParticipants')}</Text>
          {participantModeOptions.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.radioOption,
                styles.radioOptionBorder,
                participantMode === opt.value && styles.radioOptionSelected,
              ]}
              onPress={() => {
                setParticipantMode(opt.value);
                if (opt.value === 'ALL') setSelectedParticipants([]);
              }}
              activeOpacity={0.7}
            >
              <View style={[
                styles.radioCircle,
                participantMode === opt.value && styles.radioCircleSelected,
              ]}>
                {participantMode === opt.value && <View style={styles.radioInner} />}
              </View>
              <Text style={[
                styles.radioLabel,
                participantMode === opt.value && styles.radioLabelSelected,
              ]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {participantMode === 'SPECIFIC' && (
          <View style={styles.memberList}>
            {membersLoading ? (
              <ActivityIndicator size="small" color={colors.primary} style={styles.membersLoader} />
            ) : (
              (members ?? []).map((member) => {
                const selected = selectedParticipants.includes(member.id);
                const displayName = member.name ?? '';
                return (
                  <TouchableOpacity
                    key={member.id?.toString() ?? Math.random().toString()}
                    style={[styles.memberRow, selected && styles.memberRowSelected]}
                    onPress={() => toggleParticipant(member.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.memberAvatar}>
                      <Text style={styles.memberAvatarText}>
                        {displayName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={[styles.memberName, selected && styles.memberNameSelected]}>
                      {displayName}
                    </Text>
                    <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                      {selected && (
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        {/* NOTLAR */}
        <View style={[styles.inputContainer, { paddingBottom: 10 }]}>
          <Text style={styles.inputLabel}>{t('expense.labelNotes')}</Text>
          <Controller
            control={control}
            name="notes"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                mode="flat"
                placeholder={t('expense.notesPlaceholder')}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                style={[styles.input, styles.notesInput]}
                underlineColor="transparent"
                activeUnderlineColor="transparent"
                textColor={colors.text}
                placeholderTextColor={colors.textHint}
                multiline={true}
                onContentSizeChange={undefined}
                maxLength={255}
                contentStyle={{ paddingTop: 8, textAlignVertical: 'top' }}
                theme={{ colors: { onSurfaceVariant: colors.subText } }}
              />
            )}
          />
        </View>
        {errors.notes && <Text style={styles.error}>{errors.notes.message}</Text>}

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
              <Text style={styles.btnLabel}>{t('expense.add')}</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40 },
  label: { fontSize: 13, color: colors.subText, marginBottom: 6, marginTop: 0 },
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
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  input: { backgroundColor: 'transparent', fontSize: 15, paddingHorizontal: 0, height: 44 },
  error: { fontSize: 12, color: colors.danger, marginTop: 4 },

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
  pickerButtonError: { borderColor: colors.danger },
  pickerText: { fontSize: 15, color: colors.text },
  pickerPlaceholder: { fontSize: 15, color: colors.subText },

  notesInput: { height: 8, minHeight: 44, maxHeight: 200 },
  dropdown: {
    zIndex: 100,
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
  dropdownItemSelected: {
    backgroundColor: `${colors.primary}1A`,
  },
  dropdownIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: `${colors.primary}1A`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownIconSelected: {
    backgroundColor: `${colors.primary}26`,
  },
  dropdownItemText: {
    flex: 1,
    fontSize: 15,
    color: colors.textSecondary,
  },
  dropdownItemTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },

  participantsContainer: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingTop: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
    overflow: 'hidden' as const,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  radioOptionBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  radioOptionSelected: { backgroundColor: `${colors.primary}1A` },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  radioCircleSelected: { borderColor: colors.primary },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  radioLabel: { fontSize: 14, color: colors.text },
  radioLabelSelected: { color: colors.primary, fontWeight: '500' },

  memberList: {
    marginBottom: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  membersLoader: { paddingVertical: 20 },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  memberRowSelected: { backgroundColor: `${colors.primary}1A` },
  memberAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: `${colors.primary}26`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarText: { fontSize: 12, fontWeight: 'bold', color: colors.primary },
  memberName: { flex: 1, fontSize: 13, color: colors.text },
  memberNameSelected: { color: colors.primary, fontWeight: '500' },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  btn: {
    borderRadius: 50,
    overflow: 'hidden',
  },
  btnGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 50,
  },
  btnLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
