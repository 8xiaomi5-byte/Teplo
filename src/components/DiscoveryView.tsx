import React, { useState } from 'react';
import { Profile } from '../types';

interface DiscoveryViewProps {
  profiles: Profile[];
  onSelectProfile: (p: Profile) => void;
  onSendSympathy: (p: Profile) => void;
  onProposeDate: (p: Profile) => void;
  searchQuery: string;
  activeFilterTag: string;
  onSelectFilterTag: (tag: string) => void;
}

export const DiscoveryView: React.FC<DiscoveryViewProps> = ({
  profiles,
  onSelectProfile,
  onSendSympathy,
  onProposeDate,
  searchQuery,
  activeFilterTag,
  onSelectFilterTag,
}) => {
  const [likedProfiles, setLikedProfiles] = useState<string[]>([]);

  const filterTags = [
    'Все',
    'Выбор редакции',
    'Архитектура & Арт',
    'С собаками',
    'Кофе & книги',
    'Москва',
  ];

  const handleQuickLike = (profileId: string) => {
    setLikedProfiles((prev) =>
      prev.includes(profileId) ? prev.filter((id) => id !== profileId) : [...prev, profileId]
    );
  };

  const filtered = profiles.filter((p) => {
    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchProf = p.profession.toLowerCase().includes(q);
      const matchInterests = p.interests.some((i) => i.name.toLowerCase().includes(q));
      const matchBio = p.bioParagraphs.some((b) => b.toLowerCase().includes(q));
      if (!matchName && !matchProf && !matchInterests && !matchBio) return false;
    }

    // Category tag match
    if (activeFilterTag === 'Выбор редакции' && !p.isEditorChoice) return false;
    if (activeFilterTag === 'С собаками' && !p.facts.pets.toLowerCase().includes('собак')) return false;
    if (
      activeFilterTag === 'Кофе & книги' &&
      !p.interests.some((i) => i.name.toLowerCase().includes('кофе') || i.name.toLowerCase().includes('книг'))
    )
      return false;
    if (
      activeFilterTag === 'Архитектура & Арт' &&
      !p.profession.toLowerCase().includes('архитект') &&
      !p.profession.toLowerCase().includes('иллюстр') &&
      !p.profession.toLowerCase().includes('столяр')
    )
      return false;

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full animate-in fade-in">
      {/* Header title & atmospheric description */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="material-symbols-outlined text-[#AE2F34] fill-icon text-xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              favorite
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#A0401C]">
              Осознанные знакомства
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#231918]">
            Люди с близкими ценностями
          </h1>
          <p className="text-sm text-[#584140] mt-1">
            Мы подбираем анкеты на основе психологической совместимости, искренности и любви к тёплым моментам.
          </p>
        </div>

        {/* Filter chips bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {filterTags.map((tag) => (
            <button
              key={tag}
              onClick={() => onSelectFilterTag(tag)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeFilterTag === tag
                  ? 'bg-[#AE2F34] text-white shadow-xs'
                  : 'bg-[#FFF0EF] text-[#584140] hover:bg-[#FDEAE8]'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Profile Cards */}
      {filtered.length === 0 ? (
        <div className="layer-card rounded-3xl p-12 text-center my-8">
          <span className="material-symbols-outlined text-4xl text-[#A0401C] mb-2">sentiment_satisfied</span>
          <h3 className="text-lg font-bold text-[#231918]">Анкеты не найдены</h3>
          <p className="text-sm text-[#584140] max-w-md mx-auto mt-1 mb-4">
            Попробуйте смягчить поисковый запрос или сбросить фильтры, чтобы увидеть больше интересных людей.
          </p>
          <button
            onClick={() => onSelectFilterTag('Все')}
            className="px-5 py-2.5 rounded-full bg-[#AE2F34] text-white text-xs font-semibold hover:bg-[#9D422C] cursor-pointer"
          >
            Сбросить фильтры
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((profile) => {
            const isLiked = likedProfiles.includes(profile.id);

            return (
              <div
                key={profile.id}
                className="layer-card rounded-3xl overflow-hidden flex flex-col group hover:shadow-xl transition-all duration-300 border border-[#F5ECE6]"
              >
                {/* Image Banner Container */}
                <div
                  className="relative aspect-[4/5] overflow-hidden bg-[#FDEAE8] cursor-pointer"
                  onClick={() => onSelectProfile(profile)}
                >
                  <img
                    src={profile.heroPhoto}
                    alt={profile.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    {profile.isEditorChoice && (
                      <span className="bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-semibold text-[#A0401C] border border-white/60 shadow-xs flex items-center gap-1">
                        <span
                          className="material-symbols-outlined text-xs fill-icon text-[#AE2F34]"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          auto_awesome
                        </span>
                        <span>Выбор редакции</span>
                      </span>
                    )}

                    {profile.voiceNote && (
                      <span className="bg-[#231918]/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-semibold text-white flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs text-[#FF6B6B]">mic</span>
                        <span>Голос: {profile.voiceNote.duration}</span>
                      </span>
                    )}
                  </div>

                  {/* Compatibility Badge top right */}
                  <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-bold text-[#AE2F34] shadow-xs flex items-center gap-1">
                    <span
                      className="material-symbols-outlined text-xs fill-icon text-[#AE2F34]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      favorite
                    </span>
                    <span>{profile.compatibility}%</span>
                  </div>

                  {/* Gradient Overlay & Name */}
                  <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-[#231918]/90 via-[#231918]/40 to-transparent text-white">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold">
                        {profile.name}, {profile.age}
                      </h3>
                      {profile.isVerified && (
                        <span
                          className="material-symbols-outlined text-[#FFB3B0] text-lg fill-icon"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          verified
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#F7E4E2] opacity-90 line-clamp-1 mt-0.5">
                      {profile.city} · {profile.profession}
                    </p>
                  </div>
                </div>

                {/* Content body */}
                <div className="p-5 flex flex-col flex-1 justify-between">
                  <div>
                    {/* Highlight Quote */}
                    {profile.highlightQuote && (
                      <p className="text-xs text-[#A0401C] bg-[#FFF0EF] p-3 rounded-2xl italic mb-3 line-clamp-2 border-l-2 border-[#AE2F34]">
                        {profile.highlightQuote}
                      </p>
                    )}

                    {/* Interest tags */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {profile.interests.slice(0, 4).map((interest, i) => (
                        <span
                          key={i}
                          className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#FFF9F6] text-[#584140] border border-[#EFE6E1]"
                        >
                          {interest.name}
                        </span>
                      ))}
                      {profile.interests.length > 4 && (
                        <span className="text-[10px] text-[#A0401C] self-center font-bold">
                          +{profile.interests.length - 4}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-[#F5ECE6]">
                    <button
                      onClick={() => onSelectProfile(profile)}
                      className="flex-1 py-2.5 px-4 rounded-full bg-[#FFF0EF] hover:bg-[#FDEAE8] text-[#A0401C] text-xs font-semibold transition-colors cursor-pointer text-center"
                    >
                      Смотреть анкету
                    </button>

                    <button
                      onClick={() => {
                        handleQuickLike(profile.id);
                        onSendSympathy(profile);
                      }}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        isLiked
                          ? 'bg-[#AE2F34] text-white scale-105'
                          : 'bg-[#FFF0EF] hover:bg-[#FFDAD8] text-[#AE2F34]'
                      }`}
                      title="Отправить симпатию"
                    >
                      <span
                        className="material-symbols-outlined text-lg fill-icon"
                        style={{ fontVariationSettings: isLiked ? "'FILL' 1" : "'FILL' 0" }}
                      >
                        favorite
                      </span>
                    </button>

                    <button
                      onClick={() => onProposeDate(profile)}
                      className="w-10 h-10 rounded-full bg-[#FFF4ED] hover:bg-[#FFDAC6] text-[#9D422C] flex items-center justify-center transition-colors cursor-pointer"
                      title="Предложить свидание"
                    >
                      <span className="material-symbols-outlined text-lg">calendar_month</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
