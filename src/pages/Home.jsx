import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  XCircle,
  MessageSquareQuote,
  Compass,
  Eye,
  HelpCircle,
  Lightbulb,
  Lock,
  UserCheck,
  Plus,
  MessageSquare,
  ShieldCheck
} from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const {
    currentUser,
    currentTeacher,
    setIsLoginModalOpen,
    questions,
    loading,
    isTeacherMode,
    handleToggleSelectQuestion,
    showToast,
    appConfig,
    THEME_OPTIONS,
  } = useApp();

  const [tab, setTab] = useState('approved'); // 'approved' | 'my' | 'all'

  // 테마 색상 그라디언트 매핑
  const currentTheme = THEME_OPTIONS.find((t) => t.id === appConfig.theme_color) || THEME_OPTIONS[0];

  // 승인된 질문 목록
  const approvedQuestions = questions.filter((q) => q.is_selected || q.status === 'approved');

  // 현재 로그인한 학생의 질문 목록
  const myQuestions = currentUser
    ? questions.filter((q) => q.student_name === currentUser.studentName)
    : [];

  const getDisplayQuestions = () => {
    if (tab === 'approved') return approvedQuestions;
    if (tab === 'my') return myQuestions;
    return questions;
  };

  const displayQuestions = getDisplayQuestions();

  const parseQuestionContent = (q) => {
    if (q.ui_type === 'B') {
      try {
        const obj = typeof q.content === 'string' ? JSON.parse(q.content) : q.content;
        return {
          isSTW: true,
          see: obj.see || '',
          think: obj.think || '',
          wonder: obj.wonder || '',
          imageUrl: obj.imageUrl || '',
          linkUrl: obj.linkUrl || '',
        };
      } catch {
        return { isSTW: false, text: q.content };
      }
    }
    return { isSTW: false, text: q.content };
  };

  const handleStartExplore = (question) => {
    if (!currentUser) {
      showToast('탐구 일지를 작성하려면 먼저 학생 로그인이 필요합니다.', 'info');
      setIsLoginModalOpen(true);
      return;
    }

    const isApproved = question.is_selected || question.status === 'approved';
    if (!isApproved) {
      showToast('선생님이 승인(채택)한 질문만 다음 단계(탐구 일지)로 진행할 수 있습니다!', 'info');
      return;
    }

    navigate(`/portfolio/new?questionId=${question.id}`);
  };

  return (
    <div className="space-y-4 pb-8 animate-fadeIn">
      {/* 웰컴 배너 (선생님 커스텀 공지 및 테마 색상 연동) */}
      <div
        className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${currentTheme.bgGradient} text-white p-5 sm:p-6 shadow-xl transition-all duration-300`}
      >
        <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 rounded-full bg-white/10 blur-xl"></div>
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-discovery-400" />
            <span>실패에서 배우는 과학 탐구</span>
          </div>

          <h2 className="text-lg sm:text-xl font-extrabold leading-snug">
            {currentUser ? (
              <>
                반가워요, <span className="underline decoration-discovery-400">{currentUser.gradeClass} {currentUser.studentName}</span> 학생!<br />
                {appConfig.banner_title || '선생님이 승인한 멋진 탐구를 시작해 보세요.'}
              </>
            ) : (
              appConfig.banner_title || '일상의 사소한 호기심이 위대한 과학 발견이 됩니다!'
            )}
          </h2>

          <p className="text-xs text-white/80 leading-relaxed">
            {appConfig.banner_desc || '호기심 질문을 등록하면 선생님이 검토 후 탐구 과제로 승인합니다. 실패는 더 정확한 답을 찾아가는 최고의 디딤돌입니다!'}
          </p>

          <div className="pt-2 flex items-center space-x-2">
            <button
              onClick={() => {
                if (!currentUser) {
                  showToast('질문을 남기려면 먼저 학생 로그인을 해주세요.', 'info');
                  setIsLoginModalOpen(true);
                  return;
                }
                navigate('/ask');
              }}
              className="inline-flex items-center space-x-1.5 bg-white text-slate-900 font-extrabold text-xs px-4 py-2.5 rounded-2xl shadow-md hover:bg-slate-50 transition active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 text-eureka-600" />
              <span>호기심 질문 남기기</span>
            </button>

            {!currentUser && !currentTeacher && (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="inline-flex items-center space-x-1 bg-black/30 text-white border border-white/30 font-bold text-xs px-3 py-2.5 rounded-2xl hover:bg-black/40 transition"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>학생 로그인</span>
              </button>
            )}

            {currentTeacher && (
              <Link
                to="/teacher"
                className="inline-flex items-center space-x-1 bg-amber-500/90 hover:bg-amber-600 text-white border border-amber-300/40 font-bold text-xs px-3.5 py-2.5 rounded-2xl shadow-md transition"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>교사 관리 포털 바로가기</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex bg-slate-200/80 p-1 rounded-2xl">
        <button
          onClick={() => setTab('approved')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 ${
            tab === 'approved'
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>승인된 과제 ({approvedQuestions.length})</span>
        </button>

        <button
          onClick={() => {
            if (!currentUser) {
              showToast('내 질문을 보려면 먼저 학생 로그인을 해주세요.', 'info');
              setIsLoginModalOpen(true);
              return;
            }
            setTab('my');
          }}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 ${
            tab === 'my'
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <span>내 질문 ({myQuestions.length})</span>
        </button>

        <button
          onClick={() => setTab('all')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 ${
            tab === 'all'
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <span>전체 피드 ({questions.length})</span>
        </button>
      </div>

      {/* 안내 배너 */}
      {tab === 'my' && (
        <div className="bg-sky-50 border border-sky-200/70 p-3 rounded-2xl text-[11px] text-sky-800 space-y-0.5">
          <p className="font-bold flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
            <span>선생님 피드백 및 승인 확인</span>
          </p>
          <p className="text-sky-700 leading-relaxed">
            질문 카드 아래에 <b>선생님이 남겨주신 피드백</b>을 확인하세요! '승인 완료'된 질문만 4단계 탐구 일지로 진행할 수 있습니다.
          </p>
        </div>
      )}

      {/* 질문 카드 리스트 */}
      <div className="space-y-3.5">
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            <div className="animate-spin w-6 h-6 border-2 border-eureka-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            데이터를 불러오는 중입니다...
          </div>
        ) : displayQuestions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200 p-6 space-y-2">
            <MessageSquareQuote className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-600">
              {tab === 'approved'
                ? '아직 선생님이 승인한 탐구 질문이 없습니다.'
                : tab === 'my'
                ? '아직 등록한 내 질문이 없습니다.'
                : '등록된 질문이 없습니다.'}
            </p>
            <p className="text-xs text-slate-400">
              {tab === 'approved'
                ? '선생님이 질문을 검토하고 승인하면 여기에 나타납니다.'
                : '새로운 호기심 질문을 던져보세요!'}
            </p>
            <button
              onClick={() => {
                if (!currentUser) setIsLoginModalOpen(true);
                else navigate('/ask');
              }}
              className="mt-3 text-xs font-bold text-eureka-600 hover:underline inline-block"
            >
              + 질문 등록하러 가기
            </button>
          </div>
        ) : (
          displayQuestions.map((q) => {
            const parsed = parseQuestionContent(q);
            const status = q.status || (q.is_selected ? 'approved' : 'pending');
            const isApproved = status === 'approved';
            const isMyQuestion = currentUser?.studentName === q.student_name;

            return (
              <div
                key={q.id}
                className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-sm hover:shadow-md transition space-y-3 relative"
              >
                {/* 상단 태그 & 작성자 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                    {/* 카테고리 태그 */}
                    {q.category && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {q.category}
                      </span>
                    )}

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        q.ui_type === 'B'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {q.ui_type === 'B' ? '관찰형 (STW)' : '한 줄'}
                    </span>

                    {/* 승인 완료 vs 보완 요청 vs 승인 대기 배지 */}
                    {status === 'approved' && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>승인 완료</span>
                      </span>
                    )}
                    {status === 'pending' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 flex items-center gap-0.5">
                        <Clock className="w-3 h-3 text-amber-500" />
                        <span>승인 대기</span>
                      </span>
                    )}
                    {status === 'rejected' && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 flex items-center gap-0.5">
                        <XCircle className="w-3 h-3 text-rose-600" />
                        <span>보완 요청</span>
                      </span>
                    )}

                    {isMyQuestion && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        내 질문
                      </span>
                    )}
                  </div>

                  <span className="text-xs text-slate-400 font-medium shrink-0">
                    {q.grade_class ? `${q.grade_class} ` : ''}{q.student_name}
                  </span>
                </div>

                {/* 질문 본문 */}
                {parsed.isSTW ? (
                  <div className="space-y-2 pt-1 text-xs">
                    {parsed.imageUrl && (
                      <img
                        src={parsed.imageUrl}
                        alt="관찰 사진"
                        className="w-full max-h-48 object-cover rounded-2xl mb-2"
                      />
                    )}
                    <div className="p-2.5 bg-slate-50 rounded-xl space-y-1">
                      <div className="flex items-center space-x-1.5 text-slate-700 font-bold">
                        <Eye className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span>See (관찰):</span>
                      </div>
                      <p className="text-slate-600 pl-5">{parsed.see}</p>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-xl space-y-1">
                      <div className="flex items-center space-x-1.5 text-slate-700 font-bold">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>Think (생각):</span>
                      </div>
                      <p className="text-slate-600 pl-5">{parsed.think}</p>
                    </div>

                    <div className="p-2.5 bg-eureka-50/80 rounded-xl space-y-1 border border-eureka-200/50">
                      <div className="flex items-center space-x-1.5 text-eureka-800 font-bold">
                        <HelpCircle className="w-3.5 h-3.5 text-eureka-600 shrink-0" />
                        <span>Wonder (질문):</span>
                      </div>
                      <p className="text-eureka-900 font-bold pl-5">{parsed.wonder}</p>
                    </div>

                    {parsed.linkUrl && (
                      <a
                        href={parsed.linkUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-blue-500 hover:underline block truncate pt-0.5"
                      >
                        🔗 참고 링크: {parsed.linkUrl}
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="text-sm font-semibold text-slate-800 leading-snug">
                    {parsed.text}
                  </p>
                )}

                {/* 선생님 피드백 말풍선 (있는 경우 카드에 바로 표시) */}
                {q.teacher_feedback && (
                  <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-2xl space-y-1 text-xs animate-fadeIn">
                    <div className="flex items-center space-x-1 text-amber-800 font-extrabold">
                      <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                      <span>선생님의 피드백:</span>
                    </div>
                    <p className="text-slate-800 pl-4 font-medium leading-relaxed whitespace-pre-wrap">
                      {q.teacher_feedback}
                    </p>
                  </div>
                )}

                {/* 하단 버튼 액션: 교사 승인 토글 / 탐구 일지 쓰기 */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400">
                    {q.created_at ? q.created_at.substring(0, 10) : ''}
                  </span>

                  <div className="flex items-center space-x-2">
                    {isTeacherMode && (
                      <button
                        onClick={() => handleToggleSelectQuestion(q.id)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center space-x-1 ${
                          isApproved
                            ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        {isApproved ? '승인 취소' : '과제 승인'}
                      </button>
                    )}

                    {isApproved ? (
                      <button
                        onClick={() => handleStartExplore(q)}
                        className="inline-flex items-center space-x-1 text-xs font-extrabold px-3.5 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition shadow-sm active:scale-95"
                      >
                        <Compass className="w-3.5 h-3.5" />
                        <span>탐구 일지 쓰기</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStartExplore(q)}
                        className="inline-flex items-center space-x-1 text-xs font-medium px-3 py-1.5 rounded-xl bg-slate-100 text-slate-400 hover:bg-slate-200 transition"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>{status === 'rejected' ? '가설 보완 필요' : '승인 대기 중'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
