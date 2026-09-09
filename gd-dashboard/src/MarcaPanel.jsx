import { useRef, useState } from "react";
import { Upload, Trash2, Check, Plus, Wand2, Building2, Loader2, CloudOff } from "lucide-react";
import {
  useMarcaEstado, marcaStore, prepararLogo, extrairPaleta, temaDaCor,
} from "./data/marcaStore";
import { applyColors } from "./ConfigPage";

export default function MarcaPanel({ onCores }) {
  const { marcas, ativa: idAtiva, carregando, erro } = useMarcaEstado();
  const lista = Object.values(marcas);
  const ativa = marcas[idAtiva] ?? lista[0];

  const [paleta, setPaleta] = useState([]);
  const [ultimaLogo, setUltimaLogo] = useState(null); // dataUrl local, para reextrair sem CORS
  const [aviso, setAviso] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [novaEmpresa, setNovaEmpresa] = useState("");
  const inputRef = useRef(null);

  const aplicarTema = (cor, id = ativa?.id) => {
    if (!id) return;
    const tema = temaDaCor(cor);
    marcaStore.definirCores(id, tema);
    applyColors(tema);
    onCores?.(tema);
  };

  const receberArquivo = async (file) => {
    if (!file || !ativa) return;
    if (!file.type.startsWith("image/")) { setAviso("Selecione um arquivo de imagem."); return; }
    setAviso(""); setEnviando(true);
    try {
      const dataUrl = await prepararLogo(file);
      setUltimaLogo(dataUrl);
      const cores = await extrairPaleta(dataUrl);
      setPaleta(cores);
      await marcaStore.enviarLogo(ativa.id, dataUrl);
      if (cores.length) aplicarTema(cores[0], ativa.id);
      else setAviso("Não identifiquei cores nessa logo. Escolha a cor manualmente abaixo.");
    } catch {
      setAviso("Não foi possível ler essa imagem. Tente PNG ou JPG.");
    } finally {
      setEnviando(false);
    }
  };

  const trocarEmpresa = (id) => {
    marcaStore.ativar(id);
    setPaleta([]); setUltimaLogo(null); setAviso("");
    const m = marcas[id];
    if (m?.cores) { applyColors(m.cores); onCores?.(m.cores); }
  };

  const criarEmpresa = async () => {
    if (!novaEmpresa.trim()) return;
    await marcaStore.criar(novaEmpresa);
    setNovaEmpresa(""); setPaleta([]); setUltimaLogo(null);
  };

  const buscarMaisCores = async () => {
    const origem = ultimaLogo || ativa?.logo_url;
    if (!origem) return;
    try { setPaleta(await extrairPaleta(origem, 8)); }
    catch { setAviso("Para buscar mais cores, envie a logo novamente."); }
  };

  if (carregando) {
    return <div className="marca-carregando"><Loader2 size={16} className="girando"/> Carregando empresas...</div>;
  }

  return (
    <div className="marca">
      {erro && <div className="marca-erro-banner"><CloudOff size={14}/> {erro}</div>}

      <div className="cfg-section">
        <div className="section-title">Empresa</div>
        <div className="marca-lista">
          {lista.map((m) => (
            <button key={m.id} className={`marca-chip ${m.id === ativa?.id ? "marca-chip-ativa" : ""}`}
              onClick={() => trocarEmpresa(m.id)}>
              {m.logo_url
                ? <img src={m.logo_url} alt="" className="marca-chip-logo"/>
                : <span className="marca-chip-icone"><Building2 size={13}/></span>}
              <span>{m.nome}</span>
              {m.id === ativa?.id && <Check size={13}/>}
            </button>
          ))}
        </div>
        <div className="marca-nova">
          <input placeholder="Nome da empresa" value={novaEmpresa}
            onChange={(e) => setNovaEmpresa(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && criarEmpresa()}/>
          <button className="tar-btn tar-btn-edit" onClick={criarEmpresa}><Plus size={13}/> Adicionar empresa</button>
          {lista.length > 1 && (
            <button className="tar-btn marca-btn-remover"
              onClick={() => { if (confirm(`Remover ${ativa.nome} e a logo dela?`)) marcaStore.remover(ativa.id); }}>
              <Trash2 size={13}/> Remover {ativa?.nome}
            </button>
          )}
        </div>
      </div>

      <div className="cfg-section">
        <div className="section-title">Logo de {ativa?.nome}</div>
        <div className="marca-upload"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); receberArquivo(e.dataTransfer.files?.[0]); }}>
          <div className="marca-preview">
            {ativa?.logo_url
              ? <img src={ativa.logo_url} alt={ativa.nome}/>
              : <span className="marca-preview-vazio">Sem logo</span>}
          </div>
          <div className="marca-upload-txt">
            <p>Arraste a logo aqui ou escolha um arquivo. PNG com fundo transparente fica melhor no cabeçalho. A logo é salva na nuvem e aparece em qualquer computador.</p>
            <div className="marca-upload-btns">
              <button className="tar-btn tar-btn-edit" onClick={() => inputRef.current?.click()} disabled={enviando}>
                <Upload size={13}/> {enviando ? "Enviando..." : ativa?.logo_url ? "Trocar logo" : "Enviar logo"}
              </button>
              {ativa?.logo_url && (
                <button className="tar-btn" onClick={() => { marcaStore.removerLogo(ativa.id); setPaleta([]); setUltimaLogo(null); }}>
                  Remover logo
                </button>
              )}
            </div>
            {aviso && <div className="marca-erro">{aviso}</div>}
          </div>
          <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }}
            onChange={(e) => { receberArquivo(e.target.files?.[0]); e.target.value = ""; }}/>
        </div>
      </div>

      {paleta.length > 0 && (
        <div className="cfg-section">
          <div className="section-title">Cores encontradas na logo</div>
          <div className="marca-paleta">
            {paleta.map((cor) => (
              <button key={cor} className={`marca-swatch ${cor === ativa?.cores?.accent ? "marca-swatch-ativo" : ""}`}
                onClick={() => aplicarTema(cor)} title={`Usar ${cor}`}>
                <span className="marca-swatch-cor" style={{ background: cor }}/>
                <span className="marca-swatch-hex">{cor}</span>
              </button>
            ))}
            <button className="tar-btn tar-btn-edit marca-reextrair" onClick={buscarMaisCores}>
              <Wand2 size={13}/> Buscar mais cores
            </button>
          </div>
          <p className="marca-dica">
            A primeira cor já foi aplicada. Clique em outra para trocar a cor principal, e ajuste
            bordas e botões nos campos abaixo se quiser refinar.
          </p>
        </div>
      )}
    </div>
  );
}
