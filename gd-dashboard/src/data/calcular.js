// Motor de cálculo — espelha exatamente a lógica da planilha Excel

export function calcular(params, conc) {
  const {
    grupo, modalidade,
    consumo_p, consumo_fp,
    dem_p, dem_fp,
    tar_dem_p, tar_dem_fp,
    icms, pis, cofins,
    bandeira, tip,
    disponibilidade_kwh,
    desconto_gd,
  } = params;

  // ── Tarifas base ──────────────────────────────────────────────────────────
  const tar = grupo === "A4"
    ? (modalidade === "AZUL" ? conc.a4.azul : conc.a4.verde)
    : (conc.a3?.azul || conc.a4.azul);

  const tusd_cons_p  = modalidade === "AZUL" ? tar.tusd_cons_p  : tar.tusd_cons_p;
  const tusd_cons_fp = modalidade === "AZUL" ? tar.tusd_cons_fp : tar.tusd_cons_fp;
  const te_p         = tar.te_p;
  const te_fp        = tar.te_fp;

  const tar_total_p  = tusd_cons_p  + te_p;
  const tar_total_fp = tusd_cons_fp + te_fp;

  // ── Multiplicador tributos (método CELPE) ────────────────────────────────
  // PIS/COFINS sobre base s/ ICMS → ICMS por dentro sobre total
  const mult = (1 + pis + cofins) / (1 - icms);

  // ── Fator de ajuste ponta ─────────────────────────────────────────────────
  const fator_ajuste = te_fp / te_p;           // TE FP ÷ TE Ponta
  const fator_geracao = 1 / fator_ajuste;      // kWh a gerar por kWh consumido na ponta

  // ── Taxa de disponibilidade ───────────────────────────────────────────────
  const disp_kwh = disponibilidade_kwh;
  const cons_fp_efetivo = Math.max(consumo_fp - disp_kwh, 0);

  // ── Tarifa média ponderada (sem tributos, base do desconto) ───────────────
  const tar_media = (consumo_p * tar_total_p + consumo_fp * tar_total_fp)
                  / (consumo_p + consumo_fp);

  const tar_media_c_trib = tar_media * mult;
  const tar_desconto      = tar_media * (1 - desconto_gd);
  const tar_desconto_c_trib = tar_desconto * mult;

  // ── Geração necessária ────────────────────────────────────────────────────
  const geracao_ponta  = consumo_p * fator_geracao;
  const geracao_fp     = consumo_fp;
  const geracao_total  = geracao_ponta + geracao_fp;
  const kwh_extra      = geracao_total - (consumo_p + consumo_fp);

  // ── Fatura ATUAL ──────────────────────────────────────────────────────────
  const fa_te_p        = consumo_p         * te_p         * mult;
  const fa_te_fp       = cons_fp_efetivo   * te_fp        * mult;
  const fa_tusd_p      = consumo_p         * tusd_cons_p  * mult;
  const fa_tusd_fp     = cons_fp_efetivo   * tusd_cons_fp * mult;
  const fa_dem_p       = dem_p > 0 ? dem_p  * tar_dem_p   * mult : 0;
  const fa_dem_fp      = dem_fp > 0 ? dem_fp * tar_dem_fp  * mult : 0;
  const fa_disp        = disp_kwh * tar_total_fp * mult;
  const fa_bandeira    = (consumo_p + consumo_fp) * bandeira * mult;
  const fa_tip         = tip;

  const subtotal_atual = fa_te_p + fa_te_fp + fa_tusd_p + fa_tusd_fp
                       + fa_dem_p + fa_dem_fp + fa_disp + fa_bandeira + fa_tip;

  // Detalhamento tributos fatura atual
  const base_sem_trib  = subtotal_atual / mult;
  const valor_pis      = base_sem_trib * pis;
  const valor_cofins   = base_sem_trib * cofins;
  const valor_icms     = subtotal_atual - base_sem_trib * (1 + pis + cofins);

  // ── Fatura COM GD ─────────────────────────────────────────────────────────
  const ratio = tar_desconto / tar_media;   // fator de redução dos itens de consumo

  const fg_te_p    = consumo_p       * te_p        * mult * ratio;
  const fg_te_fp   = cons_fp_efetivo * te_fp       * mult * ratio;
  const fg_tusd_p  = consumo_p       * tusd_cons_p * mult * ratio;
  const fg_tusd_fp = cons_fp_efetivo * tusd_cons_fp* mult * ratio;
  const fg_dem_p   = fa_dem_p;    // demanda não muda
  const fg_dem_fp  = fa_dem_fp;
  const fg_disp    = fa_disp;     // taxa disp não muda
  const fg_bandeira= fa_bandeira;
  const fg_tip     = fa_tip;

  const subtotal_gd = fg_te_p + fg_te_fp + fg_tusd_p + fg_tusd_fp
                    + fg_dem_p + fg_dem_fp + fg_disp + fg_bandeira + fg_tip;

  const economia_total = subtotal_atual - subtotal_gd;
  const pct_economia   = subtotal_atual > 0 ? economia_total / subtotal_atual : 0;

  // ── Faturamento da usina ──────────────────────────────────────────────────
  const receita_mensal  = (consumo_p + consumo_fp) * tar_desconto_c_trib;
  const receita_anual   = receita_mensal * 12;

  const tar_fp_c_desc_c_trib = te_fp * mult * (1 - desconto_gd);
  const custo_oport_mensal  = kwh_extra * tar_fp_c_desc_c_trib;
  const custo_oport_anual   = custo_oport_mensal * 12;

  const resultado_liquido_mensal = receita_mensal - custo_oport_mensal;
  const resultado_liquido_anual  = resultado_liquido_mensal * 12;

  // Comparativo Grupo B (sem fator ponta — 1:1)
  const geracao_b3         = consumo_p + consumo_fp;
  const tar_b3_c_desc_c_trib = conc.b3.total * mult * (1 - desconto_gd);
  const receita_b3_mensal  = geracao_b3 * tar_b3_c_desc_c_trib;
  const receita_b3_anual   = receita_b3_mensal * 12;
  const dif_a4_vs_b3       = resultado_liquido_mensal - receita_b3_mensal;

  return {
    // Tarifas
    tar_total_p, tar_total_fp, tar_total_p_trib: tar_total_p * mult, tar_total_fp_trib: tar_total_fp * mult,
    tar_media, tar_media_c_trib, tar_desconto, tar_desconto_c_trib,
    fator_ajuste, fator_geracao, mult,
    // Geração
    geracao_ponta, geracao_fp, geracao_total, kwh_extra,
    // Fatura atual
    fa: { te_p: fa_te_p, te_fp: fa_te_fp, tusd_p: fa_tusd_p, tusd_fp: fa_tusd_fp,
          dem_p: fa_dem_p, dem_fp: fa_dem_fp, disp: fa_disp,
          bandeira: fa_bandeira, tip: fa_tip, total: subtotal_atual },
    // Fatura GD
    fg: { te_p: fg_te_p, te_fp: fg_te_fp, tusd_p: fg_tusd_p, tusd_fp: fg_tusd_fp,
          dem_p: fg_dem_p, dem_fp: fg_dem_fp, disp: fg_disp,
          bandeira: fg_bandeira, tip: fg_tip, total: subtotal_gd },
    // Economia
    economia_total, pct_economia,
    // Tributos
    tributos: { base: base_sem_trib, pis: valor_pis, cofins: valor_cofins, icms: valor_icms },
    // Usina
    usina: {
      receita_mensal, receita_anual,
      custo_oport_mensal, custo_oport_anual,
      resultado_liquido_mensal, resultado_liquido_anual,
      geracao_b3, tar_b3_c_desc_c_trib, receita_b3_mensal, receita_b3_anual,
      dif_a4_vs_b3,
    },
  };
}
