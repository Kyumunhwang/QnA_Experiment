/**
 * 사고실험 & PBL 탐구 일지 주간 점수 평가 엔진 (Weekly Scoring Engine)
 * 
 * [평가 기준]
 * - 질문 0건: 0점 (경고등: 질문 유도)
 * - 질문 등록 (반려 포함): 기본 80점
 * - 추가 질문 1건 (총 2건): 85점
 * - 이후 추가 질문 1건당 +1점 (최대 89점)
 * - 교사 승인 완료 시: 기본 90점 시작
 * - 승인 후 단계 진행 시마다 +3점 (최대 99점):
 *     - Step 2 실험 진행: 93점
 *     - Step 3 실패분석/가설수정: 96점
 *     - Step 4 결론 도출: 99점
 * - 교사 최종 확인 도장(is_reviewed) 완료 시: +1점 추가로 100점 만점! (축포 환영)
 */

/**
 * 주어진 날짜의 ISO 주차 키를 반환 (예: "2026-W40")
 * @param {string|Date} dateInput 
 * @returns {string}
 */
export function getWeekKey(dateInput = new Date()) {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return getWeekKey(new Date());

  // ISO-8601 week number calculation
  const target = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7; // Monday = 0, Sunday = 6
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  const weekNumber = 1 + Math.ceil((firstThursday - target) / 604800000);
  const year = target.getFullYear();
  return `${year}-W${String(weekNumber).padStart(2, '0')}`;
}

/**
 * 주차 키로부터 사람이 읽기 편한 라벨 및 날짜 범위 반환
 * @param {string} weekKey 예: "2026-W40"
 * @returns {{ label: string, dateRange: string }}
 */
export function getWeekDetails(weekKey) {
  if (!weekKey || !weekKey.includes('-W')) {
    const cur = getWeekKey();
    return getWeekDetails(cur);
  }

  const [yearStr, weekStr] = weekKey.split('-W');
  const year = parseInt(yearStr, 10);
  const week = parseInt(weekStr, 10);

  // 해당 주차의 월요일 구하기
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dow = simple.getDay();
  const ISOweekStart = simple;
  if (dow <= 4) {
    ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  } else {
    ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  }

  const mon = new Date(ISOweekStart);
  const sun = new Date(ISOweekStart);
  sun.setDate(mon.getDate() + 6);

  const formatMD = (d) => `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, '0')}`;
  const month = mon.getMonth() + 1;
  const weekOfMonth = Math.ceil(mon.getDate() / 7);

  return {
    weekKey,
    label: `${month}월 ${weekOfMonth}주차 (${weekStr}주)`,
    dateRange: `${formatMD(mon)} ~ ${formatMD(sun)}`,
    startDate: mon,
    endDate: sun,
  };
}

/**
 * 최근 N개 주차 목록 반환 (현재 주차 포함 최신순)
 * @param {number} count 
 * @returns {Array<{ weekKey: string, label: string, dateRange: string }>}
 */
export function getRecentWeeks(count = 6) {
  const weeks = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i * 7);
    const key = getWeekKey(d);
    if (!weeks.some((w) => w.weekKey === key)) {
      weeks.push(getWeekDetails(key));
    }
  }
  return weeks;
}

/**
 * 특정 학생의 특정 주차 점수를 계산
 * 
 * @param {Object} params
 * @param {string} params.studentName 학생 이름
 * @param {string} [params.weekKey] 대상 주차 키 (생략 시 현재 주차)
 * @param {Array} params.questions 전체 질문 배열
 * @param {Array} params.portfolios 전체 포트폴리오 배열
 * @returns {Object} 점수 및 평가 상세 정보
 */
