#!/usr/bin/env node
// Notion のプロジェクト・タスクを読み書きする CLI。
// 案件資料 → プロジェクト → タスク → PR の流れで使う。詳細は rules/notion.md を参照。
//
// 認証: 環境変数 NOTION_TOKEN。NOTION_ENV_FILE で .env のパスを指定してもよい。
// このトークンは給与を含むページへ到達できるため、CI では実行しない。

import fs from "node:fs";
import path from "node:path";

const API = "https://api.notion.com/v1";
const VERSION = "2022-06-28";

const DB = {
  project: process.env.PROJECT_DB_ID || "521d599b727d464eab581ea90720fa38",
  task: process.env.TASK_DB_ID || "574661cca7f648918ae0daa4c6b08b92",
  client: process.env.CLIENT_DB_ID || "90683205657c42ac933a0dc228a17822",
  member: process.env.MEMBER_DB_ID || "b0eb8c36842d423d8d0f1f31231c3bb2",
  repo: process.env.REPO_DB_ID || "595ed7fff3f146d799538a22f75dc496",
  issue: process.env.ISSUE_DB_ID || "e3272fe8f3ea491db72f44f8bdbe50c0",
};

const TITLE = {
  project: "プロジェクト名",
  task: "タスク名",
  client: "会社名",
  member: "氏名",
  repo: "リポジトリ名",
  issue: "タイトル",
};

const TASK_STATUS = ["保留", "未着手", "進行中", "レビュー", "完了"];
const PROJECT_STATUS = ["保留", "要件定義中", "PoC", "進行中", "テスト中", "完了", "中止", "エラー対応中"];
const PRIORITY = ["高", "中", "低"];
const TASK_KIND = ["開発", "PM"];
// 見積の種別。reference/estimate-baseline.md と Notion の選択肢に合わせる。
const TASK_TYPE = [
  "学習・調査",
  "ドキュメント（リポジトリ）",
  "ドキュメント（説明資料）",
  "レビュー（実装）",
  "レビュー（設計）",
  "リリース・引き継ぎ",
  "修正・手戻り",
  "設計（フロント・バック）",
  "土台（フロント・バック）",
  "フロント（画面の実装）",
  "フロント（画面の調整）",
  "バック（処理）",
  "バック（ファイル入出力）",
  "バック（外部連携）",
  "バック（定期実行）",
  "結合確認",
  "リファクタリング",
  "インフラ（設計）",
  "インフラ（構築・L1）",
  "インフラ（構築・L2）",
  "インフラ（構築・L3）",
  "AI（LLM・OCR・エージェント）",
  "データ分析",
  "機械学習",
];

// ---- 基盤 ---------------------------------------------------------------

function fail(message) {
  console.error(`エラー: ${message}`);
  process.exit(1);
}

function loadToken() {
  if (process.env.CI) {
    fail("CI では実行しない。このトークンは給与を含むページへ到達できる。");
  }
  if (process.env.NOTION_TOKEN) return process.env.NOTION_TOKEN;

  const candidates = [process.env.NOTION_ENV_FILE, ".env"].filter(Boolean);
  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 0) continue;
      if (trimmed.slice(0, eq).trim() !== "NOTION_TOKEN") continue;
      return trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    }
  }
  fail("NOTION_TOKEN が未設定。export するか、NOTION_ENV_FILE で .env を指す。");
}

const TOKEN = loadToken();

async function notion(endpoint, method = "GET", body) {
  const res = await fetch(API + endpoint, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Notion-Version": VERSION,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) {
    let detail = text.slice(0, 400);
    try {
      detail = JSON.parse(text).message || detail;
    } catch {
      // 応答が JSON でない場合は本文をそのまま使う
    }
    fail(`Notion API ${res.status} ${method} ${endpoint}: ${detail}`);
  }
  return text ? JSON.parse(text) : {};
}

async function queryAll(dbId, filter) {
  const results = [];
  let cursor;
  do {
    const page = await notion(`/databases/${dbId}/query`, "POST", {
      ...(filter ? { filter } : {}),
      ...(cursor ? { start_cursor: cursor } : {}),
      page_size: 100,
    });
    results.push(...page.results);
    cursor = page.has_more ? page.next_cursor : undefined;
  } while (cursor);
  return results;
}

const plain = (rich) => (rich || []).map((r) => r.plain_text).join("");

function titleOf(page, kind) {
  return plain(page.properties?.[TITLE[kind]]?.title);
}

function uniqueIdOf(page) {
  for (const value of Object.values(page.properties || {})) {
    if (value.type === "unique_id" && value.unique_id) {
      const { prefix, number } = value.unique_id;
      return prefix ? `${prefix}-${number}` : String(number);
    }
  }
  return null;
}

function uniqueIdPropName(kind) {
  return kind === "task" ? "ID" : "プロジェクトID";
}

// TSK-12 / PJ-3 / Notion の URL / 32 桁 ID のいずれかからページを引く。
async function resolvePage(kind, reference) {
  if (!reference) fail(`${kind} の指定がない。`);

  const idMatch = reference.replace(/-/g, "").match(/[0-9a-f]{32}/i);
  if (idMatch && !/^[A-Z]+-\d+$/i.test(reference)) {
    return notion(`/pages/${idMatch[0]}`);
  }

  const codeMatch = reference.match(/^([A-Za-z]+)-(\d+)$/);
  if (codeMatch) {
    const pages = await queryAll(DB[kind], {
      property: uniqueIdPropName(kind),
      unique_id: { equals: Number(codeMatch[2]) },
    });
    if (pages.length) return pages[0];
    fail(`${reference} が見つからない。`);
  }

  return findByTitle(kind, reference);
}

