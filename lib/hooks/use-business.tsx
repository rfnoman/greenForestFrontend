"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { businessesApi } from "@/lib/api/businesses";
import type { Business } from "@/lib/types";
import { useAuth } from "./use-auth";

interface BusinessContextType {
  currentBusiness: Business | null;
  businesses: Business[];
  isLoading: boolean;
  setCurrentBusiness: (business: Business) => void;
  refreshBusinesses: () => void;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

const CURRENT_BUSINESS_KEY = "greenforest_current_business";

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [currentBusiness, setCurrentBusinessState] = useState<Business | null>(null);

  const {
    data: businesses = [],
    isLoading,
    refetch: refreshBusinesses,
  } = useQuery({
    queryKey: ["businesses"],
    queryFn: businessesApi.list,
    enabled: isAuthenticated,
  });

  const setCurrentBusiness = useCallback((business: Business) => {
    setCurrentBusinessState(business);
    localStorage.setItem(CURRENT_BUSINESS_KEY, business.id);
    apiClient.setBusinessId(business.id);
  }, []);

  useEffect(() => {
    if (businesses.length > 0 && !currentBusiness) {
      const savedBusinessId = localStorage.getItem(CURRENT_BUSINESS_KEY);
      const savedBusiness = businesses.find((b) => b.id === savedBusinessId);

      if (savedBusiness) {
        setCurrentBusiness(savedBusiness);
      } else {
        setCurrentBusiness(businesses[0]);
      }
    }
  }, [businesses, currentBusiness, setCurrentBusiness]);

  useEffect(() => {
    if (!isAuthenticated) {
      setCurrentBusinessState(null);
      apiClient.setBusinessId(null);
    }
  }, [isAuthenticated]);

  return (
    <BusinessContext.Provider
      value={{
        currentBusiness,
        businesses,
        isLoading,
        setCurrentBusiness,
        refreshBusinesses,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const context = useContext(BusinessContext);
  if (context === undefined) {
    throw new Error("useBusiness must be used within a BusinessProvider");
  }
  return context;
}
