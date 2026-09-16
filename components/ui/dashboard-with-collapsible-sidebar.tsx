"use client";

import { signOutAction } from "@/app/actions/auth";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  BarChart3,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  SlidersHorizontal,
  Sun,
  WalletCards,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

interface DashboardWithCollapsibleSidebarProps {
  children: ReactNode;
  periodLabel: string;
  transactionCount?: number;
  userEmail: string;
}

interface NavigationItem {
  href: string;
  icon: LucideIcon;
  label: string;
  badge?: number;
}

const THEME_STORAGE_KEY = "finance-dashboard-theme";

export function DashboardWithCollapsibleSidebar({
  children,
  periodLabel,
  transactionCount,
  userEmail,
}: DashboardWithCollapsibleSidebarProps) {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [selected, setSelected] = useState("Visão geral");
  const mobileMenuTriggerRef = useRef<HTMLButtonElement>(null);

  const navigationItems: NavigationItem[] = [
    { href: "#visao-geral", icon: LayoutDashboard, label: "Visão geral" },
    { href: "#filtros", icon: SlidersHorizontal, label: "Filtros" },
    { href: "#analises", icon: BarChart3, label: "Análises" },
    { href: "#parcelamentos", icon: CreditCard, label: "Parcelamentos" },
    {
      href: "#movimentacoes",
      icon: ArrowLeftRight,
      label: "Movimentações",
      badge: transactionCount,
    },
  ];

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    const shouldUseDarkTheme =
      storedTheme === "dark" ||
      (storedTheme === null && window.matchMedia("(prefers-color-scheme: dark)").matches);

    setIsDark(shouldUseDarkTheme);
    applyTheme(shouldUseDarkTheme);
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setIsMobileMenuOpen(false);
      window.requestAnimationFrame(() => mobileMenuTriggerRef.current?.focus());
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isMobileMenuOpen]);

  const toggleTheme = () => {
    setIsDark((currentTheme) => {
      const nextTheme = !currentTheme;
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme ? "dark" : "light");
      applyTheme(nextTheme);
      return nextTheme;
    });
  };

  const selectNavigationItem = (label: string) => {
    setSelected(label);
    setIsMobileMenuOpen(false);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    window.requestAnimationFrame(() => mobileMenuTriggerRef.current?.focus());
  };

  return (
    <div className="flex min-h-[100dvh] w-full max-w-full overflow-x-clip bg-stone-50 text-ink transition-colors dark:bg-stone-950 dark:text-stone-100">
      <aside
        className={`sticky top-0 hidden h-[100dvh] shrink-0 border-r border-stone-200 bg-white transition-[width,background-color,border-color] duration-300 dark:border-stone-800 dark:bg-stone-900 lg:flex lg:flex-col ${
          isSidebarExpanded ? "w-64" : "w-[4.5rem]"
        }`}
        onMouseEnter={() => setIsSidebarExpanded(true)}
        onMouseLeave={() => setIsSidebarExpanded(false)}
        onFocusCapture={() => setIsSidebarExpanded(true)}
        onBlurCapture={(event) => {
          if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) {
            setIsSidebarExpanded(false);
          }
        }}
      >
        <SidebarContent
          isOpen={isSidebarExpanded}
          items={navigationItems}
          selected={selected}
          onSelect={selectNavigationItem}
          userEmail={userEmail}
        />
      </aside>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-stone-950/45 backdrop-blur-[2px]"
            onClick={closeMobileMenu}
            aria-label="Fechar menu"
          />
          <aside role="dialog" aria-modal="true" aria-label="Menu de navegação" className="mobile-drawer relative flex h-[100dvh] w-[min(19rem,86vw)] flex-col border-r border-stone-200 bg-white shadow-2xl dark:border-stone-800 dark:bg-stone-900">
            <button
              type="button"
              className="pressable absolute right-3 top-[max(0.75rem,env(safe-area-inset-top,0px))] z-10 grid size-10 place-items-center rounded-xl text-stone-500 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800"
              onClick={closeMobileMenu}
              aria-label="Fechar menu"
              autoFocus
            >
              <X className="size-5" />
            </button>
            <SidebarContent
              isOpen
              items={navigationItems}
              selected={selected}
              onSelect={selectNavigationItem}
              userEmail={userEmail}
            />
          </aside>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <header className="dashboard-topbar sticky top-0 z-30 border-b border-stone-200/80 bg-white/90 px-4 py-3 backdrop-blur-xl dark:border-stone-800 dark:bg-stone-950/90 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                ref={mobileMenuTriggerRef}
                className="pressable grid size-10 shrink-0 place-items-center rounded-xl border border-stone-200 bg-white text-stone-600 shadow-sm hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800 lg:hidden"
                onClick={() => setIsMobileMenuOpen(true)}
                aria-expanded={isMobileMenuOpen}
                aria-label="Abrir menu"
              >
                <Menu className="size-5" />
              </button>
              <div className="min-w-0">
                <h1 className="truncate text-lg font-bold tracking-[-0.025em] text-ink dark:text-stone-100 sm:text-xl">
                  Dashboard financeiro
                </h1>
                <p className="truncate text-xs font-medium capitalize text-stone-500">{periodLabel}</p>
              </div>
            </div>

            <button
              type="button"
              className="pressable grid size-10 shrink-0 place-items-center rounded-xl border border-stone-200 bg-white text-stone-600 shadow-sm hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800"
              onClick={toggleTheme}
              aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
            >
              {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
          </div>
        </header>

        <main className="dashboard-shell min-w-0 max-w-full">
          <div className="mx-auto min-w-0 max-w-[1440px]">{children}</div>
        </main>
      </div>
    </div>
  );
}

