# GD Dashboard — Simulador de Geração Distribuída

Dashboard interativo para simulação de faturas de energia e análise de negócio GD (Geração Distribuída) para o Grupo A.

## Funcionalidades

- Seleção de concessionária (CELPE, CEAL, Equatorial PI, Enel CE, COELBA)
- Grupos A4 e A3, modalidades Azul e Verde
- Cálculo de fatura com tributos (método CELPE: PIS/COFINS base s/ ICMS, ICMS por dentro)
- Comparativo fatura atual × com GD com desconto
- Taxa de disponibilidade (monofásica/bifásica/trifásica)
- Fator de ajuste de ponta automático (TE FP ÷ TE Ponta — REN 1.000/2021)
- Análise de faturamento da usina: receita, custo de oportunidade, resultado líquido
- Comparativo A4 vs Grupo B3

## Deploy no Vercel

### Via GitHub (recomendado)

1. Faça push deste projeto para um repositório GitHub
2. Acesse [vercel.com](https://vercel.com) → New Project
3. Importe o repositório
4. Vercel detecta Vite automaticamente — clique **Deploy**

### Via CLI

```bash
npm i -g vercel
npm install
vercel --prod
```

## Desenvolvimento local

```bash
npm install
npm run dev
```

## Atualizar tarifas

Edite o arquivo `src/data/tarifas.js` — todos os valores estão documentados com a fonte (ANEEL PCAT 2025/2026).

## Fonte das tarifas

- Planilhas PCAT ANEEL 2025/2026 (aba TABELAS REH)
- Método de tributos confirmado contra fatura real CELPE
- Fator de ajuste: REN 1.000/2021, Art. 655-G §5º
