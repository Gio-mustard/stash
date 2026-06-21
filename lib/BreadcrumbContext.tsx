"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type BreadcrumbOptions = {
  last?: string;
  parentHref?: string;
  parentLabel?: string;
  labels?: Record<string, string>;
};

type BreadcrumbContextType = {
  options: BreadcrumbOptions | null;
  setOptions: (options: BreadcrumbOptions | null) => void;
};

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(undefined);

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<BreadcrumbOptions | null>(null);

  return (
    <BreadcrumbContext.Provider value={{ options, setOptions }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumbs(newOptions?: BreadcrumbOptions) {
  const context = useContext(BreadcrumbContext);
  if (!context) {
    throw new Error("useBreadcrumbs must be used within a BreadcrumbProvider");
  }

  const { setOptions } = context;
  const serialized = newOptions ? JSON.stringify(newOptions) : "";

  useEffect(() => {
    if (serialized) {
      setOptions(JSON.parse(serialized));
      return () => setOptions(null);
    }
  }, [serialized, setOptions]);

  return context;
}
