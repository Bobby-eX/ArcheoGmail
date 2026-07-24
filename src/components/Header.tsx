import React from 'react';
import { User } from 'firebase/auth';
import { Mail, LogOut, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
  onSignIn: () => void;
  isLoggingIn: boolean;
  onVerifyPermissions?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onLogout,
  onSignIn,
  isLoggingIn,
  onVerifyPermissions,
}) => {
  return (
    <header className="bg-[#FDFCFB] border-b border-[#E5E5E1] text-[#1A1A1A] sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Logo & Editorial Title */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#1A1A1A] text-white flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-serif italic text-2xl sm:text-3xl tracking-tight text-[#1A1A1A] leading-tight">
              Archiwum Gmail
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold">
              Zarządzanie Pocztą według Daty & Załączników
            </p>
          </div>
        </div>

        {/* User Auth Section */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3 bg-white border border-[#E5E5E1] pl-3 pr-2 py-1.5 rounded-sm">
              <div className="flex items-center gap-2">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Użytkownik'}
                    className="w-7 h-7 rounded-full object-cover border border-[#E5E5E1]"
                  />
                ) : (
                  <div className="w-7 h-7 bg-[#1A1A1A] text-white flex items-center justify-center font-bold text-xs">
                    {(user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="hidden md:block text-left text-xs">
                  <p className="font-medium text-[#1A1A1A] truncate max-w-[160px]">
                    {user.displayName || user.email}
                  </p>
                  <p className="text-[10px] text-emerald-600 font-medium truncate max-w-[160px] flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" /> Połączono
                  </p>
                </div>
              </div>

              {onVerifyPermissions && (
                <button
                  onClick={onVerifyPermissions}
                  title="Zweryfikuj uprawnienia do usuwania e-maili"
                  className="px-2 py-1 bg-[#F9F8F6] hover:bg-neutral-200 border border-[#E5E5E1] text-[10px] font-mono font-bold uppercase text-neutral-700 transition-colors hidden sm:flex items-center gap-1"
                >
                  <ShieldCheck className="w-3 h-3 text-neutral-600" /> Uprawnienia
                </button>
              )}

              <button
                onClick={onLogout}
                title="Wyloguj się"
                className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-[#F9F8F6] transition-colors ml-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onSignIn}
              disabled={isLoggingIn}
              className="px-5 py-2.5 bg-[#1A1A1A] text-white text-[10px] uppercase tracking-widest font-bold hover:bg-neutral-800 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              {isLoggingIn ? 'Łączenie...' : 'Zaloguj przez Google'}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

