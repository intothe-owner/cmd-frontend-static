"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { boardPostHref } from "@/lib/routes";

export default function PostEditPage() {
  const router = useRouter();
  const [boardId, setBoardId] = useState("");
  const [postId, setPostId] = useState("");
  const [boardConfig, setBoardConfig] = useState<any>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<string[]>([]);
  const [isGuestPost, setIsGuestPost] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ writerName: "", password: "", title: "", content: "" });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextBoardId = params.get("boardId") || "";
    const nextPostId = params.get("postId") || "";
    setBoardId(nextBoardId);
    setPostId(nextPostId);
    if (!nextBoardId || !nextPostId) return;

    const loadPost = async () => {
      try {
        const [boardResponse, postResponse] = await Promise.all([
          apiFetch(`/api/board-configs/${encodeURIComponent(nextBoardId)}`),
          apiFetch(`/api/boards/posts/${encodeURIComponent(nextPostId)}`),
        ]);

        const boardRes = await boardResponse.json().catch(() => ({}));
        const postRes = await postResponse.json().catch(() => ({}));

        if (boardResponse.ok && boardRes.success) {
          setBoardConfig(boardRes.data);
        }

        if (!postResponse.ok || !postRes.success) {
          setErrorMessage(postRes.message || "게시글 정보를 불러오지 못했습니다.");
          return;
        }

        const loadedPost = postRes.data;
        const guestPost = !loadedPost.memberId;
        const canEdit = Boolean(postRes.permissions?.canEdit);

        if (!guestPost && !canEdit) {
          setErrorMessage("이 게시글을 수정할 권한이 없습니다.");
          return;
        }

        setIsGuestPost(guestPost);
        setFormData({
          writerName: loadedPost.writerName || "",
          password: "",
          title: loadedPost.title || "",
          content: loadedPost.content || "",
        });

        try {
          setExistingFiles(
            typeof loadedPost.mediaUrls === "string"
              ? JSON.parse(loadedPost.mediaUrls)
              : loadedPost.mediaUrls || []
          );
        } catch {
          setExistingFiles([]);
        }
      } catch {
        setErrorMessage("게시글 서버와 통신할 수 없습니다.");
      }
    };

    loadPost();
  }, []);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!boardId || !postId) return;
    setIsSubmitting(true);

    const submitData = new FormData();
    Object.entries(formData).forEach(([key, value]) => submitData.append(key, value));
    files.forEach((file) => file && submitData.append("attachments", file));

    try {
      const res = await apiFetch(`/api/boards/posts/${encodeURIComponent(postId)}`, {
        method: "PUT",
        body: submitData,
      });
      const responseData = await res.json().catch(() => ({}));

      if (res.ok && responseData.success !== false) {
        router.push(boardPostHref(boardId, postId));
      } else {
        alert(`수정 실패: ${responseData.message || "알 수 없는 오류"}`);
      }
    } catch {
      alert("서버 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!boardId || !postId) return <div className="w-full text-center pt-32 text-slate-500">게시판 또는 게시글 번호가 없습니다.</div>;
  if (errorMessage) return <div className="w-full text-center pt-32 text-red-600 font-semibold">{errorMessage}</div>;
  if (!boardConfig) return <div className="w-full text-center pt-32 text-slate-500 font-medium">로딩 중...</div>;

  return (
    <div className="w-full flex flex-col pt-24 pb-24 bg-slate-50/50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{boardConfig.boardName} 게시글 수정</h1>
          <p className="text-slate-500 mt-2 text-sm">작성한 게시글의 내용을 수정합니다.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-10">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">작성자 <span className="text-red-500">*</span></label>
                <input type="text" name="writerName" value={formData.writerName} required onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">
                  {isGuestPost ? "비밀번호 확인" : "비밀번호"}
                  {isGuestPost && <span className="text-red-500"> *</span>}
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  required={isGuestPost}
                  placeholder={isGuestPost ? "작성 시 입력한 비밀번호" : "회원 게시글은 입력하지 않아도 됩니다"}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">제목 <span className="text-red-500">*</span></label>
              <input type="text" name="title" value={formData.title} required onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">내용 <span className="text-red-500">*</span></label>
              <textarea name="content" value={formData.content} required rows={12} onChange={handleChange} className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl resize-none leading-relaxed" />
            </div>

            {boardConfig.fileUploadCount > 0 && (
              <div className="p-6 rounded-xl border border-slate-200 bg-slate-50/50">
                <h3 className="font-bold text-slate-700 mb-3">첨부파일 관리 (최대 {boardConfig.fileUploadCount}개)</h3>
                {existingFiles.length > 0 && (
                  <ul className="mb-5 space-y-1 text-sm text-blue-600">
                    {existingFiles.map((url, index) => <li key={index}><a href={url} target="_blank" rel="noreferrer" className="hover:underline">📎 {url.split("/").pop()}</a></li>)}
                  </ul>
                )}
                <p className="text-xs text-red-500 mb-4">새 파일을 첨부하면 기존 파일이 교체될 수 있습니다.</p>
                <div className="space-y-3">
                  {Array.from({ length: boardConfig.fileUploadCount }).map((_, index) => (
                    <input key={index} type="file" onChange={(e) => {
                      const nextFiles = [...files];
                      const file = e.target.files?.[0];
                      if (file) nextFiles[index] = file;
                      setFiles(nextFiles);
                    }} className="block w-full text-sm text-slate-500 border border-slate-200 rounded-lg bg-white" />
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
              <button type="button" onClick={() => router.push(boardPostHref(boardId, postId))} className="px-6 py-3 font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl">취소</button>
              <button type="submit" disabled={isSubmitting} className="px-8 py-3 font-semibold text-white bg-blue-600 rounded-xl disabled:opacity-50">{isSubmitting ? "수정 중..." : "수정 완료"}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
