import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api, getApiErrorMessage } from "../api/client";
import { StarRating } from "./StarRating";
import { ChatIcon, LocationIcon, SendIcon, XCircleIcon } from "./icons";
import type { ChatMessage, ChatResponse, SchoolSearchResult } from "../api/types";

const GREETING: ChatMessage = {
  role: "assistant",
  content:
    "Hi! I'm the DriveSmart Assistant. Tell me where you're based, your budget, or the licence you need (e.g. Code 8), and I'll help you find a driving school.",
};

interface DisplayMessage extends ChatMessage {
  schools?: SchoolSearchResult[];
  isError?: boolean;
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<DisplayMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  async function send(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    const nextMessages: DisplayMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setSending(true);

    try {
      const res = await api.post<ChatResponse>("/chat", {
        messages: nextMessages.map(({ role, content }) => ({ role, content })),
      });
      setMessages((prev) => [...prev, { role: "assistant", content: res.data.reply, schools: res.data.schools }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", content: getApiErrorMessage(err), isError: true }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-30 flex flex-col items-end gap-3">
      {open && (
        <div className="flex h-[32rem] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-violet-900/20">
          <div className="flex items-center justify-between bg-gradient-to-r from-violet-600 to-sky-500 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <ChatIcon className="h-5 w-5" />
              <span className="font-display font-bold">DriveSmart Assistant</span>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close chat" className="text-white/80 hover:text-white">
              <XCircleIcon className="h-5 w-5" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[85%]">
                  <div
                    className={`rounded-2xl px-3.5 py-2 text-sm ${
                      m.role === "user"
                        ? "rounded-br-sm bg-violet-600 text-white"
                        : m.isError
                          ? "rounded-bl-sm bg-red-50 text-red-700"
                          : "rounded-bl-sm bg-slate-100 text-slate-800"
                    }`}
                  >
                    {m.content}
                  </div>
                  {m.schools && m.schools.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {m.schools.slice(0, 5).map((s) => (
                        <Link
                          key={s.id}
                          to={`/schools/${s.id}`}
                          className="block rounded-xl border border-slate-200 bg-white p-2.5 text-left transition hover:border-violet-300 hover:shadow-sm"
                        >
                          <p className="text-sm font-semibold text-slate-900">{s.name}</p>
                          <p className="flex items-center gap-1 text-xs text-slate-500">
                            <LocationIcon className="h-3 w-3" />
                            {s.city}
                          </p>
                          <StarRating rating={s.avgRating} count={s.reviewCount} size="sm" className="mt-1" />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-slate-100 px-3.5 py-2.5">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                </div>
              </div>
            )}
          </div>

          <form onSubmit={send} className="flex items-center gap-2 border-t border-slate-100 p-2.5">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. Code 8 lessons in Cape Town under R300"
              className="input"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              aria-label="Send"
              className="btn btn-primary shrink-0 !px-3"
            >
              <SendIcon className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close chat" : "Open chat"}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-sky-500 text-white shadow-lg shadow-violet-900/30 transition hover:scale-105"
      >
        {open ? <XCircleIcon className="h-6 w-6" /> : <ChatIcon className="h-6 w-6" />}
      </button>
    </div>
  );
}
