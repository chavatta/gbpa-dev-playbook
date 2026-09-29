#!/usr/bin/env node
// Smoke test do fluxo .claude/workflows/gbpa-task.js com agent() simulado.
// Uso: node scripts/test-gbpa-task.mjs [caminho-do-script]
//
// Roda o corpo do script como o runtime do Workflow faz (top-level await/return, sem
// filesystem) e confere, por cenário, o status devolvido, quem foi chamado e o que o script
// disse a cada agente. Não gasta quota: nenhum modelo é chamado. Rode antes de propor
// qualquer mudança no script (GOVERNANCE.md §6.2) — o caso novo entra aqui junto.
import { readFileSync } from "node:fs";

const PATH = process.argv[2] || ".claude/workflows/gbpa-task.js";
const src = readFileSync(PATH, "utf8").replace(/^export const meta/m, "const meta");
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const body = new AsyncFunction("args", "agent", "parallel", "pipeline", "phase", "log", "budget", "workflow", src);

const OK = (agent) => ({ agent, aprovado: true, issues: [], artifact_path: `artifacts/${agent}.md` });
const NOK = (agent) => ({ agent, aprovado: false, issues: [{ severity: "HIGH", summary: `defeito visto por ${agent}` }], artifact_path: `artifacts/${agent}.md` });
const PTR = (agent, status = "completed") => ({
  agent, model: "claude-opus-5-5", task_id: "t", status, artifact_path: `artifacts/${agent}.md`,
  files_changed: [], next_agent: "-", context_for_next: "-", blockers: status === "blocked" ? ["falta X"] : [], skill_candidates: [],
});
const RECON = (o = {}) => ({ complexity: "media", sensitive: false, sensitive_reasons: [], needs_spec: false, data_migration: false, files: ["a.ts"], summary: "-", ...o });

// Cada cenário responde por label; função recebe (rodada) quando o label varia por rodada.
async function run({ args, answers }) {
  const calls = [];
  let round = 0;
  const agent = async (prompt, opts = {}) => {
    const label = opts.label || "?";
    if (label.startsWith("coder")) round = Number(label.slice(-1));
    calls.push({ label, prompt, agentType: opts.agentType, schema: opts.schema });
    const key = Object.keys(answers).find((k) => label === k || label.startsWith(k + " "));
    const a = key === undefined ? undefined : answers[key];
    return typeof a === "function" ? a(round) : a;
  };
  const parallel = async (thunks) => Promise.all(thunks.map((t) => t().catch(() => null)));
  let res, err;
  try {
    res = await body(args, agent, parallel, async () => [], () => {}, () => {}, { total: null }, async () => null);
  } catch (e) { err = e; }
  return { res, err, calls, labels: calls.map((c) => c.label) };
}

