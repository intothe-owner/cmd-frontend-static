"use client";

import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";

export default function PopupViewPage() {
  const [id, setId] = useState("");
  const [popup, setPopup] = useState<any>(null);
  const [todayHide, setTodayHide] = useState(false);

  useEffect(() => {
    const popupId = new URLSearchParams(window.location.search).get("id") || "";
    setId(popupId);
    if (!popupId) return;

    fetch(apiUrl("/api/popups"))
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setPopup(json.data.find((item: any) => String(item.id) === popupId) || null);
        }
      })
      .catch(() => undefined);
  }, []);

  const handleClose = () => {
    if (todayHide && id) {
      localStorage.setItem(`popup_hide_${id}`, String(Date.now() + 24 * 60 * 60 * 1000));
    }
    window.close();
  };

  if (!id) return <div className="p-8 text-center text-sm text-slate-500">팝업 번호가 없습니다.</div>;
  if (!popup) return <div className="p-8 text-center text-sm text-slate-500">로딩 중...</div>;

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      <div>
        <div className="bg-slate-900 text-white p-3"><h4 className="font-bold text-sm truncate">{popup.title}</h4></div>
        <div className="p-4">
          {popup.attachmentUrl && <img src={popup.attachmentUrl} alt="팝업 이미지" className="w-full mb-4 object-contain max-h-[300px]" />}
          <div dangerouslySetInnerHTML={{ __html: popup.content }} className="text-sm text-slate-700 leading-relaxed" />
        </div>
      </div>
      <div className="bg-slate-50 border-t border-slate-200 p-3 flex justify-between items-center text-xs">
        <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-600">
          <input type="checkbox" checked={todayHide} onChange={(e) => setTodayHide(e.target.checked)} className="w-4 h-4 accent-indigo-600 rounded" />
          오늘 하루 동안 보지 않기
        </label>
        <button onClick={handleClose} className="font-bold text-slate-700 bg-white border border-slate-300 px-3 py-1 rounded hover:bg-slate-100">창 닫기</button>
      </div>
    </div>
  );
}
