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
  Flame,
  Edit3,
  RotateCcw,
  Clock,
  ShieldCheck,
  Save
} from 'lucide-react';
import {
  getClassWeeklySummary,
  getStudentWeeklyHistory,
  getRecentWeeks,
  getWeekKey,
  getWeekDetails,
  isWeekWithinWindow
} from '../../utils/scoring';

export default function TeacherWeeklyScores() {
  const {
    studentRoster,
    classList,
    questions,
    portfolios,
    manualScores = {},
    saveManualScoreAction,
    deleteManualScoreAction,
    appConfig = {},
    updateConfigAction,
    currentTeacher,
    showToast,
  } = useApp();

  const recentWeeks = getRecentWeeks(8);
  const [selectedWeek, setSelectedWeek] = useState(getWeekKey());
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('score_desc'); // 'score_desc' | 'score_asc' | 'name_asc'
  
  // 모달 상태
  const [modalStudent, setModalStudent] = useState(null);
  const [editScoreTarget, setEditScoreTarget] = useState(null); // { studentName, gradeClass, weekKey, currentScore, systemScore, memo }
  const [editScoreValue, setEditScoreValue] = useState(90);
  const [editScoreMemo, setEditScoreMemo] = useState('');
  const [isSavingScore, setIsSavingScore] = useState(false);

  const windowWeeks = appConfig?.score_display_weeks || 2;
  const isSelectedWeekEditable = isWeekWithinWindow(selectedWeek, windowWeeks);

  // 학급 목록 (alumni 졸업생 포함)
  const availableClasses = Array.from(
    new Set([...classList, ...studentRoster.map((s) => s.grade_class)])
  ).filter(Boolean);

  // 주차 요약 데이터 계산 (수동 점수 및 공개 기간 연동)
  const classSummary = getClassWeeklySummary({
    students: studentRoster,
    gradeClass: selectedClass,
    weekKey: selectedWeek,
    questions,
    portfolios,
    manualScores,
    windowWeeks,
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
        manualScores,
        weeksCount: 8,
      })
    : [];

  // 점수 공개/입력 허용 기간 변경 핸들러
  const handleWindowChange = async (e) => {
    const newWeeks = Number(e.target.value);
    await updateConfigAction({ score_display_weeks: newWeeks });
    showToast(`점수 공개 및 입력 기간이 [최근 ${newWeeks}주간]으로 설정되었습니다.`, 'success');
  };

  // 점수 수정 모달 열기
  const handleOpenScoreEdit = (student, weekKey = selectedWeek) => {
    const scoreKey = `${student.studentName}_${weekKey}`;
    const existingOverride = manualScores[scoreKey];

    setEditScoreTarget({
      studentName: student.studentName,
      gradeClass: student.grade_class || student.gradeClass || selectedClass,
      weekKey,
      weekInfo: getWeekDetails(weekKey),
      systemScore: student.systemScore !== undefined ? student.systemScore : student.score,
      currentScore: student.score,
      isOverridden: Boolean(existingOverride),
    });

    setEditScoreValue(existingOverride ? existingOverride.score : student.score);
    setEditScoreMemo(existingOverride ? existingOverride.memo || '' : '');
  };

  // 점수 수정 저장 핸들러
  const handleSaveScore = async () => {
    if (!editScoreTarget) return;

    const numVal = Math.max(0, Math.min(100, Number(editScoreValue)));
    if (isNaN(numVal)) {
      showToast('올바른 점수(0~100)를 입력해주세요.', 'error');
      return;
    }

    setIsSavingScore(true);
    try {
      const res = await saveManualScoreAction({
        studentName: editScoreTarget.studentName,
        weekKey: editScoreTarget.weekKey,
        score: numVal,
        memo: editScoreMemo,
        updatedBy: currentTeacher?.teacher_name || '교사',
      });

      if (res.success) {
        showToast(`${editScoreTarget.studentName} 학생 점수가 ${numVal}점으로 저장되었습니다.`, 'success');
        setEditScoreTarget(null);
      }
    } finally {
      setIsSavingScore(false);
    }
  };

  // 시스템 자동 계산 점수로 복원 핸들러
  const handleResetToSystemScore = async () => {
    if (!editScoreTarget) return;

    if (!window.confirm(`${editScoreTarget.studentName} 학생의 점수를 시스템 자동 계산 점수로 복원하시겠습니까?`)) {
      return;
    }

    setIsSavingScore(true);
    try {
      const res = await deleteManualScoreAction(editScoreTarget.studentName, editScoreTarget.weekKey);
      if (res.success) {
        showToast('시스템 자동 계산 점수로 복원되었습니다.', 'info');
        setEditScoreTarget(null);
      }
    } finally {
      setIsSavingScore(false);
    }
  };

  return (
    <div className="space-y-4 pb-16 animate-fadeIn">
      <TeacherNav />

      {/* 헤더 안내 및 설정 컨트롤 */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <span>학생별 주간 탐구 점수 평가 대시보드</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            질문 등록(80~89점), 승인(90점), 일지 단계(+3점씩), 도장(100점) 점수를 조회하고 필요 시 교사가 직접 점수를 수정·부여합니다.
          </p>
        </div>

        {/* 점수 공개 및 입력 허용 기간 설정 (최장 2주) */}
        <div className="flex items-center space-x-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200 shrink-0">
          <Clock className="w-4 h-4 text-eureka-600" />
          <div className="text-[11px]">
            <span className="font-extrabold text-slate-700 block">점수 공개 및 입력 허용 기간</span>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <select
                value={windowWeeks}
                onChange={handleWindowChange}
                className="bg-white text-xs font-black text-slate-800 border border-slate-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-eureka-500"
              >
                <option value={1}>최근 1주간 (당해 주차만)</option>
                <option value={2}>최근 2주간 (당해 + 직전 주차 · 최장)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 필터 바: 주차 선택 & 반 선택 & 입력 가능 배지 */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* 주차 선택 드롭다운 */}
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <Calendar className="w-4 h-4 text-eureka-600 shrink-0" />
            <span className="text-xs font-bold text-slate-700 shrink-0">평가 주차:</span>
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="px-3 py-1.5 text-xs font-black bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-eureka-500 shadow-2xs"
            >
              {recentWeeks.map((w, idx) => (
                <option key={w.weekKey} value={w.weekKey}>
                  {w.label} ({w.dateRange}) {idx === 0 ? '★ 이번 주' : idx === 1 ? '· 지난 주' : ''}
                </option>
              ))}
            </select>

            {/* 입력 가능 기간 여부 배지 */}
            {isSelectedWeekEditable ? (
              <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                <span>점수 수정 및 입력 가능 주간</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                <span>🔒 기간 마감 (열람 전용)</span>
              </span>
            )}
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
              {availableClasses.map((cls) => (
                <option key={cls} value={cls}>
                  {cls === 'alumni' ? 'alumni (졸업생 보관)' : `${cls} 반`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 주차 요약 KPI 카드 */}
        <div className="grid grid-cols-2 sm:grid-cols-7 gap-2 pt-1">
          <div className="bg-eureka-50/80 border border-eureka-200 rounded-2xl p-2.5">
            <span className="text-[11px] font-bold text-eureka-800 flex items-center space-x-1">
              <TrendingUp className="w-3.5 h-3.5 text-eureka-600" />
              <span>평균 점수</span>
            </span>
            <div className="text-xl font-black text-eureka-900 mt-1">
              {classSummary.avgScore}
              <span className="text-xs font-bold text-eureka-700 ml-1">점</span>
            </div>
            <p className="text-[10px] text-eureka-600">총 {classSummary.totalCount}명</p>
          </div>

          <div className="bg-purple-50/80 border border-purple-200 rounded-2xl p-2.5">
            <span className="text-[11px] font-bold text-purple-800 flex items-center space-x-1">
              <Trophy className="w-3.5 h-3.5 text-purple-600" />
              <span>100점 만점</span>
            </span>
            <div className="text-xl font-black text-purple-900 mt-1">
              {classSummary.count100}
              <span className="text-xs font-bold text-purple-700 ml-1">명</span>
            </div>
            <p className="text-[10px] text-purple-600 font-medium">도장 통과</p>
          </div>

          <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-2.5">
            <span className="text-[11px] font-bold text-blue-800 flex items-center space-x-1">
              <Zap className="w-3.5 h-3.5 text-blue-600" />
              <span>90~99점</span>
            </span>
            <div className="text-xl font-black text-blue-900 mt-1">
              {classSummary.countChallenge}
              <span className="text-xs font-bold text-blue-700 ml-1">명</span>
            </div>
            <p className="text-[10px] text-blue-600 font-medium">승인·진행</p>
          </div>

          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-2.5">
            <span className="text-[11px] font-bold text-amber-800 flex items-center space-x-1">
              <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
              <span>80~89점</span>
            </span>
            <div className="text-xl font-black text-amber-900 mt-1">
              {classSummary.countEncourage}
              <span className="text-xs font-bold text-amber-700 ml-1">명</span>
            </div>
            <p className="text-[10px] text-amber-600 font-medium">반려 피드백</p>
          </div>

          <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-2.5">
            <span className="text-[11px] font-bold text-amber-800 flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>검토 대기</span>
            </span>
            <div className="text-xl font-black text-amber-900 mt-1">
              {classSummary.countPendingReview}
              <span className="text-xs font-bold text-amber-700 ml-1">명</span>
            </div>
            <p className="text-[10px] text-amber-600 font-medium">검토 대기(0점)</p>
          </div>

          <div className="bg-rose-50/80 border border-rose-200 rounded-2xl p-2.5">
            <span className="text-[11px] font-bold text-rose-800 flex items-center space-x-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>0점 (미참여)</span>
            </span>
            <div className="text-xl font-black text-rose-900 mt-1">
              {classSummary.countZero}
              <span className="text-xs font-bold text-rose-700 ml-1">명</span>
            </div>
            <p className="text-[10px] text-rose-600 font-medium">질문 미등록</p>
          </div>

          <div className="bg-indigo-50/80 border border-indigo-200 rounded-2xl p-2.5">
            <span className="text-[11px] font-bold text-indigo-800 flex items-center space-x-1">
              <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
              <span>교사 조정</span>
            </span>
            <div className="text-xl font-black text-indigo-900 mt-1">
              {classSummary.countOverridden}
              <span className="text-xs font-bold text-indigo-700 ml-1">명</span>
            </div>
            <p className="text-[10px] text-indigo-600 font-medium">수동 점수</p>
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
                className={`p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-eureka-400 shadow-xs hover:shadow-md transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  is100 ? 'ring-1 ring-purple-300 bg-purple-50/20' : ''
                }`}
              >
                {/* 좌측: 반, 이름, 상태등 뱃지 */}
                <div
                  onClick={() => setModalStudent(st)}
                  className="flex items-center space-x-3 cursor-pointer min-w-0 flex-1"
                >
                  <span className="bg-slate-800 text-white font-black text-[10px] px-2 py-0.5 rounded-md shrink-0">
                    {st.grade_class}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-1.5 flex-wrap">
                      <span className="text-sm font-black text-slate-900 hover:text-eureka-700 transition">
                        {st.studentName}
                      </span>
                      {is100 && (
                        <span className="text-[10px] font-black text-purple-700 bg-purple-100 px-1.5 py-0.2 rounded-md">
                          💮 100점 만점
                        </span>
                      )}
                      {st.isOverridden && (
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 border border-indigo-200 px-1.5 py-0.2 rounded-md">
                          교사 조정 ({st.overrideRecord?.score}점)
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {st.message}
                    </p>
                  </div>
                </div>

                {/* 중앙: 세부 요약 태그 */}
                <div className="flex items-center space-x-1.5 text-[10px] font-bold flex-wrap">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                    질문 {st.questionCount}건
                  </span>
                  {st.isApproved ? (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                      질문 승인
                    </span>
                  ) : st.rejectedCount > 0 ? (
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                      반려 {st.rejectedCount}건
                    </span>
                  ) : st.pendingCount > 0 ? (
                    <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                      검토 대기 {st.pendingCount}건
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

                {/* 우측: 점수 & 점수 수정 버튼 & 이력 버튼 */}
                <div className="flex items-center justify-between sm:justify-end space-x-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
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
                    ) : st.lightType === 'pending' ? (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-amber-50 text-amber-900 border border-amber-300 flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>검토대기 ⏳</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-rose-100 text-rose-800 flex items-center space-x-1">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        <span>경고등 🚨</span>
                      </span>
                    )}
                  </div>

                  <div className="text-right px-1">
                    <span className="text-xl sm:text-2xl font-black text-slate-900">{st.score}</span>
                    <span className="text-xs font-bold text-slate-600 ml-0.5">점</span>
                  </div>

                  {/* 점수 수정 버튼 */}
                  <button
                    onClick={() => handleOpenScoreEdit(st, selectedWeek)}
                    className="p-1.5 text-xs font-bold text-eureka-700 bg-eureka-50 hover:bg-eureka-100 border border-eureka-200 rounded-xl transition flex items-center space-x-1 shadow-2xs"
                    title="점수 직접 수정 및 사유 메모"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">점수 수정</span>
                  </button>

                  {/* 이력 보기 버튼 */}
                  <button
                    onClick={() => setModalStudent(st)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
                    title="주차별 전체 점수 이력 보기"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 교사 점수 수정/부여 팝업 모달 */}
      {editScoreTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm">교사 점수 수정 및 직접 부여</h3>
                  <p className="text-[11px] text-slate-500">
                    {editScoreTarget.gradeClass} {editScoreTarget.studentName} 학생 · {editScoreTarget.weekInfo.label}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditScoreTarget(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 현재 상태 정보 */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>시스템 자동 계산 점수:</span>
                <span className="font-bold text-slate-800">{editScoreTarget.systemScore}점</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>현재 적용된 점수:</span>
                <span className="font-extrabold text-indigo-600">{editScoreTarget.currentScore}점</span>
              </div>
            </div>

            {/* 점수 입력 및 빠른 프리셋 */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                부여할 점수 (0 ~ 100점)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editScoreValue}
                  onChange={(e) => setEditScoreValue(e.target.value)}
                  className="w-full text-2xl font-black text-center text-slate-900 bg-slate-50 border-2 border-indigo-200 focus:border-indigo-500 rounded-2xl py-2 focus:outline-none"
                />
                <span className="text-lg font-black text-slate-600">점</span>
              </div>

              {/* 점수 퀵 버튼 */}
              <div className="flex items-center space-x-1.5 pt-1">
                {[80, 85, 90, 95, 100].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setEditScoreValue(val)}
                    className="flex-1 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                  >
                    {val}점
                  </button>
                ))}
              </div>
            </div>

            {/* 사유 / 메모 입력 */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                점수 조정 사유 및 피드백 메모 (선택)
              </label>
              <textarea
                rows="2"
                value={editScoreMemo}
                onChange={(e) => setEditScoreMemo(e.target.value)}
                placeholder="예: 보고서 추가 작성 및 적극적 질문 참여로 5점 가산"
                className="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* 액션 버튼 */}
            <div className="space-y-2 pt-2 border-t">
              <button
                onClick={handleSaveScore}
                disabled={isSavingScore}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingScore ? '저장 중...' : '점수 수정 저장'}</span>
              </button>

              {editScoreTarget.isOverridden && (
                <button
                  onClick={handleResetToSystemScore}
                  disabled={isSavingScore}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>시스템 자동 계산 점수로 복원</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 학생 클릭 시: 매주 전체 점수 결과 모달 (Student Weekly History Dashboard) */}
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
                    매주 질문 수, 단계 진행도, 최종 점수 트렌드를 한눈에 확인하고 필요 시 점수를 수정합니다.
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
                      <div className="flex items-center space-x-1.5 flex-wrap">
                        <span className="text-xs font-black text-slate-900">{item.weekInfo.label}</span>
                        <span className="text-[10px] text-slate-400">({item.weekInfo.dateRange})</span>
                        {item.weekKey === getWeekKey() && (
                          <span className="bg-eureka-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-md">
                            이번 주
                          </span>
                        )}
                        {item.isOverridden && (
                          <span className="bg-indigo-100 text-indigo-700 text-[9px] font-bold px-1.5 py-0.2 rounded-md">
                            교사 조정
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

                    <div className="flex items-center space-x-2">
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

                      {/* 이력 내에서도 점수 수정 바로가기 버튼 */}
                      <button
                        onClick={() => handleOpenScoreEdit(modalStudent, item.weekKey)}
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 border border-indigo-200 rounded-lg transition"
                        title="이 주차 점수 수정"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
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
