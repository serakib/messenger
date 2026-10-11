import React, { useMemo, useState } from 'react';
import {
  Search, MessageCircle, Users, Phone, Bell, Settings, UserRound,
  Plus, MoreHorizontal, Paperclip, Smile, Image, Mic, Send, CheckCheck,
  Video, PhoneCall, ChevronLeft, Pin, Archive, BellOff, ShieldCheck,
  Palette, LogOut, Trash2, X, Menu, ArrowUpRight, Sparkles, FileText,
  CircleHelp, SlidersHorizontal, Moon, Sun, Check, Camera, SearchX
} from 'lucide-react';

const people = [
  { id: 1, name: 'Ava Mitchell', initials: 'AM', color: 'lavender', online: true, unread: 2, time: '2m', preview: 'That sounds like a plan ✨', status: 'Online now' },
  { id: 2, name: 'Noah Williams', initials: 'NW', color: 'peach', online: true, unread: 0, time: '14m', preview: 'Sent you the photos', status: 'Active 2 min ago' },
  { id: 3, name: 'Design Buddies', initials: 'DB', color: 'mint', online: false, unread: 4, time: '28m', preview: 'Mia: new mockups are ready', status: '5 members' , group: true},
  { id: 4, name: 'Mia Chen', initials: 'MC', color: 'rose', online: false, unread: 0, time: '1h', preview: 'You: Thank you so much!', status: 'Active 1 hour ago' },
  { id: 5, name: 'Oliver James', initials: 'OJ', color: 'blue', online: true, unread: 0, time: '3h', preview: 'Voice message · 0:18', status: 'Online now' },
  { id: 6, name: 'Sofia Rivera', initials: 'SR', color: 'gold', online: false, unread: 0, time: 'Yesterday', preview: 'See you tomorrow 👋', status: 'Active yesterday' },
  { id: 7, name: 'Ethan Brooks', initials: 'EB', color: 'teal', online: false, unread: 0, time: 'Tue', preview: 'Thanks for the update', status: 'Active Tuesday' },
];

const seedMessages = {
  1: [
    { id: 1, from: 'them', text: 'Hey! How is your new project going?', time: '10:41 AM' },
    { id: 2, from: 'me', text: 'Pretty well! I’m shaping the first design right now.', time: '10:42 AM', seen: true },
    { id: 3, from: 'them', text: 'That sounds like a plan ✨', time: '10:43 AM' },
  ],
  2: [
    { id: 1, from: 'them', text: 'Hey, I sent you the photos from yesterday.', time: '10:22 AM' },
    { id: 2, from: 'me', text: 'Amazing, I’ll check them out!', time: '10:24 AM', seen: true },
  ],
  3: [
    { id: 1, from: 'them', text: 'Morning everyone! Here are the latest updates.', time: '9:15 AM' },
    { id: 2, from: 'me', text: 'The new direction is looking great.', time: '9:21 AM', seen: true },
    { id: 3, from: 'them', text: 'Mia: new mockups are ready', time: '9:24 AM' },
  ],
};

const navItems = [
  { id: 'Chats', icon: MessageCircle },
  { id: 'People', icon: Users },
  { id: 'Calls', icon: Phone },
  { id: 'Notifications', icon: Bell },
  { id: 'Settings', icon: Settings },
];

function Avatar({ person, size = 'md', showOnline = false }) {
  return <span className={`avatar ${person.color || 'lavender'} ${size}`}>
    {person.initials || person.name?.split(' ').map(w => w[0]).slice(0,2).join('')}
    {showOnline && person.online && <i className="online-dot" />}
  </span>;
}

