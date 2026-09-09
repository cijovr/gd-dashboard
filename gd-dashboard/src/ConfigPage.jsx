import { useState } from "react";
import { RotateCcw, Check, ChevronDown, Palette, Zap } from "lucide-react";
import TarifasPage from "./TarifasPage";

// Presets de cor
const PRESETS = [
  { name: "MRE Verde",    accent: "#2ecc71", border: "#1a5c35", button: "#27ae60" },
  { name: "Azul Energia", accent: "#3b82f6", border: "#1e3a5f", button: "#2563eb" },
  { name: "Laranja GD",   accent: "#f59e0b", border: "#78350f", button: "#d97706" },
  { name: "Roxo Premium", accent: "#8b5cf6", border: "#4c1d95", button: "#7c3aed" },
  { name: "Ciano Tech",   accent: "#06b6d4", border: "#164e63", button: "#0891b2" },
];

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `${r}, ${g}, ${b}`;
}

function darken(hex, pct=0.4) {
  let r = parseInt(hex.slice(1,3),16);
  let g = parseInt(hex.slice(3,5),16);
  let b = parseInt(hex.slice(5,7),16);
  r = Math.round(r * (1-pct)); g = Math.round(g * (1-pct)); b = Math.round(b * (1-pct));
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

export function applyColors(colors) {
  const root = document.documentElement;
  const { accent, border, button } = colors;
  // Accent (cor principal)
  root.style.setProperty("--accent",      accent);
  root.style.setProperty("--accent2",     darken(accent, 0.1));
  root.style.setProperty("--accent-dark", darken(accent, 0.45));
  root.style.setProperty("--accent-dim",  `rgba(${hexToRgb(accent)}, 0.08)`);
  root.style.setProperty("--accent-glow", `rgba(${hexToRgb(accent)}, 0.12)`);
  root.style.setProperty("--green",       accent);
  root.style.setProperty("--green-dim",   `rgba(${hexToRgb(accent)}, 0.1)`);
  // Border
  root.style.setProperty("--border",      border);
  root.style.setProperty("--border2",     darken(border, -0.2).replace(/^#/, '') === border.replace(/^#/,'') ? lighten(border) : lighten(border));
  // Button
  root.style.setProperty("--btn-color",   button);
}

function lighten(hex, pct=0.4) {
  let r = parseInt(hex.slice(1,3),16);
  let g = parseInt(hex.slice(3,5),16);
  let b = parseInt(hex.slice(5,7),16);
  r = Math.min(255, Math.round(r + (255-r)*pct));
  g = Math.min(255, Math.round(g + (255-g)*pct));
  b = Math.min(255, Math.round(b + (255-b)*pct));
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

function ColorSwatch({ label, value, onChange }) {
  return (
    <div className="cfg-swatch-group">
      <label className="cfg-label">{label}</label>
      <div className="cfg-swatch-row">
        <div className="cfg-color-preview" style={{background: value}}/>
        <input type="color" className="cfg-color-picker" value={value}
          onChange={e => onChange(e.target.value)}/>
        <input type="text" className="cfg-hex-input" value={value}
          onChange={e => { if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) onChange(e.target.value); }}/>
      </div>
      <div className="cfg-rgb-val">RGB: {hexToRgb(value)}</div>
    </div>
  );
}

function Gaveta({ id, titulo, descricao, icone: Icone, aberta, onToggle, children }) {
  return (
    <section className={`gaveta ${aberta ? "gaveta-aberta" : ""}`}>
      <button className="gaveta-head" onClick={onToggle} aria-expanded={aberta} aria-controls={id}>
        <span className="gaveta-icone"><Icone size={15}/></span>
        <span className="gaveta-textos">
          <span className="gaveta-titulo">{titulo}</span>
          <span className="gaveta-desc">{descricao}</span>
        </span>
        <ChevronDown size={17} className="gaveta-chevron"/>
      </button>
      {aberta && <div className="gaveta-body" id={id}>{children}</div>}
    </section>
  );
}

export default function ConfigPage({ colors, onChange }) {
  const [gaveta, setGaveta] = useState("tarifas");
  const alterna = (id) => setGaveta(g => g === id ? null : id);
  return (
    <div className="tab-content">
      <Gaveta id="gaveta-layout" titulo="Layout do dashboard"
        descricao="Cores, presets e identidade visual" icone={Palette}
        aberta={gaveta === "layout"} onToggle={() => alterna("layout")}>
        <PainelCores colors={colors} onChange={onChange}/>
      </Gaveta>
      <Gaveta id="gaveta-tarifas" titulo="Tarifas concessionárias"
        descricao="Tarifas digitadas que alimentam a proposta e o faturamento" icone={Zap}
        aberta={gaveta === "tarifas"} onToggle={() => alterna("tarifas")}>
        <TarifasPage/>
      </Gaveta>
    </div>
  );
}

function PainelCores({ colors, onChange }) {
  const [saved, setSaved] = useState(false);

  const handleApply = () => {
    applyColors(colors);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePreset = (preset) => {
    const next = { accent: preset.accent, border: preset.border, button: preset.button };
    onChange(next);
    applyColors(next);
  };

  const handleReset = () => {
    const def = { accent: "#2ecc71", border: "#1a5c35", button: "#27ae60" };
    onChange(def);
    applyColors(def);
  };

  return (
    <div className="cfg-inner">
      <div className="cfg-section">
        <div className="section-title">Presets de Cor</div>
        <div className="cfg-presets">
          {PRESETS.map(p => (
            <button key={p.name} className="cfg-preset-btn" onClick={() => handlePreset(p)}
              style={{"--p-accent": p.accent, "--p-border": p.border}}>
              <div className="cfg-preset-dot" style={{background: p.accent}}/>
              <span>{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="cfg-section">
        <div className="section-title">Personalizar Cores</div>
        <div className="cfg-pickers">
          <ColorSwatch label="Cor Principal (accent)" value={colors.accent}
            onChange={v => onChange({...colors, accent: v})}/>
          <ColorSwatch label="Traços e Bordas" value={colors.border}
            onChange={v => onChange({...colors, border: v})}/>
          <ColorSwatch label="Botões" value={colors.button}
            onChange={v => onChange({...colors, button: v})}/>
        </div>
      </div>

      <div className="cfg-section">
        <div className="section-title">Preview</div>
        <div className="cfg-preview-box">
          <div className="cfg-prev-bar" style={{background: colors.accent}}/>
          <div className="cfg-prev-card">
            <div className="cfg-prev-badge" style={{background: `rgba(${hexToRgb(colors.accent)},0.12)`, color: colors.accent, border: `1px solid ${colors.accent}`}}>Tarifa com GD</div>
            <div className="cfg-prev-value" style={{color: colors.accent}}>R$ 18.712,55</div>
            <div className="cfg-prev-label">Fatura com GD — 20% desconto</div>
          </div>
          <div className="cfg-prev-border-sample" style={{border: `2px solid ${colors.border}`}}>
            <span style={{color: colors.border, fontSize:"0.7rem", fontWeight:700}}>Bordas & Traços</span>
          </div>
          <button className="cfg-prev-button" style={{background: colors.button, color:"#fff"}}>
            Botão Primário
          </button>
        </div>
      </div>

      <div className="cfg-actions">
        <button className="tar-btn" onClick={handleReset}>
          <RotateCcw size={13}/> Restaurar Padrão
        </button>
        <button className={`tar-btn ${saved ? "tar-btn-aneel" : "tar-btn-edit"}`} onClick={handleApply}
          style={saved ? {} : {borderColor: colors.button, color: colors.button, background:`rgba(${hexToRgb(colors.button)},0.08)`}}>
          {saved ? <><Check size={13}/> Aplicado!</> : <><Check size={13}/> Aplicar Cores</>}
        </button>
      </div>
    </div>
  );
}
