import React, { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { getPortfolios } from '../services/api';
import confetti from 'canvas-confetti';
import { Download, ArrowLeft, Edit3, ExternalLink } from 'lucide-react';

/**
 * 텍스트 내의 URL(http://, https://)을 감지하여 클릭 가능한 링크 태그로 변환하는 헬퍼
 */
function renderTextWithLinks(text) {
  if (!text) return '기록된 내용이 없습니다.';
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, idx) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={idx}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline font-semibold hover:text-blue-800 break-all inline-flex items-center gap-0.5"
        >
          <span>{part}</span>
          <ExternalLink className="w-3 h-3 inline-block shrink-0" />
        </a>
      );
    }
    return part;
  });
}

export default function ReportView() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const questionId = searchParams.get('questionId');
  const navigate = useNavigate();

  const { questions, currentUser, showToast } = useApp();
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // 실험 주제명 (파일명 및 보고서 대제목에 반영)
  const [experimentTitle, setExperimentTitle] = useState('');

  const reportRef = useRef(null);

  const targetQuestion = questions.find(
    (q) => String(q.id) === String(questionId) || String(q.id) === String(portfolio?.question_id)
  );

  const getQuestionContent = () => {
    if (!targetQuestion) return '과학 탐구 실험';
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

  useEffect(() => {
    async function loadPortfolio() {
      setLoading(true);
      try {
        const list = await getPortfolios();
        const found = list.find((p) => String(p.id) === String(id));
        if (found) {
          setPortfolio(found);
        } else if (list.length > 0) {
          setPortfolio(list[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadPortfolio();
  }, [id]);

  // 질문 정보가 확인되면 기본 실험 주제명 자동 추출
  useEffect(() => {
    if (targetQuestion && !experimentTitle) {
      const fullText = getQuestionContent();
      const sanitized = fullText
        .replace(/[^\w\sㄱ-ㅎ가-힣]/g, '')
        .trim()
        .slice(0, 18);
      setExperimentTitle(sanitized || '과학 탐구 실험');
    }
  }, [targetQuestion]);

  useEffect(() => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
    });
  }, []);

  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    setIsGeneratingPdf(true);
    showToast('PDF 보고서를 생성하고 있습니다...', 'info');

    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = reportRef.current;
      const studentName = portfolio?.student_name || currentUser?.studentName || '학생';
      const gradeClass = portfolio?.grade_class || currentUser?.gradeClass || '';
      
      const rawDate = portfolio?.last_updated || new Date().toISOString();
      const finalDate = rawDate.substring(0, 10);

      const safeExpTitle = (experimentTitle || '과학실험')
        .replace(/[/\\?%*:|"<>]/g, '')
        .trim();
      
      const filename = `${safeExpTitle}_탐구보고서_${gradeClass ? gradeClass + '_' : ''}${studentName}_${finalDate}.pdf`;

      const opt = {
        margin: [10, 10, 10, 10],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      };

      await html2pdf().set(opt).from(element).save();
      showToast(`PDF가 다운로드되었습니다!\n(${filename})`, 'success');
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err) {
      console.error('PDF 변환 오류:', err);
      showToast('PDF 생성 중 문제가 발생했습니다.', 'error');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400">
        <div className="animate-spin w-8 h-8 border-3 border-eureka-500 border-t-transparent rounded-full mx-auto mb-3"></div>
        보고서를 불러오는 중입니다...
      </div>
    );
  }

  const studentName = portfolio?.student_name || currentUser?.studentName || '학생';
  const gradeClass = portfolio?.grade_class || currentUser?.gradeClass || '';
  const finalDate = (portfolio?.last_updated || new Date().toISOString()).substring(0, 10);
  const safeExpTitle = (experimentTitle || '과학실험').replace(/[/\\?%*:|"<>]/g, '').trim();
  const previewFilename = `${safeExpTitle}_탐구보고서_${gradeClass ? gradeClass + '_' : ''}${studentName}_${finalDate}.pdf`;

  return (
    <div className="space-y-4 pb-16 animate-fadeIn">
      {/* 상단 컨트롤 바 */}
      <div className="no-print space-y-2.5">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-1 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>뒤로가기</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-eureka-600 to-teal-600 hover:from-eureka-700 hover:to-teal-700 text-white rounded-xl text-xs font-extrabold shadow-md transition disabled:opacity-50 active:scale-95"
          >
            {isGeneratingPdf ? (
              <>
                <div className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full"></div>
                <span>PDF 생성 중...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>PDF 보고서 다운로드</span>
              </>
            )}
          </button>
        </div>

        {/* 실험 주제명 수정 및 다운로드 파일명 미리보기 */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm space-y-1.5 text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-slate-700 flex items-center space-x-1 shrink-0">
              <Edit3 className="w-3.5 h-3.5 text-eureka-600" />
              <span>실험 주제명 지정:</span>
            </span>
            <input
              type="text"
              value={experimentTitle}
              onChange={(e) => setExperimentTitle(e.target.value)}
              placeholder="예: 바나나 갈변 실험"
              className="flex-1 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-1 focus:ring-eureka-500"
            />
          </div>
          <div className="text-[11px] text-slate-500 flex items-center space-x-1 bg-slate-50 px-2.5 py-1.5 rounded-xl">
            <span className="font-semibold text-slate-400 shrink-0">저장 파일명:</span>
            <span className="font-bold text-eureka-700 truncate">{previewFilename}</span>
          </div>
        </div>
      </div>

      {/* A4 규격 공식 보고서 템플릿 (인쇄/PDF 다운로드 영역) */}
      <div
        ref={reportRef}
        className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl space-y-5 text-slate-800"
      >
        {/* 보고서 공식 헤더: 상단 가림 요소 제거 및 실험 주제명 대제목 적용 */}
        <div className="border-b-2 border-slate-900 pb-4 text-center space-y-2 pt-1">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
            {experimentTitle ? `"${experimentTitle}" 탐구 결과 보고서` : '과학 탐구 결과 보고서'}
          </h1>
          <p className="text-xs text-slate-500">
            실패를 두려워하지 않고 배움으로 도약한 과학적 탐구의 여정
          </p>

          {/* 인적 사항 표 */}
          <div className="grid grid-cols-3 gap-2 max-w-md mx-auto pt-3 text-xs">
            <div className="bg-slate-50 p-2 rounded-xl flex items-center justify-between border border-slate-100">
              <span className="text-slate-400 font-semibold">학급</span>
              <span className="font-extrabold text-slate-800">
                {gradeClass || '미지정'}
              </span>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl flex items-center justify-between border border-slate-100">
              <span className="text-slate-400 font-semibold">탐구자</span>
              <span className="font-extrabold text-slate-800">
                {studentName}
              </span>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl flex items-center justify-between border border-slate-100">
              <span className="text-slate-400 font-semibold">작성일자</span>
              <span className="font-extrabold text-slate-800">
                {finalDate}
              </span>
            </div>
          </div>
        </div>

        {/* 1. 탐구 질문 & 과학 영역 */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-xs font-black text-slate-900">
              <span className="w-2 h-2 rounded-full bg-slate-900"></span>
              <span>[탐구 질문] 호기심의 출발점</span>
            </div>
            {targetQuestion?.category && (
              <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 rounded-md text-slate-600">
                {targetQuestion.category}
              </span>
            )}
          </div>
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs font-bold leading-relaxed text-slate-800">
            "{getQuestionContent()}"
          </div>
        </div>

        {/* 2. 초기 가설 및 접근 방법 */}
        <div className="space-y-1.5">
          <div className="flex items-center space-x-1.5 text-xs font-black text-blue-700">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            <span>1단계. 초기 가설 및 접근 방법 (내 생각과 사전 조사)</span>
          </div>
          <div className="p-3.5 bg-blue-50/40 rounded-2xl border border-blue-100 text-xs leading-relaxed whitespace-pre-wrap text-slate-700">
            {renderTextWithLinks(portfolio?.step1_research)}
          </div>
        </div>

        {/* 3. 실행 및 실험 과정 (링크 클릭 시 바로 해당 사이트로 이동) */}
        <div className="space-y-1.5">
          <div className="flex items-center space-x-1.5 text-xs font-black text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span>2단계. 실행 및 실험 과정</span>
          </div>
          <div className="p-3.5 bg-emerald-50/40 rounded-2xl border border-emerald-100 text-xs leading-relaxed whitespace-pre-wrap text-slate-700">
            {renderTextWithLinks(portfolio?.step2_experiment)}
          </div>
        </div>

        {/* 4. ★ 핵심: 실패 분석 및 가설 수정 */}
        <div className="space-y-2 p-4 bg-gradient-to-br from-rose-50/60 to-amber-50/60 rounded-2xl border-2 border-rose-200">
          <div className="flex items-center space-x-2 text-xs font-black text-rose-800">
            <span className="px-2 py-0.5 bg-rose-600 text-white rounded-md text-[10px]">
              핵심 성장
            </span>
            <span>3단계. 실패 분석 및 새로운 가설 (배움의 전환점)</span>
          </div>

          <div className="space-y-2 text-xs pt-1">
            <div className="bg-white p-3 rounded-xl border border-rose-100 space-y-1">
              <span className="font-extrabold text-rose-700 block">
                Q1. 이번 실패 또는 예상 밖 결과에서 배운 점은 무엇인가?
              </span>
              <div className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                {renderTextWithLinks(portfolio?.step3_failure_lesson)}
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-amber-100 space-y-1">
              <span className="font-extrabold text-amber-700 block">
                Q2. 이를 바탕으로 수정한 다음 가설 또는 계획은 무엇인가?
              </span>
              <div className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                {renderTextWithLinks(portfolio?.step3_revised_hypothesis)}
              </div>
            </div>
          </div>
        </div>

        {/* 5. 최종 결론 */}
        <div className="space-y-1.5">
          <div className="flex items-center space-x-1.5 text-xs font-black text-amber-800">
            <span className="w-2 h-2 rounded-full bg-amber-600"></span>
            <span>4단계. 최종 결론 및 탐구 소감</span>
          </div>
          <div className="p-3.5 bg-amber-50/40 rounded-2xl border border-amber-100 text-xs leading-relaxed whitespace-pre-wrap text-slate-700">
            {renderTextWithLinks(portfolio?.step4_conclusion)}
          </div>
        </div>

        {/* 6. 선생님 총평 및 수행평가 의견 (작성된 경우 표시) */}
        {portfolio?.teacher_comment && (
          <div className="space-y-1.5 p-3.5 bg-purple-50/60 rounded-2xl border border-purple-200 text-xs">
            <span className="font-extrabold text-purple-900 block">
              [지도 교사 총평 및 피드백]
            </span>
            <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">
              {renderTextWithLinks(portfolio.teacher_comment)}
            </p>
          </div>
        )}

        {/* 하단 확인 서명란 (선생님 확인 도장 연동) */}
        <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-slate-500">
          <span className="text-[11px] text-slate-400 font-normal">
            * 본 보고서는 학생이 직접 수행한 PBL 사고실험의 기록입니다.
          </span>

          <div className="flex items-center space-x-2">
            <span>담당 과학 교사 확인:</span>
            {portfolio?.is_reviewed ? (
              <div className="flex items-center space-x-1.5">
                <span className="font-black text-slate-800 underline decoration-slate-300 underline-offset-4 text-xs">
                  {portfolio?.reviewed_by || '황규문'}
                </span>
                <span className="w-10 h-10 rounded-full border-2 border-rose-600 text-rose-600 flex items-center justify-center text-[10px] font-black tracking-tighter transform -rotate-12 bg-rose-50/50 shadow-xs">
                  확인(인)
                </span>
              </div>
            ) : (
              <span className="text-slate-400 font-normal">황규문 ( 인 / 서명 )</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
