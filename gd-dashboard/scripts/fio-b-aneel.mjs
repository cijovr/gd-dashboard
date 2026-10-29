// Lê os arquivos da ANEEL (Componentes Tarifárias, Tarifa de Aplicação) e grava o Fio B
// (TUSD_FioB) de cada distribuidora em src/data/fioB.js.
// Baixe componentes-tarifarias-2025.parquet e -2026.parquet em
// https://dadosabertos.aneel.gov.br/dataset/componentes-tarifarias e rode:
//   node scripts/fio-b-aneel.mjs <pasta dos arquivos>
import { writeFileSync, existsSync } from "node:fs";
import { asyncBufferFromFile, parquetReadObjects } from "hyparquet";
import { compressors } from "hyparquet-compressors";

const pasta = process.argv[2];
if (!pasta) throw new Error("Informe a pasta com os arquivos .parquet da ANEEL");

// id da tabela de tarifas → nome do agente na ANEEL
const AGENTES = {
  eletroacre: "EAC",           equatorial_al: "EQUATORIAL AL", ame: "Âmbar Amazonas",
  cea: "CEA",                  coelba: "COELBA",               enel_ce: "ENEL CE",
  neoenergia_df: "Neoenergia Brasília", equatorial_go: "EQUATORIAL GO", equatorial_ma: "EQUATORIAL MA",
  cemig: "CEMIG-D",            energisa_mt: "EMT",             equatorial_pa: "EQUATORIAL PA",
  energisa_pb: "EPB",          neoenergia_pe: "Neoenergia PE", equatorial_pi: "EQUATORIAL PI",
  copel_pr: "COPEL-DIS",       enel_rj: "ENEL RJ",             light_rj: "LIGHT SESA",
  cosern: "COSERN",            ceron: "ERO",                   boa_vista: "Âmbar Roraima",
  ceee_rs: "CEEE-D",           celesc: "CELESC",               energisa_s_se: "ESS",
  energisa_se: "ESE",          sulgipe: "SULGIPE",             cpfl_paulista: "CPFL-PAULISTA",
  edp_sp: "EDP SP",            elektro: "ELEKTRO",             enel_sp: "ELETROPAULO",
  energisa_to: "ETO",
};

const data = (d) => (d instanceof Date ? d.toISOString() : String(d)).slice(0, 10);

const linhas = [];
for (const ano of [2025, 2026]) {
  const caminho = `${pasta}/componentes-tarifarias-${ano}.parquet`;
  if (!existsSync(caminho)) throw new Error(`Falta ${caminho}`);
  const objs = await parquetReadObjects({ file: await asyncBufferFromFile(caminho), compressors });
  for (const o of objs) {
    if (o.DscComponenteTarifario !== "TUSD_FioB" || o.DscBaseTarifaria !== "Tarifa de Aplicação") continue;
    if (o.DscDetalheConsumidor !== "Não se aplica" || o.SigNomeAgenteAcessante !== "Não se aplica") continue;
    linhas.push({
      ag: o.SigNomeAgente, res: o.DscResolucaoHomologatoria,
      ini: data(o.DatInicioVigencia), fim: data(o.DatFimVigencia),
      sub: o.DscSubGrupoTarifario, mod: o.DscModalidadeTarifaria, cls: o.DscClasseConsumidor,
      posto: o.DscPostoTarifario, un: o.DscUnidade, v: Number(String(o.VlrComponenteTarifario).replace(",", ".")),
    });
  }
}

const hoje = new Date().toISOString().slice(0, 10);

// R$/MWh do Fio B na energia, por subgrupo, modalidade e posto
function energia(regs, sub, mod, posto) {
  const r = regs.find((x) => x.sub === sub && x.mod === mod && x.posto === posto
    && x.un === "R$/MWh" && x.cls === "Não se aplica");
  return r ? Math.round(r.v * 100) / 100 : null;
}

const saida = {};
for (const [id, agente] of Object.entries(AGENTES)) {
  const doAgente = linhas.filter((x) => x.ag === agente && x.sub === "A4");
  // vigência mais recente que já começou
  const ini = [...new Set(doAgente.map((x) => x.ini))].filter((d) => d <= hoje).sort().pop();
  if (!ini) { saida[id] = null; console.log(id.padEnd(15), "NÃO ENCONTRADA"); continue; }
  const regs = linhas.filter((x) => x.ag === agente && x.ini === ini);
  const r4 = regs.find((x) => x.sub === "A4");
  saida[id] = {
    agente, resolucao: r4.res, vigencia: `${r4.ini} a ${r4.fim}`,
    a4: {
      verde: { p: energia(regs, "A4", "Verde", "Ponta"), fp: energia(regs, "A4", "Verde", "Fora ponta") },
      azul:  { p: energia(regs, "A4", "Azul", "Ponta"),  fp: energia(regs, "A4", "Azul", "Fora ponta") },
    },
    a3: { azul: { p: energia(regs, "A3", "Azul", "Ponta"), fp: energia(regs, "A3", "Azul", "Fora ponta") } },
    b3: energia(regs, "B3", "Convencional", "Não se aplica"),
  };
  const f = saida[id];
  console.log(id.padEnd(15), `${agente} · ${f.vigencia} · A4V P ${f.a4.verde.p} FP ${f.a4.verde.fp} · A4A P ${f.a4.azul.p} · B3 ${f.b3}`);
}

writeFileSync(new URL("../src/data/fioB.js", import.meta.url),
`// Fio B (TUSD_FioB) da Tarifa de Aplicação, em R$/MWh sem tributos, por distribuidora.
// Fonte: ANEEL, dados abertos "Componentes Tarifárias". Gerado por scripts/fio-b-aneel.mjs em ${hoje}.
// No Grupo A, o Fio B da energia só existe na ponta da Verde; na Azul ele está na demanda (R$/kW).
export const FIO_B = ${JSON.stringify(saida, null, 2)};
`);
