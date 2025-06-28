import { NextResponse } from 'next/server';
import { getSession } from 'src/lib/session';
import { baseUrl } from 'src/utils/env';

export async function POST() {
  const session = await getSession();
  await session.destroy();
  return NextResponse.redirect(`${baseUrl}/`, { status: 303 });
}
