import type { CatalogItem } from '@/constants/catalog';
import React, { createContext, useContext, useMemo, useState } from 'react';

export type AlignmentPoint = {
  star: CatalogItem;
  deviceAz: number; // degrees
  deviceAlt: number; // degrees
  calculatedAz: number; // degrees
  calculatedAlt: number; // degrees
};

type AlignmentState = {
  alignmentPoints: AlignmentPoint[];
  addAlignmentPoint: (point: AlignmentPoint) => void;
  clearAlignment: () => void;
  getOffsets: () => { azOffset: number; altOffset: number };
  getAlignmentQuality: () => 'none' | '1-star' | '2-star' | '3-star';
};

const AlignmentContext = createContext<AlignmentState | undefined>(undefined);

export function AlignmentProvider({ children }: { children: React.ReactNode }) {
  const [alignmentPoints, setAlignmentPoints] = useState<AlignmentPoint[]>([]);

  const addAlignmentPoint = (point: AlignmentPoint) => {
    setAlignmentPoints(prev => [...prev, point]);
  };

  const clearAlignment = () => {
    setAlignmentPoints([]);
  };

  const getOffsets = () => {
    if (alignmentPoints.length === 0) {
      return { azOffset: 0, altOffset: 0 };
    }

    if (alignmentPoints.length === 1) {
      // Simple offset for single point
      const point = alignmentPoints[0];
      return {
        azOffset: point.deviceAz - point.calculatedAz,
        altOffset: point.deviceAlt - point.calculatedAlt,
      };
    }

    // Least squares fit for multiple points
    // For simplicity, we'll fit a linear model: device = calculated + offset
    // In practice, telescope alignment often involves more complex models

    let sumAzDiff = 0;
    let sumAltDiff = 0;

    alignmentPoints.forEach(point => {
      sumAzDiff += point.deviceAz - point.calculatedAz;
      sumAltDiff += point.deviceAlt - point.calculatedAlt;
    });

    return {
      azOffset: sumAzDiff / alignmentPoints.length,
      altOffset: sumAltDiff / alignmentPoints.length,
    };
  };

  const getAlignmentQuality = () => {
    const count = alignmentPoints.length;
    if (count === 0) return 'none';
    if (count === 1) return '1-star';
    if (count === 2) return '2-star';
    return '3-star';
  };

  const value = useMemo<AlignmentState>(
    () => ({
      alignmentPoints,
      addAlignmentPoint,
      clearAlignment,
      getOffsets,
      getAlignmentQuality,
    }),
    [alignmentPoints]
  );

  return <AlignmentContext.Provider value={value}>{children}</AlignmentContext.Provider>;
}

export function useAlignmentContext(): AlignmentState {
  const ctx = useContext(AlignmentContext);
  if (!ctx) throw new Error('useAlignmentContext must be used within AlignmentProvider');
  return ctx;
}
