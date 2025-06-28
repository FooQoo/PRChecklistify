import { NextResponse } from 'next/server';
import { getSession } from 'src/lib/session';

export async function POST(request: Request) {
  const res = new NextResponse();
  const session = await getSession(request, res);
  await session.destroy();
  res.headers.set('Location', '/');
  res.status = 302;
  return res;
}
