"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase 클라이언트 (브라우저에서 직접 호출).
 *
 * 여기 쓰이는 키는 공개용(publishable/anon) 키라 웹사이트 소스에 노출되는 것이 정상입니다.
 * 실제 보호는 키가 아니라 데이터베이스의 RLS 정책과 enter_platform() 함수가 담당합니다.
 * ⚠️ secret(service_role) 키는 절대 이 파일이나 프런트엔드에 넣지 마세요.
 */
let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  client = createClient(url, key, {
    // 지금은 구글 로그인 등을 쓰지 않으므로 로그인 세션을 보관하지 않습니다.
    // 구글 로그인을 붙이는 시점에 persistSession: true 로 바꿉니다.
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
