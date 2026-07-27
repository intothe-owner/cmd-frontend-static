"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiUrl } from "@/lib/api";
import { boardListHref } from "@/lib/routes";

export default function PostWritePage() {
  const router = useRouter();
  const [boardId, setBoardId] = useState("");
  const [boardConfig, setBoardConfig] = useState<any>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("boardId") || "";
    setBoardId(id);
    if (!id) return;

    const userStr = localStorage.getItem("user");
    const currentLevel = userStr ? JSON.parse(userStr).level : 1;

    fetch(apiUrl(`/api/board-configs/${encodeURIComponent(id)}`))
      .then((res) => res.json())
      .then((json) => {
        if (!json.success) return;
        if (currentLevel < json.data.writeLevel) {
          alert("글쓰기 권한이 없습니다.");
          router.replace(boardListHref(id));
          return;
        }
        setBoardConfig(json.data);
      })
      .catch(() => alert("게시판 정보를 불러오지 못했습니다."));
  }, [router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!boardId) return;
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    files.forEach((file) => file && formData.append("attachments", file));

    try {
      const res = await fetch(apiUrl(`/api/boards/${encodeURIComponent(boardId)}/posts`), {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        router.push(boardListHref(boardId));
      } else {
        const error = await res.json().catch(() => ({}));
        alert(error.message || "게시글 등록에 실패했습니다.");
      }
    } catch {
      alert("서버 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!boardId) return <div className="w-full text-center pt-32 text-slate-500">게시판 번호가 없습니다.</div>;
  if (!boardConfig) return <div className="w-full text-center pt-32 text-slate-500 font-medium">로딩 중...</div>;

  return (
    <div className="w-full flex flex-col pt-24 pb-24 bg-slate-50/50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{boardConfig.boardName} 글 작성</h1>
          <p className="text-slate-500 mt-2 text-sm">{boardConfig.boardName}에 새로운 게시글을 등록합니다.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-10">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">작성자 <span className="text-red-500">*</span></label>
                <input type="text" name="writerName" required placeholder="이름 또는 닉네임" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">비밀번호 <span className="text-red-500">*</span></label>
                <input type="password" name="password" required placeholder="수정/삭제용 비밀번호" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">제목 <span className="text-red-500">*</span></label>
              <input type="text" name="title" required placeholder="게시글 제목을 입력해주세요" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">내용 <span className="text-red-500">*</span></label>
              <textarea name="content" required rows={12} placeholder="자유롭게 내용을 작성해주세요" className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none leading-relaxed" />
            </div>

            {boardConfig.fileUploadCount > 0 && (
              <div className="p-6 rounded-xl border border-slate-200 bg-slate-50/50">
                <h3 className="font-bold text-slate-700 mb-1">첨부파일 (최대 {boardConfig.fileUploadCount}개)</h3>
                <p className="text-xs text-slate-500 mb-4">50MB 이하 파일만 업로드할 수 있습니다.</p>
                <div className="space-y-3">
                  {Array.from({ length: boardConfig.fileUploadCount }).map((_, index) => (
                    <input key={index} type="file" onChange={(e) => {
                      const nextFiles = [...files];
                      const file = e.target.files?.[0];
                      if (file) nextFiles[index] = file;
                      setFiles(nextFiles);
                    }} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-slate-200 rounded-lg bg-white" />
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
              <button type="button" onClick={() => router.push(boardListHref(boardId))} className="px-6 py-3 font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50">취소</button>
              <button type="submit" disabled={isSubmitting} className="px-8 py-3 font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50">{isSubmitting ? "등록 중..." : "등록 완료"}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
