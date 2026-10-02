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
 * 
 * [교사 권한 & 주간 연동 기능]
 * - 교사가 점수를 직접 수정/오버라이드할 수 있음
 * - 교사가 승인한 점수는 한 주가 지나더라도 해당 주차 점수에 항상 업데이트 반영
 * - 교사가 점수를 보여줄 수 있는 기간 설정 지원 (1주 ~ 최장 2주)
 */

/**
 * 주어진 날짜의 ISO 주차 키를 반환 (예: "2026-W40")
 * @param {string|Date} dateInput 
 * @returns {string}
 */
export function getWeekKey(dateInput = new Date()) {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return getWeekKey(new Date());

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
 * @returns {{ label: string, dateRange: string, startDate: Date, endDate: Date }}
 */
export function getWeekDetails(weekKey) {
  if (!weekKey || !weekKey.includes('-W')) {
    const cur = getWeekKey();
    return getWeekDetails(cur);
  }

  const [yearStr, weekStr] = weekKey.split('-W');
  const year = parseInt(yearStr, 10);
  const week = parseInt(weekStr, 10);

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
 * 직전 주차(Previous Week) 키 계산 (예: "2026-W40" -> "2026-W39")
 * @param {string} weekKey 
 * @returns {string}
 */
export function getPreviousWeekKey(weekKey = getWeekKey()) {
  const details = getWeekDetails(weekKey);
  const prevDate = new Date(details.startDate);
  prevDate.setDate(prevDate.getDate() - 7);
  return getWeekKey(prevDate);
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
 * 특정 주차가 현재 기준 교사 점수 공개/입력 허용 기간(최장 2주) 이내인지 확인
 * @param {string} weekKey 
 * @param {number} windowWeeks 1 또는 2 (기본값: 2)
 * @returns {boolean}
 */
export function isWeekWithinWindow(weekKey, windowWeeks = 2) {
  const curKey = getWeekKey();
  if (weekKey === curKey) return true;
  if (windowWeeks >= 2) {
    const prevKey = getPreviousWeekKey(curKey);
    if (weekKey === prevKey) return true;
  }
  return false;
}

/**
 * 특정 학생의 특정 주차 점수를 계산 (교사 수동 점수 및 지연 승인 반영)
 * 
 * @param {Object} params
 * @param {string} params.studentName 학생 이름
 * @param {string} [params.weekKey] 대상 주차 키 (생략 시 현재 주차)
 * @param {Array} params.questions 전체 질문 배열
 * @param {Array} params.portfolios 전체 포트폴리오 배열
 * @param {Object} [params.manualScores={}] 교사가 수정한 점수 맵
 * @returns {Object} 점수 및 평가 상세 정보
 */
export function calculateStudentWeeklyScore({
  studentName,
  weekKey = getWeekKey(),
  questions = [],
  portfolios = [],
  manualScores = {},
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

  // 2. 질문 상태별 분류 (승인, 반려, 검토 대기)
  const approvedQuestions = weekQuestions.filter(
    (q) => q.status === 'approved' || Boolean(q.is_selected)
  );
  const isApproved = approvedQuestions.length > 0;

  const rejectedQuestions = weekQuestions.filter(
    (q) => q.status === 'rejected'
  );
  const rejectedCount = rejectedQuestions.length;

  const pendingQuestions = weekQuestions.filter(
    (q) => q.status === 'pending' || (!q.status && !q.is_selected)
  );
  const pendingCount = pendingQuestions.length;

  // 3. 포트폴리오 탐색
  // 해당 주차의 승인 질문과 연계된 포트폴리오이거나, 해당 학생의 포트폴리오
  const studentPf = portfolios.find((p) => {
    if (p.student_name !== studentName) return false;
    // 승인 질문과 직접 id 매칭
    if (isApproved && approvedQuestions.some((q) => q.id === p.question_id)) return true;
    // 또는 최근 수정일이 해당 주차인 경우
    if (p.last_updated && getWeekKey(p.last_updated) === targetWeek) return true;
    return false;
  }) || (isApproved ? portfolios.find((p) => p.student_name === studentName) : null);

  // 포트폴리오 단계 및 교사 단계별 승인 여부 확인
  // 1단계 승인: step1_status === 'approved' (레거시: step2_experiment 존재 시 자동 승인 간주)
  const isStep1Approved = Boolean(
    studentPf?.step1_status === 'approved' ||
    (!studentPf?.step1_status && studentPf?.step2_experiment && String(studentPf.step2_experiment).trim().length > 0)
  );

  // 2단계 승인: step2_status === 'approved' (레거시: step3_failure_lesson 존재 시 자동 승인 간주)
  const isStep2Approved = Boolean(
    studentPf?.step2_status === 'approved' ||
    (!studentPf?.step2_status && studentPf?.step3_failure_lesson && String(studentPf.step3_failure_lesson).trim().length > 0)
  );

  // 3단계 승인: step3_status === 'approved' (레거시: step4_conclusion 존재 시 자동 승인 간주)
  const isStep3Approved = Boolean(
    studentPf?.step3_status === 'approved' ||
    (!studentPf?.step3_status && studentPf?.step4_conclusion && String(studentPf.step4_conclusion).trim().length > 0)
  );

  const hasStep2 = Boolean(studentPf?.step2_experiment && String(studentPf.step2_experiment).trim().length > 0);
  const hasStep3 = Boolean(studentPf?.step3_failure_lesson && String(studentPf.step3_failure_lesson).trim().length > 0);
  const hasStep4 = Boolean(studentPf?.step4_conclusion && String(studentPf.step4_conclusion).trim().length > 0);
  const isReviewed = Boolean(studentPf?.is_reviewed);

  // 4. 시스템 자동 점수 계산
  let systemScore = 0;
  let status = 'NONE'; // 'NONE' | 'PENDING_REVIEW' | 'ENCOURAGE' | 'CHALLENGE' | 'PERFECT'
  let breakdown = {
    baseQuestions: 0,
    bonusQuestions: 0,
    approvalBase: 0,
    step1Bonus: 0,
    step2Bonus: 0,
    step3Bonus: 0,
    finalStampBonus: 0,
  };
  let message = '';
  let lightType = 'warning'; // 'warning' | 'pending' | 'encourage' | 'challenge' | 'perfect'

  if (questionCount === 0) {
    // [0점] 이번 주 등록된 질문 없음
    systemScore = 0;
    status = 'NONE';
    lightType = 'warning';
    message = '이번 주 아직 등록된 호기심 질문이 없습니다. 질문을 등록하고 탐구를 시작해 보세요!';
  } else if (!isApproved && rejectedCount === 0) {
    // [0점] 질문은 등록했으나, 선생님이 아직 승인이나 반려(피드백)를 하지 않은 검토 대기 상태
    // ※ 선생님이 검토(반려 또는 승인)를 하기 전에는 점수가 부여되지 않음
    systemScore = 0;
    status = 'PENDING_REVIEW';
    lightType = 'pending';
    message = `등록한 호기심 질문(${questionCount}건)을 선생님이 검토하고 있습니다. 선생님의 검토(승인 또는 반려 피드백) 완료 후 점수가 부여됩니다!`;
  } else if (!isApproved && rejectedCount > 0) {
    // [80점 ~ 89점] 선생님이 검토하여 반려(보완 피드백)한 경우
    status = 'ENCOURAGE';
    lightType = 'encourage';

    if (rejectedCount === 1) {
      systemScore = 80;
      breakdown.baseQuestions = 80;
    } else if (rejectedCount === 2) {
      systemScore = 85;
      breakdown.baseQuestions = 80;
      breakdown.bonusQuestions = 5;
    } else {
      // 3건 이상 반려/피드백 검토 완료: 85 + (rejectedCount - 2), 최대 89점
      const bonus = Math.min(4, rejectedCount - 2);
      systemScore = 85 + bonus;
      breakdown.baseQuestions = 80;
      breakdown.bonusQuestions = 5 + bonus;
    }

    if (pendingCount > 0) {
      message = `선생님 검토 완료 질문 ${rejectedCount}건(반려)으로 ${systemScore}점이 부여되었습니다. 추가 제출된 질문(${pendingCount}건) 검토 완료 시 추가 점수가 반영됩니다!`;
    } else {
      message = `선생님의 보완 피드백(반려)이 완료되어 ${systemScore}점이 부여되었습니다. 피드백을 확인하고 추가 질문이나 보완을 통해 승인에 도전해 보세요!`;
    }
  } else {
    // [90점 ~ 100점] 선생님의 질문 승인 완료 (기본 90점)
    breakdown.approvalBase = 90;
    systemScore = 90;

    // 1단계(사전조사) 교사 승인 완료 시: +3점 (93점)
    if (isStep1Approved) {
      systemScore += 3;
      breakdown.step1Bonus = 3;
    }
    // 2단계(실험설계) 교사 승인 완료 시: +3점 (96점)
    if (isStep2Approved) {
      systemScore += 3;
      breakdown.step2Bonus = 3;
    }
    // 3단계(실패분석) 교사 승인 완료 시: +3점 (99점)
    if (isStep3Approved) {
      systemScore += 3;
      breakdown.step3Bonus = 3;
    }

    // 4단계 최종 확인 도장 승인 시: +1점 추가로 100점 만점 달성
    if (isReviewed) {
      systemScore = 100;
      breakdown.finalStampBonus = 1;
      status = 'PERFECT';
      lightType = 'perfect';
      message = '🎉 완벽합니다! 선생님의 최종 확인 도장까지 승인되어 100점 만점을 달성했습니다!';
    } else {
      status = 'CHALLENGE';
      lightType = 'challenge';
      if (isStep3Approved) {
        message = '실패 분석 승인 완료! 최종 4단계 결론을 작성하고 선생님의 최종 확인 도장(100점)에 도전하세요!';
      } else if (isStep2Approved) {
        message = '실험 설계 승인 완료! 실패와 배운 점을 분석하는 3단계 승인에 도전해 보세요 (96점 달성).';
      } else if (isStep1Approved) {
        message = '사전 조사 1단계 승인 완료! 실험을 설계하고 2단계 승인에 도전해 보세요 (93점 달성).';
      } else {
        message = '선생님의 질문 승인 완료! 1단계 사전 조사를 작성하고 교사 승인에 도전해 보세요 (90점 달성).';
      }
    }
  }

  systemScore = Math.min(100, Math.max(0, systemScore));

  // 5. 교사 수동 수정 점수(Manual Override) 확인
  const scoreKey = `${studentName}_${targetWeek}`;
  const overrideRecord = manualScores[scoreKey];
  const isOverridden = Boolean(overrideRecord && overrideRecord.score !== undefined);

  let finalScore = isOverridden ? Number(overrideRecord.score) : systemScore;
  finalScore = Math.min(100, Math.max(0, finalScore));

  // 오버라이드된 점수에 맞춰 상태 및 램프 재계산
  if (isOverridden) {
    if (finalScore === 100) {
      status = 'PERFECT';
      lightType = 'perfect';
    } else if (finalScore >= 90) {
      status = 'CHALLENGE';
      lightType = 'challenge';
    } else if (finalScore >= 80) {
      status = 'ENCOURAGE';
      lightType = 'encourage';
    } else {
      status = 'NONE';
      lightType = 'warning';
    }

    message = overrideRecord.memo
      ? `선생님 평가 조정 점수: "${overrideRecord.memo}" (${overrideRecord.updated_by || '교사'})`
      : `선생님이 직접 부여한 점수입니다. (${overrideRecord.updated_by || '교사'})`;
  }

  return {
    studentName,
    weekKey: targetWeek,
    weekInfo,
    score: finalScore,
    systemScore,
    isOverridden,
    overrideRecord,
    status,
    lightType,
    questionCount,
    rejectedCount,
    pendingCount,
    isApproved,
    isStep1Approved,
    isStep2Approved,
    isStep3Approved,
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
 * 학생의 [이번 주] 및 [지난 주] 비교 점수 객체 계산
 * 
 * @param {Object} params
 * @param {string} params.studentName
 * @param {Array} params.questions
 * @param {Array} params.portfolios
 * @param {Object} [params.manualScores={}]
 * @param {number} [params.windowWeeks=2] 교사 설정 기간 (최장 2주)
 * @returns {Object} 이번 주, 지난 주, 변화량(diff)
 */
export function getStudentComparisonScores({
  studentName,
  questions = [],
  portfolios = [],
  manualScores = {},
  windowWeeks = 2,
}) {
  const thisWeekKey = getWeekKey();
  const lastWeekKey = getPreviousWeekKey(thisWeekKey);

  const thisWeek = calculateStudentWeeklyScore({
    studentName,
    weekKey: thisWeekKey,
    questions,
    portfolios,
    manualScores,
  });

  const lastWeek = calculateStudentWeeklyScore({
    studentName,
    weekKey: lastWeekKey,
    questions,
    portfolios,
    manualScores,
  });

  const diff = thisWeek.score - lastWeek.score;
  const isWithinWindow = isWeekWithinWindow(lastWeekKey, windowWeeks);

  return {
    thisWeek,
    lastWeek,
    diff,
    trend: diff > 0 ? 'up' : diff < 0 ? 'down' : 'same',
    windowWeeks,
    isWithinWindow,
  };
}

/**
 * 특정 학생의 최근 N개 주차별 점수 이력(Weekly Score History)을 계산
 */
export function getStudentWeeklyHistory({
  studentName,
  questions = [],
  portfolios = [],
  manualScores = {},
  weeksCount = 8,
}) {
  const recentWeeks = getRecentWeeks(weeksCount);
  return recentWeeks.map((w) =>
    calculateStudentWeeklyScore({
      studentName,
      weekKey: w.weekKey,
      questions,
      portfolios,
      manualScores,
    })
  );
}

/**
 * 특정 반(또는 전체)의 특정 주차 점수 현황 집계
 */
export function getClassWeeklySummary({
  students = [],
  gradeClass = 'ALL',
  weekKey = getWeekKey(),
  questions = [],
  portfolios = [],
  manualScores = {},
  windowWeeks = 2,
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
      manualScores,
    });
    return {
      ...scoreData,
      grade_class: s.grade_class,
    };
  });

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
  const countPendingReview = studentScores.filter((s) => s.lightType === 'pending').length;
  const countZero = studentScores.filter((s) => s.score === 0 && s.lightType !== 'pending').length;
  const countOverridden = studentScores.filter((s) => s.isOverridden).length;

  return {
    gradeClass,
    weekKey,
    weekInfo: getWeekDetails(weekKey),
    windowWeeks,
    isEditable: isWeekWithinWindow(weekKey, windowWeeks),
    totalCount,
    avgScore,
    count100,
    countChallenge,
    countEncourage,
    countPendingReview,
    countZero,
    countOverridden,
    studentScores,
  };
}
