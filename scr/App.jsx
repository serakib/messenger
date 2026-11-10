import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search, MessageCircle, Users, Phone, Bell, Settings, UserRound,
  Plus, MoreHorizontal, Paperclip, Smile, Image as ImageIcon, Mic, Send,
  CheckCheck, Video, PhoneCall, ChevronLeft, Pin, Archive, BellOff,
  ShieldCheck, Palette, LogOut, Trash2, X, ArrowUpRight, Sparkles,
  FileText, CircleHelp, SlidersHorizontal, Moon, Sun, Check, Camera,
  SearchX, Menu, CircleUserRound, Filter, MessageSquarePlus, LoaderCircle,
  Mail, Lock, Eye, EyeOff, File, Download, MoreVertical, CheckCircle2
} from 'lucide-react';
import { isSupabaseConfigured } from './lib/supabase.js';
import {
  signIn, signUp, signOut, getCurrentSession, onAuthStateChange,
  requestPhoneOtp, verifyPhoneOtp, getMyProfile, updateMyProfile
} from './services/auth.js';
import {
  listMyConversations, getMessages, sendMessage, createConversation,
  markConversationRead, subscribeToMessages, subscribeToMyMessages, searchProfiles,
  sendAttachmentMessage, createAttachmentUrl
} from './services/chat.js';

const people = [
  { id: 1, name: 'Ava Mitchell', initials: 'AM', color: 'lavender', online: true, unread: 2, time: '2m', preview: 'That sounds like a plan ✨', status: 'Online now' },
  { id: 2, name: 'Noah Williams', initials: 'NW', color: 'peach', online: true, unread: 0, time: '14m', preview: 'Sent you the photos', status: 'Active 2 min ago' },
  { id: 3, name: 'Design Buddies', initials: 'DB', color: 'mint', online: false, unread: 4, time: '28m', preview: 'Mia: new mockups are ready', status: '5 members', group: true },
  { id: 4, name: 'Mia Chen', initials: 'MC', color: 'rose', online: false, unread: 0, time: '1h', preview: 'You: Thank you so much!', status: 'Active 1 hour ago' },
  { id: 5, name: 'Oliver James', initials: 'OJ', color: 'blue', online: true, unread: 0, time: '3h', preview: 'Voice message · 0:18', status: 'Online now' },
  { id: 6, name: 'Sofia Rivera', initials: 'SR', color: 'gold', online: false, unread: 0, time: 'Yesterday', preview: 'See you tomorrow 👋', status: 'Active yesterday' },
  { id: 7, name: 'Ethan Brooks', initials: 'EB', color: 'teal', online: false, unread: 0, time: 'Tue', preview: 'Thanks for the update', status: 'Active Tuesday' }
];

const seedMessages = {
  1: [
    { id: 1, from: 'them', text: 'Hey! How is your new project going?', time: '10:41 AM' },
    { id: 2, from: 'me', text: 'Pretty well! I’m shaping the first design right now.', time: '10:42 AM', seen: true },
    { id: 3, from: 'them', text: 'That sounds like a plan ✨', time: '10:43 AM' }
  ],
  2: [
    { id: 1, from: 'them', text: 'Hey, I sent you the photos from yesterday.', time: '10:22 AM' },
    { id: 2, from: 'me', text: 'Amazing, I’ll check them out!', time: '10:24 AM', seen: true }
  ],
  3: [
    { id: 1, from: 'them', text: 'Morning everyone! Here are the latest updates.', time: '9:15 AM' },
    { id: 2, from: 'me', text: 'The new direction is looking great.', time: '9:21 AM', seen: true },
    { id: 3, from: 'them', text: 'Mia: new mockups are ready', time: '9:24 AM' }
  ]
};

const navigation = [
  { id: 'Chats', icon: MessageCircle },
  { id: 'People', icon: Users },
  { id: 'Calls', icon: Phone },
  { id: 'Notifications', icon: Bell },
  { id: 'Settings', icon: Settings },
  { id: 'Profile', icon: CircleUserRound }
];

const EMOJIS = ['😊', '❤️', '✨', '😂', '🙌', '🔥', '👍', '🎉', '🥹', '💚', '👏', '🤝'];

function readStored(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function useStoredState(key, initialValue) {
  const [value, setValue] = useState(() => readStored(key, initialValue));
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Local persistence is optional; the app remains usable without it.
    }
  }, [key, value]);
  return [value, setValue];
}

function initialsFor(name = '') {
  return String(name).trim().split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase()).join('') || 'U';
}

function colorFor(name = '') {
  const colors = ['lavender', 'peach', 'mint', 'rose', 'blue', 'gold', 'teal'];
  const seed = Array.from(String(name)).reduce((value, char) => value + char.charCodeAt(0), 0);
  return colors[seed % colors.length];
}

