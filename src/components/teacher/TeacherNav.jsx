import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Award,
  Palette,
  ArrowLeft,
  ShieldCheck,
  LogOut,
  Crown,
  Trophy
} from 'lucide-react';

export default function TeacherNav() {
  const navigate = useNavigate();
  const { currentTeacher, teacherLogout } = useApp();

  const links = [
    { to: '/teacher', label: '대시보드', icon: LayoutDashboard, end: true },
    { to: '/teacher/scores', label: '주간 탐구 점수', icon: Trophy },
    { to: '/teacher/roster', label: '학생 명렬표', icon: Users },
    { to: '/teacher/teachers', label: '교사 명렬표', icon: ShieldCheck },
    { to: '/teacher/questions', label: '질문 승인 & 피드백', icon: CheckSquare },
    { to: '/teacher/portfolios', label: '포트폴리오 검토/도장', icon: Award },
    { to: '/teacher/customize', label: '홈 공지 & 테마', icon: Palette },
  ];

  const handleLogout = () => {
    teacherLogout();
    navigate('/teacher/login');
  };

  const isSuperuser = currentTeacher?.role === 'superuser' || currentTeacher?.teacher_id === 'hwang';

  return (
    <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs mb-4">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex items-center justify-between gap-2">
        {/* 네비게이션 탭 메뉴 (가로 스크롤 지원) */}
        <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar py-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `px-2.5 py-1.5 rounded-xl text-xs font-bold shrink-0 flex items-center space-x-1.5 transition ${
                    isActive
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* 우측 교사 정보 & 제어 버튼 */}
        <div className="flex items-center space-x-2 shrink-0">
          {currentTeacher && (
            <div className="hidden sm:flex items-center space-x-1.5 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-xl text-xs font-bold text-amber-900">
              {isSuperuser ? (
                <Crown className="w-3.5 h-3.5 text-amber-600" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              )}
              <span>{currentTeacher.teacher_name || '황규문'} 선생님</span>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl shrink-0 flex items-center space-x-1 border border-rose-200 transition"
            title="교사 계정 로그아웃"
          >
            <LogOut className="w-3 h-3" />
            <span className="hidden md:inline">로그아웃</span>
          </button>

          <button
            onClick={() => navigate('/')}
            className="px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl shrink-0 flex items-center space-x-1 border border-slate-200 transition"
            title="학생용 탐구 화면으로 이동"
          >
            <ArrowLeft className="w-3 h-3" />
            <span className="hidden sm:inline">학생 홈</span>
          </button>
        </div>
      </div>
    </div>
  );
}
