"use client";

import { useEffect, useState } from "react";
import BlockRenderer from "@/components/main/BlockRenderer";
import MainSlider from "@/components/main/MainSlider";
import { apiUrl } from "@/lib/api";

export default function MainPage() {
  const [mainPageData, setMainPageData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    fetch(apiUrl("/api/pages"))
      .then((res) => res.json())
      .then((json) => {
        if (!active || !json.success || !Array.isArray(json.data)) return;
        setMainPageData(json.data.find((page: any) => page.menuId === null) || null);
      })
      .catch((error) => console.error("메인 페이지 데이터 로딩 실패:", error))
      .finally(() => active && setIsLoading(false));

    return () => {
      active = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-slate-500">
        메인 페이지를 불러오는 중입니다...
      </div>
    );
  }

  if (!mainPageData) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <h1 className="text-2xl font-bold text-slate-500">
          메인 페이지가 아직 설정되지 않았습니다.
        </h1>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col">
      {mainPageData.sliderData?.length > 0 && (
        <MainSlider slides={mainPageData.sliderData} />
      )}

      {mainPageData.contentBlocks?.length > 0 && (
        <BlockRenderer blocks={mainPageData.contentBlocks} />
      )}
    </div>
  );
}
