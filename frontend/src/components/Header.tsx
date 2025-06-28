import Link from 'next/link';
import Logo from './Logo';

export default function Header() {
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
        </ul>
      </nav>
    </header>
  );
}