function formatClock(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function formatRelative(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return 'now';
  if (minutes < 60) return minutes + 'm';
  if (minutes < 1440) return Math.floor(minutes / 60) + 'h';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function mapConversation(conversation, userId) {
  const members = Array.isArray(conversation.members) ? conversation.members : [];
  const otherMember = members.find(member => member.user_id !== userId);
  const profile = otherMember?.profile || {};
  const latest = Array.isArray(conversation.latest_message)
    ? [...conversation.latest_message].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
    : conversation.latest_message;
  const name = conversation.type === 'group'
    ? (conversation.title || 'Group conversation')
    : (profile.display_name || profile.username || 'New contact');
  return {
    id: conversation.id,
    name,
    initials: initialsFor(name),
    color: colorFor(name),
    online: false,
    status: conversation.type === 'group' ? members.length + ' members' : 'Orbit member',
    group: conversation.type === 'group',
    peerId: otherMember?.user_id || null,
    avatarUrl: profile.avatar_url || null,
    preview: latest?.body || latest?.attachment_name || 'No messages yet',
    time: formatRelative(latest?.created_at || conversation.updated_at),
    latestAt: latest?.created_at || conversation.updated_at,
    unread: Boolean(latest?.created_at && latest.sender_id !== userId && (!conversation.lastReadAt || new Date(latest.created_at) > new Date(conversation.lastReadAt))),
    lastReadAt: conversation.lastReadAt
  };
}

function Avatar({ person, size = 'md', showOnline = false }) {
  return (
    <span className={'avatar ' + (person?.color || 'lavender') + ' ' + size}>
      {person?.avatarUrl
        ? <img src={person.avatarUrl} alt="" />
        : (person?.initials || initialsFor(person?.name))}
      {showOnline && person?.online && <i className="online-dot" />}
    </span>
  );
}

function App() {
  const [activeNav, setActiveNav] = useState('Chats');
  const [selectedId, setSelectedId] = useState(1);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [demoMessages, setDemoMessages] = useStoredState('orbit.demo.messages.v2', seedMessages);
  const [demoChats, setDemoChats] = useStoredState('orbit.demo.chats.v1', people);
  const [dark, setDark] = useStoredState('orbit.theme.v2', true);
  const [profileName, setProfileName] = useStoredState('orbit.profile.name', 'Rakib Hasan');
  const [archivedIds, setArchivedIds] = useStoredState('orbit.archived.v1', []);
  const [pinnedIds, setPinnedIds] = useStoredState('orbit.pinned.v1', []);
  const [mutedIds, setMutedIds] = useStoredState('orbit.muted.v1', []);
  const [unreadCounts, setUnreadCounts] = useStoredState('orbit.unread.v1', { 1: 2, 3: 4 });
  const [filter, setFilter] = useState('all');
  const [showArchived, setShowArchived] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [mobileChat, setMobileChat] = useState(false);
  const [toast, setToast] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatMode, setNewChatMode] = useState('direct');
  const [groupTitle, setGroupTitle] = useState('');
  const [groupMemberIds, setGroupMemberIds] = useState([]);
  const [newChatSearch, setNewChatSearch] = useState('');
  const [newChatResults, setNewChatResults] = useState([]);
  const [newChatLoading, setNewChatLoading] = useState(false);
  const [activeMenu, setActiveMenu] = useState(false);
  const [inboxMenu, setInboxMenu] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [callModal, setCallModal] = useState('');
  const [settingsTab, setSettingsTab] = useState('Appearance');
  const [authMode, setAuthMode] = useState('signin');
  const [authMethod, setAuthMethod] = useState('email');
  const [authEmail, setAuthEmail] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [phoneOtpCode, setPhoneOtpCode] = useState('');
  const [phoneOtpStage, setPhoneOtpStage] = useState('phone');
  const [authPassword, setAuthPassword] = useState('');
  const [authUsername, setAuthUsername] = useState('');
  const [authDisplayName, setAuthDisplayName] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState('');
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);
  const [profileData, setProfileData] = useState(null);
  const [profileEdit, setProfileEdit] = useState(false);
  const [profileDraft, setProfileDraft] = useState({ display_name: '', username: '', bio: '' });
  const [liveChats, setLiveChats] = useState([]);
  const [liveMessages, setLiveMessages] = useState({});
  const [livePeople, setLivePeople] = useState([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState('');
  const [sendBusy, setSendBusy] = useState(false);
  const [attachmentBusy, setAttachmentBusy] = useState(false);

  const messagesEndRef = useRef(null);
  const searchInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const toastTimerRef = useRef(null);
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;

  const isLive = Boolean(session?.user?.id);
  const currentUserId = session?.user?.id;
  const currentUserName = profileData?.display_name || session?.user?.user_metadata?.display_name || session?.user?.email?.split('@')[0] || 'Account';
  const chatItems = isLive ? liveChats : demoChats;
  const selected = chatItems.find(person => String(person.id) === String(selectedId)) || null;

  const notify = (text) => {
    setToast(text);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(''), 2600);
  };

  useEffect(() => () => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthReady(true);
      return undefined;
    }
    let active = true;
    getCurrentSession()
      .then(nextSession => {
        if (active) setSession(nextSession);
      })
      .catch(error => {
        if (active) setAuthError(error.message || 'Could not restore your session.');
      })
      .finally(() => {
        if (active) setAuthReady(true);
      });
    const unsubscribe = onAuthStateChange(({ session: nextSession }) => {
      if (active) {
        setSession(nextSession);
        setAuthError('');
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isLive) {
      setProfileData(null);
      setLiveChats([]);
      setLiveMessages({});
      setLivePeople([]);
      return undefined;
    }
    let active = true;
    setLiveLoading(true);
    setLiveError('');
    Promise.all([getMyProfile(), listMyConversations()])
      .then(([profile, conversations]) => {
        if (!active) return;
        setProfileData(profile);
        setProfileDraft({
          display_name: profile?.display_name || currentUserName,
          username: profile?.username || '',
          bio: profile?.bio || ''
        });
        const mapped = conversations.map(item => mapConversation(item, currentUserId)).sort((a, b) => new Date(b.latestAt || 0) - new Date(a.latestAt || 0));
        setLiveChats(mapped);
        setSelectedId(previous => mapped.some(item => String(item.id) === String(previous)) ? previous : (mapped[0]?.id || null));
      })
      .catch(error => {
        if (active) setLiveError(error.message || 'Could not load conversations.');
      })
      .finally(() => {
        if (active) setLiveLoading(false);
      });
    return () => { active = false; };
  }, [isLive, currentUserId]);

  useEffect(() => {
    if (!isLive || activeNav !== 'People') return undefined;
    let active = true;
    const timer = window.setTimeout(() => {
      searchProfiles(search)
        .then(results => { if (active) setLivePeople(results); })
        .catch(error => { if (active) setLiveError(error.message || 'Could not search members.'); });
    }, 220);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [isLive, activeNav, search]);

  useEffect(() => {
    if (!isLive || !showNewChat) return undefined;
    let active = true;
    setNewChatLoading(true);
    const timer = window.setTimeout(() => {
      searchProfiles(newChatSearch)
        .then(results => { if (active) setNewChatResults(results); })
        .catch(error => { if (active) setAuthError(error.message || 'Could not search people.'); })
        .finally(() => { if (active) setNewChatLoading(false); });
    }, 180);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [isLive, showNewChat, newChatSearch]);

  const currentMessages = useMemo(() => {
    if (!selected) return [];
    if (!isLive) return demoMessages[selected.id] || [];
    return (liveMessages[selected.id] || []).map(item => ({
      id: item.id,
      from: item.sender_id === currentUserId ? 'me' : 'them',
      text: item.body || '',
      time: formatClock(item.created_at),
      attachment_name: item.attachment_name,
      attachment_path: item.attachment_path,
      attachment_mime: item.attachment_mime,
      attachment_size: item.attachment_size,
      created_at: item.created_at
    }));
  }, [selected, isLive, demoMessages, liveMessages, currentUserId]);

  useEffect(() => {
    if (!isLive) return undefined;
    let unsubscribe = () => {};
    try {
      unsubscribe = subscribeToMyMessages(incoming => {
        const isActiveConversation = String(selectedIdRef.current) === String(incoming.conversation_id);
        setLiveChats(previous => previous.map(item => String(item.id) === String(incoming.conversation_id)
          ? { ...item, preview: incoming.body || incoming.attachment_name || 'Attachment', time: formatRelative(incoming.created_at), latestAt: incoming.created_at, unread: incoming.sender_id !== currentUserId && !isActiveConversation }
          : item).sort((a, b) => new Date(b.latestAt || 0) - new Date(a.latestAt || 0)));
      });
    } catch (error) {
      setLiveError(error.message || 'Conversation updates could not start.');
    }
    return () => unsubscribe();
  }, [isLive, currentUserId]);

  useEffect(() => {
    if (!isLive || !selectedId) return undefined;
    let active = true;
    let unsubscribe = () => {};
    getMessages(selectedId)
      .then(rows => {
        if (active) setLiveMessages(previous => {
          const combined = new Map([...(previous[selectedId] || []), ...rows].map(item => [item.id, item]));
          return { ...previous, [selectedId]: [...combined.values()].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)) };
        });
      })
      .catch(error => {
        if (active) setLiveError(error.message || 'Could not load messages.');
      });
    try {
      unsubscribe = subscribeToMessages(selectedId, incoming => {
        setLiveChats(previous => previous.map(item => String(item.id) === String(selectedId) ? { ...item, preview: incoming.body || incoming.attachment_name || 'Attachment', time: formatRelative(incoming.created_at), latestAt: incoming.created_at, unread: false } : item));
        setLiveMessages(previous => {
          const existing = previous[selectedId] || [];
          if (existing.some(item => item.id === incoming.id)) return previous;
          return { ...previous, [selectedId]: [...existing, incoming] };
        });
      });
    } catch (error) {
      setLiveError(error.message || 'Realtime connection could not start.');
    }
    markConversationRead(selectedId).catch(() => {});
    return () => {
      active = false;
      unsubscribe();
    };
  }, [isLive, selectedId, currentUserId]);

  useEffect(() => {
    if (selectedId) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [selectedId, currentMessages.length]);

  useEffect(() => {
    const handleKeyDown = event => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
      if (event.key === 'Escape') {
        setShowNewChat(false);
        setCallModal('');
        setActiveMenu(false);
        setInboxMenu(false);
        setShowEmoji(false);
        setShowDetails(false);
        setProfileEdit(false);
        setMobileChat(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredPeople = useMemo(() => {
    const query = search.trim().toLowerCase();
    let result = chatItems.filter(person => {
      const archived = archivedIds.map(String).includes(String(person.id));
      if (showArchived !== archived) return false;
      if (filter === 'unread' && !(isLive ? person.unread : Number(unreadCounts[person.id] || 0) > 0)) return false;
      if (filter === 'groups' && !person.group) return false;
      if (query && !(person.name.toLowerCase().includes(query) || String(person.preview || '').toLowerCase().includes(query))) return false;
      return true;
    });
    const pins = pinnedIds.map(String);
    result = [...result].sort((a, b) => {
      const aPinned = pins.includes(String(a.id)) ? 1 : 0;
      const bPinned = pins.includes(String(b.id)) ? 1 : 0;
      if (aPinned !== bPinned) return bPinned - aPinned;
      return new Date(b.latestAt || 0) - new Date(a.latestAt || 0);
    });
    return result;
  }, [chatItems, archivedIds, pinnedIds, filter, search, showArchived, isLive, unreadCounts]);

  const selectChat = (person) => {
    setSelectedId(person.id);
    setActiveNav('Chats');
    setShowArchived(false);
    setFilter('all');
    setMobileChat(true);
    setActiveMenu(false);
    setInboxMenu(false);
    if (!isLive) {
      setUnreadCounts(previous => ({ ...previous, [person.id]: 0 }));
    } else {
      setLiveChats(previous => previous.map(item => String(item.id) === String(person.id) ? { ...item, unread: false } : item));
      markConversationRead(person.id).catch(() => {});
    }
  };

  const sendMessageNow = async event => {
    event?.preventDefault();
    const text = message.trim();
    if (!text || !selected || sendBusy) return;
    if (isLive) {
      setSendBusy(true);
      try {
        const sent = await sendMessage(selected.id, text);
        setLiveMessages(previous => {
          const existing = previous[selected.id] || [];
          return existing.some(item => item.id === sent.id)
            ? previous
            : { ...previous, [selected.id]: [...existing, sent] };
        });
        setLiveChats(previous => previous.map(item => String(item.id) === String(selected.id) ? { ...item, preview: sent.body || sent.attachment_name || 'Attachment', time: formatRelative(sent.created_at), latestAt: sent.created_at, unread: false } : item));
        setMessage('');
        setShowEmoji(false);
      } catch (error) {
        notify(error.message || 'Message could not be sent.');
      } finally {
        setSendBusy(false);
      }
      return;
    }
    const createdAt = new Date().toISOString();
    const item = {
      id: Date.now(),
      from: 'me',
      text,
      time: formatClock(createdAt),
      created_at: createdAt,
      seen: false
    };
    setDemoMessages(previous => ({ ...previous, [selected.id]: [...(previous[selected.id] || []), item] }));
    setDemoChats(previous => previous.map(person => String(person.id) === String(selected.id)
      ? { ...person, preview: text, time: formatRelative(createdAt), latestAt: createdAt, unread: 0 }
      : person));
    setMessage('');
    setShowEmoji(false);
  };

  const toggleId = (setter, id) => setter(previous => {
    const exists = previous.map(String).includes(String(id));
    return exists ? previous.filter(item => String(item) !== String(id)) : [...previous, id];
  });

  const togglePin = () => {
    if (!selected) return;
    const isPinned = pinnedIds.map(String).includes(String(selected.id));
    toggleId(setPinnedIds, selected.id);
    notify(isPinned ? 'Chat unpinned' : 'Chat pinned');
    setActiveMenu(false);
  };

  const toggleMute = () => {
    if (!selected) return;
    const isMuted = mutedIds.map(String).includes(String(selected.id));
    toggleId(setMutedIds, selected.id);
    notify(isMuted ? 'Notifications unmuted on this device' : 'Notifications muted on this device');
    setActiveMenu(false);
  };

  const toggleArchive = () => {
    if (!selected) return;
    const isArchived = archivedIds.map(String).includes(String(selected.id));
    toggleId(setArchivedIds, selected.id);
    notify(isArchived ? 'Chat restored from archive' : 'Chat moved to archive');
    setActiveMenu(false);
    if (!isArchived) setMobileChat(false);
    else setShowArchived(true);
  };

  const openNewChat = () => {
    setNewChatSearch('');
    setNewChatMode('direct');
    setGroupTitle('');
    setGroupMemberIds([]);
    setShowNewChat(true);
    setInboxMenu(false);
  };

  const toggleGroupMember = id => setGroupMemberIds(previous =>
    previous.map(String).includes(String(id))
      ? previous.filter(value => String(value) !== String(id))
      : [...previous, id]
  );

  const createGroupChat = async () => {
    const memberIds = [...new Set(groupMemberIds)];
    if (!memberIds.length || newChatLoading) return;
    const title = groupTitle.trim().slice(0, 80) || 'New group';
    if (!isLive) {
      const createdAt = new Date().toISOString();
      const group = {
        id: 'demo-group-' + Date.now(),
        name: title,
        initials: initialsFor(title),
        color: colorFor(title),
        online: false,
        unread: 0,
        time: formatRelative(createdAt),
        latestAt: createdAt,
        preview: 'Group created',
        status: (memberIds.length + 1) + ' members',
        group: true
      };
      setDemoChats(previous => [group, ...previous]);
      setDemoMessages(previous => ({ ...previous, [group.id]: [] }));
      setShowNewChat(false);
      setNewChatMode('direct');
      selectChat(group);
      notify('Group created on this device');
      return;
    }
    setNewChatLoading(true);
    try {
      const conversation = await createConversation({ memberIds, title, type: 'group' });
      const rows = await listMyConversations();
      const mapped = rows.map(item => mapConversation(item, currentUserId)).sort((a, b) => new Date(b.latestAt || 0) - new Date(a.latestAt || 0));
      setLiveChats(mapped);
      const created = mapped.find(item => String(item.id) === String(conversation.id));
      if (created) selectChat(created);
      setShowNewChat(false);
      setNewChatMode('direct');
      setGroupMemberIds([]);
      setGroupTitle('');
      notify('Group conversation created');
    } catch (error) {
      notify(error.message || 'Could not create the group.');
    } finally {
      setNewChatLoading(false);
    }
  };

  const startConversation = async person => {
    if (!isLive) {
      selectChat(person);
      setShowNewChat(false);
      return;
    }
    const existingConversation = liveChats.find(item => String(item.peerId) === String(person.id));
    if (existingConversation) {
      selectChat(existingConversation);
      setShowNewChat(false);
      return;
    }
    setNewChatLoading(true);
    try {
      const conversation = await createConversation({ memberIds: [person.id], type: 'direct' });
      const rows = await listMyConversations();
      const mapped = rows.map(item => mapConversation(item, currentUserId));
      setLiveChats(mapped);
      const selectedConversation = mapped.find(item => item.id === conversation.id) || mapped.find(item => item.peerId === person.id);
      if (selectedConversation) selectChat(selectedConversation);
      setShowNewChat(false);
      setNewChatSearch('');
      notify('Conversation created');
    } catch (error) {
      notify(error.message || 'Could not start a conversation.');
    } finally {
      setNewChatLoading(false);
    }
  };

  const handleAttachment = async event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !selected) return;
    if (!isLive) {
      const item = {
        id: Date.now(),
        from: 'me',
        text: 'Attachment selected: ' + file.name + ' (demo only)',
        time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
      };
      setDemoMessages(previous => ({ ...previous, [selected.id]: [...(previous[selected.id] || []), item] }));
      notify('Demo attachment added to this device');
      return;
    }
    setAttachmentBusy(true);
    try {
      const sent = await sendAttachmentMessage(selected.id, file);
      setLiveMessages(previous => ({ ...previous, [selected.id]: [...(previous[selected.id] || []), sent] }));
      notify('Attachment sent');
    } catch (error) {
      notify(error.message || 'Attachment could not be sent.');
    } finally {
      setAttachmentBusy(false);
    }
  };

  const downloadAttachment = async item => {
    if (!item.attachment_path) return;
    try {
      const url = await createAttachmentUrl(item.attachment_path);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      notify(error.message || 'Could not open attachment.');
    }
  };

  const handleAuth = async event => {
    event.preventDefault();
    setAuthBusy(true);
    setAuthError('');
    try {
      if (authMethod === 'phone') {
        if (phoneOtpStage === 'phone') {
          await requestPhoneOtp({
            phone: authPhone,
            shouldCreateUser: authMode === 'signup',
            username: authUsername,
            displayName: authDisplayName
          });
          setPhoneOtpStage('code');
          setPhoneOtpCode('');
          notify('Verification code sent. Check your SMS.');
        } else {
          const result = await verifyPhoneOtp({ phone: authPhone, token: phoneOtpCode });
          if (!result.session) throw new Error('Phone verification did not return a session. Please try again.');
          setSession(result.session);
          setPhoneOtpStage('phone');
          setPhoneOtpCode('');
          notify(authMode === 'signup' ? 'Your phone account is ready' : 'Signed in successfully');
        }
      } else if (authMode === 'signup') {
        const result = await signUp({
          email: authEmail,
          password: authPassword,
          username: authUsername,
          displayName: authDisplayName
        });
        if (result.session) {
          setSession(result.session);
          notify('Your account is ready');
        } else {
          notify('Check your email to confirm your account');
          setAuthMode('signin');
        }
      } else {
        const result = await signIn({ email: authEmail, password: authPassword });
        setSession(result.session);
        notify('Signed in successfully');
      }
      setAuthPassword('');
    } catch (error) {
      setAuthError(error.message || 'Authentication failed. Please try again.');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleResendPhoneOtp = async () => {
    setAuthBusy(true);
    setAuthError('');
    try {
      await requestPhoneOtp({
        phone: authPhone,
        shouldCreateUser: authMode === 'signup',
        username: authUsername,
        displayName: authDisplayName
      });
      setPhoneOtpCode('');
      notify('A new verification code has been sent.');
    } catch (error) {
      setAuthError(error.message || 'Could not resend the verification code.');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setSession(null);
      setSelectedId(1);
      setActiveNav('Chats');
      setMobileChat(false);
      notify('Signed out');
    } catch (error) {
      notify(error.message || 'Could not sign out.');
    }
  };

  const saveProfile = async event => {
    event.preventDefault();
    try {
      const updated = await updateMyProfile(profileDraft);
      setProfileData(updated);
      setProfileEdit(false);
      notify('Profile updated');
    } catch (error) {
      setAuthError(error.message || 'Could not update your profile.');
    }
  };

  const visiblePeople = (isLive ? livePeople : people).filter(person => String(person.display_name || person.name || '').toLowerCase().includes(search.trim().toLowerCase()));
  const unreadTotal = isLive
    ? liveChats.filter(person => person.unread).length
    : Object.values(unreadCounts).filter(value => Number(value) > 0).length;
  const isSelectedPinned = selected && pinnedIds.map(String).includes(String(selected.id));
  const isSelectedMuted = selected && mutedIds.map(String).includes(String(selected.id));
  const isSelectedArchived = selected && archivedIds.map(String).includes(String(selected.id));

  return (
    <div className={'app-shell ' + (dark ? 'dark' : 'light') + (showDetails ? ' has-details' : '')}>
      <aside className={'rail' + (mobileChat ? ' rail-mobile-hidden' : '')}>
        <div className="brand-mark">
          <span className="brand-orbit"><MessageCircle size={21} strokeWidth={2.5} /></span>
          <span>orbit</span>
        </div>
        <button className={'rail-user' + (activeNav === 'Profile' ? ' active' : '')} onClick={() => { setActiveNav('Profile'); setMobileChat(false); }} title="Account">
          {isLive ? <Avatar person={{ name: currentUserName, initials: initialsFor(currentUserName), color: 'purple' }} size="sm" /> : <Avatar person={{ name: profileName, initials: initialsFor(profileName), color: 'purple' }} size="sm" />}
        </button>
        <div className="rail-divider" />
        <nav className="rail-navigation" aria-label="Main navigation">
          {navigation.map(item => {
            const Icon = item.icon;
            return (
              <button key={item.id} className={'rail-button' + (activeNav === item.id ? ' active' : '')} onClick={() => { setActiveNav(item.id); setMobileChat(false); setShowArchived(false); }} title={item.id} aria-label={item.id}>
                <Icon size={20} />
                {item.id === 'Chats' && unreadTotal > 0 && <span className="rail-count">{unreadTotal > 9 ? '9+' : unreadTotal}</span>}
              </button>
            );
          })}
        </nav>
        <div className="rail-spacer" />
        <button className="rail-button" title="Help" onClick={() => notify('Help: Orbit is currently in preview mode.')}><CircleHelp size={20} /></button>
        <button className="rail-button" title={dark ? 'Switch to light theme' : 'Switch to dark theme'} onClick={() => setDark(!dark)}>{dark ? <Sun size={20} /> : <Moon size={20} />}</button>
        <button className="rail-bottom" onClick={() => { setActiveNav('Profile'); setMobileChat(false); }} title="Your account">
          {isLive ? <Avatar person={{ name: currentUserName, initials: initialsFor(currentUserName), color: 'purple' }} size="sm" /> : <Avatar person={{ name: profileName, initials: initialsFor(profileName), color: 'purple' }} size="sm" />}
        </button>
      </aside>

      <section className={'inbox-panel' + (mobileChat ? ' inbox-mobile-hidden' : '')}>
        <div className="inbox-heading">
          <div className="heading-title-wrap">
            <h1>{showArchived ? 'Archived' : activeNav === 'Chats' ? 'Chats' : activeNav === 'People' ? 'People' : activeNav}</h1>
            {activeNav === 'Chats' && !showArchived && <span className="heading-count">{chatItems.length}</span>}
          </div>
          <div className="inbox-heading-actions">
            <button className="icon-button" onClick={openNewChat} aria-label="New chat" title="New chat"><MessageSquarePlus size={19} /></button>
            <button className={'icon-button' + (inboxMenu ? ' active' : '')} onClick={() => setInboxMenu(!inboxMenu)} aria-label="More inbox options" title="More"><MoreHorizontal size={20} /></button>
            {inboxMenu && <div className="dropdown-menu inbox-dropdown">
              <button onClick={() => { if (isLive) { Promise.all(liveChats.map(item => markConversationRead(item.id))).then(() => setLiveChats(items => items.map(item => ({ ...item, unread: false })))).catch(() => notify('Could not mark every chat as read')); } else { setUnreadCounts({}); } notify('All chats marked as read'); setInboxMenu(false); }}><CheckCheck size={15} /> Mark all as read</button>
              <button onClick={() => { setShowArchived(!showArchived); setActiveNav('Chats'); setInboxMenu(false); }}><Archive size={15} /> {showArchived ? 'Back to chats' : 'Open archived'}</button>
              <button onClick={() => { setActiveNav('Settings'); setInboxMenu(false); }}><Settings size={15} /> Settings</button>
            </div>}
          </div>
        </div>

        {(activeNav === 'Chats' || activeNav === 'People') && (
          <div className="search-box">
            <Search size={17} />
            <input ref={searchInputRef} value={search} onChange={event => setSearch(event.target.value)} placeholder={activeNav === 'People' ? 'Find people' : 'Search or start a new chat'} aria-label="Search" />
            <kbd>Ctrl K</kbd>
            {search && <button className="clear-search" onClick={() => setSearch('')} aria-label="Clear search"><X size={14} /></button>}
          </div>
        )}

        {activeNav === 'Chats' && (
          <>
            {!showArchived && (
              <div className="inbox-filters" role="tablist" aria-label="Chat filters">
                <button className={'filter-chip' + (filter === 'all' ? ' selected' : '')} onClick={() => setFilter('all')}>All</button>
                <button className={'filter-chip' + (filter === 'unread' ? ' selected' : '')} onClick={() => setFilter('unread')}>Unread {unreadTotal > 0 && <span>{unreadTotal}</span>}</button>
                <button className={'filter-chip' + (filter === 'groups' ? ' selected' : '')} onClick={() => setFilter('groups')}>Groups</button>
              </div>
            )}
            {!showArchived && <button className="archive-row" onClick={() => { setShowArchived(true); setFilter('all'); setSearch(''); }}>
              <span className="archive-icon"><Archive size={18} /></span><strong>Archived</strong><span className="archive-count">{archivedIds.length || ''}<ArrowUpRight size={14} /></span>
            </button>}
            {showArchived && <button className="archive-back" onClick={() => setShowArchived(false)}><ChevronLeft size={16} /> Back to chats</button>}
            <div className="section-caption recent-caption">{showArchived ? 'ARCHIVED CONVERSATIONS' : 'MESSAGES'} <span>{filteredPeople.length}</span></div>
            <div className="people-list">
              {filteredPeople.map(person => (
                <button key={person.id} className={'person-row' + (String(selectedId) === String(person.id) && !showArchived ? ' chosen' : '')} onClick={() => selectChat(person)}>
                  <div className="avatar-wrap"><Avatar person={person} showOnline />{person.group && <span className="group-badge"><Users size={10} /></span>}</div>
                  <div className="person-copy">
                    <div className="person-top"><strong>{person.name}</strong><time>{person.time}</time></div>
                    <div className="person-preview">{person.preview}</div>
                  </div>
                  {pinnedIds.map(String).includes(String(person.id)) && <Pin size={12} className="row-pin" />}
                  {(isLive ? person.unread : Number(unreadCounts[person.id] || 0) > 0) && <span className="unread-badge">{isLive ? '•' : unreadCounts[person.id]}</span>}
                </button>
              ))}
              {filteredPeople.length === 0 && <div className="empty-search"><SearchX size={27} /><p>{showArchived ? 'No archived chats' : filter === 'unread' ? 'You are all caught up' : 'No conversations found'}</p><small>{showArchived ? 'Archived chats will appear here.' : 'Try another search or start a new chat.'}</small></div>}
            </div>
            <div className="inbox-footer"><span className="secure-dot" /><span>{isLive ? 'Connected to your account' : 'Demo data · saved on this device'}</span><ShieldCheck size={14} /></div>
          </>
        )}

        {activeNav === 'People' && (
          <div className="section-preview people-directory">
            <div className="preview-intro"><span className="section-icon"><Users size={20} /></span><div><h2>{isLive ? 'Find people' : 'Your people'}</h2><p>{isLive ? 'Search members who have joined Orbit.' : 'Sample contacts for exploring the interface.'}</p></div></div>
            {isLive && liveError && <div className="inline-error">{liveError}</div>}
            {visiblePeople.map(person => (
              <div className="people-preview-row" key={person.id}>
                <Avatar person={person} showOnline />
                <div className="directory-copy"><strong>{person.display_name || person.name}</strong><small>{person.username ? '@' + person.username : person.status}</small></div>
                <button onClick={() => isLive ? startConversation(person) : selectChat(person)}><MessageCircle size={15} /> Message</button>
              </div>
            ))}
            {isLive && !visiblePeople.length && <div className="empty-search"><Users size={24} /><p>No members found</p><small>Try another name or invite someone to join.</small></div>}
          </div>
        )}

        {activeNav === 'Calls' && <SectionPreview activeNav="Calls" notify={notify} openCall={kind => setCallModal(kind)} />}
        {activeNav === 'Notifications' && <SectionPreview activeNav="Notifications" notify={notify} />}
        {activeNav === 'Settings' && <SettingsSection settingsTab={settingsTab} setSettingsTab={setSettingsTab} dark={dark} setDark={setDark} notify={notify} />}
        {activeNav === 'Profile' && (
          <div className="section-preview profile-preview">
            {!authReady ? (
              <div className="auth-loading"><LoaderCircle size={24} className="spin" /><p>Checking your account…</p></div>
            ) : isLive ? (
              <>
                <div className="profile-cover" />
                <Avatar person={{ name: currentUserName, initials: initialsFor(currentUserName), color: 'purple' }} size="xl" />
                <h2>{currentUserName}</h2><p>{session.user.email || session.user.phone || ''}</p>
                <span className="profile-status"><span className="status-dot" /> Signed in</span>
                <div className="account-card">
                  {profileEdit ? (
                    <form className="profile-edit-form" onSubmit={saveProfile}>
                      <label>Display name<input value={profileDraft.display_name} maxLength={50} onChange={event => setProfileDraft(previous => ({ ...previous, display_name: event.target.value }))} required /></label>
                      <label>Username<input value={profileDraft.username} maxLength={24} onChange={event => setProfileDraft(previous => ({ ...previous, username: event.target.value }))} placeholder="your_username" /></label>
                      <label>About<textarea value={profileDraft.bio} maxLength={160} onChange={event => setProfileDraft(previous => ({ ...previous, bio: event.target.value }))} rows={3} /></label>
                      <div className="form-actions"><button type="button" className="secondary-button" onClick={() => setProfileEdit(false)}>Cancel</button><button className="primary-button" type="submit">Save profile</button></div>
                    </form>
                  ) : (
                    <>
                      <div className="account-info-row"><span>Username</span><strong>{profileData?.username ? '@' + profileData.username : 'Not set'}</strong></div>
                      <div className="account-info-row"><span>About</span><strong>{profileData?.bio || 'No about text yet'}</strong></div>
                      <button className="secondary-button full-button" onClick={() => setProfileEdit(true)}>Edit profile</button>
                    </>
                  )}
                  <button className="settings-tab danger-text" onClick={handleSignOut}><LogOut size={16} /> Sign out</button>
                </div>
              </>
            ) : (
              <AuthSection
                configured={isSupabaseConfigured}
                mode={authMode}
                setMode={mode => { setAuthMode(mode); setPhoneOtpStage('phone'); setPhoneOtpCode(''); setAuthError(''); }}
                method={authMethod}
                setMethod={method => { setAuthMethod(method); setPhoneOtpStage('phone'); setPhoneOtpCode(''); setAuthError(''); }}
                phone={authPhone}
                setPhone={setAuthPhone}
                otpCode={phoneOtpCode}
                setOtpCode={setPhoneOtpCode}
                otpStage={phoneOtpStage}
                setOtpStage={setPhoneOtpStage}
                onResendOtp={handleResendPhoneOtp}
                email={authEmail}
                setEmail={setAuthEmail}
                password={authPassword}
                setPassword={setAuthPassword}
                username={authUsername}
                setUsername={setAuthUsername}
                displayName={authDisplayName}
                setDisplayName={setAuthDisplayName}
                busy={authBusy}
                error={authError}
                onSubmit={handleAuth}
              />
            )}
          </div>
        )}
      </section>

      <main className={'chat-panel' + (mobileChat ? ' chat-mobile-active' : '')}>
        {selected ? (
          <>
            <header className="chat-header">
              <button className="mobile-back icon-button" onClick={() => setMobileChat(false)} aria-label="Back to conversations"><ChevronLeft size={21} /></button>
              <div className="chat-person"><Avatar person={selected} showOnline /><div><strong>{selected.name}</strong><span className={selected.online ? 'status-online' : ''}>{selected.online ? 'Online now' : selected.status}</span></div></div>
              <div className="header-actions">
                <button className="icon-button call-action" onClick={() => setCallModal('Audio call')} title="Audio call"><PhoneCall size={18} /></button>
                <button className="icon-button call-action" onClick={() => setCallModal('Video call')} title="Video call"><Video size={19} /></button>
                <span className="header-separator" />
                <button className={'icon-button' + (showDetails ? ' tinted' : '')} onClick={() => setShowDetails(!showDetails)} title="Contact details" aria-label="Contact details"><SlidersHorizontal size={18} /></button>
                <button className="icon-button" onClick={() => setActiveMenu(!activeMenu)} title="More options" aria-label="More chat options"><MoreVertical size={19} /></button>
                {activeMenu && <div className="dropdown-menu chat-dropdown">
                  <button onClick={togglePin}><Pin size={15} /> {isSelectedPinned ? 'Unpin chat' : 'Pin chat'}</button>
                  <button onClick={toggleMute}><BellOff size={15} /> {isSelectedMuted ? 'Unmute notifications' : 'Mute notifications'}</button>
                  <button onClick={toggleArchive}><Archive size={15} /> {isSelectedArchived ? 'Unarchive chat' : 'Archive chat'}</button>
                  <div className="dropdown-divider" />
                  <button onClick={() => { setShowDetails(true); setActiveMenu(false); }}><UserRound size={15} /> Contact details</button>
                </div>}
              </div>
            </header>

            <div className="messages-scroll">
              <div className="date-pill">TODAY</div>
              <div className="encryption-note"><ShieldCheck size={14} /> {isLive ? 'Messages are stored in your Orbit conversation.' : 'Demo conversation · Messages stay on this device.'}</div>
              <div className="message-stack">
                {currentMessages.map(item => (
                  <div key={item.id} className={'message-line ' + (item.from === 'me' ? 'outgoing' : 'incoming')}>
                    {item.from === 'them' && <Avatar person={selected} size="xs" />}
                    <div className="message-body">
                      {item.text && <div className="bubble">{item.text}</div>}
                      {item.attachment_name && (
                        <button className="attachment-bubble" onClick={() => downloadAttachment(item)}>
                          <span className="attachment-icon"><FileText size={20} /></span>
                          <span className="attachment-copy"><strong>{item.attachment_name}</strong><small>{item.attachment_mime || 'File'} · {item.attachment_size ? Math.max(1, Math.round(item.attachment_size / 1024)) + ' KB' : 'Attachment'}</small></span>
                          <Download size={16} />
                        </button>
                      )}
                      <div className="message-meta">{item.time}{item.from === 'me' && <CheckCheck size={13} className={item.seen ? 'read-check' : ''} />}</div>
                    </div>
                  </div>
                ))}
                {currentMessages.length === 0 && <div className="empty-thread"><div className="empty-thread-icon"><MessageCircle size={27} /></div><h3>Start the conversation</h3><p>Send a message to say hello.</p></div>}
              </div>
              <div ref={messagesEndRef} aria-hidden="true" />
            </div>

            <div className="composer-area">
              {showEmoji && <div className="emoji-tray">{EMOJIS.map(emoji => <button key={emoji} onClick={() => setMessage(previous => previous + emoji)}>{emoji}</button>)}</div>}
              <input ref={fileInputRef} type="file" className="file-input-hidden" accept="image/jpeg,image/png,image/webp,application/pdf,text/plain" onChange={handleAttachment} />
              <form className="composer" onSubmit={sendMessageNow}>
                <button type="button" className="composer-icon" onClick={() => fileInputRef.current?.click()} title="Attach a file" disabled={attachmentBusy}><Paperclip size={19} /></button>
                <input value={message} onChange={event => setMessage(event.target.value)} placeholder={'Message ' + selected.name.split(' ')[0] + '…'} aria-label="Write a message" maxLength={5000} />
                <button type="button" className={'composer-icon' + (showEmoji ? ' emoji-active' : '')} onClick={() => setShowEmoji(!showEmoji)} title="Emoji"><Smile size={20} /></button>
                {!message.trim()
                  ? <button type="button" className="composer-icon mic-icon" onClick={() => notify('Voice messages are not available yet.')} title="Voice message"><Mic size={19} /></button>
                  : <button type="submit" className="send-button" disabled={sendBusy}><Send size={17} /></button>}
              </form>
              {attachmentBusy && <div className="upload-progress"><LoaderCircle size={13} className="spin" /> Uploading attachment…</div>}
            </div>
          </>
        ) : (
          <div className="welcome-panel">
            <div className="welcome-art"><span className="welcome-orbit"><MessageCircle size={42} /></span><span className="welcome-dot dot-one" /><span className="welcome-dot dot-two" /></div>
            <h2>Keep your conversations close.</h2>
            <p>{isLive ? 'Start a conversation with an Orbit member.' : 'Choose a sample chat or explore the interface.'}</p>
            <button className="primary-button" onClick={openNewChat}><Plus size={17} /> New conversation</button>
            <div className="welcome-foot"><ShieldCheck size={14} /> {isLive ? 'Connected to Orbit' : 'Preview mode · No account connected'}</div>
          </div>
        )}
      </main>

      {showDetails && selected && (
        <aside className="details-panel">
          <div className="details-heading"><span>CONTACT DETAILS</span><button className="icon-button" onClick={() => setShowDetails(false)} aria-label="Close details"><X size={17} /></button></div>
          <div className="profile-card">
            <div className="profile-avatar-wrap"><Avatar person={selected} size="xl" />{selected.online && <span className="profile-online" />}</div>
            <h2>{selected.name}</h2><p>{selected.group ? 'Group conversation' : selected.status}</p>
            <div className="profile-actions">
              <button onClick={() => setCallModal('Audio call')}><Phone size={17} /><span>Audio</span></button>
              <button onClick={() => setCallModal('Video call')}><Video size={17} /><span>Video</span></button>
              <button onClick={() => notify('Profile details are shown here.')}><UserRound size={17} /><span>Profile</span></button>
            </div>
          </div>
          <div className="detail-section"><div className="detail-title">ABOUT</div><p className="about-text">{selected.group ? 'A shared space for group conversations.' : selected.status || 'Orbit member'}</p></div>
          <div className="detail-section"><div className="detail-title">CHAT PREFERENCES</div>
            <button className="setting-row" onClick={toggleMute}><span className="setting-icon"><BellOff size={16} /></span><span>{isSelectedMuted ? 'Unmute notifications' : 'Mute notifications'}</span><span className="setting-value">{isSelectedMuted ? 'Off' : 'On'}</span></button>
            <button className="setting-row" onClick={togglePin}><span className="setting-icon"><Pin size={16} /></span><span>{isSelectedPinned ? 'Unpin chat' : 'Pin chat'}</span><span className="setting-arrow">›</span></button>
            <button className="setting-row" onClick={toggleArchive}><span className="setting-icon"><Archive size={16} /></span><span>{isSelectedArchived ? 'Unarchive chat' : 'Archive chat'}</span><span className="setting-arrow">›</span></button>
          </div>
          <div className="details-bottom"><ShieldCheck size={14} /> {isLive ? 'Conversation access is member-based.' : 'Local preview data only.'}</div>
        </aside>
      )}

      {showNewChat && (
        <div className="modal-backdrop" onClick={() => setShowNewChat(false)}>
          <div className="modal-card new-chat-modal" onClick={event => event.stopPropagation()}>
            <div className="modal-title"><div><span className="eyebrow">START SOMETHING</span><h2>New conversation</h2></div><button className="icon-button" onClick={() => setShowNewChat(false)} aria-label="Close"><X size={19} /></button></div>
            <div className="new-chat-modes" role="tablist" aria-label="Conversation type">
              <button className={newChatMode === 'direct' ? 'current' : ''} onClick={() => setNewChatMode('direct')}><MessageCircle size={14} /> Direct</button>
              <button className={newChatMode === 'group' ? 'current' : ''} onClick={() => setNewChatMode('group')}><Users size={14} /> Group</button>
            </div>
            {newChatMode === 'group' && <label className="group-title-field">Group name <input value={groupTitle} onChange={event => setGroupTitle(event.target.value)} placeholder="Give your group a name" maxLength={80} /></label>}
            <div className="search-box modal-search"><Search size={16} /><input value={newChatSearch} onChange={event => setNewChatSearch(event.target.value)} placeholder={isLive ? 'Search Orbit members' : 'Find a sample contact'} autoFocus /></div>
            <p className="modal-subtitle">{newChatMode === 'group' ? 'Add at least one member to create a group.' : (isLive ? 'Choose a member to start a private conversation.' : 'Choose someone from the sample contact list.')}</p>
            <div className="new-chat-list">
              {(isLive ? newChatResults : people.filter(person => person.name.toLowerCase().includes(newChatSearch.toLowerCase()))).map(person => {
                const isChosen = groupMemberIds.map(String).includes(String(person.id));
                const displayPerson = isLive
                  ? { name: person.display_name, initials: initialsFor(person.display_name), color: colorFor(person.display_name), avatarUrl: person.avatar_url }
                  : person;
                return newChatMode === 'group' ? (
                  <button type="button" className={'new-chat-person' + (isChosen ? ' chosen' : '')} key={person.id} onClick={() => toggleGroupMember(person.id)} disabled={newChatLoading} aria-pressed={isChosen}>
                    <Avatar person={displayPerson} />
                    <span><strong>{person.display_name || person.name}</strong><small>{person.username ? '@' + person.username : person.status}</small></span>
                    <span className={'member-check' + (isChosen ? ' checked' : '')}>{isChosen ? <Check size={13} /> : null}</span>
                  </button>
                ) : (
                  <button className="new-chat-person" key={person.id} onClick={() => startConversation(person)} disabled={newChatLoading}>
                    <Avatar person={displayPerson} />
                    <span><strong>{person.display_name || person.name}</strong><small>{person.username ? '@' + person.username : person.status}</small></span>
                    <ArrowUpRight size={17} />
                  </button>
                );
              })}
              {newChatLoading && <div className="modal-loading"><LoaderCircle size={19} className="spin" /> Searching…</div>}
              {!newChatLoading && !(isLive ? newChatResults : people.filter(person => person.name.toLowerCase().includes(newChatSearch.toLowerCase()))).length && <div className="empty-search"><Users size={23} /><p>No people found</p><small>Try a different name.</small></div>}
            </div>
            {newChatMode === 'group' && <div className="group-create-footer"><span>{groupMemberIds.length} selected</span><button className="primary-button" onClick={createGroupChat} disabled={!groupMemberIds.length || newChatLoading}>{newChatLoading ? <LoaderCircle size={15} className="spin" /> : <Users size={15} />} Create group</button></div>}
          </div>
        </div>
      )}

      {callModal && <div className="modal-backdrop" onClick={() => setCallModal('')}><div className="call-card" onClick={event => event.stopPropagation()}>
        <div className="call-glow"><Avatar person={selected || { name: 'Orbit', initials: 'O', color: 'mint' }} size="xl" /></div>
        <span className="eyebrow">{callModal.toUpperCase()} PREVIEW</span><h2>{selected?.name || 'Orbit'}</h2>
        <p>Live audio and video calling are not connected yet.</p>
        <div className="call-controls"><button onClick={() => notify('Microphone controls will be available with calling.')}><Mic size={19} /></button><button className="end-call" onClick={() => setCallModal('')}><Phone size={20} /></button><button onClick={() => notify('Camera controls will be available with calling.')}><Video size={19} /></button></div>
      </div></div>}

      {toast && <div className="toast"><Check size={16} />{toast}</div>}
      {!isLive && <div className="demo-label"><span /> DEMO MODE</div>}
    </div>
  );
}

function SectionPreview({ activeNav, notify, openCall }) {
  if (activeNav === 'Calls') {
    const calls = [
      ['Ava Mitchell', 'Today · 10:40 AM', 'incoming'],
      ['Oliver James', 'Yesterday · 6:22 PM', 'outgoing'],
      ['Mia Chen', 'Monday · 3:15 PM', 'missed']
    ];
    return <div className="section-preview">
      <div className="preview-intro"><span className="section-icon"><Phone size={20} /></span><div><h2>Calls</h2><p>Your recent call activity.</p></div></div>
      {calls.map(([name, time, type]) => <div className="call-row" key={name}><Avatar person={people.find(person => person.name === name) || people[0]} /><div><strong>{name}</strong><small>{time}</small></div><span className={'call-type ' + type}>{type === 'missed' ? 'Missed' : type === 'incoming' ? 'Incoming' : 'Outgoing'}</span><button className="icon-button" onClick={() => openCall('Audio call')} title="Call"><PhoneCall size={17} /></button></div>)}
      <div className="preview-footnote">Calling is a visual preview until a calling service is added.</div>
    </div>;
  }
  if (activeNav === 'Notifications') {
    return <div className="section-preview">
      <div className="preview-intro"><span className="section-icon"><Bell size={20} /></span><div><h2>Notifications</h2><p>Updates from your conversations.</p></div></div>
      {[['Ava Mitchell', 'sent you a message', '2 min ago'], ['Design Buddies', 'shared a new update', '28 min ago'], ['Noah Williams', 'sent you photos', '1 hour ago']].map(([name, description, time]) => <div className="notification-row" key={name}><span className="notification-icon"><Bell size={16} /></span><div><strong>{name}</strong><p>{description}</p><small>{time}</small></div></div>)}
      <div className="preview-footnote">Push notifications are not enabled in this release.</div>
    </div>;
  }
  return <div className="section-preview" />;
}

function SettingsSection({ settingsTab, setSettingsTab, dark, setDark, notify }) {
  const tabs = ['Appearance', 'Notifications', 'Privacy', 'Storage'];
  return <div className="section-preview settings-preview">
    <div className="preview-intro"><span className="section-icon"><Settings size={20} /></span><div><h2>Settings</h2><p>Personalize how Orbit works on this device.</p></div></div>
    <div className="settings-layout">
      <div className="settings-tabs">{tabs.map(tab => <button key={tab} className={'settings-tab' + (settingsTab === tab ? ' current' : '')} onClick={() => setSettingsTab(tab)}>{tab}<span>›</span></button>)}</div>
      <div className="settings-content">
        <h3>{settingsTab}</h3>
        {settingsTab === 'Appearance' && <>
          <p>Choose the theme used by your Orbit workspace.</p>
          <div className="theme-options">
            <button className={'theme-option' + (dark ? ' current' : '')} onClick={() => setDark(true)}><span className="theme-preview theme-dark"><Moon size={18} /></span><strong>Dark</strong><small>Default night view</small></button>
            <button className={'theme-option' + (!dark ? ' current' : '')} onClick={() => setDark(false)}><span className="theme-preview theme-light"><Sun size={18} /></span><strong>Light</strong><small>Bright workspace</small></button>
          </div>
        </>}
        {settingsTab === 'Notifications' && <><p>Notification preferences are stored locally in this preview.</p><div className="settings-note"><Bell size={17} /><span>Per-chat mute controls are available from the conversation menu. Browser push notifications are not connected.</span></div></>}
        {settingsTab === 'Privacy' && <><p>Understand what is active in this release.</p><div className="settings-note"><ShieldCheck size={17} /><span>{'Demo messages stay in this browser. Signed-in messages use your configured Orbit backend; end-to-end encryption is not implemented.'}</span></div></>}
        {settingsTab === 'Storage' && <><p>Clear only the sample data saved in this browser.</p><button className="secondary-button" onClick={() => { Object.keys(localStorage).filter(key => key.startsWith('orbit.')).forEach(key => localStorage.removeItem(key)); notify('Local Orbit data cleared. Refresh to reset the demo.'); }}><Trash2 size={15} /> Clear local demo data</button></>}
      </div>
    </div>
  </div>;
}

function AuthSection({
  configured, mode, setMode, method, setMethod,
  phone, setPhone, otpCode, setOtpCode, otpStage, onResendOtp,
  email, setEmail, password, setPassword, username, setUsername,
  displayName, setDisplayName, busy, error, onSubmit
}) {
  if (!configured) {
    return <div className="auth-card">
      <div className="auth-emblem"><CircleUserRound size={25} /></div>
      <span className="eyebrow">ACCOUNT SETUP</span>
      <h2>Connect your Orbit account</h2>
      <p>The login and live messaging screens are ready. To activate accounts, connect the Supabase project using the setup guide.</p>
      <div className="backend-status"><span className="status-dot offline" /> Backend not configured</div>
      <a className="primary-button" href="https://github.com/serakib/messenger/blob/main/docs/FREE_HOSTING_SETUP.md" target="_blank" rel="noreferrer">Open setup guide <ArrowUpRight size={16} /></a>
      <div className="auth-demo-note"><ShieldCheck size={15} /> You can still use the local demo without an account.</div>
    </div>;
  }
  return <div className="auth-card">
    <div className="auth-emblem"><MessageCircle size={25} /></div>
    <span className="eyebrow">ORBIT ACCOUNT</span>
    <h2>{mode === 'signup' ? 'Create your account' : 'Welcome back'}</h2>
    <p>{mode === 'signup' ? 'Join Orbit and start talking to people.' : 'Sign in to sync your conversations.'}</p>
    <div className="auth-method-switch" role="tablist" aria-label="Choose sign-in method">
      <button type="button" role="tab" aria-selected={method === 'email'} className={method === 'email' ? 'active' : ''} onClick={() => setMethod('email')}><Mail size={14} /> Email</button>
      <button type="button" role="tab" aria-selected={method === 'phone'} className={method === 'phone' ? 'active' : ''} onClick={() => setMethod('phone')}><Phone size={14} /> Phone OTP</button>
    </div>
    <form className="auth-form" onSubmit={onSubmit}>
      {mode === 'signup' && <>
        <label>Display name<div className="auth-input"><UserRound size={16} /><input value={displayName} onChange={event => setDisplayName(event.target.value)} placeholder="Your name" required maxLength={50} /></div></label>
        <label>Username<div className="auth-input"><span>@</span><input value={username} onChange={event => setUsername(event.target.value)} placeholder="your_username" minLength={3} maxLength={24} pattern="[A-Za-z0-9_]{3,24}" required /></div></label>
      </>}
      {method === 'email' ? <>
        <label>Email address<div className="auth-input"><Mail size={16} /><input type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" required autoComplete="email" /></div></label>
        <label>Password<div className="auth-input"><Lock size={16} /><input type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder="At least 8 characters" required minLength={8} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} /></div></label>
      </> : <>
        {otpStage === 'phone' ? (
          <>
            <label>Mobile number<div className="auth-input"><Phone size={16} /><input type="tel" value={phone} onChange={event => setPhone(event.target.value)} placeholder="+8801XXXXXXXXX" required autoComplete="tel" inputMode="tel" /></div></label>
            <p className="auth-field-note">Include your country code, for example +880 for Bangladesh.</p>
          </>
        ) : (
          <>
            <label>6-digit verification code<div className="auth-input"><ShieldCheck size={16} /><input type="text" value={otpCode} onChange={event => setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Enter SMS code" required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} /></div></label>
            <p className="auth-field-note">Enter the code sent to {phone}. Check your SMS inbox.</p>
            <button type="button" className="secondary-button full-button" onClick={onResendOtp} disabled={busy}>Resend code</button>
            <button type="button" className="auth-back-link" onClick={() => { setOtpStage('phone'); setOtpCode(''); }}>Change phone number</button>
          </>
        )}
      </>}
      {error && <div className="inline-error">{error}</div>}
      <button type="submit" className="primary-button full-button" disabled={busy}>{busy ? <LoaderCircle size={16} className="spin" /> : null}{method === 'phone' ? (otpStage === 'phone' ? 'Send verification code' : mode === 'signup' ? 'Verify & create account' : 'Verify & sign in') : (mode === 'signup' ? 'Create account' : 'Sign in')}</button>
    </form>
    <div className="auth-switch">{mode === 'signup' ? 'Already have an account?' : 'New to Orbit?'} <button onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}>{mode === 'signup' ? 'Sign in' : 'Create account'}</button></div>
    <div className="auth-demo-note"><ShieldCheck size={15} /> {method === 'phone' ? 'Phone sign-in uses a one-time SMS code. Your carrier may charge for SMS.' : 'Email confirmation may be required depending on your backend settings.'}</div>
  </div>;
}

export default App;
