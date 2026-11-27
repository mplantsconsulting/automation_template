// Notion の本文ブロックと Markdown の変換、本文の節の範囲を扱う。
// Notion の API を呼ばない計算だけを置き、トークンなしでテストできるようにする（notion-body.test.mjs）。

export const plain = (rich) => (rich || []).map((r) => r.plain_text).join("");

// Notion は Markdown 記法を解釈しない。`#` を含む行をそのまま渡すと、
// 見出しにならず `#` が本文へ残る。ブロック種別へ変換してから渡す。

// **太字** と `コード` だけをインラインで扱う。
export function richText(text) {
  const parts = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index > last) parts.push({ text: { content: text.slice(last, match.index) } });
    const token = match[0];
    if (token.startsWith("**")) {
      parts.push({ text: { content: token.slice(2, -2) }, annotations: { bold: true } });
    } else {
      parts.push({ text: { content: token.slice(1, -1) }, annotations: { code: true } });
    }
    last = match.index + token.length;
  }
  if (last < text.length) parts.push({ text: { content: text.slice(last) } });
  if (!parts.length) parts.push({ text: { content: text } });
  return parts.map((p) => ({ ...p, text: { ...p.text, content: p.text.content.slice(0, 2000) } }));
}

const block = (type, payload) => ({ object: "block", type, [type]: payload });

function tableRow(cells) {
  return { object: "block", type: "table_row", table_row: { cells: cells.map((c) => richText(c)) } };
}

export function bodyBlocks(text) {
  const lines = text.split("\n");
  const blocks = [];

  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i];
    const line = raw.trim();
    if (!line) continue;

    // コードブロックは閉じフェンスまでまとめる。
    const fence = line.match(/^```(\w*)/);
    if (fence) {
      const body = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        body.push(lines[i]);
        i += 1;
      }
      const languages = ["javascript", "typescript", "python", "bash", "shell", "json", "sql", "yaml", "markdown"];
      blocks.push(
        block("code", {
          rich_text: [{ text: { content: body.join("\n").slice(0, 2000) } }],
          language: languages.includes(fence[1]) ? fence[1] : "plain text",
        }),
      );
      continue;
    }

    // 表は連続する行をまとめて 1 つのブロックにする。区切り行は捨てる。
    if (line.startsWith("|") && line.endsWith("|")) {
      const rows = [];
      while (i < lines.length) {
        const row = lines[i].trim();
        if (!row.startsWith("|") || !row.endsWith("|")) break;
        const cells = row.slice(1, -1).split("|").map((c) => c.trim());
        if (!cells.every((c) => /^:?-{2,}:?$/.test(c))) rows.push(cells);
        i += 1;
      }
      i -= 1;
      const width = Math.max(...rows.map((r) => r.length));
      blocks.push(
        block("table", {
          table_width: width,
          has_column_header: true,
          has_row_header: false,
          children: rows.map((r) => tableRow([...r, ...Array(width - r.length).fill("")])),
        }),
      );
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      blocks.push(block(`heading_${heading[1].length}`, { rich_text: richText(heading[2]) }));
      continue;
    }
    if (/^(-{3,}|\*{3,})$/.test(line)) {
      blocks.push(block("divider", {}));
      continue;
    }
    if (line.startsWith("> ")) {
      blocks.push(block("quote", { rich_text: richText(line.slice(2)) }));
      continue;
    }
    const bullet = line.match(/^[-*]\s+(.*)$/);
    if (bullet) {
      blocks.push(block("bulleted_list_item", { rich_text: richText(bullet[1]) }));
      continue;
    }
    const numbered = line.match(/^\d+\.\s+(.*)$/);
    if (numbered) {
      blocks.push(block("numbered_list_item", { rich_text: richText(numbered[1]) }));
      continue;
    }
    blocks.push(block("paragraph", { rich_text: richText(line) }));
  }

  return blocks;
}

// 本文を読むときの、Markdown に近い形への変換。読むためだけの変換で、ページメンションは `@名前` になる。
export function richToMarkdown(rich) {
  return (rich || [])
    .map((r) => {
      if (r.type === "mention") return `@${r.plain_text}`;
      let text = r.plain_text;
      if (r.annotations?.code) text = `\`${text}\``;
      if (r.annotations?.bold) text = `**${text}**`;
      if (r.href) text = `[${text}](${r.href})`;
      return text;
    })
    .join("");
}

export const headingLevel = (b) => (/^heading_[123]$/.test(b.type) ? Number(b.type.slice(-1)) : 0);

// 「現在地（2026-11-24）」のように後ろに括弧書きが付いた見出しも、「現在地」で一致させる。
export function isSameHeading(text, name) {
  return text === name || (text.startsWith(name) && /^[（(]/.test(text.slice(name.length)));
}

// 見出しが name の節を探す。節は、その見出しの次から、同じか上の段の次の見出しの手前まで。
// 一致が 1 つでなければ、件数だけを返す。
export function findSection(blocks, name) {
  const matches = blocks
    .map((b, i) => ({ b, i }))
    .filter(({ b }) => headingLevel(b) && isSameHeading(plain(b[b.type].rich_text).trim(), name));
  if (matches.length !== 1) return { count: matches.length };
  const { b: heading, i: start } = matches[0];
  const level = headingLevel(heading);
  let end = start + 1;
  while (end < blocks.length && !(headingLevel(blocks[end]) && headingLevel(blocks[end]) <= level)) end += 1;
  return { count: 1, heading, section: blocks.slice(start + 1, end) };
}
