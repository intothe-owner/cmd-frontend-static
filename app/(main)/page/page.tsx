"use client";

import { useEffect, useState } from "react";
import BlockRenderer from "@/components/main/BlockRenderer";
import MainSlider from "@/components/main/MainSlider";
import { apiUrl } from "@/lib/api";

export default function SubPage() {
  const [pageId, setPageId] = useState("");
  const [pageData, setPageData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id") || "";
    setPageId(id);
    if (!id) {
      setIsLoading(false);
      return;
    }

    fetch(apiUrl(`/api/pages/${encodeURIComponent(id)}`))
      .then((res) => res.json())
      .then((json) => json.success && setPageData(json.data))
      .catch((error) => console.error("서브페이지 데이터 로딩 실패:", error))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <div className="flex h-[70vh] items-center justify-center pt-16 text-slate-500">페이지를 불러오는 중입니다...</div>;
  }

  if (!pageId || !pageData) {
    return (
      <div className="flex h-[70vh] items-center justify-center pt-16">
        <h1 className="text-2xl font-bold text-slate-500">해당 페이지를 찾을 수 없습니다.</h1>
      </div>
    );
  }

  const hasSlider = Boolean(
    pageData.sliderData?.some((slide: any) => slide.mediaUrl?.trim())
  );
  const meta = pageData.pageMeta || {};

  return (
    <div className={`w-full flex flex-col ${hasSlider || meta.bgImage ? "" : "pt-24"}`}>
      {hasSlider && <MainSlider slides={pageData.sliderData} />}

      {!hasSlider && meta.bgImage && (
        <div
          className="relative w-full h-[400px] flex items-center justify-center bg-cover bg-center"
          style={{ backgroundImage: `url(${meta.bgImage})` }}
        >
          <div className="absolute inset-0 bg-black/40" />
          <h1 className="relative z-10 text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg">
            {meta.bgTitle || pageData.title}
          </h1>
        </div>
      )}

      {!hasSlider && !meta.bgImage && (
        <div className="max-w-6xl mx-auto px-4 w-full mt-8 text-center">
          <h1 className="text-3xl font-extrabold text-slate-900">{pageData.title}</h1>
        </div>
      )}

      {pageData.contentBlocks?.length > 0 && (
        <BlockRenderer blocks={pageData.contentBlocks} />
      )}
    </div>
  );
}
