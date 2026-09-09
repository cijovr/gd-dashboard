import { useMemo, useState } from "react";
import { ChevronDown, Search, Save, Plus, Trash2, Eraser, Check, AlertTriangle } from "lucide-react";
import {
  useRegistros, tarifasStore, fatorCalculado, fatorVigente, temTarifa,
} from "./data/tarifasStore";

/* ── helpers ──────────────────────────────────────────────────── */
const paraNumero = (s) => {
  const t = String(s).trim().replace(/\./g, "").replace(",", ".");
  const v = parseFloat(t);
  return isFinite(v) ? v : 0;
};
const mostra = (v, casas) =>
  (v ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });

function vigenciaChip(iso) {
  if (!iso) return { texto: "Tarifa não informada", alerta: true };
  const fim = new Date(iso + "T23:59:59");
  const venceu = fim < new Date();
  const data = fim.toLocaleDateString("pt-BR");
  return { texto: venceu ? `Tarifa vencida em ${data}` : `Vigente até ${data}`, alerta: venceu };
}

/* ── campo ────────────────────────────────────────────────────── */
function Campo({ label, unidade, valor, onChange, casas = 2, escala = 1 }) {
  const [rascunho, setRascunho] = useState(null);
  const exibido = rascunho ?? mostra(valor * escala, casas);
  return (
    <label className="tcfg-campo">
      <span className="tcfg-campo-label">{label} <em>({unidade})</em></span>
      <input
        className="tcfg-campo-input"
        inputMode="decimal"
        value={exibido}
        onFocus={() => setRascunho(String(valor * escala).replace(".", ","))}
        onChange={(e) => setRascunho(e.target.value)}
        onBlur={() => { onChange(paraNumero(rascunho ?? exibido) / escala); setRascunho(null); }}
        onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
      />
    </label>
  );
}