export function calculateStudentWeeklyScore({
  studentName,
  weekKey = getWeekKey(),
  questions = [],
  portfolios = [],
}) {
  const targetWeek = weekKey;
  const weekInfo = getWeekDetails(targetWeek);

  // 1. 해당 학생의 질문들 필터링
  const studentAllQuestions = questions.filter((q) => q.student_name === studentName);

  // 주차별 매칭: 질문의 created_at이 targetWeek에 속하는 질문
  // 타임스탬프가 없으면 기본 현재 주차로 간주
  const weekQuestions = studentAllQuestions.filter((q) => {
    if (!q.created_at) return targetWeek === getWeekKey();
    return getWeekKey(q.created_at) === targetWeek;
  });

  const questionCount = weekQuestions.length;

  // 2. 질문 승인 여부
  const approvedQuestions = weekQuestions.filter(
    (q) => q.status === 'approved' || Boolean(q.is_selected)
  );
  const isApproved = approvedQuestions.length > 0;

  // 3. 포트폴리오 탐색
  // 해당 주차의 승인 질문과 연계된 포트폴리오이거나, 해당 학생의 주간 진행 포트폴리오
  const studentPf = portfolios.find((p) => {
    if (p.student_name !== studentName) return false;
    // 승인 질문과 직접 id 매칭
    if (isApproved && approvedQuestions.some((q) => q.id === p.question_id)) return true;
    // 또는 최근 수정일이 해당 주차인 경우
    if (p.last_updated && getWeekKey(p.last_updated) === targetWeek) return true;
    return false;
  }) || (isApproved ? portfolios.find((p) => p.student_name === studentName) : null);

  // 포트폴리오 단계 확인
  const hasStep2 = Boolean(studentPf?.step2_experiment && String(studentPf.step2_experiment).trim().length > 0);
  const hasStep3 = Boolean(studentPf?.step3_failure_lesson && String(studentPf.step3_failure_lesson).trim().length > 0);
  const hasStep4 = Boolean(studentPf?.step4_conclusion && String(studentPf.step4_conclusion).trim().length > 0);
  const isReviewed = Boolean(studentPf?.is_reviewed);

  // 4. 점수 계산
  let score = 0;
  let status = 'NONE'; // 'NONE' | 'ENCOURAGE' | 'CHALLENGE' | 'PERFECT'
  let breakdown = {
    baseQuestions: 0,
    bonusQuestions: 0,
    approvalBase: 0,
    step2Bonus: 0,
    step3Bonus: 0,
    step4Bonus: 0,
    finalStampBonus: 0,
  };
  let message = '';
  let lightType = 'warning'; // 'warning' (경고등) | 'encourage' (격려등) | 'challenge' (도전등) | 'perfect' (축포환영)

  if (questionCount === 0) {
    // [0점] 질문 없음
    score = 0;
    status = 'NONE';
    lightType = 'warning';
    message = '이번 주 아직 등록된 호기심 질문이 없습니다. 질문을 등록하고 탐구를 시작해 보세요!';
  } else if (!isApproved) {
    // [80점 ~ 89점] 질문 등록 완료 (반려 포함, 미승인 상태)
    status = 'ENCOURAGE';
    lightType = 'encourage';

    if (questionCount === 1) {
      score = 80;
      breakdown.baseQuestions = 80;
    } else if (questionCount === 2) {
      score = 85;
      breakdown.baseQuestions = 80;
      breakdown.bonusQuestions = 5;
    } else {
      // 3개 이상: 85 + (questionCount - 2), 최대 89점
      const bonus = Math.min(4, questionCount - 2);
      score = 85 + bonus;
      breakdown.baseQuestions = 80;
      breakdown.bonusQuestions = 5 + bonus;
    }

    message = '좋은 출발입니다! 선생님의 피드백을 확인하고 추가 질문이나 보완을 통해 승인에 도전해 보세요.';
  } else {
    // [90점 ~ 100점] 교사 승인 완료
    breakdown.approvalBase = 90;
    score = 90;

    if (hasStep2) {
      score += 3; // 93
      breakdown.step2Bonus = 3;
    }
    if (hasStep3) {
      score += 3; // 96
      breakdown.step3Bonus = 3;
    }
    if (hasStep4) {
      score += 3; // 99
      breakdown.step4Bonus = 3;
    }

    if (isReviewed) {
      score = 100; // 최종 확인 도장 승인 시 +1점 추가로 100점
      breakdown.finalStampBonus = 1;
      status = 'PERFECT';
      lightType = 'perfect';
      message = '🎉 완벽합니다! 선생님의 최종 확인 도장까지 승인되어 100점 만점을 달성했습니다!';
    } else {
      status = 'CHALLENGE';
      lightType = 'challenge';
      if (hasStep4) {
        message = '결론까지 모두 작성되었습니다! 선생님의 최종 확인 도장을 받으면 100점 만점이 됩니다.';
      } else if (hasStep3) {
        message = '실패 분석 완료! 마지막 Step 4 결론 도출까지 계속 도전해 보세요 (96점 달성).';
      } else if (hasStep2) {
        message = '실험 진행 중! 실패와 배운 점을 분석하는 Step 3으로 나아가 보세요 (93점 달성).';
      } else {
        message = '선생님의 질문 승인 완료! 실험을 시작하고 탐구 일지를 작성해 보세요 (90점 달성).';
      }
    }
  }

  // 100점 초과 방지
  score = Math.min(100, Math.max(0, score));

  return {
    studentName,
    weekKey: targetWeek,
    weekInfo,
    score,
    status,
    lightType,
    message,
    questionCount,
    isApproved,
    hasStep2,
    hasStep3,
    hasStep4,
    isReviewed,
    breakdown,
    questions: weekQuestions,
    portfolio: studentPf,
  };
}

