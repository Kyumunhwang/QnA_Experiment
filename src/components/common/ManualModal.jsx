import React from 'react';
import { BookOpen, X, ExternalLink, ArrowLeft, Download } from 'lucide-react';

export default function ManualModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-4xl w-full h-[92vh] sm:h-[88vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 animate-slideUp">
        {/* 상단 헤더 */}
        <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-eureka-500 rounded-xl text-white">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base tracking-tight flex items-center space-x-1.5">
                <span>Science Eureka Manual</span>
                <span className="text-[10px] font-normal text-slate-400 hidden sm:inline">(학생 사용 설명서)</span>
              </h3>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* 새 창에서 열기 / 다운로드 */}
            <a
              href="/manual.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center space-x-1 border border-slate-700"
              title="새 탭에서 전체화면으로 보기"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">새 탭 전체화면</span>
            </a>

            {/* 닫기 버튼 */}
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-eureka-600 hover:bg-eureka-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 shadow-sm"
              title="첫 화면으로 돌아가기"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>첫화면으로</span>
            </button>
          </div>
        </div>

        {/* PDF 뷰어 영역 (iframe) */}
        <div className="flex-1 w-full bg-slate-100 p-2 sm:p-3 relative overflow-hidden flex flex-col">
          <object
            data="/manual.pdf#toolbar=1&navpanes=0&scrollbar=1"
            type="application/pdf"
            className="w-full flex-1 rounded-2xl border border-slate-200 bg-white shadow-xs"
          >
            {/* PDF 직접 지원하지 않는 모바일 브라우저를 위한 Fallback 안내 */}
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-white rounded-2xl space-y-4">
              <div className="p-4 bg-eureka-50 text-eureka-600 rounded-3xl">
                <BookOpen className="w-12 h-12" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-black text-slate-800">Science Eureka Manual 안내서</h4>
                <p className="text-xs text-slate-500 max-w-sm">
                  모바일 브라우저 환경에 따라 인라인 PDF 미리보기가 제한될 수 있습니다. 아래 버튼을 눌러 매뉴얼 문서를 바로 확인하세요.
                </p>
              </div>
              <a
                href="/manual.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 bg-eureka-600 text-white rounded-2xl text-xs font-extrabold shadow-md hover:bg-eureka-700 transition flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Manual PDF 열기 및 다운로드</span>
              </a>
            </div>
          </object>
        </div>

        {/* 하단 바 (학생 로그인 첫화면으로 복귀 액션) */}
        <div className="px-4 py-2.5 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <p className="text-xs text-slate-500 hidden sm:block">
            💡 매뉴얼을 다 보셨으면 아래 버튼을 눌러 첫 화면으로 돌아갈 수 있습니다.
          </p>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl transition shadow-md flex items-center justify-center space-x-1.5 ml-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>학생로그인 첫화면으로 돌아가기</span>
          </button>
        </div>
      </div>
    </div>
  );
}
