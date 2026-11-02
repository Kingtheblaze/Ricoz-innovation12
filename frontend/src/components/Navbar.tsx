'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  FileText, 
  PlusCircle, 
  Globe2, 
  ShieldCheck, 
  LogOut, 
  Building2, 
  UserCheck 
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { user, organization, logout } = useAuth();

  if (!user) return null;

  const navLinks = [
    { name: 'Dashboard', href: '/dashboard', icon: FileText },
    { name: 'Generate Contract', href: '/generate', icon: PlusCircle },
    { name: 'Rule Matrices', href: '/jurisdictions', icon: Globe2 },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <Link href="/dashboard" className="text-xl font-bold tracking-tight text-slate-900">
                Juris<span className="text-sky-600">Flow</span>
              </Link>
              <span className="hidden md:inline-block ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                SaaS Localizer
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="hidden md:flex space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-sky-50 text-sky-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-sky-600' : 'text-slate-400'}`} />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Tenant & Profile */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-slate-800">{organization?.name || 'Company'}</span>
              <span className="text-slate-300">|</span>
              <span className="capitalize text-sky-600 font-medium">{user.role}</span>
            </div>

            <div className="flex items-center space-x-3 border-l border-slate-200 pl-4">
              <div className="flex flex-col text-right">
                <span className="text-sm font-medium text-slate-800">{user.fullName}</span>
                <span className="text-xs text-slate-500">{user.email}</span>
              </div>
              <button
                onClick={logout}
                title="Logout"
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
