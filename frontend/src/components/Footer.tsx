import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="py-6 text-center text-sm border-t mt-12 space-y-2">
      <p>© 2025 PR Checklistfy</p>
      <p>
        <Link href="https://github.com/FooQoo/PRChecklistify" className="underline">
          GitHub Repository
        </Link>
      </p>
      <p className="text-gray-500">Crafted by FooQoo</p>
    </footer>
  );
}
