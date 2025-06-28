import type { IronSessionOptions } from 'iron-session';
import { getIronSession } from 'iron-session';

export interface SessionData {
  accessToken?: string;
  githubUser?: {
    login: string;
    name: string;
    avatar_url: string;
  };
}

export const sessionOptions: IronSessionOptions = {
  password: process.env.IRON_SESSION_PASSWORD as string,
  cookieName: 'prchecklistify-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSession(request: Request | { cookies: any }, response?: Response) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return getIronSession<SessionData>(request as any, response as any, sessionOptions);
}