function App() {
  const [activeNav, setActiveNav] = useState('Chats');
  const [selectedId, setSelectedId] = useState(1);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState(seedMessages);
  const [showProfile, setShowProfile] = useState(true);
  const [mobileChat, setMobileChat] = useState(false);
  const [dark, setDark] = useState(false);
  const [toast, setToast] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [activeMenu, setActiveMenu] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [callModal, setCallModal] = useState('');
  const [settingsTab, setSettingsTab] = useState('Appearance');

  const selected = people.find(p => p.id === selectedId) || people[0];
  const currentMessages = messages[selectedId] || [];
  const filteredPeople = useMemo(() => people.filter(p => p.name.toLowerCase().includes(search.toLowerCase())), [search]);

  const notify = (text) => { setToast(text); window.setTimeout(() => setToast(''), 2400); };
  const sendMessage = (e) => {
    e?.preventDefault();
    if (!message.trim()) return;
    const item = { id: Date.now(), from: 'me', text: message.trim(), time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}), seen: false };
    setMessages(prev => ({ ...prev, [selectedId]: [...(prev[selectedId] || []), item] }));
    setMessage('');
    setShowEmoji(false);
  };
  const selectPerson = (id) => { setSelectedId(id); setMobileChat(true); setActiveNav('Chats'); setActiveMenu(false); };
  const addEmoji = (emoji) => setMessage(prev => prev + emoji);

  return <div className={`app-shell ${dark ? 'dark' : ''}`}>
    <aside className={`rail ${mobileChat ? 'rail-mobile-hidden' : ''}`}>
      <div className="brand-mark"><span className="brand-orbit"><MessageCircle size={21} strokeWidth={2.6}/></span><span>orbit</span></div>
      <button className={`rail-user ${activeNav === 'Profile' ? 'active' : ''}`} onClick={() => {setActiveNav('Profile');setMobileChat(false)}} title="Profile"><Avatar person={{name:'Rakib Hasan', initials:'RH', color:'purple'}} size="sm"/></button>
      <div className="rail-divider"/>
      {navItems.map(item => <button key={item.id} className={`rail-button ${activeNav === item.id ? 'active' : ''}`} onClick={() => {setActiveNav(item.id);setMobileChat(false)}} title={item.id}>
        <item.icon size={21}/>{item.id === 'Chats' && <span className="rail-count">2</span>}
      </button>)}
      <div className="rail-spacer"/>
      <button className="rail-button" title="Help" onClick={() => notify('Help center is a demo feature')}><CircleHelp size={20}/></button>
      <button className="rail-button" title="Toggle theme" onClick={() => setDark(!dark)}>{dark ? <Sun size={20}/> : <Moon size={20}/>}</button>
      <div className="rail-bottom"><Avatar person={{name:'Rakib Hasan', initials:'RH', color:'purple'}} size="sm"/></div>
    </aside>

    <section className={`inbox-panel ${mobileChat ? 'inbox-mobile-hidden' : ''}`}>
      <div className="inbox-heading">
        <div><div className="eyebrow">YOUR SPACE</div><h1>{activeNav === 'Chats' ? 'Messages' : activeNav}</h1></div>
        <button className="icon-button create-button" onClick={() => setShowNewChat(true)} aria-label="New chat"><Plus size={20}/></button>
      </div>
      <div className="search-box"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search conversations"/><kbd>⌘ K</kbd></div>
      <div className="inbox-filters"><button className="filter-chip selected">All <span>12</span></button><button className="filter-chip" onClick={()=>notify('Unread filter preview')}>Unread</button><button className="filter-chip" onClick={()=>notify('Groups filter preview')}>Groups</button></div>
      {activeNav === 'Chats' ? <>
        <div className="section-caption">PINNED <Pin size={12}/></div>
        <button className={`person-row ${selectedId===1?'chosen':''}`} onClick={()=>selectPerson(1)}>
          <div className="avatar-wrap"><Avatar person={people[0]} showOnline/><span className="pin-mini"><Pin size={10}/></span></div>
          <div className="person-copy"><div className="person-top"><strong>Ava Mitchell</strong><time>2m</time></div><div className="person-preview">That sounds like a plan ✨</div></div><span className="unread-badge">2</span>
        </button>
        <div className="section-caption recent-caption">ALL MESSAGES <span>{filteredPeople.length}</span></div>
        <div className="people-list">
          {filteredPeople.filter(p=>p.id!==1).map(p=><button key={p.id} className={`person-row ${selectedId===p.id?'chosen':''}`} onClick={()=>selectPerson(p.id)}>
            <div className="avatar-wrap"><Avatar person={p} showOnline/>{p.group && <span className="group-badge"><Users size={10}/></span>}</div>
            <div className="person-copy"><div className="person-top"><strong>{p.name}</strong><time>{p.time}</time></div><div className="person-preview">{p.preview}</div></div>
            {p.unread>0 && <span className="unread-badge">{p.unread}</span>}
          </button>)}
          {filteredPeople.length===0 && <div className="empty-search"><SearchX size={25}/><p>No conversations found</p><small>Try another name</small></div>}
        </div>
        <div className="inbox-footer"><span className="secure-dot"/><span>Messages are private</span><ShieldCheck size={14}/></div>
      </> : <SectionPreview activeNav={activeNav} settingsTab={settingsTab} setSettingsTab={setSettingsTab} notify={notify} setActiveNav={setActiveNav}/>}
    </section>

    <main className={`chat-panel ${mobileChat ? 'chat-mobile-active' : ''}`}>
      <header className="chat-header">
        <button className="mobile-back icon-button" onClick={()=>setMobileChat(false)} aria-label="Back to conversations"><ChevronLeft size={21}/></button>
        <div className="chat-person"><Avatar person={selected} showOnline/><div><strong>{selected.name}</strong><span className={selected.online?'status-online':''}>{selected.online?'Active now':selected.status}</span></div></div>
        <div className="header-actions">
          <button className="icon-button call-action" onClick={()=>setCallModal('Audio call')} title="Audio call"><PhoneCall size={18}/></button>
          <button className="icon-button call-action" onClick={()=>setCallModal('Video call')} title="Video call"><Video size={19}/></button>
          <span className="header-separator"/>
          <button className={`icon-button ${showProfile?'tinted':''}`} onClick={()=>setShowProfile(!showProfile)} title="Toggle details"><SlidersHorizontal size={18}/></button>
          <button className="icon-button" onClick={()=>setActiveMenu(!activeMenu)} title="More options"><MoreHorizontal size={20}/></button>
          {activeMenu && <div className="dropdown-menu">
            <button onClick={()=>{notify('Chat pinned');setActiveMenu(false)}}><Pin size={15}/> Pin conversation</button>
            <button onClick={()=>{notify('Notifications muted');setActiveMenu(false)}}><BellOff size={15}/> Mute notifications</button>
            <button onClick={()=>{notify('Conversation archived');setActiveMenu(false)}}><Archive size={15}/> Archive chat</button>
            <button className="danger" onClick={()=>{notify('Report flow is a demo');setActiveMenu(false)}}><ShieldCheck size={15}/> Report user</button>
          </div>}
        </div>
      </header>

      <div className="conversation-topline"><span>Today</span><i/></div>
      <div className="messages-scroll" onClick={()=>activeMenu && setActiveMenu(false)}>
        <div className="encryption-note"><ShieldCheck size={14}/> Messages and calls are end-to-end encrypted in this preview.</div>
        <div className="message-stack">
          {currentMessages.map(m=><div key={m.id} className={`message-line ${m.from==='me'?'outgoing':'incoming'}`}>
            {m.from==='them' && <Avatar person={selected} size="xs"/>}
            <div className="message-body"><div className="bubble">{m.text}</div><div className="message-meta">{m.time}{m.from==='me' && <CheckCheck size={13} className={m.seen?'read-check':''}/>}</div></div>
          </div>)}
        </div>
        {selectedId===1 && <div className="typing-row"><Avatar person={selected} size="xs"/><div className="typing-bubble"><i/><i/><i/></div><span>Ava is typing</span></div>}
      </div>
      <div className="composer-area">
        {showEmoji && <div className="emoji-tray">{['😊','❤️','✨','😂','🙌','🔥','👍','🎉'].map(e=><button key={e} onClick={()=>addEmoji(e)}>{e}</button>)}</div>}
        <form className="composer" onSubmit={sendMessage}>
          <button type="button" className="composer-icon" onClick={()=>notify('Attachment picker is a UI demo')} title="Attach file"><Paperclip size={19}/></button>
          <button type="button" className="composer-icon image-icon" onClick={()=>notify('Photo picker is a UI demo')} title="Add image"><Image size={19}/></button>
          <input value={message} onChange={e=>setMessage(e.target.value)} placeholder={`Message ${selected.name.split(' ')[0]}...`} aria-label="Write a message"/>
          <button type="button" className={`composer-icon ${showEmoji?'emoji-active':''}`} onClick={()=>setShowEmoji(!showEmoji)} title="Emoji"><Smile size={20}/></button>
          <button type="button" className="composer-icon mic-icon" onClick={()=>notify('Voice recording is a UI demo')} title="Voice message"><Mic size={19}/></button>
          <button type="submit" className="send-button" disabled={!message.trim()} aria-label="Send message"><Send size={17}/></button>
        </form>
        <div className="composer-hint"><span><strong>Enter</strong> to send</span><span>Made for meaningful conversations <Sparkles size={12}/></span></div>
      </div>
    </main>

    {showProfile && <aside className={`details-panel ${mobileChat?'details-mobile':''}`}>
      <div className="details-heading"><span>CONTACT DETAILS</span><button className="icon-button" onClick={()=>setShowProfile(false)} aria-label="Close details"><X size={17}/></button></div>
      <div className="profile-card"><div className="profile-avatar-wrap"><Avatar person={selected} size="xl"/>{selected.online && <span className="profile-online"/>}</div><h2>{selected.name}</h2><p>@{selected.name.toLowerCase().replaceAll(' ','.')}</p><div className="profile-status"><span className={selected.online?'status-dot':''}/>{selected.online?'Online now':selected.status}</div>
        <div className="profile-actions"><button onClick={()=>notify('Audio call is a UI demo')}><Phone size={17}/><span>Audio</span></button><button onClick={()=>notify('Video call is a UI demo')}><Video size={17}/><span>Video</span></button><button onClick={()=>notify('Profile opened in preview')}><UserRound size={17}/><span>Profile</span></button></div>
      </div>
      <div className="detail-section"><div className="detail-title">ABOUT <button className="text-action" onClick={()=>notify('Edit profile is a UI demo')}>Edit</button></div><p className="about-text">Creative mind, curious soul. Always up for a good conversation and new ideas. 🌱</p></div>
      <div className="detail-section"><div className="detail-title">SHARED MEDIA <button className="text-action" onClick={()=>notify('Media gallery is a UI demo')}>View all</button></div><div className="media-grid"><div className="media-tile media-one"><Image size={22}/><span>Design</span></div><div className="media-tile media-two"><FileText size={22}/><span>Brief.pdf</span></div><div className="media-tile media-three"><Sparkles size={22}/><span>Inspo</span></div></div></div>
      <div className="detail-section"><div className="detail-title">CHAT PREFERENCES</div><button className="setting-row" onClick={()=>notify('Notifications muted')}><span className="setting-icon"><BellOff size={16}/></span><span>Mute notifications</span><span className="setting-arrow">›</span></button><button className="setting-row" onClick={()=>notify('Theme settings opened')}><span className="setting-icon"><Palette size={16}/></span><span>Chat theme</span><span className="setting-value">Lavender</span></button><button className="setting-row" onClick={()=>notify('Privacy controls are a UI demo')}><span className="setting-icon"><ShieldCheck size={16}/></span><span>Privacy & support</span><span className="setting-arrow">›</span></button></div>
      <div className="details-bottom"><ShieldCheck size={14}/> Your privacy matters</div>
    </aside>}

    {showNewChat && <div className="modal-backdrop" onClick={()=>setShowNewChat(false)}><div className="modal-card" onClick={e=>e.stopPropagation()}><div className="modal-title"><div><span className="eyebrow">START SOMETHING</span><h2>New conversation</h2></div><button className="icon-button" onClick={()=>setShowNewChat(false)}><X size={19}/></button></div><p className="modal-subtitle">Choose someone to start a conversation with.</p>{people.map(p=><button className="new-chat-person" key={p.id} onClick={()=>{selectPerson(p.id);setShowNewChat(false)}}><Avatar person={p}/><span><strong>{p.name}</strong><small>{p.status}</small></span><ArrowUpRight size={17}/></button>)}</div></div>}
    {callModal && <div className="modal-backdrop" onClick={()=>setCallModal('')}><div className="call-card" onClick={e=>e.stopPropagation()}><div className="call-glow"><Avatar person={selected} size="xl"/></div><span className="eyebrow">{callModal.toUpperCase()} PREVIEW</span><h2>{selected.name}</h2><p>This visual demo does not connect real calls.</p><div className="call-controls"><button onClick={()=>notify('Microphone control preview')}><Mic size={19}/></button><button className="end-call" onClick={()=>setCallModal('')}><Phone size={20}/></button><button onClick={()=>notify('Camera control preview')}><Video size={19}/></button></div></div></div>}
    {toast && <div className="toast"><Check size={16}/>{toast}</div>}
    <div className="demo-label"><span/> UI PREVIEW</div>
  </div>;
}

