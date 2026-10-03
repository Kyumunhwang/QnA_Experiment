/**
 * 사고실험 & PBL 탐구 일지 앱 (Science Eureka) - Google Apps Script (GAS) API
 * v4.0 (교사 전용 보안 인증, 교사 명렬표 관리, 황규문 선생님 확인 도장 연동)
 */

const SHEET_TEACHERS = 'Teachers';
const SHEET_STUDENTS = 'Students';
const SHEET_QUESTIONS = 'Questions';
const SHEET_PORTFOLIOS = 'Portfolios';
const SHEET_CONFIG = 'Config';

const CLASSES = ['M6', 'M7', 'M8', 'H9', 'H10', 'H11', 'H12'];

function initialSetup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Teachers 시트 (교사 명렬표 & 슈퍼유저)
  let tSheet = ss.getSheetByName(SHEET_TEACHERS);
  if (!tSheet) tSheet = ss.insertSheet(SHEET_TEACHERS);
  const tHeaders = ['teacher_id', 'password', 'teacher_name', 'role', 'created_at'];
  tSheet.getRange(1, 1, 1, tHeaders.length).setValues([tHeaders]);
  tSheet.getRange(1, 1, 1, tHeaders.length).setFontWeight('bold').setBackground('#FCE7F3');
  
  if (tSheet.getLastRow() <= 1) {
    const superuser = [['hwang', '5816', '황규문', 'superuser', Utilities.formatDate(new Date(), 'GMT+9', 'yyyy-MM-dd HH:mm:ss')]];
    tSheet.getRange(2, 1, 1, 5).setValues(superuser);
  }

  // 2. Students 시트
  let sSheet = ss.getSheetByName(SHEET_STUDENTS);
  if (!sSheet) sSheet = ss.insertSheet(SHEET_STUDENTS);
  const sHeaders = ['grade_class', 'student_name', 'password', 'updated_at'];
  sSheet.getRange(1, 1, 1, sHeaders.length).setValues([sHeaders]);
  sSheet.getRange(1, 1, 1, sHeaders.length).setFontWeight('bold').setBackground('#FEF3C7');
  
  if (sSheet.getLastRow() <= 1) {
    const sampleStudents = [
      ['M6', '김우주', '1234', ''],
      ['M6', '이지구', '1234', ''],
      ['M6', '박하늘', '1234', ''],
      ['M7', '최별이', '1234', ''],
      ['M7', '정태양', '1234', ''],
      ['M7', '강바람', '1234', ''],
      ['M8', '윤바다', '1234', ''],
      ['M8', '장샛별', '1234', ''],
      ['H9', '임은하', '1234', ''],
      ['H9', '한혜성', '1234', ''],
      ['H10', '오오로라', '1234', ''],
      ['H11', '신화성', '1234', ''],
      ['H12', '배목성', '1234', '']
    ];
    sSheet.getRange(2, 1, sampleStudents.length, 4).setValues(sampleStudents);
  }

  // 3. Questions 시트
  let qSheet = ss.getSheetByName(SHEET_QUESTIONS);
  if (!qSheet) qSheet = ss.insertSheet(SHEET_QUESTIONS);
  const qHeaders = ['id', 'student_name', 'ui_type', 'content', 'created_at', 'is_selected', 'grade_class', 'category', 'status', 'teacher_feedback'];
  qSheet.getRange(1, 1, 1, qHeaders.length).setValues([qHeaders]);
  qSheet.getRange(1, 1, 1, qHeaders.length).setFontWeight('bold').setBackground('#E8F0FE');
  
  // 4. Portfolios 시트 (reviewed_by 및 단계별 승인/피드백 열 추가)
  let pSheet = ss.getSheetByName(SHEET_PORTFOLIOS);
  if (!pSheet) pSheet = ss.insertSheet(SHEET_PORTFOLIOS);
  const pHeaders = [
    'id', 'question_id', 'student_name', 'step1_research', 'step2_experiment', 
    'step3_failure_lesson', 'step3_revised_hypothesis', 'step4_conclusion', 
    'last_updated', 'grade_class', 'is_reviewed', 'teacher_comment', 'reviewed_by',
    'step1_status', 'step1_feedback', 'step2_status', 'step2_feedback',
    'step3_status', 'step3_feedback', 'step4_status', 'step4_feedback'
  ];
  pSheet.getRange(1, 1, 1, pHeaders.length).setValues([pHeaders]);
  pSheet.getRange(1, 1, 1, pHeaders.length).setFontWeight('bold').setBackground('#E6F4EA');

  // 5. Config 시트
  let cSheet = ss.getSheetByName(SHEET_CONFIG);
  if (!cSheet) cSheet = ss.insertSheet(SHEET_CONFIG);
  const cHeaders = ['key', 'value'];
  cSheet.getRange(1, 1, 1, cHeaders.length).setValues([cHeaders]);
  if (cSheet.getLastRow() <= 1) {
    cSheet.appendRow(['banner_title', '일상의 사소한 호기심이 위대한 과학 발견이 됩니다!']);
    cSheet.appendRow(['banner_desc', '호기심 질문을 등록하면 선생님이 검토 후 탐구 과제로 승인합니다. 실패는 더 정확한 답을 찾아가는 최고의 디딤돌입니다!']);
    cSheet.appendRow(['theme_color', 'emerald']);
  }
}

