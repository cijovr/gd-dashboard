// Tarifas extraídas das planilhas ANEEL (TABELAS REH)
// Valores em R$/kW (demanda) e R$/kWh (energia = R$/MWh ÷ 1000)
// B3: TUSD + TE somados

export const CONCESSIONARIAS = [
  {
    id: "celpe",
    nome: "Neoenergia Pernambuco (CELPE)",
    uf: "PE",
    a4: {
      azul: {
        tusd_dem_p: 41.55, tusd_dem_fp: 19.51,
        tusd_cons_p: 0.12359, tusd_cons_fp: 0.12359,
        te_p: 0.43770, te_fp: 0.25527,
      },
      verde: {
        tusd_dem: 19.51,
        tusd_cons_p: 1.12806, tusd_cons_fp: 0.12359,
        te_p: 0.43770, te_fp: 0.25527,
      },
    },
    a3: {
      azul: {
        tusd_dem_p: 18.01, tusd_dem_fp: 14.09,
        tusd_cons_p: 0.07445, tusd_cons_fp: 0.07445,
        te_p: 0.44793, te_fp: 0.26549,
      },
    },
    b3: { total: 0.79886, te: 0.26365 },
  },
  {
    id: "ceal",
    nome: "Equatorial AL (CEAL)",
    uf: "AL",
    a4: {
      azul: {
        tusd_dem_p: 70.11, tusd_dem_fp: 25.91,
        tusd_cons_p: 0.17195, tusd_cons_fp: 0.17195,
        te_p: 0.38319, te_fp: 0.19235,
      },
      verde: {
        tusd_dem: 25.91,
        tusd_cons_p: 1.87514, tusd_cons_fp: 0.17195,
        te_p: 0.38319, te_fp: 0.19235,
      },
    },
    a3: {
      azul: {
        tusd_dem_p: 32.37, tusd_dem_fp: 19.54,
        tusd_cons_p: 0.09651, tusd_cons_fp: 0.09651,
        te_p: 0.39397, te_fp: 0.20313,
      },
    },
    b3: { total: 0.85141, te: 0.20107 },
  },
  {
    id: "equatorial_pi",
    nome: "Equatorial PI",
    uf: "PI",
    a4: {
      azul: {
        tusd_dem_p: 88.82, tusd_dem_fp: 32.50,
        tusd_cons_p: 0.14021, tusd_cons_fp: 0.14021,
        te_p: 0.46025, te_fp: 0.28170,
      },
      verde: {
        tusd_dem: 32.50,
        tusd_cons_p: 2.29663, tusd_cons_fp: 0.14021,
        te_p: 0.46025, te_fp: 0.28170,
      },
    },
    a3: {
      azul: {
        tusd_dem_p: 88.82, tusd_dem_fp: 32.50,
        tusd_cons_p: 0.14021, tusd_cons_fp: 0.14021,
        te_p: 0.46025, te_fp: 0.28170,
      },
    },
    b3: { total: 0.94669, te: 0.29947 },
  },
  {
    id: "enel_ce",
    nome: "Enel CE",
    uf: "CE",
    a4: {
      azul: {
        tusd_dem_p: 41.65, tusd_dem_fp: 20.82,
        tusd_cons_p: 0.12386, tusd_cons_fp: 0.12386,
        te_p: 0.40920, te_fp: 0.24531,
      },
      verde: {
        tusd_dem: 20.82,
        tusd_cons_p: 1.13477, tusd_cons_fp: 0.12386,
        te_p: 0.40920, te_fp: 0.24531,
      },
    },
    a3: {
      azul: {
        tusd_dem_p: 13.27, tusd_dem_fp: 8.93,
        tusd_cons_p: 0.07028, tusd_cons_fp: 0.07028,
        te_p: 0.40617, te_fp: 0.24228,
      },
    },
    b3: { total: 0.74977, te: 0.26099 },
  },
  {
    id: "coelba",
    nome: "Neoenergia Coelba (COELBA)",
    uf: "BA",
    a4: {
      azul: {
        tusd_dem_p: 107.84, tusd_dem_fp: 39.87,
        tusd_cons_p: 0.13910, tusd_cons_fp: 0.13910,
        te_p: 0.44144, te_fp: 0.25224,
      },
      verde: {
        tusd_dem: 39.87,
        tusd_cons_p: 2.75779, tusd_cons_fp: 0.13910,
        te_p: 0.44144, te_fp: 0.25224,
      },
    },
    a3: {
      azul: {
        tusd_dem_p: 107.84, tusd_dem_fp: 39.87,
        tusd_cons_p: 0.13910, tusd_cons_fp: 0.13910,
        te_p: 0.44144, te_fp: 0.25224,
      },
    },
    b3: { total: 0.87773, te: 0.25765 },
  },
];

export const DISPONIBILIDADE = {
  "Monofásica": 30,
  "Bifásica": 50,
  "Trifásica": 100,
};
