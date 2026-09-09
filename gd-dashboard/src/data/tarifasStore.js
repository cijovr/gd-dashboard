// Tarifas digitadas pelo usuário na aba Configurações.
// É a fonte da lista de concessionárias em toda a aplicação.
// Persistência: localStorage. Valores em R$/kWh (energia) e R$/kW (demanda).

import { useSyncExternalStore } from "react";
import { CONCESSIONARIAS } from "./tarifas";

const KEY = "gd-tarifas-v1";

const n = (v) => (typeof v === "number" && isFinite(v) ? v : 0);

// Concessionárias que já nascem com gaveta criada.
// id igual ao de tarifas.js quando já existe, para aproveitar o que está cadastrado.
const BASE = [
  { id: "ceal",          nome: "Equatorial AL",                  uf: "AL" },
  { id: "coelba",        nome: "Neoenergia Bahia",               uf: "BA" },
  { id: "enel_ce",       nome: "Enel Ceará",                     uf: "CE" },
  { id: "equatorial_go", nome: "Equatorial Goiás",               uf: "GO" },
  { id: "cemig",         nome: "Cemig Minas Gerais",             uf: "MG" },
  { id: "energisa_mt",   nome: "Energisa Mato Grosso",           uf: "MT" },
  { id: "equatorial_pa", nome: "Equatorial Pará",                uf: "PA" },
  { id: "celpe",         nome: "Neoenergia Pernambuco",          uf: "PE" },
  { id: "equatorial_pi", nome: "Equatorial Piauí",               uf: "PI" },
  { id: "light",         nome: "Light Rio de Janeiro",           uf: "RJ" },
  { id: "cosern",        nome: "Neoenergia Rio Grande do Norte", uf: "RN" },
];

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
  return n(c?.a4?.verde?.te_p) > 0 || n(c?.a4?.azul?.te_p) > 0;
}

// Semente: o que já existe em tarifas.js + as gavetas vazias das demais.
function padrao() {
  const antigo = {};
  for (const c of CONCESSIONARIAS) antigo[c.id] = c;

  const out = {};
  for (const b of BASE) {
    const a = antigo[b.id];
    const vazio = registroVazio(b.id, b.nome, b.uf);
    if (!a) { out[b.id] = vazio; continue; }
    const tusd_b = n(a.b3?.tusd) || Math.max(n(a.b3?.total) - n(a.b3?.te), 0);
    out[b.id] = {
      ...a,
      id: b.id, nome: b.nome, uf: b.uf,
      vigencia: a.vigencia ?? "",
      fator_manual: a.fator_manual ?? null,
      a4: {
        verde: { ...vazio.a4.verde, ...(a.a4?.verde ?? {}) },
        azul:  { ...vazio.a4.azul,  ...(a.a4?.azul  ?? {}) },
      },
      b3: { tusd: tusd_b, te: n(a.b3?.te), total: tusd_b + n(a.b3?.te) },
    };
  }
  return out;
}

function ler() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return padrao();
    return { ...padrao(), ...JSON.parse(raw) };
  } catch {
    return padrao();
  }
}

let estado = ler();
let cacheLista = null;
const ouvintes = new Set();

function emitir() {
  try { localStorage.setItem(KEY, JSON.stringify(estado)); } catch { /* cota cheia */ }
  cacheLista = null;
  ouvintes.forEach((f) => f());
}

const subscrever = (f) => { ouvintes.add(f); return () => ouvintes.delete(f); };
const snapshot = () => estado;

export const tarifasStore = {
  salvar(reg) {
    const tusd = n(reg.b3?.tusd), te = n(reg.b3?.te);
    estado = { ...estado, [reg.id]: { ...reg, b3: { tusd, te, total: tusd + te } } };
    emitir();
  },
  adicionar(nome, uf) {
    const base = `${uf}_${nome}`.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    let id = base, i = 2;
    while (estado[id]) id = `${base}_${i++}`;
    estado = { ...estado, [id]: registroVazio(id, nome.trim(), uf.toUpperCase()) };
    emitir();
    return id;
  },
  remover(id) {
    const { [id]: _fora, ...resto } = estado;
    estado = resto;
    emitir();
  },
  limpar(id) {
    const a = estado[id];
    if (!a) return;
    estado = { ...estado, [id]: registroVazio(a.id, a.nome, a.uf) };
    emitir();
  },
};

function lista() {
  if (!cacheLista) {
    cacheLista = Object.values(estado).sort(
      (a, b) => (a.uf + a.nome).localeCompare(b.uf + b.nome, "pt-BR")
    );
  }
  return cacheLista;
}

export function useConcessionarias() {
  useSyncExternalStore(subscrever, snapshot, snapshot);
  return lista();
}

export function useRegistros() {
  useSyncExternalStore(subscrever, snapshot, snapshot);
  return lista();
}
