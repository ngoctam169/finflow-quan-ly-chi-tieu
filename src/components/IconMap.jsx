import React from 'react';
import {
  Utensils,
  Coffee,
  Car,
  Home,
  ShoppingBag,
  Gamepad2,
  HeartPulse,
  GraduationCap,
  Users,
  TrendingUp,
  Briefcase,
  Laptop,
  Sparkles,
  Gift,
  Landmark,
  Smartphone,
  Wallet,
  PiggyBank,
  ShieldCheck,
  Plane,
  Target,
  Tag,
  CreditCard,
  CircleDollarSign
} from 'lucide-react';

const ICON_COMPONENTS = {
  Utensils,
  Coffee,
  Car,
  Home,
  ShoppingBag,
  Gamepad2,
  HeartPulse,
  GraduationCap,
  Users,
  TrendingUp,
  Briefcase,
  Laptop,
  Sparkles,
  Gift,
  Landmark,
  Smartphone,
  Wallet,
  PiggyBank,
  ShieldCheck,
  Plane,
  Target,
  Tag,
  CreditCard,
  CircleDollarSign
};

export function DynamicIcon({ name, className = 'w-5 h-5', style }) {
  const Comp = ICON_COMPONENTS[name] || CircleDollarSign;
  return <Comp className={className} style={style} />;
}
