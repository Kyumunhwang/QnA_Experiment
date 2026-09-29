import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import TeacherNav from '../../components/teacher/TeacherNav';
import {
  Trophy,
  Filter,
  Calendar,
  Search,
  ArrowUpDown,
  History,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lightbulb,
  Zap,
  Award,
  TrendingUp,
  Users,
  ChevronRight,
  X,
  Sparkles,
  BarChart3,
  Flame
} from 'lucide-react';
import {
  getClassWeeklySummary,
  getStudentWeeklyHistory,
  getRecentWeeks,
  getWeekKey,
  getWeekDetails
} from '../../utils/scoring';

export default function TeacherWeeklyScores() {
  const { studentRoster, classList, questions, portfolios } = useApp();

  const recentWeeks = getRecentWeeks(8);
  const [selectedWeek, setSelectedWeek] = useState(getWeekKey());
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('score_desc'); // 'score_desc' | 'score_asc' | 'name_asc'
  const [modalStudent, setModalStudent] = useState(null);

  // 주차 요약 데이터 계산
  const classSummary = getClassWeeklySummary({
    students: studentRoster,
    gradeClass: selectedClass,
    weekKey: selectedWeek,
    questions,
    portfolios,
  });

  const weekInfo = getWeekDetails(selectedWeek);

  // 검색 및 정렬 필터링
  let displayedStudents = classSummary.studentScores.filter((s) => {
    const matchName = s.studentName.toLowerCase().includes(searchTerm.trim().toLowerCase());
    return matchName;
  });

  if (sortBy === 'score_desc') {
    displayedStudents.sort((a, b) => b.score - a.score || a.studentName.localeCompare(b.studentName));
  } else if (sortBy === 'score_asc') {
    displayedStudents.sort((a, b) => a.score - b.score || a.studentName.localeCompare(b.studentName));
  } else if (sortBy === 'name_asc') {
    displayedStudents.sort((a, b) => a.studentName.localeCompare(b.studentName));
  }

  // 모달에 띄울 학생의 매주 전체 점수 이력 데이터
  const studentWeeklyHistory = modalStudent
    ? getStudentWeeklyHistory({
        studentName: modalStudent.studentName,
        questions,
        portfolios,
        weeksCount: 8,
      })
    : [];

  return (
    <div className="space-y-4 pb-16 animate-fadeIn">
      <TeacherNav />

      {/* 헤더 안내 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <span>학생별 주간 탐구 점수 평가 대시보드</span>
          </h2>
          <p className="text-xs text-slate-500">
            매주 질문 수와 탐구 단계(실험·실패분석·결론·도장)에 따른 학생 점수(0~100점) 및 매주 전체 결과를 확인합니다.
          </p>
        </div>
      </div>

      {/* 필터 바: 주차 선택 & 반 선택 */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* 주차 선택 드롭다운 */}
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-eureka-600 shrink-0" />
            <span className="text-xs font-bold text-slate-700 shrink-0">평가 주차:</span>
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="px-3 py-1.5 text-xs font-black bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-eureka-500 shadow-2xs"
            >
              {recentWeeks.map((w, idx) => (
                <option key={w.weekKey} value={w.weekKey}>
                  {w.label} ({w.dateRange}) {idx === 0 ? '★ 이번 주' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* 반 선택 드롭다운 */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-xs font-bold text-slate-700 shrink-0">학급 선택:</span>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-1.5 text-xs font-black bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-eureka-500 shadow-2xs"
            >
              <option value="ALL">전체 학급 통합 ({studentRoster.length}명)</option>
              {classList.map((cls) => (
                <option key={cls} value={cls}>
                  {cls} 반
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 주차 요약 KPI 카드 */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
          <div className="bg-eureka-50/80 border border-eureka-200 rounded-2xl p-3">
            <span className="text-[11px] font-bold text-eureka-800 flex items-center space-x-1">
              <TrendingUp className="w-3.5 h-3.5 text-eureka-600" />
              <span>학급 평균 점수</span>
            </span>
            <div className="text-2xl font-black text-eureka-900 mt-1">
              {classSummary.avgScore}
              <span className="text-xs font-bold text-eureka-700 ml-1">점</span>
            </div>
            <p className="text-[10px] text-eureka-600">총 {classSummary.totalCount}명 대상</p>
          </div>

          <div className="bg-purple-50/80 border border-purple-200 rounded-2xl p-3">
            <span className="text-[11px] font-bold text-purple-800 flex items-center space-x-1">
              <Trophy className="w-3.5 h-3.5 text-purple-600" />
              <span>100점 만점 달성</span>
            </span>
            <div className="text-2xl font-black text-purple-900 mt-1">
              {classSummary.count100}
              <span className="text-xs font-bold text-purple-700 ml-1">명</span>
            </div>
            <p className="text-[10px] text-purple-600 font-medium">최종 도장 통과 학생</p>
          </div>

          <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-3">
            <span className="text-[11px] font-bold text-blue-800 flex items-center space-x-1">
              <Zap className="w-3.5 h-3.5 text-blue-600" />
              <span>90~99점 (도전)</span>
            </span>
            <div className="text-2xl font-black text-blue-900 mt-1">
              {classSummary.countChallenge}
              <span className="text-xs font-bold text-blue-700 ml-1">명</span>
            </div>
            <p className="text-[10px] text-blue-600 font-medium">승인 및 일지 진행 중</p>
          </div>

          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3">
            <span className="text-[11px] font-bold text-amber-800 flex items-center space-x-1">
              <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
              <span>80~89점 (격려)</span>
            </span>
            <div className="text-2xl font-black text-amber-900 mt-1">
              {classSummary.countEncourage}
              <span className="text-xs font-bold text-amber-700 ml-1">명</span>
            </div>
            <p className="text-[10px] text-amber-600 font-medium">질문 등록 (미승인/반려)</p>
          </div>

          <div className="bg-rose-50/80 border border-rose-200 rounded-2xl p-3 col-span-2 sm:col-span-1">
            <span className="text-[11px] font-bold text-rose-800 flex items-center space-x-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>0점 (미참여)</span>
            </span>
            <div className="text-2xl font-black text-rose-900 mt-1">
              {classSummary.countZero}
              <span className="text-xs font-bold text-rose-700 ml-1">명</span>
            </div>
            <p className="text-[10px] text-rose-600 font-medium">질문 등록 독려 필요</p>
          </div>
        </div>
      </div>

      {/* 검색 바 & 정렬 제어 */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="학생 이름으로 검색..."
            className="w-full bg-transparent text-xs font-semibold focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-1.5 self-end sm:self-auto">
          <span className="text-[11px] font-bold text-slate-500 flex items-center space-x-1">
            <ArrowUpDown className="w-3 h-3 text-slate-400" />
            <span>정렬:</span>
          </span>
          <button
            onClick={() => setSortBy('score_desc')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
              sortBy === 'score_desc'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            점수 높은순
          </button>
          <button
            onClick={() => setSortBy('score_asc')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
              sortBy === 'score_asc'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            점수 낮은순
          </button>
          <button
            onClick={() => setSortBy('name_asc')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
              sortBy === 'name_asc'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            이름 가나다순
          </button>
        </div>
      </div>

      {/* 학생 목록 테이블/카드 */}
      <div className="space-y-2">
        {displayedStudents.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-dashed border-slate-300 text-center text-xs text-slate-400">
            조건에 일치하는 학생이 없습니다.
          </div>
        ) : (
          displayedStudents.map((st, idx) => {
            const is100 = st.score === 100;
            const isChallenge = st.score >= 90 && st.score < 100;
            const isEncourage = st.score >= 80 && st.score < 90;
            const isZero = st.score === 0;

            return (
              <div
                key={idx}
                onClick={() => setModalStudent(st)}
                className={`p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-eureka-400 shadow-xs hover:shadow-md transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  is100 ? 'ring-1 ring-purple-300 bg-purple-50/20' : ''
                }`}
              >
                {/* 좌측: 반, 이름, 상태등 뱃지 */}
                <div className="flex items-center space-x-3">
                  <span className="bg-slate-800 text-white font-black text-[10px] px-2 py-0.5 rounded-md shrink-0">
                    {st.grade_class}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-sm font-black text-slate-900">{st.studentName}</span>
                      {is100 && (
                        <span className="text-[10px] font-black text-purple-700 bg-purple-100 px-1.5 py-0.2 rounded-md">
                          💮 100점 만점
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {st.message}
                    </p>
                  </div>
                </div>

                {/* 중앙: 세부 요약 태그 */}
                <div className="flex items-center space-x-2 text-[10px] font-bold">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                    질문 {st.questionCount}건
                  </span>
                  {st.isApproved ? (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                      질문 승인
                    </span>
                  ) : st.questionCount > 0 ? (
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                      미승인/반려
                    </span>
                  ) : null}
                  {st.hasStep4 ? (
                    <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800">
                      결론 완료
                    </span>
                  ) : st.hasStep2 ? (
                    <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                      실험 진행
                    </span>
                  ) : null}
                  {st.isReviewed && (
                    <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">
                      도장 승인
                    </span>
                  )}
                </div>

                {/* 우측: 점수 & 클릭 안내 화살표 */}
                <div className="flex items-center justify-between sm:justify-end space-x-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  {/* 상태등 아이콘 */}
                  <div className="flex items-center space-x-1">
                    {is100 ? (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-purple-100 text-purple-800 flex items-center space-x-1">
                        <Trophy className="w-3 h-3 text-purple-600" />
                        <span>축포 환영 🎆</span>
                      </span>
                    ) : isChallenge ? (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-blue-100 text-blue-800 flex items-center space-x-1">
                        <Zap className="w-3 h-3 text-blue-600" />
                        <span>도전등 ⚡</span>
                      </span>
                    ) : isEncourage ? (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-amber-100 text-amber-800 flex items-center space-x-1">
                        <Lightbulb className="w-3 h-3 text-amber-600" />
                        <span>격려등 💡</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-rose-100 text-rose-800 flex items-center space-x-1">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        <span>경고등 🚨</span>
                      </span>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="text-xl sm:text-2xl font-black text-slate-900">{st.score}</span>
                    <span className="text-xs font-bold text-slate-600 ml-0.5">점</span>
                  </div>

                  <div className="p-1 text-slate-400 group-hover:text-eureka-600 transition">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 학생 클릭 시: 매주 전체 점수 결과 모달 (Student Weekly History Modal) */}
      {modalStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-4 border border-slate-200">
            {/* 모달 상단 헤더 */}
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2.5 bg-eureka-50 text-eureka-600 rounded-2xl">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-slate-800 text-white font-black text-[10px] px-2 py-0.5 rounded-md">
                      {modalStudent.grade_class}
                    </span>
                    <h3 className="font-black text-base text-slate-900">
                      {modalStudent.studentName} 학생 주간 평가 이력
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    매주 질문 수, 단계 진행도, 최종 점수 트렌드를 한눈에 확인합니다.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setModalStudent(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 이번 주 점수 요약 배너 */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500">선택된 주차 ({weekInfo.label})</span>
                <div className="text-xs font-semibold text-slate-700 mt-0.5">{modalStudent.message}</div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-slate-900">{modalStudent.score}</span>
                <span className="text-xs font-bold text-slate-600 ml-0.5">점</span>
              </div>
            </div>

            {/* 주차별 전체 점수 이력 타임라인 리스트 */}
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              <h4 className="text-xs font-extrabold text-slate-700 flex items-center space-x-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-eureka-600" />
                <span>최근 8주간 매주 점수 결과</span>
              </h4>

              {studentWeeklyHistory.map((item, idx) => {
                const isSelected = item.weekKey === selectedWeek;
                return (
                  <div
                    key={item.weekKey}
                    className={`p-3 rounded-2xl border transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-eureka-50/70 border-eureka-300 ring-1 ring-eureka-400/40 shadow-xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-black text-slate-900">{item.weekInfo.label}</span>
                        <span className="text-[10px] text-slate-400">({item.weekInfo.dateRange})</span>
                        {item.weekKey === getWeekKey() && (
                          <span className="bg-eureka-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-md">
                            이번 주
                          </span>
                        )}
                      </div>

                      {/* 세부 진행 태그 */}
                      <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 mt-1">
                        <span>질문 {item.questionCount}건</span>
                        {item.isApproved && <span className="text-emerald-600 font-bold">· 승인</span>}
                        {item.hasStep2 && <span className="text-blue-600 font-bold">· 실험</span>}
                        {item.hasStep3 && <span className="text-indigo-600 font-bold">· 실패분석</span>}
                        {item.hasStep4 && <span className="text-purple-600 font-bold">· 결론</span>}
                        {item.isReviewed && <span className="text-rose-600 font-bold">· 💮 도장완료</span>}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-lg font-black text-slate-900">
                        {item.score}
                        <span className="text-xs font-bold text-slate-500 ml-0.5">점</span>
                      </div>
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                        item.score === 100
                          ? 'bg-purple-100 text-purple-800'
                          : item.score >= 90
                          ? 'bg-blue-100 text-blue-800'
                          : item.score >= 80
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-500'
                      }`}>
                        {item.score === 100 ? '축포 (100점)' : item.score >= 90 ? '도전 단계' : item.score >= 80 ? '격려 단계' : '미참여'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 닫기 버튼 */}
            <div className="pt-2 border-t">
              <button
                onClick={() => setModalStudent(null)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
