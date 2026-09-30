/**
 * Google Apps Script 및 LocalStorage Fallback 하이브리드 API 서비스
 * 교사 보안 인증, 교사 명렬표 관리, 담당 교사 황규문 확인 도장 연동
 */

const STORAGE_KEY_TEACHERS = 'science_eureka_teachers';
const STORAGE_KEY_STUDENTS = 'science_eureka_students';
const STORAGE_KEY_QUESTIONS = 'science_eureka_questions';
const STORAGE_KEY_PORTFOLIOS = 'science_eureka_portfolios';
const STORAGE_KEY_CONFIG = 'science_eureka_config';
const STORAGE_KEY_MANUAL_SCORES = 'science_eureka_manual_scores';
const STORAGE_KEY_API_URL = 'science_eureka_gas_api_url';

export const DEFAULT_CLASSES = ['M6', 'M7', 'M8', 'H9', 'H10', 'H11', 'H12'];

export const SCIENCE_CATEGORIES = [
  { id: 'physics', label: '물리 ⚡', color: 'bg-amber-100 text-amber-800' },
  { id: 'chem', label: '화학 🧪', color: 'bg-emerald-100 text-emerald-800' },
  { id: 'bio', label: '생명과학 🌱', color: 'bg-green-100 text-green-800' },
  { id: 'earth', label: '지구/우주 🌍', color: 'bg-blue-100 text-blue-800' },
  { id: 'general', label: '일상/융합 💡', color: 'bg-purple-100 text-purple-800' },
];

export const THEME_OPTIONS = [
  { id: 'emerald', name: '에메랄드 (기본)', bgGradient: 'from-eureka-600 via-teal-600 to-cyan-700', primaryHex: '#0d9488' },
  { id: 'blue', name: '스마트 블루', bgGradient: 'from-blue-600 via-indigo-600 to-sky-700', primaryHex: '#2563eb' },
  { id: 'purple', name: '창의 바이올렛', bgGradient: 'from-purple-600 via-violet-600 to-pink-700', primaryHex: '#9333ea' },
  { id: 'amber', name: '활력 오렌지', bgGradient: 'from-amber-600 via-orange-600 to-yellow-700', primaryHex: '#d97706' },
  { id: 'slate', name: '모던 차콜', bgGradient: 'from-slate-800 via-zinc-800 to-neutral-900', primaryHex: '#334155' },
];

const INITIAL_MOCK_CONFIG = {
  banner_title: '일상의 사소한 호기심이 위대한 과학 발견이 됩니다!',
  banner_desc: '호기심 질문을 등록하면 선생님이 검토 후 탐구 과제로 승인합니다. 실패는 더 정확한 답을 찾아가는 최고의 디딤돌입니다!',
  theme_color: 'emerald',
  score_display_weeks: 2, // 점수 공개 및 교사 입력 허용 기간 (최장 2주)
};

// 초기 교사 명렬표 (슈퍼유저: hwang / 5816 / 황규문 선생님)
const INITIAL_MOCK_TEACHERS = [
  {
    teacher_id: 'hwang',
    password: '5816',
    teacher_name: '황규문',
    role: 'superuser',
    created_at: '2026-09-23 09:00:00'
  }
];

// 초기 더미 학생 목록 제거 (구글 시트 100명 로스터 연동 사용)
const INITIAL_MOCK_STUDENTS = [];

