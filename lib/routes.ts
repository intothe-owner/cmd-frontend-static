const STATIC_ROUTES = new Set([
  "/",
  "/login",
  "/register",
  "/setup",
  "/page",
  "/boards",
  "/boards/write",
  "/boards/post",
  "/boards/edit",
  "/popup-view",
  "/admin/dashboard",
  "/admin/settings",
  "/admin/members/settings",
  "/admin/member",
  "/admin/menus",
  "/admin/pages",
  "/admin/boards",
  "/admin/popup",
  "/mypage",
]);

function withTrailingSlash(path: string): string {
  if (path === "/" || path.includes("?") || path.includes("#")) return path;
  return path.endsWith("/") ? path : `${path}/`;
}

/**
 * 기존 CMS가 저장한 동적 URL을 정적 export에서 사용할 수 있는 쿼리 기반 URL로 변환합니다.
 */
export function toStaticHref(rawUrl?: string | null): string {
  if (!rawUrl || rawUrl === "#") return rawUrl || "#";
  if (/^(https?:|mailto:|tel:|javascript:)/i.test(rawUrl)) return rawUrl;

  const [pathPart, hash = ""] = rawUrl.split("#", 2);
  const [pathnameRaw, query = ""] = pathPart.split("?", 2);
  const withLeadingSlash = pathnameRaw.startsWith("/") ? pathnameRaw : `/${pathnameRaw}`;
  const pathname = withLeadingSlash === "/" ? "/" : withLeadingSlash.replace(/\/+$/, "");

  if (STATIC_ROUTES.has(pathname) || pathname.startsWith("/admin/")) {
    const staticPath = withTrailingSlash(pathname);
    return `${staticPath}${query ? `?${query}` : ""}${hash ? `#${hash}` : ""}`;
  }

  let match = pathname.match(/^\/boards\/([^/]+)\/([^/]+)\/edit\/?$/);
  if (match) {
    return `/boards/edit/?boardId=${encodeURIComponent(match[1])}&postId=${encodeURIComponent(match[2])}`;
  }

  match = pathname.match(/^\/boards\/([^/]+)\/write\/?$/);
  if (match) {
    return `/boards/write/?boardId=${encodeURIComponent(match[1])}`;
  }

  match = pathname.match(/^\/boards\/([^/]+)\/([^/]+)\/?$/);
  if (match) {
    return `/boards/post/?boardId=${encodeURIComponent(match[1])}&postId=${encodeURIComponent(match[2])}`;
  }

  match = pathname.match(/^\/boards\/([^/]+)\/?$/);
  if (match) {
    return `/boards/?boardId=${encodeURIComponent(match[1])}`;
  }

  match = pathname.match(/^\/popup-view\/([^/]+)\/?$/);
  if (match) {
    return `/popup-view/?id=${encodeURIComponent(match[1])}`;
  }

  const pageId = pathname.replace(/^\/+|\/+$/g, "");
  if (!pageId) return "/";
  return `/page/?id=${encodeURIComponent(pageId)}${hash ? `#${hash}` : ""}`;
}

export function boardListHref(boardId: string | number): string {
  return `/boards/?boardId=${encodeURIComponent(String(boardId))}`;
}

export function boardWriteHref(boardId: string | number): string {
  return `/boards/write/?boardId=${encodeURIComponent(String(boardId))}`;
}

export function boardPostHref(boardId: string | number, postId: string | number): string {
  return `/boards/post/?boardId=${encodeURIComponent(String(boardId))}&postId=${encodeURIComponent(String(postId))}`;
}

export function boardEditHref(boardId: string | number, postId: string | number): string {
  return `/boards/edit/?boardId=${encodeURIComponent(String(boardId))}&postId=${encodeURIComponent(String(postId))}`;
}
