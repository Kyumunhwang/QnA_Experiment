import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { getPortfolios, savePortfolio } from '../services/api';
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
  Quote
} from 'lucide-react';

export default function PortfolioEditor() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const questionId = searchParams.get('questionId');
  const portfolioIdParam = searchParams.get('id');

  const {
    questions,
    currentUser,
    currentTeacher,
    setIsLoginModalOpen,
    showToast,
    refreshPortfolios
  } = useApp();

  const targetQuestion = questions.find((q) => String(q.id) === String(questionId));

  const [currentStep, setCurrentStep] = useState(1);
  const [portfolioId, setPortfolioId] = useState(portfolioIdParam || '');

  // 가이드 아코디언 열림/닫힘 상태
  const [isGuideOpen, setIsGuideOpen] = useState(true);

  // 폼 상태
  const [step1Research, setStep1Research] = useState('');
  const [step2Experiment, setStep2Experiment] = useState('');
  const [step3FailureLesson, setStep3FailureLesson] = useState('');
  const [step3RevisedHypothesis, setStep3RevisedHypothesis] = useState('');
  const [step4Conclusion, setStep4Conclusion] = useState('');

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

  // 기존 저장 데이터 불러오기
  useEffect(() => {
    async function loadExisting() {
      if (!questionId && !portfolioIdParam) return;
      try {
        const studentName = currentUser?.studentName;
        const list = await getPortfolios(studentName || undefined, questionId || undefined);
        const existing = portfolioIdParam
          ? list.find((p) => p.id === portfolioIdParam)
          : list[0];

        if (existing) {
          setPortfolioId(existing.id);
          setStep1Research(existing.step1_research || '');
          setStep2Experiment(existing.step2_experiment || '');
          setStep3FailureLesson(existing.step3_failure_lesson || '');
          setStep3RevisedHypothesis(existing.step3_revised_hypothesis || '');
          setStep4Conclusion(existing.step4_conclusion || '');
          setLastSavedTime(existing.last_updated || '');
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

  const handleSave = async (silent = false) => {
    if (!currentUser) {
      if (!silent) showToast('로그인이 필요합니다.', 'error');
      setIsLoginModalOpen(true);
      return null;
    }

    setIsSaving(true);
    try {
      const saved = await savePortfolio({
        id: portfolioId,
        question_id: questionId || targetQuestion?.id || '',
        student_name: currentUser.studentName,
        grade_class: currentUser.gradeClass,
        step1_research: step1Research,
        step2_experiment: step2Experiment,
        step3_failure_lesson: step3FailureLesson,
        step3_revised_hypothesis: step3RevisedHypothesis,
        step4_conclusion: step4Conclusion,
      });

      if (saved?.id) setPortfolioId(saved.id);
      setLastSavedTime(new Date().toLocaleTimeString());
      await refreshPortfolios(currentUser.studentName);

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

  const handleNextStep = async () => {
    await handleSave(true);
    if (currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate(`/report/${portfolioId || ('PF-' + Date.now())}?questionId=${questionId}`);
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

      {/* 4단계 스텝 인디케이터 */}
      <div className="grid grid-cols-4 gap-1.5 bg-slate-200/80 p-1.5 rounded-2xl">
        {steps.map((s) => {
          const Icon = s.icon;
          const isActive = currentStep === s.num;
          return (
            <button
              key={s.num}
              type="button"
              onClick={() => setCurrentStep(s.num)}
              className={`py-2 px-1 rounded-xl text-center transition flex flex-col items-center justify-center space-y-0.5 ${
                isActive
                  ? 'bg-white shadow-sm font-bold text-slate-800'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <div className="flex items-center space-x-1">
                <Icon className={`w-3.5 h-3.5 ${isActive ? s.color : 'text-slate-400'}`} />
                <span className="text-[11px] font-bold">{s.num}단계</span>
              </div>
              <span className="text-[10px] truncate max-w-full">{s.title}</span>
            </button>
          );
        })}
      </div>

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

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                나의 초기 가설 및 사전 조사 내용
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

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                실험 및 관찰 과정 기록
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
                  : 'bg-eureka-600 hover:bg-eureka-700'
              }`}
            >
              <span>{currentStep === 4 ? '결과 보고서 확인하기' : '저장 후 다음 단계'}</span>
              {currentStep === 4 ? (
                <FileText className="w-3.5 h-3.5" />
              ) : (
                <ArrowRight className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
