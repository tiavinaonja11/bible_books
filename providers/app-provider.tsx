import { AppContext, useAppStore } from '@/hooks/useappstore';
import React, { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export function AppProvider({ children }: Props) {
  const appState = useAppStore();

  return <AppContext.Provider value={appState}>{children}</AppContext.Provider>;
}
