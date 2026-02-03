
import { Platform } from "react-native";
import Constants from "expo-constants";

const MUTED_MESSAGES = [
  "Require cycle:",
  "VirtualizedLists should never be nested",
  "Non-serializable values were found in the navigation state",
];

const FLUSH_INTERVAL = 5000;

let logQueue: Array<{ level: string; message: string; timestamp: string }> = [];
let flushTimer: NodeJS.Timeout | null = null;

function clearLogAfterDelay(logKey: string) {
  setTimeout(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(logKey);
    }
  }, 60000);
}

function shouldMuteMessage(message: string): boolean {
  return MUTED_MESSAGES.some((muted) => message.includes(muted));
}

function getPlatformName(): string {
  if (Platform.OS === "web") return "Web";
  if (Platform.OS === "ios") return "iOS";
  if (Platform.OS === "android") return "Android";
  return "Unknown";
}

function getLogServerUrl(): string {
  const backendUrl = Constants.expoConfig?.extra?.backendUrl;
  if (!backendUrl) return "";
  return `${backendUrl}/api/logs`;
}

function flushLogs() {
  if (logQueue.length === 0) return;

  const logsToSend = [...logQueue];
  logQueue = [];

  const logServerUrl = getLogServerUrl();
  if (!logServerUrl) return;

  fetch(logServerUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ logs: logsToSend }),
  }).catch((err) => {
    console.error("[ErrorLogger] Failed to send logs:", err);
  });
}

function queueLog(level: string, message: string, source: string) {
  const timestamp = new Date().toISOString();
  const platform = getPlatformName();
  const logEntry = {
    level,
    message,
    timestamp,
    platform,
    source,
  };

  logQueue.push(logEntry);

  if (flushTimer) {
    clearTimeout(flushTimer);
  }

  flushTimer = setTimeout(flushLogs, FLUSH_INTERVAL);
}

function sendErrorToParent(level: string, message: string, data: any) {
  if (typeof window !== "undefined" && window.parent !== window) {
    try {
      window.parent.postMessage(
        {
          type: "NATIVELY_LOG",
          level,
          message,
          data,
          timestamp: new Date().toISOString(),
        },
        "*"
      );
    } catch (err) {
      console.error("[ErrorLogger] Failed to send message to parent:", err);
    }
  }
}

function extractSourceLocation(stack: string): string {
  const lines = stack.split("\n");
  if (lines.length > 1) {
    const match = lines[1].match(/\((.*):(\d+):(\d+)\)/);
    if (match) {
      return `${match[1]}:${match[2]}`;
    }
  }
  return "unknown";
}

function getCallerInfo(): string {
  try {
    const stack = new Error().stack || "";
    return extractSourceLocation(stack);
  } catch {
    return "unknown";
  }
}

function stringifyArgs(args: any[]): string {
  return args
    .map((arg) => {
      if (typeof arg === "object") {
        try {
          return JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    })
    .join(" ");
}

// Intercept console methods
if (typeof console !== "undefined") {
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;

  console.log = (...args: any[]) => {
    const message = stringifyArgs(args);
    if (!shouldMuteMessage(message)) {
      const source = getCallerInfo();
      queueLog("LOG", message, source);
      sendErrorToParent("LOG", message, args);
    }
    originalLog.apply(console, args);
  };

  console.warn = (...args: any[]) => {
    const message = stringifyArgs(args);
    if (!shouldMuteMessage(message)) {
      const source = getCallerInfo();
      queueLog("WARN", message, source);
      sendErrorToParent("WARN", message, args);
    }
    originalWarn.apply(console, args);
  };

  console.error = (...args: any[]) => {
    const message = stringifyArgs(args);
    if (!shouldMuteMessage(message)) {
      const source = getCallerInfo();
      queueLog("ERROR", message, source);
      sendErrorToParent("ERROR", message, args);
    }
    originalError.apply(console, args);
  };
}

export {};
