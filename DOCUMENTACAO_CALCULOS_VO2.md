# Documentação dos Cálculos VO2 — Cooper Pro

Este documento descreve a lógica dos cálculos relacionados ao Teste de Cooper, à prescrição de treinamento baseada em VO2 e propõe uma especificação para um novo teste de treinamento intervalado, incluindo o cálculo de gasto calórico (kcal), peso perdido e resultados agregados do circuito.

## Fundamentos — Teste de Cooper
- Duração: 12 minutos de corrida contínua; registra-se a distância percorrida (`distância em metros`).
- Estimativa de `VO2máx` a partir da distância. Fórmulas presentes no código:
  - `VO2máx = (distância_em_metros - 504,1) / 44,8` (`src/lib/performance-evaluation.ts` e `src/lib/actions/tests.ts`).
  - `VO2máx = (distância_em_metros - 504,9) / 44,73` (`src/lib/cooper-test.ts`).
- Observação: há pequena divergência nas constantes (504,1/44,8 vs 504,9/44,73). Recomenda-se padronizar uma única fórmula em todo o projeto para evitar variações nos resultados.
- Classificação de condicionamento físico: baseada em faixas de idade e sexo (ver `classifyVO2Max` em `src/lib/cooper-test.ts`).
- Validação da distância: mínima 500 m e máxima 5000 m (`validateCooperTestDistance`).

## Prescrição de Treinamento baseada em VO2 (pipeline atual)
Os cálculos implementados em `src/lib/performance-evaluation.ts` seguem o fluxo abaixo:

1) `VO2máx` a partir da distância do Cooper
   - `vo2Max = (distância - 504,1) / 44,8`.

2) `MET máx`
   - `maxMET = vo2Max / 3,5`.

3) `Fração do Treinamento (FT)`
   - Implementação atual: `FT = (maxMET + intensidade%) / 100`.
   - Nota técnica: em protocolos clássicos, é comum aplicar o percentual como fração (`int% / 100`) diretamente sobre a capacidade, sem somá-lo ao `maxMET`. A versão atual funciona como modelagem específica do projeto; avalie se deseja migrar para a forma tradicional: `IT = maxMET × (intensidade% / 100)`.

4) `Intensidade do Treino (IT)`
   - Atual: `IT = maxMET × FT` (resultado em `km/h`).

5) `Velocidade (m/min)`
   - `velocidade = (IT × 1000) / 60`.

6) `Distância do treino (m)`
   - `distTreino = velocidade × tempo_minutos`.

7) `Consumo de O2 por minuto (L/min)`
   - `O2_min = (vo2Max × (int% / 100) × peso_kg) / 1000`.

8) `Consumo total de O2 (L)`
   - `O2_total = O2_min × tempo_minutos`.

9) `Gasto calórico (kcal)`
   - `kcal = O2_total × 5`.

10) `Peso perdido (g)`
   - `peso_perdido_g = (kcal × 1000) / 7730`.

Este pipeline está integrado nas telas de prescrição (`TrainingPrescriptionForm`) e nos detalhes do teste (`/tests/[id]`), usando o peso corporal do avaliando para converter o VO2 em consumo de O2.

## Proposta — Teste de Treinamento Intervalado
Objetivo: permitir que o usuário defina um circuito de intervalos, informando distâncias por segmento e (opcionalmente) intensidade ou tempo, para calcular resultados por intervalo e totais do circuito: `kcal`, `peso perdido`, `tempo`, `velocidade`, etc.

### Entradas
- Seleção de um teste de Cooper prévio do avaliando (para obter `vo2Max` e `peso`).
- Lista de intervalos com, no mínimo, um dos conjuntos:
  - Distância em metros (`d_i`) + Intensidade em % (`int_i`), ou
  - Distância em metros (`d_i`) + Tempo em minutos (`t_i`).
- Opcional: se `t_i` não for fornecido, calcular via velocidade estimada pela intensidade.

### Cálculos por intervalo
Considerando a modelagem já usada no projeto:
- `maxMET = vo2Max / 3,5`.
- `FT_i = (maxMET + int_i) / 100`.
- `IT_i = maxMET × FT_i` (em `km/h`).
- `vel_i = (IT_i × 1000) / 60` (em `m/min`).
- Tempo do intervalo:
  - Se `t_i` não informado: `t_i = d_i / vel_i`.
- Consumo de O2 por minuto:
  - `O2_min_i = (vo2Max × (int_i / 100) × peso) / 1000` (em `L/min`).
- Consumo total do intervalo:
  - `O2_total_i = O2_min_i × t_i` (em `L`).
- Gasto calórico e peso perdido:
  - `kcal_i = O2_total_i × 5`.
  - `peso_perdido_i = (kcal_i × 1000) / 7730` (g).

