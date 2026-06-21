"use client";

import { useBreadcrumbs } from "@/lib/BreadcrumbContext";
import TopBar from "./TopBar";

type TopBarWrapperProps = {
  userName: string;
  avatarUrl: string | null;
};

export default function TopBarWrapper({ userName, avatarUrl }: TopBarWrapperProps) {
  const { options } = useBreadcrumbs();

  return (
    <TopBar
      userName={userName}
      avatarUrl={avatarUrl}
      breadcrumbOptions={options || undefined}
    />
  );
}
