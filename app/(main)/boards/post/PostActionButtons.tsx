"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { boardEditHref, boardListHref } from "@/lib/routes";

type PostActionButtonsProps = {
  boardId: string;
  postId: string;
  canEdit: boolean;
  canDelete: boolean;
  isGuestPost: boolean;
};

export default function PostActionButtons({
  boardId,
  postId,
  canEdit,
  canDelete,
  isGuestPost,
}: PostActionButtonsProps) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("정말로 이 게시글을 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.")) return;

    let password = "";
    if (isGuestPost) {
      password = window.prompt("게시글 작성 시 입력한 비밀번호를 입력하세요.") || "";
      if (!password) {
        alert("비밀번호를 입력해야 삭제할 수 있습니다.");
        return;
      }
    }

    try {
      const res = await apiFetch(`/api/boards/posts/${encodeURIComponent(postId)}`, {
        method: "DELETE",
        ...(isGuestPost
          ? {
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ password }),
            }
          : {}),
      });

      const responseData = await res.json().catch(() => ({}));
      if (res.ok && responseData.success !== false) {
        router.push(boardListHref(boardId));
      } else {
        alert(`삭제 실패: ${responseData.message || "알 수 없는 오류"}`);
      }
    } catch {
      alert("서버 통신 오류가 발생했습니다.");
    }
  };

  if (!canEdit && !canDelete) return null;

  return (
    <div className="flex gap-2">
      {canEdit && (
        <Link
          href={boardEditHref(boardId, postId)}
          className="px-5 py-2.5 font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors"
        >
          수정
        </Link>
      )}
      {canDelete && (
        <button
          onClick={handleDelete}
          className="px-5 py-2.5 font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors"
        >
          삭제
        </button>
      )}
    </div>
  );
}
