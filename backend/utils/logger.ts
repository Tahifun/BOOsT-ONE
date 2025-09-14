// backend/utils/logger.ts
const isProd = process.env.NODE_ENV === "production";

function fmt(level: string, msg: unknown, ...rest: unknown[]) {
  const ts = new Date().toISOString();
  const base =
    typeof msg === "object" ? JSON.stringify(msg) : String(msg);
  return [`[${ts}] [${level.toUpperCase()}] ${base}`, ...rest];
}

const logger = {
  debug: (msg: unknown, ...rest: unknown[]) => {
    if (!isProd) console.debug(...fmt("debug", msg, ...rest));
  },
  info: (msg: unknown, ...rest: unknown[]) => {
    console.info(...fmt("info", msg, ...rest));
  },
  warn: (msg: unknown, ...rest: unknown[]) => {
    console.warn(...fmt("warn", msg, ...rest));
  },
  error: (msg: unknown, ...rest: unknown[]) => {
    console.error(...fmt("error", msg, ...rest));
  }
};

export default logger;
