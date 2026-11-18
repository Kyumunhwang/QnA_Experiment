import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import TeacherNav from '../../components/teacher/TeacherNav';
import {
  Award,
  Filter,
  CheckCircle2,
  FileText,
  AlertTriangle,
  Send,
  MessageSquare,
  Sparkles
} from 'lucide-react';

export default function TeacherPortfolios() {
  const navigate = useNavigate();
  const {
    portfolios,
    questions,
    classList,
    reviewPortfolioAction,
    currentTeacher,
    showToast,
  } = useApp();

  const [filterClass, setFilterClass] = useState('ALL');
  const [commentsInput, setCommentsInput] = useState({});
  const [isProcessingId, setIsProcessingId] = useState(null);

  const displayedPortfolios =
    filterClass === 'ALL'
      ? portfolios
      : portfolios.filter((p) => p.grade_class === filterClass);

  const getQuestion = (questionId) => {
    return questions.find((q) => String(q.id) === String(questionId));
  };

  const getQuestionTitle = (q) => {
    if (!q) return '탐구 과제';
    if (q.ui_type === 'B') {
      try {
        const obj = JSON.parse(q.content);
        return obj.wonder || obj.think || '관찰형 질문';
      } catch {
        return q.content;
      }
    }
    return q.content;
  };

  const handleCommentChange = (id, val) => {
    setCommentsInput((prev) => ({
      ...prev,
      [id]: val,
    }));
  };

  const onToggleReviewSeal = async (portfolio, newSealStatus) => {
    if (newSealStatus && !portfolio.step4_conclusion) {
      const confirmed = window.confirm(
        '이 학생의 포트폴리오는 아직 4단계 최종 결론이 작성되지 않은 미완료 상태입니다.\n정말 최종 확인 도장(100점 만점)을 부여하시겠습니까?'
      );
      if (!confirmed) return;
    }

    const comment =
      commentsInput[portfolio.id] !== undefined
        ? commentsInput[portfolio.id]
        : portfolio.teacher_comment || '';

    const reviewer = currentTeacher?.teacher_name || '황규문';
    setIsProcessingId(portfolio.id);
    await reviewPortfolioAction(portfolio.id, newSealStatus, comment.trim(), reviewer);
    setIsProcessingId(null);
  };

  return (
    <div className="space-y-4 pb-16 animate-fadeIn">
      <TeacherNav />

      {/* 헤더 안내 */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center space-x-1.5">
            <Award className="w-5 h-5 text-purple-600" />
            <span>탐구 포트폴리오 검토 & 확인 도장 부여</span>
          </h2>
          <p className="text-xs text-slate-500">
            학생들의 4단계 탐구 일지를 검토하고, 총평 코멘트와 함께 공식 확인 도장(💮)을 부여합니다.
          </p>
        </div>

        {/* 학급 필터 */}
        <div className="flex items-center space-x-1.5">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-xl focus:outline-none"
          >
            <option value="ALL">전체 학급 ({portfolios.length}편)</option>
            {classList.map((cls) => (
              <option key={cls} value={cls}>
                {cls} 반
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 포트폴리오 리스트 */}
      <div className="space-y-4">
        {displayedPortfolios.length === 0 ? (
          <div className="bg-white p-10 rounded-3xl border border-dashed text-center text-xs text-slate-400">
            작성된 탐구 포트폴리오가 아직 없습니다.
          </div>
        ) : (
          displayedPortfolios.map((item) => {
            const question = getQuestion(item.question_id);
            const isCompleted = Boolean(item.step4_conclusion);
            const isReviewed = Boolean(item.is_reviewed);
            const isProcessing = isProcessingId === item.id;
            const currentComment =
              commentsInput[item.id] !== undefined
                ? commentsInput[item.id]
                : item.teacher_comment || '';

            return (
              <div
                key={item.id}
                className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition"
              >
                {/* 상단 학생 정보 & 확인 도장 배지 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="bg-slate-800 text-white font-black text-[10px] px-2 py-0.5 rounded-md">
                      {item.grade_class || '학급'}
                    </span>
                    <span className="text-sm font-extrabold text-slate-800">
                      {item.student_name} 학생
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {isCompleted ? '✓ 결론 완료' : '작성 중'}
                    </span>
                  </div>

                  {isReviewed ? (
                    <div className="flex items-center space-x-1 px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-300 rounded-full font-black text-xs shadow-xs">
                      <span>💮 확인 도장 완료 ({item.reviewed_by || '황규문'})</span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 font-semibold">도장 미부여</span>
                  )}
                </div>

                {/* 질문 제목 */}
                <p className="text-xs sm:text-sm font-bold text-slate-800 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  "{getQuestionTitle(question)}"
                </p>

                {/* 핵심: 실패 분석 요약 하이라이트 */}
                <div className="p-3.5 bg-rose-50/50 border border-rose-200/80 rounded-2xl space-y-2 text-xs">
                  <div className="flex items-center space-x-1.5 font-black text-rose-800">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>3단계. 실패 분석 및 새로운 가설 (학생 작성 요약)</span>
                  </div>
                  <div className="space-y-1 pl-1">
                    <p className="text-slate-700">
                      <b className="text-rose-700">배운 점:</b>{' '}
                      {item.step3_failure_lesson || '(작성 전)'}
                    </p>
                    <p className="text-slate-700">
                      <b className="text-amber-700">수정한 가설:</b>{' '}
                      {item.step3_revised_hypothesis || '(작성 전)'}
                    </p>
                  </div>
                </div>

                {/* 선생님 총평 코멘트 & 확인 도장 부여 폼 */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                      <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                      <span>선생님 총평 및 수행평가 코멘트 (PDF 보고서에 포함)</span>
                    </label>
                    <span className="text-[10px] text-slate-400">{item.last_updated}</span>
                  </div>

                  <textarea
                    value={currentComment}
                    onChange={(e) => handleCommentChange(item.id, e.target.value)}
                    rows={2}
                    placeholder="예: 실패 원인을 논리적으로 추적하여 훌륭한 탐구로 완성했습니다. 적극적인 탐구 태도를 칭찬합니다! 💮"
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none font-medium leading-relaxed"
                  />

                  {/* 하단 액션: 보고서 보기 & 확인 도장 토글 */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() =>
                        navigate(`/report/${item.id}?questionId=${item.question_id}`)
                      }
                      className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center space-x-1"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      <span>PDF 보고서 미리보기</span>
                    </button>

                    <div className="flex items-center space-x-2">
                      {isReviewed ? (
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => onToggleReviewSeal(item, false)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition"
                        >
                          도장 취소
                        </button>
                      ) : null}

                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => onToggleReviewSeal(item, true)}
                        className={`px-4 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center space-x-1 shadow-sm ${
                          isReviewed
                            ? 'bg-rose-600 text-white hover:bg-rose-700'
                            : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700'
                        }`}
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>{isReviewed ? '✓ 코멘트 저장' : '💮 확인 도장 찍기'}</span>
                      </button>
                    </div>
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
