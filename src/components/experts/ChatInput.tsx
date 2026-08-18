import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Paperclip, Image as ImageIcon, Mic, Square, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  sendChatMessage,
  uploadChatMedia,
  pushTyping,
  ExpertChat,
} from "@/hooks/useExpertChat";

interface Props {
  chat: ExpertChat;
  userId: string;
  role: "student" | "expert";
}

export const ChatInput = ({ chat, userId, role }: Props) => {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordSec, setRecordSec] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordStartRef = useRef(0);
  const typingThrottle = useRef(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  const onTextChange = (v: string) => {
    setText(v);
    const now = Date.now();
    if (now - typingThrottle.current > 1500) {
      typingThrottle.current = now;
      void pushTyping(chat.id, userId);
    }
  };

  const sendText = async () => {
    if (!text.trim()) return;
    setBusy(true);
    try {
      await sendChatMessage({
        chat_id: chat.id,
        sender_id: userId,
        sender_role: role,
        body: text.trim(),
        kind: "text",
      });
      setText("");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to send");
    } finally {
      setBusy(false);
    }
  };

  const sendFile = async (file: File, kind: "image" | "file") => {
    if (file.size > 25 * 1024 * 1024) {
      toast.error("File too large (max 25MB)");
      return;
    }
    setBusy(true);
    try {
      const meta = await uploadChatMedia(file, file.name, userId, chat.id);
      await sendChatMessage({
        chat_id: chat.id,
        sender_id: userId,
        sender_role: role,
        kind,
        attachment: meta,
      });
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      rec.ondataavailable = (e) => chunksRef.current.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const duration = Math.round((Date.now() - recordStartRef.current) / 1000);
        const blob = new Blob(chunksRef.current, { type: mime });
        if (blob.size === 0) return;
        setBusy(true);
        try {
          const meta = await uploadChatMedia(blob, `voice-${Date.now()}.webm`, userId, chat.id);
          await sendChatMessage({
            chat_id: chat.id,
            sender_id: userId,
            sender_role: role,
            kind: "voice",
            attachment: { ...meta, duration_sec: duration },
          });
        } catch (e: any) {
          toast.error(e.message ?? "Voice send failed");
        } finally {
          setBusy(false);
        }
      };
      recorderRef.current = rec;
      recordStartRef.current = Date.now();
      rec.start();
      setRecording(true);
      setRecordSec(0);
      timerRef.current = window.setInterval(() => {
        const s = Math.round((Date.now() - recordStartRef.current) / 1000);
        setRecordSec(s);
        if (s >= 120) stopRecording();
      }, 250);
    } catch (e: any) {
      toast.error("Microphone access denied");
    }
  };

  const stopRecording = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
    recorderRef.current?.stop();
    setRecording(false);
  };

  return (
    <div className="border-t border-border p-3 flex items-end gap-2">
      <input
        ref={imageRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void sendFile(f, "image");
          e.target.value = "";
        }}
      />
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void sendFile(f, "file");
          e.target.value = "";
        }}
      />

      <Button
        size="icon"
        variant="ghost"
        onClick={() => imageRef.current?.click()}
        disabled={busy || recording}
        title="Send image"
      >
        <ImageIcon className="w-4 h-4" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        onClick={() => fileRef.current?.click()}
        disabled={busy || recording}
        title="Send file"
      >
        <Paperclip className="w-4 h-4" />
      </Button>

      {recording ? (
        <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-md bg-destructive/10 border border-destructive/30">
          <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
          <span className="text-sm text-foreground">Recording… {recordSec}s</span>
          <Button size="sm" variant="destructive" onClick={stopRecording} className="ml-auto">
            <Square className="w-3 h-3 mr-1" /> Stop & send
          </Button>
        </div>
      ) : (
        <Input
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void sendText();
            }
          }}
          placeholder="Type a message…"
          disabled={busy}
        />
      )}

      {!recording && (
        <Button
          size="icon"
          variant="ghost"
          onClick={startRecording}
          disabled={busy}
          title="Record voice note"
        >
          <Mic className="w-4 h-4" />
        </Button>
      )}

      <Button size="icon" onClick={sendText} disabled={busy || !text.trim() || recording}>
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
      </Button>
    </div>
  );
};
