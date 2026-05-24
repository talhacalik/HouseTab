import React, { createContext, useContext, useState, useCallback } from 'react';

export interface Home {
  id: number;
  name: string;
  inviteCode: string;
  memberCount: number;
  role: 'OWNER' | 'MEMBER';
}

interface HomeContextValue {
  homes: Home[];
  activeHome: Home | null;
  setHomes: (homes: Home[]) => void;
  setActiveHome: (home: Home | null) => void;
  addHome: (home: Home) => void;
  clearHomes: () => void;
}

const HomeContext = createContext<HomeContextValue | undefined>(undefined);

export function HomeProvider({ children }: { children: React.ReactNode }) {
  const [homes, setHomesState] = useState<Home[]>([]);
  const [activeHome, setActiveHomeState] = useState<Home | null>(null);

  const setHomes = useCallback((homes: Home[]) => {
    setHomesState(homes);
  }, []);

  const setActiveHome = useCallback((home: Home | null) => {
    setActiveHomeState(home);
  }, []);

  const addHome = useCallback((home: Home) => {
    setHomesState((prev) => [...prev, home]);
  }, []);

  const clearHomes = useCallback(() => {
    setHomesState([]);
    setActiveHomeState(null);
  }, []);

  return (
    <HomeContext.Provider
      value={{ homes, activeHome, setHomes, setActiveHome, addHome, clearHomes }}
    >
      {children}
    </HomeContext.Provider>
  );
}

export function useHome(): HomeContextValue {
  const ctx = useContext(HomeContext);
  if (!ctx) throw new Error('useHome must be used within HomeProvider');
  return ctx;
}
