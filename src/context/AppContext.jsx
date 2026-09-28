import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getStudents,
  verifyStudent,
  changeStudentPassword,
  resetStudentPassword,
  addNewStudent,
  updateStudent,
  deleteStudent,
  promoteStudents,
  getQuestions,
  updateQuestionStatus,
  getPortfolios,
  reviewPortfolio,
  getAppConfig,
  saveAppConfig,
  toggleSelectQuestion,
  getTeachers,
  verifyTeacher,
  addNewTeacher,
  updateTeacher,
  deleteTeacher,
  DEFAULT_CLASSES,
  SCIENCE_CATEGORIES,
  THEME_OPTIONS,
} from '../services/api';

const AppContext = createContext();

const STORAGE_KEY_USER = 'science_eureka_current_user';
const STORAGE_KEY_TEACHER = 'science_eureka_current_teacher';

export function AppProvider({ children }) {
  const [currentTeacher, setCurrentTeacher] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_TEACHER);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      // 교사로 로그인되어 있으면 학생 세션은 즉시 자동 무효화 및 로그아웃
      const teacherRaw = localStorage.getItem(STORAGE_KEY_TEACHER);
      if (teacherRaw) {
        localStorage.removeItem(STORAGE_KEY_USER);
        return null;
      }
      const raw = localStorage.getItem(STORAGE_KEY_USER);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [teacherList, setTeacherList] = useState([]);

  const [studentRoster, setStudentRoster] = useState([]);
  const [classList, setClassList] = useState(DEFAULT_CLASSES);
  const [appConfig, setAppConfig] = useState({
    banner_title: '일상의 사소한 호기심이 위대한 과학 발견이 됩니다!',
    banner_desc: '호기심 질문을 등록하면 선생님이 검토 후 탐구 과제로 승인합니다. 실패는 더 정확한 답을 찾아가는 최고의 디딤돌입니다!',
    theme_color: 'emerald',
  });

  const [isTeacherMode, setIsTeacherMode] = useState(() => {
    return localStorage.getItem('science_eureka_teacher_mode') === 'true';
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isChangePwModalOpen, setIsChangePwModalOpen] = useState(false);

  const [questions, setQuestions] = useState([]);
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const refreshStudents = async (forceNetwork = false) => {
    try {
      const res = await getStudents(forceNetwork);
      if (res?.students) setStudentRoster(res.students);
      if (res?.classes) setClassList(res.classes);
    } catch (e) {
      console.error(e);
    }
  };

  const refreshConfig = async () => {
    try {
      const conf = await getAppConfig();
      if (conf) setAppConfig(conf);
    } catch (e) {
      console.error(e);
    }
  };

  const updateConfigAction = async (newConfig) => {
    const saved = await saveAppConfig(newConfig);
    setAppConfig(saved);
    showToast('홈 화면 설정 및 테마가 성공적으로 저장되었습니다!', 'success');
  };

  const login = async (gradeClass, studentName, password) => {
    try {
      const res = await verifyStudent(gradeClass, studentName, password);
      if (res.success) {
        const user = { gradeClass, studentName };
        setCurrentUser(user);
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
        showToast(`${gradeClass} ${studentName} 학생, 환영합니다!`, 'success');
        setIsLoginModalOpen(false);
        refreshPortfolios(studentName);
        return { success: true };
      } else {
        showToast(res.error || '로그인에 실패했습니다.', 'error');
        return { success: false, error: res.error };
      }
    } catch (err) {
      showToast('로그인 처리 중 오류가 발생했습니다.', 'error');
      return { success: false, error: err.message };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEY_USER);
    showToast('로그아웃되었습니다.', 'info');
  };

  const updatePassword = async (newPassword) => {
    if (!currentUser) {
      showToast('로그인이 필요합니다.', 'error');
      return { success: false };
    }
    try {
      const res = await changeStudentPassword(
        currentUser.gradeClass,
        currentUser.studentName,
        newPassword
      );
      if (res.success) {
        showToast('비밀번호가 성공적으로 변경되었습니다!', 'success');
        setIsChangePwModalOpen(false);
        await refreshStudents();
        return { success: true };
      } else {
        showToast(res.error || '비밀번호 변경 실패', 'error');
        return { success: false, error: res.error };
      }
    } catch (err) {
      showToast('비밀번호 변경 중 오류가 발생했습니다.', 'error');
      return { success: false, error: err.message };
    }
  };

  const handleResetPassword = async (gradeClass, studentName) => {
    try {
      const res = await resetStudentPassword(gradeClass, studentName);
      if (res.success) {
        showToast(`${studentName} 학생 비밀번호가 1234로 초기화되었습니다.`, 'success');
        await refreshStudents();
        return { success: true };
      } else {
        showToast(res.error || '초기화 실패', 'error');
        return { success: false };
      }
    } catch (err) {
      showToast('비밀번호 초기화 오류', 'error');
      return { success: false };
    }
  };

  const handleAddStudent = async (gradeClass, studentName) => {
    try {
      const res = await addNewStudent(gradeClass, studentName);
      if (res.success) {
        showToast(res.message, 'success');
        await refreshStudents();
        return { success: true };
      } else {
        showToast(res.error || '학생 등록 실패', 'error');
        return { success: false, error: res.error };
      }
    } catch (err) {
      showToast('학생 등록 오류', 'error');
      return { success: false, error: err.message };
    }
  };

  const updateStudentAction = async (oldClass, oldName, newClass, newName) => {
    try {
      const res = await updateStudent(oldClass, oldName, newClass, newName);
      if (res.success) {
        showToast('학생 정보가 성공적으로 수정되었습니다.', 'success');
        await refreshStudents();
        await refreshQuestions();
        await refreshPortfolios();
        return { success: true };
      } else {
        showToast(res.error || '수정 실패', 'error');
        return { success: false };
      }
    } catch (e) {
      showToast('학생 수정 오류', 'error');
      return { success: false };
    }
  };

  const deleteStudentAction = async (gradeClass, studentName) => {
    try {
      const res = await deleteStudent(gradeClass, studentName);
      if (res.success) {
        showToast(`${studentName} 학생이 명렬표에서 삭제되었습니다.`, 'info');
        await refreshStudents(true);
        return { success: true };
      }
    } catch (e) {
      showToast('삭제 오류', 'error');
      return { success: false };
    }
  };

  const promoteStudentsAction = async () => {
    try {
      setLoading(true);
      const res = await promoteStudents();
      await refreshStudents(true);
      await refreshQuestions();
      await refreshPortfolios();
      showToast(res.message || '일괄 진급이 완료되었습니다!', 'success');
      return res;
    } catch (e) {
      showToast('일괄 진급 처리 중 오류가 발생했습니다.', 'error');
      return { success: false, error: e.message };
    } finally {
      setLoading(false);
    }
  };

  const updateQuestionStatusAndFeedback = async (questionId, status, feedback) => {
    try {
      await updateQuestionStatus(questionId, status, feedback);
      await refreshQuestions();
      const statusText = status === 'approved' ? '승인' : status === 'rejected' ? '보완 요청(반려)' : '대기';
      showToast(`질문이 [${statusText}] 상태로 변경되었으며 피드백이 저장되었습니다!`, 'success');
      return { success: true };
    } catch (e) {
      showToast('질문 상태 변경 오류', 'error');
      return { success: false };
    }
  };

  const reviewPortfolioAction = async (portfolioId, isReviewed, comment, reviewerName) => {
    try {
      const by = reviewerName || currentTeacher?.teacher_name || '황규문';
      await reviewPortfolio(portfolioId, isReviewed, comment, by);
      await refreshPortfolios();
      showToast(
        isReviewed
          ? `확인 도장 💮과 총평 코멘트가 부여되었습니다! (담당교사: ${by})`
          : '확인 도장이 취소되었습니다.',
        'success'
      );
      return { success: true };
    } catch (e) {
      showToast('포트폴리오 검토 저장 오류', 'error');
      return { success: false };
    }
  };

  const refreshTeachers = async () => {
    try {
      const list = await getTeachers();
      if (Array.isArray(list)) setTeacherList(list);
    } catch (e) {
      console.error(e);
    }
  };

  const teacherLogin = async (teacherId, password) => {
    try {
      const res = await verifyTeacher(teacherId, password);
      if (res.success && res.teacher) {
        // 교사 로그인 시 기존 학생 계정은 즉시 완전 로그아웃 처리
        setCurrentUser(null);
        localStorage.removeItem(STORAGE_KEY_USER);

        setCurrentTeacher(res.teacher);
        localStorage.setItem(STORAGE_KEY_TEACHER, JSON.stringify(res.teacher));
        showToast(`${res.teacher.teacher_name} 선생님, 환영합니다!`, 'success');
        return { success: true, teacher: res.teacher };
      } else {
        showToast(res.error || '교사 인증에 실패했습니다.', 'error');
        return { success: false, error: res.error };
      }
    } catch (err) {
      showToast('교사 로그인 중 오류가 발생했습니다.', 'error');
      return { success: false, error: err.message };
    }
  };

  const teacherLogout = () => {
    setCurrentTeacher(null);
    localStorage.removeItem(STORAGE_KEY_TEACHER);
    showToast('교사 계정에서 로그아웃되었습니다.', 'info');
  };

  const addTeacherAction = async (data) => {
    try {
      const res = await addNewTeacher(data);
      if (res.success) {
        showToast(res.message, 'success');
        await refreshTeachers();
        return { success: true };
      } else {
        showToast(res.error || '교사 등록 실패', 'error');
        return { success: false, error: res.error };
      }
    } catch (e) {
      showToast('교사 등록 중 오류', 'error');
      return { success: false, error: e.message };
    }
  };

  const updateTeacherAction = async (data) => {
    try {
      const res = await updateTeacher(data);
      if (res.success) {
        showToast('교사 정보가 성공적으로 수정되었습니다.', 'success');
        await refreshTeachers();
        return { success: true };
      } else {
        showToast(res.error || '수정 실패', 'error');
        return { success: false, error: res.error };
      }
    } catch (e) {
      showToast('교사 수정 중 오류', 'error');
      return { success: false, error: e.message };
    }
  };

  const deleteTeacherAction = async (teacherId) => {
    try {
      const res = await deleteTeacher(teacherId);
      if (res.success) {
        showToast('교사가 명렬표에서 삭제되었습니다.', 'info');
        await refreshTeachers();
        return { success: true };
      } else {
        showToast(res.error || '삭제 실패', 'error');
        return { success: false, error: res.error };
      }
    } catch (e) {
      showToast('교사 삭제 중 오류', 'error');
      return { success: false, error: e.message };
    }
  };

  const toggleTeacherMode = () => {
    setIsTeacherMode((prev) => {
      const next = !prev;
      localStorage.setItem('science_eureka_teacher_mode', String(next));
      return next;
    });
  };

  const refreshQuestions = async () => {
    setLoading(true);
    try {
      const data = await getQuestions();
      setQuestions(data);
    } catch (e) {
      showToast('질문 목록 로드 실패', 'error');
    } finally {
      setLoading(false);
    }
  };

  const refreshPortfolios = async (targetStudentName) => {
    try {
      const name = targetStudentName || (isTeacherMode ? undefined : currentUser?.studentName);
      const data = await getPortfolios(name || undefined);
      setPortfolios(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleSelectQuestion = async (questionId) => {
    const updated = await toggleSelectQuestion(questionId);
    await refreshQuestions();
    showToast(
      updated?.is_selected
        ? '탐구 과제로 승인(채택)되었습니다!'
        : '승인이 취소되었습니다.',
      'info'
    );
  };

  useEffect(() => {
    refreshStudents();
    refreshTeachers();
    refreshQuestions();
    refreshPortfolios();
    refreshConfig();
  }, []);

  useEffect(() => {
    refreshPortfolios();
  }, [currentUser, isTeacherMode, currentTeacher]);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        studentName: currentUser?.studentName || '',
        gradeClass: currentUser?.gradeClass || '',
        studentRoster,
        classList,
        currentTeacher,
        teacherList,
        teacherLogin,
        teacherLogout,
        refreshTeachers,
        addTeacherAction,
        updateTeacherAction,
        deleteTeacherAction,
        appConfig,
        updateConfigAction,
        isLoginModalOpen,
        setIsLoginModalOpen,
        isChangePwModalOpen,
        setIsChangePwModalOpen,
        login,
        logout,
        updatePassword,
        handleResetPassword,
        handleAddStudent,
        updateStudentAction,
        deleteStudentAction,
        promoteStudentsAction,
        updateQuestionStatusAndFeedback,
        reviewPortfolioAction,
        refreshStudents,
        isTeacherMode,
        toggleTeacherMode,
        questions,
        portfolios,
        loading,
        toast,
        showToast,
        refreshQuestions,
        refreshPortfolios,
        handleToggleSelectQuestion,
        SCIENCE_CATEGORIES,
        THEME_OPTIONS,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
}
