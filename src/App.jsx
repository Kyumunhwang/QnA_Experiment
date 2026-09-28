import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Header from './components/common/Header';
import BottomNav from './components/common/BottomNav';
import Toast from './components/common/Toast';
import LoginModal from './components/auth/LoginModal';
import ChangePasswordModal from './components/auth/ChangePasswordModal';
import ManualModal from './components/common/ManualModal';

// 학생용 페이지
import Home from './pages/Home';
import AskQuestion from './pages/AskQuestion';
import PortfolioEditor from './pages/PortfolioEditor';
import MyPortfolios from './pages/MyPortfolios';
import ReportView from './pages/ReportView';

// 교사용 관리 포털 페이지 & 인증
import TeacherLogin from './pages/teacher/TeacherLogin';
import TeacherRouteGuard from './components/teacher/TeacherRouteGuard';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherRoster from './pages/teacher/TeacherRoster';
import TeacherTeachers from './pages/teacher/TeacherTeachers';
import TeacherQuestions from './pages/teacher/TeacherQuestions';
import TeacherPortfolios from './pages/teacher/TeacherPortfolios';
import TeacherCustomize from './pages/teacher/TeacherCustomize';

function AppContent() {
  const location = useLocation();
  const { isManualOpen, setIsManualOpen } = useApp();
  const isTeacherLogin = location.pathname === '/teacher/login';
  const isTeacherPage = location.pathname.startsWith('/teacher');

  return (
    <div className="min-h-screen bg-slate-100/60 flex flex-col font-sans">
      {/* 교사 로그인 화면에서는 상단 헤더 숨김 */}
      {!isTeacherLogin && <Header />}

      {/* 알림 토스트 */}
      <Toast />

      {/* 인증 관련 전역 모달 & 매뉴얼 모달 */}
      <LoginModal />
      <ChangePasswordModal />
      <ManualModal isOpen={isManualOpen} onClose={() => setIsManualOpen(false)} />

      {/* 메인 뷰 컨테이너 */}
      <main
        className={`flex-1 w-full ${
          isTeacherLogin
            ? 'p-0 max-w-none'
            : isTeacherPage
            ? 'max-w-7xl mx-auto px-3 sm:px-6 pt-3 pb-12'
            : 'max-w-md sm:max-w-xl mx-auto px-4 pt-3 pb-20'
        }`}
      >
        <Routes>
          {/* 학생용 라우트 */}
          <Route path="/" element={<Home />} />
          <Route path="/ask" element={<AskQuestion />} />
          <Route path="/portfolio/new" element={<PortfolioEditor />} />
          <Route path="/my-portfolios" element={<MyPortfolios />} />
          <Route path="/report/:id" element={<ReportView />} />

          {/* 교사 전용 로그인 라우트 */}
          <Route path="/teacher/login" element={<TeacherLogin />} />

          {/* 교사용 관리 포털 라우트 (TeacherRouteGuard 보호) */}
          <Route element={<TeacherRouteGuard />}>
            <Route path="/teacher" element={<TeacherDashboard />} />
            <Route path="/teacher/roster" element={<TeacherRoster />} />
            <Route path="/teacher/teachers" element={<TeacherTeachers />} />
            <Route path="/teacher/questions" element={<TeacherQuestions />} />
            <Route path="/teacher/portfolios" element={<TeacherPortfolios />} />
            <Route path="/teacher/customize" element={<TeacherCustomize />} />
          </Route>
        </Routes>
      </main>

      {/* 하단 탭 내비게이션 (학생용 화면에서만 표시) */}
      {!isTeacherPage && <BottomNav />}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AppProvider>
  );
}
