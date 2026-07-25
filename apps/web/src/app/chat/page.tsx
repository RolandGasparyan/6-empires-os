'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { useChat } from '@/data/useChat';

type ModuleKey = 'assistant' | 'notifications' | 'notes' | 'tasks' | 'creator' | 'email' | 'projects' | 'preferences' | 'booking';
type Task = { id: number; title: string; done: boolean };
type Booking = { id: number; title: string; meta: string; type: string };

const AGENT_COLOR: Record<string, string> = {
  strat: '#d7ad48', data: '#58c99a', risk: '#b5a0f4', scout: '#e3ad28', news: '#f18a78', trend: '#9ed0d5',
};

const AGENT_NAME: Record<string, string> = {
  strat: 'Mercury', data: 'Data Hunter', risk: 'Risk Guardian', scout: 'Market Scout', news: 'News Analyst', trend: 'Trend Tracker',
};

const modules: Array<{ key: ModuleKey; label: string; symbol: string; badge?: string }> = [
  { key: 'assistant', label: 'Assistant', symbol: '✦' },
  { key: 'notifications', label: 'Notifications', symbol: '◌', badge: '2' },
  { key: 'notes', label: 'Notes', symbol: '▤' },
  { key: 'tasks', label: 'Tasks', symbol: '✓' },
  { key: 'creator', label: 'Creator Studio', symbol: '◈' },
  { key: 'email', label: 'Email', symbol: '✉' },
  { key: 'projects', label: 'Projects', symbol: '▱' },
  { key: 'preferences', label: 'Preferences', symbol: '⚙' },
  { key: 'booking', label: 'Booking Agent', symbol: '◒' },
];

const initialNotes = ['Q3 roadmap draft', 'Meeting notes — vendor call'];
const initialTasks: Task[] = [
  { id: 1, title: 'Review API contracts', done: false },
  { id: 2, title: 'Draft UI mockup', done: true },
];
const bookingInventory: Booking[] = [
  { id: 1, title: 'Team Sync — Conference Room A', meta: 'Meeting · Room A · 30 min · up to 8', type: 'Meeting' },
  { id: 2, title: 'Executive Boardroom', meta: 'Hall · Level 5 · 90 min · up to 20', type: 'Hall' },
  { id: 3, title: 'Product Launch Event Space', meta: 'Event · Main Hall · 3 hrs · up to 150', type: 'Event' },
  { id: 4, title: '1:1 with Manager', meta: 'Meeting · Room C · 30 min · 2 people', type: 'Meeting' },
];

function MercuryMark({ compact = false }: { compact?: boolean }) {
  return <div className={`flex items-center ${compact ? 'gap-2' : 'gap-3'}`}>
    <div className={`${compact ? 'h-9 w-9' : 'h-12 w-12'} relative grid shrink-0 place-items-center rounded-full border border-[#d6ae4a]/70 bg-[#171207]/80 shadow-[0_0_24px_rgba(213,172,65,.24)]`}>
      <span className="absolute inset-1 rounded-full border border-[#f5dc89]/25" /><span className="h-2.5 w-2.5 rounded-full bg-[#f7d969] shadow-[0_0_12px_3px_rgba(244,198,61,.65)]" /><span className="absolute h-5 w-8 rounded-[100%] border border-[#d6ae4a]/75" />
    </div>
    {!compact && <div><div className="font-serif text-[25px] leading-none tracking-[.22em] text-[#f4d77c]">MERCURY</div><div className="mt-1 pl-[2px] text-[8px] font-semibold tracking-[.5em] text-[#d1b15d]">AI ASSISTANT</div></div>}
  </div>;
}

