import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Sparkles, User, Settings, ShieldCheck, KeyRound, LogOut, LogIn, BookOpen } from 'lucide-react';
import SettingsModal from './SettingsModal';

export default function Header() {
  const {
    currentUser,
    currentTeacher,
    teacherLogout,
    logout,
    setIsLoginModalOpen,
    setIsChangePwModalOpen,
    setIsManualOpen,
    isTeacherMode,
  } = useApp();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // 슈퍼관리자(ID: hwang)만 설정(톱니바퀴) 메뉴 접근 허용
  const isSuperuser =
    currentTeacher &&
    (currentTeacher.teacher_id === 'hwang' || currentTeacher.role === 'superuser');

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-md sm:max-w-xl lg:max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* 로고 & 타이틀 */}
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-eureka-600 to-eureka-400 flex items-center justify-center text-white shadow-md shadow-eureka-200">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-sm font-black tracking-tight text-slate-800">Science Eureka</span>
                {currentTeacher && (
                  <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                    <ShieldCheck className="w-2.5 h-2.5" /> 교사
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 leading-none">사고실험 & PBL 탐구 일지</p>
            </div>
          </div>

          {/* 우측 사용자 세션 & 설정 */}
          <div className="flex items-center space-x-1.5">
            {currentTeacher ? (
              /* 교사 로그인 상태: 학생 로그인은 완전 제거하고 교사 정보 및 포털 버튼만 표시 */
              <div className="flex items-center space-x-1.5">
                <Link
                  to="/teacher"
                  className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs flex items-center space-x-1 shadow-sm transition"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{currentTeacher.teacher_name} 선생님 (교사 포털)</span>
                </Link>

                <button
                  onClick={teacherLogout}
                  title="교사 계정 로그아웃"
                  className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-100 rounded-xl transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              /* 교사 미로그인 상태: 학생 로그인/세션 및 교사 전용 로그인 링크 표시 */
              <>
                {currentUser ? (
                  <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-2xl border border-slate-200/60">
                    {/* 학생 이름 & 반 배지 */}
                    <div className="flex items-center space-x-1 px-2 py-0.5 text-xs font-bold text-slate-700">
                      <span className="bg-eureka-500 text-white text-[10px] px-1.5 py-0.5 rounded-md font-black">
                        {currentUser.gradeClass}
                      </span>
                      <span>{currentUser.studentName}</span>
                    </div>

                    {/* 비밀번호 변경 버튼 */}
                    <button
                      onClick={() => setIsChangePwModalOpen(true)}
                      title="비밀번호 변경"
                      className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-white rounded-xl transition"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                    </button>

                    {/* 로그아웃 버튼 */}
                    <button
                      onClick={logout}
                      title="로그아웃"
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-white rounded-xl transition"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => setIsManualOpen(true)}
                      className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                      title="Science Eureka Manual 보기"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-eureka-600" />
                      <span>Science Eureka Manual</span>
                    </button>

                    <button
                      onClick={() => setIsLoginModalOpen(true)}
                      className="flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-eureka-50 text-eureka-700 border border-eureka-200 hover:bg-eureka-100 transition shadow-sm"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>학생 로그인</span>
                    </button>
                  </div>
                )}
              </>
            )}

            {/* 슈퍼관리자(ID: hwang) 접속 시에만 톱니바퀴 설정 아이콘 노출 */}
            {isSuperuser && (
              <button
                onClick={() => setIsSettingsOpen(true)}
                title="슈퍼관리자 설정 및 구글 시트 연동"
                className="p-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-full transition border border-amber-200 shadow-xs"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {isSuperuser && isSettingsOpen && (
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      )}
    </>
  );
}
