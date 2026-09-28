import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Lock, UserCheck, X, Sparkles, AlertCircle, KeyRound, BookOpen } from 'lucide-react';

export default function LoginModal() {
  const {
    isLoginModalOpen,
    setIsLoginModalOpen,
    setIsManualOpen,
    classList,
    studentRoster,
    login,
    showToast,
  } = useApp();

  const [selectedClass, setSelectedClass] = useState(classList[0] || 'M6');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 선택된 반에 속한 학생들 목록 필터
  const classStudents = studentRoster.filter(
    (s) => s.grade_class === selectedClass
  );

  // 반 변경 시 첫 번째 학생 자동 선택
  useEffect(() => {
    if (classStudents.length > 0) {
      setSelectedStudent(classStudents[0].student_name);
    } else {
      setSelectedStudent('');
    }
  }, [selectedClass, studentRoster]);

  if (!isLoginModalOpen) return null;

  const handlePasswordChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPassword(val);
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClass || !selectedStudent) {
      setErrorMsg('반과 학생 이름을 선택해 주세요.');
      return;
    }
    if (password.length !== 4) {
      setErrorMsg('4자리 숫자 비밀번호를 입력해 주세요.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    const result = await login(selectedClass, selectedStudent, password);
    setIsLoading(false);
    if (!result.success) {
      setErrorMsg(result.error || '비밀번호가 일치하지 않습니다.');
    } else {
      setPassword('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-eureka-50 text-eureka-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">학생 로그인</h3>
              <p className="text-[11px] text-slate-400">내 탐구 일지와 호기심을 기록하세요</p>
            </div>
          </div>
          <button
            onClick={() => setIsLoginModalOpen(false)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 로그인 폼 */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* 1. 반 선택 (드롭다운) */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              1. 반 선택 (Grade/Class)
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-eureka-500"
            >
              {classList.map((cls) => (
                <option key={cls} value={cls}>
                  {cls} 반
                </option>
              ))}
            </select>
          </div>

          {/* 2. 학생 이름 선택 (드롭다운) */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              2. 학생 이름 선택
            </label>
            {classStudents.length > 0 ? (
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-eureka-500"
              >
                {classStudents.map((s, idx) => (
                  <option key={idx} value={s.student_name}>
                    {s.student_name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-2 text-xs text-rose-500 bg-rose-50 rounded-xl">
                이 반에 등록된 학생이 없습니다.
              </div>
            )}
          </div>

          {/* 3. 4자리 숫자 비밀번호 입력 */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                <Lock className="w-3.5 h-3.5 text-eureka-600" />
                <span>3. 비밀번호 (4자리 숫자)</span>
              </label>
              <span className="text-[10px] text-eureka-600 font-semibold bg-eureka-50 px-2 py-0.5 rounded-full">
                기본 비밀번호: 1234
              </span>
            </div>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={password}
              onChange={handlePasswordChange}
              placeholder="•••• (숫자 4자리)"
              className="w-full px-3.5 py-2.5 text-center tracking-widest text-base font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-eureka-500"
              autoFocus
            />
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center space-x-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="p-2 bg-slate-50 rounded-xl text-[11px] text-slate-500 space-y-0.5">
            <p className="flex items-center space-x-1">
              <KeyRound className="w-3 h-3 text-slate-400" />
              <span>비밀번호를 잊어버린 경우 선생님께 초기화를 요청하세요.</span>
            </p>
          </div>

          {/* 로그인 버튼 */}
          <button
            type="submit"
            disabled={isLoading || !selectedStudent || password.length !== 4}
            className="w-full py-3 bg-eureka-600 hover:bg-eureka-700 text-white font-extrabold text-xs rounded-xl shadow-md transition disabled:opacity-50 active:scale-98 flex items-center justify-center space-x-1.5"
          >
            {isLoading ? (
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <span>접속하기</span>
            )}
          </button>

          {/* Science Eureka Manual 바로가기 버튼 */}
          <div className="pt-1 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLoginModalOpen(false);
                setIsManualOpen(true);
              }}
              className="text-[11px] font-bold text-slate-500 hover:text-eureka-600 transition inline-flex items-center space-x-1"
            >
              <BookOpen className="w-3.5 h-3.5 text-eureka-500" />
              <span>사용법이 궁금하신가요? Science Eureka Manual 보기</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
