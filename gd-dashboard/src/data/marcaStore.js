// Perfis de marca (empresa): logo + cores.
// Fonte de verdade: tabela `marcas` e bucket `logos` no Supabase.
// A empresa ativa é preferência local, guardada no localStorage.

import { useSyncExternalStore } from "react";
import { supabase, supabaseAtivo, BUCKET_LOGOS } from "./supabase";

const KEY_ATIVA = "gd-marca-ativa";

export const CORES_PADRAO = { accent: "#2ecc71", border: "#1a5c35", button: "#27ae60" };

const daLinha = (l) => ({
  id: l.id,
  nome: l.nome,
  logo_url: l.logo_url ?? null,
  logo_altura: l.logo_altura ?? 22,
  cores: { accent: l.accent, border: l.border, button: l.button },
});

const paraLinha = (m) => ({
  id: m.id,
  nome: m.nome,
  logo_url: m.logo_url ?? null,
  logo_altura: m.logo_altura ?? 22,
  accent: m.cores?.accent ?? CORES_PADRAO.accent,
  border: m.cores?.border ?? CORES_PADRAO.border,
  button: m.cores?.button ?? CORES_PADRAO.button,
});

const PADRAO_MRE = { id: "mre", nome: "MRE", logo_url: null, logo_altura: 22, cores: { ...CORES_PADRAO } };

let estado = {
  marcas: { mre: PADRAO_MRE },
  ativa: localStorage.getItem(KEY_ATIVA) || "mre",
  carregando: supabaseAtivo,
  erro: supabaseAtivo ? null : "Supabase não configurado. Verifique o arquivo .env.",
};

const ouvintes = new Set();
const emitir = () => { estado = { ...estado }; ouvintes.forEach((f) => f()); };
const subscrever = (f) => { ouvintes.add(f); return () => ouvintes.delete(f); };
const snapshot = () => estado;

/* ══ carga inicial ═════════════════════════════════════════════ */
let carregou = false;

export async function carregarMarcas() {
  if (!supabaseAtivo || carregou) return;
  carregou = true;
  try {
    const { data, error } = await supabase.from("marcas").select("*").order("criado_em");
    if (error) throw error;

    if (!data?.length) {
      await supabase.from("marcas").insert(paraLinha(PADRAO_MRE));
      estado.marcas = { mre: PADRAO_MRE };
    } else {
      estado.marcas = Object.fromEntries(data.map((l) => [l.id, daLinha(l)]));
    }
    if (!estado.marcas[estado.ativa]) estado.ativa = Object.keys(estado.marcas)[0];
    estado.erro = null;
  } catch (e) {
    estado.erro = e?.message || "Falha ao carregar as empresas.";
  } finally {
    estado.carregando = false;
    emitir();
  }
}

/* ══ escrita ═══════════════════════════════════════════════════ */
async function gravar(marca) {
  estado.marcas = { ...estado.marcas, [marca.id]: marca };
  emitir();
  if (!supabaseAtivo) return;
  const { error } = await supabase.from("marcas").upsert(paraLinha(marca));
  if (error) { estado.erro = error.message; emitir(); }
}

export const marcaStore = {
  salvar: gravar,

  // Sempre parte do estado atual, nunca de uma cópia antiga da tela.
  async definirCores(id, cores) {
    const marca = estado.marcas[id];
    if (marca) await gravar({ ...marca, cores });
  },

  async definirAltura(id, altura) {
    const marca = estado.marcas[id];
    if (marca) await gravar({ ...marca, logo_altura: Math.max(14, Math.min(64, altura)) });
  },

  async renomear(id, nome) {
    const marca = estado.marcas[id];
    if (marca) await gravar({ ...marca, nome });
  },

  async criar(nome) {
    const base = nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "empresa";
    let id = base, i = 2;
    while (estado.marcas[id]) id = `${base}_${i++}`;
    const marca = { id, nome: nome.trim(), logo_url: null, logo_altura: 22, cores: { ...CORES_PADRAO } };
    await gravar(marca);
    marcaStore.ativar(id);
    return id;
  },

  ativar(id) {
    if (!estado.marcas[id]) return;
    estado.ativa = id;
    localStorage.setItem(KEY_ATIVA, id);
    emitir();
  },

  async remover(id) {
    const restantes = { ...estado.marcas };
    delete restantes[id];
    if (!Object.keys(restantes).length) return;
    estado.marcas = restantes;
    if (estado.ativa === id) marcaStore.ativar(Object.keys(restantes)[0]);
    emitir();
    if (!supabaseAtivo) return;
    await supabase.storage.from(BUCKET_LOGOS).remove([`${id}.png`]);
    const { error } = await supabase.from("marcas").delete().eq("id", id);
    if (error) { estado.erro = error.message; emitir(); }
  },

  // Sobe a logo para o bucket e grava a URL pública na marca.
  async enviarLogo(id, dataUrl) {
    const marca = estado.marcas[id];
    if (!marca) return;
    if (!supabaseAtivo) { await gravar({ ...marca, logo_url: dataUrl }); return; }

    const blob = await (await fetch(dataUrl)).blob();
    const caminho = `${id}.png`;
    const { error } = await supabase.storage.from(BUCKET_LOGOS)
      .upload(caminho, blob, { upsert: true, contentType: "image/png", cacheControl: "3600" });
    if (error) { estado.erro = error.message; emitir(); return; }

    const { data } = supabase.storage.from(BUCKET_LOGOS).getPublicUrl(caminho);
    await gravar({ ...marca, logo_url: `${data.publicUrl}?v=${Date.now()}` });
  },

  async removerLogo(id) {
    const marca = estado.marcas[id];
    if (!marca) return;
    if (supabaseAtivo) await supabase.storage.from(BUCKET_LOGOS).remove([`${id}.png`]);
    await gravar({ ...marca, logo_url: null });
  },
};

