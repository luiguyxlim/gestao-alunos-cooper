# Documentação dos Cálculos VO2 - Cooper Pro

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
