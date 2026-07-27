/**
 * 정적 내보내기 환경에서도 Node.js API 주소를 런타임에 변경할 수 있도록 합니다.
 * 배포 후 out/runtime-config.js의 API_URL만 수정하면 프론트엔드를 다시 빌드하지 않아도 됩니다.
 */
declare global {
  interface Window {
    __ZEROV_CONFIG__?: {
      API_URL?: string;
    };
  }
}

const BUILD_TIME_API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://palegoldenrod-gull-895963.hostingersite.com";

export function getApiBaseUrl(): string {
  const runtimeUrl =
    typeof window !== "undefined" ? window.__ZEROV_CONFIG__?.API_URL : undefined;

  return (runtimeUrl || BUILD_TIME_API_URL).replace(/\/+$/, "");
}

export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
}

/** localStorage의 JWT를 Authorization 헤더에 자동으로 추가합니다. */
export function getAuthHeaders(initialHeaders?: HeadersInit): Headers {
  const headers = new Headers(initialHeaders);

  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem("token");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  return headers;
}

/** 로그인 권한을 확인해야 하는 API 호출에 사용합니다. */
export function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(apiUrl(path), {
    ...init,
    headers: getAuthHeaders(init.headers),
  });
}

/** 화면 표시용 회원 레벨입니다. 실제 권한 판단은 반드시 백엔드에서 수행합니다. */
export function getStoredUserLevel(defaultLevel = 1): number {
  if (typeof window === "undefined") return defaultLevel;

  try {
    const rawUser = window.localStorage.getItem("user");
    if (!rawUser) return defaultLevel;

    const parsedUser = JSON.parse(rawUser);
    const level = Number(parsedUser?.level);
    return Number.isFinite(level) ? level : defaultLevel;
  } catch {
    return defaultLevel;
  }
}
