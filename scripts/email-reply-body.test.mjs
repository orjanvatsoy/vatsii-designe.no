import assert from "node:assert/strict";
import { test } from "node:test";
import { extractReplyBody } from "../app/lib/email-reply-body.ts";

test("removes the Norwegian Gmail header, including wrapped sender addresses", () => {
  for (const header of [
    "ons. 18. nov. 2026 kl. 13:04 skrev Vatsii Designe <foresporsel@example.no>:",
    "ons. 18. nov. 2026 kl. 13:04 skrev Vatsii Designe <\nforesporsel@example.no>:",
    "18. november 2026 kl. 13:04 skrev Vatsii Designe\n<foresporsel@example.no>:",
  ]) {
    assert.equal(
      extractReplyBody(`hei hei hei\r\n\r\n${header}\n\n> Gammel melding`),
      "hei hei hei",
    );
  }
});

test("removes English, Norwegian and Outlook quote separators", () => {
  for (const header of [
    "On Wed, Nov 18, 2026, Vatsii Designe\n<test@example.no> wrote:",
    "Den 18. nov. 2026 skrev Vatsii Designe:",
    "-----Original Message-----",
    "From: test@example.no",
    "> Tidligere melding",
  ]) {
    assert.equal(extractReplyBody(`Takk!\n\n${header}\nHistorikk`), "Takk!");
  }
});

test("preserves multiline replies, dates and ordinary mentions of writing", () => {
  const body =
    "Hei!\n\n18. november 2026 kl. 13:04 passer fint.\nJeg skrev dette i går.\n\nHilsen kunden";
  assert.equal(extractReplyBody(body), body);
  assert.equal(extractReplyBody(""), "");
  assert.equal(extractReplyBody("> Bare et sitat"), "");
});
