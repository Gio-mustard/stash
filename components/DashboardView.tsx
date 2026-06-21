"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BalanceCard from "./BalanceCard";
import ActionButtons from "./ActionButtons";
import GuardaditosSection, { type GuardaditoData } from "./GuardaditosSection";
import RecentTransactions from "./RecentTransactions";
import CreateGuardaditoDrawer from "./CreateGuardaditoDrawer";
import type { TransactionData } from "./TransactionItem";
import { createTransaction } from "@/app/actions";

export type CustomCategory = {
  id: string;
  label: string;
  icon: string;
};

import type { PocketData } from "./PocketCard";

type DashboardViewProps = {
  portfolio: {
    balance: string;
    changePercent: string;
    isPositive: boolean;
    rawWalletBalance?: number;
  };
  guardaditos: GuardaditoData[];
  pockets: PocketData[];
  transactions: TransactionData[];
  customCategories: CustomCategory[];
};

/**
 * DashboardView is a client-side layout coordinator for the Stash application.
 * Manages modal and drawer visibility states and triggers server actions on submission.
 *
 * @param props - The layout properties including initial user datasets and custom categories.
 */
export default function DashboardView({
  portfolio,
  guardaditos,
  pockets,
  transactions,
  customCategories,
}: DashboardViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isCreateGuardaditoOpen, setIsCreateGuardaditoOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("drawer") === "guardadito") {
      setIsCreateGuardaditoOpen(true);
    }
  }, [searchParams]);

  const handleCloseDrawer = () => {
    setIsCreateGuardaditoOpen(false);
    // Remove query param without hard reload
    router.replace("/");
  };

  return (
    <>
      <main
        id="main-content"
        className="
          flex-1 overflow-y-auto
          w-full max-w-6xl mx-auto
          px-6 py-6 pb-[calc(72px+32px)] lg:pb-12
          flex flex-col gap-8
          [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
        "
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start w-full">
          <div className="lg:col-span-2 flex flex-col gap-8 w-full">
            <BalanceCard
              totalBalance={portfolio.balance}
              changePercent={portfolio.changePercent}
              isPositive={portfolio.isPositive}
            />
            <ActionButtons
              onAddExpense={() => router.push("/transaction?type=EXPENSE")}
              onAddIncome={() => router.push("/transaction?type=INCOME")}
            />
            <GuardaditosSection
              items={guardaditos}
              onCreateNew={() => setIsCreateGuardaditoOpen(true)}
            />
          </div>

          <div className="w-full">
            <RecentTransactions transactions={transactions} />
          </div>
        </div>
      </main>

      <CreateGuardaditoDrawer
        isOpen={isCreateGuardaditoOpen}
        onOpenChange={(open) => {
          if (!open) handleCloseDrawer();
          else setIsCreateGuardaditoOpen(true);
        }}
        walletBalance={portfolio.rawWalletBalance || 0}
      />
    </>
  );
}