### Resultados totais do circuito
- `dist_total = Σ d_i`.
- `tempo_total = Σ t_i`.
- `O2_total_circuito = Σ O2_total_i`.
- `kcal_total = Σ kcal_i`.
- `peso_perdido_total = Σ peso_perdido_i`.
- Métricas complementares: `velocidade_média = dist_total / tempo_total`, `pace médio`, `intensidade média` (se fornecida por intervalo).

### Assinatura sugerida (utilitário)
```ts
type Interval = {
  distanceMeters: number
  intensityPercent?: number // opcional se tempo for informado
  timeMinutes?: number      // opcional se intensidade for informada
}

function calculateIntervalTrainingResults(
  cooperDistanceMeters: number,
  bodyWeightKg: number,
  intervals: Interval[]
) {
  // Retornar: resultados por intervalo + agregados do circuito
}
```

### Exemplo numérico
Suponha:
- Cooper: `2400 m` → `vo2Max ≈ (2400−504,1)/44,8 ≈ 42,31 ml/kg/min`.
- Peso: `70 kg`.
- Intervalos:
  1) `d_1 = 1000 m`, `int_1 = 60%`
  2) `d_2 = 800 m`, `int_2 = 70%`
  3) `d_3 = 400 m`, `int_3 = 80%`

Passos:
- `maxMET = 42,31 / 3,5 ≈ 12,09`.

Intervalo 1 (60%):
- `FT_1 = (12,09 + 60)/100 = 0,7209` → `IT_1 = 12,09 × 0,7209 ≈ 8,72 km/h`.
- `vel_1 = 8,72×1000/60 ≈ 145,33 m/min` → `t_1 = 1000/145,33 ≈ 6,88 min`.
- `O2_min_1 = (42,31×0,60×70)/1000 ≈ 1,771 L/min`.
- `O2_total_1 ≈ 1,771×6,88 ≈ 12,18 L` → `kcal_1 ≈ 60,9` → `peso_1 ≈ 7,88 g`.

Intervalo 2 (70%):
- `FT_2 = (12,09 + 70)/100 = 0,8209` → `IT_2 ≈ 9,93 km/h`.
- `vel_2 ≈ 165,5 m/min` → `t_2 = 800/165,5 ≈ 4,83 min`.
- `O2_min_2 = (42,31×0,70×70)/1000 ≈ 2,077 L/min`.
- `O2_total_2 ≈ 2,077×4,83 ≈ 10,04 L` → `kcal_2 ≈ 50,2` → `peso_2 ≈ 6,49 g`.

Intervalo 3 (80%):
- `FT_3 = (12,09 + 80)/100 = 0,9209` → `IT_3 ≈ 11,14 km/h`.
- `vel_3 ≈ 185,7 m/min` → `t_3 = 400/185,7 ≈ 2,15 min`.
- `O2_min_3 = (42,31×0,80×70)/1000 ≈ 2,262 L/min`.
- `O2_total_3 ≈ 2,262×2,15 ≈ 4,86 L` → `kcal_3 ≈ 24,3` → `peso_3 ≈ 3,14 g`.

Totais do circuito:
- `dist_total = 2200 m`, `tempo_total ≈ 13,86 min`.
- `O2_total ≈ 27,08 L` → `kcal_total ≈ 135,4` → `peso_perdido_total ≈ 17,51 g`.

### Integração sugerida (UI e dados)
- UI: novo componente `IntervalTrainingForm` com lista dinâmica de intervalos (adicionar/remover), validando entradas (`d_i` obrigatório; `int_i` ou `t_i` obrigatórios).
- Dados: registrar `test_type = 'interval_training'` em `performance_tests` e armazenar os intervalos (e resultados) como JSON em um campo dedicado (ex.: `intervals_json`) ou criar uma tabela específica para intervalos se desejar granulidade por segmento.
- Resultados: exibir métricas por intervalo e agregadas (kcal, peso perdido, tempo, distância, velocidades, pace médio).

### Decisões e pontos de atenção
- Padronizar a fórmula do `VO2máx` do Cooper em todo o projeto.
- Confirmar se deseja manter `FT = (maxMET + intensidade%)/100` ou adotar o modelo clássico `IT = maxMET × (intensidade% / 100)`; ambos podem ser suportados via `modo de cálculo` selecionável.
- Garantir que `peso` do avaliando esteja preenchido para cálculos de O2/kcal/peso.
- Validar ranges de entrada: distâncias razoáveis, tempos > 0 se fornecidos, intensidades típicas (50–90%).

---
Com esta base, a implementação do teste intervalado pode reutilizar os utilitários de prescrição já existentes, adicionando apenas o cálculo por segmentos e a agregação final do circuito.

## 📋 Visão Geral
Esta documentação detalha todas as fórmulas utilizadas no sistema Cooper Pro para cálculos de performance baseados no teste de Cooper.

## 🧮 Fórmulas Principais

### 1. VO2 Máximo
**Fórmula:** `VO2max = (Distância Cooper - 504,1) / 44,8`

