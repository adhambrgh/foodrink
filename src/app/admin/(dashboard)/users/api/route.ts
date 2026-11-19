import { NextRequest, NextResponse } from 'next/server';
import { getAllUsersAdmin } from '../actions';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') as any;
    const role = searchParams.get('role') as any;
    const threshold = searchParams.get('threshold');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    let activeThreshold: number | 'all' = 7;
    if (threshold === 'all') {
      activeThreshold = 'all';
    } else if (threshold) {
      const parsed = parseInt(threshold);
      if (!isNaN(parsed)) activeThreshold = parsed;
    }

    const result = await getAllUsersAdmin({
      search,
      status,
      role,
      activeThreshold,
      page,
      pageSize,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Users API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', users: [], total: 0, page: 1, pageSize: 20, stats: null },
      { status: 500 }
    );
  }
}