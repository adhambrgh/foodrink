import { createAdminClient } from '@/lib/supabase/server-admin';

export type AuditAction =
  | 'login'
  | 'logout'
  | 'create'
  | 'update'
  | 'delete'
  | 'upload'
  | 'status_change'
  | 'send_notification';

export type AuditResource =
  | 'menu'
  | 'category'
  | 'banner'
  | 'qris'
  | 'order'
  | 'notification'
  | 'auth';

export interface AuditLogInput {
  adminId: string;
  action: AuditAction;
  resourceType: AuditResource;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAudit(input: AuditLogInput): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('admin_audit_logs')
    .insert({
      admin_id: input.adminId,
      action: input.action,
      resource_type: input.resourceType,
      resource_id: input.resourceId || null,
      details: input.details || {},
      ip_address: input.ipAddress || null,
      user_agent: input.userAgent || null,
    });

  if (error) {
    console.error('Audit log error:', error);
    // Don't throw - audit logging should not break main flow
  }
}

// Helper to extract IP from request
export function getClientIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
}

// Helper to extract User-Agent
export function getUserAgent(request: Request): string {
  return request.headers.get('user-agent') || 'unknown';
}