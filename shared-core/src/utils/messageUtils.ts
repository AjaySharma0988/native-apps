/**
 * @chatty/shared-core — Message Utilities
 */

import type { Message, MessageType, CallType, CallStatus } from "../types/index";

/**
 * Returns a human-readable preview of a message for sidebar display.
 */
export function getMessagePreview(message: Message | null | undefined): string {
  if (!message) return "";
  if (message.isDeletedForEveryone) return "🚫 This message was deleted";
  switch (message.type) {
    case "text":
      return message.text || "";
    case "image":
      return "📷 Photo";
    case "audio":
      return "🎤 Voice message";
    case "video":
      return "🎬 Video";
    case "call":
      return formatCallMessage(message.callType, message.callStatus, message.callDuration);
    case "status_reply":
      return "💬 Replied to a status";
    default:
      return message.text || "";
  }
}

/**
 * Formats a call log message.
 */
export function formatCallMessage(
  callType?: CallType,
  callStatus?: CallStatus,
  duration?: number
): string {
  const icon = callType === "video" ? "📹" : "📞";
  if (callStatus === "missed") return `${icon} Missed call`;
  if (callStatus === "rejected") return `${icon} Declined`;
  if (callStatus === "completed" && duration) {
    const mins = Math.floor(duration / 60);
    const secs = duration % 60;
    const durationStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    return `${icon} Call (${durationStr})`;
  }
  return `${icon} Call`;
}

/**
 * Checks whether a message was sent by the given user.
 */
export function isSentByUser(message: Message, userId: string): boolean {
  return message.senderId === userId;
}

/**
 * Sort messages by creation time (oldest first).
 */
export function sortMessages(messages: Message[]): Message[] {
  return [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

/**
 * Generates a temp ID for optimistic messages.
 */
export function generateTempId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
