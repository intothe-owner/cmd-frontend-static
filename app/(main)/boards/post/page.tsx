"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PostActionButtons from "./PostActionButtons";
import { apiFetch } from "@/lib/api";
import { boardListHref } from "@/lib/routes";

const isImage = (url: string) => /\.(jpeg|jpg|gif|png|webp)$/i.test(url);
const isVideo = (url: string) => /\.(mp4|webm|ogg)$/i.test(url);

export default function PostDetailPage() {
  const [boardId, setBoardId] = useState("");
  const [postId, setPostId] = useState("");
  const [boardConfig, setBoardConfig] = useState<any>(null);
  const [post, setPost] = useState<any>(null);
  const [permissions, setPermissions] = useState({ canEdit: false, canDelete: false });
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextBoardId = params.get("boardId") || "";
    const nextPostId = params.get("postId") || "";
    setBoardId(nextBoardId);
    setPostId(nextPostId);

    if (!nextBoardId || !nextPostId) {
      setIsLoading(false);
      return;
    }

    const loadPost = async () => {
      try {
        const [boardResponse, postResponse] = await Promise.all([
          apiFetch(`/api/board-configs/${encodeURIComponent(nextBoardId)}`),
          apiFetch(`/api/boards/posts/${encodeURIComponent(nextPostId)}`),
        ]);

        const boardJson = await boardResponse.json().catch(() => ({}));
        const postJson = await postResponse.json().catch(() => ({}));

        if (boardResponse.ok && boardJson.success) {
          setBoardConfig(boardJson.data);
        }

        if (!postResponse.ok || !postJson.success) {
          setErrorMessage(postJson.message || "게시글을 읽을 권한이 없거나 게시글이 존재하지 않습니다.");
          return;
        }

        setPost(postJson.data);
        setPermissions({
          canEdit: Boolean(postJson.permissions?.canEdit),
          canDelete: Boolean(postJson.permissions?.canDelete),
        });
      } catch (error) {
        console.error("게시글 로딩 실패:", error);
        setErrorMessage("게시글 서버와 통신할 수 없습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    loadPost();
  }, []);

  if (isLoading) {
    return <div className="w-full flex justify-center pt-32 text-slate-500">게시글을 불러오는 중입니다...</div>;
  }

  if (errorMessage) {
    return (
      <div className="w-full flex justify-center pt-32">
        <div className="text-center bg-slate-50 p-12 rounded-2xl border border-slate-200">
          <p className="text-xl font-bold text-red-600 mb-4">{errorMessage}</p>
          {boardId && <Link href={boardListHref(boardId)} className="text-blue-600 font-medium hover:underline">목록으로 돌아가기</Link>}
        </div>
      </div>
    );
  }

  if (!boardId || !postId || !post) {
    return (
      <div className="w-full flex justify-center pt-32">
        <div className="text-center bg-slate-50 p-12 rounded-2xl border border-slate-200">
          <p className="text-xl font-bold text-slate-700 mb-4">게시글을 찾을 수 없습니다.</p>
          {boardId && <Link href={boardListHref(boardId)} className="text-blue-600 font-medium hover:underline">목록으로 돌아가기</Link>}
        </div>
      </div>
    );
  }

  let mediaUrls: string[] = [];
  try {
    mediaUrls = typeof post.mediaUrls === "string" ? JSON.parse(post.mediaUrls) : post.mediaUrls || [];
  } catch {
    mediaUrls = [];
  }

  const hasFiles = mediaUrls.some((url) => !isImage(url) && !isVideo(url));
  const isGuestPost = !post.memberId;
  const canEdit = permissions.canEdit || isGuestPost;
  const canDelete = permissions.canDelete || isGuestPost;

  return (
    <div className="w-full flex flex-col pt-24 pb-24">
      <div className="max-w-4xl mx-auto px-4 w-full">
        <article className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <header className="px-6 py-8 md:px-10 md:py-10 border-b border-slate-100 bg-slate-50/30">
            <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">{post.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-500">
              <span className="flex items-center gap-1.5 text-slate-700">👤 {post.writerName}</span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span>{new Date(post.createdAt).toLocaleString()}</span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span>조회 {post.hitCount}</span>
            </div>
          </header>

          <div className="px-6 py-8 md:px-10 md:py-12">
            {mediaUrls.length > 0 && (
              <div className="mb-10 space-y-6">
                {mediaUrls.map((url, index) => {
                  if (isImage(url)) return <img key={index} src={url} alt="첨부 이미지" className="w-full max-w-3xl mx-auto rounded-xl border border-slate-100 shadow-sm" />;
                  if (isVideo(url)) return <video key={index} src={url} controls className="w-full max-w-3xl mx-auto rounded-xl border border-slate-100 shadow-sm" />;
                  return null;
                })}
              </div>
            )}
            <div className="text-slate-800 text-lg leading-relaxed whitespace-pre-wrap min-h-[250px]">{post.content}</div>
          </div>

          {hasFiles && (
            <div className="mx-6 md:mx-10 mb-8 border border-slate-200 rounded-xl p-5 bg-slate-50">
              <h4 className="font-bold text-slate-700 mb-3 text-sm">첨부파일</h4>
              <ul className="space-y-2">
                {mediaUrls.map((url, index) => !isImage(url) && !isVideo(url) ? (
                  <li key={index}>
                    <a href={url} download className="text-sm font-medium text-blue-600 hover:underline">{url.split("/").pop() || `첨부파일 ${index + 1}`}</a>
                  </li>
                ) : null)}
              </ul>
            </div>
          )}
        </article>

        <div className="flex justify-between items-center mt-8">
          <Link href={boardListHref(boardId)} className="px-6 py-2.5 font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm">목록으로</Link>
          <PostActionButtons
            boardId={boardId}
            postId={postId}
            canEdit={canEdit}
            canDelete={canDelete}
            isGuestPost={isGuestPost}
          />
        </div>

        {boardConfig?.useComment && (
          <div className="mt-16 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-10">
            <h3 className="font-extrabold text-xl text-slate-900 mb-6">댓글</h3>
            <div className="flex items-center justify-center py-12 bg-slate-50 border border-slate-100 rounded-xl border-dashed">
              <p className="text-slate-400 font-medium text-sm">댓글 시스템이 연동될 영역입니다.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
