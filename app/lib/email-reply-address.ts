export const REPLY_TOKEN_HEX_LENGTH = 32;

export function isValidReplyToken(token: string) {
  return /^(?:[a-f0-9]{32}|[a-f0-9]{60})$/.test(token);
}

export function formatOrderReplyTo(
  inquiryId: bigint,
  token: string,
  domain: string,
) {
  if (!isValidReplyToken(token)) {
    throw new Error("Cannot format an invalid email reply token.");
  }
  const encoded = Buffer.from(token, "hex").toString("base64url");
  return `Vatsii Designe - forespørsel #${inquiryId} <svar-${encoded}@${domain}>`;
}

export function extractReplyToken(value: string, domain: string) {
  const address = (value.match(/<([^<>]+)>/)?.[1] ?? value).trim();
  const parts = address.split("@");
  if (parts.length !== 2 || parts[1].toLowerCase() !== domain.toLowerCase()) {
    return null;
  }

  const legacy = parts[0].match(/^r-([a-f0-9]{32}|[a-f0-9]{60})$/i);
  if (legacy) return legacy[1].toLowerCase();

  const encoded = parts[0].match(/^svar-([A-Za-z0-9_-]{22}|[A-Za-z0-9_-]{40})$/)?.[1];
  if (!encoded) return null;

  const bytes = Buffer.from(encoded, "base64url");
  const token = bytes.toString("hex");
  return bytes.toString("base64url") === encoded && isValidReplyToken(token)
    ? token
    : null;
}
