import { useState, useMemo } from "react";
import { CONCESSIONARIAS, DISPONIBILIDADE } from "./data/tarifas";
import { calcular } from "./data/calcular";
import {
  Zap, ChevronDown, TrendingDown, TrendingUp, BarChart3,
  Building2, Gauge, DollarSign, Leaf, Info, User, Phone,
  FileText, Factory, ArrowRight
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

// ── NumInput ──────────────────────────────────────────────────────────────────
function NumInput({ label, value, onChange, min = 0, max = 999999, unit = "", fmtFn }) {
  const [raw, setRaw] = useState(String(value));
  const [focused, setFocused] = useState(false);
  if (!focused && String(value) !== raw) setRaw(String(value));
  const commit = (str) => {
    const n = parseFloat(str.replace(",", "."));
    if (!isNaN(n)) { const c = Math.min(max, Math.max(min, n)); onChange(c); setRaw(String(c)); }
    else setRaw(String(value));
  };
  return (
    <div className="numinput-group">
      {label && <label className="numinput-label">{label}</label>}
      <div className="numinput-wrap">
        <input type="text" inputMode="decimal" className="numinput"
          value={focused ? raw : (fmtFn ? fmtFn(value) : `${value}${unit}`)}
          onFocus={() => { setFocused(true); setRaw(String(value)); }}
          onBlur={() => { setFocused(false); commit(raw); }}
          onChange={e => setRaw(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") e.target.blur(); }} />
        {unit && <span className="numinput-unit">{unit}</span>}
      </div>
    </div>
  );
}

// ── TextInput ─────────────────────────────────────────────────────────────────
function TextInput({ label, value, onChange, placeholder }) {
  return (
    <div className="numinput-group">
      {label && <label className="numinput-label">{label}</label>}
      <div className="numinput-wrap">
        <input type="text" className="numinput" style={{textAlign:"left", color:"var(--text)"}}
          value={value} placeholder={placeholder}
          onChange={e => onChange(e.target.value)} />
      </div>
    </div>
  );
}

// ── KpiCard ───────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color = "accent", icon: Icon, delta }) {
  return (
    <div className={`kpi-card kpi-${color}`}>
      {Icon && <div className="kpi-icon"><Icon size={18} /></div>}
      <div className="kpi-body">
        <div className="kpi-value">{value}</div>
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

// ── FATURA CARD ───────────────────────────────────────────────────────────────
function FaturaCard({ title, colorClass, items, total, badge, badgeClass }) {
  return (
    <div className={`fatura-card ${colorClass}`}>
      <div className="fatura-card-header">
        <span className="fatura-card-title">{title}</span>
        {badge && <span className={`fatura-badge ${badgeClass}`}>{badge}</span>}
      </div>
      <div className="fatura-card-body">
        {items.map((item, i) => item.value > 0.01 && (
          <div key={i} className="fatura-card-row">
            <span className="fatura-card-label">{item.label}</span>
            <span className="fatura-card-value">{fmt(item.value)}</span>
          </div>
        ))}
      </div>
      <div className="fatura-card-total">
        <span>TOTAL</span>
        <span>{fmt(total)}</span>
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState("proposta");

  // Cliente
  const [nomeCliente, setNomeCliente]   = useState("");
  const [cpfCliente, setCpfCliente]     = useState("");
  const [telCliente, setTelCliente]     = useState("");
  const [endCliente, setEndCliente]     = useState("");

  // Configuração tarifária
  const [concId, setConcId]     = useState("celpe");
  const [grupo, setGrupo]       = useState("A4");
  const [modal, setModal]       = useState("VERDE");
  const [consumoP, setConsumoP] = useState(3800);
  const [consumoFP, setConsumoFP] = useState(23000);
  const [demP, setDemP]         = useState(0);
  const [demFP, setDemFP]       = useState(90);
  const [tarDemP, setTarDemP]   = useState(0);
  const [tarDemFP, setTarDemFP] = useState(25.51);
  const [icms, setIcms]         = useState(20.5);
  const [pis, setPis]           = useState(1.0);
  const [cofins, setCofins]     = useState(5.0);
  const [bandeira, setBandeira] = useState(0);
  const [tip, setTip]           = useState(0);
  const [dispTipo, setDispTipo] = useState("Trifásica");
  const [desconto, setDesconto] = useState(20);

  const conc = useMemo(() => CONCESSIONARIAS.find(c => c.id === concId), [concId]);

  const r = useMemo(() => {
    if (!conc) return null;
    return calcular({
      grupo, modalidade: modal,
      consumo_p: consumoP, consumo_fp: consumoFP,
      dem_p: demP, dem_fp: demFP,
      tar_dem_p: tarDemP, tar_dem_fp: tarDemFP,
      icms: icms/100, pis: pis/100, cofins: cofins/100,
      bandeira, tip,
      disponibilidade_kwh: DISPONIBILIDADE[dispTipo],
      desconto_gd: desconto/100,
    }, conc);
  }, [conc, grupo, modal, consumoP, consumoFP, demP, demFP, tarDemP, tarDemFP,
      icms, pis, cofins, bandeira, tip, dispTipo, desconto]);

  if (!r) return null;

  const faturaAtualItems = [
    { label: "TE Ponta",            value: r.fa.te_p },
    { label: "TE Fora Ponta",       value: r.fa.te_fp },
    { label: "TUSD Cons. Ponta",    value: r.fa.tusd_p },
    { label: "TUSD Cons. FP",       value: r.fa.tusd_fp },
    { label: "Demanda Ponta",       value: r.fa.dem_p },
    { label: "Demanda FP",          value: r.fa.dem_fp },
    { label: "Taxa Disponibilidade",value: r.fa.disp },
    { label: "Bandeira",            value: r.fa.bandeira },
    { label: "TIP",                 value: r.fa.tip },
  ];

  const faturaGdItems = [
    { label: "TE Ponta",            value: r.fg.te_p },
    { label: "TE Fora Ponta",       value: r.fg.te_fp },
    { label: "TUSD Cons. Ponta",    value: r.fg.tusd_p },
    { label: "TUSD Cons. FP",       value: r.fg.tusd_fp },
    { label: "Demanda Ponta",       value: r.fg.dem_p },
    { label: "Demanda FP",          value: r.fg.dem_fp },
    { label: "Taxa Disponibilidade",value: r.fg.disp },
    { label: "Bandeira",            value: r.fg.bandeira },
    { label: "TIP",                 value: r.fg.tip },
  ];

  const pieTributos = [
    { name: "PIS",    value: r.tributos.pis,    fill: "#f59e0b" },
    { name: "COFINS", value: r.tributos.cofins, fill: "#ef4444" },
    { name: "ICMS",   value: r.tributos.icms,   fill: "#8b5cf6" },
    { name: "Base",   value: r.tributos.base,   fill: "#22c55e" },
  ];

  const chartUsinaData = [
    { name: "Receita A4",     value: r.usina.receita_mensal,          fill: "#22c55e" },
    { name: "Custo Oport.",   value: r.usina.custo_oport_mensal,       fill: "#ef4444" },
    { name: "Líquido A4",     value: r.usina.resultado_liquido_mensal, fill: "#3b82f6" },
    { name: "Receita B3",     value: r.usina.receita_b3_mensal,        fill: "#f59e0b" },
  ];

  // ── SIDEBAR ─────────────────────────────────────────────────────────────────
  const sidebar = (
    <aside className="sidebar">
      <div className="sidebar-scroll">

        {/* Cliente */}
        <div className="sb-section-title"><User size={12}/> Dados do Cliente</div>
        <TextInput label="Nome" value={nomeCliente} onChange={setNomeCliente} placeholder="Nome completo"/>
        <div className="row-2">
          <TextInput label="CPF / CNPJ" value={cpfCliente} onChange={setCpfCliente} placeholder="000.000.000-00"/>
          <TextInput label="Telefone" value={telCliente} onChange={setTelCliente} placeholder="(81) 99999-9999"/>
        </div>
        <TextInput label="Endereço" value={endCliente} onChange={setEndCliente} placeholder="Rua, número, cidade"/>

        <div className="divider"/>

        {/* Concessionária */}
        <div className="sb-section-title"><Building2 size={12}/> Concessionária</div>
        <div className="input-group">
          <div className="select-wrap">
            <select value={concId} onChange={e => setConcId(e.target.value)} className="select">
              {CONCESSIONARIAS.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
            <ChevronDown size={14} className="select-icon"/>
          </div>
        </div>
        <div className="row-2">
          <div className="input-group">
            <label className="numinput-label">Grupo</label>
            <div className="toggle-group">
              {["A4","A3"].map(g => <button key={g} className={`toggle-btn ${grupo===g?"active":""}`} onClick={() => setGrupo(g)}>{g}</button>)}
            </div>
          </div>
          <div className="input-group">
            <label className="numinput-label">Modalidade</label>
            <div className="toggle-group">
              {["AZUL","VERDE"].map(m => <button key={m} className={`toggle-btn ${modal===m?"active":""}`} onClick={() => setModal(m)}>{m}</button>)}
            </div>
          </div>
        </div>

        <div className="divider"/>

        {/* Consumo */}
        <div className="sb-section-title"><Gauge size={12}/> Consumo & Demanda</div>
        <NumInput label="Consumo Ponta (kWh)" value={consumoP} onChange={setConsumoP} unit=" kWh"/>
        <NumInput label="Consumo Fora Ponta (kWh)" value={consumoFP} onChange={setConsumoFP} unit=" kWh"/>
        <div className="input-group">
          <label className="numinput-label">Taxa de Disponibilidade</label>
          <div className="select-wrap">
            <select value={dispTipo} onChange={e => setDispTipo(e.target.value)} className="select">
              {Object.entries(DISPONIBILIDADE).map(([k,v]) => <option key={k} value={k}>{k} ({v} kWh)</option>)}
            </select>
            <ChevronDown size={14} className="select-icon"/>
          </div>
        </div>
        <div className="row-2">
          <NumInput label="Demanda FP (kW)" value={demFP} onChange={setDemFP} unit=" kW"/>
          <NumInput label="Tarifa Dem. FP (R$/kW)" value={tarDemFP} onChange={setTarDemFP} fmtFn={v=>`R$ ${fmtK(v)}`}/>
        </div>
        <div className="row-2">
          <NumInput label="Demanda P (kW)" value={demP} onChange={setDemP} unit=" kW"/>
          <NumInput label="Tarifa Dem. P (R$/kW)" value={tarDemP} onChange={setTarDemP} fmtFn={v=>`R$ ${fmtK(v)}`}/>
        </div>

        <div className="divider"/>

        {/* Tributos */}
        <div className="sb-section-title"><Gauge size={12}/> Tributos</div>
        <div className="row-2">
          <NumInput label="ICMS (%)" value={icms} onChange={setIcms} fmtFn={v=>`${v.toFixed(1)}%`}/>
          <NumInput label="PIS (%)" value={pis} onChange={setPis} fmtFn={v=>`${v.toFixed(3)}%`}/>
        </div>
        <div className="row-2">
          <NumInput label="COFINS (%)" value={cofins} onChange={setCofins} fmtFn={v=>`${v.toFixed(3)}%`}/>
          <NumInput label="Bandeira (R$/kWh)" value={bandeira} onChange={setBandeira} fmtFn={v=>`R$ ${v.toFixed(4)}`}/>
        </div>
        <NumInput label="TIP — Taxa Ilum. Pública (R$)" value={tip} onChange={setTip} fmtFn={v=>`R$ ${fmtK(v)}`}/>

        <div className="divider"/>

        {/* Desconto */}
        <div className="desconto-box">
          <div className="sb-section-title" style={{marginBottom:8}}><Leaf size={12}/> Desconto GD</div>
          <NumInput label="Desconto ao cliente (%)" value={desconto} onChange={setDesconto} fmtFn={v=>`${v}%`}/>
          <div className="desconto-info">
            Tarifa final: <strong>{fmtN(r.tar_desconto_c_trib, 6)} R$/kWh</strong>
          </div>
        </div>

      </div>
    </aside>
  );

  // ── ABA PROPOSTA ─────────────────────────────────────────────────────────────
  const tabProposta = (
    <div className="tab-content">

      {/* Header da proposta com dados do cliente */}
      {(nomeCliente || cpfCliente) && (
        <div className="proposta-header">
          <div className="proposta-cliente">
            <div className="proposta-cliente-icon"><User size={18}/></div>
            <div>
              <div className="proposta-cliente-nome">{nomeCliente || "—"}</div>
              <div className="proposta-cliente-info">
                {cpfCliente && <span>{cpfCliente}</span>}
                {telCliente && <span>{telCliente}</span>}
                {endCliente && <span>{endCliente}</span>}
              </div>
            </div>
          </div>
          <div className="proposta-conc">
            <span className="badge">{conc?.uf}</span>
            <span className="badge">{conc?.nome?.split(" (")[0]}</span>
            <span className="badge badge-green">{grupo} {modal}</span>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="kpi-grid">
        <KpiCard label="Fatura Atual" value={fmt(r.fa.total)} icon={DollarSign} color="neutral" sub={`${fmtK(consumoP+consumoFP)} kWh`}/>
        <KpiCard label="Fatura com GD" value={fmt(r.fg.total)} icon={Leaf} color="green"/>
        <KpiCard label="Economia Mensal" value={fmt(r.economia_total)} icon={TrendingDown} color="accent" delta={-r.pct_economia}/>
        <KpiCard label="Economia Anual" value={fmt(r.economia_total*12)} icon={BarChart3} color="accent" sub="12 meses"/>
      </div>

      {/* Economia destaque */}
      <div className="economia-destaque">
        <div className="economia-pct">{fmtP(r.pct_economia)}</div>
        <div className="economia-mid">
          <div className="economia-label">de economia na fatura</div>
          <div className="economia-subs">
            <span>Tarifa média A4: <strong>{fmtN(r.tar_media_c_trib,6)} R$/kWh</strong></span>
            <span>Com GD ({desconto}% desc.): <strong>{fmtN(r.tar_desconto_c_trib,6)} R$/kWh</strong></span>
            <span>Fator ajuste ponta: <strong>{fmtN(r.fator_geracao,4)}×</strong></span>
          </div>
        </div>
        <div className="economia-anual-box">
          <div className="economia-anual-label">Economia em 12 meses</div>
          <div className="economia-anual-value">{fmt(r.economia_total*12)}</div>
        </div>
      </div>

      {/* FATURAS LADO A LADO */}
      <div className="faturas-comparativo">
        <FaturaCard
          title="Fatura Atual"
          colorClass="fatura-atual-card"
          items={faturaAtualItems}
          total={r.fa.total}
          badge="Sem GD"
          badgeClass="badge-neutro"
        />

        <div className="faturas-seta">
          <div className="seta-economia">
            <TrendingDown size={20}/>
            <span>{fmtP(r.pct_economia)}</span>
            <span className="seta-valor">{fmt(r.economia_total)}/mês</span>
          </div>
          <ArrowRight size={28} className="seta-arrow"/>
        </div>

        <FaturaCard
          title="Fatura com GD"
          colorClass="fatura-gd-card"
          items={faturaGdItems}
          total={r.fg.total}
          badge={`${desconto}% desconto`}
          badgeClass="badge-green"
        />
      </div>

      {/* Tarifas referência + tributos */}
      <div className="charts-row">
        <Section title="Composição Tributária da Fatura Atual">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieTributos} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={2} dataKey="value">
                {pieTributos.map((e,i) => <Cell key={i} fill={e.fill}/>)}
              </Pie>
              <Tooltip formatter={v => fmt(v)} contentStyle={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:8,fontSize:12}}/>
              <Legend iconType="circle" iconSize={8} formatter={v => <span style={{fontSize:11,color:"var(--text-muted)",fontFamily:"var(--font-mono)"}}>{v}</span>}/>
            </PieChart>
          </ResponsiveContainer>
          <div className="tributos-info">
            <span>Multiplicador: <strong>{fmtN(r.mult,6)}</strong></span>
            <span>PIS/COFINS base s/ ICMS · ICMS por dentro</span>
          </div>
        </Section>

        <Section title="Tarifas de Referência">
          <div className="tarifas-ref">
            {[
              ["TUSD Cons. Ponta",     fmtN(r.tar_total_p - (conc[grupo==="A4"?"a4":"a3"]?.[modal==="AZUL"?"azul":"verde"]?.te_p||0), 6)],
              ["TUSD Cons. FP",        fmtN(r.tar_total_fp - (conc[grupo==="A4"?"a4":"a3"]?.[modal==="AZUL"?"azul":"verde"]?.te_fp||0), 6)],
              ["TE Ponta",             fmtN(conc[grupo==="A4"?"a4":"a3"]?.[modal==="AZUL"?"azul":"verde"]?.te_p||0, 6)],
              ["TE Fora Ponta",        fmtN(conc[grupo==="A4"?"a4":"a3"]?.[modal==="AZUL"?"azul":"verde"]?.te_fp||0, 6)],
              ["Total Ponta s/ trib",  fmtN(r.tar_total_p, 6)],
              ["Total FP s/ trib",     fmtN(r.tar_total_fp, 6)],
              ["Total Ponta c/ trib",  fmtN(r.tar_total_p_trib, 6)],
              ["Total FP c/ trib",     fmtN(r.tar_total_fp_trib, 6)],
              ["B3 s/ trib",           fmtN(conc.b3.total, 6)],
              ["B3 c/ trib",           fmtN(conc.b3.total*r.mult, 6)],
            ].map(([k,v],i) => (
              <div key={i} className={`tar-item ${k.startsWith("B3") ? "tar-item-b3":""}`}>
                <span>{k}</span><strong>{v} R$/kWh</strong>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* Geração */}
      <Section title="Geração Necessária — Fator de Ajuste Ponta">
        <div className="geracao-grid">
          <div className="geracao-card">
            <div className="geracao-label">Consumo real do cliente</div>
            <div className="geracao-value">{fmtK(consumoP + consumoFP)} kWh</div>
          </div>
          <div className="geracao-arrow">→</div>
          <div className="geracao-card geracao-card-accent">
            <div className="geracao-label">Geração necessária</div>
            <div className="geracao-value">{fmtK(r.geracao_total)} kWh</div>
            <div className="geracao-sub">Fator {fmtN(r.fator_geracao,4)}× na ponta</div>
          </div>
          <div className="geracao-arrow">→</div>
          <div className="geracao-card geracao-card-warn">
            <div className="geracao-label">kWh extra (custo oport.)</div>
            <div className="geracao-value">{fmtK(r.kwh_extra)} kWh</div>
            <div className="geracao-sub">Fator ajuste TE: {fmtN(r.fator_ajuste,4)}</div>
          </div>
        </div>
      </Section>

      <footer className="footer">
        Fonte: ANEEL — PCAT 2025/2026 · Método tributos: CELPE (PIS/COFINS base s/ ICMS, ICMS por dentro) · REN 1.000/2021 Art. 655-G §5º
      </footer>
    </div>
  );

  // ── ABA FATURAMENTO USINA ────────────────────────────────────────────────────
  const tabUsina = (
    <div className="tab-content">

      <div className="kpi-grid">
        <KpiCard label="Receita Mensal" value={fmt(r.usina.receita_mensal)} icon={DollarSign} color="green" sub="consumo cliente × tarifa c/ desc"/>
        <KpiCard label="Custo Oportunidade" value={fmt(r.usina.custo_oport_mensal)} icon={TrendingDown} color="neutral" sub="kWh extra × tarifa FP desc"/>
        <KpiCard label="Resultado Líquido/mês" value={fmt(r.usina.resultado_liquido_mensal)} icon={BarChart3} color="accent"/>
        <KpiCard label="Resultado Líquido/ano" value={fmt(r.usina.resultado_liquido_anual)} icon={BarChart3} color="accent" sub="projeção 12 meses"/>
      </div>

      <div className="usina-full-grid">
        <Section title="Receita — Cliente A4">
          <div className="usina-bloco">
            <div className="usina-row"><span>Energia compensada (consumo real)</span><strong>{fmtK(consumoP+consumoFP)} kWh</strong></div>
            <div className="usina-row"><span>Tarifa c/ desconto COM tributos</span><strong>{fmtN(r.tar_desconto_c_trib,6)} R$/kWh</strong></div>
            <div className="usina-row usina-row-total"><span>Receita bruta mensal</span><strong>{fmt(r.usina.receita_mensal)}</strong></div>
            <div className="usina-row usina-row-total"><span>Receita bruta anual</span><strong>{fmt(r.usina.receita_anual)}</strong></div>
          </div>
        </Section>

        <Section title="Custo de Oportunidade — Ponta">
          <div className="usina-bloco" style={{borderColor:"rgba(245,166,35,0.2)"}}>
            <div className="usina-row"><span>kWh extra gerado (fator ajuste ponta)</span><strong>{fmtK(r.kwh_extra)} kWh</strong></div>
            <div className="usina-row"><span>Tarifa FP c/ desconto COM tributos</span><strong>{fmtN(r.usina.custo_oport_mensal / (r.kwh_extra||1), 6)} R$/kWh</strong></div>
            <div className="usina-row usina-row-total"><span>Custo oportunidade mensal</span><strong style={{color:"var(--warn)"}}>{fmt(r.usina.custo_oport_mensal)}</strong></div>
            <div className="usina-info"><Info size={12}/> Energia gerada de graça — deixa de vender para outro cliente</div>
          </div>
        </Section>

        <Section title="Resultado Líquido">
          <div className="usina-bloco" style={{borderColor:"rgba(34,197,94,0.2)"}}>
            <div className="usina-row"><span>Receita bruta</span><strong>{fmt(r.usina.receita_mensal)}</strong></div>
            <div className="usina-row"><span>(−) Custo de oportunidade</span><strong style={{color:"var(--warn)"}}>− {fmt(r.usina.custo_oport_mensal)}</strong></div>
            <div className="usina-row usina-row-total highlight"><span>Resultado líquido mensal</span><strong>{fmt(r.usina.resultado_liquido_mensal)}</strong></div>
            <div className="usina-row usina-row-total highlight"><span>Resultado líquido anual</span><strong>{fmt(r.usina.resultado_liquido_anual)}</strong></div>
          </div>
        </Section>
      </div>

      {/* Chart */}
      <Section title="Comparativo Visual — Mensal">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartUsinaData} layout="vertical" barSize={32}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false}/>
            <XAxis type="number" tick={{fontSize:10,fill:"var(--text-muted)"}} axisLine={false} tickLine={false} tickFormatter={v=>`R$${(v/1000).toFixed(0)}k`}/>
            <YAxis type="category" dataKey="name" tick={{fontSize:11,fill:"var(--text-muted)",fontFamily:"var(--font-mono)"}} axisLine={false} tickLine={false} width={120}/>
            <Tooltip formatter={v=>fmt(v)} contentStyle={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:8,fontSize:12}}/>
            <Bar dataKey="value" radius={[0,4,4,0]}>
              {chartUsinaData.map((e,i) => <Cell key={i} fill={e.fill}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Section>

      {/* Comparativo A4 vs B3 */}
      <Section title="Comparativo — A4 (com fator ponta) vs Grupo B3 (1:1)">
        <div className="comparativo-box">
          <div className="comparativo-grid">
            <div className="comparativo-col col-a4">
              <div className="comp-label">Cliente A4</div>
              <div className="comp-kwh">{fmtK(r.geracao_total)} kWh gerados</div>
              <div className="comp-receita">{fmt(r.usina.receita_mensal)}<span>/mês bruto</span></div>
              <div className="comp-liquido">{fmt(r.usina.resultado_liquido_mensal)}<span>/mês líquido</span></div>
            </div>
            <div className="comparativo-vs">VS</div>
            <div className="comparativo-col col-b3">
              <div className="comp-label">Cliente B3</div>
              <div className="comp-kwh">{fmtK(r.usina.geracao_b3)} kWh (sem fator)</div>
              <div className="comp-receita">{fmt(r.usina.receita_b3_mensal)}<span>/mês</span></div>
              <div className="comp-liquido comp-liquido-b3">{fmt(r.usina.receita_b3_mensal)}<span>/mês</span></div>
            </div>
          </div>
          <div className={`comparativo-dif ${r.usina.dif_a4_vs_b3 >= 0 ? "dif-pos" : "dif-neg"}`}>
            {r.usina.dif_a4_vs_b3 >= 0 ? "A4 rende " : "B3 rende "}
            <strong>{fmt(Math.abs(r.usina.dif_a4_vs_b3))}/mês</strong>
            {r.usina.dif_a4_vs_b3 >= 0 ? " a mais que B3" : " a mais que A4"}
          </div>
        </div>
      </Section>

      <footer className="footer">
        Fonte: ANEEL — PCAT 2025/2026 · Fator de ajuste: REN 1.000/2021 Art. 655-G §5º
      </footer>
    </div>
  );

  // ── RENDER ───────────────────────────────────────────────────────────────────
  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="header-brand">
            <div className="brand-icon"><Zap size={22}/></div>
            <div>
              <div className="brand-title">GD Dashboard</div>
              <div className="brand-sub">Simulador de Geração Distribuída</div>
            </div>
          </div>
          <div className="header-tabs">
            <button className={`tab-btn ${activeTab==="proposta"?"tab-active":""}`} onClick={() => setActiveTab("proposta")}>
              <FileText size={14}/> Proposta ao Cliente
            </button>
            <button className={`tab-btn ${activeTab==="usina"?"tab-active":""}`} onClick={() => setActiveTab("usina")}>
              <Factory size={14}/> Faturamento da Usina
            </button>
          </div>
          <div className="header-badges">
            <span className="badge">ANEEL 2026</span>
            <span className="badge badge-green">Método CELPE</span>
          </div>
        </div>
      </header>

      <div className="layout">
        {sidebar}
        <main className="main">
          {activeTab === "proposta" ? tabProposta : tabUsina}
        </main>
      </div>
    </div>
  );
}