const INITIAL_MOCK_QUESTIONS = [
  {
    id: 'Q-SAMPLE-01',
    grade_class: 'M6',
    student_name: '김우주',
    category: '물리 ⚡',
    ui_type: 'A',
    content: '왜 얼음은 물에 뜰까? 다른 물질들은 고체가 되면 가라앉는데 물만 반대인 이유가 뭘까?',
    created_at: '2026-09-21 14:20:00',
    is_selected: true,
    status: 'approved',
    teacher_feedback: '밀도와 물 분자 수소결합의 구조를 잘 연결해보면 훌륭한 탐구가 될 거야!',
  },
  {
    id: 'Q-SAMPLE-02',
    grade_class: 'M6',
    student_name: '이지구',
    category: '생명과학 🌱',
    ui_type: 'B',
    content: JSON.stringify({
      imageUrl: '',
      linkUrl: 'https://ko.wikipedia.org/wiki/%EB%B0%94%EB%82%98%EB%82%98',
      see: '바나나 껍질에 검은색 반점(슈가스팟)이 점점 많아지고 물렁해졌다.',
      think: '바나나가 스스로 에너지를 내거나 공기 중 무언가와 반응해서 색이 변하는 것 같다.',
      wonder: '바나나를 냉장고에 넣으면 왜 껍질이 더 빨리 까매질까? 온도가 낮으면 반응이 느려져야 하지 않나?'
    }),
    created_at: '2026-09-22 09:15:00',
    is_selected: true,
    status: 'approved',
    teacher_feedback: 'See-Think-Wonder 루틴을 훌륭하게 수행했네! 저온 장애(냉해) 현상을 관찰해보자.',
  },
  {
    id: 'Q-SAMPLE-03',
    grade_class: 'M6',
    student_name: '박하늘',
    category: '화학 🧪',
    ui_type: 'A',
    content: '비가 오기 직전에 나는 특유의 흙냄새는 왜 나는 걸까?',
    created_at: '2026-09-22 16:40:00',
    is_selected: false,
    status: 'pending',
    teacher_feedback: '',
  },
  {
    id: 'Q-SAMPLE-04',
    grade_class: 'M7',
    student_name: '최별이',
    category: '일상/융합 💡',
    ui_type: 'A',
    content: '달걀을 삶을 때 식초나 소금을 넣으면 정말 껍질이 잘 벗겨질까?',
    created_at: '2026-09-23 10:00:00',
    is_selected: false,
    status: 'rejected',
    teacher_feedback: '궁금증은 좋으나, 달걀 껍질의 주성분인 탄산칼슘과 식초(아세트산)의 화학 반응 관점에서 가설을 한 번 더 보완해보렴!',
  }
];

const INITIAL_MOCK_PORTFOLIOS = [
  {
    id: 'PF-SAMPLE-01',
    question_id: 'Q-SAMPLE-02',
    student_name: '이지구',
    grade_class: 'M6',
    step1_research: '나의 생각: 온도가 낮아지면 반응이 둔해져 덜 익을 것이다.\n친구 의견: 냉장고 속 습도 때문일 것 같다.\n사전조사: 바나나는 열대 과일이라 저온 장애를 겪는다고 함.',
    step2_experiment: '1. 실온(22도)과 냉장고(4도)에 바나나를 각각 보관함.\n2. 24시간 간격으로 껍질 사진 촬영 및 단단함 측정.\n참고 링크: https://ko.wikipedia.org/wiki/바나나',
    step3_failure_lesson: '냉장고 바나나 껍질이 실온보다 훨씬 빨리 까맣게 변했다! 추우면 무조건 안 익는다는 가설이 틀렸음을 배웠다.',
    step3_revised_hypothesis: '껍질은 냉해로 까매졌지만 속살은 실제로 덜 익었을 것이다. 당도계를 사용해 2차 실험을 계획함.',
    step4_conclusion: '바나나 최적 보관 온도는 13~16도이며, 냉장 시 껍질 효소 산화로 갈변은 빠르나 속살 성숙은 늦춰진다.',
    last_updated: '2026-09-23 11:30:00',
    is_reviewed: true,
    teacher_comment: '실패를 통해 저온 장애라는 깊이 있는 생명과학 원리를 스스로 깨달은 모범적인 탐구 포트폴리오입니다. 아주 훌륭합니다! 💮',
    reviewed_by: '황규문'
  }
];

function getLocal(key, defaultVal) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setLocal(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.warn('LocalStorage 저장 오류:', e);
  }
}

// 기본 구글 시트 웹앱 배포 URL (Fallback)
export const DEFAULT_GAS_API_URL = 'https://script.google.com/macros/s/AKfycbxwvo6yoNchzD7xD3-hjKZqauDf1AKAzEAxsJbK44xiJ9McVHz1ixtHFnrjV-6-dnKqGw/exec';