function OrbitalGlyph({ symbol, active }: { symbol: string; active: boolean }) {
  return <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border text-[13px] transition ${active ? 'border-[#e4bd57] text-[#ffe493] shadow-[0_0_13px_rgba(228,189,87,.45)]' : 'border-white/15 text-[#bba777]'}`}>{symbol}</span>;
}

function PanelShell({ title, eyebrow, children }: { title: string; eyebrow: string; children: ReactNode }) {
  return <div className="relative mx-auto flex w-full max-w-4xl flex-1 flex-col overflow-hidden rounded-[24px] border border-[#af8c35]/45 bg-[#0a0804]/55 shadow-[0_20px_80px_rgba(0,0,0,.45),inset_0_1px_0_rgba(255,230,141,.08)] backdrop-blur-sm">
    <div className="flex items-center justify-between border-b border-[#b08b32]/20 px-5 py-4"><div><div className="font-serif text-xl tracking-[.13em] text-[#f0d77f]">{title}</div><div className="mt-0.5 text-[9px] font-bold tracking-[.25em] text-[#9e8750]">{eyebrow}</div></div><span className="h-2.5 w-2.5 rounded-full bg-[#62d399] shadow-[0_0_10px_#62d399]" /></div>
    {children}
  </div>;
}

export default function ChatPage() {
  const [channel, setChannel] = useState('command');
  const { channels, messages, send, source } = useChat(channel);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [activeModule, setActiveModule] = useState<ModuleKey>('assistant');
  const [sideOpen, setSideOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [notes, setNotes] = useState(initialNotes);
  const [noteDraft, setNoteDraft] = useState('');
  const [tasks, setTasks] = useState(initialTasks);
  const [taskDraft, setTaskDraft] = useState('');
  const [creatorMode, setCreatorMode] = useState('Music');
  const [creatorPrompt, setCreatorPrompt] = useState('');
  const [creatorQueue, setCreatorQueue] = useState<string[]>([]);
  const [preferences, setPreferences] = useState({ voiceInput: false, voiceReplies: false, conciseTone: true });
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [bookingQuery, setBookingQuery] = useState('');
  const [bookingMessage, setBookingMessage] = useState('');
  const [booked, setBooked] = useState<Booking[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => () => streamRef.current?.getTracks().forEach((track) => track.stop()), []);
  const activeChannel = channels.find((item) => item.key === channel);
  const activeLabel = modules.find((module) => module.key === activeModule)?.label ?? 'Assistant';
  const visibleBookings = useMemo(() => bookingInventory.filter((booking) => `${booking.title} ${booking.meta}`.toLowerCase().includes(bookingQuery.toLowerCase())), [bookingQuery]);

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    const message = input.trim();
    if (!message || sending) return;
    setSending(true); setNotice(null);
    try { await send(message); setInput(''); } catch { setNotice('Mercury could not send that message. Please try again.'); } finally { setSending(false); }
  }

  async function toggleVoiceInput() {
    if (recording) {
      recorderRef.current?.stop();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setNotice('Voice input is not supported by this browser.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
      const chunks: BlobPart[] = [];
      const recorder = new MediaRecorder(stream, { mimeType });
      streamRef.current = stream;
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setRecording(false);
        try {
          const response = await fetch('/api/stt', { method: 'POST', headers: { 'Content-Type': mimeType }, body: new Blob(chunks, { type: mimeType }) });
          const payload = await response.json() as { text?: string; error?: string; err?: string };
          if (!response.ok || !payload.text?.trim()) throw new Error(payload.error || payload.err || 'STT returned no transcript');
          setInput(payload.text.trim());
        } catch (error) {
          setNotice(error instanceof Error ? `Voice input failed: ${error.message}` : 'Voice input failed.');
        }
      };
      recorder.start();
      setRecording(true);
    } catch (error) {
      setNotice(error instanceof Error ? `Microphone unavailable: ${error.message}` : 'Microphone unavailable.');
    }
  }

  async function speakLatestReply() {
    const reply = [...messages].reverse().find((message) => message.sender !== 'founder');
    if (!reply) return setNotice('There is no assistant reply to read yet.');
    try {
      const response = await fetch('/api/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: reply.body, lang: 'hy' }) });
      if (!response.ok) throw new Error(`TTS returned HTTP ${response.status}`);
      const audio = new Audio(URL.createObjectURL(await response.blob()));
      audio.onended = () => URL.revokeObjectURL(audio.src);
      await audio.play();
    } catch (error) {
      setNotice(error instanceof Error ? `Voice output failed: ${error.message}` : 'Voice output failed.');
    }
  }

  function addNote(event: FormEvent) { event.preventDefault(); const note = noteDraft.trim(); if (!note) return; setNotes((current) => [note, ...current]); setNoteDraft(''); }
  function addTask(event: FormEvent) { event.preventDefault(); const task = taskDraft.trim(); if (!task) return; setTasks((current) => [...current, { id: Date.now(), title: task, done: false }]); setTaskDraft(''); }
  function queueCreation(event: FormEvent) { event.preventDefault(); const prompt = creatorPrompt.trim(); if (!prompt) return; setCreatorQueue((current) => [`${creatorMode}: ${prompt}`, ...current]); setCreatorPrompt(''); }
  function reserve(booking: Booking) { if (booked.some((item) => item.id === booking.id)) return; setBooked((current) => [...current, booking]); setNotice(`${booking.title} has been added to the Mercury calendar.`); }
  function requestBooking(event: FormEvent) { event.preventDefault(); const request = bookingMessage.trim(); if (!request) return; setBooked((current) => [...current, { id: Date.now(), title: request, meta: 'Requested through conversational booking', type: 'Request' }]); setBookingMessage(''); setNotice('Mercury has added your booking request to the calendar preview.'); }

  function moduleContent() {
    if (activeModule === 'assistant') return <PanelShell title="MERCURY" eyebrow="STRATEGIC AI ASSISTANT"><div className="relative flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#b08b32]/20 px-5 py-3 text-[10px] text-[#a89260]"><span className="text-[#d9c480]">{activeChannel?.name ?? 'Command Channel'}</span><span>{activeChannel?.desc}</span></div>
      <div className="relative flex-1 overflow-y-auto px-4 py-5 md:px-8">{messages.length === 0 && <div className="mx-auto mt-14 max-w-md text-center"><div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full border border-[#d9b24c]/60 bg-[#2a1f09]/60 text-2xl text-[#f1d775] shadow-[0_0_32px_rgba(215,173,72,.22)]">✦</div><h1 className="font-serif text-2xl tracking-[.09em] text-[#f0da91]">How can I help?</h1><p className="mt-3 text-sm leading-6 text-[#b8aa7d]">Ask Mercury to plan, analyse, organise, or delegate work across your empire.</p></div>}
        <div className="space-y-4">{messages.map((message) => { const founder = message.sender === 'founder'; const color = message.agent_key ? AGENT_COLOR[message.agent_key] ?? '#d7ad48' : '#d7ad48'; return <div key={message.id} className={`flex ${founder ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-6 md:max-w-[72%] ${founder ? 'border border-[#d9b24c]/35 bg-[#473613]/65 text-[#fff1bd]' : 'border border-white/10 bg-black/35 text-[#e9e1c6]'}`}><div className="mb-1 text-[10px] font-bold tracking-[.15em]" style={{ color }}>{founder ? 'YOU' : (message.agent_key ? AGENT_NAME[message.agent_key] ?? message.agent_key : 'MERCURY')}</div>{message.body}</div></div>; })}</div><div ref={endRef} />
      </div>
      <div className="border-t border-[#b08b32]/20 bg-[#0f0c06]/75 p-3 md:p-4">{notice && <div role="status" className="mb-3 rounded-xl border border-[#cba546]/30 bg-[#402e0c]/45 px-3 py-2 text-xs text-[#e7d291]">{notice}</div>}<form onSubmit={submit} className="flex items-center gap-2 rounded-2xl border border-[#caa143]/45 bg-[#171106]/85 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,225,130,.08)] focus-within:border-[#e5c25d]"><span className="grid h-8 w-8 place-items-center rounded-full text-[#e7c763]">✧</span><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask Mercury anything..." className="min-w-0 flex-1 bg-transparent py-2 text-sm text-[#fff1c8] outline-none placeholder:text-[#9c8a5d]" /><button type="button" onClick={toggleVoiceInput} className={`grid h-10 w-10 place-items-center rounded-xl border text-lg transition ${recording ? 'border-red-400 bg-red-400/15 text-red-300' : 'border-[#caa143]/35 text-[#e7c763] hover:bg-[#caa143]/10'}`} aria-label={recording ? 'Stop voice input' : 'Start voice input'}>{recording ? '■' : '🎙'}</button><button type="button" onClick={speakLatestReply} className="grid h-10 w-10 place-items-center rounded-xl border border-[#caa143]/35 text-lg text-[#e7c763] transition hover:bg-[#caa143]/10" aria-label="Read latest reply aloud">🔊</button><button type="submit" disabled={!input.trim() || sending} className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#f1d171] to-[#9b731d] text-lg text-[#211705] shadow-[0_0_20px_rgba(227,181,72,.3)] transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-35" aria-label="Send message">{sending ? '…' : '➤'}</button></form><div className="mt-3 flex flex-wrap gap-2">{['Create today’s priorities', 'Analyse current projects', 'Draft a client follow-up'].map((prompt) => <button key={prompt} onClick={() => setInput(prompt)} className="rounded-full border border-[#c7a044]/25 px-3 py-1.5 text-[10px] text-[#cbb67a] transition hover:border-[#dabb63]/60 hover:bg-[#dabb63]/10 hover:text-[#f0dc97]">{prompt}</button>)}</div></div>
    </div></PanelShell>;

    if (activeModule === 'notifications') return <PanelShell title="NOTIFICATIONS" eyebrow="SIGNAL LOG"><div className="flex-1 overflow-y-auto p-5 md:p-8"><p className="text-sm text-[#d7c898]">Good morning</p><p className="mt-1 text-sm text-[#9f916c]">You have {notes.length} notes and {tasks.filter((task) => !task.done).length} task in progress.</p><div className="mt-6 grid gap-3 sm:grid-cols-3">{[[notes.length, 'Notes'], [tasks.filter((task) => !task.done).length, 'In progress'], [0, 'New signals']].map(([value, label]) => <div key={String(label)} className="rounded-2xl border border-[#caa143]/25 bg-[#211807]/55 p-4"><strong className="block text-2xl text-[#f0d77f]">{value}</strong><span className="text-xs text-[#ad9a68]">{label}</span></div>)}</div><div className="mt-7 space-y-3">{[['Vendor call notes synced from Obsidian Brain', '2h ago'], ['“Draft UI mockup” marked complete', '5h ago'], ['Empires AI finished this week’s summary', 'Yesterday']].map(([text, time]) => <div key={text} className="flex justify-between gap-4 rounded-xl border border-white/5 bg-black/20 p-4 text-sm"><span className="text-[#e5d8b2]">{text}</span><span className="shrink-0 text-xs text-[#907e50]">{time}</span></div>)}</div></div></PanelShell>;

    if (activeModule === 'notes') return <PanelShell title="NOTES" eyebrow="OBSIDIAN BRAIN"><div className="flex flex-1 flex-col overflow-y-auto p-5 md:p-8"><div className="space-y-3">{notes.map((note, index) => <article key={`${note}-${index}`} className="rounded-xl border border-[#caa143]/20 bg-[#211807]/45 p-4 text-sm text-[#e7ddbd]">{note}</article>)}</div><form onSubmit={addNote} className="mt-6 flex gap-2"><input value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} placeholder="New note…" className="min-w-0 flex-1 rounded-xl border border-[#caa143]/35 bg-black/20 px-4 py-3 text-sm text-[#fff1c8] outline-none placeholder:text-[#8d7a4f] focus:border-[#e5c25d]" /><button className="rounded-xl bg-[#c49530] px-4 text-sm font-semibold text-[#1b1203] disabled:opacity-40" disabled={!noteDraft.trim()}>Add note</button></form></div></PanelShell>;

    if (activeModule === 'tasks') return <PanelShell title="TASKS" eyebrow="PROJECTD"><div className="flex flex-1 flex-col overflow-y-auto p-5 md:p-8"><div className="space-y-3">{tasks.map((task) => <label key={task.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#caa143]/20 bg-[#211807]/45 p-4 text-sm text-[#e7ddbd]"><input type="checkbox" checked={task.done} onChange={() => setTasks((current) => current.map((item) => item.id === task.id ? { ...item, done: !item.done } : item))} className="h-4 w-4 accent-[#d7ad48]" /><span className={task.done ? 'text-[#88794f] line-through' : ''}>{task.title}</span></label>)}</div><form onSubmit={addTask} className="mt-6 flex gap-2"><input value={taskDraft} onChange={(event) => setTaskDraft(event.target.value)} placeholder="New task…" className="min-w-0 flex-1 rounded-xl border border-[#caa143]/35 bg-black/20 px-4 py-3 text-sm text-[#fff1c8] outline-none placeholder:text-[#8d7a4f] focus:border-[#e5c25d]" /><button className="rounded-xl bg-[#c49530] px-4 text-sm font-semibold text-[#1b1203] disabled:opacity-40" disabled={!taskDraft.trim()}>Add task</button></form></div></PanelShell>;

    if (activeModule === 'creator') return <PanelShell title="CREATOR STUDIO" eyebrow="EMPIRES AI"><div className="flex flex-1 flex-col overflow-y-auto p-5 md:p-8"><p className="max-w-2xl text-sm leading-6 text-[#b9ab80]">Generate music, viral reels, and videos — then publish them straight to your channels.</p><div className="mt-6 flex flex-wrap gap-2">{['Music', 'Viral Reel', 'Video'].map((mode) => <button key={mode} onClick={() => setCreatorMode(mode)} className={`rounded-xl border px-4 py-2 text-sm ${creatorMode === mode ? 'border-[#dfbc59] bg-[#3d2e0e] text-[#f3d67b]' : 'border-[#caa143]/20 text-[#b7a271]'}`}>{mode}</button>)}</div><form onSubmit={queueCreation} className="mt-5 flex gap-2"><input value={creatorPrompt} onChange={(event) => setCreatorPrompt(event.target.value)} placeholder={creatorMode === 'Music' ? 'Describe a track — mood, genre, tempo…' : `Describe the ${creatorMode.toLowerCase()}…`} className="min-w-0 flex-1 rounded-xl border border-[#caa143]/35 bg-black/20 px-4 py-3 text-sm text-[#fff1c8] outline-none placeholder:text-[#8d7a4f] focus:border-[#e5c25d]" /><button className="rounded-xl bg-[#c49530] px-4 text-sm font-semibold text-[#1b1203] disabled:opacity-40" disabled={!creatorPrompt.trim()}>{creatorMode === 'Music' ? 'Compose track' : 'Create'}</button></form><div className="mt-7 space-y-3">{creatorQueue.length ? creatorQueue.map((item, index) => <div key={`${item}-${index}`} className="rounded-xl border border-[#caa143]/20 bg-[#211807]/45 p-4 text-sm text-[#e7ddbd]"><span className="mr-2 text-[#e6c462]">Queued</span>{item}</div>) : <div className="rounded-xl border border-dashed border-[#caa143]/25 p-6 text-center text-sm text-[#9b895d]">Your generated tracks, reels, and videos will queue up here.</div>}</div></div></PanelShell>;

    if (activeModule === 'email') return <PanelShell title="EMAIL" eyebrow="INBOX"><div className="flex-1 overflow-y-auto p-5 md:p-8"><div className="space-y-3">{[['Contract renewal — Q3 terms', 'Vendor Relations', '9:12 AM'], ['Your weekly digest is ready', 'Empires AI', 'Yesterday'], ['Review requested: Mercury UI', 'Design Guild', 'Mon']].map(([subject, sender, time]) => <article key={subject} className="flex items-center justify-between gap-4 rounded-xl border border-[#caa143]/20 bg-[#211807]/45 p-4"><div><div className="text-sm text-[#efe3bf]">{subject}</div><div className="mt-1 text-xs text-[#9f8d5e]">{sender}</div></div><span className="shrink-0 text-xs text-[#907e50]">{time}</span></article>)}</div></div></PanelShell>;

    if (activeModule === 'projects') return <PanelShell title="PROJECTS" eyebrow="PROJECTD"><div className="flex-1 overflow-y-auto p-5 md:p-8"><div className="space-y-4">{[['ProjectD — API Layer', 'In progress', 62], ['Mercury UI Refresh', 'In review', 88], ['Observatory Data Sync', 'Planning', 24]].map(([name, status, progress]) => <article key={String(name)} className="rounded-xl border border-[#caa143]/20 bg-[#211807]/45 p-4"><div className="flex justify-between gap-4 text-sm"><span className="text-[#efe3bf]">{name}</span><span className="text-[#cdb56e]">{status} · {progress}%</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/35"><div className="h-full rounded-full bg-gradient-to-r from-[#9c721f] to-[#f0d77f]" style={{ width: `${progress}%` }} /></div></article>)}</div></div></PanelShell>;

    if (activeModule === 'preferences') return <PanelShell title="PREFERENCES" eyebrow="MERCURY SETTINGS"><div className="flex-1 overflow-y-auto p-5 md:p-8"><div className="space-y-3">{[['voiceInput', 'Voice input'], ['voiceReplies', 'Voice replies'], ['conciseTone', 'Concise tone']].map(([key, label]) => <label key={key} className="flex cursor-pointer items-center justify-between rounded-xl border border-[#caa143]/20 bg-[#211807]/45 p-4 text-sm text-[#e7ddbd]"><span>{label}</span><input type="checkbox" checked={preferences[key as keyof typeof preferences]} onChange={() => setPreferences((current) => ({ ...current, [key]: !current[key as keyof typeof current] }))} className="h-4 w-4 accent-[#d7ad48]" /></label>)}</div></div></PanelShell>;

    return <PanelShell title="BOOKING AGENT" eyebrow="LIVE"><div className="flex flex-1 flex-col overflow-y-auto p-5 md:p-8"><div className="flex gap-2"><input value={bookingQuery} onChange={(event) => setBookingQuery(event.target.value)} placeholder="Search meetings, halls, events…" className="min-w-0 flex-1 rounded-xl border border-[#caa143]/35 bg-black/20 px-4 py-3 text-sm text-[#fff1c8] outline-none placeholder:text-[#8d7a4f] focus:border-[#e5c25d]" /><button className="rounded-xl border border-[#caa143]/45 px-4 text-sm text-[#ebd590]">Search</button></div><div className="mt-5 space-y-3">{visibleBookings.map((booking) => <article key={booking.id} className="flex items-center justify-between gap-4 rounded-xl border border-[#caa143]/20 bg-[#211807]/45 p-4"><div><div className="text-sm text-[#efe3bf]">{booking.title}</div><div className="mt-1 text-xs text-[#9f8d5e]">{booking.meta}</div></div><button onClick={() => reserve(booking)} disabled={booked.some((item) => item.id === booking.id)} className="rounded-lg border border-[#d8b34c]/55 px-3 py-2 text-xs font-semibold text-[#efd27b] disabled:border-white/10 disabled:text-white/30">{booked.some((item) => item.id === booking.id) ? 'Booked' : 'Book'}</button></article>)}</div><div className="mt-7 border-t border-[#caa143]/20 pt-6"><h2 className="font-serif text-lg text-[#edda99]">Conversational booking</h2><form onSubmit={requestBooking} className="mt-3 flex gap-2"><input value={bookingMessage} onChange={(event) => setBookingMessage(event.target.value)} placeholder={'Try: "Book meeting tomorrow at 3 PM"'} className="min-w-0 flex-1 rounded-xl border border-[#caa143]/35 bg-black/20 px-4 py-3 text-sm text-[#fff1c8] outline-none placeholder:text-[#8d7a4f] focus:border-[#e5c25d]" /><button className="rounded-xl bg-[#c49530] px-4 text-sm font-semibold text-[#1b1203] disabled:opacity-40" disabled={!bookingMessage.trim()}>Send</button></form></div><div className="mt-7"><h2 className="font-serif text-lg text-[#edda99]">Calendar Preview</h2><div className="mt-3 space-y-2">{booked.length ? booked.map((booking) => <div key={booking.id} className="rounded-xl border border-[#caa143]/20 bg-[#211807]/45 p-3 text-sm text-[#e7ddbd]">{booking.title}<div className="mt-1 text-xs text-[#9f8d5e]">{booking.meta}</div></div>) : <div className="rounded-xl border border-dashed border-[#caa143]/25 p-5 text-center text-sm text-[#9b895d]">No bookings yet — search above or ask the agent.</div>}</div></div></div></PanelShell>;
  }

  return <div className="relative flex h-[100dvh] overflow-hidden bg-[#080703] text-[#f3ead0]">
    <div className="pointer-events-none absolute inset-0 opacity-80" style={{ backgroundImage: 'radial-gradient(circle at 8% 15%, rgba(231,195,94,.46) 0 1px, transparent 1.5px), radial-gradient(circle at 37% 10%, rgba(255,255,255,.38) 0 1px, transparent 1.5px), radial-gradient(circle at 76% 28%, rgba(231,195,94,.36) 0 1px, transparent 1.5px), radial-gradient(circle at 62% 76%, rgba(255,255,255,.22) 0 1px, transparent 1.5px), radial-gradient(ellipse at 56% 58%, #282113 0%, #110e07 43%, #070604 100%)', backgroundSize: '173px 149px, 251px 199px, 213px 183px, 137px 157px, 100% 100%' }} />
    <div className="pointer-events-none absolute -right-32 -top-40 h-[580px] w-[580px] rounded-full border border-[#b58c2d]/10" /><div className="pointer-events-none absolute -right-10 -top-20 h-[430px] w-[430px] rounded-full border border-[#b58c2d]/10" /><div className="pointer-events-none absolute bottom-[-340px] left-[22%] h-[680px] w-[680px] rounded-full border border-[#b58c2d]/15" />
    <aside className={`absolute inset-y-0 left-0 z-30 flex w-[270px] flex-col border-r border-[#b08b32]/25 bg-[#0d0b06]/95 px-4 py-5 backdrop-blur-xl transition-transform duration-300 md:relative md:translate-x-0 ${sideOpen ? 'translate-x-0' : '-translate-x-full'}`}><div className="mb-10 px-1"><MercuryMark /></div><div className="mb-7 flex items-center gap-3 rounded-2xl border border-[#b38d32]/20 bg-[#21190b]/45 px-3 py-3"><MercuryMark compact /><div><div className="text-sm font-semibold text-[#eadb9f]">Guest</div><div className="mt-0.5 text-[8px] font-bold tracking-[.28em] text-[#9e8750]">SIGNED IN</div></div></div><div className="mb-3 px-2 text-[9px] font-bold tracking-[.34em] text-[#aa8e4d]">MODULES</div><nav className="space-y-1 overflow-y-auto pr-1">{modules.map((module) => { const selected = activeModule === module.key; return <button key={module.key} onClick={() => { setActiveModule(module.key); setSideOpen(false); setNotice(null); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${selected ? 'border border-[#d9b24c]/75 bg-[#3b2d0d]/70 text-[#f3d67b] shadow-[0_0_24px_rgba(197,151,35,.16)]' : 'border border-transparent text-[#ded3af]/75 hover:border-[#d9b24c]/25 hover:bg-white/[.04] hover:text-[#f0df9f]'}`}><OrbitalGlyph symbol={module.symbol} active={selected} /><span className="flex-1 font-medium">{module.label}</span>{module.badge && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#bc4437] px-1 text-[10px] font-bold text-white shadow-[0_0_12px_rgba(213,72,57,.4)]">{module.badge}</span>}</button>; })}</nav><div className="mt-auto border-t border-[#b08b32]/15 px-2 pt-4 text-[9px] tracking-[.18em] text-[#8d7947]">POWERED BY “6-EMPIRES”</div></aside>
    {sideOpen && <button aria-label="Close navigation" onClick={() => setSideOpen(false)} className="absolute inset-0 z-20 bg-black/55 md:hidden" />}
    <main className="relative z-10 flex min-w-0 flex-1 flex-col"><header className="flex h-20 shrink-0 items-center justify-between border-b border-[#b08b32]/20 bg-[#100d07]/60 px-4 backdrop-blur-md md:px-8"><div className="flex items-center gap-3"><button onClick={() => setSideOpen(true)} className="grid h-10 w-10 place-items-center rounded-xl border border-[#d9b24c]/35 text-[#e9ca6e] md:hidden" aria-label="Open navigation">☰</button><div className="md:hidden"><MercuryMark compact /></div><div className="hidden md:block"><div className="text-xs font-semibold tracking-[.2em] text-[#ead796]">MERCURY COMMAND CENTRE</div><div className="mt-1 text-[10px] text-[#a89260]">{activeLabel} · {source === 'mock' ? 'simulation connected' : 'live connection'}</div></div></div><div className="hidden items-center gap-2 lg:flex">{channels.map((item) => <button key={item.key} onClick={() => { setChannel(item.key); setActiveModule('assistant'); }} className={`rounded-full border px-3 py-1.5 text-[10px] transition ${channel === item.key && activeModule === 'assistant' ? 'border-[#d9b24c]/55 bg-[#d9b24c]/10 text-[#f4d87b]' : 'border-white/10 text-white/40 hover:text-white/70'}`}>{item.name.replace(' Channel', '')}</button>)}</div><div className="flex h-9 items-center gap-2 rounded-full border border-[#d9b24c]/35 bg-[#201807]/70 px-3 text-[10px] font-semibold tracking-[.12em] text-[#deca88]"><span className="h-2 w-2 rounded-full bg-[#62d399] shadow-[0_0_10px_#62d399]" /> ONLINE</div></header><section className="relative flex flex-1 flex-col overflow-hidden px-4 py-5 md:px-10 md:py-8"><div className="pointer-events-none absolute left-1/2 top-1/2 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#caa143]/20" /><div className="pointer-events-none absolute left-1/2 top-1/2 h-[270px] w-[270px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#caa143]/15" />{moduleContent()}</section></main>
  </div>;
}
