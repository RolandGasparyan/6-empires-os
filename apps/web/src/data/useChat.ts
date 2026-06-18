'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8000/api/v1';
const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:8000/api/v1/ws/updates';
const USE_MOCK = (process.env.NEXT_PUBLIC_USE_MOCK ?? 'true') === 'true';

export interface ChatMessage {
  id: string; channel: string; sender: string; agent_key?: string | null;
  body: string; created_at: string;
}
export interface Channel { key: string; name: string; desc: string; }

const MOCK_CHANNELS: Channel[] = [
  { key: 'command', name: 'Command Channel', desc: 'General command & strategy' },
  { key: 'trading', name: 'Trading Alerts', desc: 'Market signals & execution' },
  { key: 'risk', name: 'Risk Control', desc: 'Risk management room' },
  { key: 'ops', name: 'Internal Ops', desc: 'Operations & execution' },
];

export function useChat(channel: string) {
  const [channels, setChannels] = useState<Channel[]>(MOCK_CHANNELS);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (USE_MOCK) return;
    axios.get(`${API}/chat/channels`).then(({ data }) => setChannels(data.channels)).catch(() => {});
  }, []);

  useEffect(() => {
    if (USE_MOCK) { setMessages([]); return; }
    let cancelled = false;
    axios.get(`${API}/chat/channels/${channel}/messages`).then(({ data }) => {
      if (!cancelled) setMessages(data.messages);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [channel]);

  // live message.new frames over the twin
  useEffect(() => {
    if (USE_MOCK) return;
    let stopped = false;
    const connect = () => {
      if (stopped) return;
      let sock: WebSocket;
      try { sock = new WebSocket(WS_URL); } catch { setTimeout(connect, 1500); return; }
      ws.current = sock;
      sock.onmessage = (ev) => {
        let f: any; try { f = JSON.parse(ev.data); } catch { return; }
        if (f.type === 'message.new' && f.channel === channel) {
          setMessages((prev) => prev.some((m) => m.id === f.id) ? prev : [...prev, f]);
        }
      };
      sock.onclose = () => { if (!stopped) setTimeout(connect, 1500); };
      sock.onerror = () => { try { sock.close(); } catch {} };
    };
    connect();
    return () => { stopped = true; try { ws.current?.close(); } catch {} };
  }, [channel]);

  const send = useCallback(async (body: string) => {
    if (USE_MOCK) {
      setMessages((prev) => [...prev, { id: String(Date.now()), channel, sender: 'founder', body, created_at: new Date().toISOString() }]);
      // simulate an agent reply offline
      setTimeout(() => setMessages((prev) => [...prev, { id: String(Date.now() + 1), channel, sender: 'agent', agent_key: 'strat', body: 'Acknowledged. Routing to the intelligence core.', created_at: new Date().toISOString() }]), 700);
      return;
    }
    const token = typeof window !== 'undefined' ? localStorage.getItem('6empire_token') : null;
    await axios.post(`${API}/chat/channels/${channel}/messages`, { body },
      token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
  }, [channel]);

  return { channels, messages, send, source: USE_MOCK ? 'mock' : 'api' as const };
}
