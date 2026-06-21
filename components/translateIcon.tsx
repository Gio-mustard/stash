import React from "react";
import {
  Home,
  Wallet,
  TrendingUp,
  User,
  Plus,
  Minus,
  Bell,
  Plane,
  Car,
  ShieldAlert,
  ShoppingBag,
  Coins,
  Utensils,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Settings,
  Briefcase,
  PiggyBank,
  ChevronRight,
  Camera,
  Lock,
  HelpCircle,
  CalendarDays,
  StickyNote,
  Banknote,
} from "lucide-react";

export const ICON_MAP = {
  home: Home,
  wallet: Wallet,
  analytics: TrendingUp,
  profile: User,
  plus: Plus,
  minus: Minus,
  bell: Bell,
  plane: Plane,
  car: Car,
  emergency: ShieldAlert,
  shopping: ShoppingBag,
  dividend: Coins,
  dining: Utensils,
  arrowUpRight: ArrowUpRight,
  arrowDownRight: ArrowDownRight,
  creditCard: CreditCard,
  settings: Settings,
  briefcase: Briefcase,
  piggybank: PiggyBank,
  chevronRight: ChevronRight,
  camera: Camera,
  lock: Lock,
  helpCircle: HelpCircle,
  calendar: CalendarDays,
  stickyNote: StickyNote,
  banknote: Banknote,
} as const;

export type IconKey = keyof typeof ICON_MAP;

interface TranslateIconProps extends React.ComponentPropsWithoutRef<"svg"> {
  iconKey: IconKey | string;
  size?: number | string;
}

export default function TranslateIcon({
  iconKey,
  size = 24,
  className,
  ...props
}: TranslateIconProps) {
  const IconComponent = ICON_MAP[iconKey as IconKey] || PiggyBank; // Fallback to piggybank if key is not found
  return <IconComponent size={size} className={className} {...props} />;
}
