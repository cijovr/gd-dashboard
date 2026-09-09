import { useState, useMemo, useEffect } from "react";
import { useConcessionarias, fatorVigente } from "./data/tarifasStore";
import { calcular } from "./data/calcular";
import {
  Zap, ChevronDown, TrendingDown, TrendingUp, BarChart3,
  Building2, Gauge, DollarSign, Leaf, Info, User,
  FileText, Factory, ArrowRight, Sun, Moon, Edit3, RefreshCw, Settings,
  Save, FolderOpen, Printer, Trash2, Loader2, Pencil, X
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";
import ConfigPage, { applyColors } from "./ConfigPage";
import LOGO_MRE from "./logo.js";
import { useMarcaAtiva } from "./data/marcaStore";
import { usePropostas, propostaStore } from "./data/propostaStore";
import "./App.css";

const fmt  = (v) => (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtN = (v, d=2) => (v ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtP = (v) => ((v ?? 0) * 100).toFixed(1) + "%";
const fmtK = (v) => (v ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ── NumInput ──────────────────────────────────────────────────────────────────
function NumInput({ label, value, onChange, min=0, max=999999, unit="", fmtFn, readOnly }) {
  const [raw, setRaw] = useState(String(value));
  const [focused, setFocused] = useState(false);
  if (!focused && String(value) !== raw) setRaw(String(value));
  const commit = (str) => {
    const n = parseFloat(str.replace(",", "."));
    if (!isNaN(n)) { const c = Math.min(max, Math.max(min, n)); onChange?.(c); setRaw(String(c)); }
    else setRaw(String(value));
  };
  return (
    <div className="numinput-group">
      {label && <label className="numinput-label">{label}</label>}
      <div className="numinput-wrap">
        <input type="text" inputMode="decimal" className={`numinput ${readOnly ? "numinput-readonly" : ""}`}
          value={focused ? raw : (fmtFn ? fmtFn(value) : `${value}${unit}`)}
          readOnly={readOnly}
          onFocus={() => { if (!readOnly) { setFocused(true); setRaw(String(value)); } }}
          onBlur={() => { setFocused(false); if (!readOnly) commit(raw); }}
          onChange={e => { if (!readOnly) setRaw(e.target.value); }}
          onKeyDown={e => { if (e.key === "Enter") e.target.blur(); }} />
        {unit && <span className="numinput-unit">{unit}</span>}
      </div>
    </div>
  );
}

function TextInput({ label, value, onChange, placeholder }) {
  return (
    <div className="numinput-group">
      {label && <label className="numinput-label">{label}</label>}
      <div className="numinput-wrap">
        <input type="text" className="numinput" style={{textAlign:"left", color:"var(--text)"}}
          value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} />
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, color="accent", icon: Icon, delta }) {
  return (
    <div className={`kpi-card kpi-${color}`}>
      {Icon && <div className="kpi-icon"><Icon size={17}/></div>}
      <div className="kpi-body">
        <div className="kpi-value">{value}</div>
        <div className="kpi-label">{label}</div>
        {sub && <div className="kpi-sub">{sub}</div>}
      </div>
      {delta !== undefined && (
        <div className={`kpi-delta ${delta >= 0 ? "pos" : "neg"}`}>
          {delta >= 0 ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
          {Math.abs(delta * 100).toFixed(1)}%
        </div>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="section">
      <h2 className="section-title">{title}</h2>
      {children}
    </section>
  );
}

// ── Fatura detalhada ──────────────────────────────────────────────────────────
function FaturaDetalhada({ title, colorClass, rows, total, badge, badgeClass }) {
  return (
    <div className={`fatura-card ${colorClass}`}>
      <div className="fatura-card-header">
        <span className="fatura-card-title">{title}</span>
        {badge && <span className={`fatura-badge ${badgeClass}`}>{badge}</span>}
      </div>
      <table className="fatura-table">
        <thead className="fatura-table-head">
          <tr>
            <th style={{textAlign:"left"}}>Item</th>
            <th>Tarifa (R$/kWh ou kW)</th>
            <th>Volume</th>
            <th>Valor</th>
          </tr>
        </thead>
        <tbody>
          {rows.filter(r => r.valor > 0.01).map((r, i) => (
            <tr key={i} className="fatura-tr">
              <td>{r.label}</td>
              <td className="td-tar">{r.tarifa}</td>
              <td className="td-vol">{r.volume}</td>
              <td className="td-val">{fmt(r.valor)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="fatura-total-row">
            <td colSpan={3}>TOTAL (com tributos)</td>
            <td>{fmt(total)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function Header({ theme, setTheme, activeTab, switchTab, setSidebarOpen, logo, nomeMarca, alturaLogo }) {
  return (
      <header className="header">
      <div className="header-inner">
        <img src={logo || `data:image/png;base64,${LOGO_MRE}`} alt={nomeMarca || "MRE"} className="header-logo" style={{ height: `${alturaLogo || 22}px` }}/>
        <div className="header-divider"/>
        <div className="header-tabs">
          <button className={`tab-btn ${activeTab==="proposta"?"tab-active":""}`} onClick={() => switchTab("proposta")}><FileText size={13}/> Proposta ao Cliente</button>
          <button className={`tab-btn ${activeTab==="usina"?"tab-active":""}`} onClick={() => switchTab("usina")}><Factory size={13}/> Faturamento da Usina</button>
          <button className={`tab-btn ${activeTab==="propostas"?"tab-active":""}`} onClick={() => switchTab("propostas")}><FolderOpen size={13}/> Propostas Salvas</button>
        </div>
        <div className="header-right">
          <button className={`tab-btn ${activeTab==="config"?"tab-active":""}`} onClick={() => switchTab("config")}><Settings size={13}/> Configurações</button>
          <span className="badge">ANEEL 2026</span>
          <span className="badge badge-green">Método CELPE</span>
          <div className="theme-toggle">
            <button className={`theme-btn ${theme==="dark"?"active":""}`} onClick={() => setTheme("dark")} title="Escuro"><Moon size={13}/></button>
            <button className={`theme-btn ${theme==="light"?"active":""}`} onClick={() => setTheme("light")} title="Claro"><Sun size={13}/></button>
          </div>
        </div>
        {/* Hamburger — CSS esconde no desktop, mostra só no mobile */}
        <button className="hamburger" onClick={() => setSidebarOpen(o => !o)} aria-label="Menu">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="2" y1="4" x2="16" y2="4"/><line x1="2" y1="9" x2="16" y2="9"/><line x1="2" y1="14" x2="16" y2="14"/>
          </svg>
        </button>
      </div>
    </header>
  );
}


// ── LISTA DE PROPOSTAS SALVAS ────────────────────────────────────────────────
function PropostasSalvas({ onAbrir, onEditar, onPDF }) {
  const { itens, carregando, erro } = usePropostas();
  const dt = (iso) => new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

  if (carregando) return <div className="tab-content"><div className="prop-vazio"><Loader2 size={16} className="girando"/> Carregando propostas...</div></div>;

  return (
    <div className="tab-content">
      {erro && <div className="marca-erro-banner">{erro}</div>}
      {!itens.length && (
        <div className="prop-vazio">
          Nenhuma proposta salva ainda. Monte a simulação na aba Proposta ao Cliente e clique em Salvar proposta.
        </div>
      )}
      {itens.map((p) => (
        <div key={p.id} className="prop-item">
          <div className="prop-info">
            <div className="prop-cliente">{p.cliente}</div>
            <div className="prop-meta">
              <span>{dt(p.criado_em)}</span>
              {p.concessionaria && <span>{p.concessionaria}</span>}
              {p.dados?.desconto != null && <span>{p.dados.desconto}% desconto</span>}
            </div>
          </div>
          <div className="prop-economia">
            <span>economia/mês</span>
            <strong>{fmt(p.economia)}</strong>
          </div>
          <div className="prop-btns">
            <button className="tar-btn tar-btn-edit" onClick={() => onAbrir(p.dados)}><FolderOpen size={13}/> Abrir</button>
            <button className="tar-btn" title="Editar esta proposta" onClick={() => onEditar(p)}><Pencil size={13}/></button>
            <button className="tar-btn" onClick={() => onPDF(p.dados)}><Printer size={13}/> PDF</button>
            <button className="tar-btn prop-btn-excluir" onClick={() => { if (confirm(`Excluir a proposta de ${p.cliente}?`)) propostaStore.remover(p.id); }}>
              <Trash2 size={13}/>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [theme, setTheme]         = useState("dark");
  const [activeTab, setActiveTab] = useState("proposta");
  const [editTarifas, setEditTarifas] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [imprimindo, setImprimindo] = useState(false);
  const [salvando, setSalvando]     = useState(false);
  const [avisoSalvar, setAvisoSalvar] = useState("");
  const [editandoId, setEditandoId] = useState(null);
  const [editandoNome, setEditandoNome] = useState("");
  const [colors, setColors]       = useState({ accent: "#2ecc71", border: "#1a5c35", button: "#27ae60" });

  const marca = useMarcaAtiva();

  useEffect(() => { document.documentElement.setAttribute("data-theme", theme); }, [theme]);

  // Aplica a paleta da empresa ativa ao abrir o dashboard
  useEffect(() => {
    if (marca?.cores) { setColors(marca.cores); applyColors(marca.cores); }
  }, [marca?.id]);

  // Fecha sidebar ao trocar de aba no mobile
  const switchTab = (tab) => { setActiveTab(tab); setSidebarOpen(false); };

  // Cliente
  const [nomeCliente, setNomeCliente] = useState("");
  const [cpfCliente,  setCpfCliente]  = useState("");
  const [telCliente,  setTelCliente]  = useState("");
  const [endCliente,  setEndCliente]  = useState("");

  // Config
  const [concId,    setConcId]    = useState("celpe");
  const [grupo,     setGrupo]     = useState("A4");
  const [modal,     setModal]     = useState("VERDE");
  const [consumoP,  setConsumoP]  = useState(3800);
  const [consumoFP, setConsumoFP] = useState(23000);
  const [demP,      setDemP]      = useState(0);
  const [demFP,     setDemFP]     = useState(90);
  const [icms,      setIcms]      = useState(20.5);
  const [pis,       setPis]       = useState(1.0);
  const [cofins,    setCofins]    = useState(5.0);
  const [bandeira,  setBandeira]  = useState(0);
  const [tip,       setTip]       = useState(0);
  const [desconto,  setDesconto]  = useState(20);

  const CONCESSIONARIAS = useConcessionarias();
  const conc = useMemo(() => CONCESSIONARIAS.find(c => c.id === concId), [CONCESSIONARIAS, concId]);

  // Tarifas base da tabela (calculadas)
  const tarBase = useMemo(() => {
    if (!conc) return {};
    const t = grupo === "A4"
      ? (modal === "AZUL" ? conc.a4.azul : conc.a4.verde)
      : (conc.a3?.azul || conc.a4.azul);
    const tarDemP  = modal === "AZUL" ? (t.tusd_dem_p  || 0) : 0;
    const tarDemFP = modal === "AZUL" ? (t.tusd_dem_fp || 0) : (t.tusd_dem || 0);
    return {
      tusd_cons_p:  t.tusd_cons_p,
      tusd_cons_fp: t.tusd_cons_fp,
      te_p:         t.te_p,
      te_fp:        t.te_fp,
      tusd_dem_p:   tarDemP,
      tusd_dem_fp:  tarDemFP,
    };
  }, [conc, grupo, modal]);

  // Tarifas editáveis (inicialmente iguais às da tabela)
  const [editTar, setEditTar] = useState({});
  useEffect(() => { setEditTar({ ...tarBase }); }, [tarBase, concId, grupo, modal]);

  const tar = editTarifas ? editTar : tarBase;

  const r = useMemo(() => {
    if (!conc || !tar.te_p) return null;
    return calcular({
      grupo, modalidade: modal,
      consumo_p: consumoP, consumo_fp: consumoFP,
      dem_p: demP, dem_fp: demFP,
      tar_dem_p:  tar.tusd_dem_p  || 0,
      tar_dem_fp: tar.tusd_dem_fp || 0,
      tusd_cons_p:  tar.tusd_cons_p,
      tusd_cons_fp: tar.tusd_cons_fp,
      te_p:  tar.te_p,
      te_fp: tar.te_fp,
      icms: icms/100, pis: pis/100, cofins: cofins/100,
      bandeira, tip,
      disponibilidade_kwh: 0,
      desconto_gd: desconto/100,
      fator_geracao: fatorVigente(conc),
    }, conc);
  }, [conc, grupo, modal, consumoP, consumoFP, demP, demFP, tar,
      icms, pis, cofins, bandeira, tip, desconto]);


  // Concessionária ainda sem tarifa cadastrada: mostra aviso e leva para Configurações
  if (!r) return (
    <div className="app">
      <Header theme={theme} setTheme={setTheme} activeTab={activeTab} switchTab={switchTab} setSidebarOpen={setSidebarOpen} logo={marca?.logo_url} nomeMarca={marca?.nome} alturaLogo={marca?.logo_altura}/>
      <div className="layout">
        <main className="main">
          {activeTab === "config"
            ? <ConfigPage colors={colors} onChange={(c) => { setColors(c); applyColors(c); }}/>
            : (
              <div className="tab-content">
                <div className="sem-tarifa">
                  <h2>Tarifas não cadastradas</h2>
                  <p>
                    {conc ? conc.nome : "Esta concessionária"} ainda não tem tarifas digitadas.
                    Abra Configurações, gaveta Tarifas concessionárias, e preencha ao menos a TE
                    de ponta e de fora ponta do A4.
                  </p>
                  <button className="tar-btn tar-btn-edit" onClick={() => switchTab("config")}>
                    Ir para Configurações
                  </button>
                </div>
              </div>
            )}
        </main>
      </div>
    </div>
  );


  // ── Propostas salvas ────────────────────────────────────────────────────────
  const inputsAtuais = () => ({
    concId, grupo, modal, consumoP, consumoFP, demP, demFP,
    icms, pis, cofins, bandeira, tip, desconto,
    editTarifas, editTar,
    cliente: { nome: nomeCliente, cpf: cpfCliente, tel: telCliente, end: endCliente },
  });

  const aplicarInputs = (d) => {
    if (!d) return;
    setConcId(d.concId); setGrupo(d.grupo); setModal(d.modal);
    setConsumoP(d.consumoP); setConsumoFP(d.consumoFP);
    setDemP(d.demP); setDemFP(d.demFP);
    setIcms(d.icms); setPis(d.pis); setCofins(d.cofins);
    setBandeira(d.bandeira); setTip(d.tip); setDesconto(d.desconto);
    setEditTarifas(Boolean(d.editTarifas));
    if (d.editTar) setEditTar(d.editTar);
    setNomeCliente(d.cliente?.nome || ""); setCpfCliente(d.cliente?.cpf || "");
    setTelCliente(d.cliente?.tel || "");   setEndCliente(d.cliente?.end || "");
  };

  const salvarProposta = async (comoNova = false) => {
    setSalvando(true); setAvisoSalvar("");
    const carga = {
      cliente: nomeCliente,
      concessionaria: conc?.nome,
      economia: Math.round((r?.economia_total ?? 0) * 100) / 100,
      dados: inputsAtuais(),
    };
    const editar = editandoId && !comoNova;
    const res = editar
      ? await propostaStore.atualizar(editandoId, carga)
      : await propostaStore.salvar(carga);
    if (!editar && !res?.erro) { setEditandoId(null); setEditandoNome(""); }
    setSalvando(false);
    setAvisoSalvar(res?.erro ? `Não salvou: ${res.erro}` : editar ? "Proposta atualizada." : "Proposta salva.");
    setTimeout(() => setAvisoSalvar(""), 3500);
  };

  const sairDaEdicao = () => { setEditandoId(null); setEditandoNome(""); };

  const gerarPDF = () => {
    setImprimindo(true);
    setTimeout(() => { window.print(); setImprimindo(false); }, 600);
  };

  const mult = r.mult;

  // Rows fatura atual
  const rowsAtual = [
    { label:"TE Ponta",             tarifa: fmtN(tar.te_p,6),          volume: `${fmtK(consumoP)} kWh`,  valor: r.fa.te_p },
    { label:"TE Fora Ponta",        tarifa: fmtN(tar.te_fp,6),         volume: `${fmtK(consumoFP)} kWh`, valor: r.fa.te_fp },
    { label:"TUSD Cons. Ponta",     tarifa: fmtN(tar.tusd_cons_p,6),   volume: `${fmtK(consumoP)} kWh`,  valor: r.fa.tusd_p },
    { label:"TUSD Cons. FP",        tarifa: fmtN(tar.tusd_cons_fp,6),  volume: `${fmtK(consumoFP)} kWh`, valor: r.fa.tusd_fp },
    { label:"Demanda Ponta",        tarifa: fmtN(tar.tusd_dem_p * mult,2),  volume: `${demP} kW`,  valor: r.fa.dem_p },
    { label:"Demanda FP",           tarifa: fmtN(tar.tusd_dem_fp * mult,2), volume: `${demFP} kW`, valor: r.fa.dem_fp },
    { label:"Bandeira",             tarifa: fmtN(bandeira,4),          volume: `${fmtK(consumoP+consumoFP)} kWh`, valor: r.fa.bandeira },
    { label:"TIP",                  tarifa: "—",                       volume: "—",                      valor: r.fa.tip },
  ];

  // Rows fatura GD (itens de consumo × ratio, demanda igual)
  const ratio = r.tar_desconto / r.tar_media;
  const rowsGD = [
    { label:"TE Ponta",             tarifa: fmtN(tar.te_p*ratio,6),         volume: `${fmtK(consumoP)} kWh`,  valor: r.fg.te_p },
    { label:"TE Fora Ponta",        tarifa: fmtN(tar.te_fp*ratio,6),        volume: `${fmtK(consumoFP)} kWh`, valor: r.fg.te_fp },
    { label:"TUSD Cons. Ponta",     tarifa: fmtN(tar.tusd_cons_p*ratio,6),  volume: `${fmtK(consumoP)} kWh`,  valor: r.fg.tusd_p },
    { label:"TUSD Cons. FP",        tarifa: fmtN(tar.tusd_cons_fp*ratio,6), volume: `${fmtK(consumoFP)} kWh`, valor: r.fg.tusd_fp },
    { label:"Demanda Ponta",        tarifa: fmtN(tar.tusd_dem_p * mult,2),  volume: `${demP} kW`,  valor: r.fg.dem_p },
    { label:"Demanda FP",           tarifa: fmtN(tar.tusd_dem_fp * mult,2), volume: `${demFP} kW`, valor: r.fg.dem_fp },
    { label:"Bandeira",             tarifa: fmtN(bandeira,4),               volume: `${fmtK(consumoP+consumoFP)} kWh`, valor: r.fg.bandeira },
    { label:"TIP",                  tarifa: "—",                            volume: "—",                      valor: r.fg.tip },
  ];

  const pieTributos = [
    { name:"PIS",    value: r.tributos.pis,    fill:"#f59e0b" },
    { name:"COFINS", value: r.tributos.cofins, fill:"#ef4444" },
    { name:"ICMS",   value: r.tributos.icms,   fill:"#8b5cf6" },
    { name:"Base",   value: r.tributos.base,   fill: theme==="light"?"#1e8449":"#2ecc71" },
  ];

  const chartUsinaData = [
    { name:"Receita A4",    value: r.usina.receita_mensal,          fill: theme==="light"?"#1e8449":"#2ecc71" },
    { name:"Custo Oport.",  value: r.usina.custo_oport_mensal,       fill:"#ef4444" },
    { name:"Líquido A4",    value: r.usina.resultado_liquido_mensal, fill:"#3b82f6" },
    { name:"Receita B3",    value: r.usina.receita_b3_mensal,        fill:"#f59e0b" },
  ];

  // ── SIDEBAR CONTENT ──────────────────────────────────────────────────────────
  const sidebarContent = (
    <div className="sidebar-scroll">
        <div className="sb-section-title"><User size={11}/> Dados do Cliente</div>
        <TextInput label="Nome" value={nomeCliente} onChange={setNomeCliente} placeholder="Nome completo"/>
        <div className="row-2">
          <TextInput label="CPF / CNPJ" value={cpfCliente} onChange={setCpfCliente} placeholder="000.000.000-00"/>
          <TextInput label="Telefone" value={telCliente} onChange={setTelCliente} placeholder="(81) 99999-9999"/>
        </div>
        <TextInput label="Endereço" value={endCliente} onChange={setEndCliente} placeholder="Rua, número, cidade"/>
        <div className="divider"/>
        <div className="sb-section-title"><Building2 size={11}/> Concessionária</div>
        <div className="select-wrap">
          <select value={concId} onChange={e => setConcId(e.target.value)} className="select">
            {CONCESSIONARIAS.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
          <ChevronDown size={13} className="select-icon"/>
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
        <div className="sb-section-title"><Gauge size={11}/> Consumo & Demanda</div>
        <NumInput label="Consumo Ponta (kWh)" value={consumoP} onChange={setConsumoP} unit=" kWh"/>
        <NumInput label="Consumo Fora Ponta (kWh)" value={consumoFP} onChange={setConsumoFP} unit=" kWh"/>
        <div className="row-2">
          <NumInput label="Demanda FP (kW)" value={demFP} onChange={setDemFP} unit=" kW"/>
          <NumInput label="Demanda Ponta (kW)" value={demP} onChange={setDemP} unit=" kW"/>
        </div>
        <div className="divider"/>
        <div className="sb-section-title"><Gauge size={11}/> Tributos</div>
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
        <div className="desconto-box">
          <div className="sb-section-title" style={{marginBottom:6}}><Leaf size={11}/> Desconto GD</div>
          <NumInput label="Desconto ao cliente (%)" value={desconto} onChange={setDesconto} fmtFn={v=>`${v}%`}/>
          <div className="desconto-info">Tarifa final: <strong>{fmtN(r.tar_desconto_c_trib,6)} R$/kWh</strong></div>
        </div>
    </div>
  );

  // ── Bloco editar tarifas ──────────────────────────────────────────────────────
  const editTarifasBlock = (
    <div className="tarifas-bar" style={{flexDirection:"column", alignItems:"flex-start", gap:12}}>
      <div style={{display:"flex", justifyContent:"space-between", width:"100%", alignItems:"center"}}>
        <span className="tarifas-bar-title">Tarifas ANEEL — {conc?.nome}</span>
        <div className="tarifas-bar-btns">
          {!editTarifas
            ? <button className="tar-btn tar-btn-edit" onClick={() => setEditTarifas(true)}>
                <Edit3 size={12}/> Editar Tarifas
              </button>
            : <button className="tar-btn tar-btn-aneel" onClick={() => { setEditTarifas(false); setEditTar({...tarBase}); }}>
                <RefreshCw size={12}/> Usar Tarifas ANEEL
              </button>
          }
        </div>
      </div>
      {editTarifas ? (
        <div className="tarifas-edit-grid">
          {[
            ["TUSD Cons. Ponta (R$/kWh)", "tusd_cons_p"],
            ["TUSD Cons. FP (R$/kWh)",    "tusd_cons_fp"],
            ["TE Ponta (R$/kWh)",          "te_p"],
            ["TE FP (R$/kWh)",             "te_fp"],
            ["TUSD Dem. Ponta (R$/kW)",    "tusd_dem_p"],
            ["TUSD Dem. FP (R$/kW)",       "tusd_dem_fp"],
          ].map(([label, key]) => (
            <div key={key} className="tar-edit-item">
              <span className="tar-edit-label">{label}</span>
              <input className="tar-edit-input" type="text" value={editTar[key] ?? ""}
                onChange={e => setEditTar(prev => ({...prev, [key]: parseFloat(e.target.value.replace(",",".")) || prev[key]}))}/>
            </div>
          ))}
        </div>
      ) : (
        <div className="tarifas-ref" style={{width:"100%"}}>
          {[
            ["TUSD Cons. P", fmtN(tar.tusd_cons_p,6)],
            ["TUSD Cons. FP",fmtN(tar.tusd_cons_fp,6)],
            ["TE Ponta",      fmtN(tar.te_p,6)],
            ["TE FP",         fmtN(tar.te_fp,6)],
            ["Dem. Ponta",    fmtN(tar.tusd_dem_p,2)+" R$/kW"],
            ["Dem. FP",       fmtN(tar.tusd_dem_fp,2)+" R$/kW"],
            ["Total P s/trib",fmtN(r.tar_total_p,6)],
            ["Total FP s/trib",fmtN(r.tar_total_fp,6)],
            ["Total P c/trib", fmtN(r.tar_total_p_trib,6)],
            ["Total FP c/trib",fmtN(r.tar_total_fp_trib,6)],
          ].map(([k,v],i) => (
            <div key={i} className="tar-item"><span>{k}</span><strong>{v}</strong></div>
          ))}
        </div>
      )}
    </div>
  );

  // ── ABA PROPOSTA ──────────────────────────────────────────────────────────────
  const tabProposta = (
    <div className="tab-content">
      {(nomeCliente||cpfCliente) && (
        <div className="proposta-header">
          <div className="proposta-cliente">
            <div className="proposta-cliente-icon"><User size={16}/></div>
            <div>
              <div className="proposta-cliente-nome">{nomeCliente||"—"}</div>
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

      {editandoId && (
        <div className="edicao-tarja no-print">
          <Pencil size={13}/>
          <span>Editando a proposta salva de <strong>{editandoNome}</strong>. Salvar alterações grava por cima.</span>
          <button className="tar-btn" onClick={sairDaEdicao}><X size={13}/> Sair da edição</button>
        </div>
      )}

      {editTarifasBlock}

      <div className="kpi-grid">
        <KpiCard label="Fatura Atual" value={fmt(r.fa.total)} icon={DollarSign} color="neutral" sub={`${fmtK(consumoP+consumoFP)} kWh totais`}/>
        <KpiCard label="Fatura com GD" value={fmt(r.fg.total)} icon={Leaf} color="green"/>
        <KpiCard label="Economia Mensal" value={fmt(r.economia_total)} icon={TrendingDown} color="accent" delta={-r.pct_economia}/>
        <KpiCard label="Economia Anual" value={fmt(r.economia_total*12)} icon={BarChart3} color="accent" sub="12 meses"/>
      </div>

      {/* Faturas lado a lado */}
      <div className="faturas-comparativo">
        <FaturaDetalhada title="Fatura Atual" colorClass="fatura-atual-card"
          rows={rowsAtual} total={r.fa.total} badge="Sem GD" badgeClass="badge-neutro"/>
        <div className="faturas-seta">
          <ArrowRight size={28} className="seta-arrow"/>
        </div>
        <FaturaDetalhada title="Fatura com GD" colorClass="fatura-gd-card"
          rows={rowsGD} total={r.fg.total} badge={`${desconto}% desconto`} badgeClass="badge-green"/>
      </div>

      {/* Economia abaixo do comparativo */}
      <div className="economia-destaque">
        <div className="economia-pct">{fmtP(r.pct_economia)}</div>
        <div className="economia-mid">
          <div className="economia-label">de economia na fatura do cliente</div>
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

      <div className="charts-row" style={{gridTemplateColumns:"1fr"}}>
        <Section title="Geração Necessária">
          <div className="geracao-grid">
            <div className="geracao-card">
              <div className="geracao-label">Consumo real</div>
              <div className="geracao-value">{fmtK(consumoP+consumoFP)} kWh</div>
            </div>
            <div className="geracao-arrow">→</div>
            <div className="geracao-card geracao-card-accent">
              <div className="geracao-label">Geração necessária</div>
              <div className="geracao-value">{fmtK(r.geracao_total)} kWh</div>
              <div className="geracao-sub">Fator {fmtN(r.fator_geracao,4)}× ponta</div>
            </div>
            <div className="geracao-arrow">→</div>
            <div className="geracao-card geracao-card-warn">
              <div className="geracao-label">kWh extra</div>
              <div className="geracao-value">{fmtK(r.kwh_extra)} kWh</div>
              <div className="geracao-sub">Custo oportunidade</div>
            </div>
          </div>
        </Section>
      </div>

      <div className="proposta-acoes no-print">
        <button className="tar-btn tar-btn-edit" onClick={() => salvarProposta(false)} disabled={salvando}>
          {salvando ? <><Loader2 size={13} className="girando"/> Salvando...</>
            : editandoId ? <><Save size={13}/> Salvar alterações</> : <><Save size={13}/> Salvar proposta</>}
        </button>
        {editandoId && (
          <button className="tar-btn" onClick={() => salvarProposta(true)} disabled={salvando}>
            <Save size={13}/> Salvar como nova
          </button>
        )}
        <button className="tar-btn" onClick={gerarPDF}><Printer size={13}/> Gerar PDF</button>
        {avisoSalvar && <span className="proposta-aviso">{avisoSalvar}</span>}
      </div>

      <footer className="footer">
        MRE — M. Reinaux Energia · Fonte: ANEEL PCAT 2025/2026 · Método tributos: PIS/COFINS base s/ ICMS, ICMS por dentro · REN 1.000/2021 Art. 655-G §5º
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
            <div className="usina-row"><span>Energia compensada</span><strong>{fmtK(consumoP+consumoFP)} kWh</strong></div>
            <div className="usina-row"><span>Tarifa c/ desc COM tributos</span><strong>{fmtN(r.tar_desconto_c_trib,6)} R$/kWh</strong></div>
            <div className="usina-row usina-row-total"><span>Receita bruta mensal</span><strong>{fmt(r.usina.receita_mensal)}</strong></div>
            <div className="usina-row usina-row-total"><span>Receita bruta anual</span><strong>{fmt(r.usina.receita_anual)}</strong></div>
          </div>
        </Section>
        <Section title="Custo de Oportunidade">
          <div className="usina-bloco" style={{borderColor:"rgba(245,166,35,0.3)"}}>
            <div className="usina-row"><span>kWh extra (fator ajuste ponta)</span><strong>{fmtK(r.kwh_extra)} kWh</strong></div>
            <div className="usina-row"><span>Tarifa FP c/ desc COM tributos</span><strong>{fmtN(r.usina.custo_oport_mensal/(r.kwh_extra||1),6)} R$/kWh</strong></div>
            <div className="usina-row usina-row-total"><span>Custo mensal</span><strong style={{color:"var(--warn)"}}>{fmt(r.usina.custo_oport_mensal)}</strong></div>
            <div className="usina-info"><Info size={11}/> Energia gerada de graça — deixa de vender</div>
          </div>
        </Section>
        <Section title="Resultado Líquido">
          <div className="usina-bloco" style={{borderColor:"var(--accent-dark)"}}>
            <div className="usina-row"><span>Receita bruta</span><strong>{fmt(r.usina.receita_mensal)}</strong></div>
            <div className="usina-row"><span>(−) Custo oportunidade</span><strong style={{color:"var(--warn)"}}>− {fmt(r.usina.custo_oport_mensal)}</strong></div>
            <div className="usina-row usina-row-total highlight"><span>Líquido mensal</span><strong>{fmt(r.usina.resultado_liquido_mensal)}</strong></div>
            <div className="usina-row usina-row-total highlight"><span>Líquido anual</span><strong>{fmt(r.usina.resultado_liquido_anual)}</strong></div>
          </div>
        </Section>
      </div>

      <Section title="Comparativo Visual — Mensal">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartUsinaData} layout="vertical" barSize={30}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false}/>
            <XAxis type="number" tick={{fontSize:10,fill:"var(--text-muted)",fontFamily:"Montserrat"}} axisLine={false} tickLine={false} tickFormatter={v=>`R$${(v/1000).toFixed(0)}k`}/>
            <YAxis type="category" dataKey="name" tick={{fontSize:11,fill:"var(--text-muted)",fontFamily:"Montserrat"}} axisLine={false} tickLine={false} width={110}/>
            <Tooltip formatter={v=>fmt(v)} contentStyle={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:8,fontSize:11,fontFamily:"Montserrat"}}/>
            <Bar dataKey="value" radius={[0,4,4,0]}>
              {chartUsinaData.map((e,i) => <Cell key={i} fill={e.fill}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Section>

      <Section title="A4 (com fator ponta) vs Grupo B3 (1:1)">
        <div className="comparativo-box" style={{border:"none",padding:0}}>
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
          <div className={`comparativo-dif ${r.usina.dif_a4_vs_b3>=0?"dif-pos":"dif-neg"}`}>
            {r.usina.dif_a4_vs_b3>=0?"A4 rende ":"B3 rende "}
            <strong>{fmt(Math.abs(r.usina.dif_a4_vs_b3))}/mês</strong>
            {r.usina.dif_a4_vs_b3>=0?" a mais que B3":" a mais que A4"}
          </div>
        </div>
      </Section>

      <footer className="footer">
        MRE — M. Reinaux Energia · Fator de ajuste: REN 1.000/2021 Art. 655-G §5º
      </footer>
    </div>
  );

  return (
    <div className="app">
      <Header theme={theme} setTheme={setTheme} activeTab={activeTab} switchTab={switchTab} setSidebarOpen={setSidebarOpen} logo={marca?.logo_url} nomeMarca={marca?.nome} alturaLogo={marca?.logo_altura}/>

      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}/>}

      <div className="layout">
        <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
          {sidebarContent}
        </aside>
        <main className="main">
          {imprimindo ? (
            <div className="print-area">{tabProposta}{tabUsina}</div>
          ) : activeTab==="proposta" ? tabProposta
            : activeTab==="usina" ? tabUsina
            : activeTab==="propostas" ? (
                <PropostasSalvas
                  onAbrir={(d) => { sairDaEdicao(); aplicarInputs(d); switchTab("proposta"); }}
                  onEditar={(p) => { aplicarInputs(p.dados); setEditandoId(p.id); setEditandoNome(p.cliente); switchTab("proposta"); }}
                  onPDF={(d) => { aplicarInputs(d); gerarPDF(); }}/>
              )
            : <ConfigPage colors={colors} onChange={(c) => { setColors(c); applyColors(c); }}/>}
        </main>
      </div>

      <nav className="bottom-nav">
        <div className="bottom-nav-inner">
          <button className={`bottom-nav-btn ${activeTab==="proposta"?"active":""}`} onClick={() => switchTab("proposta")}>
            <span className="bnav-icon"><FileText size={20}/></span>Proposta
          </button>
          <button className={`bottom-nav-btn ${activeTab==="usina"?"active":""}`} onClick={() => switchTab("usina")}>
            <span className="bnav-icon"><Factory size={20}/></span>Usina
          </button>
          <button className={`bottom-nav-btn ${activeTab==="propostas"?"active":""}`} onClick={() => switchTab("propostas")}>
            <span className="bnav-icon"><FolderOpen size={20}/></span>Salvas
          </button>
          <button className={`bottom-nav-btn ${sidebarOpen?"active":""}`} onClick={() => setSidebarOpen(o => !o)}>
            <span className="bnav-icon"><Gauge size={20}/></span>Dados
          </button>
          <button className={`bottom-nav-btn ${activeTab==="config"?"active":""}`} onClick={() => switchTab("config")}>
            <span className="bnav-icon"><Settings size={20}/></span>Config
          </button>
          <button className="bottom-nav-btn" onClick={() => setTheme(t => t==="dark"?"light":"dark")}>
            <span className="bnav-icon">{theme==="dark" ? <Sun size={20}/> : <Moon size={20}/>}</span>Tema
          </button>
        </div>
      </nav>
    </div>
  );
}
