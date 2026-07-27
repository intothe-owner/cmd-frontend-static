"use client";

import { useEffect, useState } from "react";
import BoardListClient from "./BoardListClient";
import { apiFetch } from "@/lib/api";

export default function BoardListPage() {
  const [boardId, setBoardId] = useState("");
  const [boardConfig, setBoardConfig] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [viewerLevel, setViewerLevel] = useState(1);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("boardId") || "";
    setBoardId(id);
    if (!id) {
      setIsLoading(false);
      return;
    }

    const load = async () => {
      try {
        const configRes = await apiFetch(`/api/board-configs/${encodeURIComponent(id)}`);
        const configJson = await configRes.json().catch(() => ({}));
        if (!configRes.ok || !configJson.success || !configJson.data) {
          setErrorMessage(configJson.message || "게시판 설정을 찾을 수 없습니다.");
          return;
        }

        const config = configJson.data;
        setBoardConfig(config);

        const postRes = await apiFetch(
          `/api/boards/${encodeURIComponent(id)}/posts?page=1&limit=${config.listCount || 10}`
        );
        const postJson = await postRes.json().catch(() => ({}));

        if (!postRes.ok || !postJson.success) {
          setErrorMessage(postJson.message || "게시판을 불러올 권한이 없습니다.");
          return;
        }

        setPosts(postJson.data || []);
        setTotalPages(postJson.totalPages || 1);
        setViewerLevel(Number(postJson.viewer?.level || 1));
      } catch (error) {
        console.error("게시판 로딩 실패:", error);
        setErrorMessage("게시판 서버와 통신할 수 없습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  if (isLoading) {
    return <div className="p-8 pt-32 text-center text-gray-500 w-full">게시판을 불러오는 중입니다...</div>;
  }

  if (errorMessage) {
    return <div className="p-8 pt-32 text-center text-red-600 w-full font-semibold">{errorMessage}</div>;
  }

  if (!boardId || !boardConfig) {
    return <div className="p-8 pt-32 text-center text-gray-500 w-full">게시판 설정을 찾을 수 없습니다.</div>;
  }

  return (
    <div className="w-full flex flex-col pt-24">
      <div className="max-w-6xl mx-auto px-4 w-full mt-8 text-center">
        <BoardListClient
          boardId={boardId}
          boardConfig={boardConfig}
          initialPosts={posts}
          initialTotalPages={totalPages}
          initialViewerLevel={viewerLevel}
        />
      </div>
    </div>
  );
}
