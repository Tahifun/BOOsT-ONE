import * as Sentry from '@sentry/node';
export function initSentry(app:any){ const d=process.env.SENTRY_DSN; if(!d) return; Sentry.init({dsn:d,tracesSampleRate:0.1}); app.use(Sentry.Handlers.requestHandler()); app.use(Sentry.Handlers.tracingHandler()); app.use(Sentry.Handlers.errorHandler()); }
