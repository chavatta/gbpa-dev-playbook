// gbpa-task — fluxo de desenvolvimento do playbook como orquestração determinística.
// Disparado pela skill /task (que cria tasks/{id}/ e o brief antes). Doutrina: multi-agents/ARCHITECTURE.md
// e HANDOFF-PROTOCOL.md §4/§6. Decisão: docs/ADR-005-orquestracao-nativa-do-fluxo.md.
//
// O script decide (roteamento, teto do loop, forma da verificação, gate). Os agentes executam e gravam
// os artifacts em tasks/{id}/artifacts/ — o script não toca disco (evidência ISO fica onde está).
// Quem grava run-log.md é a sessão principal (escritor único, GOVERNANCE §4.3) a partir de `events`.

export const meta = {
  name: 'gbpa-task',
  description: 'Fluxo GBPA: recon → roteamento → plan → coder → review proporcional ao risco → gate por schema',
  whenToUse: 'Só via skill /task. Exige args.task_id (AAAA-MM-DD_slug) e a pasta tasks/{task_id}/ já criada.',
  phases: [
    { title: 'Recon', detail: 'Architect em modo levantamento: escopo e gatilhos, sem design' },
    { title: 'Plan', detail: 'Spec (se feature não-trivial), design, decomposição' },
    { title: 'Code', detail: 'Coder; Tester em paralelo quando não-trivial' },
    { title: 'Review', detail: 'Voto único; em task sensível, 3 lentes paralelas + refutador cego' },
  ],
}

// ---------- entrada ----------
if (!args || typeof args.task_id !== 'string' || !/^\d{4}-\d{2}-\d{2}_[a-z0-9][a-z0-9-]*$/.test(args.task_id)) {
  throw new Error('args.task_id obrigatório no formato AAAA-MM-DD_slug — use a skill /task, que monta isso')
}
const T = args.task_id
const DIR = `tasks/${T}`
const MAX_ROUNDS = 2            // HANDOFF-PROTOCOL §4.7: 2 reprovações ⇒ o problema não é implementação
const events = []               // a sessão principal anexa isto ao run-log.md
const note = (agent, status, ref) => events.push({ agent, status, ref: ref || '-' })
// Sensibilidade efetiva: brief OU recon (decisão 2). Vai em TODO retorno, não só no `done`:
// quando o recon eleva, a sessão principal grava `Sensível: sim` no brief — é o brief que o
// hook check-reviewer-gate.mjs e a métrica M2 leem.
let sensitive = args.sensitive === true
const result = (o) => ({ task_id: T, sensitive, ...o, events })

