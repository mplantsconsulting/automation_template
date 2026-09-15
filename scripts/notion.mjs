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
const PROJECT_STATUS = ["保留", "未着手", "進行中", "中止", "完了"];
const PRIORITY = ["高", "中", "低"];
const TASK_KIND = ["開発", "PM"];

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

// 本文を段落ブロックへ変換する。見出しと箇条書きだけを最低限扱う。
function bodyBlocks(text) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 100)
    .map((line) => {
      if (line.startsWith("- ")) {
        return {
          object: "block",
          type: "bulleted_list_item",
          bulleted_list_item: { rich_text: [{ text: { content: line.slice(2).slice(0, 2000) } }] },
        };
      }
      return {
        object: "block",
        type: "paragraph",
        paragraph: { rich_text: [{ text: { content: line.slice(0, 2000) } }] },
      };
    });
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

async function projectCreate(args) {
  if (!args.name) fail("--name は必須。");
  if (!args.client) fail("--client は必須。rules/notion.md でクライアントを必須にしている。");
  if (!args.pm && !args.dev) fail("--pm か --dev のどちらかは必須。担当のいない案件を作らない。");

  const properties = {
    [TITLE.project]: { title: [{ text: { content: args.name } }] },
    クライアント: { relation: await relationIds("client", args.client) },
    ステータス: { status: { name: requireChoice("--status", args.status, PROJECT_STATUS) || "未着手" } },
    開始日: { date: { start: args.start || today() } },
  };
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
      estimateHours: t.properties?.見積工数h?.number ?? null,
      url: t.url,
    })),
  });
}

async function taskCreate(args) {
  if (!args.project) fail("--project は必須。プロジェクトに紐づかないタスクを作らない。");
  if (!args.name) fail("--name は必須。");

  const project = await resolvePage("project", args.project);
  const properties = {
    [TITLE.task]: { title: [{ text: { content: args.name } }] },
    プロジェクト: { relation: [{ id: project.id }] },
    ステータス: { status: { name: requireChoice("--status", args.status, TASK_STATUS) || "未着手" } },
  };
  if (args.estimate !== undefined) properties.見積工数h = { number: Number(args.estimate) };
  if (args.kind) properties.工数区分 = { select: { name: requireChoice("--kind", args.kind, TASK_KIND) } };
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
  output({
    ...summarize(page, "task"),
    status: page.properties?.ステータス?.status?.name || null,
    kind: page.properties?.工数区分?.select?.name || null,
    priority: page.properties?.優先度?.select?.name || null,
    estimateHours: page.properties?.見積工数h?.number ?? null,
    due: page.properties?.期日?.date?.start || null,
    project,
    repos,
  });
}

async function taskStatus(args) {
  const status = requireChoice("--status", args.status, TASK_STATUS);
  if (!status) fail("--status は必須。");
  const page = await resolvePage("task", args._[0]);
  const properties = { ステータス: { status: { name: status } } };
  if (status === "完了") properties.完了日 = { date: { start: args.date || today() } };
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
  "task-create": taskCreate,
  "task-get": taskGet,
  "task-status": taskStatus,
  "task-link-pr": taskLinkPr,
  "task-archive": taskArchive,
  "repo-create": repoCreate,
  members,
  clients,
};

const [command, ...rest] = process.argv.slice(2);
if (!command || !COMMANDS[command]) {
  console.error(`使い方: node ${path.basename(process.argv[1])} <command> [options]

  project-create --name <名前> --client <会社名> (--pm <氏名> | --dev <氏名,...>)
                 [--reviewer <氏名>] [--repo <リポジトリ名>] [--start YYYY-MM-DD]
                 [--due YYYY-MM-DD] [--priority 高|中|低] [--kind ショット|ランニング]
                 [--md <案件資料のパス>] [--note <備考>] [--dry-run]
  project-get    <PJ-12|URL|名前>
  task-create    --project <PJ-12> --name <名前> [--estimate <h>] [--kind 開発|PM]
                 [--priority 高|中|低] [--assignee <氏名>] [--due YYYY-MM-DD]
                 [--parent <TSK-3>] [--body <説明>] [--dry-run]
  task-get       <TSK-12|URL|名前>
  task-status    <TSK-12> --status 未着手|進行中|レビュー|完了|保留 [--dry-run]
  task-link-pr   <TSK-12> --url <PR の URL> [--title <PR タイトル>] [--dry-run]
  task-archive   <TSK-12> [--dry-run]   ゴミ箱へ移す。UI から元へ戻せる
  repo-create    --full <owner/name> --project <PJ-12> [--name <表示名>] [--url <URL>]
                 [--visibility public|private] [--branch <既定ブランチ>] [--description <説明>]
                 [--dry-run]   フルネームが同じ行があれば更新する
  members        在籍メンバーの一覧
  clients        クライアントの一覧`);
  process.exit(1);
}

await COMMANDS[command](parseArgs(rest));
