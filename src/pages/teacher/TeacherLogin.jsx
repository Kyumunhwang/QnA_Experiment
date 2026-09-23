import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Lock, User, ShieldCheck, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';

export default function TeacherLogin() {
  const { teacherLogin, currentTeacher } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const [teacherId, setTeacherId] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 이미 교사 로그인되어 있다면 대시보드로 이동
  const from = location.state?.from?.pathname || '/teacher';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!teacherId.trim()) {
      setErrorMessage('교사 ID를 입력해 주세요.');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('비밀번호를 입력해 주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await teacherLogin(teacherId.trim(), password.trim());
      if (res.success) {
        navigate(from, { replace: true });
      } else {
        setErrorMessage(res.error || '아이디 또는 비밀번호가 올바르지 않습니다.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 px-4">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white shadow-xl shadow-rose-500/20 mb-4 ring-4 ring-slate-800">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            과학 교사용 관리 시스템
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Science Eureka 탐구 활동 지도 및 평가 관리
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800 py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-700">
          {errorMessage && (
            <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-rose-300 text-sm animate-shake">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                교사 아이디 (ID)
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  placeholder="아이디를 입력하세요 (예: hwang)"
                  className="block w-full pl-11 pr-4 py-3 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-sm font-medium"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                비밀번호
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  className="block w-full pl-11 pr-4 py-3 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-sm font-medium"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-amber-500 transition-all disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <ShieldCheck className="w-4 h-4 mr-2" />
              )}
              {submitting ? '교사 인증 확인 중...' : '교사 인증 로그인'}
            </button>
          </form>

          {/* 보안 안내 메시지 */}
          <div className="mt-6 pt-4 border-t border-slate-700/60 text-center">
            <p className="text-[11px] text-slate-400">
              🔒 본 시스템은 인가된 과학 교사 전용 관리 시스템입니다.
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/"
            className="inline-flex items-center text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="mr-1 w-3.5 h-3.5" />
            학생 탐구 화면으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
