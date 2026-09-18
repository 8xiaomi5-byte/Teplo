import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { signInWithGoogle, signInGuest, loginWithEmail, registerWithEmail, error, clearError } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();
    setLoading(true);

    try {
      if (isRegister) {
        if (!name.trim()) {
          setLocalError('Пожалуйста, укажите имя');
          setLoading(false);
          return;
        }
        await registerWithEmail(email, password, name.trim());
      } else {
        await loginWithEmail(email, password);
      }
      onClose();
    } catch (err: any) {
      setLocalError(err.message || 'Ошибка авторизации');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setLocalError(null);
    clearError();
    try {
      await signInWithGoogle();
      onClose();
    } catch (err: any) {
      // If user closed the popup, silently finish loading without showing error
      if (err.code === 'auth/popup-closed-by-user' || err.message?.includes('popup-closed-by-user')) {
        return;
      }
      setLocalError(err.message || 'Не удалось войти через Google');
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    setLoading(true);
    setLocalError(null);
    clearError();
    try {
      await signInGuest();
      onClose();
    } catch (err: any) {
      setLocalError(err.message || 'Не удалось войти как гость');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#F5ECE6] relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#FFF0EF] text-[#584140] hover:text-[#231918] flex items-center justify-center cursor-pointer transition-colors"
        >
          ✕
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-[#FFF0EF] text-[#AE2F34] flex items-center justify-center mx-auto mb-2">
            <span
              className="material-symbols-outlined text-2xl fill-icon"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              favorite
            </span>
          </div>
          <h2 className="text-xl font-bold text-[#231918]">
            {isRegister ? 'Регистрация в «Тепло»' : 'Вход в сервис'}
          </h2>
          <p className="text-xs text-[#584140] mt-1">
            Синхронизируйте ваши симпатии, диалоги и свидания в облаке Firebase.
          </p>
        </div>

        {(error || localError) && (
          <div className="bg-[#FFF0EF] border border-[#FFB3B0] text-[#A0401C] text-xs p-3 rounded-2xl mb-4 text-center">
            {localError || error}
          </div>
        )}

        {/* Google One-Click Button */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full py-3 px-4 rounded-full border border-[#E0BFBD] hover:bg-[#FFF8F7] text-[#231918] text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors mb-3 disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Войти через Google</span>
        </button>

        {/* Guest Fast Button */}
        <button
          onClick={handleGuest}
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-full bg-[#FFF8F7] hover:bg-[#FFF0EF] text-[#584140] text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors mb-4 disabled:opacity-50 border border-[#F5ECE6]"
        >
          <span className="material-symbols-outlined text-base">person_outline</span>
          <span>Войти как гость (анонимно)</span>
        </button>

        <div className="flex items-center my-4">
          <div className="flex-1 border-t border-[#F5ECE6]"></div>
          <span className="px-3 text-[11px] text-[#584140]/60 uppercase">или по email</span>
          <div className="flex-1 border-t border-[#F5ECE6]"></div>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {isRegister && (
            <div>
              <label className="block text-xs font-medium text-[#584140] mb-1">Ваше имя</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Как вас зовут?"
                className="w-full text-xs p-3 rounded-2xl border border-[#E0BFBD]/50 focus:border-[#AE2F34] outline-none text-[#231918]"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#584140] mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@mail.ru"
              className="w-full text-xs p-3 rounded-2xl border border-[#E0BFBD]/50 focus:border-[#AE2F34] outline-none text-[#231918]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#584140] mb-1">Пароль</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Минимум 6 символов"
              className="w-full text-xs p-3 rounded-2xl border border-[#E0BFBD]/50 focus:border-[#AE2F34] outline-none text-[#231918]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-full bg-[#AE2F34] hover:bg-[#9D422C] text-white text-xs font-bold shadow-md cursor-pointer transition-colors mt-4 disabled:opacity-50"
          >
            {loading ? 'Загрузка...' : isRegister ? 'Зарегистрироваться' : 'Войти'}
          </button>
        </form>

        <div className="text-center mt-4">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setLocalError(null);
              clearError();
            }}
            className="text-xs text-[#A0401C] hover:underline cursor-pointer"
          >
            {isRegister
              ? 'Уже есть аккаунт? Войти'
              : 'Впервые в Тепле? Создать аккаунт'}
          </button>
        </div>
      </div>
    </div>
  );
};
