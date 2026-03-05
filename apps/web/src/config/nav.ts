import {
  LayoutDashboard,
  BookOpen,
  CheckSquare,
  Calendar,
  PenSquare,
  Link2,
  BarChart3,
  Bug,
} from "lucide-react";
import type { ComponentType } from "react";

export interface NavItem {
  href: string;
  icon: ComponentType<{
    size?: string | number;
    className?: string;
    strokeWidth?: string | number;
  }>;
  label: string;
}

export const navItems: NavItem[] = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/subjects", icon: BookOpen, label: "UC" },
  { href: "/tasks", icon: CheckSquare, label: "Tareas" },
  { href: "/planner", icon: Calendar, label: "Planner" },
  { href: "/journal", icon: PenSquare, label: "Práctica" },
  { href: "/schoology", icon: Link2, label: "Schoology" },
  { href: "/analytics", icon: BarChart3, label: "Analíticas" },
  { href: "/feedback", icon: Bug, label: "Reportar Bug" },
];
