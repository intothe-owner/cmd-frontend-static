// src/app/components/main/Footer.tsx
"use client";

import Link from "next/link";
import { Lock } from "lucide-react"; // 💡 자물쇠 아이콘 임포트

interface FooterProps {
  companyName?: string;
  address?: string;
  contactNumber?: string;
  memberSettings?: any; // 💡 회원 설정 Props 추가
}

export default function Footer({ companyName, address, contactNumber, memberSettings }: FooterProps) {
  const currentYear = new Date().getFullYear();
  
  // 현재 운영 모드 확인
  const authMode = memberSettings?.memberSystemMode || "ALL";

  return (
    <footer className="w-full bg-slate-50 border-t border-slate-200 dark:bg-slate-950 dark:border-slate-800 transition-colors mt-auto">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12 flex flex-col md:flex-row justify-between items-center md:items-start gap-6">
        
        {/* 회사 정보 영역 */}
        <div className="flex flex-col items-center md:items-start gap-2 text-center md:text-left">
          {companyName && (
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
              {companyName}
            </h3>
          )}
          
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400 space-y-1">
            {address && <p>주소 : {address}</p>}
            {contactNumber && <p>고객센터 : {contactNumber}</p>}
          </div>
        </div>

        {/* 카피라이트 및 부가 링크 영역 */}
        <div className="flex flex-col items-center md:items-end gap-3">
          <div className="flex items-center gap-4 text-xs font-bold text-slate-500 dark:text-slate-400">
            <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400">이용약관</a>
            <span className="w-px h-3 bg-slate-300 dark:bg-slate-700"></span>
            <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400">개인정보처리방침</a>
          </div>

          <div className="flex items-center gap-2">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              © {currentYear} {companyName || "Company"}. All rights reserved.
            </p>
         
            {/* 💡 폐쇄형(NONE) 모드일 때만 노출되는 관리자/회원 전용 자물쇠 링크 */}
            {authMode === "NONE" && (
              <Link 
                href="/login" 
                title="로그인 페이지로 이동 (폐쇄형 운영 중)" 
                className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-1"
              >
                <Lock size={14} />
              </Link>
            )}
          </div>
        </div>

      </div>
    </footer>
  );
}