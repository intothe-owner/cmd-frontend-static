// src/app/(admin)/layout.tsx
"use client"; // 💡 localStorage 접근과 상태 관리를 위해 클라이언트 컴포넌트로 변경

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Settings, Users, UserCheck, Menu as MenuIcon, 
  FileText, MessageSquare, LogOut, UserCircle, Loader2 ,Megaphone,
  BarChart2
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // 💡 권한 확인 상태 및 관리자 이름 상태 추가
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [adminInfo, setAdminInfo] = useState({ name: "", level: 0 });

  useEffect(() => {
    // 1. 로컬 스토리지에서 토큰과 유저 정보 가져오기
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!token || !userStr) {
      alert("관리자 페이지입니다. 먼저 로그인해 주세요.");
      window.location.href = "/login";
      return;
    }

    try {
      const user = JSON.parse(userStr);
      
      // 2. 권한 검사: 레벨 9(관리자), 10(최고관리자) 미만이면 접근 차단
      if (user.level < 9) {
        alert("관리자 페이지에 접근할 권한이 없습니다.");
        window.location.href = "/";
        return;
      }

      // 3. 권한이 확인되면 상태 업데이트
      setAdminInfo({ name: user.name, level: user.level });
      setIsAuthorized(true);

    } catch (e) {
      alert("로그인 정보가 유효하지 않습니다. 다시 로그인해 주세요.");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
  }, []);

  // 💡 관리자 로그아웃 처리
  const handleLogout = () => {
    if (confirm("로그아웃 하시겠습니까?")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/";
    }
  };

  // 💡 권한 확인 중일 때 보여줄 로딩 화면 (화면 깜빡임 방지)
  if (!isAuthorized) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4 text-indigo-600">
          <Loader2 className="animate-spin" size={40} />
          <p className="font-bold text-slate-600">관리자 권한을 확인하고 있습니다...</p>
        </div>
      </div>
    );
  }

  // 레벨에 따른 직책명 렌더링 헬퍼
  const getLevelName = (level: number) => {
    return level === 10 ? "최고관리자" : "관리자";
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-800">
      
      {/* --- 좌측 사이드바 --- */}
      <aside className="w-64 bg-slate-900 flex flex-col h-full flex-shrink-0 shadow-2xl z-20">
        {/* 로고 영역 */}
        <div className="h-16 flex items-center justify-center bg-slate-950 border-b border-slate-800 shadow-sm flex-shrink-0">
          <Link href="/admin/dashboard" className="text-xl font-black text-white tracking-widest hover:text-indigo-400 transition-colors">
            CMS ADMIN
          </Link>
        </div>

        {/* 네비게이션 메뉴 */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <p className="px-3 mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">환경 설정</p>
          
          <Link href="/admin/settings" className="flex items-center gap-3 px-3 py-3 rounded-xl text-slate-300 hover:bg-indigo-600 hover:text-white hover:shadow-md transition-all duration-200">
            <Settings size={18} />
            <span className="font-medium text-sm">사이트 설정</span>
          </Link>
          
          <Link href="/admin/members/settings" className="flex items-center gap-3 px-3 py-3 rounded-xl text-slate-300 hover:bg-indigo-600 hover:text-white hover:shadow-md transition-all duration-200">
            <Users size={18} />
            <span className="font-medium text-sm">회원 설정</span>
          </Link>

          <div className="my-6 border-t border-slate-800" />

          <p className="px-3 mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">컨텐츠 관리</p>
          
          <Link href="/admin/member" className="flex items-center gap-3 px-3 py-3 rounded-xl text-slate-300 hover:bg-indigo-600 hover:text-white hover:shadow-md transition-all duration-200">
            <UserCheck size={18} />
            <span className="font-medium text-sm">회원 관리</span>
          </Link>
          <Link href="/admin/menus" className="flex items-center gap-3 px-3 py-3 rounded-xl text-slate-300 hover:bg-indigo-600 hover:text-white hover:shadow-md transition-all duration-200">
            <MenuIcon size={18} />
            <span className="font-medium text-sm">메뉴 관리</span>
          </Link>
          <Link href="/admin/pages" className="flex items-center gap-3 px-3 py-3 rounded-xl text-slate-300 hover:bg-indigo-600 hover:text-white hover:shadow-md transition-all duration-200">
            <FileText size={18} />
            <span className="font-medium text-sm">페이지 관리</span>
          </Link>
          <Link href="/admin/boards" className="flex items-center gap-3 px-3 py-3 rounded-xl text-slate-300 hover:bg-indigo-600 hover:text-white hover:shadow-md transition-all duration-200">
            <MessageSquare size={18} />
            <span className="font-medium text-sm">게시판 관리</span>
          </Link>
          <Link href="/admin/popup" className="flex items-center gap-3 px-3 py-3 rounded-xl text-slate-300 hover:bg-indigo-600 hover:text-white hover:shadow-md transition-all duration-200">
            <Megaphone size={18} />
            <span className="font-medium text-sm">팝업 관리</span>
          </Link>

          <p className="px-3 mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">통계 관리</p>
          
          <Link href="/admin/visitors" className="flex items-center gap-3 px-3 py-3 rounded-xl text-slate-300 hover:bg-indigo-600 hover:text-white hover:shadow-md transition-all duration-200">
            <BarChart2 size={18} />
            <span className="font-medium text-sm">방문자 통계</span>
          </Link>
        </nav>
      </aside>

      {/* --- 우측 메인 영역 --- */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        {/* 상단 헤더바 */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm flex-shrink-0 z-10">
          <div className="text-slate-500 font-medium">관리자 대시보드</div>

          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full">
              <UserCircle size={20} className="text-indigo-600" />
              {/* 💡 실제 로그인한 관리자 이름과 직책 바인딩 */}
              <span className="text-sm font-bold text-slate-700">
                {adminInfo.name} ({getLevelName(adminInfo.level)})
              </span>
            </div>
            <div className="h-4 w-px bg-slate-300" />
            {/* 💡 로그아웃 핸들러 연결 */}
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-red-500 transition-colors"
            >
              <LogOut size={16} />
              로그아웃
            </button>
          </div>
        </header>

        {/* 본문 영역 */}
        <main className="flex-1 p-8 overflow-y-auto bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
}