function doGet(e) {
  try {
    const action = e.parameter.action || 'getQuestions';
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. 교사 명렬표 조회
    if (action === 'getTeachers') {
      const sheet = ss.getSheetByName(SHEET_TEACHERS);
      if (!sheet) return createResponse({ success: false, error: 'Teachers 시트 없음' });
      const rows = sheet.getDataRange().getValues();
      if (rows.length <= 1) return createResponse({ success: true, data: [] });
      const headers = rows[0];
      const data = rows.slice(1).map(row => {
        const item = {};
        headers.forEach((h, i) => { item[h] = row[i]; });
        return item;
      });
      return createResponse({ success: true, data: data });
    }
    
    // 2. 학생 명렬표 조회
    if (action === 'getStudents') {
      const sheet = ss.getSheetByName(SHEET_STUDENTS);
      if (!sheet) return createResponse({ success: false, error: 'Students 시트 없음' });
      const rows = sheet.getDataRange().getValues();
      if (rows.length <= 1) return createResponse({ success: true, data: [] });
      const headers = rows[0];
      const data = rows.slice(1).map(row => {
        const item = {};
        headers.forEach((h, i) => { item[h] = row[i]; });
        return item;
      });
      return createResponse({ success: true, data: data, classes: CLASSES });
    }

    // 3. 질문 목록 조회
    if (action === 'getQuestions') {
      const sheet = ss.getSheetByName(SHEET_QUESTIONS);
      if (!sheet) return createResponse({ success: false, error: 'Questions 시트 없음' });
      const rows = sheet.getDataRange().getValues();
      if (rows.length <= 1) return createResponse({ success: true, data: [] });
      const headers = rows[0];
      const data = rows.slice(1).map(row => {
        const item = {};
        headers.forEach((h, i) => { item[h] = row[i]; });
        try {
          if (typeof item.content === 'string' && (item.content.startsWith('{') || item.content.startsWith('['))) {
            item.parsedContent = JSON.parse(item.content);
          }
        } catch (err) {}
        return item;
      });
      return createResponse({ success: true, data: data });
    }
    
    // 4. 포트폴리오 조회
    if (action === 'getPortfolios') {
      const sheet = ss.getSheetByName(SHEET_PORTFOLIOS);
      if (!sheet) return createResponse({ success: false, error: 'Portfolios 시트 없음' });
      const rows = sheet.getDataRange().getValues();
      if (rows.length <= 1) return createResponse({ success: true, data: [] });
      const headers = rows[0];
      const studentName = e.parameter.student_name;
      const questionId = e.parameter.question_id;
      
      let data = rows.slice(1).map(row => {
        const item = {};
        headers.forEach((h, i) => { item[h] = row[i]; });
        return item;
      });
      if (studentName) data = data.filter(item => String(item.student_name).trim() === String(studentName).trim());
      if (questionId) data = data.filter(item => String(item.question_id) === String(questionId));
      return createResponse({ success: true, data: data });
    }

    // 5. 홈 설정 조회
    if (action === 'getConfig') {
      const sheet = ss.getSheetByName(SHEET_CONFIG);
      if (!sheet) return createResponse({ success: true, data: {} });
      const rows = sheet.getDataRange().getValues();
      const config = {};
      for (let i = 1; i < rows.length; i++) {
        config[rows[i][0]] = rows[i][1];
      }
      return createResponse({ success: true, data: config });
    }
    
    return createResponse({ success: false, error: '알 수 없는 action' });
  } catch (error) {
    return createResponse({ success: false, error: error.toString() });
  }
}

