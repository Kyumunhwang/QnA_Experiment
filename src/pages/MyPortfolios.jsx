import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { matchesStudentName } from '../services/api';
import { formatKSTDate } from '../utils/format';
import { BookOpen, Calendar, ArrowRight, FileText, PlusCircle, Compass, Lock } from 'lucide-react';

export default function MyPortfolios() {
  const navigate = useNavigate();
  const { currentUser, currentTeacher, studentName, questions, portfolios, refreshPortfolios, setIsLoginModalOpen } = useApp();
  const [localPortfolios, setLocalPortfolios] = useState(portfolios);

  useEffect(() => {
    refreshPortfolios();
  }, []);

  useEffect(() => {
    let list = Array.isArray(portfolios) ? [...portfolios] : [];
    // 학생인 경우 본인의 포트폴리오만 필터링
    if (currentUser?.studentName) {
      list = list.filter((p) => matchesStudentName(p.student_name, currentUser.studentName));
    }
    // 최신 수정순 정렬
    list.sort((a, b) => new Date(b.last_updated || 0) - new Date(a.last_updated || 0));
    setLocalPortfolios(list);
  }, [portfolios, currentUser]);

  if (!currentUser && !currentTeacher) {
    return (
      <div className="py-16 text-center space-y-4 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm animate-fadeIn">
        <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-extrabold text-slate-800">로그인이 필요한 페이지입니다</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            내 탐구 일지를 확인하거나 이어서 작성하려면 먼저 학생 계정으로 로그인해 주세요.
          </p>
        </div>
        <button
          onClick={() => setIsLoginModalOpen(true)}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
        >
          로그인하기
        </button>
      </div>
    );
  }

  const findQuestion = (questionId) => {
    return questions.find((q) => String(q.id) === String(questionId));
  };

  const getQuestionTitle = (q) => {
    if (!q) return '탐구 과제';
    if (q.ui_type === 'B') {
      try {
        const parsed = JSON.parse(q.content);
        return parsed.wonder || parsed.think || '관찰형 질문';
      } catch {
        return q.content;
      }
    }
    return q.content;
  };

  return (
    <div className="space-y-4 pb-12 animate-fadeIn">
      <div className="space-y-1">
        <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center space-x-2">
          <span>내 탐구 일지 보관함</span>
          <BookOpen className="w-5 h-5 text-eureka-500" />
        </h2>
        <p className="text-xs text-slate-500">
          {studentName ? `${studentName} 학생이` : '내가'} 기록하고 있는 모든 탐구 포트폴리오입니다.
        </p>
      </div>

      {localPortfolios.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200 p-6 space-y-3">
          <div className="w-12 h-12 rounded-full bg-eureka-50 text-eureka-600 flex items-center justify-center mx-auto">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-700">작성 중인 탐구 일지가 없습니다.</p>
            <p className="text-xs text-slate-400 mt-1">
              홈 화면에서 채택된 질문을 선택하여 첫 탐구를 시작해 보세요!
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-eureka-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-eureka-700 transition"
          >
            <span>탐구하러 가기</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {localPortfolios.map((item) => {
            const question = findQuestion(item.question_id);
            const isCompleted = Boolean(item.step4_conclusion);

            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                      isCompleted
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {isCompleted ? '✓ 탐구 완료' : '작성 중 (임시저장)'}
                  </span>
                  <div className="flex items-center space-x-1 text-[11px] text-slate-400">
                    <Calendar className="w-3 h-3" />
                    <span>{formatKSTDate(item.last_updated)}</span>
                  </div>
                </div>

                <h3 className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-2 leading-snug">
                  "{getQuestionTitle(question)}"
                </h3>

                {/* 진행 요약 칩 */}
                <div className="grid grid-cols-4 gap-1 pt-1 text-center">
                  <div
                    className={`p-1.5 rounded-xl text-[10px] font-semibold ${
                      item.step1_research ? 'bg-blue-50 text-blue-700' : 'bg-slate-50 text-slate-300'
                    }`}
                  >
                    1. 가설
                  </div>
                  <div
                    className={`p-1.5 rounded-xl text-[10px] font-semibold ${
                      item.step2_experiment ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-300'
                    }`}
                  >
                    2. 실험
                  </div>
                  <div
                    className={`p-1.5 rounded-xl text-[10px] font-semibold ${
                      item.step3_failure_lesson ? 'bg-rose-50 text-rose-700' : 'bg-slate-50 text-slate-300'
                    }`}
                  >
                    3. 실패분석
                  </div>
                  <div
                    className={`p-1.5 rounded-xl text-[10px] font-semibold ${
                      item.step4_conclusion ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-300'
                    }`}
                  >
                    4. 결론
                  </div>
                </div>

                {/* 액션 버튼 */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-end space-x-2">
                  <button
                    onClick={() =>
                      navigate(
                        `/portfolio/new?questionId=${item.question_id}&id=${item.id}`
                      )
                    }
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition"
                  >
                    이어서 작성
                  </button>
                  <button
                    onClick={() =>
                      navigate(`/report/${item.id}?questionId=${item.question_id}`)
                    }
                    className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center space-x-1 shadow-sm"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>결과 보고서</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
