import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { getGasApiUrl, setGasApiUrl } from '../../services/api';
import {
  X,
  Database,
  Check,
  AlertCircle,
  ShieldCheck,
  Users,
  RotateCcw,
  UserPlus,
  Plus
} from 'lucide-react';

export default function SettingsModal({ isOpen, onClose }) {
  const {
    isTeacherMode,
    toggleTeacherMode,
    showToast,
    refreshQuestions,
    studentRoster,
    classList,
    handleResetPassword,
    handleAddStudent,
  } = useApp();

  const [activeTab, setActiveTab] = useState('roster'); // 'roster' | 'sheet'
  const [filterClass, setFilterClass] = useState('ALL');
  const [gasUrl, setGasUrlInput] = useState(getGasApiUrl());
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [resettingId, setResettingId] = useState(null);

  // 새 학생 추가 폼 상태
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [newStudentClass, setNewStudentClass] = useState(classList[0] || 'M6');
  const [newStudentName, setNewStudentName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  if (!isOpen) return null;

  const handleSaveUrl = () => {
    setGasApiUrl(gasUrl.trim());
    showToast('구글 시트 연동 설정이 저장되었습니다.', 'success');
    refreshQuestions();
  };

  const handleTestConnection = async () => {
    if (!gasUrl.trim()) {
      setTestResult({ success: false, message: 'URL을 먼저 입력해주세요.' });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`${gasUrl.trim()}?action=getStudents`);
      const json = await res.json();
      if (json.success) {
        setTestResult({
          success: true,
          message: `연결 성공! (학생 ${json.data?.length || 0}명 발견)`,
        });
      } else {
        setTestResult({ success: false, message: `연결 실패: ${json.error || '응답 오류'}` });
      }
    } catch (e) {
      setTestResult({
        success: false,
        message: '연결 실패: 웹앱 배포 시 "모든 사용자(Anyone)" 권한을 주었는지 확인해주세요.',
      });
    } finally {
      setTesting(false);
    }
  };

  const onResetStudent = async (gradeClass, studentName) => {
    if (!window.confirm(`${gradeClass} ${studentName} 학생의 비밀번호를 '1234'로 초기화하시겠습니까?`)) {
      return;
    }
    const key = `${gradeClass}-${studentName}`;
    setResettingId(key);
    await handleResetPassword(gradeClass, studentName);
    setResettingId(null);
  };

  const onSubmitAddStudent = async (e) => {
    e.preventDefault();
    const name = newStudentName.trim();
    if (!name) {
      showToast('학생 이름을 입력해 주세요.', 'error');
      return;
    }
    setIsAdding(true);
    const res = await handleAddStudent(newStudentClass, name);
    setIsAdding(false);
    if (res.success) {
      setNewStudentName('');
      setIsAddFormOpen(false);
    }
  };

  const displayedStudents =
    filterClass === 'ALL'
      ? studentRoster
      : studentRoster.filter((s) => s.grade_class === filterClass);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-sm sm:max-w-md w-full p-5 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b pb-3 shrink-0">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-amber-600" />
            <h3 className="font-extrabold text-slate-800 text-sm">선생님 관리창 & 설정</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 탭 네비게이션 */}
        <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-2xl shrink-0">
          <button
            onClick={() => setActiveTab('roster')}
            className={`py-2 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1 ${
              activeTab === 'roster'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-eureka-600" />
            <span>학생 명렬표 & 관리</span>
          </button>
          <button
            onClick={() => setActiveTab('sheet')}
            className={`py-2 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1 ${
              activeTab === 'sheet'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-blue-600" />
            <span>구글 시트 연동 설정</span>
          </button>
        </div>

        {/* 탭 1: 학생 명렬표 & 리셋 & 학생 추가 */}
        {activeTab === 'roster' && (
          <div className="space-y-3 overflow-y-auto flex-1 pr-1">
            {/* 상단 컨트롤: 필터 및 학생 추가 토글 */}
            <div className="flex items-center justify-between">
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="px-2.5 py-1 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
              >
                <option value="ALL">전체 학급 ({studentRoster.length}명)</option>
                {classList.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls} 반
                  </option>
                ))}
              </select>

              <button
                onClick={() => setIsAddFormOpen(!isAddFormOpen)}
                className="text-xs font-bold px-2.5 py-1 rounded-lg bg-eureka-50 text-eureka-700 hover:bg-eureka-100 flex items-center space-x-1 transition"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ 학생 추가</span>
              </button>
            </div>

            {/* 학생 추가 폼 */}
            {isAddFormOpen && (
              <form
                onSubmit={onSubmitAddStudent}
                className="p-3 bg-eureka-50/70 border border-eureka-200 rounded-2xl space-y-2 text-xs animate-fadeIn"
              >
                <p className="font-extrabold text-eureka-900 flex items-center space-x-1">
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>새 학생 등록 (기본 비번: 1234)</span>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={newStudentClass}
                    onChange={(e) => setNewStudentClass(e.target.value)}
                    className="p-2 bg-white border border-eureka-300 rounded-xl font-bold"
                  >
                    {classList.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls} 반
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    placeholder="학생 이름"
                    className="p-2 bg-white border border-eureka-300 rounded-xl font-bold focus:outline-none"
                    required
                  />
                </div>
                <div className="flex items-center space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddFormOpen(false)}
                    className="flex-1 py-1.5 bg-white text-slate-500 rounded-xl font-bold border border-slate-200"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={isAdding}
                    className="flex-1 py-1.5 bg-eureka-600 text-white rounded-xl font-extrabold shadow-sm hover:bg-eureka-700"
                  >
                    {isAdding ? '추가 중...' : '등록하기'}
                  </button>
                </div>
              </form>
            )}

            <p className="text-[11px] text-slate-500 bg-amber-50 border border-amber-200/60 p-2.5 rounded-xl leading-relaxed">
              💡 학생이 비밀번호를 잊어버렸을 경우, 해당 학생의 <b>[1234로 초기화]</b> 버튼을 누르면 즉시 기본 비밀번호로 리셋됩니다.
            </p>

            <div className="space-y-2">
              {displayedStudents.map((s, idx) => {
                const key = `${s.grade_class}-${s.student_name}`;
                const isResetting = resettingId === key;

                return (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 border border-slate-200/70 rounded-2xl flex items-center justify-between hover:bg-slate-100/80 transition"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="bg-slate-800 text-white font-black text-[10px] px-1.5 py-0.5 rounded-md">
                        {s.grade_class}
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        {s.student_name}
                      </span>
                    </div>

                    <button
                      onClick={() => onResetStudent(s.grade_class, s.student_name)}
                      disabled={isResetting}
                      className="px-2.5 py-1 text-[11px] font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg transition flex items-center space-x-1 disabled:opacity-50 active:scale-95"
                    >
                      <RotateCcw className={`w-3 h-3 ${isResetting ? 'animate-spin' : ''}`} />
                      <span>1234로 초기화</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 탭 2: 구글 시트 연동 설정 & 교사 모드 토글 */}
        {activeTab === 'sheet' && (
          <div className="space-y-4 overflow-y-auto flex-1 pr-1">
            <div className="p-3.5 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-200/70">
              <div className="flex items-center space-x-2">
                <ShieldCheck className={`w-5 h-5 ${isTeacherMode ? 'text-amber-600' : 'text-slate-400'}`} />
                <div>
                  <p className="text-xs font-extrabold text-slate-800">교사 승인 권한 모드</p>
                  <p className="text-[10px] text-slate-500">학생들의 질문을 탐구 과제로 승인/취소합니다.</p>
                </div>
              </div>
              <button
                onClick={toggleTeacherMode}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
                  isTeacherMode ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {isTeacherMode ? 'ON' : 'OFF'}
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Google Apps Script 웹 앱 URL
              </label>
              <input
                type="url"
                value={gasUrl}
                onChange={(e) => setGasUrlInput(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-eureka-500"
              />
              <p className="text-[11px] text-slate-400">
                미입력 시 브라우저 LocalStorage 모의 DB로 자동 작동합니다.
              </p>

              {testResult && (
                <div
                  className={`p-2.5 rounded-xl text-xs flex items-start space-x-1.5 ${
                    testResult.success
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  {testResult.success ? (
                    <Check className="w-4 h-4 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}

              <div className="flex items-center space-x-2 pt-1">
                <button
                  onClick={handleTestConnection}
                  disabled={testing}
                  className="flex-1 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition disabled:opacity-50"
                >
                  {testing ? '연결 확인 중...' : '연결 테스트'}
                </button>
                <button
                  onClick={handleSaveUrl}
                  className="flex-1 py-2 text-xs font-bold bg-eureka-600 hover:bg-eureka-700 text-white rounded-xl shadow-md transition"
                >
                  저장하기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 하단 닫기 */}
        <div className="pt-2 border-t shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
