import React from 'react';
import { TouchableOpacity } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { MainStackParamList, MainTabParamList } from './types';
import DashboardScreen from '../screens/analytics/DashboardScreen';
import ExpenseListScreen from '../screens/expense/ExpenseListScreen';
import AddExpenseScreen from '../screens/expense/AddExpenseScreen';
import ExpenseDetailScreen from '../screens/expense/ExpenseDetailScreen';
import ExpenseHistoryScreen from '../screens/expense/ExpenseHistoryScreen';
import EditExpenseScreen from '../screens/expense/EditExpenseScreen';
import DebtScreen from '../screens/debt/DebtScreen';
import DebtDetailScreen from '../screens/debt/DebtDetailScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import NotificationScreen from '../screens/notification/NotificationScreen';
import HomeSettingsScreen from '../screens/home/HomeSettingsScreen';
import EditHomeScreen from '../screens/home/EditHomeScreen';
import MemberListScreen from '../screens/home/MemberListScreen';
import InviteMemberScreen from '../screens/home/InviteMemberScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import AIReportScreen from '../screens/analytics/AIReportScreen';
import CategoryAnalyticsScreen from '../screens/analytics/CategoryAnalyticsScreen';
import CategoryExpensesScreen from '../screens/analytics/CategoryExpensesScreen';
import { colors } from '../theme/colors';
import { useTranslation } from 'react-i18next';

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createStackNavigator<MainStackParamList>();

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<string, { focused: IoniconsName; unfocused: IoniconsName }> = {
  Dashboard: { focused: 'home', unfocused: 'home-outline' },
  Expenses: { focused: 'receipt', unfocused: 'receipt-outline' },
  Debts: { focused: 'swap-horizontal', unfocused: 'swap-horizontal-outline' },
  Profile: { focused: 'person', unfocused: 'person-outline' },
};

const TAB_LABELS: Record<string, string> = {
  Dashboard: 'Özet',
  Expenses: 'Harcamalar',
  Debts: 'Borçlar',
  Profile: 'Profil',
};

function MainTabNavigator() {
  const { t } = useTranslation();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name];
          const name = focused ? icons.focused : icons.unfocused;
          return <Ionicons name={name} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.subText,
        tabBarStyle: { backgroundColor: colors.surface },
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '800', fontSize: 30 },
        headerTitleAlign: 'center',
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: t('dashboard.title') }}
      />
      <Tab.Screen
        name="Expenses"
        component={ExpenseListScreen}
        options={{ title: t('expense.title'), tabBarLabel: t('expense.title') }}
      />
      <Tab.Screen
        name="Debts"
        component={DebtScreen}
        options={{ title: t('debt.title') }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: t('profile.title') }}
      />
    </Tab.Navigator>
  );
}

export default function MainNavigator() {
  const { t } = useTranslation();
  return (
    <Stack.Navigator
      screenOptions={({ navigation }) => ({
        gestureEnabled: true,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: 'bold' },
        headerTitleAlign: 'center',
        headerLeft: ({ canGoBack }) =>
          canGoBack ? (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ paddingLeft: 16, padding: 4 }}
            >
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </TouchableOpacity>
          ) : null,
      })}
    >
      <Stack.Screen
        name="MainTabs"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AddExpense"
        component={AddExpenseScreen}
        options={{ title: t('expense.add') }}
      />
      <Stack.Screen
        name="ExpenseDetail"
        component={ExpenseDetailScreen}
        options={{ title: t('expense.detail') }}
      />
      <Stack.Screen
        name="ExpenseHistory"
        component={ExpenseHistoryScreen}
        options={{ title: t('expense.historyTitle') }}
      />
      <Stack.Screen
        name="EditExpense"
        component={EditExpenseScreen}
        options={{ title: t('expense.editTitle') }}
      />
      <Stack.Screen
        name="DebtDetail"
        component={DebtDetailScreen}
        options={{ title: t('debt.detail') }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: t('profile.editProfile') }}
      />
      <Stack.Screen
        name="AIReport"
        component={AIReportScreen}
        options={{ title: t('profile.aiReport') }}
      />
      <Stack.Screen
        name="CategoryAnalytics"
        component={CategoryAnalyticsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CategoryExpenses"
        component={CategoryExpensesScreen}
        options={({ route }) => ({ title: (route.params as { categoryName: string }).categoryName })}
      />
      <Stack.Screen
        name="NotificationScreen"
        component={NotificationScreen}
        options={{ title: t('notification.title') }}
      />
      <Stack.Screen
        name="HomeSettings"
        component={HomeSettingsScreen}
        options={{ title: t('home.settings') }}
      />
      <Stack.Screen
        name="EditHome"
        component={EditHomeScreen}
        options={{ title: t('home.editSettings') }}
      />
      <Stack.Screen
        name="MemberList"
        component={MemberListScreen}
        options={{ title: t('home.members') }}
      />
      <Stack.Screen
        name="InviteMember"
        component={InviteMemberScreen}
        options={{ title: t('home.inviteMember') }}
      />
    </Stack.Navigator>
  );
}