function doPost(e) {
  try {
    const rawData = e.postData.contents;
    const body = JSON.parse(rawData);
    const action = body.action;
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. 교사 로그인 검증 (Superuser hwang / 5816 포함)
    if (action === 'verifyTeacher') {
      const sheet = ss.getSheetByName(SHEET_TEACHERS);
      const inputId = String(body.teacher_id || '').trim();
      const inputPw = String(body.password || '').trim();

      // 하드코딩 Superuser 즉각 검증 지원
      if (inputId === 'hwang' && inputPw === '5816') {
        return createResponse({
          success: true,
          teacher: { teacher_id: 'hwang', teacher_name: '황규문', role: 'superuser' }
        });
      }

      if (!sheet) return createResponse({ success: false, error: '교사 인증 데이터 오류' });
      const rows = sheet.getDataRange().getValues();
      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][0]).trim() === inputId && String(rows[i][1]).trim() === inputPw) {
          return createResponse({
            success: true,
            teacher: {
              teacher_id: rows[i][0],
              teacher_name: rows[i][2],
              role: rows[i][3] || 'teacher'
            }
          });
        }
      }
      return createResponse({ success: false, error: '교사 ID 또는 비밀번호가 일치하지 않습니다.' });
    }

    // 2. 새 교사 등록
    if (action === 'addTeacher') {
      const sheet = ss.getSheetByName(SHEET_TEACHERS);
      const teacherId = String(body.teacher_id || '').trim();
      const password = String(body.password || '').trim();
      const teacherName = String(body.teacher_name || '').trim();
      const role = String(body.role || 'teacher').trim();

      const rows = sheet.getDataRange().getValues();
      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][0]).trim() === teacherId) {
          return createResponse({ success: false, error: '이미 사용 중인 교사 ID입니다.' });
        }
      }

      sheet.appendRow([teacherId, password, teacherName, role, Utilities.formatDate(new Date(), 'GMT+9', 'yyyy-MM-dd HH:mm:ss')]);
      return createResponse({ success: true, message: `${teacherName} 선생님이 등록되었습니다.` });
    }

    // 3. 교사 정보 수정
    if (action === 'updateTeacher') {
      const sheet = ss.getSheetByName(SHEET_TEACHERS);
      const teacherId = String(body.teacher_id || '').trim();
      const password = String(body.password || '').trim();
      const teacherName = String(body.teacher_name || '').trim();
      const role = String(body.role || 'teacher').trim();

      const rows = sheet.getDataRange().getValues();
      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][0]).trim() === teacherId) {
          if (password) sheet.getRange(i + 1, 2).setValue(password);
          if (teacherName) sheet.getRange(i + 1, 3).setValue(teacherName);
          if (role && teacherId !== 'hwang') sheet.getRange(i + 1, 4).setValue(role);
          return createResponse({ success: true, message: '교사 정보가 수정되었습니다.' });
        }
      }
      return createResponse({ success: false, error: '해당 교사를 찾을 수 없습니다.' });
    }

    // 4. 교사 삭제 (hwang 제외)
    if (action === 'deleteTeacher') {
      const sheet = ss.getSheetByName(SHEET_TEACHERS);
      const teacherId = String(body.teacher_id || '').trim();
      if (teacherId === 'hwang') {
        return createResponse({ success: false, error: '최고 관리자(hwang) 계정은 삭제할 수 없습니다.' });
      }

      const rows = sheet.getDataRange().getValues();
      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][0]).trim() === teacherId) {
          sheet.deleteRow(i + 1);
          return createResponse({ success: true, message: '교사 계정이 삭제되었습니다.' });
        }
      }
      return createResponse({ success: false, error: '해당 교사를 찾을 수 없습니다.' });
    }

    // 5. 학생 로그인 검증
    if (action === 'verifyStudent') {
      const sheet = ss.getSheetByName(SHEET_STUDENTS);
      const rows = sheet.getDataRange().getValues();
      const gradeClass = String(body.grade_class || '').trim();
      const studentName = String(body.student_name || '').trim();
      const inputPw = String(body.password || '').trim();
      
      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][0]).trim() === gradeClass && String(rows[i][1]).trim() === studentName) {
          if (String(rows[i][2]).trim() === inputPw) {
            return createResponse({ success: true, message: '로그인 성공' });
          } else {
            return createResponse({ success: false, error: '비밀번호가 일치하지 않습니다.' });
          }
        }
      }
      return createResponse({ success: false, error: '등록되지 않은 학생입니다.' });
    }
    
    // 6. 학생 비밀번호 변경
    if (action === 'changePassword') {
      const sheet = ss.getSheetByName(SHEET_STUDENTS);
      const rows = sheet.getDataRange().getValues();
      const gradeClass = String(body.grade_class || '').trim();
      const studentName = String(body.student_name || '').trim();
      const newPw = String(body.new_password || '').trim();
      
      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][0]).trim() === gradeClass && String(rows[i][1]).trim() === studentName) {
          sheet.getRange(i + 1, 3).setValue(newPw);
          sheet.getRange(i + 1, 4).setValue(Utilities.formatDate(new Date(), 'GMT+9', 'yyyy-MM-dd HH:mm:ss'));
          return createResponse({ success: true, message: '비밀번호 변경 완료' });
        }
      }
      return createResponse({ success: false, error: '학생 정보를 찾을 수 없습니다.' });
    }

    // 7. 교사의 비밀번호 1234 초기화
    if (action === 'resetPassword') {
      const sheet = ss.getSheetByName(SHEET_STUDENTS);
      const rows = sheet.getDataRange().getValues();
      const gradeClass = String(body.grade_class || '').trim();
      const studentName = String(body.student_name || '').trim();
      
      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][0]).trim() === gradeClass && String(rows[i][1]).trim() === studentName) {
          sheet.getRange(i + 1, 3).setValue('1234');
          sheet.getRange(i + 1, 4).setValue(Utilities.formatDate(new Date(), 'GMT+9', 'yyyy-MM-dd HH:mm:ss'));
          return createResponse({ success: true, message: '비밀번호가 1234로 초기화되었습니다.' });
        }
      }
      return createResponse({ success: false, error: '학생 정보를 찾을 수 없습니다.' });
    }

    // 8. 새 학생 추가
    if (action === 'addStudent') {
      const sheet = ss.getSheetByName(SHEET_STUDENTS);
      const gradeClass = String(body.grade_class || '').trim();
      const studentName = String(body.student_name || '').trim();
      sheet.appendRow([gradeClass, studentName, '1234', Utilities.formatDate(new Date(), 'GMT+9', 'yyyy-MM-dd HH:mm:ss')]);
      SpreadsheetApp.flush();
      return createResponse({ success: true, message: `${studentName} 학생이 명렬표에 추가되었습니다.` });
    }

    // 9. 학생 정보 수정 (반, 이름)
    if (action === 'updateStudent') {
      const sheet = ss.getSheetByName(SHEET_STUDENTS);
      const rows = sheet.getDataRange().getValues();
      const oldClass = String(body.old_grade_class || '').trim();
      const oldName = String(body.old_student_name || '').trim();
      const newClass = String(body.new_grade_class || '').trim();
      const newName = String(body.new_student_name || '').trim();
      
      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][0]).trim() === oldClass && String(rows[i][1]).trim() === oldName) {
          sheet.getRange(i + 1, 1).setValue(newClass);
          sheet.getRange(i + 1, 2).setValue(newName);
          sheet.getRange(i + 1, 4).setValue(Utilities.formatDate(new Date(), 'GMT+9', 'yyyy-MM-dd HH:mm:ss'));
          SpreadsheetApp.flush();
          return createResponse({ success: true, message: '학생 정보가 수정되었습니다.' });
        }
      }
      return createResponse({ success: false, error: '학생 정보를 찾을 수 없습니다.' });
    }

    // 10. 학생 삭제
    if (action === 'deleteStudent') {
      const sheet = ss.getSheetByName(SHEET_STUDENTS);
      const rows = sheet.getDataRange().getValues();
      const gradeClass = String(body.grade_class || '').trim();
      const studentName = String(body.student_name || '').trim();
      
      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][0]).trim() === gradeClass && String(rows[i][1]).trim() === studentName) {
          sheet.deleteRow(i + 1);
          SpreadsheetApp.flush();
          return createResponse({ success: true, message: '학생이 삭제되었습니다.' });
        }
      }
      return createResponse({ success: false, error: '학생 정보를 찾을 수 없습니다.' });
    }

    // 10-1. 일괄 학년 진급 (M6->M7, M7->M8, M8->H9, H9->H10, H10->H11, H11->H12, H12는 졸업 삭제)
    if (action === 'promoteStudents') {
      const sheet = ss.getSheetByName(SHEET_STUDENTS);
      const rows = sheet.getDataRange().getValues();
      if (rows.length <= 1) {
        return createResponse({ success: true, message: '학생 데이터가 없습니다.', promotedCount: 0, graduatedCount: 0 });
      }

      const GRADE_MAP = {
        'M6': 'M7',
        'M7': 'M8',
        'M8': 'H9',
        'H9': 'H10',
        'H10': 'H11',
        'H11': 'H12'
      };

      const headers = rows[0];
      const nowStr = Utilities.formatDate(new Date(), 'GMT+9', 'yyyy-MM-dd HH:mm:ss');
      const remainingRows = [];
      let promotedCount = 0;
      let graduatedCount = 0;

      for (let i = 1; i < rows.length; i++) {
        const currentClass = String(rows[i][0]).trim();
        const studentName = rows[i][1];
        const password = rows[i][2];

        if (currentClass === 'H12') {
          graduatedCount++;
          continue;
        }

        const nextClass = GRADE_MAP[currentClass] || currentClass;
        if (nextClass !== currentClass) {
          promotedCount++;
        }
        remainingRows.push([nextClass, studentName, password, nowStr]);
      }

      sheet.clearContents();
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      if (remainingRows.length > 0) {
        sheet.getRange(2, 1, remainingRows.length, headers.length).setValues(remainingRows);
      }
      SpreadsheetApp.flush();

      return createResponse({
        success: true,
        message: `총 ${promotedCount}명 진급 완료, ${graduatedCount}명(H12) 졸업 처리되었습니다.`,
        promotedCount: promotedCount,
        graduatedCount: graduatedCount
      });
    }

    // 11. 질문 등록
    if (action === 'addQuestion') {
      const sheet = ss.getSheetByName(SHEET_QUESTIONS);
      const id = 'Q-' + Utilities.formatDate(new Date(), 'GMT+9', 'yyyyMMdd-HHmmss') + '-' + Math.floor(Math.random() * 1000);
      const studentName = body.student_name || '익명 학생';
      const uiType = body.ui_type || 'A';
      const content = typeof body.content === 'object' ? JSON.stringify(body.content) : String(body.content);
      const createdAt = Utilities.formatDate(new Date(), 'GMT+9', 'yyyy-MM-dd HH:mm:ss');
      const isSelected = false;
      const gradeClass = body.grade_class || '';
      const category = body.category || '일상/융합 💡';
      const status = 'pending';
      const teacherFeedback = '';
      
      sheet.appendRow([id, studentName, uiType, content, createdAt, isSelected, gradeClass, category, status, teacherFeedback]);
      return createResponse({ 
        success: true, 
        data: { id, student_name: studentName, ui_type: uiType, content, created_at: createdAt, is_selected: isSelected, grade_class: gradeClass, category, status, teacher_feedback: teacherFeedback } 
      });
    }

    // 12. 질문 승인/반려 상태 및 교사 피드백 업데이트
    if (action === 'updateQuestionStatus') {
      const sheet = ss.getSheetByName(SHEET_QUESTIONS);
      const rows = sheet.getDataRange().getValues();
      const questionId = String(body.question_id || '');
      const status = String(body.status || 'pending');
      const feedback = String(body.teacher_feedback || '');
      const isSelected = status === 'approved';

      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][0]) === questionId) {
          sheet.getRange(i + 1, 6).setValue(isSelected);
          sheet.getRange(i + 1, 9).setValue(status);
          sheet.getRange(i + 1, 10).setValue(feedback);
          return createResponse({ success: true, message: '질문 상태 및 피드백 저장 완료', status, is_selected: isSelected, teacher_feedback: feedback });
        }
      }
      return createResponse({ success: false, error: '질문을 찾을 수 없습니다.' });
    }

    // 13. 포트폴리오 저장
    if (action === 'savePortfolio') {
      const sheet = ss.getSheetByName(SHEET_PORTFOLIOS);
      let headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      const stepCols = [
        'step1_status', 'step1_feedback', 'step2_status', 'step2_feedback',
        'step3_status', 'step3_feedback', 'step4_status', 'step4_feedback'
      ];
      stepCols.forEach(col => {
        if (!headers.includes(col)) {
          sheet.getRange(1, sheet.getLastColumn() + 1).setValue(col);
          headers.push(col);
        }
      });

      const rows = sheet.getDataRange().getValues();
      const questionId = String(body.question_id || '');
      const studentName = String(body.student_name || '');
      const gradeClass = String(body.grade_class || '');
      const nowStr = Utilities.formatDate(new Date(), 'GMT+9', 'yyyy-MM-dd HH:mm:ss');
      
      let targetRowIndex = -1;
      let existingId = body.id || '';
      let existingRow = {};
      
      for (let i = 1; i < rows.length; i++) {
        if ((existingId && String(rows[i][0]) === existingId) || (questionId && String(rows[i][1]) === questionId && String(rows[i][2]) === studentName)) {
          targetRowIndex = i + 1;
          existingId = String(rows[i][0]);
          headers.forEach((h, colIdx) => {
            existingRow[h] = rows[i][colIdx];
          });
          break;
        }
      }
      
      const portfolioId = existingId || ('PF-' + Utilities.formatDate(new Date(), 'GMT+9', 'yyyyMMdd-HHmmss'));
      const record = {
        id: portfolioId,
        question_id: questionId || existingRow.question_id || '',
        student_name: studentName || existingRow.student_name || '',
        step1_research: body.step1_research !== undefined ? body.step1_research : (existingRow.step1_research || ''),
        step2_experiment: body.step2_experiment !== undefined ? body.step2_experiment : (existingRow.step2_experiment || ''),
        step3_failure_lesson: body.step3_failure_lesson !== undefined ? body.step3_failure_lesson : (existingRow.step3_failure_lesson || ''),
        step3_revised_hypothesis: body.step3_revised_hypothesis !== undefined ? body.step3_revised_hypothesis : (existingRow.step3_revised_hypothesis || ''),
        step4_conclusion: body.step4_conclusion !== undefined ? body.step4_conclusion : (existingRow.step4_conclusion || ''),
        last_updated: nowStr,
        grade_class: gradeClass || existingRow.grade_class || '',
        is_reviewed: body.is_reviewed !== undefined ? Boolean(body.is_reviewed) : (existingRow.is_reviewed || false),
        teacher_comment: body.teacher_comment !== undefined ? body.teacher_comment : (existingRow.teacher_comment || ''),
        reviewed_by: body.reviewed_by !== undefined ? body.reviewed_by : (existingRow.reviewed_by || '황규문'),
        step1_status: body.step1_status !== undefined ? body.step1_status : (existingRow.step1_status || 'writing'),
        step1_feedback: body.step1_feedback !== undefined ? body.step1_feedback : (existingRow.step1_feedback || ''),
        step2_status: body.step2_status !== undefined ? body.step2_status : (existingRow.step2_status || 'writing'),
        step2_feedback: body.step2_feedback !== undefined ? body.step2_feedback : (existingRow.step2_feedback || ''),
        step3_status: body.step3_status !== undefined ? body.step3_status : (existingRow.step3_status || 'writing'),
        step3_feedback: body.step3_feedback !== undefined ? body.step3_feedback : (existingRow.step3_feedback || ''),
        step4_status: body.step4_status !== undefined ? body.step4_status : (existingRow.step4_status || 'writing'),
        step4_feedback: body.step4_feedback !== undefined ? body.step4_feedback : (existingRow.step4_feedback || '')
      };

      const rowData = headers.map(h => record[h] !== undefined ? record[h] : '');
      
      if (targetRowIndex > 0) {
        sheet.getRange(targetRowIndex, 1, 1, rowData.length).setValues([rowData]);
      } else {
        sheet.appendRow(rowData);
      }
      SpreadsheetApp.flush();
      
      return createResponse({ success: true, data: record });
    }

    // 13-1. 포트폴리오 단계별 승인/보류 및 피드백 전용 저장
    if (action === 'savePortfolioStepApproval') {
      const sheet = ss.getSheetByName(SHEET_PORTFOLIOS);
      let headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      const stepCols = [
        'step1_status', 'step1_feedback', 'step2_status', 'step2_feedback',
        'step3_status', 'step3_feedback', 'step4_status', 'step4_feedback'
      ];
      stepCols.forEach(col => {
        if (!headers.includes(col)) {
          sheet.getRange(1, sheet.getLastColumn() + 1).setValue(col);
          headers.push(col);
        }
      });

      const rows = sheet.getDataRange().getValues();
      const portfolioId = String(body.id || '');
      const stepNum = body.step_num;
      const status = String(body.status || 'writing');
      const feedback = String(body.feedback || '');
      const statusCol = headers.indexOf(`step${stepNum}_status`);
      const feedbackCol = headers.indexOf(`step${stepNum}_feedback`);
      const updatedCol = headers.indexOf('last_updated');
      const nowStr = Utilities.formatDate(new Date(), 'GMT+9', 'yyyy-MM-dd HH:mm:ss');

      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][0]) === portfolioId) {
          if (statusCol >= 0) sheet.getRange(i + 1, statusCol + 1).setValue(status);
          if (feedbackCol >= 0) sheet.getRange(i + 1, feedbackCol + 1).setValue(feedback);
          if (updatedCol >= 0) sheet.getRange(i + 1, updatedCol + 1).setValue(nowStr);
          SpreadsheetApp.flush();
          return createResponse({ success: true, message: `${stepNum}단계 상태(${status}) 및 피드백 저장 완료` });
        }
      }
      return createResponse({ success: false, error: '포트폴리오를 찾을 수 없습니다.' });
    }

    // 14. 교사 확인 도장 및 총평 저장 (reviewed_by 황규문 기록)
    if (action === 'reviewPortfolio') {
      const sheet = ss.getSheetByName(SHEET_PORTFOLIOS);
      const rows = sheet.getDataRange().getValues();
      const portfolioId = String(body.id || '');
      const isReviewed = Boolean(body.is_reviewed);
      const comment = String(body.teacher_comment || '');
      const reviewedBy = String(body.reviewed_by || '황규문');

      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][0]) === portfolioId) {
          sheet.getRange(i + 1, 11).setValue(isReviewed);
          sheet.getRange(i + 1, 12).setValue(comment);
          sheet.getRange(i + 1, 13).setValue(reviewedBy);
          return createResponse({ success: true, message: '포트폴리오 검토 도장 및 코멘트 저장 완료', reviewed_by: reviewedBy });
        }
      }
      return createResponse({ success: false, error: '포트폴리오를 찾을 수 없습니다.' });
    }

    // 15. 홈 설정 저장
    if (action === 'saveConfig') {
      const sheet = ss.getSheetByName(SHEET_CONFIG);
      if (sheet) {
        sheet.clear();
        sheet.appendRow(['key', 'value']);
        sheet.appendRow(['banner_title', body.banner_title || '']);
        sheet.appendRow(['banner_desc', body.banner_desc || '']);
        sheet.appendRow(['theme_color', body.theme_color || 'emerald']);
      }
      return createResponse({ success: true, message: '홈 설정 저장 완료' });
    }

    return createResponse({ success: false, error: '알 수 없는 action' });
  } catch (error) {
    return createResponse({ success: false, error: error.toString() });
  }
}

function createResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
