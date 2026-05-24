import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type HomeSelectionStackParamList = {
  HomeSelectionMain: undefined;
  CreateHome: undefined;
  JoinHome: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Expenses: undefined;
  Debts: undefined;
  Profile: undefined;
};

export type MainStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  ExpenseDetail: { expenseId: number };
  ExpenseHistory: { expenseId: number };
  EditExpense: { expenseId: number };
  DebtDetail: { debtId: number; expenseId: number; rejected?: boolean };
  AddExpense: undefined;
  EditProfile: undefined;
  NotificationScreen: undefined;
  AIReport: undefined;
  CategoryAnalytics: undefined;
  CategoryExpenses: { categoryId: number; categoryName: string };
  HomeSettings: undefined;
  EditHome: undefined;
  MemberList: undefined;
  InviteMember: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  HomeSelection: NavigatorScreenParams<HomeSelectionStackParamList>;
  Main: NavigatorScreenParams<MainStackParamList>;
};
