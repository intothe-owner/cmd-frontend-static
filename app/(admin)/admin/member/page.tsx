'use client';

import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from 'react';

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
  if (level === 10) {
    return '최고관리자';
  }

  if (level === 9) {
    return '관리자';
  }

  return `회원 레벨 ${level}`;
}

export default function MemberManagementPage() {
  const [members, setMembers] =
    useState<Member[]>([]);

  const [summary, setSummary] =
    useState<Summary>(EMPTY_SUMMARY);

  const [pagination, setPagination] =
    useState<Pagination>({
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 1,
    });

  const [currentUser, setCurrentUser] =
    useState<CurrentUser | null>(null);

  const [searchInput, setSearchInput] =
    useState('');

  const [search, setSearch] =
    useState('');

  const [levelFilter, setLevelFilter] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [editingMember, setEditingMember] =
    useState<Member | null>(null);

  const [editForm, setEditForm] =
    useState<EditForm | null>(null);

  useEffect(() => {
    const storedUser =
      localStorage.getItem('user');

    if (!storedUser) {
      return;
    }

    try {
      const parsed =
        JSON.parse(storedUser) as CurrentUser;

      setCurrentUser(parsed);
    } catch {
      setCurrentUser(null);
    }
  }, []);

  const loadMembers =
    useCallback(async () => {
      setLoading(true);

      try {
        const params =
          new URLSearchParams({
            page: String(pagination.page),
            limit: String(pagination.limit),
          });

        if (search) {
          params.set('search', search);
        }

        if (levelFilter) {
          params.set(
            'level',
            levelFilter
          );
        }

        const data =
          await adminMemberApi<MemberListResponse>(
            `/api/admin/members?${params.toString()}`
          );

        setMembers(data.members);
        setPagination(data.pagination);
        setSummary(data.summary);
      } catch (error) {
        alert(
          error instanceof
            AdminMemberApiError
            ? error.message
            : '회원 목록을 불러오지 못했습니다.'
        );
      } finally {
        setLoading(false);
      }
    }, [
      pagination.page,
      pagination.limit,
      search,
      levelFilter,
    ]);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  const handleSearch = (
    event: FormEvent
  ) => {
    event.preventDefault();

    setPagination((previous) => ({
      ...previous,
      page: 1,
    }));

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
    if (saving) {
      return;
    }

    setEditingMember(null);
    setEditForm(null);
  };

  const saveMember = async (
    event: FormEvent
  ) => {
    event.preventDefault();

    if (!editingMember || !editForm) {
      return;
    }

    if (!editForm.name.trim()) {
      alert('회원 이름을 입력해 주세요.');
      return;
    }

    setSaving(true);

    try {
      const data =
        await adminMemberApi<{
          success: boolean;
          message: string;
          member: Member;
        }>(
          `/api/admin/members/${editingMember.id}`,
          {
            method: 'PATCH',

            body: JSON.stringify({
              name: editForm.name,
              nickname: editForm.nickname,
              phone: editForm.phone,
              mobile: editForm.mobile,
              address: editForm.address,
              dob: editForm.dob || null,
              level: Number(
                editForm.level
              ),
            }),
          }
        );

      /*
       * 본인 이름 또는 레벨을 수정한 경우
       * 브라우저의 회원정보도 갱신
       */
      if (
        currentUser?.id === data.member.id
      ) {
        const oldUserText =
          localStorage.getItem('user');

        if (oldUserText) {
          try {
            const oldUser =
              JSON.parse(oldUserText);

            localStorage.setItem(
              'user',
              JSON.stringify({
                ...oldUser,
                name: data.member.name,
                level: data.member.level,
              })
            );
          } catch {
            // 잘못된 로컬 데이터면 무시
          }
        }
      }

      alert(data.message);

      closeEdit();

      await loadMembers();
    } catch (error) {
      alert(
        error instanceof
          AdminMemberApiError
          ? error.message
          : '회원정보 수정에 실패했습니다.'
      );
    } finally {
      setSaving(false);
    }
  };

  const resetPassword = async (
    member: Member
  ) => {
    const password = window.prompt(
      `${member.name} 회원의 새 비밀번호를 입력하세요.\n8자 이상 입력해야 합니다.`
    );

    if (password === null) {
      return;
    }

    if (password.length < 8) {
      alert(
        '비밀번호는 8자 이상 입력해 주세요.'
      );
      return;
    }

    try {
      const data =
        await adminMemberApi<{
          success: boolean;
          message: string;
        }>(
          `/api/admin/members/${member.id}/reset-password`,
          {
            method: 'POST',

            body: JSON.stringify({
              password,
            }),
          }
        );

      alert(data.message);
    } catch (error) {
      alert(
        error instanceof
          AdminMemberApiError
          ? error.message
          : '비밀번호 변경에 실패했습니다.'
      );
    }
  };

  const deleteMember = async (
    member: Member
  ) => {
    const confirmed = window.confirm(
      `${member.name} 회원을 삭제하시겠습니까?\n\n현재 DB에는 회원상태 필드가 없으므로 실제 회원정보가 삭제됩니다.`
    );

    if (!confirmed) {
      return;
    }

    try {
      const data =
        await adminMemberApi<{
          success: boolean;
          message: string;
        }>(
          `/api/admin/members/${member.id}`,
          {
            method: 'DELETE',
          }
        );

      alert(data.message);

      await loadMembers();
    } catch (error) {
      alert(
        error instanceof
          AdminMemberApiError
          ? error.message
          : '회원 삭제에 실패했습니다.'
      );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">
          회원 관리
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          회원정보, 회원레벨, 비밀번호를
          관리합니다.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          title="전체 회원"
          value={summary.total}
        />

        <SummaryCard
          title="일반 회원"
          value={summary.normalMembers}
        />

        <SummaryCard
          title="관리자"
          value={summary.administrators}
        />
      </div>

      <form
        onSubmit={handleSearch}
        className="flex flex-wrap gap-3 rounded-2xl border bg-white p-4"
      >
        <input
          type="search"
          value={searchInput}
          onChange={(event) =>
            setSearchInput(
              event.target.value
            )
          }
          placeholder="아이디, 이름, 닉네임, 연락처 검색"
          className="min-w-[260px] flex-1 rounded-xl border px-4 py-2.5"
        />

        <select
          value={levelFilter}
          onChange={(event) => {
            setLevelFilter(
              event.target.value
            );

            setPagination(
              (previous) => ({
                ...previous,
                page: 1,
              })
            );
          }}
          className="rounded-xl border px-4 py-2.5"
        >
          <option value="">
            전체 레벨
          </option>

          {Array.from(
            { length: 10 },
            (_, index) => index + 1
          ).map((level) => (
            <option
              key={level}
              value={level}
            >
              {getLevelName(level)}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="rounded-xl bg-indigo-600 px-5 py-2.5 font-bold text-white"
        >
          검색
        </button>

        <button
          type="button"
          onClick={() => {
            setSearchInput('');
            setSearch('');
            setLevelFilter('');

            setPagination(
              (previous) => ({
                ...previous,
                page: 1,
              })
            );
          }}
          className="rounded-xl border px-5 py-2.5 font-bold"
        >
          초기화
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border bg-white">
        <table className="min-w-full">
          <thead className="border-b bg-slate-50 text-left text-sm">
            <tr>
              <th className="px-4 py-3">
                번호
              </th>
              <th className="px-4 py-3">
                회원
              </th>
              <th className="px-4 py-3">
                연락처
              </th>
              <th className="px-4 py-3">
                회원레벨
              </th>
              <th className="px-4 py-3">
                가입방식
              </th>
              <th className="px-4 py-3 text-right">
                관리
              </th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-16 text-center"
                >
                  회원정보를 불러오고 있습니다.
                </td>
              </tr>
            ) : members.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-16 text-center text-slate-500"
                >
                  검색된 회원이 없습니다.
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <tr
                  key={member.id}
                  className="border-b"
                >
                  <td className="px-4 py-4">
                    {member.id}
                  </td>

                  <td className="px-4 py-4">
                    <p className="font-bold">
                      {member.name}

                      {currentUser?.id ===
                        member.id && (
                        <span className="ml-2 text-xs text-indigo-600">
                          본인
                        </span>
                      )}
                    </p>

                    <p className="text-sm text-slate-500">
                      {member.loginId}
                    </p>

                    {member.nickname && (
                      <p className="text-xs text-slate-400">
                        {member.nickname}
                      </p>
                    )}
                  </td>

                  <td className="px-4 py-4 text-sm">
                    <p>
                      {member.mobile || '-'}
                    </p>

                    <p className="text-slate-400">
                      {member.phone || ''}
                    </p>
                  </td>

                  <td className="px-4 py-4">
                    <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-sm font-bold text-indigo-700">
                      {getLevelName(
                        member.level
                      )}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    {member.snsProvider}
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          openEdit(member)
                        }
                        className="rounded-lg border px-3 py-1.5 text-sm font-bold"
                      >
                        수정
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          void resetPassword(
                            member
                          )
                        }
                        className="rounded-lg border border-amber-300 px-3 py-1.5 text-sm font-bold text-amber-700"
                      >
                        비밀번호
                      </button>

                      <button
                        type="button"
                        disabled={
                          currentUser?.id ===
                          member.id
                        }
                        onClick={() =>
                          void deleteMember(
                            member
                          )
                        }
                        className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-bold text-red-600 disabled:opacity-30"
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="flex items-center justify-between px-4 py-4">
          <p className="text-sm text-slate-500">
            총 {pagination.total}명
          </p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={
                pagination.page <= 1
              }
              onClick={() =>
                setPagination(
                  (previous) => ({
                    ...previous,
                    page:
                      previous.page - 1,
                  })
                )
              }
              className="rounded-lg border px-3 py-1.5 disabled:opacity-30"
            >
              이전
            </button>

            <span>
              {pagination.page} /{' '}
              {pagination.totalPages}
            </span>

            <button
              type="button"
              disabled={
                pagination.page >=
                pagination.totalPages
              }
              onClick={() =>
                setPagination(
                  (previous) => ({
                    ...previous,
                    page:
                      previous.page + 1,
                  })
                )
              }
              className="rounded-lg border px-3 py-1.5 disabled:opacity-30"
            >
              다음
            </button>
          </div>
        </div>
      </div>

      {editingMember && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={saveMember}
            className="max-h-[90vh] w-full max-w-2xl space-y-5 overflow-y-auto rounded-2xl bg-white p-6"
          >
            <div>
              <h2 className="text-xl font-black">
                회원정보 수정
              </h2>

              <p className="text-sm text-slate-500">
                {editingMember.loginId}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <MemberInput
                label="이름"
                value={editForm.name}
                onChange={(value) =>
                  setEditForm({
                    ...editForm,
                    name: value,
                  })
                }
              />

              <MemberInput
                label="닉네임"
                value={editForm.nickname}
                onChange={(value) =>
                  setEditForm({
                    ...editForm,
                    nickname: value,
                  })
                }
              />

              <MemberInput
                label="휴대전화"
                value={editForm.mobile}
                onChange={(value) =>
                  setEditForm({
                    ...editForm,
                    mobile: value,
                  })
                }
              />

              <MemberInput
                label="일반전화"
                value={editForm.phone}
                onChange={(value) =>
                  setEditForm({
                    ...editForm,
                    phone: value,
                  })
                }
              />

              <label>
                <span className="mb-1 block text-sm font-bold">
                  생년월일
                </span>

                <input
                  type="date"
                  value={editForm.dob}
                  onChange={(event) =>
                    setEditForm({
                      ...editForm,
                      dob:
                        event.target.value,
                    })
                  }
                  className="w-full rounded-xl border px-3 py-2.5"
                />
              </label>

              <label>
                <span className="mb-1 block text-sm font-bold">
                  회원레벨
                </span>

                <select
                  value={editForm.level}
                  onChange={(event) =>
                    setEditForm({
                      ...editForm,
                      level: Number(
                        event.target.value
                      ),
                    })
                  }
                  className="w-full rounded-xl border px-3 py-2.5"
                >
                  {Array.from(
                    { length: 10 },
                    (_, index) =>
                      index + 1
                  ).map((level) => (
                    <option
                      key={level}
                      value={level}
                    >
                      {getLevelName(level)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <MemberInput
              label="주소"
              value={editForm.address}
              onChange={(value) =>
                setEditForm({
                  ...editForm,
                  address: value,
                })
              }
            />

            <div className="flex justify-end gap-3 border-t pt-5">
              <button
                type="button"
                onClick={closeEdit}
                className="rounded-xl border px-5 py-2.5 font-bold"
              >
                취소
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 font-bold text-white disabled:opacity-50"
              >
                {saving
                  ? '저장 중...'
                  : '수정사항 저장'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border bg-white p-5">
      <p className="text-sm font-bold text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-3xl font-black">
        {value}
      </p>
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
    <label>
      <span className="mb-1 block text-sm font-bold">
        {label}
      </span>

      <input
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-xl border px-3 py-2.5"
      />
    </label>
  );
}