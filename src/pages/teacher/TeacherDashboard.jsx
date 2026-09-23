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
  AlertTriangle,
  ArrowRight,
  Filter,
  Eye
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
  } = useApp();

  const [selectedClass, setSelectedClass] = useState('ALL');

  // 통계 계산
  const totalStudents = studentRoster.length;
  const totalQuestions = questions.length;
  const pendingQuestions = questions.filter((q) => q.status === 'pending' || (!q.is_selected && q.status !== 'rejected')).length;
  const approvedQuestions = questions.filter((q) => q.is_selected || q.status === 'approved').length;
  const inProgressPortfolios = portfolios.filter((p) => !p.step4_conclusion).length;
  const completedPortfolios = portfolios.filter((p) => p.step4_conclusion).length;
  const reviewedPortfolios = portfolios.filter((p) => p.is_reviewed).length;

  // 학급별 필터 학생들
  const filteredStudents =
    selectedClass === 'ALL'
      ? studentRoster
      : studentRoster.filter((s) => s.grade_class === selectedClass);

  // 학생별 진행 상태 매핑 헬퍼
  const getStudentProgress = (student) => {
    const studentQs = questions.filter((q) => q.student_name === student.student_name);
    const approvedQ = studentQs.find((q) => q.is_selected || q.status === 'approved');
    const studentPfs = portfolios.filter((p) => p.student_name === student.student_name);
    const mainPf = studentPfs[0];

    let step = 0;
    if (studentQs.length > 0) step = 1; // 질문 등록
    if (approvedQ) step = 2; // 승인 완료
    if (mainPf?.step2_experiment) step = 3; // 실험 진행
    if (mainPf?.step3_failure_lesson) step = 4; // 실패분석
    if (mainPf?.step4_conclusion) step = 5; // 결론 완료

    const percent = Math.min(100, Math.round((step / 5) * 100));

    return {
      hasQuestions: studentQs.length > 0,
      questionCount: studentQs.length,
      hasApproved: Boolean(approvedQ),
      portfolio: mainPf,
      isReviewed: Boolean(mainPf?.is_reviewed),
      step,
      percent,
    };
  };

  return (
    <div className="space-y-4 pb-16 animate-fadeIn">
      {/* 상단 교사용 네비게이션 */}
      <TeacherNav />

      {/* 헤더 안내 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center space-x-1.5">
            <span>과학과 PBL 탐구 종합 대시보드</span>
          </h2>
          <p className="text-xs text-slate-500">
            학생들의 호기심 질문 등록부터 4단계 실패 분석 및 보고서 완성까지 한눈에 파악합니다.
          </p>
        </div>
      </div>

      {/* 종합 KPI 통계 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* 1. 승인 대기 질문 (최우선) */}
        <div
          onClick={() => navigate('/teacher/questions')}
          className="p-3.5 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl cursor-pointer hover:shadow-md transition space-y-1"
        >
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-[11px] font-bold">승인 대기 질문</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-black text-amber-900">{pendingQuestions}</span>
            <span className="text-xs text-amber-700 font-semibold">건</span>
          </div>
          <p className="text-[10px] text-amber-600 flex items-center space-x-0.5">
            <span>검토 및 승인하기</span>
            <ArrowRight className="w-3 h-3" />
          </p>
        </div>

        {/* 2. 총 학생 수 */}
        <div
          onClick={() => navigate('/teacher/roster')}
          className="p-3.5 bg-white border border-slate-200 rounded-2xl cursor-pointer hover:shadow-md transition space-y-1"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold">총 등록 학생</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-black text-slate-800">{totalStudents}</span>
            <span className="text-xs text-slate-500 font-semibold">명</span>
          </div>
          <p className="text-[10px] text-slate-400">7개 학급 (M6~H12)</p>
        </div>

        {/* 3. 승인된 탐구 과제 */}
        <div
          onClick={() => navigate('/teacher/questions')}
          className="p-3.5 bg-white border border-slate-200 rounded-2xl cursor-pointer hover:shadow-md transition space-y-1"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold">승인 완료 질문</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-black text-emerald-700">{approvedQuestions}</span>
            <span className="text-xs text-slate-500 font-semibold">/ {totalQuestions}건</span>
          </div>
          <p className="text-[10px] text-emerald-600">탐구 진행 가능 과제</p>
        </div>

        {/* 4. 완성된 최종 보고서 */}
        <div
          onClick={() => navigate('/teacher/portfolios')}
          className="p-3.5 bg-white border border-slate-200 rounded-2xl cursor-pointer hover:shadow-md transition space-y-1"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold">완성 보고서 & 도장</span>
            <Award className="w-4 h-4 text-purple-500" />
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-black text-purple-700">{completedPortfolios}</span>
            <span className="text-xs text-slate-500 font-semibold">편 (도장 {reviewedPortfolios})</span>
          </div>
          <p className="text-[10px] text-purple-600">총평 & 확인 도장 찍기</p>
        </div>
      </div>

      {/* 탐구 진행 현황판 (Student Progress Tracker) */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center space-x-1.5">
              <FlaskConical className="w-4 h-4 text-eureka-600" />
              <span>학생별 탐구 단계 진행 현황판</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              질문 $\rightarrow$ 승인 $\rightarrow$ 실험 $\rightarrow$ 실패분석 $\rightarrow$ 결론
            </p>
          </div>

          {/* 학급 필터 */}
          <div className="flex items-center space-x-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-2.5 py-1 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
            >
              <option value="ALL">전체 학급 ({studentRoster.length}명)</option>
              {classList.map((cls) => (
                <option key={cls} value={cls}>
                  {cls} 반
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 학생 목록 매트릭스 */}
        <div className="space-y-2.5">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              선택한 학급에 등록된 학생이 없습니다.
            </div>
          ) : (
            filteredStudents.map((student, idx) => {
              const prog = getStudentProgress(student);

              return (
                <div
                  key={idx}
                  className="p-3.5 bg-slate-50/80 border border-slate-200/70 rounded-2xl hover:bg-white hover:shadow-xs transition space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="bg-slate-800 text-white font-black text-[10px] px-1.5 py-0.5 rounded-md">
                        {student.grade_class}
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        {student.student_name}
                      </span>
                      {prog.isReviewed && (
                        <span className="text-[10px] font-black text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded-md">
                          💮 확인 도장
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 text-[11px]">
                      <span className="font-extrabold text-eureka-700">
                        {prog.percent}%
                      </span>
                      {prog.portfolio && (
                        <button
                          onClick={() =>
                            navigate(
                              `/report/${prog.portfolio.id}?questionId=${prog.portfolio.question_id}`
                            )
                          }
                          className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[10px] font-bold"
                        >
                          보고서 보기
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 프로그레스 바 */}
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        prog.percent === 100
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                          : prog.percent >= 60
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                          : 'bg-gradient-to-r from-amber-400 to-orange-400'
                      }`}
                      style={{ width: `${Math.max(5, prog.percent)}%` }}
                    />
                  </div>

                  {/* 단계별 상태 칩 */}
                  <div className="grid grid-cols-5 gap-1 text-[10px] text-center pt-0.5">
                    <span
                      className={`py-0.5 rounded ${
                        prog.hasQuestions ? 'bg-blue-100 text-blue-800 font-bold' : 'bg-slate-200/60 text-slate-400'
                      }`}
                    >
                      1. 질문등록
                    </span>
                    <span
                      className={`py-0.5 rounded ${
                        prog.hasApproved ? 'bg-emerald-100 text-emerald-800 font-bold' : 'bg-slate-200/60 text-slate-400'
                      }`}
                    >
                      2. 교사승인
                    </span>
                    <span
                      className={`py-0.5 rounded ${
                        prog.portfolio?.step2_experiment ? 'bg-indigo-100 text-indigo-800 font-bold' : 'bg-slate-200/60 text-slate-400'
                      }`}
                    >
                      3. 실험실행
                    </span>
                    <span
                      className={`py-0.5 rounded ${
                        prog.portfolio?.step3_failure_lesson ? 'bg-rose-100 text-rose-800 font-bold' : 'bg-slate-200/60 text-slate-400'
                      }`}
                    >
                      4. 실패분석
                    </span>
                    <span
                      className={`py-0.5 rounded ${
                        prog.portfolio?.step4_conclusion ? 'bg-amber-100 text-amber-800 font-bold' : 'bg-slate-200/60 text-slate-400'
                      }`}
                    >
                      5. 결론완료
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
