export const isDemoMode = import.meta.env.VITE_API_MODE === 'mock';
export const showDemoAccounts =
  isDemoMode || import.meta.env.VITE_SHOW_DEMO_ACCOUNTS !== 'false';