**Exemplo:** Distância = 3200m
```
VO2max = (3200 - 504,1) / 44,8
VO2max = 2695,9 / 44,8
VO2max = 60,18 ml/kg/min
```

### 2. MET Máximo
**Fórmula:** `MET Máx = VO2max / 3,5`

**Exemplo:** VO2max = 60,18
```
MET Máx = 60,18 / 3,5
MET Máx = 17,19
```

### 3. Fração do Treinamento (FT)
**Fórmula:** `FT = (MET Máx + percentual) / 100`

**Exemplo:** MET Máx = 17,19, Percentual = 80%
```
FT = (17,19 + 80) / 100
FT = 97,19 / 100
FT = 0,9719
```

### 4. Intensidade do Treinamento (IT)
**Fórmula:** `IT = MET Máx × FT`

**Exemplo:** MET Máx = 17,19, FT = 0,9719
```
IT = 17,19 × 0,9719
IT = 16,71
```

### 5. Velocidade do Treino
**Fórmula:** `Velocidade = (IT × 1000) / 60`

**Exemplo:** IT = 16,71
```
Velocidade = (16,71 × 1000) / 60
Velocidade = 16710 / 60
Velocidade = 278,5 m/min
```

### 6. Distância do Treino (DT)
**Fórmula:** `DT = Velocidade × Tempo`

**Exemplo:** Velocidade = 278,5 m/min, Tempo = 40min
```
DT = 278,5 × 40
DT = 11.140 metros
```

## 🔬 Cálculos Complementares

### 7. Consumo de O2 por Minuto
**Fórmula:** `Cons. O2/min = (VO2max × % / 100) × Peso / 1000`

**Exemplo:** VO2max = 60,18, % = 80, Peso = 70kg
```
Cons. O2/min = (60,18 × 80 / 100) × 70 / 1000
Cons. O2/min = (60,18 × 0,8) × 70 / 1000
Cons. O2/min = 48,14 × 70 / 1000
Cons. O2/min = 3,37 L/min
```

### 8. Consumo Total de O2
**Fórmula:** `Cons. O2 Total = Cons. O2/min × Duração`

**Exemplo:** Cons. O2/min = 3,37, Duração = 40min
```
Cons. O2 Total = 3,37 × 40
Cons. O2 Total = 134,8 L
```

### 9. Gasto Calórico
**Fórmula:** `Gasto Calórico = Cons. O2 Total × 5`

**Exemplo:** Cons. O2 Total = 134,8 L
```
Gasto Calórico = 134,8 × 5
Gasto Calórico = 674 Cal
```

### 10. Peso Perdido
**Fórmula:** `Peso Perdido = Gasto Calórico × 1000 / 7730`

**Exemplo:** Gasto Calórico = 674 Cal
```
Peso Perdido = 674 × 1000 / 7730
Peso Perdido = 674000 / 7730
Peso Perdido = 87,2g
```

## 📊 Exemplo Completo

**Dados de Entrada:**
- Distância Cooper: 3200m
- Intensidade: 80%
- Tempo de Treino: 40min
- Peso Corporal: 70kg

**Resultados Calculados:**
1. VO2 Máximo: 60,18 ml/kg/min
2. MET Máximo: 17,19
3. Fração do Treinamento: 0,9719
4. Intensidade do Treinamento: 16,71
5. Velocidade do Treino: 278,5 m/min
6. Distância do Treino: 11.140 metros
7. Consumo O2/min: 3,37 L/min
8. Consumo Total de O2: 134,8 L
9. Gasto Calórico: 674 Cal
10. Peso Perdido: 87,2g

## ⚠️ Observações Importantes

1. **Percentual de Intensidade:** Deve ser inserido como valor inteiro (ex: 80 para 80%)
2. **Conversão de Unidades:** IT é convertido de km/h para m/min multiplicando por 1000 e dividindo por 60
3. **Precisão:** Valores são arredondados para 2-4 casas decimais conforme necessário
4. **Validação:** Distância Cooper deve estar entre 500-5000 metros
5. **Peso Corporal:** Obrigatório para cálculos complementares

## 🔄 Validação dos Cálculos

Para validar se os cálculos estão corretos, sempre verifique:
- VO2max deve estar entre 20-80 ml/kg/min para valores realistas
- MET Máx deve estar entre 6-23 para valores normais
- FT deve ser um valor decimal entre 0,5-1,0
- Velocidade deve resultar em valores razoáveis para corrida (100-500 m/min)
- Distância do treino deve ser proporcional ao tempo e intensidade

## 📝 Histórico de Alterações

- **v1.0** - Fórmula original: VO2max = (Distância - 504,9) / 44,73
- **v2.0** - Fórmula atualizada: VO2max = (Distância - 504,1) / 44,8
- **v2.1** - Correção FT: (MET Máx + percentual) / 100
- **v2.2** - Correção velocidade: (IT × 1000) / 60
