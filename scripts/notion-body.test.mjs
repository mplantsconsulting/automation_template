// notion-body.mjs のテスト。Notion の API を呼ばないので、トークンなしで実行できる。
// 実行: node --test scripts/
import assert from "node:assert/strict";
import { test } from "node:test";
import { bodyBlocks, findSection, isSameHeading, richToMarkdown } from "./notion-body.mjs";

// Notion の API が返すブロックの形に合わせた最小の例。
const rich = (text) => [{ type: "text", plain_text: text }];
const heading = (level, text) => ({ type: `heading_${level}`, [`heading_${level}`]: { rich_text: rich(text) } });
const paragraph = (text) => ({ type: "paragraph", paragraph: { rich_text: rich(text) } });
const texts = (blocks) => blocks.map((b) => b[b.type].rich_text[0].plain_text);

test("見出しが完全に一致すれば同じ見出しとみなす", () => {
  assert.equal(isSameHeading("見積", "見積"), true);
});

test("後ろに括弧書きの付いた見出しは、括弧の前の文字で一致する", () => {
  assert.equal(isSameHeading("現在地（2026-11-24）", "現在地"), true);
  assert.equal(isSameHeading("現在地(2026-11-24)", "現在地"), true);
});

test("括弧以外の文字が続く見出しは一致しない", () => {
  assert.equal(isSameHeading("見積と実績", "見積"), false);
});

test("節は、次の同じ段の見出しの手前で終わり、下の段の見出しを含む", () => {
  const blocks = [
    heading(2, "目的"),
    paragraph("目的の本文"),
    heading(2, "見積"),
    paragraph("見積の本文"),
    heading(3, "先方の回答"),
    paragraph("回答の本文"),
    heading(2, "進め方"),
  ];

  const found = findSection(blocks, "見積");

  assert.equal(found.count, 1);
  assert.equal(found.heading, blocks[2]);
  assert.deepEqual(texts(found.section), ["見積の本文", "先方の回答", "回答の本文"]);
});

test("節は、上の段の見出しの手前でも終わる", () => {
  const blocks = [heading(2, "削減時間の見積"), paragraph("内訳"), heading(1, "別の資料"), paragraph("資料の本文")];

  const found = findSection(blocks, "削減時間の見積");

  assert.deepEqual(texts(found.section), ["内訳"]);
});

test("最後の節は本文の終わりまで続く", () => {
  const blocks = [heading(2, "現在地（2026-11-24）"), paragraph("1 行目"), paragraph("2 行目")];

  const found = findSection(blocks, "現在地");

  assert.deepEqual(texts(found.section), ["1 行目", "2 行目"]);
});

test("見出しが無ければ件数 0 を返す", () => {
  assert.deepEqual(findSection([heading(2, "目的")], "見積"), { count: 0 });
});

test("同じ見出しが 2 つあれば節を決めず、件数を返す", () => {
  assert.deepEqual(findSection([heading(2, "見積"), heading(2, "見積")], "見積"), { count: 2 });
});

test("見出しでないブロックの文字は、見出しとして一致させない", () => {
  assert.deepEqual(findSection([paragraph("見積")], "見積"), { count: 0 });
});

test("ページメンションは @ 付きの名前にし、リンクにしない", () => {
  const mention = [{ type: "mention", plain_text: "1-1. 取得処理", href: "https://www.notion.so/abc" }];

  assert.equal(richToMarkdown(mention), "@1-1. 取得処理");
});

test("太字、コード、リンクを Markdown の記法に戻す", () => {
  const parts = [
    { type: "text", plain_text: "強調", annotations: { bold: true } },
    { type: "text", plain_text: "task-get", annotations: { code: true } },
    { type: "text", plain_text: "PR #2", href: "https://github.com/o/r/pull/2" },
  ];

  assert.equal(richToMarkdown(parts), "**強調**`task-get`[PR #2](https://github.com/o/r/pull/2)");
});

test("Markdown の見出しは段に合ったブロックになる", () => {
  const blocks = bodyBlocks("## 見積\n### 先方の回答\n本文");

  assert.deepEqual(
    blocks.map((b) => b.type),
    ["heading_2", "heading_3", "paragraph"],
  );
});

test("Markdown の表は区切り行を捨てて 1 つの表ブロックになる", () => {
  const [table] = bodyBlocks("| 業務 | 月の回数 |\n| --- | --- |\n| 請求 | 4 |");

  assert.equal(table.type, "table");
  assert.equal(table.table.table_width, 2);
  assert.equal(table.table.children.length, 2);
});
