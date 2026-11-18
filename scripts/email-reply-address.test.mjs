import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import test from "node:test";
import {
  extractReplyToken,
  formatOrderReplyTo,
  formatSharedReplyTo,
  getReplyMessageIds,
  normalizeReplyMessageId,
} from "../app/lib/email-reply-address.ts";

const domain = "reply.example.no";

test("shorter named reply addresses preserve new and existing tokens", () => {
  for (const byteLength of [16, 30]) {
    const token = randomBytes(byteLength).toString("hex");
    const replyTo = formatOrderReplyTo(19n, token, domain);
    assert.ok(replyTo.startsWith("Vatsii Designe - forespørsel #19 <svar-"));
    assert.equal(extractReplyToken(replyTo, domain), token);
    const address = replyTo.match(/<(.+)>/)[1];
    assert.equal(extractReplyToken(address, domain), token);
    assert.ok(address.split("@")[0].length < `r-${token}`.length);
  }
});

test("previously sent reply addresses remain valid", () => {
  const token = "abcdef012345".repeat(5);
  assert.equal(extractReplyToken(`r-${token}@${domain}`, domain), token);
  assert.equal(
    extractReplyToken(`Vatsii <r-${token.toUpperCase()}@REPLY.EXAMPLE.NO>`, domain),
    token,
  );
});

test("rejects malformed, truncated and wrong-domain reply addresses", () => {
  const token = "ab".repeat(16);
  const replyTo = formatOrderReplyTo(19n, token, domain);
  assert.equal(extractReplyToken(replyTo, "other.example.no"), null);
  assert.equal(extractReplyToken(`r-${token}@${domain}.evil.no`, domain), null);
  assert.equal(extractReplyToken(`r-${token.slice(1)}@${domain}`, domain), null);
  assert.equal(extractReplyToken(`svar-${"A".repeat(21)}B@${domain}`, domain), null);
  assert.equal(extractReplyToken(`svar-${"A".repeat(23)}@${domain}`, domain), null);
  assert.throws(() => formatOrderReplyTo(19n, "invalid", domain));
});

test("formats the shared reply address without exposing a routing token", () => {
  assert.equal(
    formatSharedReplyTo(19n, domain),
    `Forespørsel #19 <svar@${domain}>`,
  );
});

test("routes by the direct email thread reference before older references", () => {
  assert.deepEqual(
    getReplyMessageIds({
      References: "<first@example.com> <second@example.com>",
      "In-Reply-To": "<second@example.com>",
    }),
    ["<second@example.com>", "<first@example.com>"],
  );
  assert.deepEqual(
    getReplyMessageIds({
      references: "<first@example.com> <first@example.com>",
      subject: "Re: inquiry",
    }),
    ["<first@example.com>"],
  );
  assert.deepEqual(getReplyMessageIds(null), []);
});

test("normalizes Resend message IDs to the format used in reply headers", () => {
  assert.equal(
    normalizeReplyMessageId("message@example.com"),
    "<message@example.com>",
  );
  assert.equal(
    normalizeReplyMessageId(" <message@example.com> "),
    "<message@example.com>",
  );
  assert.equal(normalizeReplyMessageId("malformed"), null);
});
