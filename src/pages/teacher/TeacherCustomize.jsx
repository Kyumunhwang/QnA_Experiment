import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import TeacherNav from '../../components/teacher/TeacherNav';
import { Palette, Sparkles, Save, Check, RefreshCw } from 'lucide-react';

export default function TeacherCustomize() {
  const {
    appConfig,
    updateConfigAction,
    THEME_OPTIONS,
  } = useApp();

  const [title, setTitle] = useState(appConfig.banner_title || '');
  const [desc, setDesc] = useState(appConfig.banner_desc || '');
  const [selectedTheme, setSelectedTheme] = useState(appConfig.theme_color || 'emerald');
  const [isSaving, setIsSaving] = useState(false);

  const currentThemeObj = THEME_OPTIONS.find((t) => t.id === selectedTheme) || THEME_OPTIONS[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    await updateConfigAction({
      banner_title: title.trim(),
      banner_desc: desc.trim(),
      theme_color: selectedTheme,
    });
    setIsSaving(false);
  };

  const handleResetDefaults = () => {
    setTitle('일상의 사소한 호기심이 위대한 과학 발견이 됩니다!');
    setDesc('호기심 질문을 등록하면 선생님이 검토 후 탐구 과제로 승인합니다. 실패는 더 정확한 답을 찾아가는 최고의 디딤돌입니다!');
    setSelectedTheme('emerald');
  };

  return (
    <div className="space-y-4 pb-16 animate-fadeIn">
      <TeacherNav />

      {/* 헤더 안내 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center space-x-1.5">
            <Palette className="w-5 h-5 text-indigo-600" />
            <span>탐구 홈 메시지 & 테마 색상 설정</span>
          </h2>
          <p className="text-xs text-slate-500">
            학생들이 첫 화면에서 마주하는 공지 메시지와 앱 분위기(테마 색상)를 원하는 대로 변경합니다.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 1. 홈 상단 배너 실시간 미리보기 */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 block">
            학생 홈 화면 상단 배너 실시간 미리보기
          </label>
          <div
            className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${currentThemeObj.bgGradient} text-white p-5 shadow-lg transition-all duration-300`}
          >
            <div className="relative z-10 space-y-2">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-sm">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                <span>실패에서 배우는 과학 탐구</span>
              </div>
              <h3 className="text-base sm:text-lg font-extrabold leading-snug">
                {title || '배너 제목을 입력해 주세요'}
              </h3>
              <p className="text-xs text-white/80 leading-relaxed">
                {desc || '배너 안내 문구를 입력해 주세요'}
              </p>
            </div>
          </div>
        </div>

        {/* 2. 테마 색상 선택 */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-2.5">
          <label className="text-xs font-bold text-slate-800 block">
            앱 테마 색상 선택
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {THEME_OPTIONS.map((theme) => {
              const isSelected = selectedTheme === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setSelectedTheme(theme.id)}
                  className={`p-3 rounded-2xl border text-center transition flex flex-col items-center space-y-2 ${
                    isSelected
                      ? 'border-slate-800 bg-slate-50 ring-2 ring-slate-800 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full bg-gradient-to-tr ${theme.bgGradient} shadow-sm flex items-center justify-center text-white`}
                  >
                    {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                  </div>
                  <span className="text-xs font-bold text-slate-800">{theme.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. 공지 메시지 텍스트 수정 */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-800 block">
              홈 배너 대제목 (주요 공지 및 탐구 슬로건)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 이번 주 과학 탐구 주제: 일상의 상태 변화!"
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-800 block">
              홈 배너 부제목 (탐구 지침 및 격려 안내문구)
            </label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={3}
              placeholder="예: 호기심 질문을 등록하면 선생님이 검토 후 승인합니다. 실패는 더 나은 가설을 찾는 나침반입니다!"
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium leading-relaxed resize-none"
              required
            />
          </div>
        </div>

        {/* 저장 및 기본값 복원 버튼 */}
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3.5 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl border border-slate-200 flex items-center space-x-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>기본값으로 복원</span>
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition flex items-center space-x-1.5 active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? '저장 중...' : '설정 저장 및 홈에 적용'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
