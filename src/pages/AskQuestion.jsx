import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { addQuestion } from '../services/api';
import {
  MessageSquare,
  Sparkles,
  Image,
  Link2,
  Eye,
  Lightbulb,
  HelpCircle,
  Send,
  AlertCircle,
  Tag,
  ShieldCheck
} from 'lucide-react';

export default function AskQuestion() {
  const navigate = useNavigate();
  const {
    currentUser,
    currentTeacher,
    setIsLoginModalOpen,
    showToast,
    refreshQuestions,
    SCIENCE_CATEGORIES
  } = useApp();

  const [uiType, setUiType] = useState('A'); // 'A' | 'B'
  const [selectedCategory, setSelectedCategory] = useState(SCIENCE_CATEGORIES[0]?.label || '일상/융합 💡');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Type A State
  const [simpleText, setSimpleText] = useState('');

  // Type B State (See-Think-Wonder)
  const [stwSee, setStwSee] = useState('');
  const [stwThink, setStwThink] = useState('');
  const [stwWonder, setStwWonder] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');

  // 미로그인 시 로그인 유도 (교사 접속 시에는 유도하지 않음)
  useEffect(() => {
    if (!currentUser && !currentTeacher) {
      showToast('질문을 작성하려면 먼저 학생 로그인이 필요합니다.', 'info');
      setIsLoginModalOpen(true);
    }
  }, [currentUser, currentTeacher]);

  // 이미지 업로드 핸들러
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setImagePreview(dataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentUser) {
      showToast('로그인이 필요합니다.', 'error');
      setIsLoginModalOpen(true);
      return;
    }

    let contentData = null;

    if (uiType === 'A') {
      if (!simpleText.trim()) {
        showToast('질문 내용을 입력해 주세요.', 'error');
        return;
      }
      contentData = simpleText.trim();
    } else {
      if (!stwWonder.trim()) {
        showToast('가장 궁금한 점(Wonder)을 꼭 적어주세요!', 'error');
        return;
      }
      contentData = {
        see: stwSee.trim(),
        think: stwThink.trim(),
        wonder: stwWonder.trim(),
        imageUrl: imagePreview,
        linkUrl: linkUrl.trim(),
      };
    }

    setIsSubmitting(true);
    try {
      await addQuestion({
        grade_class: currentUser.gradeClass,
        student_name: currentUser.studentName,
        category: selectedCategory,
        ui_type: uiType,
        content: contentData,
      });

      showToast('호기심 질문이 등록되었습니다! 선생님의 승인을 기다려주세요.', 'success');
      await refreshQuestions();
      navigate('/');
    } catch (err) {
      console.error(err);
      showToast('질문 등록 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pb-8 animate-fadeIn">
      {/* 타이틀 */}
      <div className="space-y-1">
        <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center space-x-2">
          <span>새 호기심 질문 던지기</span>
          <Sparkles className="w-5 h-5 text-eureka-500" />
        </h2>
        <p className="text-xs text-slate-500">
          사소한 궁금증도 훌륭한 연구가 됩니다. 편한 입력 방식을 선택해 보세요!
        </p>
      </div>

      {/* 작성자 정보 배너 */}
      {currentUser ? (
        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-500 font-semibold">작성 학생:</span>
            <span className="bg-eureka-50 text-eureka-700 font-extrabold px-2.5 py-1 rounded-lg border border-eureka-200">
              {currentUser.gradeClass} {currentUser.studentName}
            </span>
          </div>
          <span className="text-[10px] text-slate-400">등록 후 선생님 검토 진행</span>
        </div>
      ) : currentTeacher ? (
        <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-amber-800">
            <ShieldCheck className="w-4 h-4 shrink-0 text-amber-600" />
            <span>현재 교사 계정({currentTeacher.teacher_name} 선생님)으로 접속 중입니다. 질문 등록은 학생 로그인 후 가능합니다.</span>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-amber-800">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>질문을 등록하려면 학생 로그인이 필요합니다.</span>
          </div>
          <button
            type="button"
            onClick={() => setIsLoginModalOpen(true)}
            className="px-2.5 py-1 bg-amber-600 text-white rounded-lg text-xs font-bold shrink-0"
          >
            로그인하기
          </button>
        </div>
      )}

      {/* 과학 영역 카테고리 선택 */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm space-y-2">
        <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700">
          <Tag className="w-3.5 h-3.5 text-eureka-600" />
          <span>과학 탐구 분야 선택</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SCIENCE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.label)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedCategory === cat.label
                  ? 'bg-slate-900 text-white shadow-sm scale-102'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 모드 선택 탭 (Type A vs Type B) */}
      <div className="grid grid-cols-2 gap-2 bg-slate-200/80 p-1.5 rounded-2xl">
        <button
          type="button"
          onClick={() => setUiType('A')}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
            uiType === 'A'
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-blue-500" />
          <span>Type A. 한 줄 질문</span>
        </button>

        <button
          type="button"
          onClick={() => setUiType('B')}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
            uiType === 'B'
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Sparkles className="w-4 h-4 text-purple-500" />
          <span>Type B. 관찰형 (STW)</span>
        </button>
      </div>

      {/* 폼 */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type A */}
        {uiType === 'A' && (
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800 flex items-center space-x-1">
                <MessageSquare className="w-4 h-4 text-blue-500" />
                <span>떠오른 과학적 질문을 자유롭게 적어보세요</span>
              </label>
              <p className="text-[11px] text-slate-400">
                예: "전자레인지는 왜 수분이 있는 음식만 따뜻해질까?", "비누 거품은 왜 항상 흰색일까?"
              </p>
            </div>

            <textarea
              value={simpleText}
              onChange={(e) => setSimpleText(e.target.value)}
              rows={4}
              placeholder="궁금한 점을 여기에 자세히 적어주세요..."
              className="w-full p-3.5 text-xs border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-eureka-500 resize-none"
              required
            />
          </div>
        )}

        {/* Type B */}
        {uiType === 'B' && (
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="border-b pb-2">
              <span className="text-xs font-black text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full">
                See - Think - Wonder 사고 루틴
              </span>
              <p className="text-[11px] text-slate-500 mt-1">
                현상을 관찰하고 생각을 정리하여 깊이 있는 질문을 만들어냅니다.
              </p>
            </div>

            {/* 1. See */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                <Eye className="w-4 h-4 text-indigo-500" />
                <span>1. See (무엇을 보았는가?)</span>
              </label>
              <textarea
                value={stwSee}
                onChange={(e) => setStwSee(e.target.value)}
                rows={2}
                placeholder="관찰한 현상이나 사실을 있는 그대로 묘사해 보세요."
                className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              />
            </div>

            {/* 2. Think */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span>2. Think (어떤 생각이 들었는가?)</span>
              </label>
              <textarea
                value={stwThink}
                onChange={(e) => setStwThink(e.target.value)}
                rows={2}
                placeholder="그 현상을 보고 머릿속에 떠오른 내 생각이나 추측은 무엇인가요?"
                className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
              />
            </div>

            {/* 3. Wonder */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                <HelpCircle className="w-4 h-4 text-eureka-600" />
                <span>3. Wonder (무엇이 가장 궁금한가? ★)</span>
              </label>
              <textarea
                value={stwWonder}
                onChange={(e) => setStwWonder(e.target.value)}
                rows={2}
                placeholder="과학적으로 더 깊이 파고들어 실험해보고 싶은 핵심 질문을 적어주세요."
                className="w-full p-3 text-xs border-2 border-eureka-300 bg-eureka-50/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-eureka-500 resize-none"
                required
              />
            </div>

            {/* 사진 & 링크 */}
            <div className="pt-2 border-t space-y-3">
              <span className="text-xs font-bold text-slate-700 block">
                자료 첨부 (사진 또는 링크)
              </span>

              <div>
                <label className="flex items-center justify-center space-x-2 border-2 border-dashed border-slate-200 hover:border-eureka-400 p-3 rounded-2xl cursor-pointer transition bg-slate-50">
                  <Image className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-medium text-slate-600">
                    {imagePreview ? '사진 변경하기' : '관찰 사진 첨부하기'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
                {imagePreview && (
                  <div className="mt-2 relative">
                    <img
                      src={imagePreview}
                      alt="미리보기"
                      className="w-full max-h-48 object-cover rounded-xl border border-slate-200"
                    />
                    <button
                      type="button"
                      onClick={() => setImagePreview('')}
                      className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1 text-[10px]"
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Link2 className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="관련 유튜브 영상이나 웹사이트 링크 (선택)"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-eureka-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* 제출 버튼 */}
        <button
          type="submit"
          disabled={isSubmitting || !currentUser}
          className="w-full py-3.5 px-4 bg-gradient-to-r from-eureka-600 to-teal-600 hover:from-eureka-700 hover:to-teal-700 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-eureka-200 transition active:scale-98 flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
              <span>질문 등록 중...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>질문 제출하기 (선생님 승인 대기)</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
