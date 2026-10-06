import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  MessageSquareQuote,
  Lightbulb,
  Eye,
  HelpCircle,
  Sparkles,
  Filter,
  ExternalLink,
  ShieldCheck,
  Compass
} from 'lucide-react';

export default function StudentQnAArchiveModal({ isOpen, onClose, questions = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // 모달이 닫혀 있으면 렌더링하지 않음
  if (!isOpen) return null;

  // 질문 안전 배열화
  const safeQuestions = Array.isArray(questions) ? questions : [];

  // 질문 내용 파싱 (ui_type 'B' STW 관찰형 및 JSON 문자열 완벽 방어 지원)
  const parseQuestionContent = (q) => {
    if (!q) return { isSTW: false, text: '' };

    try {
      let obj = q.content;
      if (typeof obj === 'string') {
        const trimmed = obj.trim();
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
          obj = JSON.parse(trimmed);
        }
      }

      if (
        obj &&
        typeof obj === 'object' &&
        (obj.see !== undefined || obj.think !== undefined || obj.wonder !== undefined)
      ) {
        return {
          isSTW: true,
          see: String(obj.see || ''),
          think: String(obj.think || ''),
          wonder: String(obj.wonder || ''),
          imageUrl: String(obj.imageUrl || ''),
          linkUrl: String(obj.linkUrl || ''),
        };
      }
    } catch {
      // JSON 파싱 실패 시 일반 텍스트 처리로 이동
    }

    // 일반 텍스트이거나 파싱 불가한 경우 (객체일 경우 JSON 문자열화하여 리액트 child 에러 원천 차단)
    const textVal =
      typeof q.content === 'object' && q.content !== null
        ? JSON.stringify(q.content)
        : String(q.content || '');

    return { isSTW: false, text: textVal };
  };

  // '보완 요청(status: rejected)' 질문 목록 필터링
  const rejectedQuestions = useMemo(() => {
    return safeQuestions.filter((q) => {
      if (!q || typeof q !== 'object') return false;
      const status = q.status || (q.is_selected ? 'approved' : 'pending');
      return status === 'rejected';
    });
  }, [safeQuestions]);

  // 카테고리 목록 추출
  const categories = useMemo(() => {
    const set = new Set();
    rejectedQuestions.forEach((q) => {
      if (q && q.category && typeof q.category === 'string') {
        set.add(q.category);
      }
    });
    return ['ALL', ...Array.from(set)];
  }, [rejectedQuestions]);

  // 검색 및 카테고리 필터링
  const filteredList = useMemo(() => {
    return rejectedQuestions.filter((q) => {
      if (!q) return false;

      // 카테고리 필터
      if (selectedCategory !== 'ALL' && q.category !== selectedCategory) {
        return false;
      }

      // 검색어 필터
      const trimmedSearch = String(searchTerm || '').trim().toLowerCase();
      if (!trimmedSearch) return true;

      const parsed = parseQuestionContent(q);

      let contentMatch = false;
      if (parsed.isSTW) {
        contentMatch =
          String(parsed.see || '').toLowerCase().includes(trimmedSearch) ||
          String(parsed.think || '').toLowerCase().includes(trimmedSearch) ||
          String(parsed.wonder || '').toLowerCase().includes(trimmedSearch);
      } else {
        contentMatch = String(parsed.text || '').toLowerCase().includes(trimmedSearch);
      }

      const feedbackMatch =
        q.teacher_feedback &&
        String(q.teacher_feedback).toLowerCase().includes(trimmedSearch);
      const catMatch =
        q.category && String(q.category).toLowerCase().includes(trimmedSearch);

      return contentMatch || feedbackMatch || catMatch;
    });
  }, [rejectedQuestions, selectedCategory, searchTerm]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 상단 헤더 */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-teal-600 via-eureka-600 to-indigo-600 text-white shrink-0 relative">
          <div className="flex items-start justify-between">
            <div className="space-y-1 pr-6">
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-bold backdrop-blur-sm">
                <Compass className="w-3.5 h-3.5 text-amber-300" />
                <span>탐구 질문 길라잡이</span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold tracking-tight">
                지금까지 학생들의 질문과 답변들
              </h3>
              <p className="text-xs text-white/90 leading-relaxed">
                선생님의 보완 피드백을 참고하여, 다른 시각의 독창적인 과학 질문으로 발전시켜 보세요!
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition active:scale-95 shrink-0"
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 익명성 보장 안내 배지 */}
          <div className="mt-3.5 pt-3 border-t border-white/15 flex items-center space-x-1.5 text-[11px] text-white/80">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
            <span>작성자(학생 이름 및 학년) 정보는 개인정보 보호를 위해 비공개(익명) 처리되어 있습니다.</span>
          </div>
        </div>

        {/* 검색 및 카테고리 필터 바 */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 shrink-0 space-y-3">
          {/* 검색창 */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="질문 키워드나 선생님의 피드백 내용 검색..."
              className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-eureka-500 transition shadow-sm"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                지우기
              </button>
            )}
          </div>

          {/* 카테고리 칩 목록 */}
          {categories.length > 1 && (
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              <span className="text-[11px] font-bold text-slate-500 flex items-center space-x-1 shrink-0 mr-1">
                <Filter className="w-3 h-3" />
                <span>분야:</span>
              </span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                    selectedCategory === cat
                      ? 'bg-eureka-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cat === 'ALL' ? '전체 보기' : cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 질문 & 피드백 리스트 (스크롤 영역) */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 bg-slate-50/50">
          {filteredList.length === 0 ? (
            <div className="py-16 text-center space-y-3 bg-white rounded-2xl border border-dashed border-slate-200">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <HelpCircle className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-700">
                {searchTerm || selectedCategory !== 'ALL'
                  ? '검색 조건에 맞는 질문 및 피드백이 없습니다.'
                  : '등록된 보완 요청 질문이 아직 없습니다.'}
              </p>
              <p className="text-xs text-slate-400">
                {searchTerm ? '다른 검색어를 입력해 보세요.' : '새로운 질문을 등록해 보세요!'}
              </p>
            </div>
          ) : (
            filteredList.map((q, idx) => {
              const parsed = parseQuestionContent(q);
              return (
                <div
                  key={q.id || `idx-${idx}`}
                  className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition space-y-3.5"
                >
                  {/* 상단 메타 헤더 (학생 이름/학년 철저히 배제) */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        질문 사례 #{filteredList.length - idx}
                      </span>
                      {q.category && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {String(q.category)}
                        </span>
                      )}
                      <span className="text-[10px] font-semibold text-slate-400">
                        {parsed.isSTW ? '관찰형(STW)' : '한 줄 질문'}
                      </span>
                    </div>

                    <span className="text-[11px] font-medium text-slate-400">
                      익명의 동료 탐구자
                    </span>
                  </div>

                  {/* 질문 본문 */}
                  {parsed.isSTW ? (
                    <div className="space-y-2.5 text-xs bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                      {parsed.imageUrl && (
                        <img
                          src={parsed.imageUrl}
                          alt="관찰 사진"
                          className="w-full max-h-48 object-cover rounded-lg mb-2 border border-slate-200"
                        />
                      )}
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-1.5 font-bold text-slate-700">
                          <Eye className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span>See (관찰 내용):</span>
                        </div>
                        <p className="text-slate-600 pl-5 leading-relaxed">{parsed.see}</p>
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-1.5 font-bold text-slate-700">
                          <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>Think (생각/가설):</span>
                        </div>
                        <p className="text-slate-600 pl-5 leading-relaxed">{parsed.think}</p>
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-1.5 font-bold text-indigo-700">
                          <HelpCircle className="w-3.5 h-3.5 text-eureka-600 shrink-0" />
                          <span>Wonder (궁금한 점):</span>
                        </div>
                        <p className="text-slate-900 font-bold pl-5 leading-relaxed">{parsed.wonder}</p>
                      </div>

                      {parsed.linkUrl && (
                        <div className="pt-1 pl-5">
                          <a
                            href={parsed.linkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 text-xs text-eureka-600 hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>참고 링크 바로가기</span>
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs sm:text-sm text-slate-800 font-medium bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 leading-relaxed whitespace-pre-wrap">
                      {parsed.text}
                    </div>
                  )}

                  {/* 선생님의 보완 피드백 (하이라이트 카드) */}
                  {q.teacher_feedback ? (
                    <div className="bg-amber-50/90 border border-amber-200/90 rounded-xl p-3.5 space-y-1.5 shadow-sm">
                      <div className="flex items-center space-x-1.5 text-amber-900 font-extrabold text-xs">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>선생님의 보완 피드백 & 질문 발전 가이드</span>
                      </div>
                      <p className="text-xs text-amber-950/90 leading-relaxed whitespace-pre-wrap pl-5 font-normal">
                        {typeof q.teacher_feedback === 'string'
                          ? q.teacher_feedback
                          : JSON.stringify(q.teacher_feedback)}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-2.5 text-[11px] text-slate-500 flex items-center space-x-1.5">
                      <MessageSquareQuote className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>선생님의 피드백이 등록될 예정입니다.</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* 모달 하단 푸터 */}
        <div className="p-3.5 sm:p-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500 font-medium">
            보완 사례 총 <strong className="text-eureka-600 font-bold">{filteredList.length}</strong>건 표시 중
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition active:scale-95 shadow-sm"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