function SidebarContent({
  isOpen,
  items,
  selected,
  onSelect,
  userEmail,
}: {
  isOpen: boolean;
  items: NavigationItem[];
  selected: string;
  onSelect: (label: string) => void;
  userEmail: string;
}) {
  return (
    <>
      <div className="sidebar-safe-top flex h-20 items-center border-b border-stone-100 px-3 dark:border-stone-800">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-white shadow-[0_8px_20px_rgba(37,99,235,0.2)]">
          <WalletCards className="size-5" />
        </div>
        {isOpen && (
          <div className="ml-3 min-w-0">
            <p className="truncate text-sm font-bold text-ink dark:text-stone-100">Finanças do casal</p>
            <p className="truncate text-xs text-stone-500">Controle compartilhado</p>
          </div>
        )}
      </div>

      <nav aria-label="Navegação do dashboard" className="sidebar-scroll min-h-0 flex-1 space-y-1 overflow-y-auto p-2.5">
        {items.map((item) => {
          const Icon = item.icon;
          const isSelected = selected === item.label;

          return (
            <a
              key={item.label}
              href={item.href}
              className={`pressable relative flex h-11 items-center rounded-xl border transition-colors ${
                isSelected
                  ? "border-primary/15 bg-primary/10 text-primary dark:border-blue-300/20 dark:bg-blue-400/10 dark:text-blue-200"
                  : "border-transparent text-stone-600 hover:bg-stone-100 hover:text-ink dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
              }`}
              onClick={() => onSelect(item.label)}
              aria-current={isSelected ? "location" : undefined}
              title={isOpen ? undefined : item.label}
            >
              <span className="grid w-12 shrink-0 place-items-center">
                <Icon className="size-[18px]" />
              </span>
              {isOpen && <span className="truncate pr-9 text-sm font-semibold">{item.label}</span>}
              {isOpen && item.badge !== undefined && item.badge > 0 && (
                <span className="absolute right-3 rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold tabular-nums text-white">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </a>
          );
        })}
      </nav>

      <div className="border-t border-stone-100 p-2.5 dark:border-stone-800">
        <form action={signOutAction}>
          <button
            type="submit"
            className="pressable flex h-11 w-full items-center rounded-xl border border-transparent text-stone-600 hover:bg-stone-100 hover:text-ink dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
            title={isOpen ? undefined : "Sair"}
            aria-label={isOpen ? undefined : "Sair"}
          >
            <span className="grid w-12 shrink-0 place-items-center">
              <LogOut className="size-[18px]" aria-hidden="true" />
            </span>
            {isOpen && (
              <span className="min-w-0 text-left">
                <span className="block text-sm font-semibold">Sair</span>
                <span className="block max-w-40 truncate text-[11px] text-stone-400">{userEmail}</span>
              </span>
            )}
          </button>
        </form>
      </div>
    </>
  );
}

function applyTheme(isDark: boolean) {
  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.style.colorScheme = isDark ? "dark" : "light";
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
    meta.content = isDark ? "#0c0a09" : "#f4f6f3";
  });
}

export const Example = DashboardWithCollapsibleSidebar;
export default DashboardWithCollapsibleSidebar;
