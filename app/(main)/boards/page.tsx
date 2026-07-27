"use client";

import { useEffect, useState } from "react";
import BoardListClient from "./BoardListClient";
import { apiUrl } from "@/lib/api";

export default function BoardListPage() {
  const [boardId, setBoardId] = useState("");
  const [boardConfig, setBoardConfig] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);
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
        const configRes = await fetch(apiUrl(`/api/board-configs/${encodeURIComponent(id)}`));
        const configJson = await configRes.json();
        if (!configJson.success || !configJson.data) return;

        const config = configJson.data;
        setBoardConfig(config);

        const postRes = await fetch(
          apiUrl(`/api/boards/${encodeURIComponent(id)}/posts?page=1&limit=${config.listCount || 10}`)
        );
        const postJson = await postRes.json();
        if (postJson.success) {
          setPosts(postJson.data || []);
          setTotalPages(postJson.totalPages || 1);
        }
      } catch (error) {
        console.error("게시판 로딩 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  if (isLoading) {
    return <div className="p-8 pt-32 text-center text-gray-500 w-full">게시판을 불러오는 중입니다...</div>;
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
        />
      </div>
    </div>
  );
}
