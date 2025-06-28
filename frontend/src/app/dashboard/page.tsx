import Image from 'next/image';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';

interface SessionData {
  accessToken?: string;
  githubUser?: {
    login: string;
    name: string;
    avatar_url: string;
  };
}

const sessionOptions = {
  password: process.env.IRON_SESSION_PASSWORD!,
  cookieName: 'prchecklistify_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
};

export default async function Dashboard() {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

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
