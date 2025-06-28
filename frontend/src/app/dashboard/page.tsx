import Image from 'next/image';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getSession } from 'src/lib/session';

export default async function Dashboard() {
  const session = await getSession({ cookies: cookies() });

  if (!session.githubUser) {
    redirect('/');
  }

  const { githubUser } = session;
  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-4">Dashboard</h1>
      <div className="flex items-center gap-2">
        <Image src={githubUser!.avatar_url} alt="avatar" width={40} height={40} className="rounded-full" />
        <div>
          <p className="font-medium">{githubUser!.name}</p>
          <p className="text-sm text-gray-600">{githubUser!.login}</p>
        </div>
      </div>
    </div>
  );
}
