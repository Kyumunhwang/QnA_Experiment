import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  AlertTriangle,
  Lightbulb,
  Zap,
  Trophy,
  History,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  Calendar,
  X,
  Clock,
  ShieldCheck
} from 'lucide-react';
import {
  getStudentComparisonScores,
  getStudentWeeklyHistory,
  getWeekKey
} from '../../utils/scoring';

export default function WeeklyScoreBanner({ currentUser, questions, portfolios }) {
  const { manualScores = {}, appConfig = {} } = useApp();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  if (!currentUser) return null;

  const windowWeeks = appConfig?.score_display_weeks || 2;

  // 이번 주 vs 지난 주 비교 점수 계산 (지연 승인 및 교사 수정 점수 완벽 반영)
  const comparison = getStudentComparisonScores({
    studentName: currentUser.studentName,
    questions,
    portfolios,
    manualScores,
    windowWeeks,
  });

  const { thisWeek, lastWeek, diff, trend } = comparison;
  const { score, lightType, message, breakdown, questionCount, rejectedCount, pendingCount, isApproved, isReviewed, isOverridden } = thisWeek;

  // 최근 주차 이력 (교사 수동 점수 및 지연 승인 반영)
  const weeklyHistory = getStudentWeeklyHistory({
    studentName: currentUser.studentName,
    questions,
    portfolios,
    manualScores,
    weeksCount: 6,
  });

  // 상태 등별 스타일 및 아이콘 매핑 (검토대기/경고등/격려등/도전등/축포 환영)
  const renderStatusLight = () => {
    switch (lightType) {
      case 'pending': // 질문 등록 후 교사 검토 대기 중 (0점)
        return (
          <div className="flex items-center space-x-2">
            <div className="relative flex items-center justify-center">
              <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-amber-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500 border-2 border-white shadow-xs"></span>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 flex items-center space-x-1 shadow-xs">
              <Clock className="w-3.5 h-3.5 text-amber-700" />
              <span>선생님 검토 대기 중 ⏳</span>
            </span>
          </div>
        );

      case 'warning': // 0점 (경고등 - 질문 없음)
        return (
          <div className="flex items-center space-x-2">
            <div className="relative flex items-center justify-center">
              <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-600 border-2 border-white shadow-xs"></span>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300 flex items-center space-x-1 shadow-xs">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>질문 유도 경고등 🚨</span>
            </span>
          </div>
        );

      case 'encourage': // 80~89점 (격려의 등 - 반려 피드백 완료)
        return (
          <div className="flex items-center space-x-2">
            <div className="relative flex items-center justify-center">
              <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-amber-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500 border-2 border-white shadow-xs"></span>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 flex items-center space-x-1 shadow-xs">
              <Lightbulb className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
              <span>더 잘할 수 있는 격려등 💡</span>
            </span>
          </div>
        );

      case 'challenge': // 90~99점 (도전의 등)
        return (
          <div className="flex items-center space-x-2">
            <div className="relative flex items-center justify-center">
              <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-blue-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-blue-600 border-2 border-white shadow-xs"></span>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-900 border border-blue-300 flex items-center space-x-1 shadow-xs">
              <Zap className="w-3.5 h-3.5 text-blue-600 animate-bounce" />
              <span>끝까지 완주하는 도전등 ⚡</span>
            </span>
          </div>
        );

      case 'perfect': // 100점 (축포 환영의 모습)
        return (
          <div className="flex items-center space-x-2">
            <div className="relative flex items-center justify-center">
              <span className="animate-ping absolute inline-flex h-5 w-5 rounded-full bg-purple-400 opacity-90"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-gradient-to-r from-amber-400 to-purple-600 border-2 border-white shadow-xs"></span>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-400 via-pink-400 to-purple-500 text-white shadow-md flex items-center space-x-1 animate-pulse">
              <Trophy className="w-3.5 h-3.5 text-yellow-100" />
              <span>100점 만점 축포 환영 🎆</span>
            </span>
          </div>
        );

      default:
        return null;
    }
  };

  // 배너 배경 테마
  const getBannerTheme = () => {
    if (score === 100) {
      return 'bg-gradient-to-br from-amber-50 via-purple-50 to-pink-50 border-purple-300 shadow-md ring-2 ring-purple-400/30';
    }
    if (score >= 90) {
      return 'bg-gradient-to-br from-blue-50/90 to-indigo-50/80 border-blue-200 shadow-sm';
    }
    if (score >= 80) {
      return 'bg-gradient-to-br from-amber-50/90 to-yellow-50/80 border-amber-200 shadow-sm';
    }
    return 'bg-gradient-to-br from-slate-50 to-rose-50/60 border-slate-200 shadow-sm';
  };

  return (
    <div className={`p-4 sm:p-5 rounded-3xl border transition duration-300 space-y-3.5 relative overflow-hidden ${getBannerTheme()}`}>
      {/* 100점 달성 시 환영 장식 효과 */}
      {score === 100 && (
        <div className="absolute -right-6 -top-6 w-32 h-32 bg-gradient-to-br from-yellow-300 to-pink-400 opacity-20 rounded-full blur-xl pointer-events-none" />
      )}

      {/* 상단: 주차 정보, 공개 기간 배지 & 이력 보기 버튼 */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-2">
          <span className="bg-slate-900 text-white text-[11px] font-black px-2.5 py-0.5 rounded-lg shadow-2xs">
            {thisWeek.weekInfo.label}
          </span>
          <span className="text-[11px] text-slate-500 font-bold">
            ({thisWeek.weekInfo.dateRange})
          </span>
          <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-slate-500 bg-white/70 px-2 py-0.5 rounded-md border border-slate-200">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>최근 {windowWeeks}주간 점수 공개</span>
          </span>
        </div>

        <button
          onClick={() => setIsHistoryOpen(true)}
          className="text-xs font-bold text-slate-600 hover:text-eureka-700 bg-white/90 hover:bg-white px-3 py-1 rounded-xl border border-slate-200 shadow-2xs transition flex items-center space-x-1"
        >
          <History className="w-3.5 h-3.5 text-slate-400" />
          <span>주차별 점수 이력</span>
        </button>
      </div>

      {/* 메인 점수 영역: [이번 주 점수 (대형)] + [상태등] + [지난 주 점수 카드 (서브)] */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center pt-0.5">
        {/* 이번 주 점수 (가장 크고 또렷한 정자체 표시) */}
        <div className="md:col-span-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/70 backdrop-blur-2xs p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-extrabold text-slate-500">이번 주 나의 탐구 점수</span>
              {isOverridden && (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                  선생님 조정 반영
                </span>
              )}
            </div>
            <div className="flex items-baseline mt-1">
              <span className="text-5xl sm:text-6xl font-black font-sans tracking-tight text-slate-900 leading-none">
                {score}
              </span>
              <span className="text-xl sm:text-2xl font-black text-slate-700 ml-1.5">점</span>
            </div>
          </div>

          {/* 한 줄에 함께 배치되는 상태 표시등 */}
          <div className="shrink-0 self-start sm:self-center">
            {renderStatusLight()}
          </div>
        </div>

        {/* 지난 주 점수 (서브 카드 & 주간 변화량) */}
        <div className="md:col-span-4 bg-white/70 backdrop-blur-2xs p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex sm:flex-col justify-between items-center sm:items-start">
          <div className="w-full flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">
              지난 주 점수 ({lastWeek.weekInfo.label})
            </span>
            {trend === 'up' ? (
              <span className="inline-flex items-center text-[10px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-md">
                <TrendingUp className="w-3 h-3 mr-0.5" />+{diff}점
              </span>
            ) : trend === 'down' ? (
              <span className="inline-flex items-center text-[10px] font-black text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded-md">
                <TrendingDown className="w-3 h-3 mr-0.5" />{diff}점
              </span>
            ) : (
              <span className="inline-flex items-center text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-md">
                <Minus className="w-3 h-3 mr-0.5" />변동 없음
              </span>
            )}
          </div>

          <div className="mt-1 flex items-baseline">
            <span className="text-2xl sm:text-3xl font-black text-slate-800 leading-none">
              {lastWeek.score}
            </span>
            <span className="text-xs font-bold text-slate-500 ml-1">점</span>
            {lastWeek.isOverridden && (
              <span className="ml-1.5 text-[9px] text-indigo-600 font-bold">
                (조정)
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5 hidden sm:block">
            {lastWeek.questionCount > 0
              ? `질문 ${lastWeek.questionCount}건 ${lastWeek.isApproved ? '· 승인' : ''}`
              : '미참여 주간'}
          </p>
        </div>
      </div>

      {/* 점수 유도 및 상태 안내 한 줄 메시지 */}
      <div className="p-3 bg-white/85 backdrop-blur-2xs rounded-2xl border border-slate-200/90 text-xs font-semibold text-slate-700 flex items-center space-x-2.5 shadow-2xs">
        <div className="shrink-0">
          {score === 100 ? (
            <Trophy className="w-4 h-4 text-amber-500 animate-bounce" />
          ) : score >= 90 ? (
            <Zap className="w-4 h-4 text-blue-500" />
          ) : score >= 80 ? (
            <Sparkles className="w-4 h-4 text-amber-500" />
          ) : lightType === 'pending' ? (
            <Clock className="w-4 h-4 text-amber-500" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" />
          )}
        </div>
        <p className="leading-snug flex-1">{message}</p>
      </div>

      {/* 점수 산정 단계 칩 (시각적 진행 상태 안내) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5 text-[10px] text-center font-bold">
        <div className={`p-2 rounded-xl border transition ${isApproved || (rejectedCount && rejectedCount > 0) ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : questionCount > 0 ? 'bg-amber-50 text-amber-900 border-amber-300' : 'bg-slate-100/80 text-slate-400 border-slate-200'}`}>
          <div>1. 질문 등록 & 검토</div>
          <div className="text-[9px] font-normal mt-0.5">
            {isApproved
              ? `승인 완료 (${score}점)`
              : rejectedCount > 0
              ? `반려 피드백 ${rejectedCount}건 (${score}점)`
              : questionCount > 0
              ? `등록 ${questionCount}건 (검토 대기 0점)`
              : '0점 (미등록)'}
          </div>
        </div>

        <div className={`p-2 rounded-xl border transition ${isApproved ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-slate-100/80 text-slate-400 border-slate-200'}`}>
          <div>2. 교사 승인</div>
          <div className="text-[9px] font-normal mt-0.5">
            {isApproved ? '90점 시작' : '대기/반려 (최대 89점)'}
          </div>
        </div>

        <div className={`p-2 rounded-xl border transition ${score >= 93 ? 'bg-indigo-50 text-indigo-800 border-indigo-200' : 'bg-slate-100/80 text-slate-400 border-slate-200'}`}>
          <div>3. 단계 진행</div>
          <div className="text-[9px] font-normal mt-0.5">
            {score >= 93 ? `+${Math.min(9, score - 90)}점 (최대 99점)` : '단계별 +3점'}
          </div>
        </div>

        <div className={`p-2 rounded-xl border transition ${isReviewed ? 'bg-purple-100 text-purple-900 border-purple-300 ring-1 ring-purple-400/50' : 'bg-slate-100/80 text-slate-400 border-slate-200'}`}>
          <div>4. 도장 승인</div>
          <div className="text-[9px] font-normal mt-0.5">
            {isReviewed ? '💮 100점 만점!' : '+1점 (최종 100점)'}
          </div>
        </div>
      </div>

      {/* 주차별 점수 이력 팝업 모달 */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-5 max-w-md w-full shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-eureka-50 text-eureka-600 rounded-xl">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm">주차별 탐구 점수 이력</h3>
                  <p className="text-[11px] text-slate-500">{currentUser.gradeClass} {currentUser.studentName} 학생</p>
                </div>
              </div>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 주차별 점수 리스트 */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {weeklyHistory.map((item, idx) => {
                const isCurrent = idx === 0;
                const isPastWeek = idx === 1;
                return (
                  <div
                    key={item.weekKey}
                    className={`p-3 rounded-2xl border transition flex items-center justify-between ${
                      isCurrent
                        ? 'bg-eureka-50/80 border-eureka-300 ring-1 ring-eureka-400'
                        : isPastWeek
                        ? 'bg-slate-50/90 border-slate-300'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-black text-slate-800">
                          {item.weekInfo.label}
                        </span>
                        {isCurrent ? (
                          <span className="bg-eureka-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-md">
                            이번 주
                          </span>
                        ) : isPastWeek ? (
                          <span className="bg-slate-700 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-md">
                            지난 주
                          </span>
                        ) : null}
                        {item.isOverridden && (
                          <span className="bg-indigo-100 text-indigo-700 text-[9px] font-bold px-1.5 py-0.2 rounded-md">
                            선생님 조정
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400">{item.weekInfo.dateRange}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        질문 {item.questionCount}건 {item.isApproved ? '· 승인 완료' : item.questionCount > 0 ? '· 미승인/반려' : ''}
                        {item.isReviewed && ' · 💮 도장완료'}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-xl font-black text-slate-900">
                        {item.score}
                        <span className="text-xs font-bold text-slate-600 ml-0.5">점</span>
                      </div>
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                        item.score === 100
                          ? 'bg-purple-100 text-purple-800'
                          : item.score >= 90
                          ? 'bg-blue-100 text-blue-800'
                          : item.score >= 80
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        {item.score === 100 ? '만점 달성' : item.score >= 90 ? '도전 단계' : item.score >= 80 ? '격려 단계' : '미참여'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setIsHistoryOpen(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
