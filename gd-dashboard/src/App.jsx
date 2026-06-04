import { useState, useMemo } from "react";
import { CONCESSIONARIAS, DISPONIBILIDADE } from "./data/tarifas";
import { calcular } from "./data/calcular";
import {
  Zap, ChevronDown, TrendingDown, TrendingUp, BarChart3,
  Building2, Gauge, DollarSign, Leaf, AlertCircle, Info
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend
} from "recharts";
import "./App.css";

const fmt  = (v) => v?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtN = (v, d=2) => v?.toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtP = (v) => (v * 100).toFixed(1) + "%";
const fmtK = (v) => v?.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function Slider({ label, value, onChange, min, max, step = 1, unit = "", fmt: fmtFn }) {
  return (
    <div className="slider-group">
      <div className="slider-header">
        <span className="slider-label">{label}</span>
        <span className="slider-value">{fmtFn ? fmtFn(value) : `${value}${unit}`}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))} className="slider" />
      <div className="slider-range"><span>{min}{unit}</span><span>{max}{unit}</span></div>
    </div>
  );
}

function KpiCard({ label, value, sub, color = "accent", icon: Icon, delta, small }) {
  return (
    <div className={`kpi-card kpi-${color}`}>
      {Icon && <div className="kpi-icon"><Icon size={18} /></div>}
      <div className="kpi-body">
        <div className={`kpi-value ${small ? "kpi-small" : ""}`}>{value}</div>
        <div className="kpi-label">{label}</div>
        {sub && <div className="kpi-sub">{sub}</div>}
      </div>
      {delta !== undefined && (
        <div className={`kpi-delta ${delta >= 0 ? "pos" : "neg"}`}>
          {delta >= 0 ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}
          {Math.abs(delta * 100).toFixed(1)}%
        </div>
      )}
    </div>
  );
}

function Section({ title, children, accent }) {
  return (
    <section className={`section ${accent ? "section-accent" : ""}`}>
      <h2 className="section-title">{title}</h2>
      {children}
    </section>
  );
}

function FaturaRow({ label, atual, gd, economia }) {
  return (
    <div className="fatura-row">
      <span className="fatura-label">{label}</span>
      <span className="fatura-atual">{fmt(atual)}</span>
      <span className="fatura-gd">{fmt(gd)}</span>
      <span className={`fatura-eco ${economia > 0 ? "eco-pos" : "eco-zero"}`}>
        {economia > 0.01 ? `− ${fmt(economia)}` : "—"}
      </span>
    </div>
  );
}

