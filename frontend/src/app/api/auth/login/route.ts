import { NextResponse } from 'next/server';
import { AuthorizationCode } from 'simple-oauth2';
import { getSession } from 'src/lib/session';

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

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  if (!code) {
    return NextResponse.redirect('/');
  }

  const res = new NextResponse();
  const session = await getSession(request, res);

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
    res.headers.set('Location', '/dashboard');
    res.status = 302;
    return res;
  } catch (e) {
    console.error(e);
    res.headers.set('Location', '/');
    res.status = 302;
    return res;
  }
}
