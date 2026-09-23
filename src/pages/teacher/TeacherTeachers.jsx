import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import TeacherNav from '../../components/teacher/TeacherNav';
import {
  ShieldCheck,
  UserPlus,
  KeyRound,
  Edit2,
  Trash2,
  Search,
  Check,
  X,
  Crown,
  UserCheck
} from 'lucide-react';

export default function TeacherTeachers() {
  const {
    teacherList,
    currentTeacher,
    addTeacherAction,
    updateTeacherAction,
    deleteTeacherAction,
    showToast,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('teacher');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 수정 모달 상태
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPassword, setEditPassword] = useState('');

  const filteredTeachers = (teacherList || []).filter((t) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return (
      (t.teacher_name || '').toLowerCase().includes(term) ||
      (t.teacher_id || '').toLowerCase().includes(term)
    );
  });

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newId.trim()) {
      showToast('교사 ID를 입력해 주세요.', 'error');
      return;
    }
    if (!newName.trim()) {
      showToast('교사 이름을 입력해 주세요.', 'error');
      return;
    }
    if (!newPassword.trim()) {
      showToast('비밀번호를 입력해 주세요.', 'error');
      return;
    }

    setIsSubmitting(true);
    const res = await addTeacherAction({
      teacher_id: newId.trim(),
      teacher_name: newName.trim(),
      password: newPassword.trim(),
      role: newRole,
    });
    setIsSubmitting(false);

    if (res.success) {
      setNewId('');
      setNewName('');
      setNewPassword('');
      setNewRole('teacher');
      setIsAddModalOpen(false);
    }
  };

  const startEdit = (teacher) => {
    setEditingTeacher(teacher);
    setEditName(teacher.teacher_name || '');
    setEditPassword('');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingTeacher) return;

    const payload = {
      teacher_id: editingTeacher.teacher_id,
      teacher_name: editName.trim() || editingTeacher.teacher_name,
    };
    if (editPassword.trim()) {
      payload.password = editPassword.trim();
    }

    setIsSubmitting(true);
    const res = await updateTeacherAction(payload);
    setIsSubmitting(false);

    if (res.success) {
      setEditingTeacher(null);
    }
  };

  const handleDelete = async (teacher) => {
    if (teacher.teacher_id === 'hwang') {
      showToast('슈퍼관리자(황규문 선생님) 계정은 삭제할 수 없습니다.', 'error');
      return;
    }
    if (
      window.confirm(
        `정말로 '${teacher.teacher_name}' 선생님 (${teacher.teacher_id}) 계정을 삭제하시겠습니까?`
      )
    ) {
      await deleteTeacherAction(teacher.teacher_id);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      <TeacherNav />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 상단 헤더 & 컨트롤 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                교사 명렬표 관리 (Teacher Roster)
              </h1>
            </div>
            <p className="text-sm text-slate-500">
              동료 교사 계정 추가, 비밀번호 수정 및 권한 관리 (총 {teacherList.length}명)
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-sm shadow-md shadow-amber-600/20 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            신규 교사 등록
          </button>
        </div>

        {/* 안내 카드 */}
        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 sm:p-5 mb-6 flex items-start gap-3">
          <Crown className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-amber-900">
            <span className="font-bold">기본 슈퍼관리자(Superuser):</span> 황규문 선생님(ID:{' '}
            <code className="bg-amber-200/60 px-1.5 py-0.5 rounded font-mono font-bold">hwang</code>) 계정은
            시스템 안전을 위해 삭제할 수 없으며, 모든 관리 권한을 보유합니다. 다른 과학과 동료 선생님들께서도
            자신만의 계정으로 접속하여 탐구 질문 승인 및 도장 평가를 수행하실 수 있습니다.
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="교사 이름 또는 ID 검색..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
            />
          </div>
          <div className="text-xs text-slate-500 font-medium">
            검색 결과: <strong className="text-slate-800">{filteredTeachers.length}</strong>명
          </div>
        </div>

        {/* 교사 목록 테이블 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">교사 ID</th>
                  <th className="py-3.5 px-4">교사 성명</th>
                  <th className="py-3.5 px-4">권한 / 역할</th>
                  <th className="py-3.5 px-4">등록일시</th>
                  <th className="py-3.5 px-4 text-right">계정 관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTeachers.map((teacher) => {
                  const isHwang = teacher.teacher_id === 'hwang';
                  const isMe = currentTeacher?.teacher_id === teacher.teacher_id;

                  return (
                    <tr
                      key={teacher.teacher_id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isHwang ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          {isHwang && <Crown className="w-4 h-4 text-amber-500 flex-shrink-0" />}
                          <span>{teacher.teacher_id}</span>
                          {isMe && (
                            <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-sans">
                              (나)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {teacher.teacher_name} 선생님
                      </td>
                      <td className="py-3 px-4">
                        {isHwang || teacher.role === 'superuser' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <Crown className="w-3 h-3" />
                            슈퍼관리자
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <UserCheck className="w-3 h-3" />
                            교사
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-400 font-mono">
                        {teacher.created_at || '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => startEdit(teacher)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                            title="정보/비밀번호 수정"
                          >
                            <Edit2 className="w-3 h-3" />
                            수정
                          </button>

                          {isHwang ? (
                            <span
                              className="px-2.5 py-1 text-xs font-medium text-slate-400 bg-slate-50 rounded-lg cursor-not-allowed border border-dashed border-slate-200"
                              title="슈퍼관리자는 삭제할 수 없습니다"
                            >
                              삭제 불가
                            </span>
                          ) : (
                            <button
                              onClick={() => handleDelete(teacher)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition"
                              title="교사 계정 삭제"
                            >
                              <Trash2 className="w-3 h-3" />
                              삭제
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredTeachers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      일치하는 교사 계정이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 신규 등록 모달 */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-amber-600" />
                  신규 교사 계정 등록
                </h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    교사 아이디 (ID) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newId}
                    onChange={(e) => setNewId(e.target.value)}
                    placeholder="예: kim_science"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1">영문, 숫자 조합 권장</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    교사 성명 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="예: 김선생"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    초기 비밀번호 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="초기 접속 비밀번호 (예: 1234)"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">역할 권한</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  >
                    <option value="teacher">일반 교사 (질문 승인 & 도장 평가)</option>
                    <option value="superuser">슈퍼관리자 (교사 명렬표 및 전권 관리)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md transition disabled:opacity-50"
                  >
                    {isSubmitting ? '등록 중...' : '등록 완료'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 정보 수정 모달 */}
        {editingTeacher && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-amber-600" />
                  교사 정보 수정 ({editingTeacher.teacher_id})
                </h3>
                <button
                  onClick={() => setEditingTeacher(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">교사 성명</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    새 비밀번호 변경 (선택)
                  </label>
                  <input
                    type="text"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="비워둘 경우 기존 비밀번호 유지"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    변경할 새 비밀번호를 입력하거나, 유지하려면 비워두세요.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setEditingTeacher(null)}
                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md transition disabled:opacity-50"
                  >
                    {isSubmitting ? '저장 중...' : '변경 사항 저장'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
