import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { matchesStudentName, getPortfolios, savePortfolio } from '../services/api';
import {
  Compass,
  Search,
  FlaskConical,
  AlertTriangle,
  Award,
  Save,
  ArrowRight,
  ArrowLeft,
  FileText,
  Lock,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Lightbulb,
  Sparkles,
  Quote,
  CheckCircle2,
  Clock,
  XCircle,
  Send,
  ShieldCheck,
  RotateCcw,
  MessageSquareQuote
} from 'lucide-react';

export default function PortfolioEditor() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const questionId = searchParams.get('questionId');
  const portfolioIdParam = searchParams.get('id');

  const {
    questions,
    portfolios,
    currentUser,
    currentTeacher,
    setIsLoginModalOpen,
    showToast,
    refreshPortfolios,
    approvePortfolioStepAction,
  } = useApp();

  const targetQuestion = questions.find((q) => String(q.id) === String(questionId));

  const [currentStep, setCurrentStep] = useState(1);
  const [portfolioId, setPortfolioId] = useState(portfolioIdParam || '');

  // 가이드 아코디언 열림/닫힘 상태
  const [isGuideOpen, setIsGuideOpen] = useState(true);

  // 폼 상태
  const [step1Research, setStep1Research] = useState('');
  const [initialStep1Hypothesis, setInitialStep1Hypothesis] = useState('');
  const [step2Experiment, setStep2Experiment] = useState('');
  const [initialStep2Experiment, setInitialStep2Experiment] = useState('');
  const [step3FailureLesson, setStep3FailureLesson] = useState('');
  const [initialStep3FailureLesson, setInitialStep3FailureLesson] = useState('');
  const [step3RevisedHypothesis, setStep3RevisedHypothesis] = useState('');
  const [initialStep3RevisedHypothesis, setInitialStep3RevisedHypothesis] = useState('');
  const [step4Conclusion, setStep4Conclusion] = useState('');

  // 단계별 교사 승인/보류 상태 ('writing' | 'submitted' | 'approved' | 'held')
  const [step1Status, setStep1Status] = useState('writing');
  const [step1Feedback, setStep1Feedback] = useState('');
  const [step2Status, setStep2Status] = useState('writing');
  const [step2Feedback, setStep2Feedback] = useState('');
  const [step3Status, setStep3Status] = useState('writing');
  const [step3Feedback, setStep3Feedback] = useState('');
  const [step4Status, setStep4Status] = useState('writing');
  const [step4Feedback, setStep4Feedback] = useState('');
  const [isReviewed, setIsReviewed] = useState(false);
  const [teacherComment, setTeacherComment] = useState('');

  // 교사용 즉시 심사 인풋 상태
  const [teacherReviewFeedback, setTeacherReviewFeedback] = useState('');
  const [isReviewingByTeacher, setIsReviewingByTeacher] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState('');

  // 미로그인 시 로그인 유도 및 타 학생 과제 접근 차단
  useEffect(() => {
    if (!currentUser && !currentTeacher) {
      showToast('탐구 일지를 작성하려면 먼저 로그인이 필요합니다.', 'info');
      setIsLoginModalOpen(true);
      return;
    }

    if (currentUser && targetQuestion && targetQuestion.student_name !== currentUser.studentName && !currentTeacher) {
      showToast('본인의 승인된 탐구 과제만 일지를 작성할 수 있습니다.', 'error');
      navigate('/');
    }
  }, [currentUser, currentTeacher, targetQuestion, navigate]);

  // 포트폴리오 안전 검색 헬퍼 (ID, 질문ID, 학생이름 매칭)
  const findTargetPortfolio = (list) => {
    if (!list || !list.length) return null;
    if (portfolioIdParam) {
      const match = list.find((p) => p.id === portfolioIdParam);
      if (match) return match;
    }
    if (questionId) {
      const match = list.find((p) => String(p.question_id).trim() === String(questionId).trim());
      if (match) return match;
    }
    const studentName = currentUser?.studentName || targetQuestion?.student_name;
    if (studentName) {
      const match = list.find((p) => matchesStudentName(p.student_name, studentName));
      if (match) return match;
    }
    if (studentName && matchesStudentName(studentName, '이주호')) {
      const match = list.find((p) => p.id === 'PF-1790774368111');
      if (match) return match;
    }
    return list[0];
  };

  // 포트폴리오 상태 바인딩 함수
  const applyPortfolioData = (existing) => {
    if (!existing) return;
    setPortfolioId(existing.id);

    const r1 = existing.step1_research || '';
    setStep1Research(r1);
    if (r1) {
      setInitialStep1Hypothesis(r1);
    }

    const r2 = existing.step2_experiment || '';
    setStep2Experiment(r2);
    if (r2) {
      setInitialStep2Experiment(r2);
    }

    const r3Lesson = existing.step3_failure_lesson || '';
    const r3Hypo = existing.step3_revised_hypothesis || '';
    setStep3FailureLesson(r3Lesson);
    setStep3RevisedHypothesis(r3Hypo);
    if (r3Lesson) {
      setInitialStep3FailureLesson(r3Lesson);
    }
    if (r3Hypo) {
      setInitialStep3RevisedHypothesis(r3Hypo);
    }

    setStep4Conclusion(existing.step4_conclusion || '');
    setLastSavedTime(existing.last_updated || '');

    // 단계별 승인 상태 동기화 (기존 데이터 호환 처리)
    const s1 = existing.step1_status || (existing.step2_experiment ? 'approved' : 'writing');
    const s2 = existing.step2_status || (existing.step3_failure_lesson ? 'approved' : 'writing');
    const s3 = existing.step3_status || (existing.step4_conclusion ? 'approved' : 'writing');
    const s4 = existing.step4_status || (existing.is_reviewed ? 'approved' : 'writing');

    setStep1Status(s1);
    setStep1Feedback(existing.step1_feedback || '');
    setStep2Status(s2);
    setStep2Feedback(existing.step2_feedback || '');
    setStep3Status(s3);
    setStep3Feedback(existing.step3_feedback || '');
    setStep4Status(s4);
    setStep4Feedback(existing.step4_feedback || '');
    setIsReviewed(Boolean(existing.is_reviewed));
    setTeacherComment(existing.teacher_comment || '');
  };

  // 1. Context에 캐시된 포트폴리오로부터 즉시 동기적 초기화
  useEffect(() => {
    if (portfolios && portfolios.length > 0) {
      const matched = findTargetPortfolio(portfolios);
      if (matched) applyPortfolioData(matched);
    }
  }, [portfolios, questionId, portfolioIdParam, currentUser]);

  // 2. 비동기 최신 저장 데이터 불러오기 (네트워크 및 Google Sheets 연동)
  useEffect(() => {
    async function loadExisting() {
      if (!questionId && !portfolioIdParam) return;
      try {
        const studentName = currentUser?.studentName || targetQuestion?.student_name;
        const list = await getPortfolios(studentName || undefined, questionId || undefined);
        const existing = findTargetPortfolio(list);
        if (existing) {
          applyPortfolioData(existing);
        }
      } catch (err) {
        console.error('포트폴리오 로드 실패:', err);
      }
    }
    loadExisting();
  }, [questionId, portfolioIdParam, currentUser]);

  // 선생님 승인 여부 검증
  if (targetQuestion && !targetQuestion.is_selected) {
    return (
      <div className="py-16 text-center space-y-4 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm animate-fadeIn">
        <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-extrabold text-slate-800">선생님 승인 대기 중인 질문입니다</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            이 질문은 아직 선생님의 탐구 과제 승인을 받지 않았습니다. 선생님이 승인한 후에만 탐구 일지를 시작할 수 있습니다.
          </p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition"
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  // 현재 스텝의 상태 및 피드백 헬퍼
  const getStepStatus = (stepNum) => {
    if (stepNum === 1) return { status: step1Status, feedback: step1Feedback };
    if (stepNum === 2) return { status: step2Status, feedback: step2Feedback };
    if (stepNum === 3) return { status: step3Status, feedback: step3Feedback };
    return { status: step4Status, feedback: step4Feedback };
  };

  // 특정 단계 접근 가능 여부 (선행 단계가 승인되었거나 교사인 경우)
  const isStepUnlocked = (stepNum) => {
    if (currentTeacher) return true;
    if (stepNum === 1) return true;
    if (stepNum === 2) return step1Status === 'approved';
    if (stepNum === 3) return step1Status === 'approved' && step2Status === 'approved';
    if (stepNum === 4) return step1Status === 'approved' && step2Status === 'approved' && step3Status === 'approved';
    return false;
  };

  const handleSave = async (silent = false, extraUpdates = {}) => {
    if (!currentUser && !currentTeacher) {
      if (!silent) showToast('로그인이 필요합니다.', 'error');
      setIsLoginModalOpen(true);
      return null;
    }

    setIsSaving(true);
    try {
      const studentName = currentUser?.studentName || targetQuestion?.student_name;
      const gradeClass = currentUser?.gradeClass || targetQuestion?.grade_class;

      const payload = {
        id: portfolioId,
        question_id: questionId || targetQuestion?.id || '',
        student_name: studentName,
        grade_class: gradeClass,
        step1_research: step1Research,
        step2_experiment: step2Experiment,
        step3_failure_lesson: step3FailureLesson,
        step3_revised_hypothesis: step3RevisedHypothesis,
        step4_conclusion: step4Conclusion,
        step1_status: step1Status,
        step1_feedback: step1Feedback,
        step2_status: step2Status,
        step2_feedback: step2Feedback,
        step3_status: step3Status,
        step3_feedback: step3Feedback,
        step4_status: step4Status,
        step4_feedback: step4Feedback,
        ...extraUpdates,
      };

      const saved = await savePortfolio(payload);

      if (saved?.id) setPortfolioId(saved.id);
      setLastSavedTime(new Date().toLocaleTimeString());
      await refreshPortfolios(studentName);

      if (!silent) {
        showToast('탐구 일지가 안전하게 임시 저장되었습니다!', 'success');
      }
      return saved;
    } catch (e) {
      console.error(e);
      if (!silent) showToast('저장 중 오류가 발생했습니다.', 'error');
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  // 단계 진행 또는 제출 버튼 클릭 핸들러
  const handleNextStep = async () => {
    const { status: curStatus } = getStepStatus(currentStep);

    // 4단계에서는 결과 보고서 화면으로 이동
    if (currentStep === 4) {
      await handleSave(true);
      navigate(`/report/${portfolioId || ('PF-' + Date.now())}?questionId=${questionId}`);
      return;
    }

    // 이미 교사의 승인을 받은 경우: 즉시 다음 단계로 이동 가능
    if (curStatus === 'approved' || currentTeacher) {
      await handleSave(true);
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // 아직 승인을 받지 못한 경우:
    // 필수 작성 여부 검증 후 상태를 'submitted'(검토 대기)로 변경하여 저장
    let currentContentLength = 0;
    if (currentStep === 1) currentContentLength = step1Research.trim().length;
    if (currentStep === 2) currentContentLength = step2Experiment.trim().length;
    if (currentStep === 3) currentContentLength = (step3FailureLesson.trim() + step3RevisedHypothesis.trim()).length;

    if (currentContentLength < 10) {
      showToast(`${currentStep}단계 내용을 충분히 작성한 후 교사 승인을 요청해 주세요.`, 'error');
      return;
    }

    // 상태를 'submitted'로 갱신하여 저장
    const updates = {};
    if (currentStep === 1) {
      updates.step1_status = 'submitted';
      setStep1Status('submitted');
    } else if (currentStep === 2) {
      updates.step2_status = 'submitted';
      setStep2Status('submitted');
    } else if (currentStep === 3) {
      updates.step3_status = 'submitted';
      setStep3Status('submitted');
    }

    await handleSave(true, updates);
    showToast(
      `✓ ${currentStep}단계 내용이 저장되었으며 선생님께 승인 요청되었습니다!\n선생님의 피드백 및 승인 후 다음 단계로 진행할 수 있습니다.`,
      'info'
    );
  };

  // 교사 직접 검토 승인 / 보류 액션 (교사 로그인 시 활용)
  const handleTeacherStepReview = async (status) => {
    if (!portfolioId) {
      showToast('먼저 학생의 일지를 한 번 이상 저장해야 합니다.', 'error');
      return;
    }
    setIsReviewingByTeacher(true);
    try {
      const feedback = teacherReviewFeedback.trim();
      await approvePortfolioStepAction(portfolioId, currentStep, status, feedback);

      if (currentStep === 1) {
        setStep1Status(status);
        setStep1Feedback(feedback);
      } else if (currentStep === 2) {
        setStep2Status(status);
        setStep2Feedback(feedback);
      } else if (currentStep === 3) {
        setStep3Status(status);
        setStep3Feedback(feedback);
      } else if (currentStep === 4) {
        setStep4Status(status);
        setStep4Feedback(feedback);
      }
      setTeacherReviewFeedback('');
    } finally {
      setIsReviewingByTeacher(false);
    }
  };

  const steps = [
    { num: 1, title: '가설 & 조사', icon: Search, color: 'text-blue-500' },
    { num: 2, title: '실행 & 실험', icon: FlaskConical, color: 'text-emerald-500' },
    { num: 3, title: '★ 실패 분석', icon: AlertTriangle, color: 'text-rose-500' },
    { num: 4, title: '최종 결론', icon: Award, color: 'text-amber-500' },
  ];

  const getQuestionText = () => {
    if (!targetQuestion) return '질문 정보 없음';
    if (targetQuestion.ui_type === 'B') {
      try {
        const parsed = JSON.parse(targetQuestion.content);
        return parsed.wonder || parsed.think || '관찰형 질문';
      } catch {
        return targetQuestion.content;
      }
    }
    return targetQuestion.content;
  };

  // 단계별 교사 힌트 텍스트
  const teacherGuides = {
    1: {
      title: '선생님의 1단계 가이드: 가설과 사전 조사 팁',
      tips: [
        '가설은 "~하면 ~할 것이다" 형태로 구체적으로 적으면 검증하기 쉽습니다.',
        '내 생각뿐만 아니라 친구 1~2명에게 물어본 의견(인터뷰)이나 인터넷 검색 지식을 함께 적어보세요.',
      ],
    },
    2: {
      title: '선생님의 2단계 가이드: 실험과 변인 통제 팁',
      tips: [
        '다르게 해야 할 조건(조작 변인)과 똑같이 맞춰야 할 조건(통제 변인)을 명확히 구분해 보세요.',
        '실험 횟수나 관찰 시간 간격을 숫자로 적으면 더 훌륭한 과학 보고서가 됩니다.',
        '참고한 실험 영상이나 웹사이트 링크(https://...)를 넣으면 결과 보고서에서 클릭하여 바로 열 수 있습니다!',
      ],
    },
    3: {
      title: '선생님의 3단계 가이드: 실패를 진짜 배움으로 바꾸는 법',
      tips: [
        '실험이 예상과 다르게 나왔다면 축하합니다! 새로운 과학적 사실을 발견할 기회입니다.',
        '왜 내 가설이 틀렸는지 이유를 추적하고, 이를 바탕으로 "더 나은 다음 계획"을 세우는 것이 핵심입니다.',
      ],
    },
    4: {
      title: '선생님의 4단계 가이드: 최종 결론 및 성찰',
      tips: [
        '실패와 수정을 거쳐 최종적으로 알게 된 핵심 답을 1~2문장으로 요약해 보세요.',
        '이번 탐구를 하면서 스스로 무엇이 성장했는지 솔직한 느낌을 덧붙여 보세요.',
      ],
    },
  };

  return (
    <div className="space-y-4 pb-12 animate-fadeIn">
      {/* 질문 안내 바 */}
      <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-eureka-600 font-bold text-xs">
            <Compass className="w-4 h-4" />
            <span>선생님 승인 탐구 과제</span>
          </div>
          <span className="text-[11px] text-slate-400">
            {lastSavedTime ? `마지막 저장: ${lastSavedTime}` : '아직 저장 안 됨'}
          </span>
        </div>
        <p className="text-xs sm:text-sm font-extrabold text-slate-800 bg-slate-50 p-3 rounded-2xl border border-slate-100">
          "{getQuestionText()}"
        </p>

        {currentUser && (
          <div className="flex items-center space-x-2 pt-1 text-xs">
            <span className="text-slate-400 font-medium">탐구자:</span>
            <span className="font-extrabold text-slate-800 bg-eureka-50 text-eureka-800 px-2 py-0.5 rounded-lg border border-eureka-200">
              {currentUser.gradeClass} {currentUser.studentName}
            </span>
          </div>
        )}
      </div>

      {/* 4단계 스텝 인디케이터 (잠금 및 승인 배지 포함) */}
      <div className="grid grid-cols-4 gap-1.5 bg-slate-200/80 p-1.5 rounded-2xl">
        {steps.map((s) => {
          const Icon = s.icon;
          const isActive = currentStep === s.num;
          const isUnlocked = isStepUnlocked(s.num);
          const { status: sStatus } = getStepStatus(s.num);

          return (
            <button
              key={s.num}
              type="button"
              onClick={() => {
                if (!isUnlocked) {
                  showToast(`선생님의 ${s.num - 1}단계 승인이 완료되어야 ${s.num}단계로 진행할 수 있습니다.`, 'error');
                  return;
                }
                setCurrentStep(s.num);
              }}
              className={`py-2 px-1 rounded-xl text-center transition flex flex-col items-center justify-center space-y-0.5 relative ${
                isActive
                  ? 'bg-white shadow-sm font-bold text-slate-800 ring-2 ring-eureka-500'
                  : isUnlocked
                  ? 'text-slate-600 hover:text-slate-900 bg-white/50'
                  : 'text-slate-400 bg-slate-100/60 cursor-not-allowed opacity-70'
              }`}
            >
              <div className="flex items-center space-x-1">
                {!isUnlocked ? (
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <Icon className={`w-3.5 h-3.5 ${isActive ? s.color : 'text-slate-500'}`} />
                )}
                <span className="text-[11px] font-bold">{s.num}단계</span>
              </div>

              <span className="text-[10px] truncate max-w-full">{s.title}</span>

              {/* 상태 미니 뱃지 */}
              {sStatus === 'approved' ? (
                <span className="text-[9px] font-black text-emerald-700 bg-emerald-100 px-1 py-0.2 rounded-full leading-none flex items-center space-x-0.5">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  <span>승인(+3)</span>
                </span>
              ) : sStatus === 'held' ? (
                <span className="text-[9px] font-black text-rose-700 bg-rose-100 px-1 py-0.2 rounded-full leading-none flex items-center space-x-0.5">
                  <AlertTriangle className="w-2.5 h-2.5" />
                  <span>보류</span>
                </span>
              ) : sStatus === 'submitted' ? (
                <span className="text-[9px] font-black text-blue-700 bg-blue-100 px-1 py-0.2 rounded-full leading-none flex items-center space-x-0.5">
                  <Clock className="w-2.5 h-2.5" />
                  <span>심사중</span>
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* 현재 단계별 교사 승인/보류 상태 안내 배너 */}
      {(() => {
        const { status: curStatus, feedback: curFeedback } = getStepStatus(currentStep);

        if (curStatus === 'approved') {
          return (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start space-x-2.5 animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5 flex-1 text-xs">
                <div className="font-black text-emerald-800 flex items-center space-x-1.5">
                  <span>선생님 {currentStep}단계 승인 완료! (+3점 달성)</span>
                  <span className="bg-emerald-200 text-emerald-900 text-[10px] px-1.5 py-0.2 rounded-md font-bold">
                    다음 단계 진행 가능
                  </span>
                </div>
                {curFeedback && (
                  <p className="text-emerald-700 text-[11px] bg-white/70 p-2 rounded-xl mt-1 border border-emerald-100">
                    <strong>선생님 코멘트:</strong> "{curFeedback}"
                  </p>
                )}
              </div>
            </div>
          );
        }

        if (curStatus === 'held') {
          return (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start space-x-2.5 animate-fadeIn">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1 flex-1 text-xs">
                <div className="font-black text-rose-800 flex items-center space-x-1.5">
                  <span>선생님이 {currentStep}단계를 [보류] 처리하였습니다.</span>
                  <span className="bg-rose-200 text-rose-900 text-[10px] px-1.5 py-0.2 rounded-md font-bold">
                    재작성 후 재요청 필요
                  </span>
                </div>
                <p className="text-slate-700 text-[11px] leading-relaxed">
                  선생님의 피드백을 반영하여 내용을 재작성한 후, 하단의 <strong>[보완 내용 제출하고 재승인 요청 🚀]</strong> 버튼을 눌러 다시 승인을 요청하세요.
                </p>
                {curFeedback && (
                  <div className="p-2 bg-white rounded-xl border border-rose-200 text-rose-900 text-[11px] font-medium">
                    <strong className="text-rose-700 block mb-0.5">💬 선생님 피드백:</strong>
                    "{curFeedback}"
                  </div>
                )}
              </div>
            </div>
          );
        }

        if (curStatus === 'submitted') {
          return (
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl flex items-start space-x-2.5 animate-fadeIn">
              <Clock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5 animate-pulse" />
              <div className="space-y-0.5 flex-1 text-xs">
                <div className="font-black text-blue-800">
                  선생님께 {currentStep}단계 승인을 요청했습니다 (검토 대기 중)
                </div>
                <p className="text-slate-600 text-[11px]">
                  선생님이 내용을 검토하고 승인하면 다음 단계가 자동으로 열리며 +3점이 부여됩니다. 기다리는 동안 내용을 계속 다듬을 수도 있습니다.
                </p>
              </div>
            </div>
          );
        }

        return (
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center space-x-2 text-xs text-slate-600">
            <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              {currentStep}단계 내용을 작성한 후 하단의 <strong>[교사 승인 후 다음 단계]</strong> 버튼을 누르면 선생님께 검토가 요청됩니다.
            </span>
          </div>
        );
      })()}

      {/* 교사 직접 검토 승인 / 보류 심사 툴바 (교사 로그인 시 표시) */}
      {currentTeacher && (
        <div className="p-3.5 bg-indigo-50/90 border border-indigo-200 rounded-2xl space-y-2 text-xs animate-fadeIn shadow-xs">
          <div className="flex items-center justify-between">
            <span className="font-black text-indigo-900 flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>교사용 빠른 심사 도구 (현재 {currentStep}단계 심사)</span>
            </span>
            <span className="text-[10px] text-indigo-600 font-bold bg-white px-2 py-0.5 rounded-full border border-indigo-200">
              담당: {currentTeacher.teacher_name}
            </span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={teacherReviewFeedback}
              onChange={(e) => setTeacherReviewFeedback(e.target.value)}
              placeholder={`학생에게 전달할 ${currentStep}단계 피드백이나 보완 사항을 입력하세요...`}
              className="flex-1 px-3 py-1.5 text-xs bg-white border border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <button
              type="button"
              onClick={() => handleTeacherStepReview('approved')}
              disabled={isReviewingByTeacher}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center space-x-1 shrink-0 transition"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>승인 (+3점)</span>
            </button>
            <button
              type="button"
              onClick={() => handleTeacherStepReview('held')}
              disabled={isReviewingByTeacher}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold flex items-center space-x-1 shrink-0 transition"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>보류</span>
            </button>
          </div>
        </div>
      )}

      {/* 선생님의 친절 가이드 아코디언 */}
      <div className="bg-gradient-to-r from-blue-50/70 to-indigo-50/70 border border-blue-200/70 rounded-2xl p-3.5 space-y-2">
        <button
          type="button"
          onClick={() => setIsGuideOpen(!isGuideOpen)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center space-x-1.5">
            <Lightbulb className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="text-xs font-bold text-indigo-900">
              {teacherGuides[currentStep].title}
            </span>
          </div>
          {isGuideOpen ? (
            <ChevronUp className="w-4 h-4 text-indigo-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-indigo-500" />
          )}
        </button>

        {isGuideOpen && (
          <ul className="text-[11px] text-indigo-800 space-y-1 pl-5 list-disc leading-relaxed pt-1">
            {teacherGuides[currentStep].tips.map((tip, idx) => (
              <li key={idx}>{tip}</li>
            ))}
          </ul>
        )}
      </div>

      {/* 단계별 입력 컨텐츠 */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
        {/* Step 1: 초기 가설 및 접근 방법 */}
        {currentStep === 1 && (
          <div className="space-y-3.5">
            <div className="border-b pb-3">
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                1단계. 초기 가설 및 탐구 계획
              </span>
              <h3 className="text-sm font-extrabold text-slate-800 mt-2">
                내 생각과 친구/인터넷의 의견을 모아 가설을 세워보세요
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                "왜 그럴까?"에 대한 나의 최초 생각과, 친구 인터뷰 또는 인터넷 검색으로 찾은 사전 지식을 기록합니다.
              </p>
            </div>

            {/* 선생님 피드백 코멘트 카드 (보류 및 지도 내용 - 최상단 고정 및 절대 삭제 방지) */}
            {step1Feedback && (
              <div className={`p-4 rounded-2xl border-2 space-y-2 animate-fadeIn shadow-xs ${
                step1Status === 'held' ? 'bg-rose-50/90 border-rose-300 text-rose-950' : 'bg-blue-50/90 border-blue-300 text-blue-950'
              }`}>
                <div className="flex items-center space-x-1.5 font-black text-xs">
                  <MessageSquareQuote className={`w-4 h-4 ${step1Status === 'held' ? 'text-rose-600' : 'text-blue-600'}`} />
                  <span>
                    {step1Status === 'held'
                      ? '⚠️ 선생님의 1단계 보완 요청 피드백 (아래 내용을 선생님의 요청사항에 따라 재작성하고 재요청하세요.):'
                      : '💬 선생님의 1단계 지도 피드백:'}
                  </span>
                </div>
                <div className="text-xs font-bold bg-white p-3 rounded-xl border border-slate-200 leading-relaxed whitespace-pre-line shadow-xs">
                  "{step1Feedback}"
                </div>
              </div>
            )}

            {/* 학생의 최초 제출 가설 영구 보존 카드 (보류 상태이거나 수정 중일 때 참고할 수 있도록 명확히 표시) */}
            {initialStep1Hypothesis && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-700 flex items-center space-x-1.5">
                    <Quote className="w-3.5 h-3.5 text-blue-500" />
                    <span>📋 내가 이전에 제출한 1단계 가설 (기존 제출 기록 보존):</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200">
                    기록 보존됨
                  </span>
                </div>
                <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200 leading-relaxed whitespace-pre-line">
                  {initialStep1Hypothesis}
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 flex items-center justify-between">
                <span>
                  {step1Status === 'held'
                    ? '✏️ 선생님 피드백을 반영한 [1단계 보완 가설 및 탐구 계획] 작성란:'
                    : '나의 초기 가설 및 사전 조사 내용'}
                </span>
                {step1Status === 'held' && (
                  <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">
                    선생님의 조언을 반영하여 내용을 수정하거나 새로 작성하세요
                  </span>
                )}
              </label>
              <textarea
                value={step1Research}
                onChange={(e) => setStep1Research(e.target.value)}
                rows={7}
                placeholder="예: 
- 나의 생각: 온도가 낮아지면 효소 활동이 둔해져서 덜 익을 것 같다.
- 친구 의견(지우): 냉장고는 습도가 낮아서 껍질 세포가 상하는 게 아닐까?
- 사전 조사: 바나나는 열대 과일이라 저온 장애를 겪는다는 인터넷 글을 발견했다."
                className="w-full p-3.5 text-xs border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* Step 2: 실행 및 실험 */}
        {currentStep === 2 && (
          <div className="space-y-3.5">
            <div className="border-b pb-3">
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                2단계. 실행 및 실험 과정
              </span>
              <h3 className="text-sm font-extrabold text-slate-800 mt-2">
                가설을 검증하기 위해 어떤 실험이나 관찰을 실행했나요?
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                실험 준비물, 통제 변인(같게 한 조건), 조작 변인(다르게 한 조건), 관찰 과정을 구체적으로 적어주세요.
              </p>
            </div>

            {/* 선생님 피드백 코멘트 카드 (보류 및 지도 내용 - 최상단 고정 및 절대 삭제 방지) */}
            {step2Feedback && (
              <div className={`p-4 rounded-2xl border-2 space-y-2 animate-fadeIn shadow-xs ${
                step2Status === 'held' ? 'bg-rose-50/90 border-rose-300 text-rose-950' : 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
              }`}>
                <div className="flex items-center space-x-1.5 font-black text-xs">
                  <MessageSquareQuote className={`w-4 h-4 ${step2Status === 'held' ? 'text-rose-600' : 'text-emerald-600'}`} />
                  <span>
                    {step2Status === 'held'
                      ? '⚠️ 선생님의 2단계 보완 요청 피드백 (아래 내용을 선생님의 요청사항에 따라 재작성하고 재요청하세요.):'
                      : '💬 선생님의 2단계 지도 피드백:'}
                  </span>
                </div>
                <div className="text-xs font-bold bg-white p-3 rounded-xl border border-slate-200 leading-relaxed whitespace-pre-line shadow-xs">
                  "{step2Feedback}"
                </div>
              </div>
            )}

            {/* 학생의 이전 제출 실험 계획 영구 보존 카드 (보류 상태이거나 수정 중일 때 참고할 수 있도록 명확히 표시) */}
            {initialStep2Experiment && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-700 flex items-center space-x-1.5">
                    <Quote className="w-3.5 h-3.5 text-emerald-500" />
                    <span>📋 내가 이전에 제출한 2단계 실험 계획 (기존 제출 기록 보존):</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200">
                    기록 보존됨
                  </span>
                </div>
                <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200 leading-relaxed whitespace-pre-line">
                  {initialStep2Experiment}
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 flex items-center justify-between">
                <span>
                  {step2Status === 'held'
                    ? '✏️ 선생님 피드백을 반영한 [2단계 보완 실험 및 관찰 과정] 재작성란:'
                    : '실험 및 관찰 과정 기록'}
                </span>
                {step2Status === 'held' && (
                  <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">
                    선생님의 조언을 반영하여 내용을 수정하거나 새로 작성하세요
                  </span>
                )}
              </label>
              <textarea
                value={step2Experiment}
                onChange={(e) => setStep2Experiment(e.target.value)}
                rows={7}
                placeholder="예:
- 준비물: 같은 송이에서 딴 바나나 2개, 지퍼백, 온도계
- 실험 과정:
  1. 바나나 A는 실온(22도) 식탁 위에 보관.
  2. 바나나 B는 냉장고(4도) 신선실에 보관.
  3. 24시간 간격으로 껍질의 색깔 변화와 단단함을 사진으로 기록하고 비교함.
- 참고 링크: https://ko.wikipedia.org/wiki/바나나"
                className="w-full p-3.5 text-xs border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* Step 3: ★ 실패 분석 (핵심 기능) */}
        {currentStep === 3 && (
          <div className="space-y-4">
            {/* 과학자 실패 극복 명언 카드 */}
            <div className="bg-gradient-to-r from-amber-500 to-rose-500 p-3.5 rounded-2xl text-white shadow-md space-y-1">
              <div className="flex items-center space-x-1 text-[11px] font-black uppercase tracking-wider text-amber-200">
                <Quote className="w-3.5 h-3.5" />
                <span>위대한 과학자의 격려</span>
              </div>
              <p className="text-xs font-bold leading-snug">
                "나는 실패하지 않았다. 단지 작동하지 않는 10,000가지 방법을 발견했을 뿐이다."
              </p>
              <p className="text-[10px] text-white/80 text-right">- 토머스 에디슨 (Thomas Edison)</p>
            </div>

            <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200/80 space-y-1">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span className="text-xs font-black text-rose-700">
                  ★ 핵심 단계: 실패는 성장의 기회입니다!
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                결과가 실패했더라도 절대 실망하지 마세요. 무엇을 배웠는지가 가장 중요한 점수입니다!
              </p>
            </div>

            {/* 선생님 피드백 코멘트 카드 (보류 및 지도 내용 - 최상단 고정 및 절대 삭제 방지) */}
            {step3Feedback && (
              <div className={`p-4 rounded-2xl border-2 space-y-2 animate-fadeIn shadow-xs ${
                step3Status === 'held' ? 'bg-rose-50/90 border-rose-300 text-rose-950' : 'bg-rose-50/60 border-rose-200 text-rose-950'
              }`}>
                <div className="flex items-center space-x-1.5 font-black text-xs">
                  <MessageSquareQuote className={`w-4 h-4 ${step3Status === 'held' ? 'text-rose-600' : 'text-purple-600'}`} />
                  <span>
                    {step3Status === 'held'
                      ? '⚠️ 선생님의 3단계 보완 요청 피드백 (아래 내용을 선생님의 요청사항에 따라 재작성하고 재요청하세요.):'
                      : '💬 선생님의 3단계 지도 피드백:'}
                  </span>
                </div>
                <div className="text-xs font-bold bg-white p-3 rounded-xl border border-slate-200 leading-relaxed whitespace-pre-line shadow-xs">
                  "{step3Feedback}"
                </div>
              </div>
            )}

            {/* 학생의 이전 제출 실패 분석 및 가설 수정 영구 보존 카드 (보류 상태이거나 수정 중일 때 참고할 수 있도록 명확히 표시) */}
            {(initialStep3FailureLesson || initialStep3RevisedHypothesis) && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-700 flex items-center space-x-1.5">
                    <Quote className="w-3.5 h-3.5 text-rose-500" />
                    <span>📋 내가 이전에 제출한 3단계 실패 분석 (기존 제출 기록 보존):</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200">
                    기록 보존됨
                  </span>
                </div>
                <div className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200 space-y-1.5 leading-relaxed">
                  {initialStep3FailureLesson && (
                    <p>
                      <strong className="text-rose-700">• 배운 점:</strong> {initialStep3FailureLesson}
                    </p>
                  )}
                  {initialStep3RevisedHypothesis && (
                    <p>
                      <strong className="text-amber-700">• 수정한 가설:</strong> {initialStep3RevisedHypothesis}
                    </p>
                  )}
                </div>
              </div>
            )}

            {step3Status === 'held' && (
              <div className="text-[10px] font-bold text-rose-700 bg-rose-100 p-2 rounded-xl flex items-center justify-between">
                <span>✏️ 선생님 피드백을 반영하여 아래 실패 분석과 수정 가설을 재작성해 주세요</span>
                <span className="bg-white/80 px-2 py-0.5 rounded-md">재작성란</span>
              </div>
            )}

            {/* 필드 1: 실패에서 배운 점 */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-rose-800 flex items-center space-x-1.5">
                <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-[10px]">
                  1
                </span>
                <span>이번 실패 또는 예상 밖 결과에서 배운 점은 무엇인가요?</span>
              </label>
              <textarea
                value={step3FailureLesson}
                onChange={(e) => setStep3FailureLesson(e.target.value)}
                rows={4}
                placeholder="예: 냉장고에 넣은 바나나의 껍질이 실온보다 훨씬 빠르게 까맣게 변했다! 내 가설('추우면 덜 익을 것이다')이 완전히 틀렸다는 것을 알게 되었다. 단순히 온도가 낮다고 모든 화학 반응이 멈추는 것이 아니라, 식물 세포 자체가 추위에 손상을 입을 수 있음을 배웠다."
                className="w-full p-3.5 text-xs border-2 border-rose-200 bg-rose-50/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none leading-relaxed"
                required
              />
            </div>

            {/* 필드 2: 수정한 다음 가설 또는 계획 */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-amber-800 flex items-center space-x-1.5">
                <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-[10px]">
                  2
                </span>
                <span>이를 바탕으로 수정한 '다음 가설' 또는 새로운 계획은 무엇인가요?</span>
              </label>
              <textarea
                value={step3RevisedHypothesis}
                onChange={(e) => setStep3RevisedHypothesis(e.target.value)}
                rows={4}
                placeholder="예: 껍질은 냉해를 입어 까매졌지만, 바나나 속살은 실제로 덜 익었을 것이다! 다음 실험에서는 껍질만 보지 않고 바나나 속살의 당도(맛)와 경도를 비교해 보는 2차 실험 계획을 세웠다."
                className="w-full p-3.5 text-xs border-2 border-amber-200 bg-amber-50/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none leading-relaxed"
                required
              />
            </div>
          </div>
        )}

        {/* Step 4: 최종 결론 */}
        {currentStep === 4 && (
          <div className="space-y-3.5">
            <div className="border-b pb-3">
              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                4단계. 최종 결론 및 정리
              </span>
              <h3 className="text-sm font-extrabold text-slate-800 mt-2">
                실패와 수정을 거쳐 얻은 나만의 최종 결론은?
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                질문에 대한 최종 답을 정리하고, 이번 탐구를 통해 나 자신이 어떻게 성장했는지 소감을 적어보세요.
              </p>
            </div>

            {/* 선생님 총평 코멘트 카드 */}
            {(step4Feedback || teacherComment) && (
              <div className="p-3.5 rounded-2xl border-2 border-amber-300 bg-amber-50 space-y-1.5 animate-fadeIn text-amber-950">
                <div className="flex items-center space-x-1.5 font-extrabold text-xs text-amber-900">
                  <MessageSquareQuote className="w-4 h-4 text-amber-600" />
                  <span>💬 선생님의 4단계 및 최종 총평 피드백:</span>
                </div>
                <p className="text-xs font-bold bg-white/90 p-2.5 rounded-xl border border-amber-200 leading-relaxed whitespace-pre-line shadow-xs">
                  "{step4Feedback || teacherComment}"
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                최종 결론 및 탐구 소감
              </label>
              <textarea
                value={step4Conclusion}
                onChange={(e) => setStep4Conclusion(e.target.value)}
                rows={7}
                placeholder="예: 
- 최종 결론: 바나나의 최적 보관 온도는 13~16도이며, 냉장고 보관 시 껍질의 폴리페놀 산화효소로 인해 껍질 갈변은 빨라지지만 속살의 성숙은 늦춰진다.
- 소감: 처음 세웠던 가설이 틀렸을 때 당황했지만, 왜 틀렸는지를 찾아보는 과정에서 저온 장애라는 새로운 생명과학 개념을 배울 수 있어서 진짜 과학자가 된 기분이었다."
                className="w-full p-3.5 text-xs border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* 하단 버튼 영역 */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className="flex items-center space-x-1 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition active:scale-95 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5 text-slate-500" />
            <span>{isSaving ? '저장 중...' : '임시 저장'}</span>
          </button>

          <div className="flex items-center space-x-2">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="px-3 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition flex items-center space-x-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>이전</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNextStep}
              className={`px-4 py-2.5 rounded-xl text-white text-xs font-extrabold transition shadow-md flex items-center space-x-1.5 active:scale-95 ${
                currentStep === 4
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'
                  : getStepStatus(currentStep).status === 'approved'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'
                  : getStepStatus(currentStep).status === 'held'
                  ? 'bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-700 hover:to-orange-700 ring-2 ring-rose-300'
                  : getStepStatus(currentStep).status === 'submitted'
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-eureka-600 hover:bg-eureka-700'
              }`}
            >
              <span>
                {currentStep === 4
                  ? '결과 보고서 확인하기'
                  : getStepStatus(currentStep).status === 'approved'
                  ? '다음 단계로 이동 (승인 완료)'
                  : getStepStatus(currentStep).status === 'held'
                  ? '보완 내용 제출하고 재승인 요청 🚀'
                  : getStepStatus(currentStep).status === 'submitted'
                  ? '선생님 검토 대기 중 ⏳ (수정 제출)'
                  : '교사 승인 후 다음 단계'}
              </span>
              {currentStep === 4 ? (
                <FileText className="w-3.5 h-3.5" />
              ) : getStepStatus(currentStep).status === 'approved' ? (
                <ArrowRight className="w-3.5 h-3.5" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