const T = "2026-09-23_smoke";
const CASES = [
  ["task_id inválido lança erro", { args: { task_id: "x" }, answers: {} },
    (r) => r.err && /task_id/.test(r.err.message)],

  ["recon sem retorno → blocked", { args: { task_id: T }, answers: { recon: null } },
    (r) => r.res.status === "blocked" && /recon/.test(r.res.erro)],

  ["trivial aprovada → done, sem Tester, Coder dono dos testes",
    { args: { task_id: T }, answers: { recon: RECON({ complexity: "trivial" }), coder: PTR("coder"), review: OK("reviewer") } },
    (r) => r.res.status === "done" && r.res.sensitive === false && !r.labels.includes("tester")
      && /o dono é você/.test(r.calls.find((c) => c.label === "coder r1").prompt)],

  ["média, reprova 2× → escalado",
    { args: { task_id: T }, answers: { recon: RECON(), architect: PTR("architect"), design: PTR("architect"), plan: PTR("planner"), coder: PTR("coder"), tester: PTR("tester"), review: NOK("reviewer") } },
    (r) => r.res.status === "escalado" && r.labels.filter((l) => l.startsWith("coder")).length === 2],

  ["coder bloqueado → blocked em coder",
    { args: { task_id: T }, answers: { recon: RECON(), design: PTR("architect"), plan: PTR("planner"), coder: PTR("coder", "blocked"), tester: PTR("tester") } },
    (r) => r.res.status === "blocked" && r.res.em === "coder"],

  ["recon eleva a sensível: 3 lentes, r2 aprova, cego aprova → done sensitive",
    { args: { task_id: T, sensitive: false }, answers: {
        recon: RECON({ sensitive: true }), design: PTR("architect"), plan: PTR("planner"), coder: PTR("coder"), tester: PTR("tester"),
        "lente: correção": (n) => (n === 1 ? NOK("reviewer") : OK("reviewer")),
        "lente: segurança": OK("security-sre"), "lente: reprodução": OK("tester"), "refutador cego": OK("reviewer") } },
    (r) => r.res.status === "done" && r.res.sensitive === true
      && r.labels.filter((l) => l === "tester").length === 1
      && /o dono é você/.test(r.calls.find((c) => c.label === "coder r2").prompt)
      && r.labels.length === 13],

  ["refutador cego sem retorno → blocked (fail-closed)",
    { args: { task_id: T, sensitive: true }, answers: {
        recon: RECON(), design: PTR("architect"), plan: PTR("planner"), coder: PTR("coder"), tester: PTR("tester"),
        "lente: correção": OK("reviewer"), "lente: segurança": OK("security-sre"), "lente: reprodução": OK("tester"), "refutador cego": null } },
    (r) => r.res.status === "blocked" && r.res.em === "refutador cego"],

  ["refutador cego reprova → divergencia",
    { args: { task_id: T, sensitive: true }, answers: {
        recon: RECON(), design: PTR("architect"), plan: PTR("planner"), coder: PTR("coder"), tester: PTR("tester"),
        "lente: correção": OK("reviewer"), "lente: segurança": OK("security-sre"), "lente: reprodução": OK("tester"), "refutador cego": NOK("reviewer") } },
    (r) => r.res.status === "divergencia" && r.res.issues.length === 1],

  ["lente ausente → blocked em lentes, sem gastar rodada do Coder",
    { args: { task_id: T, sensitive: true }, answers: {
        recon: RECON(), design: PTR("architect"), plan: PTR("planner"), coder: PTR("coder"), tester: PTR("tester"),
        "lente: correção": OK("reviewer"), "lente: segurança": null, "lente: reprodução": OK("tester") } },
    (r) => r.res.status === "blocked" && r.res.em === "lentes" && !r.labels.includes("coder r2") && !r.labels.includes("refutador cego")],

  ["reviewer sem retorno (task normal) → blocked em reviewer",
    { args: { task_id: T }, answers: { recon: RECON(), design: PTR("architect"), plan: PTR("planner"), coder: PTR("coder"), tester: PTR("tester"), review: null } },
    (r) => r.res.status === "blocked" && r.res.em === "reviewer" && !r.labels.includes("coder r2")],

  ["épica com Planner sem retorno → blocked, nunca fatiada vazia",
    { args: { task_id: T }, answers: { recon: RECON({ complexity: "epica" }), "fatiar épica": null } },
    (r) => r.res.status === "blocked" && r.res.em === "planner"],

  ["brief sensível e recon não → segue sensível (nunca rebaixa)",
    { args: { task_id: T, sensitive: true }, answers: {
        recon: RECON({ complexity: "trivial", sensitive: false }), coder: PTR("coder"),
        "lente: correção": OK("reviewer"), "lente: segurança": OK("security-sre"), "lente: reprodução": OK("tester"), "refutador cego": OK("reviewer") } },
    (r) => r.res.status === "done" && r.res.sensitive === true && r.labels.includes("refutador cego")],

  ["épica → fatiada, sem Coder",
    { args: { task_id: T }, answers: { recon: RECON({ complexity: "epica", sensitive: true }), "fatiar épica": { slices: [{ slug: "a", objective: "-", files: [] }] } } },
    (r) => r.res.status === "fatiada" && r.res.slices.length === 1 && r.res.sensitive === true && !r.labels.some((l) => l.startsWith("coder"))],

  ["spec quando needs_spec", { args: { task_id: T }, answers: {
        recon: RECON({ needs_spec: true }), spec: PTR("spec-writer"), design: PTR("architect"), plan: PTR("planner"),
        coder: PTR("coder"), tester: PTR("tester"), review: OK("reviewer") } },
    (r) => r.res.status === "done" && r.labels.includes("spec")],

  ["todo retorno carrega task_id e events", { args: { task_id: T }, answers: { recon: RECON(), design: null } },
    (r) => r.res.status === "blocked" && r.res.task_id === T && Array.isArray(r.res.events)],

  ["POINTER declara provider e needs_human como opcionais (HANDOFF §3.2)",
    { args: { task_id: T }, answers: { recon: RECON({ complexity: "trivial" }), coder: PTR("coder"), review: OK("reviewer") } },
    (r) => {
      const schema = r.calls.find((c) => c.label === "coder r1").schema;
      const human = schema.properties.needs_human;
      return r.res.status === "done" && schema.properties.provider.type === "string"
        && !schema.required.includes("provider") && !schema.required.includes("needs_human")
        && human.anyOf.some((s) => s.type === "boolean")
        && human.anyOf.some((s) => s.type === "object" && s.required.includes("question"));
    }],

  ["ponteiro sem os opcionais → events sem provider nem needs_human (compatível)",
    { args: { task_id: T }, answers: { recon: RECON({ complexity: "trivial" }), coder: PTR("coder"), review: OK("reviewer") } },
    (r) => r.res.status === "done" && r.res.events.every((e) => !("provider" in e) && !("needs_human" in e))],

  ["provider e needs_human não bloqueante → done, os dois nos events do agente",
    { args: { task_id: T }, answers: { recon: RECON({ complexity: "trivial" }), review: OK("reviewer"),
        coder: { ...PTR("coder"), provider: "provedor-b", needs_human: { question: "manter o limite atual?", blocking: false } } } },
    (r) => {
      const ev = r.res.events.find((e) => e.agent === "coder");
      return r.res.status === "done" && ev.provider === "provedor-b" && ev.needs_human.question === "manter o limite atual?"
        && !("needs_human" in r.res);
    }],

  ["coder bloqueado com needs_human → blocked em coder, pergunta no retorno, sem review",
    { args: { task_id: T }, answers: { recon: RECON(), design: PTR("architect"), plan: PTR("planner"), tester: PTR("tester"),
        coder: { ...PTR("coder", "blocked"), needs_human: { question: "qual contrato vale?", options: ["v1", "v2"], blocking: true } } } },
    (r) => r.res.status === "blocked" && r.res.em === "coder" && r.res.needs_human.options.length === 2
      && r.res.blockers.length === 1 && !r.labels.some((l) => l === "review" || l.startsWith("lente"))],

  ["architect bloqueado com needs_human: true → blocked em architect, needs_human no retorno",
    { args: { task_id: T }, answers: { recon: RECON(), design: { ...PTR("architect", "blocked"), needs_human: true } } },
    (r) => r.res.status === "blocked" && r.res.em === "architect" && r.res.needs_human === true && !r.labels.includes("plan")],
];

let pass = 0;
const failures = [];
for (const [desc, scenario, check] of CASES) {
  const r = await run(scenario);
  let ok = false;
  try { ok = !!check(r); } catch { ok = false; }
  if (ok) pass++;
  else failures.push(`  [falhou] ${desc}\n      status=${r.res && r.res.status} err=${r.err && r.err.message} chamadas=${r.labels.join(", ")}`);
}
console.log(PATH);
console.log(`  passou: ${pass}/${CASES.length}   falhou: ${CASES.length - pass}`);
if (failures.length) { console.log(failures.join("\n")); process.exit(1); }
