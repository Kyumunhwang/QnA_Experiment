import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { KeyRound, X, Check, AlertCircle } from 'lucide-react';

export default function ChangePasswordModal() {
  const {
    currentUser,
    isChangePwModalOpen,
    setIsChangePwModalOpen,
    updatePassword,
  } = useApp();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isChangePwModalOpen || !currentUser) return null;

  const handlePwInput = (val, setter) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 4);
    setter(cleaned);
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length !== 4) {
      setErrorMsg('비밀번호는 반드시 4자리 숫자여야 합니다.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    const result = await updatePassword(newPassword);
    setIsSubmitting(false);

    if (result.success) {
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setErrorMsg(result.error || '비밀번호 변경 실패');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-xs w-full p-6 shadow-2xl space-y-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">비밀번호 변경</h3>
              <p className="text-[11px] text-slate-400">
                {currentUser.gradeClass} {currentUser.studentName} 학생
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsChangePwModalOpen(false)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              새 비밀번호 (4자리 숫자)
            </label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={newPassword}
              onChange={(e) => handlePwInput(e.target.value, setNewPassword)}
              placeholder="••••"
              className="w-full px-3 py-2 text-center tracking-widest text-base font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
              autoFocus
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              새 비밀번호 확인
            </label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={confirmPassword}
              onChange={(e) => handlePwInput(e.target.value, setConfirmPassword)}
              placeholder="••••"
              className="w-full px-3 py-2 text-center tracking-widest text-base font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {errorMsg && (
            <div className="p-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-[11px] flex items-center space-x-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="pt-2 flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsChangePwModalOpen(false)}
              className="flex-1 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting || newPassword.length !== 4 || confirmPassword.length !== 4}
              className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-md transition disabled:opacity-50 flex items-center justify-center space-x-1"
            >
              {isSubmitting ? (
                <div className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>변경 완료</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