// 기존에 저장된 더미 학생(김우주 등)이 있으면 로컬스토리지 정리하여 시트 데이터로 덮어쓰도록 유도
try {
  const existingStudents = localStorage.getItem(STORAGE_KEY_STUDENTS);
  if (existingStudents && existingStudents.includes('김우주')) {
    localStorage.removeItem(STORAGE_KEY_STUDENTS);
  }
} catch (e) {}

if (!localStorage.getItem(STORAGE_KEY_TEACHERS)) setLocal(STORAGE_KEY_TEACHERS, INITIAL_MOCK_TEACHERS);
if (!localStorage.getItem(STORAGE_KEY_STUDENTS)) setLocal(STORAGE_KEY_STUDENTS, INITIAL_MOCK_STUDENTS);
if (!localStorage.getItem(STORAGE_KEY_QUESTIONS)) setLocal(STORAGE_KEY_QUESTIONS, INITIAL_MOCK_QUESTIONS);
if (!localStorage.getItem(STORAGE_KEY_PORTFOLIOS)) setLocal(STORAGE_KEY_PORTFOLIOS, INITIAL_MOCK_PORTFOLIOS);
if (!localStorage.getItem(STORAGE_KEY_CONFIG)) setLocal(STORAGE_KEY_CONFIG, INITIAL_MOCK_CONFIG);

export function getGasApiUrl() {
  return localStorage.getItem(STORAGE_KEY_API_URL) || import.meta.env.VITE_GAS_API_URL || DEFAULT_GAS_API_URL;
}

export function setGasApiUrl(url) {
  if (url) {
    localStorage.setItem(STORAGE_KEY_API_URL, url.trim());
  } else {
    localStorage.removeItem(STORAGE_KEY_API_URL);
  }
}

/* ==========================================================================
   교사 보안 인증 & 교사 명렬표 (Teacher Roster) API
   ========================================================================== */

/** 1. 교사 명렬표 조회 */
export async function getTeachers() {
  const apiUrl = getGasApiUrl();
  if (apiUrl) {
    try {
      const res = await fetch(`${apiUrl}?action=getTeachers`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setLocal(STORAGE_KEY_TEACHERS, json.data);
        return json.data;
      }
    } catch (err) {}
  }
  return getLocal(STORAGE_KEY_TEACHERS, INITIAL_MOCK_TEACHERS);
}

/** 2. 교사 로그인 검증 (Superuser: hwang / 5816) */
export async function verifyTeacher(teacherId, password) {
  const id = String(teacherId || '').trim();
  const pw = String(password || '').trim();

  // 슈퍼유저 하드코딩 즉시 인증 보장
  if (id === 'hwang' && pw === '5816') {
    return {
      success: true,
      teacher: { teacher_id: 'hwang', teacher_name: '황규문', role: 'superuser' }
    };
  }

  const apiUrl = getGasApiUrl();
  if (apiUrl) {
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'verifyTeacher', teacher_id: id, password: pw }),
      });
      const json = await res.json();
      if (json.success && json.teacher) return json;
    } catch (err) {}
  }

  // LocalStorage Mock
  const list = getLocal(STORAGE_KEY_TEACHERS, INITIAL_MOCK_TEACHERS);
  const found = list.find(t => t.teacher_id === id && String(t.password) === pw);
  if (found) {
    return {
      success: true,
      teacher: { teacher_id: found.teacher_id, teacher_name: found.teacher_name, role: found.role || 'teacher' }
    };
  }
  return { success: false, error: '교사 ID 또는 비밀번호가 일치하지 않습니다.' };
}

