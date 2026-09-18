import React, { useState, useEffect, useRef } from 'react';
import { Profile } from '../types';
import { SympathyModal } from './Modals/SympathyModal';
import { DateProposalModal } from './Modals/DateProposalModal';
import { LightboxModal } from './Modals/LightboxModal';
import { EditProfileModal } from './Modals/EditProfileModal';

interface ProfileViewProps {
  profile: Profile;
  onBackToDiscovery: () => void;
  onSendSympathy: (profile: Profile, message: string, reaction: string) => void;
  onProposeDate: (profile: Profile, dateDetails: { venueName: string; address: string; time: string; note: string }) => void;
  onUpdateProfile: (updated: Partial<Profile>) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  onBackToDiscovery,
  onSendSympathy,
  onProposeDate,
  onUpdateProfile,
}) => {
  // Modals state
  const [isSympathyOpen, setIsSympathyOpen] = useState(false);
  const [isDateProposalOpen, setIsDateProposalOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Audio player state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(14); // starts at 14s as in mockup
  const audioContextRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);

  const allPhotos = [profile.heroPhoto, ...profile.gallery];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    showToast(`Ссылка на профиль ${profile.name} скопирована в буфер обмена!`);
  };

  // Play soothing audio effect via Web Audio API to simulate voice intro
  const toggleVoiceNote = () => {
    if (isPlayingAudio) {
      setIsPlayingAudio(false);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    try {
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Gentle warm chord tones simulating friendly ambient voice note
      const now = ctx.currentTime;
      const notes = [261.63, 329.63, 392.0, 523.25]; // C major soothing frequencies
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.2);

        gain.gain.setValueAtTime(0.001, now + idx * 0.2);
        gain.gain.exponentialRampToValueAtTime(0.08, now + idx * 0.2 + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.2 + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.2);
        osc.stop(now + idx * 0.2 + 1.3);
      });
    } catch {
      // AudioContext unavailable in silent context, fallback smoothly
    }

    setIsPlayingAudio(true);
    timerRef.current = window.setInterval(() => {
      setAudioProgress((prev) => {
        if (prev >= profile.voiceNote.durationSeconds) {
          setIsPlayingAudio(false);
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full animate-in fade-in">
      {/* Subheader & Status Overview */}
      <section className="mb-6 flex flex-wrap items-center justify-between gap-4 bg-[#FFF0EF] rounded-3xl p-4 border border-[#E0BFBD]/30">
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={onBackToDiscovery}
            className="inline-flex items-center gap-1.5 text-[#A0401C] hover:text-[#AE2F34] transition-colors text-[14px] font-semibold px-2 py-1 rounded-full hover:bg-[#FDEAE8] cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg" data-icon="arrow_back">
              arrow_back
            </span>
            <span>К анкетам</span>
          </button>
          <div className="h-4 w-px bg-[#E0BFBD]/40 hidden sm:block"></div>
          <div className="flex items-center gap-2">
            {profile.isVerified && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-medium border border-emerald-200">
                <span
                  className="material-symbols-outlined text-sm fill-icon text-emerald-600"
                  data-icon="verified"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  verified
                </span>
                <span>Подтверждённый аккаунт</span>
              </span>
            )}
            {profile.isOnline && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white text-[#584140] text-[11px] font-medium border border-[#E0BFBD]/30">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Сейчас онлайн</span>
              </span>
            )}
          </div>
        </div>

        {/* Profile Completion & Editing Actions */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-[#E0BFBD]/30">
            <span className="material-symbols-outlined text-[#A0401C] text-lg" data-icon="task_alt">
              task_alt
            </span>
            <span className="text-[11px] text-[#584140]">
              Анкета заполнена на{' '}
              <strong className="text-[#A0401C] font-bold">
                {profile.completionPercentage}%
              </strong>
            </span>
          </div>
          <button
            onClick={() => setIsEditOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white hover:bg-[#FDEAE8] text-[#A0401C] border border-[#E0BFBD]/60 text-[14px] font-semibold transition-all active:scale-95 shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg" data-icon="edit">
              edit
            </span>
            <span>Редактировать</span>
          </button>
        </div>
      </section>

      {/* Two-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* =========================================================
            LEFT COLUMN: Photo Gallery, Match Indicator & Actions (5 cols)
            ========================================================= */}
        <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-24">
          {/* Visual Media Card Bento Gallery */}
          <div className="layer-card rounded-3xl p-4 flex flex-col gap-4">
            {/* Main Prominent Hero Photo */}
            <div
              onClick={() => setLightboxIndex(0)}
              className="relative group overflow-hidden rounded-2xl aspect-[4/5] bg-[#FDEAE8] cursor-pointer"
            >
              <img
                alt={`Основная фотография профиля ${profile.name}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                src={profile.heroPhoto}
              />

              {/* Floating Quick Badges over Hero Photo */}
              {profile.isEditorChoice && (
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  <span className="bg-[#FFF8F7]/90 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-semibold text-[#A0401C] border border-white/60 shadow-xs flex items-center gap-1.5">
                    <span
                      className="material-symbols-outlined text-sm fill-icon text-[#AE2F34]"
                      data-icon="auto_awesome"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      auto_awesome
                    </span>
                    <span>Выбор редакции</span>
                  </span>
                </div>
              )}

              {/* Identity Gradient Overlay */}
              <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-[#231918]/85 via-[#231918]/40 to-transparent text-white">
                <div className="flex items-baseline gap-2">
                  <h1 className="text-[24px] font-bold text-white">
                    {profile.name}, {profile.age}
                  </h1>
                  {profile.isVerified && (
                    <span
                      className="material-symbols-outlined text-[#FFB3B0] text-xl fill-icon"
                      data-icon="verified"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      verified
                    </span>
                  )}
                </div>
                <p className="text-[14px] text-[#F7E4E2] opacity-90 flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-sm" data-icon="location_on">
                    location_on
                  </span>
                  <span>
                    {profile.city} · {profile.profession}
                  </span>
                </p>
              </div>
            </div>

            {/* Secondary Photos Grid (3 Thumbnails) */}
            <div className="grid grid-cols-3 gap-2">
              {profile.gallery.map((photoUrl, idx) => (
                <div
                  key={idx}
                  onClick={() => setLightboxIndex(idx + 1)}
                  className="relative rounded-xl overflow-hidden aspect-square group bg-[#FDEAE8] cursor-pointer"
                >
                  <img
                    alt={`${profile.name} фото ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    src={photoUrl}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <span className="material-symbols-outlined text-white opacity-0 group-hover:opacity-100 text-xl transition-opacity">
                      zoom_in
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Compatibility & Psychotype Trust Seal Card */}
          <div className="layer-card rounded-3xl p-6 bg-gradient-to-br from-[#FFF0EF] to-white">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-[#FFDAD2] flex items-center justify-center text-[#3C0700]">
                  <span
                    className="material-symbols-outlined fill-icon text-xl text-[#9D422C]"
                    data-icon="favorite"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    favorite
                  </span>
                </div>
                <div>
                  <h2 className="text-[18px] font-semibold text-[#231918]">
                    Совместимость {profile.compatibility}%
                  </h2>
                  <p className="text-[11px] text-[#A0401C] font-semibold">
                    Психотип: {profile.psychotype}
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#AE2F34]/10 text-[#AE2F34] text-[11px] font-semibold">
                Идеальное тепло
              </span>
            </div>
            <p className="text-[14px] text-[#584140] mb-4">
              {profile.compatibilityNote}
            </p>

            {/* Micro-Progress Bar */}
            <div className="w-full bg-[#F1DEDC] h-2.5 rounded-full overflow-hidden mb-4">
              <div
                className="bg-gradient-to-r from-[#FF6B6B] to-[#9D422C] h-full rounded-full transition-all duration-1000"
                style={{ width: `${profile.compatibility}%` }}
              ></div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-white p-2.5 rounded-xl border border-[#E0BFBD]/30">
                <span className="block text-[11px] text-[#584140]">Ценности</span>
                <strong className="text-[16px] text-[#A0401C]">
                  {profile.valuesMatch}% совпадение
                </strong>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-[#E0BFBD]/30">
                <span className="block text-[11px] text-[#584140]">Ритм жизни</span>
                <strong className="text-[16px] text-[#A0401C]">
                  {profile.rhythmMatch}% совпадение
                </strong>
              </div>
            </div>
          </div>

          {/* Quick Primary Action Buttons */}
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <button
                onClick={() => setIsSympathyOpen(true)}
                className="flex-1 py-3.5 px-6 rounded-full bg-gradient-to-r from-[#FF6B6B] to-[#EE7B52] hover:opacity-95 text-white font-bold text-[14px] layer-glow flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                <span
                  className="material-symbols-outlined fill-icon text-xl"
                  data-icon="favorite"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  favorite
                </span>
                <span>Отправить симпатию</span>
              </button>
              <button
                onClick={handleShare}
                className="w-14 h-14 rounded-full bg-white border border-[#E0BFBD]/40 hover:bg-[#FFF0EF] flex items-center justify-center text-[#584140] hover:text-[#AE2F34] active:scale-95 transition-all shadow-xs cursor-pointer"
                title="Поделиться профилем"
              >
                <span className="material-symbols-outlined" data-icon="share">
                  share
                </span>
              </button>
            </div>
            <button
              onClick={() => setIsDateProposalOpen(true)}
              className="w-full py-3 px-6 rounded-full bg-[#FFF4ED] hover:bg-[#FFECE0] text-[#9D422C] font-semibold text-[14px] border border-[#FFDAC6] flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl" data-icon="calendar_month">
                calendar_month
              </span>
              <span>Предложить свидание в тёплом месте</span>
            </button>
          </div>
        </div>

        {/* =========================================================
            RIGHT COLUMN: Detailed Structured Bio & Icebreakers (7 cols)
            ========================================================= */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* 1. Voice Intro Card (Голосовая визитка) */}
          <div className="layer-card rounded-3xl p-6 bg-gradient-to-r from-[#FFF0EF] via-white to-[#FFF0EF] border border-[#E0BFBD]/40">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span
                  className="material-symbols-outlined text-[#FF6B6B] fill-icon text-22px"
                  data-icon="mic"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  mic
                </span>
                <h2 className="text-[18px] font-semibold text-[#231918]">
                  Голосовая визитка
                </h2>
              </div>
              <span className="text-[11px] text-[#584140]">
                {profile.voiceNote.duration}
              </span>
            </div>
            <p className="text-[14px] text-[#584140] mb-4">
              {profile.voiceNote.description}
            </p>

            {/* Custom Interactive Audio Player */}
            <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-[#E0BFBD]/30 shadow-xs">
              <button
                onClick={toggleVoiceNote}
                className="w-12 h-12 rounded-full bg-[#FF6B6B] hover:bg-[#AE2F34] text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title={isPlayingAudio ? 'Пауза' : 'Воспроизвести'}
              >
                <span
                  className="material-symbols-outlined fill-icon text-2xl"
                  data-icon={isPlayingAudio ? 'pause' : 'play_arrow'}
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {isPlayingAudio ? 'pause' : 'play_arrow'}
                </span>
              </button>

              {/* Stylized Sound Wave Simulation */}
              <div className="flex-1 flex items-center gap-1 h-8 px-2 overflow-hidden cursor-pointer" onClick={toggleVoiceNote}>
                {[12, 20, 28, 16, 24, 32, 20, 12, 16, 24, 28, 16, 20, 8, 16, 24, 12, 20, 16, 24].map((height, i) => {
                  const isPassed = (i / 20) <= (audioProgress / profile.voiceNote.durationSeconds);
                  return (
                    <span
                      key={i}
                      className={`w-1 rounded-full transition-all duration-200 ${
                        isPlayingAudio ? 'animate-pulse' : ''
                      } ${
                        isPassed ? 'bg-[#AE2F34]' : 'bg-[#E0BFBD]'
                      }`}
                      style={{ height: `${height}px` }}
                    />
                  );
                })}
              </div>

              <div className="text-[12px] text-[#A0401C] pr-2 font-mono font-semibold">
                {formatTime(audioProgress)} / {formatTime(profile.voiceNote.durationSeconds)}
              </div>
            </div>
          </div>

          {/* 2. Блок «Обо мне» (Inspiring Live Story) */}
          <div className="layer-card rounded-3xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[#A0401C] text-[24px]" data-icon="stylus_note">
                stylus_note
              </span>
              <h2 className="text-[20px] font-semibold text-[#231918]">Обо мне</h2>
            </div>
            <div className="space-y-4 text-[16px] text-[#584140] leading-relaxed">
              {profile.bioParagraphs.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
              {profile.highlightQuote && (
                <p className="text-[#A0401C] font-medium bg-[#FFF0EF] p-4 rounded-2xl border-l-4 border-[#AE2F34]">
                  {profile.highlightQuote}
                </p>
              )}
            </div>

            {/* Quick facts bullets */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-6 pt-4 border-t border-[#E0BFBD]/30 text-[14px]">
              <div className="flex items-center gap-2 text-[#584140]">
                <span className="material-symbols-outlined text-[#A0401C] text-lg" data-icon="height">
                  height
                </span>
                <span>
                  Рост: <strong>{profile.facts.height}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2 text-[#584140]">
                <span className="material-symbols-outlined text-[#A0401C] text-lg" data-icon="work">
                  work
                </span>
                <span>{profile.facts.profession}</span>
              </div>
              <div className="flex items-center gap-2 text-[#584140]">
                <span className="material-symbols-outlined text-[#A0401C] text-lg" data-icon="school">
                  school
                </span>
                <span>{profile.facts.education}</span>
              </div>
              <div className="flex items-center gap-2 text-[#584140]">
                <span className="material-symbols-outlined text-[#A0401C] text-lg" data-icon="smoke_free">
                  smoke_free
                </span>
                <span>{profile.facts.smoking}</span>
              </div>
              <div className="flex items-center gap-2 text-[#584140]">
                <span className="material-symbols-outlined text-[#A0401C] text-lg" data-icon="pets">
                  pets
                </span>
                <span>{profile.facts.pets}</span>
              </div>
              <div className="flex items-center gap-2 text-[#584140]">
                <span className="material-symbols-outlined text-[#A0401C] text-lg" data-icon="translate">
                  translate
                </span>
                <span>{profile.facts.languages}</span>
              </div>
            </div>
          </div>

          {/* 3. Вопросы-Ледоколы (Prompt Cards) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#A0401C] text-[24px]" data-icon="forum">
                  forum
                </span>
                <h2 className="text-[20px] font-semibold text-[#231918]">
                  Вопросы-ледоколы
                </h2>
              </div>
              <span className="text-[11px] text-[#584140]">
                Темы для первого сообщения
              </span>
            </div>

            {profile.icebreakers.map((ib) => (
              <div
                key={ib.id}
                onClick={() => setIsSympathyOpen(true)}
                className="layer-card rounded-3xl p-6 bg-white hover:border-[#FFB3B0] transition-all cursor-pointer group"
              >
                <div className="flex items-start gap-3">
                  <span className="text-[#A0401C] font-serif text-3xl leading-none">“</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-[18px] text-[#A0401C] font-semibold group-hover:text-[#AE2F34] transition-colors">
                        {ib.question}
                      </h3>
                      <span className="text-xs text-[#A0401C] opacity-0 group-hover:opacity-100 transition-opacity font-semibold flex items-center gap-1">
                        Ответить <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </span>
                    </div>
                    <p className="text-[16px] text-[#584140] leading-relaxed">
                      {ib.answer}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 4. Мои ценности и ориентиры (Core Values) */}
          <div className="layer-card rounded-3xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <span
                className="material-symbols-outlined text-[#A0401C] text-[24px]"
                data-icon="energy_savings_leaf"
              >
                energy_savings_leaf
              </span>
              <h2 className="text-[20px] font-semibold text-[#231918]">
                Мои ценности и ориентиры
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {profile.values.map((val) => (
                <div
                  key={val.id}
                  className="flex items-start gap-3 p-4 rounded-2xl bg-[#FFF0EF] border border-[#E0BFBD]/30"
                >
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#AE2F34] shrink-0 shadow-xs">
                    <span className="material-symbols-outlined text-lg" data-icon={val.icon}>
                      {val.icon}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-[18px] font-semibold text-[#231918] mb-0.5">
                      {val.title}
                    </h4>
                    <p className="text-[14px] text-[#584140]">{val.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 5. Теги интересов и хобби (Pill Badges) */}
          <div className="layer-card rounded-3xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[#A0401C] text-[24px]" data-icon="interests">
                interests
              </span>
              <h2 className="text-[20px] font-semibold text-[#231918]">
                Интересы и хобби
              </h2>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {profile.interests.map((interest, i) => (
                <span
                  key={i}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[14px] font-semibold transition-colors ${
                    interest.isPrimary
                      ? 'bg-[#FFE5D9] text-[#D96B43]'
                      : 'bg-[#FFF9F6] text-[#4A3E3D] border border-[#EFE6E1] hover:border-[#A0401C]'
                  }`}
                >
                  <span className="material-symbols-outlined text-base" data-icon={interest.icon}>
                    {interest.icon}
                  </span>
                  <span>{interest.name}</span>
                </span>
              ))}
            </div>
          </div>

          {/* 6. Раздел «Кого я хочу встретить» (Intentional Matchmaking Preferences) */}
          <div className="layer-card rounded-3xl p-6 bg-gradient-to-br from-white to-[#FFF0EF] border border-[#E0BFBD]/30">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[#A0401C] text-[24px]" data-icon="person_search">
                person_search
              </span>
              <h2 className="text-[20px] font-semibold text-[#231918]">
                Кого я хочу встретить
              </h2>
            </div>
            <div className="space-y-4 text-[16px] text-[#584140]">
              <p>
                Ищу близкого по духу человека в возрасте{' '}
                <strong>{profile.preferences.ageRange}</strong>, {profile.preferences.locationNote}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                {profile.preferences.goals.map((goal, i) => (
                  <div key={i} className="flex items-center gap-2 text-[14px]">
                    <span
                      className="material-symbols-outlined text-emerald-600 text-lg fill-icon"
                      data-icon="check_circle"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      check_circle
                    </span>
                    <span>{goal}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#231918] text-white px-5 py-3 rounded-2xl shadow-xl border border-white/20 text-sm font-semibold flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
          <span className="material-symbols-outlined text-[#FF6B6B]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modals */}
      <SympathyModal
        profile={profile}
        isOpen={isSympathyOpen}
        onClose={() => setIsSympathyOpen(false)}
        onSend={(msg, reaction) => {
          onSendSympathy(profile, msg, reaction);
          showToast(`Симпатия (${reaction}) успешно отправлена ${profile.name}!`);
        }}
      />

      <DateProposalModal
        profile={profile}
        isOpen={isDateProposalOpen}
        onClose={() => setIsDateProposalOpen(false)}
        onConfirm={(details) => {
          onProposeDate(profile, details);
          showToast(`Приглашение на свидание в «${details.venueName}» отправлено!`);
        }}
      />

      <EditProfileModal
        profile={profile}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSave={(updated) => {
          onUpdateProfile(updated);
          showToast('Изменения в анкете успешно сохранены!');
        }}
      />

      <LightboxModal
        photos={allPhotos}
        currentIndex={lightboxIndex ?? 0}
        isOpen={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
        onSelectIndex={(idx) => setLightboxIndex(idx)}
        caption={`${profile.name}, ${profile.age} · ${profile.profession}`}
      />
    </main>
  );
};
