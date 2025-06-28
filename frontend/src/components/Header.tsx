import Link from 'next/link';
import Image from 'next/image';
import { cookies } from 'next/headers';
import { getSession } from 'src/lib/session';
import Logo from './Logo';

export default async function Header() {
  const session = await getSession({ cookies: cookies() });
  const user = session.githubUser;
  return (
    <header className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-2">
        <Logo />
        <span className="text-lg font-semibold">PR Checklistfy</span>
      </div>
      <nav>
        <ul className="flex gap-4 text-sm text-gray-600">
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
            <li className="flex items-center gap-2">
              <Image src={user.avatar_url} alt="avatar" width={24} height={24} className="rounded-full" />
              <form action="/api/auth/logout" method="post">
                <button className="hover:text-gray-900" type="submit">
                  Logout
                </button>
              </form>
            </li>
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
}