/**
 * 특정 학생의 최근 N개 주차별 점수 이력(Weekly Score History)을 계산
 * 
 * @param {Object} params
 * @param {string} params.studentName
 * @param {Array} params.questions
 * @param {Array} params.portfolios
 * @param {number} [params.weeksCount=8]
 * @returns {Array<Object>} 주차별 점수 객체 배열 (최신순)
 */
export function getStudentWeeklyHistory({
  studentName,
  questions = [],
  portfolios = [],
  weeksCount = 8,
}) {
  const recentWeeks = getRecentWeeks(weeksCount);
  return recentWeeks.map((w) =>
    calculateStudentWeeklyScore({
      studentName,
      weekKey: w.weekKey,
      questions,
      portfolios,
    })
  );
}

/**
 * 특정 반(또는 전체)의 특정 주차 점수 현황 집계
 * 
 * @param {Object} params
 * @param {Array} params.students 학생 명렬표 배열
 * @param {string} [params.gradeClass='ALL'] 학급 필터
 * @param {string} [params.weekKey] 대상 주차 키
 * @param {Array} params.questions
 * @param {Array} params.portfolios
 * @returns {Object} 반별 학생 점수 목록 및 요약 통계
 */
export function getClassWeeklySummary({
  students = [],
  gradeClass = 'ALL',
  weekKey = getWeekKey(),
  questions = [],
  portfolios = [],
}) {
  const filteredStudents =
    gradeClass === 'ALL'
      ? students
      : students.filter((s) => s.grade_class === gradeClass);

  const studentScores = filteredStudents.map((s) => {
    const scoreData = calculateStudentWeeklyScore({
      studentName: s.student_name,
      weekKey,
      questions,
      portfolios,
    });
    return {
      ...scoreData,
      grade_class: s.grade_class,
    };
  });

  // 점수 내림차순 정렬
  studentScores.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.questionCount !== a.questionCount) return b.questionCount - a.questionCount;
    return a.studentName.localeCompare(b.studentName);
  });

  const totalCount = studentScores.length;
  const totalScore = studentScores.reduce((acc, s) => acc + s.score, 0);
  const avgScore = totalCount > 0 ? (totalScore / totalCount).toFixed(1) : '0.0';

  const count100 = studentScores.filter((s) => s.score === 100).length;
  const countChallenge = studentScores.filter((s) => s.score >= 90 && s.score < 100).length;
  const countEncourage = studentScores.filter((s) => s.score >= 80 && s.score < 90).length;
  const countZero = studentScores.filter((s) => s.score === 0).length;

  return {
    gradeClass,
    weekKey,
    weekInfo: getWeekDetails(weekKey),
    totalCount,
    avgScore,
    count100,
    countChallenge,
    countEncourage,
    countZero,
    studentScores,
  };
}
