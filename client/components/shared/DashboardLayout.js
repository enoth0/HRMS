"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getUser, logout } from "../../lib/auth.js";
import clsx from "clsx";

const NAV_LINKS = {
  admin: [
    { href: "/dashboard/admin", label: "Dashboard", icon: "🏠" },
    { href: "/employees", label: "Employees", icon: "👥" },
    { href: "/attendance", label: "Attendance", icon: "📅" },
    { href: "/payroll", label: "Payroll", icon: "💰" },
    { href: "/performance", label: "Performance", icon: "📊" },
    { href: "/recruitment", label: "Recruitment", icon: "🎯" },
  ],
  hr_recruiter: [
    { href: "/dashboard/hr", label: "Dashboard", icon: "🏠" },
    { href: "/employees", label: "Employees", icon: "👥" },
    { href: "/attendance", label: "Attendance", icon: "📅" },
    { href: "/payroll", label: "Payroll", icon: "💰" },
    { href: "/recruitment", label: "Recruitment", icon: "🎯" },
  ],
  senior_manager: [
    { href: "/dashboard/senior-manager", label: "Dashboard", icon: "🏠" },
    { href: "/employees", label: "Team", icon: "👥" },
    { href: "/performance", label: "Performance", icon: "📊" },
    { href: "/attendance", label: "Attendance", icon: "📅" },
  ],
  employee: [
    { href: "/dashboard/employee", label: "Dashboard", icon: "🏠" },
    { href: "/attendance", label: "My Attendance", icon: "📅" },
    { href: "/payroll", label: "My Payslips", icon: "💰" },
    { href: "/performance", label: "My Reviews", icon: "📊" },
  ],
};

const ROLE_LABELS = {
  admin: "Administrator",
  hr_recruiter: "HR Recruiter",
  senior_manager: "Senior Manager",
  employee: "Employee",
};

const ROLE_COLORS = {
  admin: "bg-red-100 text-red-700",
  hr_recruiter: "bg-purple-100 text-purple-700",
  senior_manager: "bg-blue-100 text-blue-700",
  employee: "bg-green-100 text-green-700",
};

export default function DashboardLayout({ children }) {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const u = getUser();
    if (!u) router.push("/login");
    else setUser(u);
  }, []);

  if (!user) return null;

  const links = NAV_LINKS[user.role] || NAV_LINKS.employee;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">HR</span>
          </div>
          <span className="font-semibold text-gray-900">HRMS Portal</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setSidebarOpen(false)}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                pathname === link.href
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <span className="text-base">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </nav>

        {/* User card */}
        <div className="px-4 py-4 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=3b82f6&color=fff&size=32`}
              alt={user.name}
              className="w-8 h-8 rounded-full"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
              <span className={clsx("badge text-xs", ROLE_COLORS[user.role])}>
                {ROLE_LABELS[user.role]}
              </span>
            </div>
            <button
              onClick={logout}
              className="text-gray-400 hover:text-red-500 transition-colors"
              title="Logout"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top navbar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
          <button
            className="lg:hidden text-gray-500 hover:text-gray-700"
            onClick={() => setSidebarOpen(true)}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <h1 className="text-lg font-semibold text-gray-900 hidden lg:block">
            {links.find((l) => l.href === pathname)?.label || "HRMS"}
          </h1>

          <div className="flex items-center gap-4 ml-auto">
            {/* Notifications bell */}
            <button className="relative text-gray-500 hover:text-gray-700">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=3b82f6&color=fff&size=32`}
              alt={user.name}
              className="w-8 h-8 rounded-full cursor-pointer"
            />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
