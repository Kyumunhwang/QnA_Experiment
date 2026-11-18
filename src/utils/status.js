/**
 * 질문 상태 판별 공통 헬퍼 유틸리티
 * TeacherDashboard와 TeacherQuestions의 24건 집계 불일치 원인(rejected_no_score, rejected_type_a)을 단일화하여 해결
 */

export const REJECTED_STATUSES = ['rejected', 'rejected_no_score', 'rejected_type_a'];

/** 반려 / 보완요청 상태 여부 판별 */
export function isRejectedStatus(statusOrQuestion) {
  if (!statusOrQuestion) return false;
  const status = typeof statusOrQuestion === 'object' ? statusOrQuestion.status : statusOrQuestion;
  return REJECTED_STATUSES.includes(status);
}

/** 승인된 상태 여부 판별 (status === 'approved' 또는 is_selected === true) */
export function isApprovedStatus(statusOrQuestion) {
  if (!statusOrQuestion) return false;
  if (typeof statusOrQuestion === 'object') {
    return statusOrQuestion.status === 'approved' || Boolean(statusOrQuestion.is_selected);
  }
  return statusOrQuestion === 'approved';
}

/** 승인 대기 상태 여부 판별 (승인되지 않고 반려되지 않은 모든 질문) */
export function isPendingStatus(statusOrQuestion) {
  if (!statusOrQuestion) return false;
  if (isApprovedStatus(statusOrQuestion)) return false;
  if (isRejectedStatus(statusOrQuestion)) return false;
  return true;
}

/** 질문 상태 카테고리 3분류 ('approved' | 'rejected' | 'pending') */
export function getQuestionStatusCategory(q) {
  if (isApprovedStatus(q)) return 'approved';
  if (isRejectedStatus(q)) return 'rejected';
  return 'pending';
}