/** 3. 새 교사 등록 */
export async function addNewTeacher(teacherData) {
  const list = getLocal(STORAGE_KEY_TEACHERS, INITIAL_MOCK_TEACHERS);
  const id = String(teacherData.teacher_id || '').trim();
  if (list.some(t => t.teacher_id === id)) {
    return { success: false, error: '이미 사용 중인 교사 ID입니다.' };
  }

  const newTeacher = {
    teacher_id: id,
    password: String(teacherData.password || '1234').trim(),
    teacher_name: String(teacherData.teacher_name || '').trim(),
    role: String(teacherData.role || 'teacher').trim(),
    created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
  };

  setLocal(STORAGE_KEY_TEACHERS, [...list, newTeacher]);

  const apiUrl = getGasApiUrl();
  if (apiUrl) {
    try {
      await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'addTeacher', ...newTeacher }),
      });
    } catch (err) {}
  }

  return { success: true, message: `${newTeacher.teacher_name} 선생님이 등록되었습니다.` };
}

/** 4. 교사 정보 수정 */
export async function updateTeacher(teacherData) {
  const list = getLocal(STORAGE_KEY_TEACHERS, INITIAL_MOCK_TEACHERS);
  const id = String(teacherData.teacher_id || '').trim();
  const target = list.find(t => t.teacher_id === id);
  if (!target) return { success: false, error: '교사 정보를 찾을 수 없습니다.' };

  if (teacherData.password) target.password = String(teacherData.password).trim();
  if (teacherData.teacher_name) target.teacher_name = String(teacherData.teacher_name).trim();
  if (teacherData.role && id !== 'hwang') target.role = String(teacherData.role).trim();

  setLocal(STORAGE_KEY_TEACHERS, [...list]);

  const apiUrl = getGasApiUrl();
  if (apiUrl) {
    try {
      await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'updateTeacher', ...target }),
      });
    } catch (err) {}
  }

  return { success: true, message: '교사 정보가 성공적으로 수정되었습니다.' };
}

/** 5. 교사 삭제 (hwang 제외) */
export async function deleteTeacher(teacherId) {
  if (teacherId === 'hwang') {
    return { success: false, error: '최고 관리자(hwang) 계정은 삭제할 수 없습니다.' };
  }

  const list = getLocal(STORAGE_KEY_TEACHERS, INITIAL_MOCK_TEACHERS);
  const filtered = list.filter(t => t.teacher_id !== teacherId);
  setLocal(STORAGE_KEY_TEACHERS, filtered);

  const apiUrl = getGasApiUrl();
  if (apiUrl) {
    try {
      await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'deleteTeacher', teacher_id: teacherId }),
      });
    } catch (err) {}
  }

  return { success: true, message: '교사 계정이 삭제되었습니다.' };
}

/* ==========================================================================
   학생 명렬표 (Student Roster) API
   ========================================================================== */

