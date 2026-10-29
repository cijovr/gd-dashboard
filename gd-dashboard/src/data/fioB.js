// Fio B (TUSD_FioB) da Tarifa de Aplicação, em R$/MWh sem tributos, por distribuidora.
// Fonte: ANEEL, dados abertos "Componentes Tarifárias". Gerado por scripts/fio-b-aneel.mjs em 2026-10-29.
// No Grupo A, o Fio B da energia só existe na ponta da Verde; na Azul ele está na demanda (R$/kW).
export const FIO_B = {
  "eletroacre": {
    "agente": "EAC",
    "resolucao": "RESOLUÇÃO HOMOLOGATÓRIA Nº 3.318, DE 24 DE AGOSTO DE 2026",
    "vigencia": "2026-08-26 a 2026-12-12",
    "a4": {
      "verde": {
        "p": 1650.63,
        "fp": 0
      },
      "azul": {
        "p": 0,
        "fp": 0
      }
    },
    "a3": {
      "azul": {
        "p": null,
        "fp": null
      }
    },
    "b3": 367.63
  },
  "equatorial_al": {
    "agente": "EQUATORIAL AL",
    "resolucao": "RESOLUÇÃO HOMOLOGATÓRIA Nº 3.584, DE 28 DE ABRIL DE 2026",
    "vigencia": "2026-05-03 a 2027-05-02",
    "a4": {
      "verde": {
        "p": 1210.9,
        "fp": 0
      },
      "azul": {
        "p": 0,
        "fp": 0
      }
    },
    "a3": {
      "azul": {
        "p": 0,
        "fp": 0
      }
    },
    "b3": 311.33
  },
  "ame": {
    "agente": "Âmbar Amazonas",
    "resolucao": "RESOLUÇÃO HOMOLOGATÓRIA Nº 3.588, DE 19 DE MAIO DE 2026",
    "vigencia": "2026-05-26 a 2027-05-25",
    "a4": {
      "verde": {
        "p": 779.2,
        "fp": 0
      },
      "azul": {
        "p": 0,
        "fp": 0
      }
    },
    "a3": {
      "azul": {
        "p": 0,
        "fp": 0
      }
    },
    "b3": 172.76
  },
  "cea": {
    "agente": "CEA",
    "resolucao": null,
    "vigencia": "2026-04-13 a 2027-05-24",
    "a4": {
      "verde": {
        "p": 2088.77,
        "fp": 0
      },
      "azul": {
        "p": 0,
        "fp": 0
      }
    },
    "a3": {
      "azul": {
        "p": 0,
        "fp": 0
      }
    },
    "b3": 388.86
  },
  "coelba": {
    "agente": "COELBA",
    "resolucao": "RESOLUÇÃO HOMOLOGATÓRIA Nº 3.578, DE 22 DE ABRIL DE 2026",
    "vigencia": "2026-04-22 a 2027-04-21",
    "a4": {
      "verde": {
        "p": 2279.35,
        "fp": 0
      },
      "azul": {
        "p": 0,
        "fp": 0
      }
    },
    "a3": {
      "azul": {
        "p": 0,
        "fp": 0
      }
    },
    "b3": 349.53
  },
  "enel_ce": {
    "agente": "ENEL CE",
    "resolucao": "RESOLUÇÃO HOMOLOGATÓRIA Nº 3.324, DE 24 DE AGOSTO DE 2026",
    "vigencia": "2026-08-26 a 2027-04-21",
    "a4": {
      "verde": {
        "p": 828.63,
        "fp": 0
      },
      "azul": {
        "p": 0,
        "fp": 0
      }
    },
    "a3": {
      "azul": {
        "p": 0,
        "fp": 0
      }
    },
    "b3": 283.71
  },
  "neoenergia_df": {
    "agente": "Neoenergia Brasília",
    "resolucao": "RESOLUÇÃO HOMOLOGATÓRIA Nº 3.542, DE 21 DE OUTUBRO DE 2025",
    "vigencia": "2026-01-01 a 2026-10-21",
    "a4": {
      "verde": {
        "p": 484.75,
        "fp": 0
      },
      "azul": {
        "p": 0,
        "fp": 0
      }
    },
    "a3": {
      "azul": {
        "p": null,
        "fp": null
      }
    },
    "b3": 133.27
  },
  "equatorial_go": {
    "agente": "EQUATORIAL GO",
    "resolucao": "RESOLUÇÃO HOMOLOGATÓRIA Nº 3.544, DE 21 DE OUTUBRO DE 2025",
    "vigencia": "2026-01-01 a 2026-10-21",
    "a4": {
      "verde": {
        "p": 1193.63,
        "fp": 0
      },
      "azul": {
        "p": 0,
        "fp": 0
      }
    },
    "a3": {
      "azul": {
        "p": 0,
        "fp": 0
      }
    },
    "b3": 291.86
  },
  "equatorial_ma": {
    "agente": "EQUATORIAL MA",
    "resolucao": "RESOLUÇÃO HOMOLOGATÓRIA Nº 3.604, DE 26 DE AGOSTO DE 2026",
    "vigencia": "2026-08-28 a 2027-08-27",
    "a4": {
      "verde": {
        "p": 1869.25,
        "fp": 0
      },
      "azul": {
        "p": 0,
        "fp": 0
      }
    },
    "a3": {
      "azul": {
        "p": 0,
        "fp": 0
      }
    },
    "b3": 325.14
  },
  "cemig": {
    "agente": "CEMIG-D",
    "resolucao": "RESOLUÇÃO HOMOLOGATÓRIA Nº 3.589, DE 26 DE MAIO DE 2026",
    "vigencia": "2026-05-28 a 2027-05-27",
    "a4": {
      "verde": {
        "p": 1370.31,
        "fp": 0
      },
      "azul": {
        "p": 0,
        "fp": 0
      }
    },
    "a3": {
      "azul": {
        "p": 0,
        "fp": 0
      }
    },
    "b3": 268.19
  },
  "energisa_mt": {
    "agente": "EMT",
    "resolucao": "RESOLUÇÃO HOMOLOGATÓRIA Nº 3.581, DE 22 DE ABRIL DE 2026",
    "vigencia": "2026-04-08 a 2027-04-07",
    "a4": {
      "verde": {
        "p": 1284.6,
        "fp": 0
      },
      "azul": {
        "p": 0,
        "fp": 0
      }
    },
    "a3": {
      "azul": {
        "p": 0,
        "fp": 0
      }
    },
    "b3": 315.1
  },
  "equatorial_pa": {
    "agente": "EQUATORIAL PA",
    "resolucao": "RESOLUÇÃO HOMOLOGATÓRIA Nº 3.608, DE 18 DE SETEMBRO DE 2026",
    "vigencia": "2026-09-18 a 2027-08-06",
    "a4": {
      "verde": {
        "p": 1814.19,
        "fp": 0
      },
      "azul": {
        "p": 0,
        "fp": 0
      }
    },
    "a3": {
      "azul": {
        "p": 0,
        "fp": 0
      }
    },
    "b3": 379.35
  },
  "energisa_pb": {
    "agente": "EPB",
    "resolucao": "RESOLUÇÃO HOMOLOGATÓRIA Nº 3.603, DE 28 DE AGOSTO DE 2026",
    "vigencia": "2026-08-28 a 2027-08-27",
    "a4": {
      "verde": {
        "p": 853.03,
        "fp": 0
      },
      "azul": {
        "p": 0,
        "fp": 0
      }
    },
    "a3": {
      "azul": {
        "p": 0,
        "fp": 0
      }
    },
    "b3": 236.11
  },
  "neoenergia_pe": {
    "agente": "Neoenergia PE",
    "resolucao": "RESOLUÇÃO HOMOLOGATÓRIA Nº 3.583, DE 28 DE ABRIL DE 2026",
    "vigencia": "2026-04-29 a 2027-04-28",
    "a4": {
      "verde": {
        "p": 704.19,
        "fp": 0
      },
      "azul": {
        "p": 0,
        "fp": 0
      }
    },
    "a3": {
      "azul": {
        "p": 0,
        "fp": 0
      }
    },
    "b3": 260.68
  },
  "equatorial_pi": {
    "agente": "EQUATORIAL PI",
    "resolucao": "RESOLUÇÃO HOMOLOGATÓRIA Nº 3.555, DE 25 DE NOVEMBRO DE 2025",
    "vigencia": "2026-01-01 a 2026-12-01",
    "a4": {
      "verde": {
        "p": 1763.18,
        "fp": 0
      },
      "azul": {
        "p": 0,
        "fp": 0
      }
    },
    "a3": {
      "azul": {
        "p": 0,
        "fp": 0
      }
    },
    "b3": 364.88
  },
  "copel_pr": {
    "agente": "COPEL-DIS",
    "resolucao": "RESOLUÇÃO HOMOLOGATÓRIA Nº 3.592, DE 23 DE JUNHO DE 2026",
    "vigencia": "2026-06-24 a 2027-06-23",
    "a4": {
      "verde": {
        "p": 1018.54,
        "fp": 0
      },
      "azul": {
        "p": 0,
        "fp": 0
      }
    },
    "a3": {
      "azul": {
        "p": 0,
        "fp": 0
      }
    },
    "b3": 214.54
  },
  "enel_rj": {
    "agente": "ENEL RJ",
    "resolucao": "RESOLUÇÃO HOMOLOGATÓRIA Nº 3.570, DE 10 DE MARÇO DE 2026",
    "vigencia": "2026-03-15 a 2027-03-14",
    "a4": {
      "verde": {
        "p": 1322.94,
        "fp": 0
      },
      "azul": {
        "p": 0,
        "fp": 0
      }
    },
    "a3": {
      "azul": {
        "p": 0,
        "fp": 0
      }
    },
    "b3": 361.02
  },
  "light_rj": {
    "agente": "LIGHT SESA",
    "resolucao": "RESOLUÇÃO HOMOLOGATÓRIA Nº 3.571, DE 10 DE MARÇO DE 2026",
    "vigencia": "2026-03-15 a 2027-03-14",
    "a4": {
      "verde": {
        "p": 732.65,
        "fp": 0
      },
      "azul": {
        "p": 0,
        "fp": 0
      }
    },
    "a3": {
      "azul": {
        "p": null,
        "fp": null
      }
    },
    "b3": 225.35
  },
  "cosern": {
    "agente": "COSERN",
    "resolucao": "RESOLUÇÃO HOMOLOGATÓRIA Nº 3.573, DE 22 DE ABRIL DE 2026",
    "vigencia": "2026-04-22 a 2027-04-21",
    "a4": {
      "verde": {
        "p": 1538.11,
        "fp": 0
      },
      "azul": {
        "p": 0,
        "fp": 0
      }
    },
    "a3": {
      "azul": {
        "p": 0,
        "fp": 0
      }
    },
    "b3": 267
  },
  "ceron": {
    "agente": "ERO",
    "resolucao": "RESOLUÇÃO HOMOLOGATÓRIA Nº 3.320, DE 24 DE AGOSTO DE 2026",
    "vigencia": "2026-08-26 a 2026-12-12",
    "a4": {
      "verde": {
        "p": 2435.79,
        "fp": 0
      },
      "azul": {
        "p": 0,
        "fp": 0
      }
    },
    "a3": {
      "azul": {
        "p": 0,
        "fp": 0
      }
    },
    "b3": 404.02
  },
  "boa_vista": {
    "agente": "Âmbar Roraima",
    "resolucao": "RESOLUÇÃO HOMOLOGATÓRIA Nº 3.565, DE 20 DE JANEIRO DE 2026",
    "vigencia": "2026-01-25 a 2027-01-24",
    "a4": {
      "verde": {
        "p": 1243.47,
        "fp": 0
      },
      "azul": {
        "p": 0,
        "fp": 0
      }
    },
    "a3": {
      "azul": {
        "p": null,
        "fp": null
      }
    },
    "b3": 200.13
  },
  "ceee_rs": {
    "agente": "CEEE-D",
    "resolucao": "RESOLUÇÃO HOMOLOGATÓRIA Nº 3.547, DE 18 DE NOVEMBRO DE 2025",
    "vigencia": "2026-01-01 a 2026-11-21",
    "a4": {
      "verde": {
        "p": 1061.68,
        "fp": 0
      },
      "azul": {
        "p": 0,
        "fp": 0
      }
    },
    "a3": {
      "azul": {
        "p": 0,
        "fp": 0
      }
    },
    "b3": 187.3
  },
  "celesc": {
    "agente": "CELESC",
    "resolucao": "RESOLUÇÃO HOMOLOGATÓRIA Nº 3.602, DE 21 DE AGOSTO DE 2026",
    "vigencia": "2026-08-22 a 2027-08-21",
    "a4": {
      "verde": {
        "p": 649.75,
        "fp": 0
      },
      "azul": {
        "p": 0,
        "fp": 0
      }
    },
    "a3": {
      "azul": {
        "p": 0,
        "fp": 0
      }
    },
    "b3": 132.79
  },
  "energisa_s_se": {
    "agente": "ESS",
    "resolucao": "RESOLUÇÃO HOMOLOGATÓRIA Nº 3.599, DE 15 DE JULHO DE 2026",
    "vigencia": "2026-07-12 a 2027-07-11",
    "a4": {
      "verde": {
        "p": 711.28,
        "fp": 0
      },
      "azul": {
        "p": 0,
        "fp": 0
      }
    },
    "a3": {
      "azul": {
        "p": 0,
        "fp": 0
      }
    },
    "b3": 200.81
  },
  "energisa_se": {
    "agente": "ESE",
    "resolucao": "RESOLUÇÃO HOMOLOGATÓRIA Nº 3.575, DE 22 DE ABRIL DE 2026",
    "vigencia": "2026-04-22 a 2027-04-21",
    "a4": {
      "verde": {
        "p": 1278.81,
        "fp": 0
      },
      "azul": {
        "p": 0,
        "fp": 0
      }
    },
    "a3": {
      "azul": {
        "p": 0,
        "fp": 0
      }
    },
    "b3": 254.99
  },
  "sulgipe": {
    "agente": "SULGIPE",
    "resolucao": "RESOLUÇÃO HOMOLOGATÓRIA Nº 3.321, DE 24 DE AGOSTO DE 2026",
    "vigencia": "2026-08-26 a 2027-05-21",
    "a4": {
      "verde": {
        "p": 2215,
        "fp": 0
      },
      "azul": {
        "p": 0,
        "fp": 0
      }
    },
    "a3": {
      "azul": {
        "p": 0,
        "fp": 0
      }
    },
    "b3": 306.41
  },
  "cpfl_paulista": {
    "agente": "CPFL-PAULISTA",
    "resolucao": "RESOLUÇÃO HOMOLOGATÓRIA Nº 3.579, DE 24 DE ABRIL DE 2026",
    "vigencia": "2026-04-24 a 2027-04-07",
    "a4": {
      "verde": {
        "p": 979.75,
        "fp": 0
      },
      "azul": {
        "p": 0,
        "fp": 0
      }
    },
    "a3": {
      "azul": {
        "p": 0,
        "fp": 0
      }
    },
    "b3": 200.53
  },
  "edp_sp": {
    "agente": "EDP SP",
    "resolucao": "RESOLUÇÃO HOMOLOGATÓRIA Nº 3.541, DE 14 DE OUTUBRO DE 2025",
    "vigencia": "2026-01-01 a 2026-10-22",
    "a4": {
      "verde": {
        "p": 942.77,
        "fp": 0
      },
      "azul": {
        "p": 0,
        "fp": 0
      }
    },
    "a3": {
      "azul": {
        "p": null,
        "fp": null
      }
    },
    "b3": 198.77
  },
  "elektro": {
    "agente": "ELEKTRO",
    "resolucao": "RESOLUÇÃO HOMOLOGATÓRIA Nº 3.605, DE 26 DE AGOSTO DE 2026",
    "vigencia": "2026-08-27 a 2027-08-26",
    "a4": {
      "verde": {
        "p": 1104.97,
        "fp": 0
      },
      "azul": {
        "p": 0,
        "fp": 0
      }
    },
    "a3": {
      "azul": {
        "p": 0,
        "fp": 0
      }
    },
    "b3": 224.65
  },
  "enel_sp": {
    "agente": "ELETROPAULO",
    "resolucao": "RESOLUÇÃO HOMOLOGATÓRIA Nº 3.596, DE 3 DE JULHO DE 2026",
    "vigencia": "2026-07-04 a 2027-07-03",
    "a4": {
      "verde": {
        "p": 486.45,
        "fp": 0
      },
      "azul": {
        "p": 0,
        "fp": 0
      }
    },
    "a3": {
      "azul": {
        "p": null,
        "fp": null
      }
    },
    "b3": 212.08
  },
  "energisa_to": {
    "agente": "ETO",
    "resolucao": "RESOLUÇÃO HOMOLOGATÓRIA Nº 3.323, DE 24 DE AGOSTO DE 2026",
    "vigencia": "2026-08-26 a 2027-07-03",
    "a4": {
      "verde": {
        "p": 1625.96,
        "fp": 0
      },
      "azul": {
        "p": 0,
        "fp": 0
      }
    },
    "a3": {
      "azul": {
        "p": 0,
        "fp": 0
      }
    },
    "b3": 441.48
  }
};
