"use client";

import { SESSION_HOURS } from "./config";
import { getSupabase } from "./supabase";

const SESSION_KEY = "onsum.session";

export interface Session {
  name: string;
  /** 만료 시각(밀리초). 이 시각이 지나면 다시 입장해야 합니다. */
  expiresAt: number;
}

export function saveSession(name: string): void {
  const session: Session = {
    name,
    expiresAt: Date.now() + SESSION_HOURS * 60 * 60 * 1000,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as Session;
    if (!session?.name || session.expiresAt < Date.now()) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export interface EnterResult {
  ok: boolean;
  message?: string;
}

/**
 * 인증코드 확인 + 입장 기록.
 *
 * 인증코드는 브라우저가 아니라 **Supabase 안에** 있습니다.
 * `enter_platform` 함수가 코드를 대조하고, 맞으면 access_logs 에 이름을 남긴 뒤
 * true 를 돌려줍니다. 그래서 웹사이트 소스를 뜯어봐도 코드 값은 나오지 않고,
 * 코드를 바꿀 때 사이트를 다시 배포할 필요도 없습니다.
 */
export async function enterPlatform(
  code: string,
  name: string,
): Promise<EnterResult> {
  const trimmedName = name.trim();

  if (!code.trim()) return { ok: false, message: "인증 코드를 입력해 주세요." };
  if (!trimmedName) return { ok: false, message: "실명을 입력해 주세요." };
  if (trimmedName.length < 2 || trimmedName.length > 20) {
    return { ok: false, message: "실명은 2~20자로 입력해 주세요." };
  }

  const supabase = getSupabase();
  if (!supabase) {
    return {
      ok: false,
      message: "인증 서버 설정이 없습니다. 관리자에게 문의해 주세요.",
    };
  }

  const { data, error } = await supabase.rpc("enter_platform", {
    p_code: code.trim(),
    p_name: trimmedName,
  });

  if (error) {
    // PGRST202 = 함수를 찾을 수 없음 → supabase/schema.sql 을 아직 실행하지 않은 상태
    if (error.code === "PGRST202") {
      return {
        ok: false,
        message: "인증 시스템이 아직 준비되지 않았습니다. 관리자에게 문의해 주세요.",
      };
    }
    return {
      ok: false,
      message: "일시적인 오류로 입장하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    };
  }

  if (data !== true) {
    return { ok: false, message: "인증 코드가 올바르지 않습니다." };
  }

  saveSession(trimmedName);
  return { ok: true };
}
