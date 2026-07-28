'use client';

import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { 
  Search, 
  RotateCcw, 
  Edit2, 
  Key, 
  Trash2, 
  X,
  List
} from 'lucide-react';

import {
  AdminMemberApiError,
  adminMemberApi,
} from '@/lib/adminMemberApi';

type SnsProvider =
  | 'LOCAL'
  | 'KAKAO'
  | 'NAVER'
  | 'GOOGLE';

interface Member {
  id: number;
  loginId: string;
  name: string;
  nickname: string | null;
  phone: string | null;
  mobile: string | null;
  address: string | null;
  dob: string | null;
  level: number;
  snsProvider: SnsProvider;
  snsId: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Summary {
  total: number;
  administrators: number;
  normalMembers: number;
}

interface MemberListResponse {
  success: boolean;
  members: Member[];
  pagination: Pagination;
  summary: Summary;
}

interface CurrentUser {
  id: number;
  name: string;
  level: number;
}

interface EditForm {
  name: string;
  nickname: string;
  phone: string;
  mobile: string;
  address: string;
  dob: string;
  level: number;
}

const EMPTY_SUMMARY: Summary = {
  total: 0,
  administrators: 0,
  normalMembers: 0,
};

function getLevelName(level: number) {
  if (level === 10) return '최고관리자';
  if (level === 9) return '관리자';
  return `회원 레벨 ${level}`;
}

const inputClass = "w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500";

export default function MemberManagementPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [summary, setSummary] = useState<Summary>(EMPTY_SUMMARY);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return;
    try {
      const parsed = JSON.parse(storedUser) as CurrentUser;
      setCurrentUser(parsed);
    } catch {
      setCurrentUser(null);
    }
  }, []);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
      });
      if (search) params.set('search', search);
      if (levelFilter) params.set('level', levelFilter);

      const data = await adminMemberApi<MemberListResponse>(
        `/api/admin/members?${params.toString()}`
      );
      setMembers(data.members);
      setPagination(data.pagination);
      setSummary(data.summary);
    } catch (error) {
      alert(
        error instanceof AdminMemberApiError
          ? error.message
          : '회원 목록을 불러오지 못했습니다.'
      );
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, levelFilter]);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    setPagination((previous) => ({ ...previous, page: 1 }));
    setSearch(searchInput.trim());
  };

  const openEdit = (member: Member) => {
    setEditingMember(member);
    setEditForm({
      name: member.name || '',
      nickname: member.nickname || '',
      phone: member.phone || '',
      mobile: member.mobile || '',
      address: member.address || '',
      dob: member.dob || '',
      level: member.level,
    });
  };

  const closeEdit = () => {
    if (saving) return;
    setEditingMember(null);
    setEditForm(null);
  };

  const saveMember = async (event: FormEvent) => {
    event.preventDefault();
    if (!editingMember || !editForm) return;
    if (!editForm.name.trim()) {
      alert('회원 이름을 입력해 주세요.');
      return;
    }

    setSaving(true);
    try {
      const data = await adminMemberApi<{
        success: boolean;
        message: string;
        member: Member;
      }>(`/api/admin/members/${editingMember.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: editForm.name,
          nickname: editForm.nickname,
          phone: editForm.phone,
          mobile: editForm.mobile,
          address: editForm.address,
          dob: editForm.dob || null,
          level: Number(editForm.level),
        }),
      });

      if (currentUser?.id === data.member.id) {
        const oldUserText = localStorage.getItem('user');
        if (oldUserText) {
          try {
            const oldUser = JSON.parse(oldUserText);
            localStorage.setItem(
              'user',
              JSON.stringify({
                ...oldUser,
                name: data.member.name,
                level: data.member.level,
              })
            );
          } catch {}
        }
      }

      alert(data.message);
      closeEdit();
      await loadMembers();
    } catch (error) {
      alert(
        error instanceof AdminMemberApiError
          ? error.message
          : '회원정보 수정에 실패했습니다.'
      );
    } finally {
      setSaving(false);
    }
  };

  const resetPassword = async (member: Member) => {
    const password = window.prompt(
      `${member.name} 회원의 새 비밀번호를 입력하세요.\n8자 이상 입력해야 합니다.`
    );
    if (password === null) return;
    if (password.length < 8) {
      alert('비밀번호는 8자 이상 입력해 주세요.');
      return;
    }

    try {
      const data = await adminMemberApi<{
        success: boolean;
        message: string;
      }>(`/api/admin/members/${member.id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ password }),
      });
      alert(data.message);
    } catch (error) {
      alert(
        error instanceof AdminMemberApiError
          ? error.message
          : '비밀번호 변경에 실패했습니다.'
      );
    }
  };

  const deleteMember = async (member: Member) => {
    const confirmed = window.confirm(
      `${member.name} 회원을 삭제하시겠습니까?\n\n현재 DB에는 회원상태 필드가 없으므로 실제 회원정보가 삭제됩니다.`
    );
    if (!confirmed) return;

    try {
      const data = await adminMemberApi<{
        success: boolean;
        message: string;
      }>(`/api/admin/members/${member.id}`, {
        method: 'DELETE',
      });
      alert(data.message);
      await loadMembers();
    } catch (error) {
      alert(
        error instanceof AdminMemberApiError
          ? error.message
          : '회원 삭제에 실패했습니다.'
      );
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">
            회원 관리
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            회원정보, 회원레벨, 비밀번호를 관리합니다.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard title="전체 회원" value={summary.total} />
        <SummaryCard title="일반 회원" value={summary.normalMembers} />
        <SummaryCard title="관리자" value={summary.administrators} />
      </div>

      {/* 검색 필터 영역: 레벨 선택이 먼저 오도록 배치하고 폼 박스를 벗어나지 않도록 플렉스 적용 */}
      <form
        onSubmit={handleSearch}
        className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-wrap md:flex-nowrap gap-3 items-center"
      >
        <select
          value={levelFilter}
          onChange={(event) => {
            setLevelFilter(event.target.value);
            setPagination((previous) => ({ ...previous, page: 1 }));
          }}
          className={`${inputClass} w-full md:w-40 shrink-0`}
        >
          <option value="">전체 레벨</option>
          {Array.from({ length: 10 }, (_, index) => index + 1).map((level) => (
            <option key={level} value={level}>
              {getLevelName(level)}
            </option>
          ))}
        </select>

        <div className="relative flex-1 w-full min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="아이디, 이름, 닉네임, 연락처 검색"
            className={`${inputClass} pl-10 w-full`}
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
          <button
            type="submit"
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 text-sm flex-1 md:flex-none hover:bg-indigo-700 transition-colors"
          >
            <Search size={16} />
            검색
          </button>

          <button
            type="button"
            onClick={() => {
              setSearchInput('');
              setSearch('');
              setLevelFilter('');
              setPagination((previous) => ({ ...previous, page: 1 }));
            }}
            className="border border-slate-300 text-slate-700 px-5 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 text-sm flex-1 md:flex-none hover:bg-slate-50 transition-colors"
          >
            <RotateCcw size={16} />
            초기화
          </button>
        </div>
      </form>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 font-bold text-center w-20">번호</th>
                <th className="p-4 font-bold">회원 정보</th>
                <th className="p-4 font-bold">연락처</th>
                <th className="p-4 font-bold">회원레벨/가입</th>
                <th className="p-4 font-bold text-center">관리</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-16 text-center text-slate-500">
                    회원정보를 불러오고 있습니다...
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-16 text-center text-slate-500">
                    검색된 회원이 없습니다.
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-4 text-center">{member.id}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 font-bold text-slate-900">
                        {member.name}
                        {currentUser?.id === member.id && (
                          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px]">
                            본인
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">{member.loginId}</div>
                      {member.nickname && (
                        <div className="text-xs text-slate-500 mt-0.5">닉네임: {member.nickname}</div>
                      )}
                    </td>
                    <td className="p-4 text-xs text-slate-500">
                      <div>{member.mobile || '-'}</div>
                      {member.phone && <div className="mt-1">{member.phone}</div>}
                    </td>
                    <td className="p-4">
                      <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs mr-2 inline-block mb-1">
                        {getLevelName(member.level)}
                      </span>
                      <br/>
                      <span className="bg-emerald-500 text-white px-2 py-1 rounded text-xs inline-block">
                        {member.snsProvider}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        title="수정"
                        onClick={() => openEdit(member)}
                        className="text-indigo-600 mr-3 hover:text-indigo-800"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        title="비밀번호 변경"
                        onClick={() => void resetPassword(member)}
                        className="text-amber-500 mr-3 hover:text-amber-700"
                      >
                        <Key size={16} />
                      </button>
                      <button
                        title="삭제"
                        disabled={currentUser?.id === member.id}
                        onClick={() => void deleteMember(member)}
                        className="text-red-500 disabled:opacity-30 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50">
          <p className="text-sm text-slate-500">
            총 {pagination.total}명
          </p>
          <div className="flex items-center gap-2 text-sm">
            <button
              disabled={pagination.page <= 1}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white disabled:opacity-50"
            >
              이전
            </button>
            <span className="px-3 text-slate-600">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white disabled:opacity-50"
            >
              다음
            </button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingMember && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <form
              onSubmit={saveMember}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">회원정보 수정</h2>
                  <p className="text-sm text-slate-500 mt-1">{editingMember.loginId}</p>
                </div>
                <button type="button" onClick={closeEdit} className="text-slate-400">
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <MemberInput
                  label="이름"
                  value={editForm.name}
                  onChange={(value) => setEditForm({ ...editForm, name: value })}
                />
                <MemberInput
                  label="닉네임"
                  value={editForm.nickname}
                  onChange={(value) => setEditForm({ ...editForm, nickname: value })}
                />
                <MemberInput
                  label="휴대전화"
                  value={editForm.mobile}
                  onChange={(value) => setEditForm({ ...editForm, mobile: value })}
                />
                <MemberInput
                  label="일반전화"
                  value={editForm.phone}
                  onChange={(value) => setEditForm({ ...editForm, phone: value })}
                />

                <div>
                  <label className="block font-bold mb-1">생년월일</label>
                  <input
                    type="date"
                    value={editForm.dob}
                    onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">회원레벨</label>
                  <select
                    value={editForm.level}
                    onChange={(e) => setEditForm({ ...editForm, level: Number(e.target.value) })}
                    className={inputClass}
                  >
                    {Array.from({ length: 10 }, (_, index) => index + 1).map((level) => (
                      <option key={level} value={level}>
                        {getLevelName(level)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <MemberInput
                    label="주소"
                    value={editForm.address}
                    onChange={(value) => setEditForm({ ...editForm, address: value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeEdit}
                  className="w-full bg-slate-100 text-slate-700 font-bold py-3 rounded-lg hover:bg-slate-200"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-black disabled:opacity-50"
                >
                  {saving ? '저장 중...' : '수정사항 저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <p className="text-sm font-bold text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-extrabold text-slate-900">{value.toLocaleString()}</p>
    </div>
  );
}

function MemberInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="block font-bold mb-1">{label}</label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      />
    </div>
  );
}