async function findByTitle(kind, name) {
  const pages = await queryAll(DB[kind], {
    property: TITLE[kind],
    title: { contains: name },
  });
  const exact = pages.filter((p) => titleOf(p, kind) === name);
  const hits = exact.length ? exact : pages;

  if (hits.length === 1) return hits[0];
  if (hits.length === 0) fail(`${kind} に「${name}」が見つからない。`);
  fail(
    `${kind} の「${name}」が ${hits.length} 件に一致する。候補: ` +
      hits.map((p) => `${uniqueIdOf(p) || ""} ${titleOf(p, kind)}`.trim()).join(" / "),
  );
}

async function relationIds(kind, names) {
  const list = (names || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const ids = [];
  for (const name of list) {
    const page = await findByTitle(kind, name);
    ids.push({ id: page.id });
  }
  return ids;
}

function requireChoice(label, value, allowed) {
  if (value === undefined) return undefined;
  if (!allowed.includes(value)) {
    fail(`${label} は ${allowed.join(" / ")} のいずれかにする。指定値: ${value}`);
  }
  return value;
}

const today = () => new Date().toISOString().slice(0, 10);

// 工数（時間）の引数を数値にする。数字でない値を黙って空欄にしない。
function parseHours(label, value) {
  if (value === undefined) return undefined;
  const hours = typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(hours) || hours <= 0) fail(`${label} は正の数（時間）にする。指定値: ${value}`);
  return hours;
}

const parentIdOf = (page) => page.properties?.親アイテム?.relation?.[0]?.id || null;

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) {
      args._.push(token);
      continue;
    }
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
}

function output(value) {
  console.log(JSON.stringify(value, null, 2));
}

// Notion は Markdown 記法を解釈しない。`#` を含む行をそのまま渡すと、
// 見出しにならず `#` が本文へ残る。ブロック種別へ変換してから渡す。

