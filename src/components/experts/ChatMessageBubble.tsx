import { Check, CheckCheck, FileIcon, Download } from "lucide-react";
import { ChatMessage } from "@/hooks/useExpertChat";

interface Props {
  message: ChatMessage;
  isOwn: boolean;
}

export const ChatMessageBubble = ({ message, isOwn }: Props) => {
  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[78%] rounded-2xl px-3 py-2 ${
          isOwn ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
        }`}
      >
        {message.kind === "text" && (
          <p className="text-sm whitespace-pre-line break-words">{message.body}</p>
        )}

        {message.kind === "image" && message.attachment?.url && (
          <a href={message.attachment.url} target="_blank" rel="noopener noreferrer">
            <img
              src={message.attachment.url}
              alt={message.attachment.name ?? "image"}
              className="rounded-lg max-h-72 object-contain"
            />
          </a>
        )}

        {message.kind === "file" && message.attachment?.url && (
          <a
            href={message.attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm underline"
          >
            <FileIcon className="w-4 h-4" />
            <span className="truncate max-w-[200px]">{message.attachment.name}</span>
            <Download className="w-3.5 h-3.5 opacity-70" />
          </a>
        )}

        {message.kind === "voice" && message.attachment?.url && (
          <div className="space-y-1 min-w-[200px]">
            <audio controls src={message.attachment.url} className="w-full h-8" />
            {!!message.attachment.duration_sec && (
              <p className="text-[10px] opacity-70">
                {Math.round(message.attachment.duration_sec)}s
              </p>
            )}
          </div>
        )}

        {message.body && message.kind !== "text" && (
          <p className="text-xs mt-1 whitespace-pre-line opacity-90">{message.body}</p>
        )}

        <div className="flex items-center justify-end gap-1 mt-1">
          <span className="text-[10px] opacity-60">{time}</span>
          {isOwn &&
            (message.read_at ? (
              <CheckCheck className="w-3 h-3 opacity-80" />
            ) : (
              <Check className="w-3 h-3 opacity-50" />
            ))}
        </div>
      </div>
    </div>
  );
};
