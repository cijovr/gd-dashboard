// Propostas salvas: guarda os inputs da simulação para reabrir e gerar PDF.
// Tabela `propostas` no Supabase.

import { useSyncExternalStore } from "react";
import { supabase, supabaseAtivo } from "./supabase";

let estado = { itens: [], carregando: supabaseAtivo, erro: null };
const ouvintes = new Set();
const emitir = () => { estado = { ...estado }; ouvintes.forEach((f) => f()); };
const subscrever = (f) => { ouvintes.add(f); return () => ouvintes.delete(f); };
const snapshot = () => estado;

let carregou = false;

export async function carregarPropostas(forcar = false) {
  if (!supabaseAtivo) { estado.carregando = false; estado.erro = "Supabase não configurado."; emitir(); return; }
  if (carregou && !forcar) return;
  carregou = true;
  estado.carregando = true; emitir();
  try {
    const { data, error } = await supabase
      .from("propostas").select("*").order("criado_em", { ascending: false }).limit(200);
    if (error) throw error;
    estado.itens = data ?? [];
    estado.erro = null;
  } catch (e) {
    estado.erro = e?.message || "Falha ao carregar as propostas.";
  } finally {
    estado.carregando = false;
    emitir();
  }
}

export const propostaStore = {
  async salvar({ cliente, concessionaria, economia, dados }) {
    if (!supabaseAtivo) return { erro: "Supabase não configurado." };
    const { data, error } = await supabase
      .from("propostas")
      .insert({ cliente: cliente || "Sem nome", concessionaria, economia, dados })
      .select()
      .single();
    if (error) { estado.erro = error.message; emitir(); return { erro: error.message }; }
    estado.itens = [data, ...estado.itens];
    estado.erro = null;
    emitir();
    return { ok: true };
  },

  async remover(id) {
    estado.itens = estado.itens.filter((p) => p.id !== id);
    emitir();
    if (!supabaseAtivo) return;
    const { error } = await supabase.from("propostas").delete().eq("id", id);
    if (error) { estado.erro = error.message; emitir(); }
  },
};

export function usePropostas() {
  useSyncExternalStore(subscrever, snapshot, snapshot);
  if (supabaseAtivo && !carregou) carregarPropostas();
  return estado;
}
