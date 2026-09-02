import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cached: SupabaseClient | null = null;

/**
 * service role 키를 쓰는 서버 전용 클라이언트.
 * 이 모듈을 클라이언트 컴포넌트에서 import하면 키가 번들에 들어간다. 절대 금지.
 */
export function getDb(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY가 필요합니다.');
  }

  cached = createClient(url, key, { auth: { persistSession: false } });
  return cached;
}
