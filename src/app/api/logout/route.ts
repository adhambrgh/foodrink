import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logAudit, getClientIp, getUserAgent } from '@/lib/audit-log';

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const ip = getClientIp(request);
  const userAgent = getUserAgent(request);

  // Log logout if admin
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role === 'admin') {
      await logAudit({
        adminId: user.id,
        action: 'logout',
        resourceType: 'auth',
        details: { success: true },
        ipAddress: ip,
        userAgent,
      });
    }
  }

  await supabase.auth.signOut();

  return NextResponse.json({ success: true });
}