import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

export interface SessionData {
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

export async function getSession() {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  return session;
}
