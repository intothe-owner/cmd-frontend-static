// src/app/(admin)/admin/visitors/page.tsx
"use client";

import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";
import { BarChart2, MousePointerClick, Calendar, Loader2 } from "lucide-react";

type Period = "hourly" | "daily" | "monthly" | "yearly";

interface StatData {
  label: string;
  count: number;
}

interface PageStatData {
  pageUrl: string;
  count: number;
}

export default function VisitorStatsPage() {
  const [period, setPeriod] = useState<Period>("daily");
  const [stats, setStats] = useState<StatData[]>([]);
  const [topPages, setTopPages] = useState<PageStatData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await fetch(apiUrl(`/api/visits/stats?period=${period}`));
        const json = await res.json();
        
        if (json.success) {
          setStats(json.data.stats || []);
          setTopPages(json.data.topPages || []);
        }
      } catch (error) {
        console.error("통계 데이터를 불러오는 데 실패했습니다.", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [period]);

  const maxCount = Math.max(...stats.map((s) => s.count), 1);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900">방문자 통계</h2>
        <p className="text-sm text-slate-500 mt-1">
          시간, 일, 월, 연도별 접속 통계와 인기 페이지를 확인합니다.
        </p>
      </div>

      {/* 탭 메뉴 */}
      <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 p-1 w-max">
        {[
          { id: "hourly", label: "오늘 시간별" },
          { id: "daily", label: "최근 7일" },
          { id: "monthly", label: "올해 월별" },
          { id: "yearly", label: "최근 5년" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setPeriod(tab.id as Period)}
            className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-colors ${
              period === tab.id
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64 bg-white rounded-2xl shadow-sm border border-slate-200">
          <Loader2 className="animate-spin text-indigo-600" size={32} />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* 차트 영역 */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart2 className="text-indigo-600" size={20} />
              <h3 className="font-bold text-lg text-slate-900">방문자 추이</h3>
            </div>
            
            <div className="flex items-end gap-2 h-64 mt-4">
              {stats.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                  데이터가 없습니다.
                </div>
              ) : (
                stats.map((item, index) => {
                  const heightPercent = (item.count / maxCount) * 100;
                  return (
                    <div key={index} className="flex-1 flex flex-col justify-end items-center group relative h-full">
                      {/* 툴팁 */}
                      <div className="absolute -top-8 bg-slate-900 text-white text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                        {item.count.toLocaleString()}명
                      </div>
                      {/* 막대 그래프 */}
                      <div 
                        className="w-full max-w-[40px] bg-indigo-500 rounded-t-sm group-hover:bg-indigo-600 transition-all duration-300" 
                        style={{ height: `${heightPercent}%`, minHeight: item.count > 0 ? '4px' : '0' }}
                      />
                      {/* 라벨 */}
                      <span className="text-[10px] text-slate-500 mt-2 rotate-45 md:rotate-0 origin-left max-w-full truncate">
                        {item.label}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 인기 페이지 랭킹 영역 */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-6">
              <MousePointerClick className="text-indigo-600" size={20} />
              <h3 className="font-bold text-lg text-slate-900">인기 접속 페이지</h3>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3">
              {topPages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                  데이터가 없습니다.
                </div>
              ) : (
                topPages.map((page, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-xs font-black text-slate-600">
                        {index + 1}
                      </span>
                      <span className="text-sm font-medium text-slate-700 truncate" title={page.pageUrl}>
                        {page.pageUrl === "/" ? "/ (메인화면)" : page.pageUrl}
                      </span>
                    </div>
                    <span className="font-black text-indigo-600 text-sm ml-2 shrink-0">
                      {page.count.toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}