import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import TeacherNav from '../../components/teacher/TeacherNav';
import {
  Users,
  MessageSquareQuote,
  Clock,
  FlaskConical,
  Award,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Filter,
  Eye,
  Trophy,
  BarChart3,
  TrendingUp,
  Search,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BookOpen,
  Medal,
  Check,
  HelpCircle,
  FileText
} from 'lucide-react';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const {
    studentRoster,
    classList,
    questions,
    portfolios,
    refreshQuestions,
    refreshPortfolios,
    currentTeacher,
    approvePortfolioStepAction,
    reviewPortfolioAction,
    showToast,
  } = useApp();

  const [selectedClass, setSelectedClass] = useState('ALL');
  const [activeTab, setActiveTab] = useState('qna_stats'); // 'qna_stats' | 'tracker'
  const [searchStudent, setSearchStudent] = useState('');
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [expandedTrackerStudent, setExpandedTrackerStudent] = useState(null);
  const [trackerStepFeedbacks, setTrackerStepFeedbacks] = useState({});
  const [isProcessingStep, setIsProcessingStep] = useState(false);

  // 학급 필터 목록 (alumni 클래스가 존재하면 포함)
  const availableClasses = Array.from(
    new Set([...classList, ...studentRoster.map((s) => s.grade_class)])
  ).filter(Boolean);

  const handleStepFeedbackChange = (key, text) => {
    setTrackerStepFeedbacks((prev) => ({ ...prev, [key]: text }));
  };

  const handleApproveStep = async (portfolioId, stepNum, status) => {
    if (!portfolioId) {
      showToast('해당 학생의 포트폴리오 데이터가 아직 생성되지 않았습니다.', 'error');
      return;
    }
    const key = `${portfolioId}_step${stepNum}`;
    const feedback = (trackerStepFeedbacks[key] || '').trim();
    setIsProcessingStep(true);
    try {
      await approvePortfolioStepAction(portfolioId, stepNum, status, feedback);
    } finally {
      setIsProcessingStep(false);
    }
  };

  const handleToggleFinalStamp = async (portfolioId, currentReviewed) => {
    if (!portfolioId) {
      showToast('해당 학생의 포트폴리오 데이터가 없습니다.', 'error');
      return;
    }
    const key = `${portfolioId}_final`;
    const comment = (trackerStepFeedbacks[key] || '').trim();
    setIsProcessingStep(true);
    try {
      await reviewPortfolioAction(
        portfolioId,
        !currentReviewed,
        comment,
        currentTeacher?.teacher_name
      );
    } finally {
      setIsProcessingStep(false);
    }
  };

  // 1. 전체 종합 KPI 통계 계산
  const totalStudents = studentRoster.length;
  const totalQuestions = questions.length;
  const approvedQuestions = questions.filter(
    (q) => q.status === 'approved' || Boolean(q.is_selected)
  ).length;
  const rejectedQuestions = questions.filter((q) => q.status === 'rejected').length;
  const pendingQuestions = questions.filter(
    (q) => q.status === 'pending' || (!q.is_selected && q.status !== 'rejected')
  ).length;
  const completedPortfolios = portfolios.filter((p) => Boolean(p.step4_conclusion)).length;
  const reviewedPortfolios = portfolios.filter((p) => Boolean(p.is_reviewed)).length;
  const overallAvgQuestions =
    totalStudents > 0 ? (totalQuestions / totalStudents).toFixed(1) : '0.0';

  // 2. 학생별 질문 및 포트폴리오 통계 매핑
  const studentStatsList = studentRoster.map((student) => {
    const studentQs = questions.filter((q) => q.student_name === student.student_name);
    const approvedQs = studentQs.filter(
      (q) => q.status === 'approved' || Boolean(q.is_selected)
    );
    const rejectedQs = studentQs.filter((q) => q.status === 'rejected');
    const pendingQs = studentQs.filter(
      (q) => q.status === 'pending' || (!q.is_selected && q.status !== 'rejected')
    );
    const studentPf = portfolios.find((p) => p.student_name === student.student_name);
    const isPfCompleted = Boolean(studentPf?.step4_conclusion);

    // 5단계 탐구 진행 퍼센트 헬퍼
    let step = 0;
    if (studentQs.length > 0) step = 1;
    if (approvedQs.length > 0) step = 2;
    if (studentPf?.step2_experiment) step = 3;
    if (studentPf?.step3_failure_lesson) step = 4;
    if (studentPf?.step4_conclusion) step = 5;
    const percent = Math.min(100, Math.round((step / 5) * 100));

    return {
      student_name: student.student_name,
      grade_class: student.grade_class,
      totalQuestions: studentQs.length,
      approvedCount: approvedQs.length,
      rejectedCount: rejectedQs.length,
      pendingCount: pendingQs.length,
      isPfCompleted,
      portfolio: studentPf,
      isReviewed: Boolean(studentPf?.is_reviewed),
      questions: studentQs,
      step,
      percent,
    };
  });

  // 3. 선택된 반 필터링
  const currentClassStudents =
    selectedClass === 'ALL'
      ? studentStatsList
      : studentStatsList.filter((s) => s.grade_class === selectedClass);

  const currentTotalStudents = currentClassStudents.length;
  const currentTotalQuestions = currentClassStudents.reduce((acc, s) => acc + s.totalQuestions, 0);
  const currentAvgQuestions =
    currentTotalStudents > 0
      ? (currentTotalQuestions / currentTotalStudents).toFixed(1)
      : '0.0';
  const currentApprovedQuestions = currentClassStudents.reduce(
    (acc, s) => acc + s.approvedCount,
    0
  );
  const currentRejectedQuestions = currentClassStudents.reduce(
    (acc, s) => acc + s.rejectedCount,
    0
  );
  const currentCompletedPortfolios = currentClassStudents.filter((s) => s.isPfCompleted).length;

  // 4. 질문 수 랭킹 (최다 질문자 ➔ 최저 질문자 내림차순 정렬)
  const rankedStudents = [...currentClassStudents].sort((a, b) => {
    if (b.totalQuestions !== a.totalQuestions) {
      return b.totalQuestions - a.totalQuestions;
    }
    if (b.approvedCount !== a.approvedCount) {
      return b.approvedCount - a.approvedCount;
    }
    return a.student_name.localeCompare(b.student_name);
  });

  // 검색어 필터
  const searchedRankedStudents = rankedStudents.filter((s) =>
    s.student_name.toLowerCase().includes(searchStudent.trim().toLowerCase())
  );

  // 최대 질문수 (바 그래프 비율 계산용)
  const maxQuestionCount = Math.max(1, ...rankedStudents.map((s) => s.totalQuestions));

  // 5. 전체 학급별 질문 평균 및 요약 카드 데이터
  const classSummaryList = classList.map((cls) => {
    const studentsInCls = studentStatsList.filter((s) => s.grade_class === cls);
    const totalQ = studentsInCls.reduce((acc, s) => acc + s.totalQuestions, 0);
    const avgQ = studentsInCls.length > 0 ? (totalQ / studentsInCls.length).toFixed(1) : '0.0';
    const appQ = studentsInCls.reduce((acc, s) => acc + s.approvedCount, 0);
    const rejQ = studentsInCls.reduce((acc, s) => acc + s.rejectedCount, 0);
    const compPf = studentsInCls.filter((s) => s.isPfCompleted).length;
    const topStudent = [...studentsInCls].sort((a, b) => b.totalQuestions - a.totalQuestions)[0];

    return {
      grade_class: cls,
      studentCount: studentsInCls.length,
      totalQuestions: totalQ,
      avgQuestions: avgQ,
      approvedCount: appQ,
      rejectedCount: rejQ,
      completedPortfolios: compPf,
      topStudent: topStudent && topStudent.totalQuestions > 0 ? topStudent : null,
    };
  });

  const toggleExpandStudent = (studentName) => {
    setExpandedStudent((prev) => (prev === studentName ? null : studentName));
  };

  return (
    <div className="space-y-4 pb-16 animate-fadeIn">
      {/* 상단 교사용 네비게이션 */}
      <TeacherNav />

      {/* 헤더 안내 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <span>과학과 PBL 탐구 종합 대시보드</span>
            <span className="text-xs bg-eureka-50 text-eureka-700 font-extrabold px-2 py-0.5 rounded-full border border-eureka-200">
              실시간 분석
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            전체 및 반별 질문 기록(승인/반려/평균)과 최다 질문 순위, 탐구일지 완료 현황을 한눈에 관리합니다.
          </p>
        </div>

        <button
          onClick={() => navigate('/teacher/scores')}
          className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-2xl text-xs font-black shadow-sm transition flex items-center space-x-1.5 self-start sm:self-auto shrink-0"
        >
          <Trophy className="w-4 h-4 text-yellow-100" />
          <span>매주 탐구 점수 대시보드 보기</span>
          <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
        </button>
      </div>

      {/* 1. 전체 학생 종합 KPI 통계 카드 (요청 항목 3 반영) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {/* 승인된 질문 수 */}
        <div
          onClick={() => navigate('/teacher/questions')}
          className="p-3 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl cursor-pointer hover:shadow-md transition space-y-1"
        >
          <div className="flex items-center justify-between text-emerald-800">
            <span className="text-[11px] font-bold">승인된 질문 수</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-black text-emerald-700">{approvedQuestions}</span>
            <span className="text-xs text-emerald-800 font-semibold">건</span>
          </div>
          <p className="text-[10px] text-emerald-600 font-medium">탐구 진행 과제</p>
        </div>

        {/* 반려된 질문 수 */}
        <div
          onClick={() => navigate('/teacher/questions')}
          className="p-3 bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-200/80 rounded-2xl cursor-pointer hover:shadow-md transition space-y-1"
        >
          <div className="flex items-center justify-between text-rose-800">
            <span className="text-[11px] font-bold">반려된 질문 수</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-black text-rose-700">{rejectedQuestions}</span>
            <span className="text-xs text-rose-800 font-semibold">건</span>
          </div>
          <p className="text-[10px] text-rose-600 font-medium">보완 피드백 전달</p>
        </div>

        {/* 승인 대기 질문 */}
        <div
          onClick={() => navigate('/teacher/questions')}
          className="p-3 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl cursor-pointer hover:shadow-md transition space-y-1"
        >
          <div className="flex items-center justify-between text-amber-800">
            <span className="text-[11px] font-bold">승인 대기 질문</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-black text-amber-700">{pendingQuestions}</span>
            <span className="text-xs text-amber-800 font-semibold">건</span>
          </div>
          <p className="text-[10px] text-amber-600 font-medium">선생님 검토 대기</p>
        </div>

        {/* 탐구일지 완료 수 */}
        <div
          onClick={() => navigate('/teacher/portfolios')}
          className="p-3 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200/80 rounded-2xl cursor-pointer hover:shadow-md transition space-y-1"
        >
          <div className="flex items-center justify-between text-purple-800">
            <span className="text-[11px] font-bold">탐구일지 완료</span>
            <Award className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-black text-purple-700">{completedPortfolios}</span>
            <span className="text-xs text-purple-800 font-semibold">편</span>
          </div>
          <p className="text-[10px] text-purple-600 font-medium">도장 완료 {reviewedPortfolios}편</p>
        </div>

        {/* 전체 학생 & 총 질문 수 */}
        <div className="p-3 bg-white border border-slate-200 rounded-2xl space-y-1 col-span-2 sm:col-span-1 shadow-xs">
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-[11px] font-bold">전체 질문 & 평균</span>
            <Users className="w-4 h-4 text-slate-500" />
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-black text-slate-800">{totalQuestions}</span>
            <span className="text-xs text-slate-500 font-semibold">건</span>
          </div>
          <p className="text-[10px] text-slate-500">
            평균 <span className="font-bold text-slate-700">{overallAvgQuestions}건</span> / 1인 ({totalStudents}명)
          </p>
        </div>
      </div>

      {/* 메인 뷰 모드 탭 (질문 통계 & 랭킹 vs 5단계 현황판) */}
      <div className="flex bg-slate-200/90 p-1 rounded-2xl text-xs font-bold gap-1 shadow-inner">
        <button
          onClick={() => setActiveTab('qna_stats')}
          className={`flex-1 py-2 rounded-xl transition flex items-center justify-center space-x-1.5 ${
            activeTab === 'qna_stats'
              ? 'bg-white text-eureka-800 shadow-sm font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-500" />
          <span>🏆 학생별 질문 기록 & 반별 랭킹 통계</span>
        </button>

        <button
          onClick={() => setActiveTab('tracker')}
          className={`flex-1 py-2 rounded-xl transition flex items-center justify-center space-x-1.5 ${
            activeTab === 'tracker'
              ? 'bg-white text-eureka-800 shadow-sm font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FlaskConical className="w-4 h-4 text-eureka-600" />
          <span>📊 학생별 5단계 탐구 진행 현황판</span>
        </button>
      </div>

      {/* 탭 1: 학생별 질문 기록 & 반별 랭킹 통계 (사용자 요청 핵심 화면) */}
      {activeTab === 'qna_stats' && (
        <div className="space-y-4 animate-fadeIn">
          {/* 학급 선택 필터 및 반별 통계 요약 배너 */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-800 flex items-center space-x-1.5">
                  <BarChart3 className="w-4 h-4 text-eureka-600" />
                  <span>
                    {selectedClass === 'ALL'
                      ? '전체 학급 질문 통계'
                      : `${selectedClass} 반 질문 분석 및 랭킹`}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  반별 질문 평균과 최고·최저 질문 명단 및 학생별 승인·반려 내역을 상세 확인합니다.
                </p>
              </div>

              {/* 반 선택 셀렉터 */}
              <div className="flex items-center space-x-2">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="px-3 py-1.5 text-xs font-extrabold bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-eureka-500 shadow-xs"
                >
                  <option value="ALL">전체 학급 통합 ({totalStudents}명)</option>
                  {classList.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls} 반
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 선택된 학급의 핵심 지표 바 (요청 항목 2 반영: 반별 질문 평균, 승인수, 반려수) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              {/* 반별 질문 평균 */}
              <div className="bg-eureka-50/80 border border-eureka-200 rounded-2xl p-3 flex flex-col justify-between">
                <div className="text-[11px] font-bold text-eureka-800 flex items-center space-x-1">
                  <TrendingUp className="w-3.5 h-3.5 text-eureka-600" />
                  <span>반별 질문 평균</span>
                </div>
                <div className="mt-1 flex items-baseline space-x-1">
                  <span className="text-2xl font-black text-eureka-800">{currentAvgQuestions}</span>
                  <span className="text-xs text-eureka-700 font-bold">건 / 학생 1인</span>
                </div>
                <p className="text-[10px] text-eureka-600 mt-0.5">
                  총 {currentTotalQuestions}건 / {currentTotalStudents}명
                </p>
              </div>

              {/* 승인된 질문 수 */}
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3 flex flex-col justify-between">
                <div className="text-[11px] font-bold text-emerald-800 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>승인된 질문 수</span>
                </div>
                <div className="mt-1 flex items-baseline space-x-1">
                  <span className="text-2xl font-black text-emerald-700">{currentApprovedQuestions}</span>
                  <span className="text-xs text-emerald-700 font-bold">건</span>
                </div>
                <p className="text-[10px] text-emerald-600 mt-0.5">
                  승인율{' '}
                  {currentTotalQuestions > 0
                    ? Math.round((currentApprovedQuestions / currentTotalQuestions) * 100)
                    : 0}
                  %
                </p>
              </div>

              {/* 반려된 질문 수 */}
              <div className="bg-rose-50/80 border border-rose-200 rounded-2xl p-3 flex flex-col justify-between">
                <div className="text-[11px] font-bold text-rose-800 flex items-center space-x-1">
                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>반려된 질문 수</span>
                </div>
                <div className="mt-1 flex items-baseline space-x-1">
                  <span className="text-2xl font-black text-rose-700">{currentRejectedQuestions}</span>
                  <span className="text-xs text-rose-700 font-bold">건</span>
                </div>
                <p className="text-[10px] text-rose-600 mt-0.5">
                  보완 요청 피드백 완료
                </p>
              </div>

              {/* 탐구일지 완료 수 */}
              <div className="bg-purple-50/80 border border-purple-200 rounded-2xl p-3 flex flex-col justify-between">
                <div className="text-[11px] font-bold text-purple-800 flex items-center space-x-1">
                  <Award className="w-3.5 h-3.5 text-purple-600" />
                  <span>탐구일지 완료 수</span>
                </div>
                <div className="mt-1 flex items-baseline space-x-1">
                  <span className="text-2xl font-black text-purple-700">{currentCompletedPortfolios}</span>
                  <span className="text-xs text-purple-700 font-bold">편</span>
                </div>
                <p className="text-[10px] text-purple-600 mt-0.5">
                  Step 4 결론 도출 완료
                </p>
              </div>
            </div>
          </div>

          {/* 전체 학급 선택 시: 반별 질문 평균 비교 카드 그리드 */}
          {selectedClass === 'ALL' && (
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <h4 className="text-xs font-black text-slate-800 flex items-center space-x-1.5">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                <span>반별 질문 평균 및 탐구 활성화 비교</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {classSummaryList.map((cs) => (
                  <div
                    key={cs.grade_class}
                    onClick={() => setSelectedClass(cs.grade_class)}
                    className="p-3 bg-slate-50 hover:bg-eureka-50/60 border border-slate-200 hover:border-eureka-300 rounded-2xl cursor-pointer transition space-y-1 text-center group"
                  >
                    <span className="inline-block bg-slate-800 group-hover:bg-eureka-700 text-white font-black text-[10px] px-2 py-0.5 rounded-md transition">
                      {cs.grade_class}
                    </span>
                    <div className="pt-0.5">
                      <div className="text-base font-black text-slate-800 group-hover:text-eureka-800">
                        {cs.avgQuestions}
                        <span className="text-[10px] font-normal text-slate-500">건/인</span>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        총 {cs.totalQuestions}건 ({cs.studentCount}명)
                      </p>
                    </div>
                    <div className="text-[9px] text-emerald-600 font-bold">
                      승인 {cs.approvedCount} · 반려 {cs.rejectedCount}
                    </div>
                    {cs.topStudent && (
                      <p className="text-[9px] text-amber-700 font-bold truncate pt-0.5 border-t border-slate-200">
                        👑 {cs.topStudent.student_name} ({cs.topStudent.totalQuestions}건)
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2단 분할 레이아웃: 좌측(질문수 랭킹 명단) / 우측(학생별 승인·반려 상세 & 질문 펼치기) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* 좌측 (5/12): 반별 최고 ➔ 최저 질문 랭킹 명단 (요청 항목 1 반영) */}
            <div className="lg:col-span-5 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 flex items-center space-x-1.5">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <span>질문 수 랭킹 (최다 ➔ 최저 명단)</span>
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {selectedClass === 'ALL' ? '전체 학생' : `${selectedClass} 반`} 질문 등록 순위
                  </p>
                </div>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">
                  총 {rankedStudents.length}명
                </span>
              </div>

              {/* 랭킹 리스트 */}
              <div className="space-y-1.5 max-h-[560px] overflow-y-auto pr-1">
                {rankedStudents.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    등록된 학생이 없습니다.
                  </div>
                ) : (
                  rankedStudents.map((st, idx) => {
                    const isTop1 = idx === 0 && st.totalQuestions > 0;
                    const isTop2 = idx === 1 && st.totalQuestions > 0;
                    const isTop3 = idx === 2 && st.totalQuestions > 0;
                    const barWidth = Math.max(8, Math.round((st.totalQuestions / maxQuestionCount) * 100));

                    return (
                      <div
                        key={idx}
                        onClick={() => toggleExpandStudent(st.student_name)}
                        className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between gap-2 ${
                          expandedStudent === st.student_name
                            ? 'bg-eureka-50 border-eureka-300 shadow-xs'
                            : 'bg-slate-50/80 hover:bg-slate-100/80 border-slate-200/70'
                        }`}
                      >
                        {/* 순위 & 이름 */}
                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                          {/* 순위 배지 */}
                          <div className="w-5 text-center shrink-0">
                            {isTop1 ? (
                              <span className="text-sm">🥇</span>
                            ) : isTop2 ? (
                              <span className="text-sm">🥈</span>
                            ) : isTop3 ? (
                              <span className="text-sm">🥉</span>
                            ) : (
                              <span className="text-[10px] font-black text-slate-400">
                                {idx + 1}
                              </span>
                            )}
                          </div>

                          {/* 반 배지 & 이름 */}
                          <span className="bg-slate-800 text-white font-black text-[9px] px-1.5 py-0.5 rounded shrink-0">
                            {st.grade_class}
                          </span>
                          <span className="text-xs font-bold text-slate-800 truncate">
                            {st.student_name}
                          </span>
                        </div>

                        {/* 시각적 바 게이지 및 질문 수 표기 (이름 - 질문수) */}
                        <div className="flex items-center space-x-2 shrink-0">
                          <div className="w-16 bg-slate-200 h-1.5 rounded-full overflow-hidden hidden sm:block">
                            <div
                              className={`h-full ${
                                st.totalQuestions > 0
                                  ? 'bg-gradient-to-r from-eureka-500 to-teal-500'
                                  : 'bg-slate-300'
                              }`}
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>

                          <div className="text-right">
                            {st.totalQuestions > 0 ? (
                              <span className="text-xs font-black text-eureka-800 bg-eureka-100 px-2 py-0.5 rounded-md">
                                {st.totalQuestions}건
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-400 bg-slate-200/80 px-1.5 py-0.5 rounded-md">
                                0건
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 우측 (7/12): 학생별 승인 / 반려 / 완료 상세 목록 & 질문 펼쳐보기 (요청 항목 2 반영) */}
            <div className="lg:col-span-7 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>학생별 질문 승인·반려 현황 & 상세 기록</span>
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    학생을 클릭하면 작성한 질문 내용과 선생님의 피드백을 확인할 수 있습니다.
                  </p>
                </div>

                {/* 학생 이름 검색 */}
                <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200 max-w-xs">
                  <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={searchStudent}
                    onChange={(e) => setSearchStudent(e.target.value)}
                    placeholder="학생 이름 검색..."
                    className="w-full bg-transparent text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              {/* 학생별 상세 리스트 */}
              <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
                {searchedRankedStudents.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    검색 조건에 일치하는 학생이 없습니다.
                  </div>
                ) : (
                  searchedRankedStudents.map((st, idx) => {
                    const isExpanded = expandedStudent === st.student_name;

                    return (
                      <div
                        key={idx}
                        className={`rounded-2xl border transition ${
                          isExpanded
                            ? 'bg-eureka-50/50 border-eureka-300 shadow-xs'
                            : 'bg-slate-50/70 border-slate-200/80 hover:bg-white hover:border-slate-300'
                        }`}
                      >
                        {/* 학생 요약 행 */}
                        <div
                          onClick={() => toggleExpandStudent(st.student_name)}
                          className="p-3 flex items-center justify-between gap-2 cursor-pointer"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="bg-slate-800 text-white font-black text-[10px] px-1.5 py-0.5 rounded-md">
                              {st.grade_class}
                            </span>
                            <span className="text-xs font-bold text-slate-900">
                              {st.student_name}
                            </span>
                            {st.isPfCompleted && (
                              <span className="text-[10px] font-black text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.2 rounded-md hidden sm:inline">
                                💮 탐구일지 완료
                              </span>
                            )}
                          </div>

                          {/* 뱃지들 (총 질문, 승인, 반려, 대기) */}
                          <div className="flex items-center space-x-1.5 shrink-0">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                              총 {st.totalQuestions}
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                              승인 {st.approvedCount}
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
                              반려 {st.rejectedCount}
                            </span>
                            {st.pendingCount > 0 && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                                대기 {st.pendingCount}
                              </span>
                            )}
                            <div className="p-0.5 text-slate-400">
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-eureka-600" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 아코디언: 학생이 작성한 실제 질문 목록 펼쳐보기 */}
                        {isExpanded && (
                          <div className="px-3 pb-3 pt-1 border-t border-slate-200/80 space-y-2 animate-fadeIn">
                            <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-600">
                              <span>작성한 질문 내역 ({st.questions.length}건)</span>
                              {st.portfolio && (
                                <button
                                  onClick={() =>
                                    navigate(
                                      `/report/${st.portfolio.id}?questionId=${st.portfolio.question_id}`
                                    )
                                  }
                                  className="text-[10px] text-purple-700 font-bold hover:underline"
                                >
                                  포트폴리오 바로보기 ➔
                                </button>
                              )}
                            </div>

                            {st.questions.length === 0 ? (
                              <div className="p-3 bg-white rounded-xl text-center text-xs text-slate-400 border border-dashed">
                                아직 등록한 호기심 질문이 없습니다.
                              </div>
                            ) : (
                              st.questions.map((q, qIdx) => {
                                const qStatus =
                                  q.status || (q.is_selected ? 'approved' : 'pending');

                                let questionText = q.content;
                                if (q.ui_type === 'B') {
                                  try {
                                    const obj =
                                      typeof q.content === 'string'
                                        ? JSON.parse(q.content)
                                        : q.content;
                                    questionText = `[See] ${obj.see || ''} / [Think] ${
                                      obj.think || ''
                                    } / [Wonder] ${obj.wonder || ''}`;
                                  } catch (e) {}
                                }

                                return (
                                  <div
                                    key={qIdx}
                                    className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-1.5 text-xs shadow-xs"
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center space-x-1.5">
                                        <span className="font-extrabold text-[10px] text-slate-400">
                                          #{qIdx + 1}
                                        </span>
                                        <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                          {q.ui_type === 'B' ? 'Type B (관찰형 STW)' : 'Type A (한줄질문)'}
                                        </span>
                                      </div>

                                      {/* 상태 배지 */}
                                      {qStatus === 'approved' ? (
                                        <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md flex items-center space-x-0.5">
                                          <Check className="w-2.5 h-2.5" />
                                          <span>승인됨</span>
                                        </span>
                                      ) : qStatus === 'rejected' ? (
                                        <span className="text-[10px] font-extrabold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-md flex items-center space-x-0.5">
                                          <XCircle className="w-2.5 h-2.5" />
                                          <span>반려됨</span>
                                        </span>
                                      ) : (
                                        <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md flex items-center space-x-0.5">
                                          <Clock className="w-2.5 h-2.5" />
                                          <span>검토 대기중</span>
                                        </span>
                                      )}
                                    </div>

                                    {/* 질문 본문 */}
                                    <p className="font-semibold text-slate-800 leading-snug line-clamp-3">
                                      {questionText}
                                    </p>

                                    {/* 교사 피드백 내용 표시 */}
                                    {q.teacher_feedback && (
                                      <div className="p-2 bg-amber-50/70 border border-amber-200 rounded-lg text-[11px] text-amber-900 space-y-0.5">
                                        <div className="font-bold text-[10px] text-amber-700 flex items-center space-x-1">
                                          <MessageSquareQuote className="w-3 h-3" />
                                          <span>선생님 피드백:</span>
                                        </div>
                                        <p>{q.teacher_feedback}</p>
                                      </div>
                                    )}

                                    {/* 등록 일시 */}
                                    {q.created_at && (
                                      <div className="text-[10px] text-slate-400 text-right">
                                        등록: {String(q.created_at).substring(0, 16)}
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 탭 2: 기존 학생별 5단계 탐구 진행 현황판 */}
      {activeTab === 'tracker' && (
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3.5 animate-fadeIn">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center space-x-1.5">
                <FlaskConical className="w-4 h-4 text-eureka-600" />
                <span>학생별 5단계 탐구 진행 현황판 & 단계별 심사</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                1.질문등록 ➔ 2.사전조사(Step1) ➔ 3.실험실행(Step2) ➔ 4.실패분석(Step3) ➔ 5.결론완료 & 도장(Step4)
              </p>
            </div>

            {/* 학급 필터 (alumni 포함) */}
            <div className="flex items-center space-x-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-2.5 py-1 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              >
                <option value="ALL">전체 학급 ({studentRoster.length}명)</option>
                {availableClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls === 'alumni' ? 'alumni (졸업생 보관)' : `${cls} 반`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 안내 배너 */}
          <div className="p-3 bg-eureka-50/70 border border-eureka-200 rounded-2xl flex items-center justify-between text-xs text-eureka-800">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-eureka-600 shrink-0" />
              <span>
                학생 행을 클릭하면 <strong>1~4단계 작성 내용</strong>을 확인하고, 선생님 피드백 입력과 <strong>[승인(+3점)] / [보류]</strong> 처리를 직접 진행할 수 있습니다.
              </span>
            </div>
          </div>

          {/* 학생 목록 매트릭스 */}
          <div className="space-y-2.5">
            {currentClassStudents.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                선택한 학급에 등록된 학생이 없습니다.
              </div>
            ) : (
              currentClassStudents.map((st, idx) => {
                const isExpanded = expandedTrackerStudent === st.student_name;
                const pf = st.portfolio;

                return (
                  <div
                    key={idx}
                    className="bg-slate-50/80 border border-slate-200/70 rounded-2xl transition overflow-hidden"
                  >
                    {/* 카드 헤더 (클릭 시 아코디언 토글) */}
                    <div
                      onClick={() =>
                        setExpandedTrackerStudent((prev) =>
                          prev === st.student_name ? null : st.student_name
                        )
                      }
                      className="p-3.5 cursor-pointer hover:bg-slate-100/70 transition space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className={`font-black text-[10px] px-1.5 py-0.5 rounded-md text-white ${st.grade_class === 'alumni' ? 'bg-purple-700' : 'bg-slate-800'}`}>
                            {st.grade_class === 'alumni' ? 'alumni (졸업)' : st.grade_class}
                          </span>
                          <span className="text-xs font-bold text-slate-800">
                            {st.student_name}
                          </span>
                          {st.isReviewed && (
                            <span className="text-[10px] font-black text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded-md">
                              💮 100점 도장 완료
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 text-[11px]">
                          <span className="font-extrabold text-eureka-700">
                            {st.percent}%
                          </span>
                          {pf && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/report/${pf.id}?questionId=${pf.question_id}`);
                              }}
                              className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[10px] font-bold"
                            >
                              보고서 보기
                            </button>
                          )}
                          <div className="p-0.5 text-slate-400">
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-eureka-600" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 프로그레스 바 */}
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            st.percent === 100
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                              : st.percent >= 60
                              ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                              : 'bg-gradient-to-r from-amber-400 to-orange-400'
                          }`}
                          style={{ width: `${Math.max(5, st.percent)}%` }}
                        />
                      </div>

                      {/* 단계별 상태 칩 */}
                      <div className="grid grid-cols-5 gap-1 text-[10px] text-center pt-0.5">
                        <span
                          className={`py-0.5 rounded ${
                            st.totalQuestions > 0
                              ? 'bg-blue-100 text-blue-800 font-bold'
                              : 'bg-slate-200/60 text-slate-400'
                          }`}
                        >
                          1. 질문등록
                        </span>
                        <span
                          className={`py-0.5 rounded ${
                            st.approvedCount > 0
                              ? 'bg-emerald-100 text-emerald-800 font-bold'
                              : 'bg-slate-200/60 text-slate-400'
                          }`}
                        >
                          2. 교사승인
                        </span>
                        <span
                          className={`py-0.5 rounded ${
                            pf?.step1_status === 'approved' || pf?.step2_experiment
                              ? 'bg-indigo-100 text-indigo-800 font-bold'
                              : 'bg-slate-200/60 text-slate-400'
                          }`}
                        >
                          3. Step1 승인
                        </span>
                        <span
                          className={`py-0.5 rounded ${
                            pf?.step2_status === 'approved' || pf?.step3_failure_lesson
                              ? 'bg-rose-100 text-rose-800 font-bold'
                              : 'bg-slate-200/60 text-slate-400'
                          }`}
                        >
                          4. Step2 승인
                        </span>
                        <span
                          className={`py-0.5 rounded ${
                            pf?.is_reviewed
                              ? 'bg-amber-100 text-amber-800 font-bold'
                              : pf?.step3_status === 'approved'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-slate-200/60 text-slate-400'
                          }`}
                        >
                          5. {pf?.is_reviewed ? '100점 완료' : 'Step3 승인'}
                        </span>
                      </div>
                    </div>

                    {/* 아코디언 펼침: 단계별 심사 및 피드백 패널 */}
                    {isExpanded && (
                      <div className="p-4 bg-white border-t border-slate-200 space-y-4 animate-fadeIn">
                        {!pf ? (
                          <div className="py-6 text-center text-xs text-slate-400">
                            아직 학생이 등록한 탐구 일지 포트폴리오가 없습니다.
                          </div>
                        ) : (
                          <>
                            {/* Step 1. 가설 & 사전조사 심사 카드 */}
                            <div className="p-3 rounded-2xl border border-blue-200 bg-blue-50/30 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-extrabold text-xs text-blue-900 flex items-center space-x-1.5">
                                  <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[10px] flex items-center justify-center font-black">1</span>
                                  <span>1단계: 가설 및 사전조사 (+3점)</span>
                                </span>
                                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                  pf.step1_status === 'approved'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : pf.step1_status === 'held'
                                    ? 'bg-rose-100 text-rose-800'
                                    : pf.step1_status === 'submitted'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {pf.step1_status === 'approved' ? '✓ 승인됨 (+3점)' : pf.step1_status === 'held' ? '⚠️ 보류됨' : pf.step1_status === 'submitted' ? '⏳ 검토요청' : '작성중'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200 whitespace-pre-line leading-relaxed">
                                {pf.step1_research || '아직 작성되지 않았습니다.'}
                              </p>
                              {pf.step1_feedback && (
                                <p className="text-[11px] text-blue-800 bg-blue-100/60 p-2 rounded-lg font-medium">
                                  이전 피드백: "{pf.step1_feedback}"
                                </p>
                              )}
                              <div className="flex items-center gap-2 pt-1">
                                <input
                                  type="text"
                                  placeholder="1단계 피드백 입력..."
                                  value={trackerStepFeedbacks[`${pf.id}_step1`] || ''}
                                  onChange={(e) => handleStepFeedbackChange(`${pf.id}_step1`, e.target.value)}
                                  className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                                />
                                <button
                                  type="button"
                                  disabled={isProcessingStep}
                                  onClick={() => handleApproveStep(pf.id, 1, 'approved')}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shrink-0 transition"
                                >
                                  승인 (+3)
                                </button>
                                <button
                                  type="button"
                                  disabled={isProcessingStep}
                                  onClick={() => handleApproveStep(pf.id, 1, 'held')}
                                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shrink-0 transition"
                                >
                                  보류
                                </button>
                              </div>
                            </div>

                            {/* Step 2. 실행 & 실험 심사 카드 */}
                            <div className="p-3 rounded-2xl border border-emerald-200 bg-emerald-50/30 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-extrabold text-xs text-emerald-900 flex items-center space-x-1.5">
                                  <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 text-[10px] flex items-center justify-center font-black">2</span>
                                  <span>2단계: 실험 및 관찰 과정 (+3점)</span>
                                </span>
                                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                  pf.step2_status === 'approved'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : pf.step2_status === 'held'
                                    ? 'bg-rose-100 text-rose-800'
                                    : pf.step2_status === 'submitted'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {pf.step2_status === 'approved' ? '✓ 승인됨 (+3점)' : pf.step2_status === 'held' ? '⚠️ 보류됨' : pf.step2_status === 'submitted' ? '⏳ 검토요청' : '작성중'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200 whitespace-pre-line leading-relaxed">
                                {pf.step2_experiment || '아직 작성되지 않았습니다.'}
                              </p>
                              {pf.step2_feedback && (
                                <p className="text-[11px] text-emerald-800 bg-emerald-100/60 p-2 rounded-lg font-medium">
                                  이전 피드백: "{pf.step2_feedback}"
                                </p>
                              )}
                              <div className="flex items-center gap-2 pt-1">
                                <input
                                  type="text"
                                  placeholder="2단계 피드백 입력..."
                                  value={trackerStepFeedbacks[`${pf.id}_step2`] || ''}
                                  onChange={(e) => handleStepFeedbackChange(`${pf.id}_step2`, e.target.value)}
                                  className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400"
                                />
                                <button
                                  type="button"
                                  disabled={isProcessingStep}
                                  onClick={() => handleApproveStep(pf.id, 2, 'approved')}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shrink-0 transition"
                                >
                                  승인 (+3)
                                </button>
                                <button
                                  type="button"
                                  disabled={isProcessingStep}
                                  onClick={() => handleApproveStep(pf.id, 2, 'held')}
                                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shrink-0 transition"
                                >
                                  보류
                                </button>
                              </div>
                            </div>

                            {/* Step 3. 실패 분석 심사 카드 */}
                            <div className="p-3 rounded-2xl border border-rose-200 bg-rose-50/30 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-extrabold text-xs text-rose-900 flex items-center space-x-1.5">
                                  <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-700 text-[10px] flex items-center justify-center font-black">3</span>
                                  <span>3단계: 실패 분석 및 가설 수정 (+3점)</span>
                                </span>
                                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                  pf.step3_status === 'approved'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : pf.step3_status === 'held'
                                    ? 'bg-rose-100 text-rose-800'
                                    : pf.step3_status === 'submitted'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {pf.step3_status === 'approved' ? '✓ 승인됨 (+3점)' : pf.step3_status === 'held' ? '⚠️ 보류됨' : pf.step3_status === 'submitted' ? '⏳ 검토요청' : '작성중'}
                                </span>
                              </div>
                              <div className="space-y-1 text-xs bg-white p-2.5 rounded-xl border border-slate-200 leading-relaxed">
                                <div className="text-slate-800">
                                  <strong className="text-rose-700">• 배운 점:</strong> {pf.step3_failure_lesson || '미작성'}
                                </div>
                                <div className="text-slate-800">
                                  <strong className="text-amber-700">• 수정한 가설:</strong> {pf.step3_revised_hypothesis || '미작성'}
                                </div>
                              </div>
                              {pf.step3_feedback && (
                                <p className="text-[11px] text-rose-800 bg-rose-100/60 p-2 rounded-lg font-medium">
                                  이전 피드백: "{pf.step3_feedback}"
                                </p>
                              )}
                              <div className="flex items-center gap-2 pt-1">
                                <input
                                  type="text"
                                  placeholder="3단계 피드백 입력..."
                                  value={trackerStepFeedbacks[`${pf.id}_step3`] || ''}
                                  onChange={(e) => handleStepFeedbackChange(`${pf.id}_step3`, e.target.value)}
                                  className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400"
                                />
                                <button
                                  type="button"
                                  disabled={isProcessingStep}
                                  onClick={() => handleApproveStep(pf.id, 3, 'approved')}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shrink-0 transition"
                                >
                                  승인 (+3)
                                </button>
                                <button
                                  type="button"
                                  disabled={isProcessingStep}
                                  onClick={() => handleApproveStep(pf.id, 3, 'held')}
                                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shrink-0 transition"
                                >
                                  보류
                                </button>
                              </div>
                            </div>

                            {/* Step 4. 최종 결론 및 도장 승인 카드 */}
                            <div className="p-3 rounded-2xl border border-amber-300 bg-amber-50/40 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-extrabold text-xs text-amber-900 flex items-center space-x-1.5">
                                  <Award className="w-4 h-4 text-amber-600" />
                                  <span>4단계: 최종 결론 & 교사 최종 도장 승인 (+1점, 100점 만점)</span>
                                </span>
                                {pf.is_reviewed ? (
                                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                                    💮 100점 만점 도장 완료
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                    도장 미승인
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200 whitespace-pre-line leading-relaxed">
                                {pf.step4_conclusion || '아직 최종 결론이 작성되지 않았습니다.'}
                              </p>
                              {pf.teacher_comment && (
                                <p className="text-[11px] text-amber-900 bg-amber-100/70 p-2 rounded-lg font-medium">
                                  선생님 총평: "{pf.teacher_comment}" ({pf.reviewed_by || '교사'})
                                </p>
                              )}
                              <div className="flex items-center gap-2 pt-1">
                                <input
                                  type="text"
                                  placeholder="선생님 최종 총평 코멘트 입력..."
                                  value={trackerStepFeedbacks[`${pf.id}_final`] || ''}
                                  onChange={(e) => handleStepFeedbackChange(`${pf.id}_final`, e.target.value)}
                                  className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                                />
                                <button
                                  type="button"
                                  disabled={isProcessingStep}
                                  onClick={() => handleToggleFinalStamp(pf.id, Boolean(pf.is_reviewed))}
                                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black shadow-xs shrink-0 transition flex items-center space-x-1 ${
                                    pf.is_reviewed
                                      ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                                      : 'bg-rose-600 hover:bg-rose-700 text-white'
                                  }`}
                                >
                                  <span>{pf.is_reviewed ? '도장 취소' : '💮 최종 도장 승인 (+1점, 100점)'}</span>
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