export default function App() {
  const [concId, setConcId]       = useState("celpe");
  const [grupo, setGrupo]         = useState("A4");
  const [modal, setModal]         = useState("VERDE");
  const [consumoP, setConsumoP]   = useState(3800);
  const [consumoFP, setConsumoFP] = useState(23000);
  const [demP, setDemP]           = useState(0);
  const [demFP, setDemFP]         = useState(90);
  const [tarDemP, setTarDemP]     = useState(0);
  const [tarDemFP, setTarDemFP]   = useState(25.51);
  const [icms, setIcms]           = useState(20.5);
  const [pis, setPis]             = useState(1.0);
  const [cofins, setCofins]       = useState(5.0);
  const [bandeira, setBandeira]   = useState(0);
  const [tip, setTip]             = useState(0);
  const [dispTipo, setDispTipo]   = useState("Trifásica");
  const [desconto, setDesconto]   = useState(20);

  const conc = useMemo(() => CONCESSIONARIAS.find(c => c.id === concId), [concId]);

  const resultado = useMemo(() => {
    if (!conc) return null;
    return calcular({
      grupo, modalidade: modal,
      consumo_p: consumoP, consumo_fp: consumoFP,
      dem_p: demP, dem_fp: demFP,
      tar_dem_p: tarDemP, tar_dem_fp: tarDemFP,
      icms: icms / 100, pis: pis / 100, cofins: cofins / 100,
      bandeira, tip,
      disponibilidade_kwh: DISPONIBILIDADE[dispTipo],
      desconto_gd: desconto / 100,
    }, conc);
  }, [conc, grupo, modal, consumoP, consumoFP, demP, demFP, tarDemP, tarDemFP,
      icms, pis, cofins, bandeira, tip, dispTipo, desconto]);

  if (!resultado) return null;
  const r = resultado;

  const chartFaturaData = [
    { name: "TE Ponta",     atual: r.fa.te_p,    gd: r.fg.te_p },
    { name: "TE F. Ponta",  atual: r.fa.te_fp,   gd: r.fg.te_fp },
    { name: "TUSD Ponta",   atual: r.fa.tusd_p,  gd: r.fg.tusd_p },
    { name: "TUSD F.Ponta", atual: r.fa.tusd_fp, gd: r.fg.tusd_fp },
    { name: "Demanda",      atual: r.fa.dem_p + r.fa.dem_fp, gd: r.fg.dem_p + r.fg.dem_fp },
    { name: "Disp.",        atual: r.fa.disp,    gd: r.fg.disp },
  ].filter(d => d.atual > 0.01);

  const pieTributos = [
    { name: "PIS",    value: r.tributos.pis,    fill: "#f59e0b" },
    { name: "COFINS", value: r.tributos.cofins, fill: "#ef4444" },
    { name: "ICMS",   value: r.tributos.icms,   fill: "#8b5cf6" },
    { name: "Base",   value: r.tributos.base,   fill: "#22c55e" },
  ];

  const chartUsinaData = [
    { name: "Receita A4",      value: r.usina.receita_mensal,          fill: "#22c55e" },
    { name: "Custo Oport.",    value: r.usina.custo_oport_mensal,       fill: "#ef4444" },
    { name: "Líquido A4",      value: r.usina.resultado_liquido_mensal, fill: "#3b82f6" },
    { name: "Receita B3",      value: r.usina.receita_b3_mensal,        fill: "#f59e0b" },
  ];

  return (
    <div className="app">
      {/* ── HEADER ── */}
      <header className="header">
        <div className="header-inner">
          <div className="header-brand">
            <div className="brand-icon"><Zap size={22} /></div>
            <div>
              <div className="brand-title">GD Dashboard</div>
              <div className="brand-sub">Simulador de Geração Distribuída</div>
            </div>
          </div>
          <div className="header-badges">
            <span className="badge">ANEEL 2026</span>
            <span className="badge badge-green">Método CELPE</span>
          </div>
        </div>
      </header>

      <div className="layout">
        {/* ── SIDEBAR ── */}
        <aside className="sidebar">
          <div className="sidebar-scroll">

            {/* Concessionária */}
            <div className="input-group">
              <label className="input-label"><Building2 size={13}/> Concessionária</label>
              <div className="select-wrap">
                <select value={concId} onChange={e => setConcId(e.target.value)} className="select">
                  {CONCESSIONARIAS.map(c => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="select-icon"/>
              </div>
            </div>

            {/* Grupo + Modalidade */}
            <div className="row-2">
              <div className="input-group">
                <label className="input-label">Grupo</label>
                <div className="toggle-group">
                  {["A4","A3"].map(g => (
                    <button key={g} className={`toggle-btn ${grupo===g?"active":""}`}
                      onClick={() => setGrupo(g)}>{g}</button>
                  ))}
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Modalidade</label>
                <div className="toggle-group">
                  {["AZUL","VERDE"].map(m => (
                    <button key={m} className={`toggle-btn ${modal===m?"active":""}`}
                      onClick={() => setModal(m)}>{m}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="divider"/>

            {/* Consumo */}
            <Slider label="Consumo Ponta (kWh)" value={consumoP} onChange={setConsumoP}
              min={0} max={50000} step={100} unit=" kWh" fmt={v=>`${fmtK(v)} kWh`}/>
            <Slider label="Consumo Fora Ponta (kWh)" value={consumoFP} onChange={setConsumoFP}
              min={0} max={200000} step={500} unit=" kWh" fmt={v=>`${fmtK(v)} kWh`}/>

            {/* Taxa de Disponibilidade */}
            <div className="input-group">
              <label className="input-label">Taxa de Disponibilidade</label>
              <div className="select-wrap">
                <select value={dispTipo} onChange={e => setDispTipo(e.target.value)} className="select">
                  {Object.entries(DISPONIBILIDADE).map(([k,v]) => (
                    <option key={k} value={k}>{k} ({v} kWh)</option>
                  ))}
                </select>
                <ChevronDown size={14} className="select-icon"/>
              </div>
            </div>

            <div className="divider"/>

            {/* Demanda */}
            <Slider label="Demanda Contratada FP (kW)" value={demFP} onChange={setDemFP}
              min={0} max={500} step={1} unit=" kW" fmt={v=>`${v} kW`}/>
            <Slider label="Tarifa Demanda FP (R$/kW)" value={tarDemFP} onChange={setTarDemFP}
              min={0} max={100} step={0.01} fmt={v=>`R$ ${fmtK(v)}/kW`}/>
            <Slider label="Demanda Contratada Ponta (kW)" value={demP} onChange={setDemP}
              min={0} max={500} step={1} unit=" kW" fmt={v=>`${v} kW`}/>
            {demP > 0 && (
              <Slider label="Tarifa Demanda Ponta (R$/kW)" value={tarDemP} onChange={setTarDemP}
                min={0} max={200} step={0.01} fmt={v=>`R$ ${fmtK(v)}/kW`}/>
            )}

            <div className="divider"/>

            {/* Tributos */}
            <div className="input-label" style={{marginBottom:8, display:"flex", alignItems:"center", gap:6}}>
              <Gauge size={13}/> Alíquotas de Tributos
            </div>
            <Slider label="ICMS (%)" value={icms} onChange={setIcms}
              min={0} max={35} step={0.5} fmt={v=>`${v.toFixed(1)}%`}/>
            <Slider label="PIS (%)" value={pis} onChange={setPis}
              min={0} max={5} step={0.001} fmt={v=>`${v.toFixed(3)}%`}/>
            <Slider label="COFINS (%)" value={cofins} onChange={setCofins}
              min={0} max={10} step={0.001} fmt={v=>`${v.toFixed(3)}%`}/>
            <Slider label="Bandeira (R$/kWh)" value={bandeira} onChange={setBandeira}
              min={0} max={0.10} step={0.001} fmt={v=>`R$ ${v.toFixed(4)}`}/>
            <Slider label="TIP — Taxa Ilum. Pública (R$)" value={tip} onChange={setTip}
              min={0} max={500} step={1} fmt={v=>`R$ ${fmtK(v)}`}/>

            <div className="divider"/>

            {/* Desconto GD */}
            <div className="desconto-box">
              <div className="input-label" style={{display:"flex",alignItems:"center",gap:6}}>
                <Leaf size={13}/> Desconto GD
              </div>
              <Slider label="Desconto oferecido ao cliente" value={desconto} onChange={setDesconto}
                min={5} max={35} step={1} fmt={v=>`${v}%`}/>
              <div className="desconto-info">
                Tarifa c/ desconto: <strong>{fmtN(r.tar_desconto_c_trib, 6)} R$/kWh</strong>
              </div>
            </div>

          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className="main">

          {/* KPIs principais */}
          <div className="kpi-grid">
            <KpiCard label="Fatura Atual" value={fmt(r.fa.total)} icon={DollarSign}
              color="neutral" sub={`${fmtK(consumoP+consumoFP)} kWh totais`}/>
            <KpiCard label="Fatura com GD" value={fmt(r.fg.total)} icon={Leaf}
              color="green" sub="após compensação"/>
            <KpiCard label="Economia Mensal" value={fmt(r.economia_total)} icon={TrendingDown}
              color="accent" delta={-r.pct_economia}/>
            <KpiCard label="Economia Anual" value={fmt(r.economia_total*12)} icon={BarChart3}
              color="accent" sub="projeção 12 meses"/>
          </div>

          {/* Economia % destaque */}
          <div className="economia-destaque">
            <div className="economia-pct">{fmtP(r.pct_economia)}</div>
            <div className="economia-label">de economia na fatura do cliente</div>
            <div className="economia-subs">
              <span>Tarifa média A4: <strong>{fmtN(r.tar_media_c_trib,6)} R$/kWh</strong></span>
              <span>Com GD: <strong>{fmtN(r.tar_desconto_c_trib,6)} R$/kWh</strong></span>
              <span>Fator ajuste ponta: <strong>{fmtN(r.fator_geracao,4)}×</strong></span>
            </div>
          </div>

          {/* ── COMPARATIVO DE FATURA ── */}
          <Section title="Comparativo de Fatura">
            <div className="fatura-header">
              <span></span>
              <span className="fatura-col-lbl">Sem GD</span>
              <span className="fatura-col-lbl fatura-col-gd">Com GD</span>
              <span className="fatura-col-lbl fatura-col-eco">Economia</span>
            </div>
            <FaturaRow label="TE Ponta"           atual={r.fa.te_p}    gd={r.fg.te_p}    economia={r.fa.te_p-r.fg.te_p}/>
            <FaturaRow label="TE Fora Ponta"      atual={r.fa.te_fp}   gd={r.fg.te_fp}   economia={r.fa.te_fp-r.fg.te_fp}/>
            <FaturaRow label="TUSD Cons. Ponta"   atual={r.fa.tusd_p}  gd={r.fg.tusd_p}  economia={r.fa.tusd_p-r.fg.tusd_p}/>
            <FaturaRow label="TUSD Cons. FP"      atual={r.fa.tusd_fp} gd={r.fg.tusd_fp} economia={r.fa.tusd_fp-r.fg.tusd_fp}/>
            {r.fa.dem_p > 0.01 && <FaturaRow label="Demanda Ponta"  atual={r.fa.dem_p}  gd={r.fg.dem_p}  economia={0}/>}
            {r.fa.dem_fp > 0.01&& <FaturaRow label="Demanda FP"     atual={r.fa.dem_fp} gd={r.fg.dem_fp} economia={0}/>}
            <FaturaRow label="Taxa Disponibilidade" atual={r.fa.disp}  gd={r.fg.disp}   economia={0}/>
            {r.fa.bandeira > 0.01&& <FaturaRow label="Bandeira"     atual={r.fa.bandeira} gd={r.fg.bandeira} economia={0}/>}
            {r.fa.tip > 0.01    && <FaturaRow label="TIP"           atual={r.fa.tip}    gd={r.fg.tip}    economia={0}/>}
            <div className="fatura-row fatura-total">
              <span className="fatura-label">TOTAL (com tributos)</span>
              <span className="fatura-atual">{fmt(r.fa.total)}</span>
              <span className="fatura-gd">{fmt(r.fg.total)}</span>
              <span className="fatura-eco eco-pos">{fmt(r.economia_total)}</span>
            </div>
          </Section>

          {/* Charts row */}
          <div className="charts-row">
            <Section title="Fatura por Componente">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartFaturaData} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                  <XAxis dataKey="name" tick={{fontSize:10, fill:"var(--text-muted)", fontFamily:"JetBrains Mono"}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fontSize:10, fill:"var(--text-muted)"}} axisLine={false} tickLine={false}
                    tickFormatter={v => `R$${(v/1000).toFixed(0)}k`}/>
                  <Tooltip formatter={(v) => fmt(v)} contentStyle={{background:"var(--card)", border:"1px solid var(--border)", borderRadius:8, fontFamily:"JetBrains Mono", fontSize:12}}/>
                  <Bar dataKey="atual" name="Sem GD"   fill="var(--text-muted)" radius={[3,3,0,0]}/>
                  <Bar dataKey="gd"    name="Com GD"   fill="var(--accent)"     radius={[3,3,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </Section>

            <Section title="Composição Tributária">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieTributos} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                    paddingAngle={2} dataKey="value">
                    {pieTributos.map((e, i) => <Cell key={i} fill={e.fill}/>)}
                  </Pie>
                  <Tooltip formatter={v => fmt(v)} contentStyle={{background:"var(--card)", border:"1px solid var(--border)", borderRadius:8, fontSize:12}}/>
                  <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{fontSize:11,color:"var(--text-muted)",fontFamily:"JetBrains Mono"}}>{v}</span>}/>
                </PieChart>
              </ResponsiveContainer>
              <div className="tributos-info">
                <span>Multiplicador: <strong>{fmtN(r.mult,6)}</strong></span>
                <span>PIS/COFINS sobre base s/ ICMS · ICMS por dentro</span>
              </div>
            </Section>
          </div>

          {/* ── GERAÇÃO ── */}
          <Section title="Geração Necessária (Fator de Ajuste Ponta)">
            <div className="geracao-grid">
              <div className="geracao-card">
                <div className="geracao-label">Consumo real cliente</div>
                <div className="geracao-value">{fmtK(consumoP + consumoFP)} kWh</div>
              </div>
              <div className="geracao-arrow">→</div>
              <div className="geracao-card geracao-card-accent">
                <div className="geracao-label">Geração necessária</div>
                <div className="geracao-value">{fmtK(r.geracao_total)} kWh</div>
                <div className="geracao-sub">Ponta exige {fmtN(r.fator_geracao,4)}× de geração</div>
              </div>
              <div className="geracao-arrow">→</div>
              <div className="geracao-card geracao-card-warn">
                <div className="geracao-label">kWh extra (custo oport.)</div>
                <div className="geracao-value">{fmtK(r.kwh_extra)} kWh</div>
                <div className="geracao-sub">Fator ajuste TE: {fmtN(r.fator_ajuste,4)}</div>
              </div>
            </div>
          </Section>

          {/* ── FATURAMENTO USINA ── */}
          <Section title="Faturamento da Usina" accent>
            <div className="usina-grid">
              <div className="usina-bloco">
                <div className="usina-bloco-title">💰 Receita</div>
                <div className="usina-row"><span>Energia compensada</span><strong>{fmtK(consumoP+consumoFP)} kWh</strong></div>
                <div className="usina-row"><span>Tarifa c/ desc (c/ trib)</span><strong>{fmtN(r.tar_desconto_c_trib,6)} R$/kWh</strong></div>
                <div className="usina-row usina-row-total"><span>Receita mensal</span><strong>{fmt(r.usina.receita_mensal)}</strong></div>
                <div className="usina-row usina-row-total"><span>Receita anual</span><strong>{fmt(r.usina.receita_anual)}</strong></div>
              </div>
              <div className="usina-bloco usina-bloco-warn">
                <div className="usina-bloco-title">📉 Custo de Oportunidade</div>
                <div className="usina-row"><span>kWh extra gerado</span><strong>{fmtK(r.kwh_extra)} kWh</strong></div>
                <div className="usina-row"><span>Tarifa FP c/ desc (c/ trib)</span><strong>{fmtN(r.usina.custo_oport_mensal/r.kwh_extra||0,6)} R$/kWh</strong></div>
                <div className="usina-row usina-row-total"><span>Custo oport. mensal</span><strong>{fmt(r.usina.custo_oport_mensal)}</strong></div>
                <div className="usina-info"><Info size={12}/> Energia gerada de graça — deixa de vender</div>
              </div>
              <div className="usina-bloco usina-bloco-green">
                <div className="usina-bloco-title">🏆 Resultado Líquido</div>
                <div className="usina-row"><span>Receita bruta</span><strong>{fmt(r.usina.receita_mensal)}</strong></div>
                <div className="usina-row"><span>(-) Custo oport.</span><strong>− {fmt(r.usina.custo_oport_mensal)}</strong></div>
                <div className="usina-row usina-row-total highlight"><span>Líquido mensal</span><strong>{fmt(r.usina.resultado_liquido_mensal)}</strong></div>
                <div className="usina-row usina-row-total highlight"><span>Líquido anual</span><strong>{fmt(r.usina.resultado_liquido_anual)}</strong></div>
              </div>
            </div>

            {/* Chart usina */}
            <ResponsiveContainer width="100%" height={200} style={{marginTop:24}}>
              <BarChart data={chartUsinaData} layout="vertical" barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false}/>
                <XAxis type="number" tick={{fontSize:10,fill:"var(--text-muted)"}} axisLine={false} tickLine={false}
                  tickFormatter={v=>`R$${(v/1000).toFixed(0)}k`}/>
                <YAxis type="category" dataKey="name" tick={{fontSize:11,fill:"var(--text-muted)",fontFamily:"JetBrains Mono"}} axisLine={false} tickLine={false} width={110}/>
                <Tooltip formatter={v=>fmt(v)} contentStyle={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:8,fontSize:12}}/>
                <Bar dataKey="value" radius={[0,4,4,0]}>
                  {chartUsinaData.map((e,i) => <Cell key={i} fill={e.fill}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Comparativo A4 vs B3 */}
            <div className="comparativo-box">
              <div className="comparativo-title">A4 vs Grupo B — Mesmo Volume</div>
              <div className="comparativo-grid">
                <div className="comparativo-col col-a4">
                  <div className="comp-label">Cliente A4 (c/ fator ponta)</div>
                  <div className="comp-kwh">{fmtK(r.geracao_total)} kWh</div>
                  <div className="comp-receita">{fmt(r.usina.receita_mensal)}<span>/mês bruto</span></div>
                  <div className="comp-liquido">{fmt(r.usina.resultado_liquido_mensal)}<span>/mês líquido</span></div>
                </div>
                <div className="comparativo-vs">VS</div>
                <div className="comparativo-col col-b3">
                  <div className="comp-label">Cliente B3 (sem fator)</div>
                  <div className="comp-kwh">{fmtK(r.usina.geracao_b3)} kWh</div>
                  <div className="comp-receita">{fmt(r.usina.receita_b3_mensal)}<span>/mês</span></div>
                  <div className="comp-liquido comp-liquido-b3">{fmt(r.usina.receita_b3_mensal)}<span>/mês</span></div>
                </div>
              </div>
              <div className={`comparativo-dif ${r.usina.dif_a4_vs_b3 >= 0 ? "dif-pos" : "dif-neg"}`}>
                {r.usina.dif_a4_vs_b3 >= 0 ? "A4 rende " : "B3 rende "}
                <strong>{fmt(Math.abs(r.usina.dif_a4_vs_b3))}/mês</strong>
                {r.usina.dif_a4_vs_b3 >= 0 ? " a mais" : " a mais"}
              </div>
            </div>
          </Section>

          {/* Tarifas referência */}
          <Section title="Tarifas de Referência — Sem Tributos">
            <div className="tarifas-ref">
              <div className="tar-item">
                <span>TUSD cons. Ponta</span><strong>{fmtN(conc[grupo==="A4"?"a4":"a3"]?.[modal==="AZUL"?"azul":"verde"]?.tusd_cons_p||0,6)} R$/kWh</strong>
              </div>
              <div className="tar-item">
                <span>TUSD cons. FP</span><strong>{fmtN(conc[grupo==="A4"?"a4":"a3"]?.[modal==="AZUL"?"azul":"verde"]?.tusd_cons_fp||0,6)} R$/kWh</strong>
              </div>
              <div className="tar-item">
                <span>TE Ponta</span><strong>{fmtN(conc[grupo==="A4"?"a4":"a3"]?.[modal==="AZUL"?"azul":"verde"]?.te_p||0,6)} R$/kWh</strong>
              </div>
              <div className="tar-item">
                <span>TE Fora Ponta</span><strong>{fmtN(conc[grupo==="A4"?"a4":"a3"]?.[modal==="AZUL"?"azul":"verde"]?.te_fp||0,6)} R$/kWh</strong>
              </div>
              <div className="tar-item">
                <span>Tar. Total Ponta</span><strong>{fmtN(r.tar_total_p,6)} R$/kWh</strong>
              </div>
              <div className="tar-item">
                <span>Tar. Total FP</span><strong>{fmtN(r.tar_total_fp,6)} R$/kWh</strong>
              </div>
              <div className="tar-item">
                <span>Tar. Total Ponta c/ trib</span><strong>{fmtN(r.tar_total_p_trib,6)} R$/kWh</strong>
              </div>
              <div className="tar-item">
                <span>Tar. Total FP c/ trib</span><strong>{fmtN(r.tar_total_fp_trib,6)} R$/kWh</strong>
              </div>
              <div className="tar-item tar-item-b3">
                <span>B3 (TUSD+TE) s/ trib</span><strong>{fmtN(conc.b3.total,6)} R$/kWh</strong>
              </div>
              <div className="tar-item tar-item-b3">
                <span>B3 (TUSD+TE) c/ trib</span><strong>{fmtN(conc.b3.total*r.mult,6)} R$/kWh</strong>
              </div>
            </div>
          </Section>

          <footer className="footer">
            Fonte: ANEEL — Planilhas PCAT 2025/2026 · Método de tributos: CELPE (PIS/COFINS base s/ ICMS, ICMS por dentro) · REN 1.000/2021 Art. 655-G §5º
          </footer>
        </main>
      </div>
    </div>
  );
}
