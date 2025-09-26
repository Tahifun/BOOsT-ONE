import cors from "cors";

export function buildCors() {
  const origin = process.env.CLIENT_ORIGIN?.split(",").map(s => s.trim());
  return cors({
    origin: origin && origin.length > 0 ? origin : ["http://localhost:5173"],
    credentials: true,
  });
}


