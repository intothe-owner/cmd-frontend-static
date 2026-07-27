// src/app/(main)/ClientLayoutWrapper.tsx
"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Header from "@/components/main/Header";
import Footer from "@/components/main/Footer";
import PopupRenderer from "@/components/main/PopupRenderer";
import { apiUrl } from "@/lib/api";

// 💡 1. TypeScript 인터페이스에 hasSlider?: boolean 추가
interface ClientLayoutWrapperProps {
  children: React.ReactNode;
  settings: any;
  menus: any[];
  memberSettings: any; // 💡 타입 추가
  hasSlider?: boolean; 
}

export default function ClientLayoutWrapper({ 
  children, 
  settings, 
  menus,
  memberSettings, // 💡 Props 추가
  hasSlider: initialHasSlider = false
}: ClientLayoutWrapperProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [hasSlider, setHasSlider] = useState<boolean>(initialHasSlider);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 💡 2. 페이지(URL) 이동 시 실시간으로 슬라이드 데이터 존재 여부 검사
  useEffect(() => {
    const checkSliderData = async () => {
      try {
        
        const targetId = pathname === "/" ? "0" : searchParams.get("id");
        if (!targetId || pathname.startsWith("/boards") || pathname.startsWith("/admin")) {
          setHasSlider(false);
          return;
        }

        const res = await fetch(apiUrl(`/api/pages/${targetId}`));
        const json = await res.json();

        if (json.success && json.data?.sliderData && json.data.sliderData.length > 0) {
          setHasSlider(true);
        } else {
          setHasSlider(false);
        }
      } catch (error) {
        setHasSlider(false);
      }
    };

    checkSliderData();
  }, [pathname, searchParams]);

  // 3. 테마(다크모드) 제어
  useEffect(() => {
    if (!settings) return;

    document.title = settings.siteName || "제로브이";
    const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (favicon && settings.faviconUrl) favicon.href = settings.faviconUrl;

    let shouldBeDark = false;
    
    if (settings.themeMode === "DARK") {
      shouldBeDark = true;
    } else if (settings.themeMode === "AUTO_TIME") {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      
      const [startH, startM] = settings.nightModeStartTime.split(":").map(Number);
      const [endH, endM] = settings.nightModeEndTime.split(":").map(Number);
      const startTotal = startH * 60 + startM;
      const endTotal = endH * 60 + endM;

      if (startTotal > endTotal) {
        shouldBeDark = currentMinutes >= startTotal || currentMinutes <= endTotal;
      } else {
        shouldBeDark = currentMinutes >= startTotal && currentMinutes <= endTotal;
      }
    }
    
    setIsDarkMode(shouldBeDark);
    
    if (shouldBeDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [settings]);

  if (!settings) return null;

  // 4. 레이아웃 Display 모드 설정
  let displayClass = "w-full transition-colors duration-300 min-h-screen flex flex-col mx-auto ";
  
  switch (settings.displayMode) {
    case "MOBILE_ONLY":
      displayClass += "max-w-md shadow-2xl bg-white dark:bg-slate-900 border-x border-slate-200 dark:border-slate-800";
      break;
    case "PC_ONLY":
      displayClass += "min-w-[1024px] bg-white dark:bg-slate-900";
      break;
    case "ADAPTIVE":
    case "RESPONSIVE":
    default:
      displayClass += "bg-white dark:bg-slate-900";
      break;
  }

  const wrapperClass = settings.displayMode === "MOBILE_ONLY" 
    ? "min-h-screen bg-slate-100 dark:bg-black" 
    : "min-h-screen";

  return (
    <div className={wrapperClass}>
      <PopupRenderer/>
      <div className={displayClass}>
        {/* 💡 Header에 memberSettings 정보 전달 */}
        <Header 
          menus={menus} 
          logoUrl={settings.logoUrl} 
          siteName={settings.siteName} 
          hasSlider={hasSlider} 
          memberSettings={memberSettings} 
        />
        
        <main className="flex-1 w-full relative">
          {children}
        </main>
        
        <Footer 
          companyName={settings.companyName} 
          address={settings.address} 
          contactNumber={settings.contactNumber} 
          memberSettings={memberSettings}
          />
      </div>
    </div>
  );
}