import logger from './logger.js'

﻿import mongoose from "mongoose";

const URI =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  "mongodb://127.0.0.1:27017/clipboost";

mongoose.set("strictQuery", true);

mongoose.connection.on("connected", () => {
  logger.debug("[db] MongoDB verbunden:", URI.replace(/\/\/[^@]*@/, "//***:***@"));
});
mongoose.connection.on("error", (err) => {
  console.error("[db] MongoDB Fehler:", err?.message || err);
});
mongoose.connection.on("disconnected", () => {
  console.warn("[db] MongoDB getrennt");
});

(async () => {
  try {
    await mongoose.connect(URI, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
    } as any);
  } catch (err) {
    console.error("[db] Verbindungsaufbau fehlgeschlagen:", (err as any)?.message || err);
  }
})();


