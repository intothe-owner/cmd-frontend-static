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

const BUILD_TIME_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export function getApiBaseUrl(): string {
  const runtimeUrl =
    typeof window !== "undefined" ? window.__ZEROV_CONFIG__?.API_URL : undefined;

  return (runtimeUrl || BUILD_TIME_API_URL).replace(/\/+$/, "");
}

export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
}
