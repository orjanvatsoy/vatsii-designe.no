import { NextResponse } from "next/server";
import { sendContactEmail } from "../../lib/email";

export const runtime = "nodejs";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOPICS = new Set([
  "Produktspørsmål",
  "Spesialbestilling",
  "Eksisterende forespørsel",
  "Samarbeid",
  "Annet",
]);
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 3;

const globalForContact = globalThis as typeof globalThis & {
  contactAttempts?: Map<string, number[]>;
};
const contactAttempts =
  globalForContact.contactAttempts ?? new Map<string, number[]>();
globalForContact.contactAttempts = contactAttempts;

function getClientAddress(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function isRateLimited(request: Request) {
  const now = Date.now();
  const address = getClientAddress(request);
  const recentAttempts = (contactAttempts.get(address) ?? []).filter(
    (attempt) => now - attempt < RATE_LIMIT_WINDOW_MS,
  );

  if (recentAttempts.length >= RATE_LIMIT_MAX_REQUESTS) {
    contactAttempts.set(address, recentAttempts);
    return true;
  }

  contactAttempts.set(address, [...recentAttempts, now]);
  return false;
}

export async function POST(request: Request) {
  let body: {
    name?: unknown;
    email?: unknown;
    topic?: unknown;
    message?: unknown;
    website?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Ugyldig forespørsel." },
      { status: 400 },
    );
  }

  if (typeof body.website === "string" && body.website.length > 0) {
    return NextResponse.json({ success: true });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const topic = typeof body.topic === "string" ? body.topic.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!name || name.length > 120) {
    return NextResponse.json(
      { error: "Oppgi navnet ditt, maks 120 tegn." },
      { status: 400 },
    );
  }
  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    return NextResponse.json(
      { error: "Oppgi en gyldig e-postadresse." },
      { status: 400 },
    );
  }
  if (!TOPICS.has(topic)) {
    return NextResponse.json(
      { error: "Velg hva henvendelsen gjelder." },
      { status: 400 },
    );
  }
  if (message.length < 10 || message.length > 5000) {
    return NextResponse.json(
      { error: "Meldingen må være mellom 10 og 5000 tegn." },
      { status: 400 },
    );
  }
  if (isRateLimited(request)) {
    return NextResponse.json(
      { error: "For mange meldinger på kort tid. Prøv igjen senere." },
      { status: 429 },
    );
  }

  try {
    const sent = await sendContactEmail({ name, email, topic, message });
    if (!sent) {
      return NextResponse.json(
        { error: "Kontaktskjemaet er midlertidig utilgjengelig." },
        { status: 503 },
      );
    }
  } catch (error) {
    console.error("Failed to send contact email:", error);
    return NextResponse.json(
      { error: "Meldingen kunne ikke sendes. Prøv igjen senere." },
      { status: 502 },
    );
  }

  return NextResponse.json({ success: true });
}
