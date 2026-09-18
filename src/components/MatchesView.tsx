import React from 'react';
import { Profile } from '../types';

interface MatchesViewProps {
  matchedProfiles: Profile[];
  onSelectProfile: (p: Profile) => void;
  onOpenChat: (p: Profile) => void;
  onProposeDate: (p: Profile) => void;
}

export const MatchesView: React.FC<MatchesViewProps> = ({
  matchedProfiles,
  onSelectProfile,
  onOpenChat,
  onProposeDate,
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full animate-in fade-in">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="material-symbols-outlined text-[#AE2F34] fill-icon text-xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            favorite
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-[#A0401C]">
            Взаимное тепло
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#231918]">
          Ваши взаимные симпатии ({matchedProfiles.length})
        </h1>
        <p className="text-sm text-[#584140] mt-1">
          Когда оба человека ответили «да» — здесь рождается пространство для спокойного знакомства и свиданий.
        </p>
      </div>

      {matchedProfiles.length === 0 ? (
        <div className="layer-card rounded-3xl p-12 text-center my-8">
          <div className="w-16 h-16 rounded-full bg-[#FFF0EF] text-[#AE2F34] flex items-center justify-center mx-auto mb-4">
            <span
              className="material-symbols-outlined text-3xl fill-icon"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              favorite
            </span>
          </div>
          <h3 className="text-lg font-bold text-[#231918]">Пока нет взаимных пар</h3>
          <p className="text-sm text-[#584140] max-w-md mx-auto mt-1 mb-4">
            Отправляйте симпатии понравившимся людям в разделе «Знакомства» или делитесь ответами на вопросы-ледоколы.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matchedProfiles.map((profile) => (
            <div
              key={profile.id}
              className="layer-card rounded-3xl p-5 border border-[#F5ECE6] flex flex-col justify-between hover:shadow-lg transition-all"
            >
              <div>
                {/* Header with avatar & compatibility */}
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="relative cursor-pointer shrink-0"
                    onClick={() => onSelectProfile(profile)}
                  >
                    <img
                      src={profile.avatarUrl}
                      alt={profile.name}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-[#FF6B6B]"
                    />
                    {profile.isOnline && (
                      <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full ring-2 ring-white"></span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3
                        onClick={() => onSelectProfile(profile)}
                        className="text-base font-bold text-[#231918] hover:text-[#AE2F34] transition-colors cursor-pointer truncate"
                      >
                        {profile.name}, {profile.age}
                      </h3>
                      <span className="text-[11px] font-bold text-[#AE2F34] bg-[#FFF0EF] px-2 py-0.5 rounded-full">
                        {profile.compatibility}%
                      </span>
                    </div>

                    <p className="text-xs text-[#584140] truncate mt-0.5">
                      {profile.profession}
                    </p>

                    <p className="text-[11px] text-[#A0401C] font-medium mt-1">
                      Психотип: {profile.psychotype}
                    </p>
                  </div>
                </div>

                {/* Compatibility Highlights */}
                <div className="bg-[#FFF8F7] p-3 rounded-2xl border border-[#E0BFBD]/30 mb-4">
                  <div className="flex items-center justify-between text-[11px] text-[#584140] mb-1.5">
                    <span>Совпадение ценностей:</span>
                    <strong className="text-[#A0401C] font-bold">{profile.valuesMatch}%</strong>
                  </div>
                  <p className="text-xs text-[#584140] line-clamp-2">
                    {profile.compatibilityNote}
                  </p>
                </div>

                {/* Top shared interests */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {profile.interests.slice(0, 3).map((item, i) => (
                    <span
                      key={i}
                      className="text-[11px] px-2.5 py-1 rounded-full bg-[#FFF9F6] text-[#584140] border border-[#EFE6E1]"
                    >
                      {item.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-3 border-t border-[#F5ECE6]">
                <button
                  onClick={() => onOpenChat(profile)}
                  className="flex-1 py-2.5 px-4 rounded-full bg-[#AE2F34] hover:bg-[#9D422C] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-base">forum</span>
                  <span>Написать</span>
                </button>

                <button
                  onClick={() => onProposeDate(profile)}
                  className="py-2.5 px-3 rounded-full bg-[#FFF4ED] hover:bg-[#FFDAC6] text-[#9D422C] text-xs font-semibold flex items-center justify-center gap-1 border border-[#FFDAC6] cursor-pointer transition-colors"
                  title="Предложить свидание в тёплом месте"
                >
                  <span className="material-symbols-outlined text-base">calendar_month</span>
                  <span className="hidden sm:inline">Свидание</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
