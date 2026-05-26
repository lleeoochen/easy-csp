import { HistoryChart } from './HistoryChart';

const ACCOUNT_TYPE_CONFIGS = [
  { dataKey: 'checking', name: 'Checking', color: '#3b82f6', gradientId: 'checkingGradient', title: '' },
  { dataKey: 'savings', name: 'Savings', color: '#10b981', gradientId: 'savingsGradient', title: '' },
  { dataKey: 'investment', name: 'Investment', color: '#8b5cf6', gradientId: 'investmentGradient', title: '' },
  { dataKey: 'credit', name: 'Credit', color: '#f97316', gradientId: 'creditGradient', title: '' },
  { dataKey: 'loan', name: 'Loan', color: '#ef4444', gradientId: 'loanGradient', title: '' },
  { dataKey: 'other', name: 'Other', color: '#6b7280', gradientId: 'otherGradient', title: '' },
];

export const AccountTypeHistoryChart = () => (
  <HistoryChart configs={ACCOUNT_TYPE_CONFIGS} title="Account Type History" />
);