function SectionPreview({activeNav, settingsTab, setSettingsTab, notify, setActiveNav}) {
  if (activeNav === 'People') return <div className="section-preview"><div className="preview-banner"><Users size={22}/><h2>Your people</h2><p>Keep your favorite people close.</p></div>{people.map(p=><div className="people-preview-row" key={p.id}><Avatar person={p} showOnline/><div><strong>{p.name}</strong><small>{p.status}</small></div><button onClick={()=>{notify(`Opening ${p.name}'s chat`);setActiveNav('Chats')}}>Message</button></div>)}</div>;
  if (activeNav === 'Calls') return <div className="section-preview"><div className="preview-banner"><Phone size={22}/><h2>Calls</h2><p>Your recent conversations, all in one place.</p></div>{[['Ava Mitchell','Today · 10:40 AM','incoming'],['Oliver James','Yesterday · 6:22 PM','outgoing'],['Mia Chen','Monday · 3:15 PM','missed']].map(([name,time,type])=><div className="call-row" key={name}><Avatar person={people.find(p=>p.name===name)||people[0]}/><div><strong>{name}</strong><small>{time}</small></div><span className={`call-type ${type}`}>{type==='missed'?'Missed':type==='incoming'?'Incoming':'Outgoing'}</span><button className="icon-button" onClick={()=>notify('Call is a UI demo')}><PhoneCall size={17}/></button></div>)}</div>;
  if (activeNav === 'Notifications') return <div className="section-preview"><div className="preview-banner"><Bell size={22}/><h2>Notifications</h2><p>You’re all caught up.</p></div>{[['Ava Mitchell','mentioned you in a conversation','2 min ago'],['Design Buddies','shared a new file','28 min ago'],['Noah Williams','sent you photos','1 hour ago']].map(([name,desc,time])=><div className="notification-row" key={name}><span className="notification-icon"><Bell size={16}/></span><div><strong>{name}</strong><p>{desc}</p><small>{time}</small></div></div>)}</div>;
  if (activeNav === 'Settings') return <div className="section-preview"><div className="preview-banner"><Settings size={22}/><h2>Settings</h2><p>Make Orbit feel like yours.</p></div>{['Appearance','Notifications','Privacy','Account'].map(tab=><button key={tab} className={`settings-tab ${settingsTab===tab?'current':''}`} onClick={()=>setSettingsTab(tab)}>{tab}<span>›</span></button>)}<div className="settings-info"><h3>{settingsTab}</h3><p>{settingsTab==='Appearance'?'Choose a theme and personalize your chat experience.':settingsTab==='Notifications'?'Manage message alerts, sounds and previews.':settingsTab==='Privacy'?'Control read receipts, activity status and blocked users.':'Manage your profile, login sessions and account preferences.'}</p><button onClick={()=>notify(`${settingsTab} preferences are a UI demo`)}>Manage {settingsTab.toLowerCase()}</button></div></div>;
  return <div className="section-preview profile-preview"><div className="profile-cover"/><Avatar person={{name:'Rakib Hasan',initials:'RH',color:'purple'}} size="xl"/><h2>Rakib Hasan</h2><p>@rakib.hasan</p><span className="profile-status"><span className="status-dot"/> Active now</span><div className="profile-stat-row"><div><strong>12</strong><small>Chats</small></div><div><strong>7</strong><small>People</small></div><div><strong>3</strong><small>Groups</small></div></div><button className="edit-profile-button" onClick={()=>notify('Edit profile is a UI demo')}>Edit profile</button><button className="settings-tab" onClick={()=>notify('Log out is a UI demo')}><LogOut size={16}/> Log out</button><button className="settings-tab danger-text" onClick={()=>notify('Account deletion is not active in this UI demo')}><Trash2 size={16}/> Delete account</button></div>;
}

export default App;
