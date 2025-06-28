import { NextResponse } from 'next/server';
import { AuthorizationCode } from 'simple-oauth2';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { baseUrl } from 'src/utils/env';
interface SessionData {
  accessToken?: string;
  githubUser?: {
    login: string;
    name: string;
    avatar_url: string;
  };
}

const client = new AuthorizationCode({
  client: {
    id: process.env.GITHUB_CLIENT_ID!,
    secret: process.env.GITHUB_CLIENT_SECRET!,
  },
  auth: {
    tokenHost: 'https://github.com',
    tokenPath: '/login/oauth/access_token',
  },
});

// iron-sessionのオプション
const sessionOptions = {
  password: process.env.IRON_SESSION_PASSWORD!,
  cookieName: 'prchecklistify_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  if (!code) {
    return NextResponse.redirect('/');
  }

  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

  try {
    const tokenParams = {
      code,
      redirect_uri: process.env.GITHUB_REDIRECT_URI!,
    };
    const accessToken = await client.getToken(tokenParams);
    const token = accessToken.token.access_token as string;

    const userRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const user = await userRes.json();

    session.accessToken = token;
    session.githubUser = {
      login: user.login,
      name: user.name,
      avatar_url: user.avatar_url,
    };
    await session.save();
    return NextResponse.redirect(`${baseUrl}/`);
  } catch (e) {
    console.error(e);
    return NextResponse.redirect(`${baseUrl}/`);
  }
}
