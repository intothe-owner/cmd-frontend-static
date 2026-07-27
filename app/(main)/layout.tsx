"use client";

import { Suspense, useEffect, useState } from "react";
import ClientLayoutWrapper from "./ClientLayoutWrapper";
import { apiUrl } from "@/lib/api";

const fallbackSettings = {
  siteName: "제로브이",
  metaDescription: "제로브이 웹사이트",
  logoUrl: "",
  faviconUrl: "/favicon.ico",
  displayMode: "RESPONSIVE",
  themeMode: "LIGHT",
  companyName: "제로브이",
  address: "",
  contactNumber: "",
};

function buildMenuTree(flat: any[]) {
  const map: Record<number, any> = {};
  const roots: any[] = [];

  flat.forEach((menu) => {
    map[menu.id] = { ...menu, children: [] };
  });

  flat.forEach((menu) => {
    if (menu.parentId && map[menu.parentId]) {
      map[menu.parentId].children.push(map[menu.id]);
    } else {
      roots.push(map[menu.id]);
    }
  });

  return roots;
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<any>(fallbackSettings);
  const [menus, setMenus] = useState<any[]>([]);
  const [memberSettings, setMemberSettings] = useState<any>({ memberSystemMode: "NONE" });
  const [isReady, setIsReady] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;

    const loadLayoutData = async () => {
      try {
        const adminCheckRes = await fetch(apiUrl("/api/auth/check-admin"));
        const adminCheckJson = await adminCheckRes.json();

        if (adminCheckJson.success && !adminCheckJson.hasAdmin) {
          window.location.replace("/setup/");
          return;
        }

        const [settingsRes, menusRes, memberSettingsRes] = await Promise.all([
          fetch(apiUrl("/api/settings")),
          fetch(apiUrl("/api/menus")),
          fetch(apiUrl("/api/member-settings")),
        ]);

        const [settingsJson, menusJson, memberSettingsJson] = await Promise.all([
          settingsRes.json(),
          menusRes.json(),
          memberSettingsRes.json(),
        ]);

        if (!active) return;

        if (settingsJson.success && settingsJson.data) {
          setSettings({ ...fallbackSettings, ...settingsJson.data });
        }
        if (menusJson.success && Array.isArray(menusJson.data)) {
          setMenus(buildMenuTree(menusJson.data));
        }
        if (memberSettingsJson.success && memberSettingsJson.data) {
          setMemberSettings(memberSettingsJson.data);
        }
      } catch (error) {
        console.error("공통 레이아웃 데이터 로딩 실패:", error);
        if (active) {
          setLoadError("Node.js API 서버에 연결하지 못했습니다. runtime-config.js의 API_URL을 확인해 주세요.");
        }
      } finally {
        if (active) setIsReady(true);
      }
    };

    loadLayoutData();
    return () => {
      active = false;
    };
  }, []);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
        사이트 정보를 불러오는 중입니다...
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <ClientLayoutWrapper
        settings={settings}
        menus={menus}
        memberSettings={memberSettings}
        hasSlider={false}
      >
        {loadError && (
          <div className="fixed bottom-4 left-1/2 z-[100] -translate-x-1/2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-lg">
            {loadError}
          </div>
        )}
        {children}
      </ClientLayoutWrapper>
    </Suspense>
  );
}
