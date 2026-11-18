export function extractReplyBody(text: string) {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const replyLines: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const isQuoteHeader = lines.slice(index, index + 6).some((_, offset) => {
      const header = lines.slice(index, index + offset + 1).join(" ").trim();
      return (
        /^(?:On .+wrote:|Den .+skrev(?:\s+.+)?:)\s*$/i.test(header) ||
        /^(?:(?:man|tir|ons|tor|fre|lør|søn)\.\s+)?\d{1,2}\.\s+\p{L}+\.?\s+\d{4}\s+(?:kl\.\s*)?\d{1,2}:\d{2}\s+skrev\s+.+<\s*[^<>@\s]+@[^<>@\s]+>:\s*$/iu.test(
          header,
        )
      );
    });

    if (
      isQuoteHeader ||
      /^\s*>/.test(line) ||
      /^\s*(?:[-_]{5,}\s*(?:Original Message|Opprinnelig melding)|From:\s)/i.test(
        line,
      )
    ) {
      break;
    }
    replyLines.push(line);
  }

  return replyLines.join("\n").trim();
}
