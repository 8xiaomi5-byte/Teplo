import { useState, useEffect, useCallback, useRef } from 'react';
import { Profile, Message, WarmEvent } from './types';
import { INITIAL_PROFILES, POLINA_PROFILE } from './data/profiles';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ProfileView } from './components/ProfileView';
import { DiscoveryView } from './components/DiscoveryView';
import { MatchesView } from './components/MatchesView';
import { MessagesView } from './components/MessagesView';
import { EventsView } from './components/EventsView';
import { FiltersModal, FilterOptions } from './components/Modals/FiltersModal';
import { DateProposalModal } from './components/Modals/DateProposalModal';
import { SympathyModal } from './components/Modals/SympathyModal';
import { AuthModal } from './components/Modals/AuthModal';
import { VerificationModal } from './components/Modals/VerificationModal';
import { useAuth } from './context/AuthContext';
import {
  fetchProfiles,
  saveSympathyToFirestore,
  sendMessageToFirestore,
  subscribeToMessages
} from './lib/firestoreService';
import { recordProfileView, markAccountVerified } from './lib/verificationService';

export default function App() {
  const { user, isAuthLoading, isVerifiedAccount, refreshVerificationStatus } = useAuth();
  const [currentTab, setCurrentTab] = useState<'profile' | 'discovery' | 'matches' | 'messages' | 'events'>('profile');
  const [profiles, setProfiles] = useState<Profile[]>(INITIAL_PROFILES);
  const [selectedProfileId, setSelectedProfileId] = useState<string>(POLINA_PROFILE.id);
  const [matchedProfileIds, setMatchedProfileIds] = useState<string[]>([POLINA_PROFILE.id, 'mikhail-29']);

  // Verification modal state
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [verificationReason, setVerificationReason] = useState<'profile_limit' | 'message_limit' | 'manual'>('profile_limit');
  const [verificationToast, setVerificationToast] = useState<string | null>(null);

  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilterTag, setActiveFilterTag] = useState('Все');
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    ageMin: 22,
    ageMax: 35,
    onlyVerified: false,
    onlyEditorChoice: false,
    city: 'Все',
    interest: 'Все',
  });

  // Global modals triggered from discovery or matches
  const [quickSympathyProfile, setQuickSympathyProfile] = useState<Profile | null>(null);
  const [quickDateProfile, setQuickDateProfile] = useState<Profile | null>(null);

  // Conversations state
  const [conversations, setConversations] = useState<{ profile: Profile; messages: Message[] }[]>([
    {
      profile: POLINA_PROFILE,
      messages: [
        {
          id: 'm-p1',
          senderId: 'polina-27',
          text: 'Привет! Рада взаимному теплу. Очень приятно, что тебе близка идея неспешных прогулок по набережным и паркам!',
          timestamp: '14:20',
        },
        {
          id: 'm-p2',
          senderId: 'me',
          text: 'Привет, Полина! Твоя мысль о том, что близость — это когда можно молчать без неловкости, очень откликнулась.',
          timestamp: '14:25',
        },
        {
          id: 'm-p3',
          senderId: 'polina-27',
          isVoice: true,
          voiceDuration: '0:22 мин',
          timestamp: '14:32',
        },
        {
          id: 'm-p4',
          senderId: 'polina-27',
          text: 'А какую музыку любишь слушать во время утреннего кофе?',
          timestamp: '14:33',
        },
      ],
    },
    {
      profile: INITIAL_PROFILES[1], // Mikhail
      messages: [
        {
          id: 'm-m1',
          senderId: 'mikhail-29',
          text: 'Привет! Увидел, что ты тоже ценишь вещи с историей и душевные разговоры.',
          timestamp: 'Вчера',
        },
      ],
    },
  ]);

  // Check URL parameters for Stripe checkout success or cancel
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('verification') === 'success') {
      const sessionId = params.get('session_id') || undefined;
      if (user) {
        markAccountVerified(user, sessionId).then(() => {
          refreshVerificationStatus();
        }).catch(console.warn);
      }
      setVerificationToast('Поздравляем! Ваш аккаунт успешно подтверждён. Приятных и безопасных знакомств!');
      refreshVerificationStatus();
      // Clean up URL query parameters without reloading
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    } else if (params.get('verification') === 'cancelled') {
      setVerificationToast('Оплата верификации была отменена.');
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [user, refreshVerificationStatus]);

  // Auto-dismiss toast
  useEffect(() => {
    if (verificationToast) {
      const timer = setTimeout(() => setVerificationToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [verificationToast]);

  // Load profiles from Firestore only after auth initialization has completed
  useEffect(() => {
    if (isAuthLoading) return;

    async function loadData() {
      if (user) {
        try {
          const loaded = await fetchProfiles();
          if (loaded && loaded.length > 0) {
            setProfiles(loaded);
          }
        } catch (err) {
          console.warn('Using local fallback profiles:', err);
        }
      }
    }
    loadData();
  }, [isAuthLoading, user]);

  // Subscribe to real-time conversation if user is logged in, auth loaded, and viewing chat
  useEffect(() => {
    if (isAuthLoading || !user) return;
    const activeConv = conversations.find((c) => c.profile.id === selectedProfileId);
    if (!activeConv) return;

    const convId = [user.uid, selectedProfileId].sort().join('_');
    const unsubscribe = subscribeToMessages(convId, (remoteMessages) => {
      if (remoteMessages && remoteMessages.length > 0) {
        setConversations((prev) =>
          prev.map((c) =>
            c.profile.id === selectedProfileId ? { ...c, messages: remoteMessages } : c
          )
        );
      }
    });

    return () => unsubscribe();
  }, [isAuthLoading, user, selectedProfileId]);

  // Initial profile view registration
  const hasInitializedInitialProfile = useRef(false);
  useEffect(() => {
    if (!isAuthLoading && user && !hasInitializedInitialProfile.current && POLINA_PROFILE.id) {
      hasInitializedInitialProfile.current = true;
      recordProfileView(user, POLINA_PROFILE.id).then(() => {
        refreshVerificationStatus();
      }).catch(console.warn);
    }
  }, [isAuthLoading, user, refreshVerificationStatus]);

  const activeProfile = profiles.find((p) => p.id === selectedProfileId) || profiles[0];
  const matchedProfiles = profiles.filter((p) => matchedProfileIds.includes(p.id));

  // Authoritative Handler to view detailed profile
  const handleSelectProfile = async (p: Profile) => {
    // If not logged in, prompt sign in first
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    // Call server to record or verify profile view
    try {
      const result = await recordProfileView(user, p.id);

      if (result.requiresVerification || !result.canView) {
        // User has reached the 10-profile limit and is not verified!
        // Show verification modal instead of viewing the 11th new profile
        setVerificationReason('profile_limit');
        setIsVerificationModalOpen(true);
        return;
      }

      // Allowed to view profile
      setSelectedProfileId(p.id);
      setCurrentTab('profile');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Error checking profile view allowance:', err);
      // Fallback
      setSelectedProfileId(p.id);
      setCurrentTab('profile');
    }
  };

  // Handler for sending sympathy
  const handleSendSympathy = (targetProfile: Profile, messageText?: string, reaction = 'Искреннее тепло') => {
    if (!matchedProfileIds.includes(targetProfile.id)) {
      setMatchedProfileIds((prev) => [...prev, targetProfile.id]);
    }

    // Persist to Cloud Firestore if logged in
    if (user) {
      saveSympathyToFirestore(user.uid, targetProfile, reaction, messageText);
    }

    // Add message to conversation if text exists or standard greeting
    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      senderId: user ? user.uid : 'me',
      text: messageText || `Отправил(а) симпатию «${reaction}» ✨`,
      timestamp: 'Только что',
    };

    setConversations((prev) => {
      const existing = prev.find((c) => c.profile.id === targetProfile.id);
      if (existing) {
        return prev.map((c) =>
          c.profile.id === targetProfile.id ? { ...c, messages: [...c.messages, newMsg] } : c
        );
      } else {
        return [{ profile: targetProfile, messages: [newMsg] }, ...prev];
      }
    });

    if (user) {
      const convId = [user.uid, targetProfile.id].sort().join('_');
      sendMessageToFirestore(convId, {
        senderId: user.uid,
        text: newMsg.text,
        timestamp: newMsg.timestamp
      });
    }
  };

  // Handler for proposing a date
  const handleProposeDate = (
    targetProfile: Profile,
    dateDetails: { venueName: string; address: string; time: string; note: string }
  ) => {
    if (!matchedProfileIds.includes(targetProfile.id)) {
      setMatchedProfileIds((prev) => [...prev, targetProfile.id]);
    }

    const proposalMsg: Message = {
      id: `date-msg-${Date.now()}`,
      senderId: user ? user.uid : 'me',
      text: dateDetails.note,
      timestamp: 'Только что',
      isDateProposal: true,
      dateVenue: {
        name: dateDetails.venueName,
        address: dateDetails.address,
        time: dateDetails.time,
        category: 'Свидание в тёплом месте',
      },
    };

    setConversations((prev) => {
      const existing = prev.find((c) => c.profile.id === targetProfile.id);
      if (existing) {
        return prev.map((c) =>
          c.profile.id === targetProfile.id ? { ...c, messages: [...c.messages, proposalMsg] } : c
        );
      } else {
        return [{ profile: targetProfile, messages: [proposalMsg] }, ...prev];
      }
    });

    if (user) {
      const convId = [user.uid, targetProfile.id].sort().join('_');
      sendMessageToFirestore(convId, {
        senderId: user.uid,
        text: proposalMsg.text,
        timestamp: proposalMsg.timestamp,
        isDateProposal: true,
        dateVenue: proposalMsg.dateVenue
      });
    }

    // Switch to messages
    setSelectedProfileId(targetProfile.id);
    setCurrentTab('messages');
  };

  // Handler to send a chat message
  const handleSendMessage = (profileId: string, text: string) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      senderId: user ? user.uid : 'me',
      text,
      timestamp,
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.profile.id === profileId ? { ...c, messages: [...c.messages, newMsg] } : c
      )
    );

    if (user) {
      const convId = [user.uid, profileId].sort().join('_');
      sendMessageToFirestore(convId, {
        senderId: user.uid,
        text,
        timestamp
      });
    }

    // Friendly auto-reply simulation after 1.5s
    setTimeout(() => {
      const replies = [
        'Как здорово! Очень разделяю твой взгляд на это 💛',
        'Спасибо за такие тёплые слова, на душе сразу светлее стало!',
        'Давай обязательно обсудим это при личной встрече за чаем!',
      ];
      const replyMsg: Message = {
        id: `reply-${Date.now()}`,
        senderId: profileId,
        text: replies[Math.floor(Math.random() * replies.length)],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setConversations((prev) =>
        prev.map((c) =>
          c.profile.id === profileId ? { ...c, messages: [...c.messages, replyMsg] } : c
        )
      );

      if (user) {
        const convId = [user.uid, profileId].sort().join('_');
        sendMessageToFirestore(convId, {
          senderId: profileId,
          text: replyMsg.text,
          timestamp: replyMsg.timestamp
        });
      }
    }, 1500);
  };

  // Handler to update profile
  const handleUpdateProfile = (updated: Partial<Profile>) => {
    setProfiles((prev) =>
      prev.map((p) => (p.id === selectedProfileId ? { ...p, ...updated } : p))
    );
  };

  // Handler to invite to an event
  const handleInviteToEvent = (event: WarmEvent, targetProfile: Profile) => {
    handleProposeDate(targetProfile, {
      venueName: event.title,
      address: `${event.location} (${event.address})`,
      time: `${event.date}, ${event.time}`,
      note: `Привет! Увидел(а) мероприятие «${event.title}» — мне кажется, нам было бы здорово пойти вместе!`,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF8F7] text-[#231918]">
      {/* Toast message */}
      {verificationToast && (
        <div className="fixed top-20 right-6 z-50 bg-[#231918] text-white px-5 py-3 rounded-2xl shadow-2xl border border-emerald-500/40 text-sm font-semibold flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <span className="material-symbols-outlined text-emerald-400">verified</span>
          <span>{verificationToast}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <Header
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab as any);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          if (currentTab !== 'discovery' && q.trim()) {
            setCurrentTab('discovery');
          }
        }}
        onOpenFilters={() => setIsFiltersModalOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenVerification={() => {
          setVerificationReason('manual');
          setIsVerificationModalOpen(true);
        }}
        unreadMessagesCount={1}
        likesCount={matchedProfiles.length}
      />

      {/* Main App Content View */}
      <div className="flex-grow">
        {currentTab === 'profile' && (
          <ProfileView
            profile={activeProfile}
            onBackToDiscovery={() => setCurrentTab('discovery')}
            onSendSympathy={handleSendSympathy}
            onProposeDate={handleProposeDate}
            onUpdateProfile={handleUpdateProfile}
          />
        )}

        {currentTab === 'discovery' && (
          <DiscoveryView
            profiles={profiles}
            onSelectProfile={handleSelectProfile}
            onSendSympathy={(p) => setQuickSympathyProfile(p)}
            onProposeDate={(p) => setQuickDateProfile(p)}
            searchQuery={searchQuery}
            activeFilterTag={activeFilterTag}
            onSelectFilterTag={setActiveFilterTag}
          />
        )}

        {currentTab === 'matches' && (
          <MatchesView
            matchedProfiles={matchedProfiles}
            onSelectProfile={handleSelectProfile}
            onOpenChat={(p) => {
              setSelectedProfileId(p.id);
              setCurrentTab('messages');
            }}
            onProposeDate={(p) => setQuickDateProfile(p)}
          />
        )}

        {currentTab === 'messages' && (
          <MessagesView
            conversations={conversations}
            activeProfileId={selectedProfileId}
            onSelectConversation={(id) => setSelectedProfileId(id)}
            onSendMessage={handleSendMessage}
            onSelectProfile={handleSelectProfile}
            onProposeDate={(p) => setQuickDateProfile(p)}
          />
        )}

        {currentTab === 'events' && (
          <EventsView
            matchedProfiles={matchedProfiles}
            onInviteMatchToEvent={handleInviteToEvent}
          />
        )}
      </div>

      {/* Footer */}
      <Footer />

      {/* Verification Modal */}
      <VerificationModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
        reason={verificationReason}
        onVerifiedSuccess={() => {
          setVerificationToast('Аккаунт подтвержден! Теперь вам доступен неограниченный просмотр анкет.');
        }}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Filters Modal */}
      <FiltersModal
        isOpen={isFiltersModalOpen}
        onClose={() => setIsFiltersModalOpen(false)}
        initialFilters={filterOptions}
        onApply={(opts) => {
          setFilterOptions(opts);
          setCurrentTab('discovery');
        }}
      />

      {/* Quick Sympathy Modal for Discovery/Matches */}
      {quickSympathyProfile && (
        <SympathyModal
          profile={quickSympathyProfile}
          isOpen={!!quickSympathyProfile}
          onClose={() => setQuickSympathyProfile(null)}
          onSend={(msg, reaction) => {
            handleSendSympathy(quickSympathyProfile, msg, reaction);
            setQuickSympathyProfile(null);
          }}
        />
      )}

      {/* Quick Date Proposal Modal for Discovery/Matches */}
      {quickDateProfile && (
        <DateProposalModal
          profile={quickDateProfile}
          isOpen={!!quickDateProfile}
          onClose={() => setQuickDateProfile(null)}
          onConfirm={(details) => {
            handleProposeDate(quickDateProfile, details);
            setQuickDateProfile(null);
          }}
        />
      )}
    </div>
  );
}