// **太字** と `コード` だけをインラインで扱う。
function richText(text) {
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

function bodyBlocks(text) {
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

// 1 回の API 呼び出しで追加できる子ブロックは 100 件まで。
async function appendBlocks(pageId, blocks) {
  for (let i = 0; i < blocks.length; i += 100) {
    await notion(`/blocks/${pageId}/children`, "PATCH", { children: blocks.slice(i, i + 100) });
  }
}

// 子ブロックを最後のページまで読む。1 回で返るのは 100 件まで。
async function listChildren(blockId) {
  const results = [];
  let cursor;
  do {
    const page = await notion(`/blocks/${blockId}/children?page_size=100${cursor ? `&start_cursor=${cursor}` : ""}`);
    results.push(...page.results);
    cursor = page.has_more ? page.next_cursor : undefined;
  } while (cursor);
  return results;
}

const kindOf = (reference) => (/^TSK-/i.test(reference || "") ? "task" : "project");

// 既存の本文を消して書き直す。Markdown の変換を直したあとに使う。
async function bodySet(args) {
  if (!args.md) fail("--md は必須。");
  if (!fs.existsSync(args.md)) fail(`${args.md} が見つからない。`);

  const kind = kindOf(args._[0]);
  const page = await resolvePage(kind, args._[0]);
  const blocks = bodyBlocks(fs.readFileSync(args.md, "utf8"));

  // --append は既存の本文を残し、末尾へ足す。プロジェクトの本文（案件資料）に節を足すときに使う。
  const append = Boolean(args.append);
  // 100 ブロックを超える本文も消し切るため、最後のページまで読む。
  const existing = { results: append ? [] : await listChildren(page.id) };
  if (args["dry-run"]) {
    output({
      dryRun: true,
      page: summarize(page, kind),
      append,
      removeBlocks: existing.results.length,
      addBlocks: blocks.length,
      types: [...new Set(blocks.map((b) => b.type))],
    });
    return;
  }

  for (const child of existing.results) {
    await notion(`/blocks/${child.id}`, "DELETE");
  }
  await appendBlocks(page.id, blocks);
  output({ ...summarize(page, kind), removedBlocks: existing.results.length, addedBlocks: blocks.length });
}

// ---- 本文の読み取りと節の差し替え ----------------------------------------
//
// 本文を読むときは Markdown に近い形へ戻す。読むためだけの変換で、body-set へそのまま戻すと
// ページメンションが文字になる。メンションのある本文は、body-section で節だけを差し替える。

function richToMarkdown(rich) {
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

async function blocksToMarkdown(blocks, indent = "") {
  const lines = [];
  let number = 0;
  for (const b of blocks) {
    const value = b[b.type] || {};
    const text = richToMarkdown(value.rich_text);
    number = b.type === "numbered_list_item" ? number + 1 : 0;
    switch (b.type) {
      case "heading_1":
      case "heading_2":
      case "heading_3":
        lines.push("", `${"#".repeat(Number(b.type.slice(-1)))} ${text}`, "");
        break;
      case "paragraph":
        lines.push(indent + text);
        break;
      case "bulleted_list_item":
      case "toggle":
        lines.push(`${indent}- ${text}`);
        break;
      case "numbered_list_item":
        lines.push(`${indent}${number}. ${text}`);
        break;
      case "to_do":
        lines.push(`${indent}- [${value.checked ? "x" : " "}] ${text}`);
        break;
      case "quote":
      case "callout":
        lines.push(`${indent}> ${text}`);
        break;
      case "code":
        lines.push("```" + (value.language || ""), plain(value.rich_text), "```");
        break;
      case "divider":
        lines.push("---");
        break;
      case "child_page":
        lines.push(`${indent}@${value.title}`);
        break;
      case "table": {
        const rows = await listChildren(b.id);
        lines.push("");
        rows.forEach((row, i) => {
          const cells = row.table_row.cells.map((c) => richToMarkdown(c).replace(/\|/g, "\\|"));
          lines.push(`${indent}| ${cells.join(" | ")} |`);
          if (i === 0) lines.push(`${indent}| ${cells.map(() => "---").join(" | ")} |`);
        });
        lines.push("");
        break;
      }
      default:
        lines.push(`${indent}（${b.type}）`);
    }
    if (b.has_children && b.type !== "table" && b.type !== "child_page") {
      lines.push(...(await blocksToMarkdown(await listChildren(b.id), `${indent}  `)));
    }
  }
  return lines;
}

const joinLines = (lines) => lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();

async function bodyGet(args) {
  const kind = kindOf(args._[0]);
  const page = await resolvePage(kind, args._[0]);
  const lines = await blocksToMarkdown(await listChildren(page.id));
  console.log(`<!-- ${uniqueIdOf(page) || ""} ${titleOf(page, kind)} ${page.url} -->\n\n${joinLines(lines)}`);
}

const headingLevel = (b) => (/^heading_[123]$/.test(b.type) ? Number(b.type.slice(-1)) : 0);

// 本文のうち 1 つの見出しの節だけを差し替える。ほかの節（ページメンションを含む）は書き直さない。
// 節は、その見出しの次から、同じか上の段の次の見出しの手前まで。--append なら節の末尾へ足す。
async function bodySection(args) {
  if (!args.heading || args.heading === true) fail("--heading は必須。節の見出しの文字だけを渡す（# は付けない）。");
  if (!args.md) fail("--md は必須。節の中身だけを書き、見出しは含めない。");
  if (!fs.existsSync(args.md)) fail(`${args.md} が見つからない。`);

  const kind = kindOf(args._[0]);
  const page = await resolvePage(kind, args._[0]);
  const blocks = await listChildren(page.id);
  // 「現在地（2026-11-24）」のように後ろに括弧書きが付いた見出しも、「現在地」で一致させる。
  const sameHeading = (text) =>
    text === args.heading || (text.startsWith(args.heading) && /^[（(]/.test(text.slice(args.heading.length)));
  const matches = blocks
    .map((b, i) => ({ b, i }))
    .filter(({ b }) => headingLevel(b) && sameHeading(plain(b[b.type].rich_text).trim()));
  if (!matches.length) fail(`見出し「${args.heading}」が本文に無い。body-get で見出しを確かめる。`);
  if (matches.length > 1) fail(`見出し「${args.heading}」が ${matches.length} か所にあり、どの節か決められない。`);

  const { b: heading, i: start } = matches[0];
  const level = headingLevel(heading);
  let end = start + 1;
  while (end < blocks.length && !(headingLevel(blocks[end]) && headingLevel(blocks[end]) <= level)) end += 1;
  const section = blocks.slice(start + 1, end);

  const added = bodyBlocks(fs.readFileSync(args.md, "utf8"));
  if (!added.length) fail("--md の中身が空。節を空にしない。");
  if (added.some((b) => headingLevel(b) && headingLevel(b) <= level)) {
    fail("--md に、この節と同じか上の段の見出しがある。節の中身だけを書く。");
  }

  const append = Boolean(args.append);
  if (args["new-heading"] === true) fail("--new-heading には新しい見出しの文字を渡す。");
  const newHeading = args["new-heading"];
  if (args["dry-run"]) {
    output({
      dryRun: true,
      page: summarize(page, kind),
      heading: plain(heading[heading.type].rich_text),
      ...(newHeading ? { newHeading } : {}),
      append,
      current: joinLines(await blocksToMarkdown(section)),
      removeBlocks: append ? 0 : section.length,
      addBlocks: added.length,
    });
    return;
  }

  if (newHeading) {
    await notion(`/blocks/${heading.id}`, "PATCH", { [heading.type]: { rich_text: richText(newHeading) } });
  }
  if (!append) {
    for (const child of section) await notion(`/blocks/${child.id}`, "DELETE");
  }
  // 1 回に足せるのは 100 件まで。後ろの塊から同じ位置の直後へ入れると、順序が保たれる。
  const anchor = append && section.length ? section[section.length - 1].id : heading.id;
  for (let i = Math.floor((added.length - 1) / 100) * 100; i >= 0; i -= 100) {
    await notion(`/blocks/${page.id}/children`, "PATCH", { children: added.slice(i, i + 100), after: anchor });
  }
  output({ ...summarize(page, kind), heading: newHeading || plain(heading[heading.type].rich_text), append, removedBlocks: append ? 0 : section.length, addedBlocks: added.length });
}

// Notion のオートメーションは作成の数秒後に走り、API が送った値を上書きすることがある。
// タスクの優先度が「中」へ戻される例を確認済み。POST の応答は上書き前の値なので、
// その場で読んでも気づけない。
//
// 既定では検証しない。優先度は「中」になるが、1 件あたり 10 秒の待ちを避ける方を採る。
// 指定した値を残したい場合は NOTION_VERIFY_DELAY_MS=8000 のように待ち時間を与える。
// 待ってから読み直し、食い違う列だけ PATCH で戻す。
const VERIFY_DELAY_MS = Number(process.env.NOTION_VERIFY_DELAY_MS ?? 0);

function driftOf(properties, page) {
  const drift = {};
  for (const [name, spec] of Object.entries(properties)) {
    const got = page.properties?.[name];
    if (!got) continue;
    if (spec.select && got.select?.name !== spec.select.name) drift[name] = spec;
    else if (spec.status && got.status?.name !== spec.status.name) drift[name] = spec;
    else if (spec.number !== undefined && got.number !== spec.number) drift[name] = spec;
    else if (spec.date && got.date?.start !== spec.date.start) drift[name] = spec;
  }
  return drift;
}

async function createVerified(dbId, properties, children) {
  const created = await notion("/pages", "POST", {
    parent: { database_id: dbId },
    properties,
    ...(children ? { children } : {}),
  });
  if (VERIFY_DELAY_MS <= 0) return { page: created, repaired: [] };

  await new Promise((resolve) => setTimeout(resolve, VERIFY_DELAY_MS));
  const settled = await notion(`/pages/${created.id}`);
  const drift = driftOf(properties, settled);
  const repaired = Object.keys(drift);
  if (!repaired.length) return { page: settled, repaired };
  return { page: await notion(`/pages/${created.id}`, "PATCH", { properties: drift }), repaired };
}

function summarize(page, kind) {
  return {
    id: uniqueIdOf(page),
    name: titleOf(page, kind),
    url: page.url,
    pageId: page.id,
  };
}

// ---- コマンド -----------------------------------------------------------

// 削減時間の見積（rules/estimate.md）を、自動化の前と後の月の作業時間としてプロジェクトの列に入れる。
// 削減時間と削減額は Notion の数式が出す。作るときは概算、完了後は先方の回答で置き換える。
async function projectSavings(args) {
  const before = parseHours("--before", args.before);
  const after = parseHours("--after", args.after);
  if (before === undefined || after === undefined) fail("--before と --after は必須。自動化の前と後の月の作業時間（時間）。");
  // 概算では、削減にならない値は見直させる。完了後の先方の回答（--answer）は、効果が出なかった場合も
  // そのまま記録しないと、数式が出ていない削減額を出し続けるので止めない。
  const isAnswer = Boolean(args.answer);
  if (after >= before && !isAnswer) fail(`自動化後（${after}）が自動化前（${before}）以上で、削減にならない。概算を見直す。完了後の先方の回答なら --answer を付ける。`);
  const warning = after >= before ? "先方の回答では削減が出ていない。理由を本文に残す。" : null;
  const page = await resolvePage("project", args._[0]);
  const properties = { 自動化前月間作業時間: { number: before }, 自動化後月間作業時間: { number: after } };
  const previous = {
    before: page.properties?.自動化前月間作業時間?.number ?? null,
    after: page.properties?.自動化後月間作業時間?.number ?? null,
  };
  if (args["dry-run"]) {
    output({ dryRun: true, ...summarize(page, "project"), answer: isAnswer, previous, properties, monthlyReductionHours: Math.round((before - after) * 10) / 10, ...(warning ? { warning } : {}) });
    return;
  }
  const updated = await notion(`/pages/${page.id}`, "PATCH", { properties });
  output({ ...summarize(updated, "project"), answer: isAnswer, previous, before, after, monthlyReductionHours: Math.round((before - after) * 10) / 10, ...(warning ? { warning } : {}) });
}

// 完了にするのは、すべてのタスクが閉じ、子のないタスクに実績がそろってから（rules/estimate.md の「実績」）。
// 完了にするときは完了日を入れ、見積と実績の合計を返す。
async function projectStatus(args) {
  const status = requireChoice("--status", args.status, PROJECT_STATUS);
  if (!status) fail("--status は必須。");
  const page = await resolvePage("project", args._[0]);
  const properties = { ステータス: { status: { name: status } } };
  const result = { previous: page.properties?.ステータス?.status?.name || null };

  if (status === "完了") {
    const tasks = await queryAll(DB.task, { property: "プロジェクト", relation: { contains: page.id } });
    const label = (t) => `${uniqueIdOf(t)} ${titleOf(t, "task")}`;
    const hasChildren = (t) => (t.properties?.サブアイテム?.relation || []).length > 0;
    const open = tasks.filter((t) => t.properties?.ステータス?.status?.name !== "完了");
    const noActual = tasks.filter((t) => !hasChildren(t) && t.properties?.実績工数h?.number == null);
    const problems = [];
    if (open.length) problems.push(`完了していないタスク: ${open.map(label).join(" / ")}`);
    if (noActual.length) problems.push(`実績工数が空のタスク: ${noActual.map(label).join(" / ")}`);
    if (problems.length) fail(`プロジェクトを完了にできない。${problems.join("。")}`);

    properties.完了日 = { date: { start: args.date || today() } };
    const round1 = (n) => Math.round(n * 10) / 10;
    const estimate = tasks.filter((t) => !parentIdOf(t)).reduce((s, t) => s + (t.properties?.見積工数h?.number ?? 0), 0);
    const actual = tasks.filter((t) => !hasChildren(t)).reduce((s, t) => s + (t.properties?.実績工数h?.number ?? 0), 0);
    Object.assign(result, {
      estimateTotalHours: round1(estimate),
      actualTotalHours: round1(actual),
      actualPerEstimate: estimate ? Math.round((actual / estimate) * 100) / 100 : null,
    });
    if (page.properties?.自動化後月間作業時間?.number == null) {
      result.warning = "削減時間が入っていない。先方の回答を project-savings --answer で入れる。";
    }
  }

  if (args["dry-run"]) {
    output({ dryRun: true, ...summarize(page, "project"), ...result, properties });
    return;
  }
  const updated = await notion(`/pages/${page.id}`, "PATCH", { properties });
  output({ ...summarize(updated, "project"), status, ...result });
}

async function projectCreate(args) {
  if (!args.name) fail("--name は必須。");
  if (!args.client) fail("--client は必須。rules/notion.md でクライアントを必須にしている。");
  if (!args.pm && !args.dev) fail("--pm か --dev のどちらかは必須。担当のいない案件を作らない。");

  const sameName = await queryAll(DB.project, {
    property: TITLE.project,
    title: { equals: args.name },
  });
  if (sameName.length) {
    fail(
      `「${args.name}」は既にある。作らずに既存のものを使う: ` +
        sameName.map((p) => `${uniqueIdOf(p) || ""} ${p.url}`.trim()).join(" / "),
    );
  }

  const properties = {
    [TITLE.project]: { title: [{ text: { content: args.name } }] },
    クライアント: { relation: await relationIds("client", args.client) },
    開始日: { date: { start: args.start || today() } },
  };
  // 指定がなければ送らず、Notion 側の既定値に任せる。
  if (args.status) properties.ステータス = { status: { name: requireChoice("--status", args.status, PROJECT_STATUS) } };
  if (args.due) properties.予定終了日 = { date: { start: args.due } };
  if (args.priority) properties.優先度 = { select: { name: requireChoice("--priority", args.priority, PRIORITY) } };
  if (args.kind) properties["ショット/ランニング"] = { select: { name: args.kind } };
  if (args.pm) properties.PM = { relation: await relationIds("member", args.pm) };
  if (args.dev) properties.開発担当 = { relation: await relationIds("member", args.dev) };
  if (args.reviewer) properties.レビュワー = { relation: await relationIds("member", args.reviewer) };
  if (args.repo) properties.リポジトリ = { relation: await relationIds("repo", args.repo) };
  if (args.note) properties.備考 = { rich_text: [{ text: { content: String(args.note).slice(0, 2000) } }] };

  const body = args.md && fs.existsSync(args.md) ? fs.readFileSync(args.md, "utf8") : args.body;

  if (args["dry-run"]) {
    output({ dryRun: true, database: "プロジェクト", properties, bodyLines: body ? bodyBlocks(body).length : 0 });
    return;
  }

  const { page, repaired } = await createVerified(DB.project, properties, body ? bodyBlocks(body) : undefined);
  output({ ...summarize(page, "project"), ...(repaired.length ? { repaired } : {}) });
}

async function projectGet(args) {
  const page = await resolvePage("project", args._[0]);
  const tasks = await queryAll(DB.task, {
    property: "プロジェクト",
    relation: { contains: page.id },
  });
  output({
    ...summarize(page, "project"),
    status: page.properties?.ステータス?.status?.name || null,
    client: (page.properties?.クライアント?.relation || []).length,
    tasks: tasks.map((t) => ({
      id: uniqueIdOf(t),
      name: titleOf(t, "task"),
      status: t.properties?.ステータス?.status?.name || null,
      isParent: !parentIdOf(t),
      type: t.properties?.タスク種別?.select?.name || null,
      estimateHours: t.properties?.見積工数h?.number ?? null,
      actualHours: t.properties?.実績工数h?.number ?? null,
      url: t.url,
    })),
  });
}

// 見積は親タスクにだけ、実績は子のないタスクにだけ入れる（rules/notion.md）。
// 親ごとに見積と実績（子があれば子の合計）を並べ、親の見積の合計を予想開発時間へ入れる。
async function projectEstimate(args) {
  const page = await resolvePage("project", args._[0]);
  const tasks = await queryAll(DB.task, {
    property: "プロジェクト",
    relation: { contains: page.id },
  });

  const parents = tasks.filter((t) => !parentIdOf(t));
  if (!parents.length) fail("親タスクがない。先に親タスクを作り、見積を入れる。");
  const rows = parents.map((p) => {
    const children = tasks.filter((t) => parentIdOf(t) === p.id);
    const done = children.filter((c) => c.properties?.ステータス?.status?.name === "完了").length;
    const estimate = p.properties?.見積工数h?.number ?? null;
    // 子のない親は、親に入れた実績を使う。
    const actual = children.length
      ? children.reduce((sum, c) => sum + (c.properties?.実績工数h?.number ?? 0), 0)
      : p.properties?.実績工数h?.number ?? 0;
    const isOpen = children.length ? done < children.length : p.properties?.ステータス?.status?.name !== "完了";
    return {
      id: uniqueIdOf(p),
      name: titleOf(p, "task"),
      estimateHours: estimate,
      actualHours: actual,
      children: `${done}/${children.length}`,
      // 終わっていないのに実績が見積に届いた親。利用者に知らせる。
      overrun: estimate !== null && actual >= estimate && isOpen,
    };
  });

  const missing = rows.filter((r) => r.estimateHours === null);
  if (missing.length) {
    fail(`見積工数が空の親タスクがある: ${missing.map((r) => `${r.id} ${r.name}`).join(" / ")}`);
  }
  const total = rows.reduce((sum, r) => sum + r.estimateHours, 0);
  const current = page.properties?.予想開発時間?.number ?? null;

  if (!args["dry-run"] && current !== total) {
    await notion(`/pages/${page.id}`, "PATCH", { properties: { 予想開発時間: { number: total } } });
  }
  output({
    ...summarize(page, "project"),
    ...(args["dry-run"] ? { dryRun: true } : {}),
    parents: rows,
    estimateTotalHours: total,
    previousPlannedHours: current,
  });
}

async function taskCreate(args) {
  if (!args.project) fail("--project は必須。プロジェクトに紐づかないタスクを作らない。");
  if (!args.name) fail("--name は必須。");

  // 見積は親タスクにだけ入れる（rules/notion.md）。
  const estimate = parseHours("--estimate", args.estimate);
  if (args.parent && estimate !== undefined) fail("子タスクには見積を入れない。見積は親タスクにだけ入れる。");
  if (!args.parent && estimate === undefined) fail("親タスクには --estimate が必須。プロジェクトを作るときに親ごとに見積もる。");

  const project = await resolvePage("project", args.project);
  const properties = {
    [TITLE.task]: { title: [{ text: { content: args.name } }] },
    プロジェクト: { relation: [{ id: project.id }] },
    ステータス: { status: { name: requireChoice("--status", args.status, TASK_STATUS) || "未着手" } },
  };
  if (estimate !== undefined) properties.見積工数h = { number: estimate };
  if (args.kind) properties.工数区分 = { select: { name: requireChoice("--kind", args.kind, TASK_KIND) } };
  // タスク種別は任意。子タスクの実績を種別ごとに集計して、見積の基準を直すのに使う。
  if (args.type) properties.タスク種別 = { select: { name: requireChoice("--type", args.type, TASK_TYPE) } };
  if (args.priority) properties.優先度 = { select: { name: requireChoice("--priority", args.priority, PRIORITY) } };
  if (args.due) properties.期日 = { date: { start: args.due } };
  if (args.start) properties.開始日 = { date: { start: args.start } };
  if (args.assignee) properties.担当者 = { relation: await relationIds("member", args.assignee) };
  if (args.parent) {
    const parent = await resolvePage("task", args.parent);
    properties.親アイテム = { relation: [{ id: parent.id }] };
  }

  if (args["dry-run"]) {
    output({ dryRun: true, database: "タスク", project: summarize(project, "project"), properties });
    return;
  }

  const { page, repaired } = await createVerified(
    DB.task,
    properties,
    args.body ? bodyBlocks(String(args.body)) : undefined,
  );
  output({ ...summarize(page, "task"), ...(repaired.length ? { repaired } : {}) });
}

async function taskGet(args) {
  const page = await resolvePage("task", args._[0]);
  const projectRel = page.properties?.プロジェクト?.relation || [];
  let project = null;
  let repos = [];
  if (projectRel.length) {
    const projectPage = await notion(`/pages/${projectRel[0].id}`);
    project = summarize(projectPage, "project");
    for (const rel of projectPage.properties?.リポジトリ?.relation || []) {
      const repoPage = await notion(`/pages/${rel.id}`);
      repos.push({
        name: titleOf(repoPage, "repo"),
        url: repoPage.properties?.URL?.url || null,
        defaultBranch: plain(repoPage.properties?.["デフォルトブランチ"]?.rich_text) || null,
      });
    }
  }
  // PR 本文の 2 行目に親タスクを書くため、親があれば返す（rules/git.md）
  const parentRel = page.properties?.親アイテム?.relation || [];
  const parent = parentRel.length
    ? summarize(await notion(`/pages/${parentRel[0].id}`), "task")
    : null;
  // 親を閉じるときに、子の状態と実績を確かめるため返す。
  const children = [];
  for (const rel of page.properties?.サブアイテム?.relation || []) {
    const child = await notion(`/pages/${rel.id}`);
    children.push({
      ...summarize(child, "task"),
      status: child.properties?.ステータス?.status?.name || null,
      type: child.properties?.タスク種別?.select?.name || null,
      actualHours: child.properties?.実績工数h?.number ?? null,
    });
  }
  children.sort((a, b) => a.name.localeCompare(b.name, "ja", { numeric: true }));
  // task-link-pr が本文に足した PR のリンク。閉じる前にマージ済みかを確かめるのに使う。
  const prUrls = [
    ...new Set(
      (await listChildren(page.id))
        .flatMap((b) => (b[b.type]?.rich_text || []).map((r) => r.href))
        .filter((href) => href && /github\.com\/[^/]+\/[^/]+\/pull\/\d+/.test(href)),
    ),
  ];
  output({
    ...summarize(page, "task"),
    parent,
    children,
    prUrls,
    status: page.properties?.ステータス?.status?.name || null,
    kind: page.properties?.工数区分?.select?.name || null,
    type: page.properties?.タスク種別?.select?.name || null,
    priority: page.properties?.優先度?.select?.name || null,
    estimateHours: page.properties?.見積工数h?.number ?? null,
    actualHours: page.properties?.実績工数h?.number ?? null,
    due: page.properties?.期日?.date?.start || null,
    project,
    repos,
  });
}

async function taskStatus(args) {
  const status = requireChoice("--status", args.status, TASK_STATUS);
  if (!status) fail("--status は必須。");
  const actual = parseHours("--actual", args.actual);
  const page = await resolvePage("task", args._[0]);
  const hasChildren = (page.properties?.サブアイテム?.relation || []).length > 0;

  // 実績は子のないタスクにだけ入れる。子のある親にも入れると、プロジェクトの合計で二重に数える（rules/notion.md）。
  if (actual !== undefined && hasChildren) fail("子のある親タスクには実績工数を入れない。実績は子タスクに入れる。");
  // 閉じるときは必ず実績を確かめる。既に値があっても省略させない（入れ忘れと見積の写しを防ぐ）。
  if (status === "完了" && !hasChildren && actual === undefined) {
    fail("子のないタスクを完了にするときは、--actual で実績工数を必ず入れる。既に値があっても入れ直す。");
  }
  if (status === "完了" && hasChildren) {
    const missing = [];
    for (const rel of page.properties.サブアイテム.relation) {
      const child = await notion(`/pages/${rel.id}`);
      if (child.properties?.実績工数h?.number == null) missing.push(`${uniqueIdOf(child)} ${titleOf(child, "task")}`);
    }
    if (missing.length) fail(`実績工数が空の子タスクがあるので、親を完了にできない: ${missing.join(" / ")}`);
  }

  const properties = { ステータス: { status: { name: status } } };
  if (status === "完了") properties.完了日 = { date: { start: args.date || today() } };
  if (actual !== undefined) properties.実績工数h = { number: actual };
  if (args["dry-run"]) {
    output({ dryRun: true, task: summarize(page, "task"), properties });
    return;
  }
  const updated = await notion(`/pages/${page.id}`, "PATCH", { properties });
  output({ ...summarize(updated, "task"), status });
}

async function taskLinkPr(args) {
  if (!args.url) fail("--url は必須。");
  const page = await resolvePage("task", args._[0]);
  const label = args.title ? `${args.title}` : args.url;

  if (args["dry-run"]) {
    output({ dryRun: true, task: summarize(page, "task"), appendLink: args.url });
    return;
  }

  await notion(`/blocks/${page.id}/children`, "PATCH", {
    children: [
      {
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [
            { text: { content: "PR: " } },
            { text: { content: label, link: { url: args.url } } },
          ],
        },
      },
    ],
  });

  // Issue/PR の行は GitHub から定期同期される。すでにあれば相互リレーションも張る。
  const issues = await queryAll(DB.issue, { property: "URL", url: { equals: args.url } });
  let linked = false;
  if (issues.length) {
    await notion(`/pages/${issues[0].id}`, "PATCH", {
      properties: { 関連タスク: { relation: [{ id: page.id }] } },
    });
    await notion(`/pages/${page.id}`, "PATCH", {
      properties: { "関連PR/Issue": { relation: [{ id: issues[0].id }] } },
    });
    linked = true;
  }
  output({
    ...summarize(page, "task"),
    prUrl: args.url,
    relationLinked: linked,
    note: linked ? null : "Issue/PR 行が未同期。次回の同期後に relation が付く。",
  });
}

// GitHub からの同期は「フルネーム」で行を突き合わせる。同じ値で作れば、
// 次回の同期は新しい行を足さずにこの行を更新する。
async function repoCreate(args) {
  if (!args.full) fail("--full は必須。owner/name の形式で指定する。");
  if (!args.project) fail("--project は必須。プロジェクトに紐づかないリポジトリを作らない。");

  const project = await resolvePage("project", args.project);
  const name = args.name || args.full.split("/").pop();

  const existing = await queryAll(DB.repo, {
    property: "フルネーム",
    rich_text: { equals: args.full },
  });

  const properties = {
    [TITLE.repo]: { title: [{ text: { content: name } }] },
    フルネーム: { rich_text: [{ text: { content: args.full } }] },
    関連プロジェクト: { relation: [{ id: project.id }] },
  };
  if (args.url) properties.URL = { url: args.url };
  if (args.visibility) properties.可視性 = { select: { name: requireChoice("--visibility", args.visibility, ["public", "private"]) } };
  if (args.branch) properties["デフォルトブランチ"] = { rich_text: [{ text: { content: args.branch } }] };
  if (args.description) properties.説明 = { rich_text: [{ text: { content: String(args.description).slice(0, 2000) } }] };
  properties.オーナー = { rich_text: [{ text: { content: args.full.split("/")[0] } }] };

  if (args["dry-run"]) {
    output({ dryRun: true, database: "リポジトリ", existing: existing.length, properties });
    return;
  }

  if (existing.length) {
    const updated = await notion(`/pages/${existing[0].id}`, "PATCH", { properties });
    output({ ...summarize(updated, "repo"), updated: true });
    return;
  }
  const { page, repaired } = await createVerified(DB.repo, properties);
  output({ ...summarize(page, "repo"), created: true, ...(repaired.length ? { repaired } : {}) });
}

// Notion に完全削除の API はない。ゴミ箱へ移すだけで、UI から元へ戻せる。
async function taskArchive(args) {
  const page = await resolvePage("task", args._[0]);
  if (args["dry-run"]) {
    output({ dryRun: true, task: summarize(page, "task"), archive: true });
    return;
  }
  await notion(`/pages/${page.id}`, "PATCH", { archived: true });
  output({ ...summarize(page, "task"), archived: true });
}

async function members() {
  const pages = await queryAll(DB.member, {
    property: "在籍状況",
    select: { equals: "在籍" },
  });
  output(
    pages.map((p) => ({
      name: titleOf(p, "member"),
      role: p.properties?.役職?.select?.name || null,
    })),
  );
}

async function clients() {
  const pages = await queryAll(DB.client);
  output(
    pages
      .map((p) => ({
        name: titleOf(p, "client"),
        status: p.properties?.ステータス?.select?.name || null,
      }))
      .filter((c) => c.name),
  );
}

const COMMANDS = {
  "project-create": projectCreate,
  "project-get": projectGet,
  "project-estimate": projectEstimate,
  "project-savings": projectSavings,
  "project-status": projectStatus,
  "task-create": taskCreate,
  "task-get": taskGet,
  "task-status": taskStatus,
  "task-link-pr": taskLinkPr,
  "task-archive": taskArchive,
  "repo-create": repoCreate,
  "body-set": bodySet,
  "body-get": bodyGet,
  "body-section": bodySection,
  members,
  clients,
};

const [command, ...rest] = process.argv.slice(2);
if (!command || !COMMANDS[command]) {
  console.error(`使い方: node ${path.basename(process.argv[1])} <command> [options]

  project-create --name <名前> --client <会社名> (--pm <氏名> | --dev <氏名,...>)
                 [--reviewer <氏名>] [--repo <リポジトリ名>] [--start YYYY-MM-DD]
                 [--due YYYY-MM-DD] [--priority 高|中|低] [--kind ショット|ランニング]
                 [--md <案件資料のパス>] [--note <備考>] [--status <ステータス>] [--dry-run]
  project-get    <PJ-12|URL|名前>
  project-estimate <PJ-12> [--dry-run]
                 親ごとの見積と子の実績を並べ、親の見積の合計を予想開発時間へ入れる
  task-create    --project <PJ-12> --name <名前> [--kind 開発|PM] [--type <タスク種別>]
                 [--priority 高|中|低] [--assignee <氏名>] [--due YYYY-MM-DD]
                 [--body <説明>] [--dry-run]
                 (--estimate <h> | --parent <TSK-3>)   見積は親だけ。子には入れない
  project-status <PJ-12> --status <ステータス> [--date YYYY-MM-DD] [--dry-run]
                 完了にするのは、すべてのタスクが完了し、子のないタスクに実績がそろってから。完了日も入れる
  task-get       <TSK-12|URL|名前>   子タスクと、本文に紐付けた PR の URL も返す
  task-status   <TSK-12> --status 未着手|進行中|レビュー|完了|保留 [--actual <h>] [--dry-run]
                 完了にするときは --actual が必須（子のないタスク）。子のある親は子の実績がそろうまで完了にできない
  task-link-pr   <TSK-12> --url <PR の URL> [--title <PR タイトル>] [--dry-run]
  task-archive   <TSK-12> [--dry-run]   ゴミ箱へ移す。UI から元へ戻せる
  repo-create    --full <owner/name> --project <PJ-12> [--name <表示名>] [--url <URL>]
                 [--visibility public|private] [--branch <既定ブランチ>] [--description <説明>]
                 [--dry-run]   フルネームが同じ行があれば更新する
  project-savings <PJ-12> --before <h> --after <h> [--answer] [--dry-run]
                 自動化の前と後の月の作業時間を入れる。完了後の先方の回答は --answer を付ける
  body-set       <PJ-12|TSK-12> --md <Markdown のパス> [--append] [--dry-run]
                 既存の本文を消して書き直す。--append なら末尾へ足す
  body-get       <PJ-12|TSK-12>   本文を Markdown に近い形で読む。読むためだけの変換
  body-section   <PJ-12|TSK-12> --heading <見出し> --md <中身のパス> [--new-heading <見出し>]
                 [--append] [--dry-run]
                 1 つの節だけを差し替える。--append なら節の末尾へ足す。ほかの節は触らない。
                 「現在地（日付）」のような括弧書き付きの見出しも、括弧の前の文字で選べる
  members       在籍メンバーの一覧
  clients        クライアントの一覧`);
  process.exit(1);
}

await COMMANDS[command](parseArgs(rest));
