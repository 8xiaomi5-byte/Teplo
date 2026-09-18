import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { createVerificationCheckoutSession, executeMockVerification } from '../../lib/verificationService';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: 'profile_limit' | 'message_limit' | 'manual';
  onVerifiedSuccess?: () => void;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  isOpen,
  onClose,
  reason = 'profile_limit',
  onVerifiedSuccess,
}) => {
  const { user, refreshVerificationStatus } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [testModeSuccess, setTestModeSuccess] = useState(false);

  if (!isOpen) return null;

  const handleStartCheckout = async () => {
    if (!user) {
      setErrorMessage('Пожалуйста, войдите в свой аккаунт для верификации.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      // Create Stripe Checkout Session
      const session = await createVerificationCheckoutSession(user);
      if (session.url) {
        window.location.href = session.url;
      } else {
        throw new Error('Не получена ссылка для перехода на Stripe');
      }
    } catch (err: any) {
      console.warn('Stripe checkout session error:', err);
      // If Stripe keys are not yet configured in env (development testing scenario)
      if (
        err.message?.includes('STRIPE_SECRET_KEY') ||
        err.message?.includes('STRIPE_NOT_CONFIGURED') ||
        err.message?.includes('503')
      ) {
        setErrorMessage('Stripe API ключ ещё не настроен на сервере. Вы можете выполнить тестовое подтверждение:');
      } else {
        setErrorMessage(err.message || 'Произошла ошибка при переходе к оплате. Попробуйте еще раз.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTestVerify = async () => {
    if (!user) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const ok = await executeMockVerification(user);
      if (ok) {
        setTestModeSuccess(true);
        await refreshVerificationStatus();
        setTimeout(() => {
          if (onVerifiedSuccess) onVerifiedSuccess();
          onClose();
        }, 1200);
      } else {
        setErrorMessage('Тестовое подтверждение не удалось');
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#F5ECE6] relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#FFF0EF] text-[#584140] hover:text-[#231918] flex items-center justify-center cursor-pointer transition-colors disabled:opacity-50"
          title="Закрыть"
        >
          ✕
        </button>

        {/* Top Header Icon */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-[#FFF0EF] text-[#AE2F34] flex items-center justify-center mx-auto mb-3 shadow-inner">
            <span
              className="material-symbols-outlined text-3xl fill-icon"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              verified
            </span>
          </div>

          <h2 className="text-2xl font-bold text-[#231918]">
            Подтвердите ваш аккаунт
          </h2>

          <p className="text-sm text-[#584140] mt-1.5 leading-relaxed">
            {reason === 'profile_limit' && (
              <>
                Вы просмотрели свои <strong className="text-[#231918]">10 бесплатных анкет</strong>.
                Чтобы продолжить открывать новые знакомства и пользоваться всеми функциями сервиса, подтвердите аккаунт.
              </>
            )}
            {reason === 'message_limit' && (
              <>
                Для начала нового диалога с взаимной парой требуется подтверждение аккаунта.
              </>
            )}
            {reason === 'manual' && (
              <>
                Подтверждение аккаунта открывает неограниченный поиск анкет и статус надёжного пользователя.
              </>
            )}
          </p>
        </div>

        {/* Value Proposition Box */}
        <div className="bg-[#FFF8F7] border border-[#F2DFDE] rounded-2xl p-4.5 mb-6 space-y-3">
          <div className="flex items-start gap-3 text-xs text-[#231918]">
            <span className="material-symbols-outlined text-emerald-600 text-lg shrink-0">check_circle</span>
            <span><strong>Защита от спама и ботов:</strong> создаем безопасное сообщество людей с искренними намерениями.</span>
          </div>
          <div className="flex items-start gap-3 text-xs text-[#231918]">
            <span className="material-symbols-outlined text-emerald-600 text-lg shrink-0">check_circle</span>
            <span><strong>Разовый платеж:</strong> никакой подписки и регулярных списаний. Оплата производится один раз навсегда.</span>
          </div>
          <div className="flex items-start gap-3 text-xs text-[#231918]">
            <span className="material-symbols-outlined text-emerald-600 text-lg shrink-0">check_circle</span>
            <span><strong>Безлимитный просмотр:</strong> неограниченный доступ ко всем анкетам и общению.</span>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="bg-[#FFF0EF] border border-[#FFB3B0] text-[#A0401C] text-xs p-3.5 rounded-2xl mb-4 text-center leading-normal">
            <p className="font-semibold mb-1">{errorMessage}</p>
            {errorMessage.includes('Stripe API ключ') && (
              <button
                type="button"
                onClick={handleTestVerify}
                className="mt-2 px-3 py-1.5 rounded-full bg-[#AE2F34] text-white text-xs font-bold hover:bg-[#9D422C] cursor-pointer transition-colors"
              >
                Подтвердить в тестовом режиме (€1.50)
              </button>
            )}
          </div>
        )}

        {testModeSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-2xl mb-4 text-center font-bold">
            ✓ Аккаунт успешно подтвержден! Перезагрузка...
          </div>
        )}

        {/* Primary Action Button */}
        <button
          onClick={handleStartCheckout}
          disabled={loading || testModeSuccess}
          className="w-full py-3.5 px-6 rounded-full bg-[#AE2F34] hover:bg-[#9D422C] text-white text-sm font-bold shadow-md hover:shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>Подготовка оплаты...</span>
            </span>
          ) : (
            <>
              <span className="material-symbols-outlined text-lg">verified_user</span>
              <span>Подтвердить аккаунт — €1.50</span>
            </>
          )}
        </button>

        {/* Secondary Trust & Security Note */}
        <div className="mt-4 text-center">
          <p className="text-[11px] text-[#584140]/80 flex items-center justify-center gap-1.5">
            <span className="material-symbols-outlined text-xs text-[#584140]">lock</span>
            <span>Безопасная оплата через <strong>Stripe</strong>. Мы не храним данные ваших карт.</span>
          </p>
        </div>
      </div>
    </div>
  );
};
