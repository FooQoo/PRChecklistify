'use client';
import Link from 'next/link';
import Image from 'next/image';
import Logo from './Logo';
import { useState, useRef, useEffect } from 'react';

interface User {
  login: string;
  name: string;
  avatar_url: string;
}

interface HeaderProps {
  user?: User;
}

const Header: React.FC<HeaderProps> = ({ user }) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // ドロップダウン外クリックで閉じる
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <header className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-2">
        <Logo />
        <span className="text-lg font-semibold">PR Checklistfy</span>
      </div>
      <nav>
        <ul className="flex gap-4 text-sm text-gray-600 items-center">
          <li>
            <Link href="#" className="hover:text-gray-900">
              機能
            </Link>
          </li>
          <li>
            <Link href="#" className="hover:text-gray-900">
              使い方
            </Link>
          </li>
          <li>
            <Link href="https://github.com/FooQoo/PRChecklistify" className="hover:text-gray-900">
              GitHub
            </Link>
          </li>
          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                className="flex items-center focus:outline-none"
                onClick={() => setOpen(v => !v)}
                aria-label="ユーザー設定">
                <Image src={user.avatar_url} alt="avatar" width={32} height={32} className="rounded-full border" />
              </button>
              {open && (
                <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow-lg z-50 animate-fadeInUp">
                  <div className="px-4 py-2 border-b">
                    <div className="font-medium text-sm">{user.name}</div>
                    <div className="text-xs text-gray-500">{user.login}</div>
                  </div>
                  <form action="/api/auth/logout" method="post">
                    <button type="submit" className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600 text-sm">
                      ログアウト
                    </button>
                  </form>
                </div>
              )}
            </div>
          ) : (
            <li>
              <Link href="/api/auth/login-start" className="hover:text-gray-900">
                Login
              </Link>
            </li>
          )}
        </ul>
      </nav>
    </header>
  );
};

export default Header;
