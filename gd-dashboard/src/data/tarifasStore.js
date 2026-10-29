// Tarifas das distribuidoras: fonte da lista de concessionárias em toda a aplicação.
// Fonte de verdade: tabela `tarifas` no Supabase (carga inicial vinda do propostagalva.com).
// Editadas na aba Configurações. Valores em R$/kWh (energia) e R$/kW (demanda), sem tributos.

import { useSyncExternalStore } from "react";
import { supabase, supabaseAtivo } from "./supabase";

const n = (v) => (typeof v === "number" && isFinite(v) ? v : 0);

// Propostas salvas antes da troca da lista guardam estes ids
export const ID_ANTIGO = { ceal: "equatorial_al", celpe: "neoenergia_pe", light: "light_rj" };

export function registroVazio(id, nome, uf) {
  return {
    id, nome, uf,
    vigencia: "",
    fator_manual: null,
    a4: {
      verde: { tusd_dem: 0, tusd_cons_p: 0, tusd_cons_fp: 0, te_p: 0, te_fp: 0 },
      azul:  { tusd_dem_p: 0, tusd_dem_fp: 0, tusd_cons_p: 0, tusd_cons_fp: 0, te_p: 0, te_fp: 0 },
    },
    b3: { tusd: 0, te: 0, total: 0 },
    esc_hidrica: 0,
  };
}

// Fator de geração ponta / fora ponta — REN 1.000/2021, art. 655-G, §5º.
// Relação entre a TE do posto de injeção e a do posto de alocação.
export function fatorCalculado(c) {
  const p  = n(c?.a4?.verde?.te_p)  || n(c?.a4?.azul?.te_p);
  const fp = n(c?.a4?.verde?.te_fp) || n(c?.a4?.azul?.te_fp);
  return fp > 0 ? p / fp : 0;
}

export function fatorVigente(c) {
  return n(c?.fator_manual) > 0 ? n(c.fator_manual) : fatorCalculado(c);
}

export function temTarifa(c) {
  return n(c?.a4?.verde?.te_p) > 0 || n(c?.a4?.azul?.te_p) > 0 || n(c?.b3?.te) > 0;
}

const daLinha = (l) => {
  const vazio = registroVazio(l.id, l.nome, l.uf);
  return {
    ...vazio,
    vigencia: l.vigencia ?? "",
    fator_manual: l.fator_manual == null ? null : Number(l.fator_manual),
    a4: {
      verde: { ...vazio.a4.verde, ...(l.a4?.verde ?? {}) },
      azul:  { ...vazio.a4.azul,  ...(l.a4?.azul  ?? {}) },
    },
    b3: { ...vazio.b3, ...(l.b3 ?? {}) },
    esc_hidrica: Number(l.esc_hidrica ?? 0),
  };
};

const paraLinha = (r) => ({
  id: r.id, nome: r.nome, uf: r.uf,
  vigencia: r.vigencia || null,
  fator_manual: n(r.fator_manual) > 0 ? r.fator_manual : null,
  a4: r.a4, b3: r.b3,
  esc_hidrica: n(r.esc_hidrica),
  atualizado_em: new Date().toISOString(),
});

let estado = {
  registros: {},
  carregando: supabaseAtivo,
  erro: supabaseAtivo ? null : "Supabase não configurado. Verifique o arquivo .env.",
};
let cacheLista = null;
const ouvintes = new Set();

function emitir() {
  estado = { ...estado };
  cacheLista = null;
  ouvintes.forEach((f) => f());
}

const subscrever = (f) => { ouvintes.add(f); return () => ouvintes.delete(f); };
const snapshot = () => estado;

async function carregar() {
  if (!supabaseAtivo) return;
  const { data, error } = await supabase.from("tarifas").select("*");
  if (error) estado.erro = `Não foi possível carregar as tarifas: ${error.message}`;
  else estado.registros = Object.fromEntries(data.map((l) => [l.id, daLinha(l)]));
  estado.carregando = false;
  emitir();
}
carregar();

// Grava no Supabase; se falhar, volta ao que estava e mostra o erro
async function gravar(antes, operacao) {
  const { error } = await operacao;
  if (error) {
    estado.registros = antes;
    estado.erro = `Não foi possível salvar: ${error.message}`;
    emitir();
  } else if (estado.erro) {
    estado.erro = null;
    emitir();
  }
}

export const tarifasStore = {
  salvar(reg) {
    const tusd = n(reg.b3?.tusd), te = n(reg.b3?.te);
    const novo = { ...reg, b3: { tusd, te, total: tusd + te } };
    const antes = estado.registros;
    estado.registros = { ...antes, [reg.id]: novo };
    emitir();
    gravar(antes, supabase.from("tarifas").upsert(paraLinha(novo)));
  },
  adicionar(nome, uf) {
    const base = `${uf}_${nome}`.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    let id = base, i = 2;
    while (estado.registros[id]) id = `${base}_${i++}`;
    const novo = registroVazio(id, nome.trim(), uf.toUpperCase());
    const antes = estado.registros;
    estado.registros = { ...antes, [id]: novo };
    emitir();
    gravar(antes, supabase.from("tarifas").insert(paraLinha(novo)));
    return id;
  },
  remover(id) {
    const antes = estado.registros;
    const { [id]: _fora, ...resto } = antes;
    estado.registros = resto;
    emitir();
    gravar(antes, supabase.from("tarifas").delete().eq("id", id));
  },
  limpar(id) {
    const a = estado.registros[id];
    if (a) tarifasStore.salvar(registroVazio(a.id, a.nome, a.uf));
  },
};

function lista() {
  if (!cacheLista) {
    cacheLista = Object.values(estado.registros).sort(
      (a, b) => (a.uf + a.nome).localeCompare(b.uf + b.nome, "pt-BR")
    );
  }
  return cacheLista;
}

export function useConcessionarias() {
  useSyncExternalStore(subscrever, snapshot, snapshot);
  return lista();
}

export const useRegistros = useConcessionarias;

export function useSituacaoTarifas() {
  const s = useSyncExternalStore(subscrever, snapshot, snapshot);
  return { carregando: s.carregando, erro: s.erro };
}
