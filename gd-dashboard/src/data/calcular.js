// Parcela do Fio B não compensada na GD II, por ano (Lei 14.300/2022, art. 27).
// De 2029 em diante a regra é da ANEEL; 100% aqui é estimativa.
export const FIO_B_TRANSICAO = [
  { ano: 2023, pct: 0.15 },
  { ano: 2024, pct: 0.30 },
  { ano: 2025, pct: 0.45 },
  { ano: 2026, pct: 0.60 },
  { ano: 2027, pct: 0.75 },
  { ano: 2028, pct: 0.90 },
  { ano: 2029, pct: 1.00, estimado: true },
];

export function calcular(params, conc) {
  const {
    grupo, modalidade,
    consumo_p, consumo_fp,
    dem_p, dem_fp,
    tar_dem_p, tar_dem_fp,
    tusd_cons_p, tusd_cons_fp,
    te_p, te_fp,
    icms, pis, cofins,
    bandeira, tip,
    gestao = 0,
    disponibilidade_kwh,
    desconto_gd,
    desconto_cheia = 0,
    fator_geracao: fator_informado,
    fio_b_p = 0, fio_b_fp = 0, fio_b_pct = 0, fio_b_b3 = 0,
  } = params;

  const tar_total_p  = tusd_cons_p  + te_p;
  const tar_total_fp = tusd_cons_fp + te_fp;

  // Multiplicador tributos (método CELPE)
  const mult = (1 + pis + cofins) / (1 - icms);

  // Fator de geração ponta / fora ponta — REN 1.000/2021, art. 655-G, §5º.
  // Vem do cadastro da concessionária; na falta dele, cai na relação entre as TE.
  const fator_geracao = fator_informado > 0 ? fator_informado : (te_fp > 0 ? te_p / te_fp : 0);
  const fator_ajuste  = fator_geracao > 0 ? 1 / fator_geracao : 0;

  // Taxa de disponibilidade: só existe no Grupo B.
  // No Grupo A o faturamento mínimo é a demanda contratada, não um piso de kWh.
  const grupo_a = grupo === "A4" || grupo === "A3" || grupo === "A3a" || grupo === "A2";
  const disp_kwh = grupo_a ? 0 : disponibilidade_kwh;
  const cons_fp_efetivo = Math.max(consumo_fp - disp_kwh, 0);

  // Tarifa média ponderada (sem tributos)
  const tar_media = (consumo_p * tar_total_p + consumo_fp * tar_total_fp)
                  / (consumo_p + consumo_fp);
  const tar_media_c_trib    = tar_media * mult;
  const tar_desconto        = tar_media * (1 - desconto_gd);
  const tar_desconto_c_trib = tar_desconto * mult;

  // Geração necessária
  const geracao_ponta = consumo_p * fator_geracao;
  const geracao_fp    = consumo_fp;
  const geracao_total = geracao_ponta + geracao_fp;
  const kwh_extra     = geracao_total - (consumo_p + consumo_fp);

  // Fatura ATUAL
  const fa_te_p     = consumo_p         * te_p         * mult;
  const fa_te_fp    = cons_fp_efetivo   * te_fp        * mult;
  const fa_tusd_p   = consumo_p         * tusd_cons_p  * mult;
  const fa_tusd_fp  = cons_fp_efetivo   * tusd_cons_fp * mult;
  const fa_dem_p    = dem_p  > 0 ? dem_p  * tar_dem_p  * mult : 0;
  const fa_dem_fp   = dem_fp > 0 ? dem_fp * tar_dem_fp * mult : 0;
  const fa_disp     = disp_kwh * tar_total_fp * mult;
  const fa_bandeira = (consumo_p + consumo_fp) * bandeira * mult;
  const fa_tip      = tip;
  const subtotal_atual = fa_te_p + fa_te_fp + fa_tusd_p + fa_tusd_fp
                       + fa_dem_p + fa_dem_fp + fa_disp + fa_bandeira + fa_tip;

  // Tributos
  const base_sem_trib = subtotal_atual / mult;
  const valor_pis     = base_sem_trib * pis;
  const valor_cofins  = base_sem_trib * cofins;
  const valor_icms    = subtotal_atual - base_sem_trib * (1 + pis + cofins);

  // Fatura COM GD
  const ratio      = tar_desconto / tar_media;
  const fg_te_p    = consumo_p       * te_p        * mult * ratio;
  const fg_te_fp   = cons_fp_efetivo * te_fp       * mult * ratio;
  const fg_tusd_p  = consumo_p       * tusd_cons_p * mult * ratio;
  const fg_tusd_fp = cons_fp_efetivo * tusd_cons_fp* mult * ratio;
  const fg_dem_p   = fa_dem_p;
  const fg_dem_fp  = fa_dem_fp;
  const fg_disp    = fa_disp;
  const fg_bandeira= fa_bandeira;
  const fg_tip     = fa_tip;
  // Gestão: valor fixo em R$, sem tributos, cobrado só na fatura com GD
  const fg_gestao  = gestao;
  const subtotal_gd = fg_te_p + fg_te_fp + fg_tusd_p + fg_tusd_fp
                    + fg_dem_p + fg_dem_fp + fg_disp + fg_bandeira + fg_tip + fg_gestao;

  const economia_total = subtotal_atual - subtotal_gd;
  const pct_economia   = subtotal_atual > 0 ? economia_total / subtotal_atual : 0;

  // Faturamento da usina
  const receita_mensal             = (consumo_p + consumo_fp) * tar_desconto_c_trib;
  const receita_anual              = receita_mensal * 12;
  const tar_fp_c_desc_c_trib       = te_fp * mult * (1 - desconto_gd);
  const custo_oport_mensal         = kwh_extra * tar_fp_c_desc_c_trib;
  const custo_oport_anual          = custo_oport_mensal * 12;
  // GD II (Lei 14.300, art. 27): parte do Fio B sobre a energia compensada deixa de ser compensada.
  // A distribuidora cobra do cliente, com tributos; o usineiro devolve para manter o desconto prometido.
  const custo_fio_b_cheio          = (consumo_p * fio_b_p + cons_fp_efetivo * fio_b_fp) * mult;
  const custo_fio_b_mensal         = custo_fio_b_cheio * fio_b_pct;
  const custo_fio_b_anual          = custo_fio_b_mensal * 12;
  const resultado_liquido_mensal   = receita_mensal - custo_oport_mensal - custo_fio_b_mensal;
  const resultado_liquido_anual    = resultado_liquido_mensal * 12;

  // Comparativo B3
  const geracao_b3           = consumo_p + consumo_fp;
  const tar_b3_c_desc_c_trib = conc.b3.total * mult * (1 - desconto_gd);
  const receita_b3_mensal    = geracao_b3 * tar_b3_c_desc_c_trib;
  const receita_b3_anual     = receita_b3_mensal * 12;
  // Na GD II o cliente B3 também deixa de compensar o Fio B, pago pelo usineiro
  const custo_fio_b_b3_mensal = geracao_b3 * fio_b_b3 * mult * fio_b_pct;
  const liquido_b3_mensal    = receita_b3_mensal - custo_fio_b_b3_mensal;
  const dif_a4_vs_b3         = resultado_liquido_mensal - liquido_b3_mensal;

  const out = {
    tar_total_p, tar_total_fp,
    tar_total_p_trib:  tar_total_p  * mult,
    tar_total_fp_trib: tar_total_fp * mult,
    tar_media, tar_media_c_trib, tar_desconto, tar_desconto_c_trib,
    fator_ajuste, fator_geracao, mult,
    geracao_ponta, geracao_fp, geracao_total, kwh_extra,
    fa: { te_p: fa_te_p, te_fp: fa_te_fp, tusd_p: fa_tusd_p, tusd_fp: fa_tusd_fp,
          dem_p: fa_dem_p, dem_fp: fa_dem_fp, disp: fa_disp, bandeira: fa_bandeira, tip: fa_tip, total: subtotal_atual },
    fg: { te_p: fg_te_p, te_fp: fg_te_fp, tusd_p: fg_tusd_p, tusd_fp: fg_tusd_fp,
          dem_p: fg_dem_p, dem_fp: fg_dem_fp, disp: fg_disp, bandeira: fg_bandeira, tip: fg_tip, gestao: fg_gestao, total: subtotal_gd },
    economia_total, pct_economia,
    tributos: { base: base_sem_trib, pis: valor_pis, cofins: valor_cofins, icms: valor_icms },
    usina: { receita_mensal, receita_anual, custo_oport_mensal, custo_oport_anual,
             custo_fio_b_cheio, custo_fio_b_mensal, custo_fio_b_anual,
             resultado_liquido_mensal, resultado_liquido_anual,
             geracao_b3, tar_b3_c_desc_c_trib, receita_b3_mensal, receita_b3_anual,
             custo_fio_b_b3_mensal, liquido_b3_mensal, dif_a4_vs_b3 },
  };

  // Desconto na fatura cheia (TUSD + TE + demanda + iluminação pública).
  // Os créditos só abatem a energia: demanda e iluminação o cliente segue pagando cheias
  // à distribuidora. Para o total cair d%, o usineiro cobra menos pela energia:
  // recebe energia × (1 − d_equiv), com d_equiv = d × fatura atual ÷ energia.
  if (desconto_cheia > 0) {
    const d = desconto_cheia;
    const energia_trib = fa_te_p + fa_te_fp + fa_tusd_p + fa_tusd_fp + fa_disp;
    const nao_energia  = subtotal_atual - energia_trib;   // demanda, iluminação, bandeira
    const desconto_equivalente = energia_trib > 0 ? d * subtotal_atual / energia_trib : 0;
    const eq = calcular({ ...params, desconto_gd: desconto_equivalente, desconto_cheia: 0 }, conc);

    const fc = {};
    for (const k of ["te_p", "te_fp", "tusd_p", "tusd_fp", "dem_p", "dem_fp", "disp", "bandeira", "tip"])
      fc[k] = out.fa[k] * (1 - d);
    fc.gestao = gestao;
    fc.total  = subtotal_atual * (1 - d) + gestao;

    // Demanda em R$/kWh: o valor da demanda no mês dividido pela energia do mês.
    // Equivale a R$/kW ÷ (730 h × fator de carga), com fator de carga = kWh ÷ (kW × 730 h).
    const consumo_total = consumo_p + consumo_fp;
    const dem_kw        = Math.max(dem_p || 0, dem_fp || 0);
    const demanda_rs    = fa_dem_p + fa_dem_fp;

    out.cheia = {
      desconto: d,
      desconto_equivalente,
      fc,
      economia_total: subtotal_atual - fc.total,
      pct_economia: subtotal_atual > 0 ? (subtotal_atual - fc.total) / subtotal_atual : 0,
      energia_trib, nao_energia,
      // Peso de TUSD + TE na fatura: x% só na energia = x% × peso da fatura toda
      peso_energia: subtotal_atual > 0 ? energia_trib / subtotal_atual : 0,
      // O que o usineiro dá de desconto sobre itens que não recebe (demanda, iluminação)
      custo_extra_mensal: d * nao_energia,
      custo_extra_kwh: consumo_total > 0 ? d * nao_energia / consumo_total : 0,
      demanda_rs,
      demanda_rs_kwh: consumo_total > 0 ? demanda_rs / consumo_total : 0,
      horas_mes: 730,
      fator_carga: dem_kw > 0 ? consumo_total / (dem_kw * 730) : 0,
      tar_cheia_c_trib: consumo_total > 0 ? eq.usina.receita_mensal / consumo_total : 0,
      usina: eq.usina,
    };
  }
  return out;
}
