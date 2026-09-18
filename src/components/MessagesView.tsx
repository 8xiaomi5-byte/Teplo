import React, { useState, useRef, useEffect } from 'react';
import { Profile, Message } from '../types';

interface MessagesViewProps {
  conversations: {
    profile: Profile;
    messages: Message[];
  }[];
  activeProfileId: string;
  onSelectConversation: (profileId: string) => void;
  onSendMessage: (profileId: string, text: string) => void;
  onSelectProfile: (profile: Profile) => void;
  onProposeDate: (profile: Profile) => void;
}

export const MessagesView: React.FC<MessagesViewProps> = ({
  conversations,
  activeProfileId,
  onSelectConversation,
  onSendMessage,
  onSelectProfile,
  onProposeDate,
}) => {
  const [inputText, setInputText] = useState('');
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const activeConv =
    conversations.find((c) => c.profile.id === activeProfileId) || conversations[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConv?.messages.length]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConv) return;
    onSendMessage(activeConv.profile.id, inputText.trim());
    setInputText('');
  };

  const handleIcebreakerClick = (text: string) => {
    if (!activeConv) return;
    onSendMessage(activeConv.profile.id, text);
  };

  const toggleVoice = (id: string) => {
    setPlayingVoiceId((prev) => (prev === id ? null : id));
  };

  if (!activeConv) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-[#584140]">
        Нет активных сообщений
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full animate-in fade-in">
      <div className="layer-card rounded-3xl border border-[#F5ECE6] overflow-hidden flex flex-col md:flex-row h-[720px]">
        {/* Left column: Conversation list */}
        <div className="w-full md:w-80 lg:w-96 border-r border-[#F5ECE6] bg-[#FFF8F7]/50 flex flex-col shrink-0">
          <div className="p-4 border-b border-[#F5ECE6] flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#231918]">Сообщения</h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#FFF0EF] text-[#A0401C]">
              {conversations.length} диалога
            </span>
          </div>

          <div className="overflow-y-auto flex-1 divide-y divide-[#F5ECE6]/60">
            {conversations.map(({ profile, messages }) => {
              const lastMsg = messages[messages.length - 1];
              const isSelected = profile.id === activeConv.profile.id;

              return (
                <div
                  key={profile.id}
                  onClick={() => onSelectConversation(profile.id)}
                  className={`p-4 flex items-center gap-3 cursor-pointer transition-colors ${
                    isSelected ? 'bg-white border-l-4 border-[#AE2F34] shadow-xs' : 'hover:bg-white/60'
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={profile.avatarUrl}
                      alt={profile.name}
                      className="w-12 h-12 rounded-full object-cover border border-[#FF6B6B]"
                    />
                    {profile.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white"></span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-[#231918] truncate">
                        {profile.name}, {profile.age}
                      </h4>
                      <span className="text-[10px] text-[#584140]/70">{lastMsg?.timestamp}</span>
                    </div>
                    <p className="text-xs text-[#584140] truncate mt-0.5">
                      {lastMsg?.isVoice
                        ? '🎙️ Голосовое сообщение'
                        : lastMsg?.isDateProposal
                        ? '☕ Приглашение на свидание'
                        : lastMsg?.text || 'Начните общение'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column: Chat Area */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Chat Header */}
          <div className="p-4 border-b border-[#F5ECE6] flex items-center justify-between bg-white">
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => onSelectProfile(activeConv.profile)}
            >
              <div className="relative">
                <img
                  src={activeConv.profile.avatarUrl}
                  alt={activeConv.profile.name}
                  className="w-10 h-10 rounded-full object-cover border border-[#FF6B6B]"
                />
                {activeConv.profile.isOnline && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white"></span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-[#231918]">
                    {activeConv.profile.name}, {activeConv.profile.age}
                  </h3>
                  {activeConv.profile.isVerified && (
                    <span
                      className="material-symbols-outlined text-[#AE2F34] text-sm fill-icon"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      verified
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#584140]">
                  {activeConv.profile.isOnline ? 'Сейчас онлайн' : 'Была недавно'} · {activeConv.profile.profession}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onProposeDate(activeConv.profile)}
                className="px-3 py-1.5 rounded-full bg-[#FFF4ED] hover:bg-[#FFECE0] text-[#9D422C] text-xs font-semibold border border-[#FFDAC6] flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-sm">calendar_month</span>
                <span>Свидание</span>
              </button>

              <button
                onClick={() => onSelectProfile(activeConv.profile)}
                className="w-8 h-8 rounded-full bg-[#FFF0EF] text-[#A0401C] flex items-center justify-center text-xs hover:bg-[#FDEAE8] cursor-pointer"
                title="Открыть анкету"
              >
                <span className="material-symbols-outlined text-base">person</span>
              </button>
            </div>
          </div>

          {/* Icebreaker Suggestions Banner */}
          <div className="bg-[#FFF8F7] px-4 py-2 border-b border-[#E0BFBD]/20 flex items-center gap-2 overflow-x-auto">
            <span className="text-[11px] text-[#A0401C] font-semibold shrink-0">Ледоколы:</span>
            {activeConv.profile.icebreakers.map((ib) => (
              <button
                key={ib.id}
                onClick={() => handleIcebreakerClick(`Привет! Очень откликнулось про: «${ib.question}». Расскажешь подробнее?`)}
                className="text-[11px] text-[#584140] bg-white border border-[#E0BFBD]/40 hover:border-[#A0401C] px-2.5 py-1 rounded-full whitespace-nowrap cursor-pointer transition-colors"
              >
                💬 {ib.question.slice(0, 35)}...
              </button>
            ))}
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FFF8F7]/30">
            {activeConv.messages.map((msg) => {
              const isMine = msg.senderId === 'me';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  {msg.isDateProposal && msg.dateVenue ? (
                    <div className="max-w-md bg-[#FFF4ED] border border-[#FFDAC6] rounded-2xl p-4 shadow-xs">
                      <div className="flex items-center gap-2 text-[#9D422C] font-bold text-xs mb-1">
                        <span className="material-symbols-outlined text-base">calendar_month</span>
                        <span>Приглашение на тёплое свидание</span>
                      </div>
                      <h4 className="text-sm font-bold text-[#231918]">{msg.dateVenue.name}</h4>
                      <p className="text-xs text-[#584140] mt-0.5">{msg.dateVenue.address}</p>
                      <p className="text-xs text-[#A0401C] font-semibold mt-1">
                        Время: {msg.dateVenue.time}
                      </p>
                      {msg.text && (
                        <p className="text-xs text-[#231918] bg-white/80 p-2.5 rounded-xl mt-2 italic">
                          «{msg.text}»
                        </p>
                      )}
                      {!isMine && (
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => onSendMessage(activeConv.profile.id, 'С удовольствием соглашаюсь! Буду ждать этой встречи.')}
                            className="flex-1 py-1.5 rounded-full bg-[#9D422C] text-white text-xs font-semibold hover:bg-[#802A05] cursor-pointer"
                          >
                            Принять приглашение
                          </button>
                        </div>
                      )}
                    </div>
                  ) : msg.isVoice ? (
                    <div
                      className={`flex items-center gap-3 p-3 rounded-2xl max-w-xs ${
                        isMine ? 'bg-[#AE2F34] text-white' : 'bg-white border border-[#E0BFBD]/50 text-[#231918]'
                      }`}
                    >
                      <button
                        onClick={() => toggleVoice(msg.id)}
                        className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-transform active:scale-95 ${
                          isMine ? 'bg-white text-[#AE2F34]' : 'bg-[#FF6B6B] text-white'
                        }`}
                      >
                        <span className="material-symbols-outlined text-base">
                          {playingVoiceId === msg.id ? 'pause' : 'play_arrow'}
                        </span>
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center gap-1 h-4">
                          {[12, 16, 8, 20, 14, 18, 10, 16, 22, 12].map((h, i) => (
                            <span
                              key={i}
                              className={`w-1 rounded-full ${
                                playingVoiceId === msg.id ? 'animate-pulse' : ''
                              } ${isMine ? 'bg-white/80' : 'bg-[#AE2F34]'}`}
                              style={{ height: `${h}px` }}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] opacity-80 mt-1 block">
                          {msg.voiceDuration || '0:24 мин'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`p-3 rounded-2xl text-xs max-w-md ${
                        isMine
                          ? 'bg-[#AE2F34] text-white rounded-br-xs'
                          : 'bg-white text-[#231918] border border-[#E0BFBD]/40 rounded-bl-xs shadow-2xs'
                      }`}
                    >
                      <p className="leading-relaxed">{msg.text}</p>
                    </div>
                  )}

                  <span className="text-[10px] text-[#584140]/60 mt-1 px-1">{msg.timestamp}</span>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Form */}
          <form onSubmit={handleSend} className="p-3 border-t border-[#F5ECE6] flex items-center gap-2 bg-white">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Напишите искреннее и доброе сообщение..."
              className="flex-1 text-xs p-3 rounded-full border border-[#E0BFBD]/50 bg-[#FFF8F7]/50 focus:bg-white focus:border-[#AE2F34] outline-none text-[#231918]"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="w-10 h-10 rounded-full bg-[#AE2F34] disabled:opacity-50 hover:bg-[#9D422C] text-white flex items-center justify-center cursor-pointer transition-colors shadow-xs shrink-0"
              title="Отправить"
            >
              <span className="material-symbols-outlined text-base">send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
