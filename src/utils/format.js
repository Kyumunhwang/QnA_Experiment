/**
 * 날짜 및 문자열 정규화 포맷팅 유틸리티
 */

/**
 * ISO 날짜 문자열(UTC) 또는 로컬 날짜 문자열을 한국 표준시(KST)로 포맷팅
 * 예: "2026-11-16T22:56:50.000Z" -> "2026-11-17 07:56"
 */
export function formatKSTDate(dateStr, includeTime = true) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    // 한국 표준시 (KST, UTC+9)로 변환
    const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    const yyyy = kst.getUTCFullYear();
    const mm = String(kst.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(kst.getUTCDate()).padStart(2, '0');
    if (!includeTime) return `${yyyy}-${mm}-${dd}`;
    const hh = String(kst.getUTCHours()).padStart(2, '0');
    const min = String(kst.getUTCMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
  } catch (e) {
    return String(dateStr);
  }
}

/**
 * 학생 이름 오타 정규화
 * 예: "강세찬(Danie)l" -> "강세찬(Daniel)" 및 괄호 뒤 알파벳 누락 자동 교정
 */
export function normalizeStudentName(name) {
  if (!name) return '';
  let s = String(name).trim();
  // 닫는 괄호 뒤에 알파벳이 오는 오타 패턴 수정 (예: (Danie)l -> (Daniel))
  s = s.replace(/\(([^)]+)\)([a-zA-Z]+)/g, '($1$2)');
  return s;
}