/** 학생 명렬표 조회 */
export async function getStudents(forceNetwork = false) {
  const apiUrl = getGasApiUrl();
  if (apiUrl) {
    try {
      const cacheBuster = forceNetwork ? `&_t=${Date.now()}` : '';
      const res = await fetch(`${apiUrl}?action=getStudents${cacheBuster}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setLocal(STORAGE_KEY_STUDENTS, json.data);
        return { students: json.data, classes: json.classes || DEFAULT_CLASSES };
      }
    } catch (err) {
      console.warn('GAS getStudents failed, falling back to local storage:', err);
    }
  }
  return {
    students: getLocal(STORAGE_KEY_STUDENTS, INITIAL_MOCK_STUDENTS),
    classes: DEFAULT_CLASSES,
  };
}

/** 학생 로그인 비밀번호 검증 */
export async function verifyStudent(gradeClass, studentName, password) {
  const apiUrl = getGasApiUrl();
  if (apiUrl) {
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'verifyStudent', grade_class: gradeClass, student_name: studentName, password }),
      });
      return await res.json();
    } catch (err) {}
  }
  const list = getLocal(STORAGE_KEY_STUDENTS, INITIAL_MOCK_STUDENTS);
  const found = list.find(s => s.grade_class === gradeClass && s.student_name === studentName);
  if (!found) return { success: false, error: '등록되지 않은 학생입니다.' };
  if (String(found.password) === String(password)) return { success: true };
  return { success: false, error: '비밀번호가 일치하지 않습니다.' };
}

/** 학생 비밀번호 변경 */
export async function changeStudentPassword(gradeClass, studentName, newPassword) {
  if (!/^\d{4}$/.test(newPassword)) return { success: false, error: '4자리 숫자여야 합니다.' };
  const apiUrl = getGasApiUrl();
  const list = getLocal(STORAGE_KEY_STUDENTS, INITIAL_MOCK_STUDENTS);
  const target = list.find(s => s.grade_class === gradeClass && s.student_name === studentName);
  if (target) {
    target.password = newPassword;
    target.updated_at = new Date().toISOString();
    setLocal(STORAGE_KEY_STUDENTS, [...list]);
  }
  if (apiUrl) {
    try {
      await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'changePassword', grade_class: gradeClass, student_name: studentName, new_password: newPassword }),
      });
      await getStudents(true);
    } catch (err) {}
  }
  return { success: true, message: '비밀번호가 성공적으로 변경되었습니다.' };
}

/** 교사의 학생 비밀번호 1234 리셋 */
export async function resetStudentPassword(gradeClass, studentName) {
  const apiUrl = getGasApiUrl();
  const list = getLocal(STORAGE_KEY_STUDENTS, INITIAL_MOCK_STUDENTS);
  const target = list.find(s => s.grade_class === gradeClass && s.student_name === studentName);
  if (target) {
    target.password = '1234';
    target.updated_at = new Date().toISOString();
    setLocal(STORAGE_KEY_STUDENTS, [...list]);
  }
  if (apiUrl) {
    try {
      await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'resetPassword', grade_class: gradeClass, student_name: studentName }),
      });
      await getStudents(true);
    } catch (err) {}
  }
  return { success: true, message: `${studentName} 학생 비밀번호가 1234로 초기화되었습니다.` };
}

/** 새 학생 추가 */
export async function addNewStudent(gradeClass, studentName) {
  const list = getLocal(STORAGE_KEY_STUDENTS, INITIAL_MOCK_STUDENTS);
  if (list.some(s => s.grade_class === gradeClass && s.student_name === studentName)) {
    return { success: false, error: '이미 존재하는 학생입니다.' };
  }
  const newRecord = { grade_class: gradeClass, student_name: studentName, password: '1234', updated_at: new Date().toISOString() };
  setLocal(STORAGE_KEY_STUDENTS, [...list, newRecord]);

  const apiUrl = getGasApiUrl();
  if (apiUrl) {
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'addStudent', grade_class: gradeClass, student_name: studentName }),
      });
      const json = await res.json();
      await getStudents(true);
      return { success: true, message: json.message || `${studentName} 학생이 명렬표에 추가되었습니다.` };
    } catch (err) {
      console.warn('addStudent GAS error:', err);
    }
  }
  return { success: true, message: `${studentName} 학생이 명렬표에 추가되었습니다.` };
}

/** 학생 정보 수정 */
export async function updateStudent(oldClass, oldName, newClass, newName) {
  const list = getLocal(STORAGE_KEY_STUDENTS, INITIAL_MOCK_STUDENTS);
  const target = list.find(s => s.grade_class === oldClass && s.student_name === oldName);
  if (!target) return { success: false, error: '학생을 찾을 수 없습니다.' };

  target.grade_class = newClass;
  target.student_name = newName;
  target.updated_at = new Date().toISOString();
  setLocal(STORAGE_KEY_STUDENTS, [...list]);

  const apiUrl = getGasApiUrl();
  if (apiUrl) {
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'updateStudent', old_grade_class: oldClass, old_student_name: oldName, new_grade_class: newClass, new_student_name: newName }),
      });
      const json = await res.json();
      await getStudents(true);
      return { success: true, message: json.message || '학생 정보가 수정되었습니다.' };
    } catch (err) {
      console.warn('updateStudent GAS error:', err);
    }
  }
  return { success: true, message: '학생 정보가 수정되었습니다.' };
}

/** 학생 삭제 */
export async function deleteStudent(gradeClass, studentName) {
  const list = getLocal(STORAGE_KEY_STUDENTS, INITIAL_MOCK_STUDENTS);
  const filtered = list.filter(s => !(s.grade_class === gradeClass && s.student_name === studentName));
  setLocal(STORAGE_KEY_STUDENTS, filtered);

  const apiUrl = getGasApiUrl();
  if (apiUrl) {
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'deleteStudent', grade_class: gradeClass, student_name: studentName }),
      });
      const json = await res.json();
      await getStudents(true);
      return { success: true, message: json.message || `${studentName} 학생이 삭제되었습니다.` };
    } catch (err) {
      console.warn('deleteStudent GAS error:', err);
    }
  }
  return { success: true, message: `${studentName} 학생이 삭제되었습니다.` };
}

/** 1년 주기 학년 일괄 진급 (M6->M7, M7->M8, M8->H9, H9->H10, H10->H11, H11->H12, H12는 졸업 삭제) */
export async function promoteStudents() {
  const GRADE_MAP = {
    'M6': 'M7',
    'M7': 'M8',
    'M8': 'H9',
    'H9': 'H10',
    'H10': 'H11',
    'H11': 'H12'
  };

  const apiUrl = getGasApiUrl();
  if (apiUrl) {
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'promoteStudents' }),
      });
      const json = await res.json();
      if (json.success) {
        await getStudents(true);
        return {
          success: true,
          message: json.message || '학년 진급 처리가 완료되었습니다.',
          promotedCount: json.promotedCount,
          graduatedCount: json.graduatedCount,
        };
      }
    } catch (err) {
      console.warn('GAS promoteStudents error, executing local fallback:', err);
    }
  }

  // 로컬 Fallback 실행
  const list = getLocal(STORAGE_KEY_STUDENTS, INITIAL_MOCK_STUDENTS);
  let promotedCount = 0;
  let graduatedCount = 0;

  const updatedList = [];
  for (const s of list) {
    const curClass = String(s.grade_class || '').trim();
    if (curClass === 'H12') {
      graduatedCount++;
      continue;
    }
    const nextClass = GRADE_MAP[curClass] || curClass;
    if (nextClass !== curClass) {
      promotedCount++;
    }
    updatedList.push({
      ...s,
      grade_class: nextClass,
      updated_at: new Date().toISOString(),
    });
  }

  setLocal(STORAGE_KEY_STUDENTS, updatedList);

  return {
    success: true,
    message: `총 ${promotedCount}명 진급 완료, ${graduatedCount}명(H12) 졸업 처리되었습니다. (로컬 반영)`,
    promotedCount,
    graduatedCount,
  };
}

/* ==========================================================================
   질문 & 포트폴리오 & 홈 설정 API
   ========================================================================== */

/** 질문 목록 조회 */
export async function getQuestions() {
  const apiUrl = getGasApiUrl();
  if (apiUrl) {
    try {
      const res = await fetch(`${apiUrl}?action=getQuestions`, { method: 'GET' });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setLocal(STORAGE_KEY_QUESTIONS, json.data);
        return json.data;
      }
    } catch (err) {}
  }
  return getLocal(STORAGE_KEY_QUESTIONS, []);
}

/** 질문 등록 */
export async function addQuestion(questionData) {
  const newQuestion = {
    id: 'Q-' + Date.now(),
    grade_class: questionData.grade_class || '',
    student_name: questionData.student_name || '익명 학생',
    category: questionData.category || '일상/융합 💡',
    ui_type: questionData.ui_type || 'A',
    content: typeof questionData.content === 'object' ? JSON.stringify(questionData.content) : String(questionData.content),
    created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
    is_selected: false,
    status: 'pending',
    teacher_feedback: '',
  };

  const currentList = getLocal(STORAGE_KEY_QUESTIONS, []);
  setLocal(STORAGE_KEY_QUESTIONS, [newQuestion, ...currentList]);

  const apiUrl = getGasApiUrl();
  if (apiUrl) {
    try {
      await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'addQuestion', ...newQuestion }),
      });
    } catch (err) {}
  }
  return newQuestion;
}

/** 질문 승인/반려 상태 및 피드백 갱신 */
export async function updateQuestionStatus(questionId, status, teacherFeedback) {
  const list = getLocal(STORAGE_KEY_QUESTIONS, []);
  const target = list.find(q => q.id === questionId);
  const isSelected = status === 'approved';

  if (target) {
    target.status = status;
    target.is_selected = isSelected;
    target.teacher_feedback = teacherFeedback !== undefined ? teacherFeedback : target.teacher_feedback;
    setLocal(STORAGE_KEY_QUESTIONS, [...list]);
  }

  const apiUrl = getGasApiUrl();
  if (apiUrl) {
    try {
      await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'updateQuestionStatus', question_id: questionId, status, teacher_feedback: teacherFeedback }),
      });
    } catch (err) {}
  }
  return target;
}

/** 포트폴리오 목록 조회 */
export async function getPortfolios(studentName, questionId) {
  const apiUrl = getGasApiUrl();
  if (apiUrl) {
    try {
      let query = `${apiUrl}?action=getPortfolios`;
      if (studentName) query += `&student_name=${encodeURIComponent(studentName)}`;
      if (questionId) query += `&question_id=${encodeURIComponent(questionId)}`;
      const res = await fetch(query);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) return json.data;
    } catch (err) {}
  }
  const list = getLocal(STORAGE_KEY_PORTFOLIOS, []);
  return list.filter(item => {
    let match = true;
    if (studentName && item.student_name !== studentName) match = false;
    if (questionId && String(item.question_id) !== String(questionId)) match = false;
    return match;
  });
}

/** 포트폴리오 저장 */
export async function savePortfolio(portfolioData) {
  const list = getLocal(STORAGE_KEY_PORTFOLIOS, []);
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

  let targetId = portfolioData.id;
  let existingIndex = -1;

  if (targetId) {
    existingIndex = list.findIndex(p => p.id === targetId);
  } else if (portfolioData.question_id && portfolioData.student_name) {
    existingIndex = list.findIndex(
      p => p.question_id === portfolioData.question_id && p.student_name === portfolioData.student_name
    );
  }

  const savedRecord = {
    id: existingIndex >= 0 ? list[existingIndex].id : (targetId || ('PF-' + Date.now())),
    question_id: portfolioData.question_id || '',
    student_name: portfolioData.student_name || '',
    grade_class: portfolioData.grade_class || '',
    step1_research: portfolioData.step1_research || '',
    step2_experiment: portfolioData.step2_experiment || '',
    step3_failure_lesson: portfolioData.step3_failure_lesson || '',
    step3_revised_hypothesis: portfolioData.step3_revised_hypothesis || '',
    step4_conclusion: portfolioData.step4_conclusion || '',
    last_updated: now,
    is_reviewed: existingIndex >= 0 ? list[existingIndex].is_reviewed : false,
    teacher_comment: existingIndex >= 0 ? list[existingIndex].teacher_comment : '',
    reviewed_by: existingIndex >= 0 ? (list[existingIndex].reviewed_by || '황규문') : '황규문',
  };

  if (existingIndex >= 0) list[existingIndex] = savedRecord;
  else list.unshift(savedRecord);
  setLocal(STORAGE_KEY_PORTFOLIOS, list);

  const apiUrl = getGasApiUrl();
  if (apiUrl) {
    try {
      await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'savePortfolio', ...savedRecord }),
      });
    } catch (err) {}
  }
  return savedRecord;
}

/** 교사 확인 도장 및 코멘트 부여 (기본 담당 교사: 황규문) */
export async function reviewPortfolio(portfolioId, isReviewed, teacherComment, reviewedBy = '황규문') {
  const list = getLocal(STORAGE_KEY_PORTFOLIOS, []);
  const target = list.find(p => p.id === portfolioId);
  if (target) {
    target.is_reviewed = isReviewed;
    target.teacher_comment = teacherComment || '';
    target.reviewed_by = reviewedBy;
    setLocal(STORAGE_KEY_PORTFOLIOS, [...list]);
  }

  const apiUrl = getGasApiUrl();
  if (apiUrl) {
    try {
      await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'reviewPortfolio',
          id: portfolioId,
          is_reviewed: isReviewed,
          teacher_comment: teacherComment,
          reviewed_by: reviewedBy
        }),
      });
    } catch (err) {}
  }
  return target;
}

/** 홈 설정 조회 및 저장 */
export async function getAppConfig() {
  const apiUrl = getGasApiUrl();
  if (apiUrl) {
    try {
      const res = await fetch(`${apiUrl}?action=getConfig`);
      const json = await res.json();
      if (json.success && json.data) {
        setLocal(STORAGE_KEY_CONFIG, { ...INITIAL_MOCK_CONFIG, ...json.data });
        return { ...INITIAL_MOCK_CONFIG, ...json.data };
      }
    } catch (err) {}
  }
  return getLocal(STORAGE_KEY_CONFIG, INITIAL_MOCK_CONFIG);
}

export async function saveAppConfig(newConfig) {
  setLocal(STORAGE_KEY_CONFIG, newConfig);
  const apiUrl = getGasApiUrl();
  if (apiUrl) {
    try {
      await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'saveConfig', ...newConfig }),
      });
    } catch (err) {}
  }
  return newConfig;
}

/** 질문 승인 토글 (기존 호환) */
export async function toggleSelectQuestion(questionId, isSelected) {
  const list = getLocal(STORAGE_KEY_QUESTIONS, []);
  const target = list.find(q => q.id === questionId);
  const nextStatus = isSelected !== undefined ? (isSelected ? 'approved' : 'pending') : (target?.is_selected ? 'pending' : 'approved');
  return await updateQuestionStatus(questionId, nextStatus);
}

/* ==========================================================================
   교사 수동 점수 수정 (Manual Score Override) API
   ========================================================================== */

/** 교사가 수정한 점수 목록 조회 */
export async function getManualScores() {
  const apiUrl = getGasApiUrl();
  if (apiUrl) {
    try {
      const res = await fetch(`${apiUrl}?action=getManualScores`);
      const json = await res.json();
      if (json.success && json.data) {
        setLocal(STORAGE_KEY_MANUAL_SCORES, json.data);
        return json.data;
      }
    } catch (err) {}
  }
  return getLocal(STORAGE_KEY_MANUAL_SCORES, {});
}

/** 교사의 학생 주간 점수 수정 및 저장 */
export async function saveManualScore({ studentName, weekKey, score, memo = '', teacherName = '교사' }) {
  const currentScores = getLocal(STORAGE_KEY_MANUAL_SCORES, {});
  const scoreKey = `${studentName}_${weekKey}`;

  const updatedRecord = {
    student_name: studentName,
    week_key: weekKey,
    score: Number(score),
    memo: memo.trim(),
    updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
    updated_by: teacherName,
  };

  const newScores = {
    ...currentScores,
    [scoreKey]: updatedRecord,
  };

  setLocal(STORAGE_KEY_MANUAL_SCORES, newScores);

  const apiUrl = getGasApiUrl();
  if (apiUrl) {
    try {
      await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'saveManualScore', ...updatedRecord }),
      });
    } catch (err) {}
  }

  return { success: true, record: updatedRecord, allScores: newScores };
}

/** 교사의 수동 점수 수정 취소 (시스템 자동 계산 점수로 복원) */
export async function deleteManualScore(studentName, weekKey) {
  const currentScores = getLocal(STORAGE_KEY_MANUAL_SCORES, {});
  const scoreKey = `${studentName}_${weekKey}`;

  if (currentScores[scoreKey]) {
    delete currentScores[scoreKey];
    setLocal(STORAGE_KEY_MANUAL_SCORES, { ...currentScores });
  }

  const apiUrl = getGasApiUrl();
  if (apiUrl) {
    try {
      await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'deleteManualScore', student_name: studentName, week_key: weekKey }),
      });
    } catch (err) {}
  }

  return { success: true, allScores: currentScores };
}