/* ══ hooks ═════════════════════════════════════════════════════ */
export function useMarcaEstado() {
  useSyncExternalStore(subscrever, snapshot, snapshot);
  if (supabaseAtivo && !carregou) carregarMarcas();
  return estado;
}

export function useMarcas() {
  const e = useMarcaEstado();
  return Object.values(e.marcas);
}

export function useMarcaAtiva() {
  const e = useMarcaEstado();
  return e.marcas[e.ativa] ?? Object.values(e.marcas)[0];
}

/* ══ imagem ════════════════════════════════════════════════════ */
function carregar(src, cors = false) {
  return new Promise((ok, erro) => {
    const img = new Image();
    if (cors) img.crossOrigin = "anonymous";
    img.onload = () => ok(img);
    img.onerror = () => erro(new Error("imagem inválida"));
    img.src = src;
  });
}

// Reduz a logo antes de subir, para o arquivo ficar leve.
export async function prepararLogo(file, ladoMax = 480) {
  const dataUrl = await new Promise((ok, erro) => {
    const fr = new FileReader();
    fr.onload = () => ok(fr.result);
    fr.onerror = () => erro(new Error("falha ao ler o arquivo"));
    fr.readAsDataURL(file);
  });
  const img = await carregar(dataUrl);
  const escala = Math.min(1, ladoMax / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(img.width * escala));
  c.height = Math.max(1, Math.round(img.height * escala));
  c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL("image/png");
}

const hex = (r, g, b) =>
  "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");

export const paraRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

function hsl(r, g, b) {
  const R = r / 255, G = g / 255, B = b / 255;
  const mx = Math.max(R, G, B), mn = Math.min(R, G, B), d = mx - mn;
  const l = (mx + mn) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return { s, l };
}

export function escurecer(h, pct = 0.4) {
  const [r, g, b] = paraRgb(h);
  return hex(r * (1 - pct), g * (1 - pct), b * (1 - pct));
}

export function clarear(h, pct = 0.4) {
  const [r, g, b] = paraRgb(h);
  return hex(r + (255 - r) * pct, g + (255 - g) * pct, b + (255 - b) * pct);
}

// Cores dominantes da logo, ignorando fundo branco, preto e cinzas.
export async function extrairPaleta(src, quantas = 6) {
  const remota = /^https?:/i.test(src);
  const img = await carregar(src, remota);
  const escala = Math.min(1, 140 / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(img.width * escala));
  c.height = Math.max(1, Math.round(img.height * escala));
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, c.width, c.height);
  const { data } = ctx.getImageData(0, 0, c.width, c.height);

  const baldes = new Map();
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
    if (a < 128) continue;
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    if (lum > 242 || lum < 16) continue;
    const { s } = hsl(r, g, b);
    if (s < 0.12 && lum > 190) continue;
    const chave = `${r >> 4}-${g >> 4}-${b >> 4}`;
    const acc = baldes.get(chave) ?? { r: 0, g: 0, b: 0, n: 0, peso: 0 };
    acc.r += r; acc.g += g; acc.b += b; acc.n += 1;
    acc.peso += 0.35 + s;
    baldes.set(chave, acc);
  }

  const brutos = [...baldes.values()]
    .sort((x, y) => y.peso - x.peso)
    .map((x) => hex(x.r / x.n, x.g / x.n, x.b / x.n));

  const paleta = [];
  for (const cor of brutos) {
    const [r, g, b] = paraRgb(cor);
    const perto = paleta.some((p) => {
      const [pr, pg, pb] = paraRgb(p);
      return Math.hypot(r - pr, g - pg, b - pb) < 52;
    });
    if (!perto) paleta.push(cor);
    if (paleta.length >= quantas) break;
  }
  return paleta;
}

// Monta as três cores do tema a partir da cor principal.
export function temaDaCor(accent) {
  const [r, g, b] = paraRgb(accent);
  const { l } = hsl(r, g, b);
  const principal = l < 0.22 ? clarear(accent, 0.3) : accent;
  return { accent: principal, border: escurecer(principal, 0.45), button: escurecer(principal, 0.12) };
}