/* ── card de concessionária ───────────────────────────────────── */
function CardConcessionaria({ registro, aberto, onToggle }) {
  const [d, setD] = useState(registro);
  const [salvo, setSalvo] = useState(false);
  const sujo = JSON.stringify(d) !== JSON.stringify(registro);

  const setVerde = (k) => (v) => setD((x) => ({ ...x, a4: { ...x.a4, verde: { ...x.a4.verde, [k]: v } } }));
  const setAzul  = (k) => (v) => setD((x) => ({ ...x, a4: { ...x.a4, azul:  { ...x.a4.azul,  [k]: v } } }));
  const setB     = (k) => (v) => setD((x) => ({ ...x, b3: { ...x.b3, [k]: v } }));

  const calc = fatorCalculado(d);
  const chip = vigenciaChip(d.vigencia);

  const salvar = () => {
    tarifasStore.salvar(d);
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2200);
  };

  return (
    <div className={`tcfg-card ${aberto ? "tcfg-card-aberto" : ""}`}>
      <button className="tcfg-card-head" onClick={onToggle} aria-expanded={aberto}>
        <span className="tcfg-uf">{d.uf}</span>
        <span className="tcfg-nome">{d.nome}</span>
        <span className={`tcfg-chip ${chip.alerta ? "tcfg-chip-alerta" : ""}`}>{chip.texto}</span>
        {!temTarifa(registro) && <span className="tcfg-chip tcfg-chip-vazio">Sem tarifa</span>}
        {sujo && <span className="tcfg-ponto" title="Não salvo" />}
        <ChevronDown size={15} className="tcfg-chevron" />
      </button>

      {aberto && (
        <div className="tcfg-card-body">
          <div className="tcfg-bloco">
            <div className="tcfg-bloco-titulo"><i className="tcfg-bola tcfg-verde" />A4 Verde</div>
            <div className="tcfg-grid">
              <Campo label="Demanda"  unidade="R$/kW"  valor={d.a4.verde.tusd_dem}     onChange={setVerde("tusd_dem")} />
              <Campo label="TUSD Ponta" unidade="R$/MWh" escala={1000} valor={d.a4.verde.tusd_cons_p}  onChange={setVerde("tusd_cons_p")} />
              <Campo label="TUSD FP"    unidade="R$/MWh" escala={1000} valor={d.a4.verde.tusd_cons_fp} onChange={setVerde("tusd_cons_fp")} />
              <Campo label="TE Ponta"   unidade="R$/MWh" escala={1000} valor={d.a4.verde.te_p}         onChange={setVerde("te_p")} />
              <Campo label="TE FP"      unidade="R$/MWh" escala={1000} valor={d.a4.verde.te_fp}        onChange={setVerde("te_fp")} />
            </div>
          </div>

          <div className="tcfg-bloco">
            <div className="tcfg-bloco-titulo"><i className="tcfg-bola tcfg-azul" />A4 Azul</div>
            <div className="tcfg-grid">
              <Campo label="Demanda P"  unidade="R$/kW" valor={d.a4.azul.tusd_dem_p}  onChange={setAzul("tusd_dem_p")} />
              <Campo label="Demanda FP" unidade="R$/kW" valor={d.a4.azul.tusd_dem_fp} onChange={setAzul("tusd_dem_fp")} />
              <Campo label="TUSD Ponta" unidade="R$/MWh" escala={1000} valor={d.a4.azul.tusd_cons_p}  onChange={setAzul("tusd_cons_p")} />
              <Campo label="TUSD FP"    unidade="R$/MWh" escala={1000} valor={d.a4.azul.tusd_cons_fp} onChange={setAzul("tusd_cons_fp")} />
              <Campo label="TE Ponta"   unidade="R$/MWh" escala={1000} valor={d.a4.azul.te_p}         onChange={setAzul("te_p")} />
              <Campo label="TE FP"      unidade="R$/MWh" escala={1000} valor={d.a4.azul.te_fp}        onChange={setAzul("te_fp")} />
            </div>
          </div>

          <div className="tcfg-bloco">
            <div className="tcfg-bloco-titulo"><i className="tcfg-bola tcfg-laranja" />Grupo B Convencional</div>
            <div className="tcfg-grid">
              <Campo label="TUSD" unidade="R$/MWh" escala={1000} valor={d.b3.tusd} onChange={setB("tusd")} />
              <Campo label="TE"   unidade="R$/MWh" escala={1000} valor={d.b3.te}   onChange={setB("te")} />
            </div>
          </div>

          <div className="tcfg-bloco tcfg-bloco-fator">
            <div className="tcfg-bloco-titulo">Fator de geração ponta ÷ fora ponta</div>
            <div className="tcfg-fator-linha">
              <div className="tcfg-fator-valor">
                <span>{calc > 0 ? mostra(calc, 4) : "—"}</span>
                <em>TE Ponta ÷ TE FP (A4 Verde)</em>
              </div>
              <Campo label="Sobrescrever" unidade="opcional" casas={4} valor={d.fator_manual ?? 0}
                onChange={(v) => setD((x) => ({ ...x, fator_manual: v > 0 ? v : null }))} />
              {d.fator_manual > 0 && (
                <button className="tcfg-btn tcfg-btn-ghost" onClick={() => setD((x) => ({ ...x, fator_manual: null }))}>
                  Voltar ao calculado
                </button>
              )}
            </div>
            <div className="tcfg-nota">
              REN 1.000/2021, art. 655-G, §5º: a alocação de crédito entre postos observa a relação
              entre a TE do posto de injeção e a do posto de alocação. Deixe o campo de sobrescrever
              em branco, salvo se a fatura do cliente indicar fator diferente.
            </div>
            {d.fator_manual > 0 && calc > 0 && Math.abs(d.fator_manual - calc) > 0.02 && (
              <div className="tcfg-alerta">
                <AlertTriangle size={13} />
                Fator manual {mostra(d.fator_manual, 4)} contra {mostra(calc, 4)} pelas TE cadastradas.
              </div>
            )}
          </div>

          <div className="tcfg-bloco">
            <div className="tcfg-bloco-titulo">Vigência da tarifa</div>
            <label className="tcfg-campo tcfg-campo-data">
              <span className="tcfg-campo-label">Vigente até</span>
              <input type="date" className="tcfg-campo-input" value={d.vigencia || ""}
                onChange={(e) => setD((x) => ({ ...x, vigencia: e.target.value }))} />
            </label>
          </div>

          <div className="tcfg-acoes">
            <button className="tcfg-btn tcfg-btn-ghost" onClick={() => { tarifasStore.limpar(d.id); setD(registro); }}>
              <Eraser size={13} /> Limpar campos
            </button>
            <button className="tcfg-btn tcfg-btn-perigo"
              onClick={() => { if (confirm(`Remover ${d.nome} da lista?`)) tarifasStore.remover(d.id); }}>
              <Trash2 size={13} /> Remover
            </button>
            <button className="tcfg-btn tcfg-btn-salvar" onClick={salvar} disabled={!sujo && !salvo}>
              {salvo ? <><Check size={13} /> Alterações salvas</> : <><Save size={13} /> Salvar alterações</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── página ───────────────────────────────────────────────────── */
export default function TarifasPage() {
  const registros = useRegistros();
  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState(null);
  const [nova, setNova] = useState({ nome: "", uf: "" });

  const grupos = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const filtrados = registros.filter(
      (r) => !termo || r.nome.toLowerCase().includes(termo) || r.uf.toLowerCase().includes(termo)
    );
    const mapa = new Map();
    for (const r of filtrados) {
      if (!mapa.has(r.uf)) mapa.set(r.uf, []);
      mapa.get(r.uf).push(r);
    }
    return [...mapa.entries()];
  }, [registros, busca]);

  const adicionar = () => {
    if (!nova.nome.trim() || nova.uf.trim().length !== 2) return;
    const id = tarifasStore.adicionar(nova.nome, nova.uf);
    setNova({ nome: "", uf: "" });
    setAberto(id);
  };

  return (
    <div className="tcfg">
      <p className="tcfg-intro">
        Digite as tarifas de cada concessionária. É daqui que a proposta e o faturamento da usina
        puxam os valores quando você seleciona a concessionária. Energia em R$/MWh, demanda em R$/kW,
        tarifas sem tributos.
      </p>

      <div className="tcfg-busca">
        <Search size={14} />
        <input placeholder="Buscar por nome ou estado" value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>

      {grupos.map(([uf, itens]) => (
        <div key={uf} className="tcfg-uf-grupo">
          <div className="tcfg-uf-titulo">{uf} ({itens.length})</div>
          {itens.map((r) => (
            <CardConcessionaria
              key={r.id}
              registro={r}
              aberto={aberto === r.id}
              onToggle={() => setAberto(aberto === r.id ? null : r.id)}
            />
          ))}
        </div>
      ))}

      {grupos.length === 0 && <div className="tcfg-vazio">Nenhuma concessionária encontrada.</div>}

      <div className="tcfg-nova">
        <input placeholder="Nome da concessionária" value={nova.nome}
          onChange={(e) => setNova({ ...nova, nome: e.target.value })}
          onKeyDown={(e) => e.key === "Enter" && adicionar()} />
        <input placeholder="UF" maxLength={2} className="tcfg-nova-uf" value={nova.uf}
          onChange={(e) => setNova({ ...nova, uf: e.target.value.toUpperCase() })}
          onKeyDown={(e) => e.key === "Enter" && adicionar()} />
        <button className="tcfg-btn tcfg-btn-salvar" onClick={adicionar}>
          <Plus size={13} /> Adicionar concessionária
        </button>
      </div>
    </div>
  );
}
