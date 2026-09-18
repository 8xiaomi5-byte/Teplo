import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenFilters: () => void;
  onOpenAuth: () => void;
  onOpenVerification?: () => void;
  unreadMessagesCount: number;
  likesCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  searchQuery,
  onSearchChange,
  onOpenFilters,
  onOpenAuth,
  onOpenVerification,
  unreadMessagesCount,
  likesCount,
}) => {
  const { user, signOut, isVerifiedAccount, uniqueProfilesViewedCount } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const notifications = [
    {
      id: 'n-1',
      title: 'Взаимное тепло!',
      desc: 'Полина ответила на вашу симпатию и хочет пойти на кофе.',
      time: '12 минут назад',
      unread: true,
      type: 'match'
    },
    {
      id: 'n-2',
      title: 'Новое мероприятие',
      desc: 'Гончарный вечер для двоих в эту субботу на Покровке.',
      time: '1 час назад',
      unread: true,
      type: 'event'
    },
    {
      id: 'n-3',
      title: 'Firebase подключен',
      desc: 'Аутентификация и облачная база данных Firestore активны.',
      time: 'Только что',
      unread: false,
      type: 'system'
    }
  ];

  return (
    <header className="docked full-width top-0 sticky z-50 bg-[#FFF8F7]/85 backdrop-blur-md shadow-sm border-b border-[#E0BFBD]/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16 w-full">
        {/* Left cluster: Brand & Search */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => onSelectTab('discovery')}
            className="text-[24px] text-[#AE2F34] font-bold tracking-tight flex items-center gap-2 transition-transform active:scale-95 text-left cursor-pointer"
          >
            <span
              className="material-symbols-outlined fill-icon text-[#FF6B6B] text-[28px]"
              data-icon="favorite"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              favorite
            </span>
            <span>Тепло</span>
          </button>

          {/* Search Bar with Warm Glass styling */}
          <div className="hidden lg:flex items-center bg-[#FFF0EF] border border-[#E0BFBD]/40 rounded-full px-3 py-1.5 w-64 focus-within:border-[#A0401C] transition-all">
            <span className="material-symbols-outlined text-[#584140] text-lg mr-2" data-icon="search">
              search
            </span>
            <input
              className="bg-transparent border-0 p-0 text-[14px] text-[#231918] placeholder:text-[#584140]/60 focus:ring-0 w-full outline-none"
              placeholder="Поиск по интересам..."
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="text-[#584140] hover:text-[#231918] text-xs px-1 cursor-pointer"
                title="Очистить"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-[14px] font-semibold">
          <button
            onClick={() => onSelectTab('discovery')}
            className={`transition-colors duration-150 cursor-pointer ${
              currentTab === 'discovery'
                ? 'text-[#AE2F34] font-bold'
                : 'text-[#584140] hover:text-[#231918]'
            }`}
          >
            Знакомства
          </button>

          <button
            onClick={() => onSelectTab('matches')}
            className={`flex items-center gap-1.5 transition-colors duration-150 cursor-pointer ${
              currentTab === 'matches'
                ? 'text-[#AE2F34] font-bold'
                : 'text-[#584140] hover:text-[#231918]'
            }`}
          >
            <span>Мои пары</span>
            {likesCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-[#FF6B6B] text-white font-bold">
                {likesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectTab('messages')}
            className={`flex items-center gap-1.5 transition-colors duration-150 cursor-pointer ${
              currentTab === 'messages'
                ? 'text-[#AE2F34] font-bold'
                : 'text-[#584140] hover:text-[#231918]'
            }`}
          >
            <span>Сообщения</span>
            {unreadMessagesCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-[#AE2F34] text-white font-bold">
                {unreadMessagesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectTab('events')}
            className={`transition-colors duration-150 cursor-pointer ${
              currentTab === 'events'
                ? 'text-[#AE2F34] font-bold'
                : 'text-[#584140] hover:text-[#231918]'
            }`}
          >
            Мероприятия
          </button>
        </nav>

        {/* Trailing Action Cluster */}
        <div className="flex items-center gap-2 relative">
          {/* Notifications button with Popover */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-10 h-10 flex items-center justify-center text-[#584140] hover:bg-[#FDEAE8] rounded-full transition-colors duration-150 relative active:scale-95 cursor-pointer"
              title="Уведомления"
            >
              <span className="material-symbols-outlined" data-icon="notifications">
                notifications
              </span>
              <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-[#FF6B6B] animate-pulse"></span>
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-[#F5ECE6] p-4 z-50">
                <div className="flex items-center justify-between pb-3 border-b border-[#F5ECE6] mb-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#AE2F34] text-lg">notifications</span>
                    <h4 className="font-bold text-sm text-[#231918]">Уведомления</h4>
                  </div>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-xs text-[#584140] hover:text-[#231918] cursor-pointer"
                  >
                    Закрыть
                  </button>
                </div>
                <div className="space-y-2.5 max-h-80 overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        n.unread ? 'bg-[#FFF0EF] border-[#FFDAD8]' : 'bg-[#FFF8F7]/50 border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-[#AE2F34]">{n.title}</span>
                        <span className="text-[#584140]/70 text-[11px]">{n.time}</span>
                      </div>
                      <p className="text-xs text-[#584140]">{n.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Filters Button */}
          <button
            onClick={onOpenFilters}
            className="w-10 h-10 flex items-center justify-center text-[#584140] hover:bg-[#FDEAE8] rounded-full transition-colors duration-150 active:scale-95 cursor-pointer"
            title="Настройки фильтров"
          >
            <span className="material-symbols-outlined" data-icon="tune">
              tune
            </span>
          </button>

          {/* Auth & Profile section */}
          <div className="ml-2 pl-2 border-l border-[#E0BFBD]/30 flex items-center gap-2 relative">
            {user ? (
              <div className="relative flex items-center gap-2">
                {/* Verification indicator / badge */}
                {isVerifiedAccount ? (
                  <span
                    className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-200"
                    title="Аккаунт подтверждён"
                  >
                    <span
                      className="material-symbols-outlined text-xs text-emerald-600 fill-icon"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      verified
                    </span>
                    <span>Подтверждён</span>
                  </span>
                ) : (
                  <button
                    onClick={onOpenVerification}
                    className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFF0EF] hover:bg-[#FFDAD8] text-[#A0401C] text-[11px] font-semibold border border-[#E0BFBD]/50 transition-colors cursor-pointer"
                    title="Подтвердить аккаунт"
                  >
                    <span className="material-symbols-outlined text-xs text-[#AE2F34]">
                      verified_user
                    </span>
                    <span>{uniqueProfilesViewedCount}/10 анкет</span>
                  </button>
                )}

                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 pb-1 font-semibold text-[14px] cursor-pointer hover:opacity-90"
                >
                  <div className="relative">
                    <img
                      alt="Аватар пользователя"
                      className="w-9 h-9 rounded-full object-cover border-2 border-[#FF6B6B]"
                      src={
                        user.photoURL ||
                        'https://lh3.googleusercontent.com/aida-public/AB6AXuAe84ZEXPHizdm7jXM6WHByRWlXpNty4-quce-GImZl2CGITjvcuI0etaAgJrppEcgkvB6RIacHjupo-ZiLw4KQks4JOMa_N2tyB4H7Ol7VsR4D3vKeiB3fQ867kru30bx3t4iNfN9J2kCI1IpNFR5FWofkwFdzaAO9aG_EJLnZq13GKp47gq-zWg8E1SCYReKE5TkW5_oCAcq0wPVEdNRWp4SbUHhX6guGpzUCy8DQFriaf4MqHa0W'
                      }
                    />
                    {isVerifiedAccount ? (
                      <span
                        className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px] ring-2 ring-[#FFF8F7]"
                        title="Подтверждён"
                      >
                        ✓
                      </span>
                    ) : (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-[#FFF8F7]"></span>
                    )}
                  </div>
                  <span className="hidden sm:inline text-xs text-[#231918] max-w-[100px] truncate font-bold">
                    {user.displayName || (user.isAnonymous ? 'Гость' : user.email?.split('@')[0])}
                  </span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 top-12 w-64 bg-white rounded-2xl shadow-xl border border-[#F5ECE6] py-2 z-50">
                    <div className="px-4 py-2 border-b border-[#F5ECE6]">
                      <p className="text-xs font-bold text-[#231918] truncate">
                        {user.displayName || (user.isAnonymous ? 'Анонимный гость' : 'Пользователь')}
                      </p>
                      <p className="text-[11px] text-[#584140] truncate">
                        {user.email || 'Вошли анонимно'}
                      </p>
                      <div className="mt-2 flex items-center justify-between text-[11px]">
                        <span className="text-[#584140]">Статус аккаунта:</span>
                        {isVerifiedAccount ? (
                          <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-xs">verified</span>
                            Подтверждён
                          </span>
                        ) : (
                          <span className="text-[#A0401C] font-bold">
                            {uniqueProfilesViewedCount}/10 бесплатных
                          </span>
                        )}
                      </div>
                    </div>

                    {!isVerifiedAccount && onOpenVerification && (
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onOpenVerification();
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs font-bold text-[#AE2F34] bg-[#FFF0EF]/60 hover:bg-[#FFF0EF] flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <span className="material-symbols-outlined text-base">verified_user</span>
                        <span>Подтвердить аккаунт (€1.50)</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onSelectTab('profile');
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-semibold text-[#584140] hover:bg-[#FFF0EF] hover:text-[#AE2F34] flex items-center gap-2 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">person</span>
                      <span>Моя анкета</span>
                    </button>
                    <button
                      onClick={async () => {
                        setShowUserMenu(false);
                        await signOut();
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-semibold text-[#AE2F34] hover:bg-[#FFF0EF] flex items-center gap-2 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">logout</span>
                      <span>Выйти из аккаунта</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-4 py-1.5 rounded-full bg-[#AE2F34] hover:bg-[#9D422C] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">login</span>
                <span>Войти</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile navigation tab strip */}
      <div className="md:hidden flex items-center justify-around py-2 border-t border-[#E0BFBD]/30 bg-[#FFF8F7]/95 text-xs font-semibold text-[#584140]">
        <button
          onClick={() => onSelectTab('discovery')}
          className={`px-3 py-1 rounded-full cursor-pointer ${
            currentTab === 'discovery' ? 'bg-[#FFDAD8] text-[#AE2F34]' : ''
          }`}
        >
          Знакомства
        </button>
        <button
          onClick={() => onSelectTab('matches')}
          className={`px-3 py-1 rounded-full cursor-pointer ${
            currentTab === 'matches' ? 'bg-[#FFDAD8] text-[#AE2F34]' : ''
          }`}
        >
          Пары
        </button>
        <button
          onClick={() => onSelectTab('messages')}
          className={`px-3 py-1 rounded-full cursor-pointer ${
            currentTab === 'messages' ? 'bg-[#FFDAD8] text-[#AE2F34]' : ''
          }`}
        >
          Сообщения
        </button>
        <button
          onClick={() => onSelectTab('events')}
          className={`px-3 py-1 rounded-full cursor-pointer ${
            currentTab === 'events' ? 'bg-[#FFDAD8] text-[#AE2F34]' : ''
          }`}
        >
          Мероприятия
        </button>
        <button
          onClick={() => onSelectTab('profile')}
          className={`px-3 py-1 rounded-full cursor-pointer ${
            currentTab === 'profile' ? 'bg-[#FFDAD8] text-[#AE2F34]' : ''
          }`}
        >
          Анкета
        </button>
      </div>
    </header>
  );
};
