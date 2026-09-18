import React, { useState } from 'react';
import { WarmEvent, Profile } from '../types';
import { WARM_EVENTS } from '../data/events';

interface EventsViewProps {
  matchedProfiles: Profile[];
  onInviteMatchToEvent: (event: WarmEvent, profile: Profile) => void;
}

export const EventsView: React.FC<EventsViewProps> = ({
  matchedProfiles,
  onInviteMatchToEvent,
}) => {
  const [selectedEventForInvite, setSelectedEventForInvite] = useState<WarmEvent | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<string>(
    matchedProfiles[0]?.id || ''
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleConfirmInvite = () => {
    if (!selectedEventForInvite) return;
    const targetProfile = matchedProfiles.find((p) => p.id === selectedMatchId) || matchedProfiles[0];
    if (targetProfile) {
      onInviteMatchToEvent(selectedEventForInvite, targetProfile);
      showToast(`Приглашение на «${selectedEventForInvite.title}» отправлено ${targetProfile.name}!`);
      setSelectedEventForInvite(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full animate-in fade-in">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="material-symbols-outlined text-[#AE2F34] fill-icon text-xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            local_activity
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-[#A0401C]">
            Тёплые свидания и встречи
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#231918]">
          Мероприятия для пар и свиданий
        </h1>
        <p className="text-sm text-[#584140] mt-1">
          Мы отбираем атмосферные места в Москве, где легко начать разговор, заняться совместным делом и почувствовать теплоту.
        </p>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {WARM_EVENTS.map((event) => (
          <div
            key={event.id}
            className="layer-card rounded-3xl overflow-hidden border border-[#F5ECE6] flex flex-col justify-between hover:shadow-lg transition-all"
          >
            <div>
              {/* Event Image Banner */}
              <div className="relative aspect-[16/9] overflow-hidden bg-[#FDEAE8]">
                <img
                  src={event.image}
                  alt={event.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-[#A0401C] shadow-xs">
                  {event.category}
                </div>
                <div className="absolute bottom-3 right-3 bg-[#231918]/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-white">
                  {event.price}
                </div>
              </div>

              {/* Event Details */}
              <div className="p-5">
                <div className="flex items-center gap-2 text-xs text-[#A0401C] font-semibold mb-1">
                  <span className="material-symbols-outlined text-sm">schedule</span>
                  <span>{event.date} · {event.time}</span>
                </div>

                <h3 className="text-lg font-bold text-[#231918] mb-1">{event.title}</h3>

                <p className="text-xs text-[#584140] flex items-center gap-1 mb-3">
                  <span className="material-symbols-outlined text-sm text-[#A0401C]">location_on</span>
                  <span>{event.location} ({event.address})</span>
                </p>

                <p className="text-xs text-[#584140] leading-relaxed mb-4">
                  {event.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {event.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#FFF0EF] text-[#A0401C]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="text-[11px] text-[#231918] bg-[#FFF4ED] p-2.5 rounded-xl border border-[#FFDAC6]">
                  ✨ {event.recommendedFor}
                </div>
              </div>
            </div>

            {/* Event CTA */}
            <div className="p-5 pt-0 flex items-center gap-3">
              <button
                onClick={() => setSelectedEventForInvite(event)}
                className="flex-1 py-3 px-4 rounded-full bg-[#9D422C] hover:bg-[#802A05] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-base">favorite</span>
                <span>Пойти вдвоем</span>
              </button>

              <button
                onClick={() => showToast(`Вы записались на «${event.title}»!`)}
                className="py-3 px-4 rounded-full bg-[#FFF0EF] hover:bg-[#FDEAE8] text-[#A0401C] text-xs font-semibold cursor-pointer transition-colors"
              >
                Я пойду
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Invite Match to Event Modal */}
      {selectedEventForInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#F5ECE6] relative">
            <button
              onClick={() => setSelectedEventForInvite(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#FFF0EF] text-[#584140] hover:text-[#231918] flex items-center justify-center cursor-pointer transition-colors"
            >
              ✕
            </button>

            <h3 className="text-lg font-bold text-[#231918] mb-1">
              Пригласить пару на мероприятие
            </h3>
            <p className="text-xs text-[#584140] mb-4">
              «{selectedEventForInvite.title}»
            </p>

            <div className="space-y-3 mb-5">
              <label className="block text-xs font-semibold text-[#584140]">
                Выберите, кого хотите пригласить:
              </label>

              {matchedProfiles.map((m) => (
                <div
                  key={m.id}
                  onClick={() => setSelectedMatchId(m.id)}
                  className={`p-3 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all ${
                    selectedMatchId === m.id
                      ? 'bg-[#FFF0EF] border-[#AE2F34]'
                      : 'bg-white border-[#E0BFBD]/40 hover:bg-[#FFF8F7]'
                  }`}
                >
                  <img
                    src={m.avatarUrl}
                    alt={m.name}
                    className="w-10 h-10 rounded-full object-cover border border-[#FF6B6B]"
                  />
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-[#231918]">
                      {m.name}, {m.age}
                    </h4>
                    <p className="text-[11px] text-[#584140]">{m.profession}</p>
                  </div>
                  <span className="text-xs font-bold text-[#AE2F34]">{m.compatibility}%</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedEventForInvite(null)}
                className="flex-1 py-3 px-4 rounded-full border border-[#E0BFBD]/60 text-xs font-semibold text-[#584140] hover:bg-[#FFF8F7] cursor-pointer"
              >
                Отмена
              </button>
              <button
                onClick={handleConfirmInvite}
                className="flex-1 py-3 px-4 rounded-full bg-[#AE2F34] hover:bg-[#9D422C] text-white text-xs font-bold shadow-md cursor-pointer transition-colors"
              >
                Отправить приглашение
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#231918] text-white px-5 py-3 rounded-2xl shadow-xl border border-white/20 text-sm font-semibold flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
          <span className="material-symbols-outlined text-[#FF6B6B]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
