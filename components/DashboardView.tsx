"use client";

import React, { useState } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import BalanceCard from "./BalanceCard";
import ActionButtons from "./ActionButtons";
import GuardaditosSection, { type GuardaditoData } from "./GuardaditosSection";
import RecentTransactions from "./RecentTransactions";
import BottomNav from "./BottomNav";
import TransactionModal from "./TransactionModal";
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
  userName: string;
  avatarUrl?: string | null;
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
  userName,
  avatarUrl,
  portfolio,
  guardaditos,
  pockets,
  transactions,
  customCategories,
}: DashboardViewProps) {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: "EXPENSE" | "INCOME";
  }>({
    isOpen: false,
    type: "EXPENSE",
  });

  const [isCreateGuardaditoOpen, setIsCreateGuardaditoOpen] = useState(false);

  /**
   * Opens the transaction creation modal with the given default type.
   *
   * @param type - The transaction behavior classification.
   */
  const openModal = (type: "EXPENSE" | "INCOME") => {
    setModalState({ isOpen: true, type });
  };

  /**
   * Closes the transaction creation modal.
   */
  const closeModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen w-full bg-[var(--color-bg)]">
      <Sidebar onFabClick={() => openModal("EXPENSE")} />

      <div className="flex-1 flex flex-col min-h-screen">
        <TopBar userName={userName} avatarUrl={avatarUrl} />

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
                onAddExpense={() => openModal("EXPENSE")}
                onAddIncome={() => openModal("INCOME")}
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
      </div>

      <BottomNav
        onCreateAction={(action) => {
          if (action === "expense") openModal("EXPENSE");
          if (action === "income") openModal("INCOME");
          if (action === "guardadito") setIsCreateGuardaditoOpen(true);
        }}
      />

      <TransactionModal
        isOpen={modalState.isOpen}
        defaultType={modalState.type}
        guardaditos={guardaditos}
        pockets={pockets}
        customCategories={customCategories}
        onClose={closeModal}
        onSubmitAction={createTransaction}
        walletBalance={portfolio.rawWalletBalance || 0}
      />

      <CreateGuardaditoDrawer
        isOpen={isCreateGuardaditoOpen}
        onOpenChange={setIsCreateGuardaditoOpen}
        walletBalance={portfolio.rawWalletBalance || 0}
      />
    </div>
  );
}
