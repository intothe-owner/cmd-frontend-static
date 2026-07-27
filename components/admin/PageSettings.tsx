// @/components/main/PageSettings.tsx
import { Save } from "lucide-react";
import { MenuType } from "@/types/types";

interface PageSettingsProps {
    selectedMenuId: string;
    setSelectedMenuId: (id: string) => void;
    menus: MenuType[];
    title: string;
    setTitle: (title: string) => void;
    handleSave: () => void;
    pageMeta: { bgImage: string; bgTitle: string };
    setPageMeta: (meta: { bgImage: string; bgTitle: string }) => void;
    setMetaBgFile: (file: File | null) => void;
}

export default function PageSettings({
    selectedMenuId, setSelectedMenuId, menus, title, setTitle, handleSave, pageMeta, setPageMeta, setMetaBgFile
}: PageSettingsProps) {
    return (
        <>
            <div className="flex flex-col gap-4 mb-6 border-b border-slate-200 pb-4 pt-4">
                <div className="flex items-center gap-4">
                    <select
                        value={selectedMenuId}
                        onChange={(e) => setSelectedMenuId(e.target.value)}
                        className="border border-slate-300 rounded-lg px-4 py-2 bg-white text-slate-700 font-bold focus:ring-2 focus:ring-indigo-500 outline-none w-64"
                    >
                        <option value="">연결할 메뉴 선택...</option>
                        <option value="0">메인</option>
                        {menus.map(menu => (
                            <option key={menu.id} value={menu.id}>
                                {"\u00A0".repeat((menu.depth - 1) * 4)} {menu.depth > 1 ? '└ ' : ''}{menu.name}
                            </option>
                        ))}
                    </select>
                    <p className="text-sm text-slate-500">선택된 메뉴와 연동될 페이지 콘텐츠를 구성합니다.</p>
                </div>
                <div className="flex items-center justify-between">
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="페이지 관리용 제목 입력"
                        className="text-3xl font-extrabold text-slate-800 outline-none placeholder-slate-300 bg-transparent w-full"
                    />
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-bold transition flex-shrink-0 ml-4 shadow-md"
                    >
                        <Save size={18} /> 저장하기
                    </button>
                </div>
            </div>

            <div className="mb-6 p-5 bg-white border border-slate-200 rounded-xl shadow-sm grid grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">상단 배경 제목 (헤더)</label>
                    <input
                        type="text"
                        value={pageMeta.bgTitle}
                        onChange={(e) => setPageMeta({ ...pageMeta, bgTitle: e.target.value })}
                        placeholder="페이지 기본 제목 대신 표시될 배경 위 제목"
                        className="w-full border border-slate-300 p-2 rounded outline-none focus:border-indigo-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">상단 배경 이미지 (헤더)</label>
                    <div className="flex gap-4 items-center">
                        <input type="file" accept="image/*" onChange={(e) => {
                            if (e.target.files?.[0]) {
                                setMetaBgFile(e.target.files[0]);
                                setPageMeta({ ...pageMeta, bgImage: URL.createObjectURL(e.target.files[0]) });
                            }
                        }} className="text-sm" />
                        {pageMeta.bgImage && <img src={pageMeta.bgImage} className="h-10 rounded shadow-sm object-cover" />}
                    </div>
                </div>
            </div>
        </>
    );
}