// ---------- contratos (HANDOFF-PROTOCOL §3.2 como schema) ----------
const POINTER = {
  type: 'object',
  required: ['agent', 'model', 'task_id', 'status', 'artifact_path', 'files_changed', 'next_agent', 'context_for_next', 'blockers', 'skill_candidates'],
  properties: {
    agent: { type: 'string', description: 'nome-base: coder, reviewer, planner…' },
    model: { type: 'string', description: 'família do modelo em que rodou: fable | sonnet | haiku' },
    task_id: { type: 'string' },
    status: { type: 'string', enum: ['completed', 'blocked', 'needs_review'] },
    artifact_path: { type: 'string' },
    files_changed: { type: 'array', items: { type: 'string' } },
    next_agent: { type: 'string' },
    context_for_next: { type: 'string' },
    blockers: { type: 'array', items: { type: 'string' } },
    skill_candidates: { type: 'array', items: { type: 'string' } },
  },
}
const RECON = {
  type: 'object',
  required: ['complexity', 'sensitive', 'sensitive_reasons', 'needs_spec', 'data_migration', 'files', 'summary'],
  properties: {
    complexity: { type: 'string', enum: ['trivial', 'simples', 'media', 'complexa', 'epica'] },
    sensitive: { type: 'boolean', description: 'toca auth, dados pessoais, dinheiro, superfície externa ou infra/pipeline' },
    sensitive_reasons: { type: 'array', items: { type: 'string' } },
    needs_spec: { type: 'boolean', description: 'feature não-trivial que merece spec formal antes do design (SDD)' },
    data_migration: { type: 'boolean' },
    files: { type: 'array', items: { type: 'string' }, description: 'arquivos que provavelmente mudam' },
    summary: { type: 'string', description: 'uma frase' },
  },
}
const VERDICT = {
  type: 'object',
  required: ['agent', 'aprovado', 'issues', 'artifact_path'],
  properties: {
    agent: { type: 'string' },
    aprovado: { type: 'boolean' },
    issues: {
      type: 'array',
      items: {
        type: 'object',
        required: ['severity', 'summary'],
        properties: {
          severity: { type: 'string', enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] },
          file: { type: 'string' },
          summary: { type: 'string' },
        },
      },
    },
    artifact_path: { type: 'string' },
  },
}
const SLICES = {
  type: 'object',
  required: ['slices'],
  properties: {
    slices: {
      type: 'array',
      items: {
        type: 'object',
        required: ['slug', 'objective', 'files'],
        properties: {
          slug: { type: 'string' },
          objective: { type: 'string' },
          files: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  },
}

// ---------- preâmbulo comum a todo agente ----------
const RULES = `Task ${T}. Leia primeiro ${DIR}/brief.md e ${DIR}/artifacts/recon.md (se existir).
Regras (GOVERNANCE.md §3, §4, §7): opere só no seu escopo; grave TODO o conteúdo no artifact indicado (formato do seu manual em multi-agents/agents/) e devolva SÓ o objeto estruturado pedido; um dono por arquivo; nunca coloque dado real de cliente ou pessoal no artifact; confirme no seu system prompt o modelo que te alimenta e declare-o.`

const reviewPrompt = (lens, manual, artifact) => `${RULES}
Você é o ${lens} (multi-agents/agents/${manual}). Revise o diff da task — os arquivos em files_changed de ${DIR}/artifacts/coder.md — com a lente: ${lens}.
Grave em ${DIR}/artifacts/${artifact}. A PRIMEIRA LINHA do artifact é exatamente "**Veredito:** APROVADO" ou "**Veredito:** REPROVADO (n issues)" — o hook check-reviewer-gate.mjs depende disso; não use a palavra APROVADO em nenhum outro trecho.
Qualquer issue CRITICAL ou HIGH ⇒ REPROVADO. Não existe "aprovado com ressalvas".`

const pointer = async (name, prompt, opts) => {
  const p = await agent(prompt, { schema: POINTER, ...opts })
  if (!p) { note(name, 'sem retorno', '-'); return null }
  note(name, p.status, p.artifact_path)
  return p
}

try {
  // ---------- P1: recon barato ANTES de rotear ----------
  phase('Recon')
  const recon = await agent(`${RULES}
Você é o Architect em MODO LEVANTAMENTO (multi-agents/agents/01-architect.md → "Modo levantamento (recon)"). NÃO projete, NÃO proponha solução.
Leia o brief e o código relevante do repositório e responda só o que o roteamento precisa: complexidade real (épica = não cabe num PR de 200–400 linhas, GOVERNANCE §2.5), se é sensível e por quê, se merece spec formal, se há migração de dados, arquivos prováveis.
Grave o levantamento em ${DIR}/artifacts/recon.md, no máximo 30 linhas.`,
    { agentType: 'architect-fable', schema: RECON, effort: 'low', label: 'recon' })
  if (!recon) throw new Error('recon sem retorno — veja /workflows')
  note('architect(recon)', 'completed', 'artifacts/recon.md')

  sensitive = recon.sensitive || sensitive   // o recon pode elevar; nunca rebaixa
  log(`Recon: ${recon.complexity}${sensitive ? ' · SENSÍVEL' : ''}${recon.needs_spec ? ' · SDD' : ''} · ${recon.files.length} arquivo(s)`)

  // ---------- P5: épica não recebe código — é fatiada ----------
  if (recon.complexity === 'epica') {
    phase('Plan')
    const out = await agent(`${RULES}
Você é o Planner (multi-agents/agents/02-planner.md). O recon classificou a task como ÉPICA.
Fatie em tasks independentes, cada uma cabendo num PR de 200–400 linhas (GOVERNANCE §2.5), com objetivo verificável e arquivos disjuntos entre fatias (GOVERNANCE §4.1). Grave em ${DIR}/artifacts/planner.md.`,
      { agentType: 'planner-sonnet', schema: SLICES, phase: 'Plan', label: 'fatiar épica' })
    note('planner', out ? 'completed' : 'sem retorno', 'artifacts/planner.md')
    if (!out || !out.slices.length) return result({ status: 'blocked', em: 'planner', blockers: ['fatiamento da épica sem retorno'] })
    return result({
      status: 'fatiada', slices: out ? out.slices : [],
      next: 'Abra uma /task por fatia. A task-mãe não recebe código.',
    })
  }

  // ---------- Plan: só quando não é trivial ----------
  if (recon.complexity !== 'trivial') {
    phase('Plan')
    if (recon.needs_spec) {
      const s = await pointer('spec-writer', `${RULES}
Você é o Spec-Writer (multi-agents/agents/09-spec-writer.md). Escreva a spec verificável da task (critérios Given/When/Then, contratos, fora de escopo) em ${DIR}/artifacts/spec-writer.md.`,
        { agentType: 'spec-writer-sonnet', phase: 'Plan', label: 'spec' })
      if (!s || s.status === 'blocked') return result({ status: 'blocked', em: 'spec-writer', blockers: s ? s.blockers : ['sem retorno'] })
    }
    const a = await pointer('architect', `${RULES}
Você é o Architect (multi-agents/agents/01-architect.md). Projete a solução a partir do brief, do recon${recon.needs_spec ? ' e da spec (artifacts/spec-writer.md)' : ''}. Grave em ${DIR}/artifacts/architect.md no formato do seu manual.`,
      { agentType: 'architect-fable', phase: 'Plan', label: 'design' })
    if (!a || a.status === 'blocked') return result({ status: 'blocked', em: 'architect', blockers: a ? a.blockers : ['sem retorno'] })

    const p = await pointer('planner', `${RULES}
Você é o Planner (multi-agents/agents/02-planner.md). Decomponha ${DIR}/artifacts/architect.md em tarefas sequenciadas com critérios de aceitação. Grave em ${DIR}/artifacts/planner.md.`,
      { agentType: 'planner-sonnet', phase: 'Plan', label: 'plan' })
    if (!p || p.status === 'blocked') return result({ status: 'blocked', em: 'planner', blockers: p ? p.blockers : ['sem retorno'] })
  }

  // ---------- P2: loop com teto ----------
  let verdict = null
  for (let round = 1; round <= MAX_ROUNDS; round++) {
    phase('Code')
    const fix = round > 1
      ? `\nRODADA ${round}: o review REPROVOU. Corrija EXATAMENTE estes issues, nesta ordem de prioridade: ${JSON.stringify(verdict.issues)}`
      : ''
    // Um dono por arquivo (GOVERNANCE §4.1): o Tester só roda em paralelo na rodada 1 de task
    // não-trivial. Fora disso o Coder é o dono também dos testes — senão issue em arquivo de
    // teste na rodada 2 não teria quem corrigisse.
    const testerRuns = recon.complexity !== 'trivial' && round === 1
    const testOwner = testerRuns
      ? 'Não escreva testes — o Tester faz isso em paralelo.'
      : 'O Tester não roda nesta rodada: se a mudança pede teste, ou se algum issue aponta arquivo de teste, o dono é você.'
    const jobs = [
      () => pointer('coder', `${RULES}
Você é o Coder (multi-agents/agents/03-coder.md). Implemente a task conforme ${recon.complexity === 'trivial' ? 'o brief' : `${DIR}/artifacts/planner.md`}.
${testOwner} Grave em ${DIR}/artifacts/coder.md com files_changed completo.${fix}`,
        { agentType: 'coder-sonnet', phase: 'Code', label: `coder r${round}` }),
    ]
    if (testerRuns) {
      jobs.push(() => pointer('tester', `${RULES}
Você é o Tester (multi-agents/agents/05-tester.md). Escreva os testes da task a partir da spec/plano — NÃO a partir da implementação, que está sendo escrita em paralelo agora.
Edite SÓ arquivos de teste (um dono por arquivo, GOVERNANCE §4.1). Grave em ${DIR}/artifacts/tester.md.`,
        { agentType: 'tester-sonnet', phase: 'Code', label: 'tester' }))
    }
    const done = await parallel(jobs)            // barreira justificada: o review precisa do código pronto
    const coder = done[0]
    if (!coder || coder.status === 'blocked') return result({ status: 'blocked', em: 'coder', blockers: coder ? coder.blockers : ['sem retorno'] })

    // ---------- P3 + P4: verificação proporcional ao risco ----------
    phase('Review')
    if (sensitive) {
      const lenses = (await parallel([
        () => agent(reviewPrompt('Reviewer — correção, qualidade e arquitetura', '04-reviewer.md', 'reviewer.md'),
          { agentType: 'reviewer-fable', schema: VERDICT, phase: 'Review', label: 'lente: correção' }),
        () => agent(reviewPrompt('Security-SRE — segurança, secrets, supply chain, superfície', '12-security-sre.md', 'security-sre.md'),
          { agentType: 'security-sre-fable', schema: VERDICT, phase: 'Review', label: 'lente: segurança' }),
        () => agent(reviewPrompt('Tester — reprodução: rode os testes e tente quebrar o comportamento', '05-tester.md', 'tester-review.md'),
          { agentType: 'tester-sonnet', schema: VERDICT, phase: 'Review', label: 'lente: reprodução' }),
      ])).filter(Boolean)
      lenses.forEach(v => note(v.agent, v.aprovado ? 'APROVADO' : 'REPROVADO', v.artifact_path))
      // Verificador sem retorno é falha de execução, não de implementação: não consome rodada
      // do Coder nem vira `escalado` com diagnóstico falso — é `blocked`, como o refutador cego.
      if (lenses.length < 3) {
        return result({
          status: 'blocked', em: 'lentes', issues: lenses.flatMap(v => v.issues),
          blockers: [`${3 - lenses.length} de 3 lentes sem retorno na rodada ${round} — rode de novo`],
        })
      }
      verdict = { aprovado: lenses.every(v => v.aprovado), issues: lenses.flatMap(v => v.issues) }
    } else {
      const v = await agent(reviewPrompt('Reviewer — correção, segurança e qualidade', '04-reviewer.md', 'reviewer.md'),
        { agentType: 'reviewer-fable', schema: VERDICT, phase: 'Review', label: `review r${round}` })
      if (!v) {
        note('reviewer', 'sem retorno', '-')
        return result({ status: 'blocked', em: 'reviewer', blockers: [`Reviewer sem retorno na rodada ${round} — rode de novo`] })
      }
      verdict = v
      note('reviewer', verdict.aprovado ? 'APROVADO' : 'REPROVADO', v.artifact_path)
    }
    if (verdict.aprovado) break
    log(`Rodada ${round}: REPROVADO (${verdict.issues.length} issue(s))`)
  }

  // ---------- P2: escalonamento ----------
  if (!verdict.aprovado) {
    return result({
      status: 'escalado', para: 'architect', issues: verdict.issues,
      motivo: `REPROVADO em ${MAX_ROUNDS} rodadas — o problema não é implementação (HANDOFF-PROTOCOL §4.7)`,
    })
  }

  // ---------- decisão 3: contra-verificador cego, só em task sensível ----------
  if (sensitive) {
    const blind = await agent(`${RULES}
Você é um Reviewer INDEPENDENTE (multi-agents/agents/04-reviewer.md). NÃO leia ${DIR}/artifacts/reviewer.md, security-sre.md nem tester-review.md — você não pode ser ancorado por veredito anterior.
Leia só o brief e o diff (files_changed em artifacts/coder.md). Sua missão é REFUTAR a aprovação: procure o defeito que passou. Em dúvida, reprove.
Grave em ${DIR}/artifacts/reviewer-cego.md (primeira linha "**Veredito:** APROVADO" ou "**Veredito:** REPROVADO (n issues)").`,
      { agentType: 'reviewer-fable', schema: VERDICT, phase: 'Review', label: 'refutador cego', effort: 'high' })
    // Fail-closed: sem retorno do refutador, a aprovação não foi contra-verificada — não é `done`.
    if (!blind) {
      note('reviewer(cego)', 'sem retorno', '-')
      return result({
        status: 'blocked', em: 'refutador cego', blockers: ['refutador cego sem retorno — rode de novo ou decida manualmente'],
      })
    }
    note('reviewer(cego)', blind.aprovado ? 'APROVADO' : 'REPROVADO', blind.artifact_path)
    if (!blind.aprovado) {
      return result({
        status: 'divergencia', issues: blind.issues,
        motivo: 'O refutador cego discorda da aprovação — decisão humana (HANDOFF-PROTOCOL §4.8)',
      })
    }
  }

  return result({ status: 'done', complexity: recon.complexity })
} catch (e) {
  return result({ status: 'blocked', erro: String((e && e.message) || e) })
}
