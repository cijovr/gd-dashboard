// Busca na base aberta da ANEEL (Componentes Tarifárias) o Fio B da Tarifa de Aplicação
// de cada concessionária e grava src/data/fioB.js.
// Rodar: node scripts/fio-b-aneel.mjs
import { writeFileSync } from "node:fs";

const API = "https://dadosabertos.aneel.gov.br/api/3/action/datastore_search";
const RECURSOS = {
  2026: "e8717aa8-2521-453f-bf16-fbb9a16eea39",
  2025: "a4060165-3a0c-404f-926c-83901088b67c",
};

// id do simulador → nomes possíveis do agente na ANEEL
const AGENTES = {
  ceal:          ["EQUATORIAL AL", "CEAL"],
  coelba:        ["COELBA"],
  enel_ce:       ["ENEL CE"],
  equatorial_go: ["EQUATORIAL GO", "CELG-D", "Equatorial GO"],
  cemig:         ["CEMIG-D"],
  energisa_mt:   ["EMT"],
  equatorial_pa: ["EQUATORIAL PA", "CELPA"],
  celpe:         ["Neoenergia PE", "CELPE"],
  equatorial_pi: ["EQUATORIAL PI", "Equatorial PI", "CEPISA"],
  light:         ["LIGHT SESA", "LIGHT"],
  cosern:        ["COSERN"],
};

// A busca da ANEEL (datastore) do arquivo de 2025 está incompleta. Estas vieram do arquivo
// componentes-tarifarias-2025.parquet do mesmo conjunto de dados, Tarifa de Aplicação.
const DO_ARQUIVO_2025 = {
  equatorial_go: {
    agente: "EQUATORIAL GO", resolucao: "RESOLUÇÃO HOMOLOGATÓRIA Nº 3.544, DE 21 DE OUTUBRO DE 2025",
    vigencia: "2025-10-22 a 2026-10-21",
    a4: { verde: { p: 1193.63, fp: 0 }, azul: { p: 0, fp: 0 } }, a3: { azul: { p: 0, fp: 0 } }, b3: 291.86,
  },
  equatorial_pi: {
    agente: "EQUATORIAL PI", resolucao: "RESOLUÇÃO HOMOLOGATÓRIA Nº 3.555, DE 25 DE NOVEMBRO DE 2025",
    vigencia: "2025-12-02 a 2026-12-01",
    a4: { verde: { p: 1763.18, fp: 0 }, azul: { p: 0, fp: 0 } }, a3: { azul: { p: 0, fp: 0 } }, b3: 364.88,
  },
};

const num = (v) => Number(String(v).replace(",", "."));

async function linhas(recurso, agente, subgrupo) {
  const filtros = {
    SigNomeAgente: agente, DscSubGrupoTarifario: subgrupo,
    DscBaseTarifaria: "Tarifa de Aplicação", DscComponenteTarifario: "TUSD_FioB",
    DscDetalheConsumidor: "Não se aplica", SigNomeAgenteAcessante: "Não se aplica",
  };
  const u = API + "?" + new URLSearchParams({
    resource_id: recurso, filters: JSON.stringify(filtros), limit: "1000",
    fields: "DscResolucaoHomologatoria,DatInicioVigencia,DatFimVigencia,DscModalidadeTarifaria,DscClasseConsumidor,DscPostoTarifario,DscUnidade,VlrComponenteTarifario",
    distinct: "true",
  });
  for (let tentativa = 0; tentativa < 5; tentativa++) {
    const resp = await fetch(u);
    const texto = await resp.text();
    try { const j = JSON.parse(texto); return j.success ? j.result.records : []; }
    catch { await new Promise((r) => setTimeout(r, 3000 * (tentativa + 1))); }
  }
  throw new Error(`ANEEL não respondeu para ${agente} ${subgrupo}`);
}

// R$/MWh do Fio B na energia, por modalidade e posto, na vigência mais recente
function energia(regs, modalidade, posto) {
  const r = regs.find((x) => x.DscModalidadeTarifaria === modalidade && x.DscPostoTarifario === posto
    && x.DscUnidade === "R$/MWh" && x.DscClasseConsumidor === "Não se aplica");
  return r ? Math.round(num(r.VlrComponenteTarifario) * 100) / 100 : null;
}

const hoje = new Date().toISOString().slice(0, 10);
const saida = {};

for (const [id, nomes] of Object.entries(AGENTES)) {
  let achou = null;
  for (const ano of [2026, 2025]) {
    for (const nome of nomes) {
      const a4 = await linhas(RECURSOS[ano], nome, "A4");
      if (!a4.length) continue;
      // vigência mais recente que já começou
      const vig = [...new Set(a4.map((x) => x.DatInicioVigencia))].filter((d) => d <= hoje).sort().pop();
      const so = (regs) => regs.filter((x) => x.DatInicioVigencia === vig);
      const r4 = so(a4), r3 = so(await linhas(RECURSOS[ano], nome, "A3")), rb = so(await linhas(RECURSOS[ano], nome, "B3"));
      achou = {
        agente: nome,
        resolucao: r4[0].DscResolucaoHomologatoria,
        vigencia: `${r4[0].DatInicioVigencia} a ${r4[0].DatFimVigencia}`,
        a4: {
          verde: { p: energia(r4, "Verde", "Ponta"), fp: energia(r4, "Verde", "Fora ponta") },
          azul:  { p: energia(r4, "Azul",  "Ponta"), fp: energia(r4, "Azul",  "Fora ponta") },
        },
        a3: { azul: { p: energia(r3, "Azul", "Ponta"), fp: energia(r3, "Azul", "Fora ponta") } },
        b3: energia(rb, "Convencional", "Não se aplica"),
      };
      break;
    }
    if (achou) break;
  }
  saida[id] = achou || DO_ARQUIVO_2025[id] || null;
  if (!achou) achou = saida[id];
  console.log(id.padEnd(14), achou ? `${achou.agente} · ${achou.vigencia} · A4V P ${achou.a4.verde.p} FP ${achou.a4.verde.fp} · A4A P ${achou.a4.azul.p} · B3 ${achou.b3}` : "NÃO ENCONTRADA");
}

writeFileSync(new URL("../src/data/fioB.js", import.meta.url),
`// Fio B (TUSD_FioB) da Tarifa de Aplicação, em R$/MWh sem tributos, por concessionária.
// Fonte: ANEEL, dados abertos "Componentes Tarifárias". Gerado por scripts/fio-b-aneel.mjs em ${hoje}.
// No Grupo A, o Fio B da energia só existe na ponta da Verde; na Azul ele está na demanda (R$/kW).
export const FIO_B = ${JSON.stringify(saida, null, 2)};
`);
