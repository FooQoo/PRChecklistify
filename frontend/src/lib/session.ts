import type { SessionOptions } from 'iron-session';
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

export const sessionOptions: SessionOptions = {
  password: process.env.IRON_SESSION_PASSWORD as string,
  cookieName: 'prchecklistify-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
};
export async function getSession() {
  return await getIronSession<SessionData>(await cookies(), sessionOptions);
}
