import { type CatalogItem } from '@/constants/catalog';
import React, { createContext, useContext, useMemo, useState } from 'react';

type TargetState = {
  selectedTarget: CatalogItem | null;
  setSelectedTarget: (t: CatalogItem) => void;

  useManual: boolean;
  setUseManual: (v: boolean) => void;
  manualRa: number | null; // hours
  manualDec: number | null; // degrees
  setManual: (ra: number, dec: number) => void;
};

const TargetContext = createContext<TargetState | undefined>(undefined);

export function TargetProvider({ children }: { children: React.ReactNode }) {
  const [selectedTarget, setSelectedTarget] = useState<CatalogItem | null>(null);
  const [useManual, setUseManual] = useState(false);
  const [manualRa, setManualRa] = useState<number | null>(null);
  const [manualDec, setManualDec] = useState<number | null>(null);

  const value = useMemo<TargetState>(
    () => ({
      selectedTarget,
      setSelectedTarget: (t) => {
        setSelectedTarget(t);
        setUseManual(false);
      },
      useManual,
      setUseManual,
      manualRa,
      manualDec,
      setManual: (ra, dec) => {
        setManualRa(ra);
        setManualDec(dec);
        setUseManual(true);
      },
    }), [selectedTarget, useManual, manualRa, manualDec]
  );

  return <TargetContext.Provider value={value}>{children}</TargetContext.Provider>;
}

export function useTargetContext(): TargetState {
  const ctx = useContext(TargetContext);
  if (!ctx) throw new Error('useTargetContext must be used within TargetProvider');
  return ctx;
}
