import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import TeacherNav from '../../components/teacher/TeacherNav';
import {
  Users,
  UserPlus,
  RotateCcw,
  Edit2,
  Trash2,
  Check,
  X,
  Search,
  Filter,
  KeyRound,
  GraduationCap,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

export default function TeacherRoster() {
  const {
    studentRoster,
    classList,
    handleAddStudent,
    updateStudentAction,
    deleteStudentAction,
    handleResetPassword,
    promoteStudentsAction,
    refreshStudents,
    questions,
    portfolios,
    showToast,
  } = useApp();

  const [filterClass, setFilterClass] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // 신규 등록 폼 상태
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newClass, setNewClass] = useState(classList[0] || 'M6');
  const [newName, setNewName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // 수정 중인 학생 상태: { oldClass, oldName, newClass, newName }
  const [editingStudent, setEditingStudent] = useState(null);
  const [resettingKey, setResettingKey] = useState(null);

  // 동기화 & 진급 처리 상태
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);

  // 학급 목록 (alumni 졸업생 포함)
  const availableClasses = Array.from(
    new Set([...classList, ...studentRoster.map((s) => s.grade_class)])
  ).filter(Boolean);

  // 검색 및 학급 필터링
  const displayedStudents = studentRoster.filter((s) => {
    const matchClass = filterClass === 'ALL' || s.grade_class === filterClass;
    const matchName = s.student_name.toLowerCase().includes(searchTerm.trim().toLowerCase());
    return matchClass && matchName;
  });

  // 구글 시트 즉시 실시간 동기화
  const onManualSync = async () => {
    setIsSyncing(true);
    try {
      await refreshStudents(true);
      showToast('구글 시트의 최신 학생 명렬표로 즉시 동기화되었습니다!', 'success');
    } catch (e) {
      showToast('동기화 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // 신규 학생 추가
  const onAddSubmit = async (e) => {
    e.preventDefault();
    if (!newName.trim()) {
      showToast('학생 이름을 입력해 주세요.', 'error');
      return;
    }
    setIsAdding(true);
    const res = await handleAddStudent(newClass, newName.trim());
    setIsAdding(false);
    if (res.success) {
      setNewName('');
      setIsAddOpen(false);
    }
  };

  // 학생 정보 수정 저장
  const onEditSave = async () => {
    if (!editingStudent.newName.trim()) {
      showToast('학생 이름을 입력해 주세요.', 'error');
      return;
    }
    const res = await updateStudentAction(
      editingStudent.oldClass,
      editingStudent.oldName,
      editingStudent.newClass,
      editingStudent.newName.trim()
    );
    if (res.success) {
      setEditingStudent(null);
    }
  };

  // 학생 삭제 (전출)
  const onDeleteClick = async (gradeClass, studentName) => {
    if (!window.confirm(`${gradeClass} ${studentName} 학생을 명렬표에서 정말 삭제하시겠습니까?\n(작성된 질문 및 포트폴리오도 함께 삭제될 수 있습니다)`)) {
      return;
    }
    await deleteStudentAction(gradeClass, studentName);
  };

  // 학생 비밀번호 1234 리셋
  const onResetClick = async (gradeClass, studentName) => {
    if (!window.confirm(`${gradeClass} ${studentName} 학생의 비밀번호를 기본 '1234'로 리셋하시겠습니까?`)) {
      return;
    }
    const key = `${gradeClass}-${studentName}`;
    setResettingKey(key);
    await handleResetPassword(gradeClass, studentName);
    setResettingKey(null);
  };

  // 학년 일괄 진급 실행
  const onExecutePromotion = async () => {
    setIsPromoting(true);
    try {
      const res = await promoteStudentsAction();
      setIsPromoteModalOpen(false);
    } catch (e) {
      showToast('진급 처리 오류', 'error');
    } finally {
      setIsPromoting(false);
    }
  };

  return (
    <div className="space-y-4 pb-16 animate-fadeIn">
      <TeacherNav />

      {/* 헤더 & 상단 액션 버튼 그룹 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <Users className="w-5 h-5 text-eureka-600" />
            <span>Student Roster (학생 명렬표) 관리</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            총 <span className="font-extrabold text-eureka-700">{studentRoster.length}명</span>의 학생이 등록되어 있습니다. (실시간 구글 시트 연동)
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* 구글 시트 즉시 동기화 버튼 */}
          <button
            onClick={onManualSync}
            disabled={isSyncing}
            title="구글 시트와 즉시 동기화"
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-eureka-600' : ''}`} />
            <span>{isSyncing ? '동기화 중...' : '시트 동기화'}</span>
          </button>

          {/* 학년 일괄 진급 버튼 */}
          <button
            onClick={() => setIsPromoteModalOpen(true)}
            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-extrabold transition flex items-center space-x-1.5 shadow-xs"
          >
            <GraduationCap className="w-4 h-4 text-indigo-600" />
            <span>학년 일괄 진급</span>
          </button>

          {/* 신규 학생 등록 버튼 (전입생) */}
          <button
            onClick={() => setIsAddOpen(!isAddOpen)}
            className="px-3 py-1.5 bg-eureka-600 hover:bg-eureka-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>신규 학생 등록</span>
          </button>
        </div>
      </div>

      {/* 신규 학생 추가 패널 (전입생 등록) */}
      {isAddOpen && (
        <form
          onSubmit={onAddSubmit}
          className="p-4 bg-eureka-50/90 border border-eureka-200 rounded-3xl space-y-3 text-xs animate-fadeIn shadow-xs"
        >
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-eureka-900 flex items-center space-x-1.5">
              <UserPlus className="w-4 h-4 text-eureka-600" />
              <span>새 학생 명단 추가 (전입생 / 신규 M6 등록, 기본 비밀번호: 1234)</span>
            </h4>
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">학급 (반)</label>
              <select
                value={newClass}
                onChange={(e) => setNewClass(e.target.value)}
                className="w-full p-2 bg-white border border-eureka-300 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-eureka-500"
              >
                {classList.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls} 반
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">학생 이름</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="예: 홍길동"
                className="w-full p-2 bg-white border border-eureka-300 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-eureka-500"
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isAdding}
              className="px-4 py-1.5 bg-eureka-600 text-white rounded-xl font-extrabold shadow-sm hover:bg-eureka-700 transition disabled:opacity-50"
            >
              {isAdding ? '추가 중...' : '명렬표에 추가하기'}
            </button>
          </div>
        </form>
      )}

      {/* 필터 및 검색 바 */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-2">
        <div className="flex items-center space-x-1.5 flex-1 max-w-xs bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="학생 이름 검색..."
            className="w-full bg-transparent text-xs font-semibold focus:outline-none"
          />
        </div>

        <select
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
          className="px-2.5 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none shrink-0"
        >
          <option value="ALL">전체 학급</option>
          {availableClasses.map((cls) => (
            <option key={cls} value={cls}>
              {cls === 'alumni' ? 'alumni (졸업생 보관)' : `${cls} 반`}
            </option>
          ))}
        </select>
      </div>

      {/* 학생 목록 테이블/카드 */}
      <div className="space-y-2">
        {displayedStudents.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-dashed border-slate-300 text-center text-xs text-slate-400">
            조건에 일치하는 학생이 없습니다.
          </div>
        ) : (
          displayedStudents.map((s, idx) => {
            const isEditing =
              editingStudent?.oldClass === s.grade_class &&
              editingStudent?.oldName === s.student_name;
            const key = `${s.grade_class}-${s.student_name}`;
            const isResetting = resettingKey === key;

            const qCount = questions.filter((q) => q.student_name === s.student_name).length;
            const pCount = portfolios.filter((p) => p.student_name === s.student_name).length;

            return (
              <div
                key={idx}
                className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-2 hover:border-slate-300 transition"
              >
                {isEditing ? (
                  /* 수정 모드 인라인 폼 */
                  <div className="flex items-center space-x-2 flex-1">
                    <select
                      value={editingStudent.newClass}
                      onChange={(e) =>
                        setEditingStudent({ ...editingStudent, newClass: e.target.value })
                      }
                      className="p-1 text-xs border border-slate-300 rounded-lg font-bold"
                    >
                      {classList.map((cls) => (
                        <option key={cls} value={cls}>
                          {cls}
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      value={editingStudent.newName}
                      onChange={(e) =>
                        setEditingStudent({ ...editingStudent, newName: e.target.value })
                      }
                      className="p-1 text-xs border border-slate-300 rounded-lg font-bold flex-1 max-w-[120px]"
                      autoFocus
                    />

                    <button
                      onClick={onEditSave}
                      className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                      title="저장"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingStudent(null)}
                      className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg"
                      title="취소"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  /* 기본 정보 표시 */
                  <div className="flex items-center space-x-2.5">
                    <span className={`text-white font-black text-[10px] px-2 py-0.5 rounded-md ${
                      s.grade_class === 'alumni' ? 'bg-purple-700' : 'bg-slate-800'
                    }`}>
                      {s.grade_class === 'alumni' ? 'alumni (졸업생)' : s.grade_class}
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {s.student_name}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      (질문 {qCount}건 · 일지 {pCount}편)
                    </span>
                  </div>
                )}

                {/* 우측 조작 액션 (수정, 비번 리셋, 삭제) */}
                {!isEditing && (
                  <div className="flex items-center space-x-1 shrink-0">
                    {/* 비밀번호 1234 리셋 */}
                    <button
                      onClick={() => onResetClick(s.grade_class, s.student_name)}
                      disabled={isResetting}
                      title="비밀번호 1234로 초기화"
                      className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-[10px] font-bold flex items-center space-x-1 transition disabled:opacity-50"
                    >
                      <RotateCcw className={`w-3 h-3 ${isResetting ? 'animate-spin' : ''}`} />
                      <span className="hidden sm:inline">1234 리셋</span>
                    </button>

                    {/* 정보 수정 (반/이름 변경) */}
                    <button
                      onClick={() =>
                        setEditingStudent({
                          oldClass: s.grade_class,
                          oldName: s.student_name,
                          newClass: s.grade_class,
                          newName: s.student_name,
                        })
                      }
                      title="정보 수정"
                      className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* 학생 삭제 (전출) */}
                    <button
                      onClick={() => onDeleteClick(s.grade_class, s.student_name)}
                      title="학생 삭제"
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 학년 일괄 진급 확인 모달 */}
      {isPromoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-100">
            <div className="flex items-center space-x-2.5 text-indigo-600">
              <div className="p-2.5 bg-indigo-50 rounded-2xl">
                <GraduationCap className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">1년 주기 학년 일괄 진급</h3>
                <p className="text-xs text-slate-500">모든 재학생의 반이 1년 진급 처리됩니다.</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
              <div className="font-extrabold text-slate-800 flex items-center space-x-1.5">
                <ArrowRight className="w-3.5 h-3.5 text-indigo-600" />
                <span>진급 규칙 안내:</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 pl-2 text-[11px] font-semibold text-slate-600">
                <div>• M6 ➔ <span className="font-bold text-indigo-600">M7</span></div>
                <div>• M7 ➔ <span className="font-bold text-indigo-600">M8</span></div>
                <div>• M8 ➔ <span className="font-bold text-indigo-600">H9</span></div>
                <div>• H9 ➔ <span className="font-bold text-indigo-600">H10</span></div>
                <div>• H10 ➔ <span className="font-bold text-indigo-600">H11</span></div>
                <div>• H11 ➔ <span className="font-bold text-indigo-600">H12</span></div>
                <div className="col-span-2">• H12 ➔ <span className="font-bold text-purple-700">alumni (졸업생 보관)</span></div>
              </div>
              <div className="pt-1.5 border-t border-slate-200 text-purple-800 font-bold text-[11px] flex items-start space-x-1 leading-relaxed">
                <span>🎓 <strong>H12 학생은 삭제되지 않고 'alumni'(졸업생) 클래스로 안전하게 영구 보관</strong>됩니다. 일반 학생 로그인 및 화면에서는 보이지 않으며, 교사 화면에서만 언제든지 이전 자료를 조회할 수 있습니다.</span>
              </div>
              <div className="text-slate-500 text-[11px]">
                💡 신규 M6 학생은 진급 완료 후 <strong>[신규 학생 등록]</strong> 버튼으로 직접 등록해 주시면 됩니다.
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsPromoteModalOpen(false)}
                disabled={isPromoting}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={onExecutePromotion}
                disabled={isPromoting}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md transition flex items-center space-x-1.5 disabled:opacity-50"
              >
                {isPromoting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>진급 처리 중...</span>
                  </>
                ) : (
                  <>
                    <GraduationCap className="w-4 h-4" />
                    <span>진급 실행하기</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
