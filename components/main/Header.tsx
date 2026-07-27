// src/app/components/main/Header.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, ChevronDown, UserCircle } from "lucide-react";
import { toStaticHref } from "@/lib/routes";

interface MenuType {
  id: number;
  name: string;
  url: string;
  children?: MenuType[];
}

interface HeaderProps {
  menus: MenuType[];
  logoUrl?: string;
  siteName: string;
  hasSlider?: boolean; 
  memberSettings?: any;
}

export default function Header({ menus, logoUrl, siteName, hasSlider = true, memberSettings }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  // 💡 1. 로그인 상태 관리를 위한 State 추가
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  // 💡 2. 마운트 시 localStorage를 확인하여 로그인 여부 판단
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    
    if (token && userStr) {
      setIsLoggedIn(true);
      try {
        setUserData(JSON.parse(userStr));
      } catch (e) {}
    }

    const handleScroll = () => setIsScrolled(window.scrollY > 50); 
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 💡 3. 로그아웃 핸들러
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setUserData(null);
    alert("로그아웃 되었습니다.");
    // 강제 새로고침을 통해 상태를 완벽히 초기화하고 메인으로 이동
    window.location.href = "/";
  };

  const isSolid = !hasSlider || isScrolled || isMobileMenuOpen;

  const headerClasses = `fixed top-0 z-50 w-full transition-all duration-300 ${
    isSolid
      ? "bg-white/90 backdrop-blur-md border-b border-slate-200 dark:bg-slate-900/90 dark:border-slate-800 shadow-sm"
      : "bg-transparent border-transparent"
  }`;

  const textClasses = isSolid 
      ? "text-slate-800 dark:text-slate-200 hover:text-indigo-600" 
      : "text-white hover:text-indigo-300 drop-shadow-md";

  const authMode = memberSettings?.memberSystemMode || "ALL";

  return (
    <header className={headerClasses}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 w-full">
        
        {/* 1. 좌측 로고 영역 */}
        <div className="w-auto md:w-1/4 flex items-center">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt={siteName} className="h-8 w-auto object-contain" />
            ) : (
              <span className={`text-xl font-extrabold transition-colors ${isSolid ? "text-slate-900 dark:text-white" : "text-white drop-shadow-md"}`}>
                {siteName}
              </span>
            )}
          </Link>
        </div>

        {/* 2. 중앙 PC 내비게이션 (GNB) */}
        <nav className="hidden md:flex flex-1 justify-center items-center gap-10">
          {menus.map((menu) => (
            <div
              key={menu.id}
              className="relative group"
              onMouseEnter={() => setOpenDropdownId(menu.id)}
              onMouseLeave={() => setOpenDropdownId(null)}
            >
              <a
                href={toStaticHref(menu.url)}
                className={`flex items-center gap-1 text-[15px] font-bold py-5 transition-colors ${textClasses}`}
              >
                {menu.name}
                {menu.children && menu.children.length > 0 && (
                  <ChevronDown size={14} className="opacity-70 group-hover:rotate-180 transition-transform" />
                )}
              </a>

              {menu.children && menu.children.length > 0 && openDropdownId === menu.id && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 min-w-[160px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-2 animate-in fade-in slide-in-from-top-2">
                  {menu.children.map((child) => (
                    <a
                      key={child.id}
                      href={toStaticHref(child.url)}
                      className="block px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white transition-colors"
                    >
                      {child.name}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* 3. 우측 버튼 영역 */}
        <div className="w-auto md:w-1/4 flex justify-end items-center gap-4">
          
          <div className="hidden md:flex items-center gap-5">
            {/* 💡 4. 로그인 상태에 따른 조건부 렌더링 */}
            {isLoggedIn ? (
              <>
                <div className={`flex items-center gap-1.5 text-[13px] font-extrabold ${textClasses}`}>
                  <UserCircle size={18} />
                  <span>{userData?.name}님</span>
                </div>
                
                {/* 레벨 9 이상(관리자/최고관리자)일 경우 관리자 페이지 링크 노출 */}
                {userData?.level >= 9 && (
                  <Link href="/admin/dashboard" className={`text-[13px] font-extrabold transition-colors text-emerald-500 hover:text-emerald-600`}>
                    관리자
                  </Link>
                )}

                <Link href="/mypage" className={`text-[13px] font-extrabold transition-colors ${textClasses}`}>
                  정보수정
                </Link>
                <button 
                  onClick={handleLogout} 
                  className={`text-[13px] font-extrabold px-4 py-1.5 rounded-full border transition-colors shadow-sm ${isSolid ? 'border-slate-300 text-slate-700 bg-white hover:bg-slate-50' : 'border-white/30 text-white bg-white/10 hover:bg-white/20'}`}
                >
                  로그아웃
                </button>
              </>
            ) : (
              // 비로그인 상태
              <>
                {authMode !== "NONE" && (
                  <Link href="/login" className={`text-[13px] font-extrabold transition-colors ${textClasses}`}>
                    로그인
                  </Link>
                )}
                {authMode === "ALL" && (
                  <Link href="/register" className="text-[13px] font-extrabold px-5 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm">
                    회원가입
                  </Link>
                )}
              </>
            )}
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`p-2 md:hidden rounded-lg transition-colors ${isSolid ? "text-slate-600 dark:text-slate-300 hover:bg-slate-100" : "text-white hover:bg-black/20"}`}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* 모바일 내비게이션 메뉴 */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-lg max-h-[calc(100vh-4rem)] overflow-y-auto flex flex-col">
          <nav className="flex flex-col py-2">
            {menus.map((menu) => (
              <div key={menu.id} className="border-b border-slate-100 dark:border-slate-800 last:border-none">
                <div className="flex items-center justify-between px-6 py-4">
                  <a 
                    href={toStaticHref(menu.url)} 
                    className="text-base font-bold text-slate-800 dark:text-slate-100"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {menu.name}
                  </a>
                  {menu.children && menu.children.length > 0 && (
                    <button
                      onClick={() => setOpenDropdownId(openDropdownId === menu.id ? null : menu.id)}
                      className="p-2 text-slate-400"
                    >
                      <ChevronDown size={20} className={`transition-transform ${openDropdownId === menu.id ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </div>
                
                {menu.children && menu.children.length > 0 && openDropdownId === menu.id && (
                  <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-3 flex flex-col gap-3">
                    {menu.children.map((child) => (
                      <a
                        key={child.id}
                        href={toStaticHref(child.url)}
                        className="text-sm font-medium text-slate-600 dark:text-slate-400 pl-4 border-l-2 border-indigo-200 dark:border-indigo-900"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {child.name}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* 💡 5. 모바일 메뉴 하단 인증(로그아웃/정보수정) 상태 분기 추가 */}
          {isLoggedIn ? (
            <div className="px-6 py-5 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3 bg-slate-50 dark:bg-slate-800/30 mt-auto">
              <div className="flex items-center gap-2 mb-2 px-2">
                <UserCircle size={24} className="text-indigo-600" />
                <span className="font-bold text-slate-800 dark:text-white text-lg">{userData?.name}님</span>
              </div>
              
              {userData?.level >= 9 && (
                <Link 
                  href="/admin/dashboard" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full py-3 text-center text-sm font-extrabold text-white bg-emerald-500 rounded-xl shadow-sm hover:bg-emerald-600 transition"
                >
                  관리자 페이지
                </Link>
              )}
              
              <Link 
                href="/mypage" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full py-3 text-center text-sm font-extrabold text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-xl hover:bg-white dark:hover:bg-slate-700 transition"
              >
                정보수정
              </Link>
              <button 
                onClick={handleLogout}
                className="w-full py-3 text-center text-sm font-extrabold text-white bg-slate-800 rounded-xl shadow-sm hover:bg-slate-900 transition"
              >
                로그아웃
              </button>
            </div>
          ) : (
            // 기존 비로그인 모바일 하단 메뉴
            authMode !== "NONE" && (
              <div className="px-6 py-5 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3 bg-slate-50 dark:bg-slate-800/30 mt-auto">
                <Link 
                  href="/login" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full py-3 text-center text-sm font-extrabold text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-xl hover:bg-white dark:hover:bg-slate-700 transition"
                >
                  로그인
                </Link>
                {authMode === "ALL" && (
                  <Link 
                    href="/register" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full py-3 text-center text-sm font-extrabold text-white bg-indigo-600 rounded-xl shadow-sm hover:bg-indigo-700 transition"
                  >
                    회원가입
                  </Link>
                )}
              </div>
            )
          )}
        </div>
      )}
    </header>
  );
}