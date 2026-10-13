import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import TeacherNav from '../../components/teacher/TeacherNav';
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Eye,
  Lightbulb,
  HelpCircle,
  Send,
  Sparkles,
  Link2,
  Image as ImageIcon,
  Tag
} from 'lucide-react';

export default function TeacherQuestions() {
  const {
    questions,
    updateQuestionStatusAndFeedback,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'approved' | 'rejected' | 'all'
  const [feedbackInputs, setFeedbackInputs] = useState({});
  const [isProcessingId, setIsProcessingId] = useState(null);

  // 탭 필터링 및 최신순 정렬 (최근에 등록된 질문이 맨 위, 처음에 등록된 질문이 맨 아래)
  const filteredQuestions = questions
    .filter((q) => {
      const status = q.status || (q.is_selected ? 'approved' : 'pending');
      if (activeTab === 'pending') return status === 'pending';
      if (activeTab === 'approved') return status === 'approved';
      if (activeTab === 'rejected') return status === 'rejected' || status === 'rejected_no_score' || status === 'rejected_type_a';
      return true;
    })
    .sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      if (timeA && timeB && timeA !== timeB) return timeB - timeA;
      if (a.created_at && b.created_at && a.created_at !== b.created_at) {
        return String(b.created_at).localeCompare(String(a.created_at));
      }
      return String(b.id || '').localeCompare(String(a.id || ''));
    });

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

  const handleFeedbackChange = (qId, val) => {
    setFeedbackInputs((prev) => ({
      ...prev,
      [qId]: val,
    }));
  };

  const handleStatusUpdate = async (question, targetStatus) => {
    const feedback =
      feedbackInputs[question.id] !== undefined
        ? feedbackInputs[question.id]
        : question.teacher_feedback || '';

    setIsProcessingId(question.id);
    await updateQuestionStatusAndFeedback(question.id, targetStatus, feedback.trim());
    setIsProcessingId(null);
  };

  const pendingCount = questions.filter((q) => (q.status || (q.is_selected ? 'approved' : 'pending')) === 'pending').length;
  const approvedCount = questions.filter((q) => (q.status || (q.is_selected ? 'approved' : 'pending')) === 'approved').length;
  const rejectedCount = questions.filter((q) => q.status === 'rejected' || q.status === 'rejected_no_score' || q.status === 'rejected_type_a').length;

  return (
    <div className="space-y-4 pb-16 animate-fadeIn">
      <TeacherNav />

      {/* 헤더 안내 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center space-x-1.5">
            <CheckSquare className="w-5 h-5 text-eureka-600" />
            <span>질문 검토, 승인/반려 및 피드백</span>
          </h2>
          <p className="text-xs text-slate-500">
            승인된 질문만 학생들이 4단계 탐구 일지로 진행할 수 있습니다. 피드백을 남겨주시면 학생 화면에 전달됩니다.
          </p>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="grid grid-cols-4 gap-1 bg-slate-200/80 p-1 rounded-2xl text-xs font-bold">
        <button
          onClick={() => setActiveTab('pending')}
          className={`py-2 rounded-xl transition flex items-center justify-center space-x-1 ${
            activeTab === 'pending'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>승인 대기 ({pendingCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('approved')}
          className={`py-2 rounded-xl transition flex items-center justify-center space-x-1 ${
            activeTab === 'approved'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>승인 완료 ({approvedCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('rejected')}
          className={`py-2 rounded-xl transition flex items-center justify-center space-x-1 ${
            activeTab === 'rejected'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>반려/보완 ({rejectedCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('all')}
          className={`py-2 rounded-xl transition flex items-center justify-center space-x-1 ${
            activeTab === 'all'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>전체 ({questions.length})</span>
        </button>
      </div>

      {/* 질문 목록 */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="bg-white p-10 rounded-3xl border border-dashed text-center text-xs text-slate-400 space-y-1">
            <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-600">해당 상태의 질문이 없습니다.</p>
          </div>
        ) : (
          filteredQuestions.map((q) => {
            const parsed = parseQuestionContent(q);
            const status = q.status || (q.is_selected ? 'approved' : 'pending');
            const isProcessing = isProcessingId === q.id;
            const currentFeedback =
              feedbackInputs[q.id] !== undefined
                ? feedbackInputs[q.id]
                : q.teacher_feedback || '';

            return (
              <div
                key={q.id}
                className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3 relative hover:shadow-md transition"
              >
                {/* 상단 메타데이터 배지 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                    {/* 상태 배지 */}
                    {status === 'approved' && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>승인 완료</span>
                      </span>
                    )}
                    {status === 'pending' && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-0.5">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>승인 대기 중</span>
                      </span>
                    )}
                    {status === 'rejected' && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 flex items-center gap-0.5">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>보완 요청</span>
                      </span>
                    )}
                    {status === 'rejected_type_a' && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-0.5">
                        <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                        <span>단순 질문 (Type A 평가)</span>
                      </span>
                    )}
                    {status === 'rejected_no_score' && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300 flex items-center gap-0.5">
                        <XCircle className="w-3.5 h-3.5 text-slate-500" />
                        <span>점수없이 반려</span>
                      </span>
                    )}

                    {/* 카테고리 & 타입 */}
                    {q.category && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {q.category}
                      </span>
                    )}
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {q.ui_type === 'B' ? '관찰형 (STW)' : '한 줄 질문'}
                    </span>
                  </div>

                  <span className="text-xs font-bold text-slate-800 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200">
                    {q.grade_class ? `${q.grade_class} ` : ''}{q.student_name}
                  </span>
                </div>

                {/* 질문 상세 내용 */}
                {parsed.isSTW ? (
                  <div className="space-y-2 text-xs bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
                    {parsed.imageUrl && (
                      <img
                        src={parsed.imageUrl}
                        alt="관찰 사진"
                        className="w-full max-h-48 object-cover rounded-xl mb-2"
                      />
                    )}
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1.5 font-bold text-slate-700">
                        <Eye className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span>See (관찰):</span>
                      </div>
                      <p className="text-slate-600 pl-5">{parsed.see}</p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center space-x-1.5 font-bold text-slate-700">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>Think (생각):</span>
                      </div>
                      <p className="text-slate-600 pl-5">{parsed.think}</p>
                    </div>

                    <div className="space-y-1 bg-white p-2.5 rounded-xl border border-eureka-200">
                      <div className="flex items-center space-x-1.5 font-extrabold text-eureka-800">
                        <HelpCircle className="w-3.5 h-3.5 text-eureka-600 shrink-0" />
                        <span>Wonder (궁금한 점 ★):</span>
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
                  <p className="text-sm font-bold text-slate-800 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    "{parsed.text}"
                  </p>
                )}

                {/* 선생님 피드백 입력 폼 */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                      <MessageSquare className="w-3.5 h-3.5 text-eureka-600" />
                      <span>선생님의 피드백 및 조언 (학생에게 실시간 노출)</span>
                    </label>
                    <span className="text-[10px] text-slate-400">
                      {q.created_at ? q.created_at.substring(0, 16) : ''}
                    </span>
                  </div>

                  <textarea
                    value={currentFeedback}
                    onChange={(e) => handleFeedbackChange(q.id, e.target.value)}
                    rows={2}
                    placeholder="예: 가설이 매우 참신하구나! 실험할 때 온도와 습도 조건을 일정하게 유지해 보렴."
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-eureka-500 resize-none font-medium leading-relaxed"
                  />

                  {/* 승인 / 보완 요청 / 점수없이(반려) 액션 버튼 */}
                  <div className="flex items-center justify-end flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleStatusUpdate(q, 'rejected_no_score')}
                      title="중복 질문 등에 점수 부여 없이 교사 답변 및 피드백만 전달합니다."
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 ${
                        status === 'rejected_no_score'
                          ? 'bg-slate-200 text-slate-900 border border-slate-400 shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5 text-slate-500" />
                      <span>점수없이(반려)</span>
                    </button>

                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleStatusUpdate(q, 'rejected')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 ${
                        status === 'rejected'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300 shadow-xs'
                          : 'bg-rose-50 hover:bg-rose-100 text-rose-700'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>보완 요청(반려)</span>
                    </button>

                    {q.ui_type === 'B' && (
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleStatusUpdate(q, 'rejected_type_a')}
                        title="학생이 Type B(관찰형 STW)로 작성했으나 단순 질문인 경우, Type A 기준 점수(기본 80점)로 평가하고 보완 피드백을 전달합니다."
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 ${
                          status === 'rejected_type_a'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-xs'
                            : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                        <span>단순질문(Type A 평가)</span>
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleStatusUpdate(q, 'approved')}
                      className={`px-4 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center space-x-1 shadow-xs ${
                        status === 'approved'
                          ? 'bg-emerald-700 text-white'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{status === 'approved' ? '✓ 승인 완료 (수정 저장)' : '과제 승인 ✓'}</span>
                    </button>
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
