# Performance Testing — Oracle DB

## Visão geral

A suíte de testes de performance do Oraculo mede latência, throughput e eficiência do pool de conexões do **OracleService** e repositórios Oracle sob condições variadas. O objetivo é:

1. **Detectar regressões** de performance entre versões
2. **Validar SLA** (< 50ms para CRUD, < 100ms para bulk ops)
3. **Benchmarking** de operações críticas (Initiative CRUD, queries complexas)
4. **Análise de pool** de conexões sob concorrência

### Status

- **Status:** Implementado (junho 2025)
- **Cobertura:** CRUD (Initiative), bulk operations, connection pool, query complexity
- **SLA target:** < 50ms operações single, < 100ms bulk
- **Dependências:** Instância Oracle real, credenciais em `.env.local`

---

## Setup

### Pré-requisitos

Uma instância Oracle acessível e as seguintes variáveis em `.env.local`:

```sh
# Oracle connection (requerido para performance tests)
ORACLE_USER=seu_usuario
ORACLE_PASSWORD=sua_senha
ORACLE_CONNECTION_STRING=your-oracle-host:1521/seu_service

# Pool configuration (opcional, usa defaults se omitido)
ORACLE_POOL_MIN=5
ORACLE_POOL_MAX=20
ORACLE_POOL_TIMEOUT_SECONDS=60
ORACLE_POOL_PING_INTERVAL_SECONDS=60
```

### Preparação de dados

A suíte cria e limpa seus próprios dados de teste (prefixo `[PERF]` no título). Nenhuma preparação prévia é necessária — os testes são idempotentes e isolados por `companyId`/`departmentId` de teste.

---

## Rodando os testes

### Comando básico

```bash
npm run api:test:performance
```

Sobe os testes de performance com:
- Timeout: 300s (5 minutos) por test case
- Reporter: console + XML (JUnit) em `./test-results/oracle-performance.xml`
- Execução sequencial (--runInBand) para evitar race conditions no pool

### Saída esperada

```
PASS  src/test/performance/oracle.performance.spec.ts

  [ORACLE PERFORMANCE] Integration Tests
    CRUD Operations - Initiative
      ✓ should measure CREATE latency (single record) (23.4ms)
      ✓ should measure READ latency (findById) (15.8ms)
      ✓ should measure UPDATE latency (single record) (42.3ms)
      ✓ should measure DELETE latency (single record) (18.9ms)
    Bulk Operations
      ✓ should measure CREATE latency for 10 records sequentially (487.2ms)
      ✓ should measure CREATE latency for 5 records in parallel (123.4ms)
      ✓ should measure LIST latency (listByScope with 50+ records) (45.6ms)
    Connection Pool Behavior
      ✓ should measure concurrent single-record operations (10 parallel) (156.7ms)
      ✓ should measure concurrent mixed operations (reads + writes) (234.5ms)
    Query Complexity - Deep Objects
      ✓ should measure latency of Initiative with deep hierarchy (milestones + tasks) (78.9ms)

=== PERFORMANCE REPORT ===
Total: 10 | Passed: 10 | Failed: 0 (100%)
Min: 15.80ms | Avg: 98.73ms | Max: 487.20ms

✅ All performance tests passed SLA
```

### Com JSON output estruturado

Os resultados são exportados em `./test-results/oracle-performance-report.json`:

```json
{
  "summary": {
    "total": 10,
    "passed": 10,
    "failed": 0,
    "passRate": "100%"
  },
  "stats": {
    "min": "15.80ms",
    "max": "487.20ms",
    "avg": "98.73ms"
  },
  "measures": [
    {
      "name": "CREATE Single Initiative",
      "operation": "create",
      "duration": 23.4,
      "slaThreshold": 50,
      "status": "pass",
      "slaViolation": false,
      "metadata": {
        "recordCount": 1
      }
    }
  ],
  "violations": []
}
```

---

## Interpretando resultados

### Checklist de sucesso

- ✅ **Passou**: Todos os testes executaram; `summary.failed === 0`
- ✅ **SLA respeitado**: Nenhum item em `violations[]`
- ✅ **Estável**: Múltiplas rodadas (sem mudanças de código) têm `avg` similar (< 20% variância)

### SLA violations

Se um teste falhar, aparecerá em `violations[]`:

```json
{
  "name": "CREATE 10 Initiatives (sequential)",
  "duration": 625.3,
  "slaThreshold": 100,
  "slaViolation": true
}
```

**Ações:**
1. Verifique a carga do Oracle (CPU, I/O)
2. Verifique se o pool está esgotado (aumente `ORACLE_POOL_MAX` se necessário)
3. Analise a query (EXPLAIN PLAN) se for query complexity
4. Compare com rodada anterior — se for regressão, investigue mudanças de código recentes

### Variância natural

Performance varia naturalmente por:
- Carga do Oracle (outros processos, agendamentos)
- Latência de rede
- Cache Oracle (buffer pool state)

**Dica**: rode 3 vezes em condições calmas; calcule média e desvio padrão; use como baseline.

---

## Estrutura dos testes

### Operações medidas

| Categoria | Test | SLA | Nota |
|---|---|---|---|
| **CRUD** | CREATE single | 50ms | Inserção de Initiative simples |
| | READ (findById) | 50ms | Busca por ID sem milestones |
| | UPDATE single | 50ms | Atualização de campos |
| | DELETE single | 50ms | Remoção completa |
| **Bulk** | CREATE 10 seq | 1000ms (10×100) | Insere 10 registros em loop |
| | CREATE 5 parallel | 200ms | Insere 5 em Promise.all() |
| | LIST (listByScope) | 100ms | Busca 50+ registros |
| **Pool** | 10 concurrent READs | 200ms | 10 findById em paralelo |
| | 5 mixed (2W+3R) | 200ms | Reads + Writes em paralelo |
| **Query** | Deep (2 milestones, 5 tasks) | 100ms | Hierarchy com JOINs |

### Utilitários de medição

Veja `src/test/performance/perf.utils.ts`:

- `PerfTimer.trackAsync()` — mede operação async, retorna `{ result, measure }`
- `PerfTimer.trackSync()` — versão síncrona
- `PerfTimer.getMeasures()` — array de todas as medições
- `PerfTimer.getReport()` — summary com stats e violations
- `PerfTimer.printReport()` — imprime relatório em console
- `concurrentRequests(count, fn)` — executa `fn` `count` vezes em paralelo

### Exemplo de uso

```typescript
const { result, measure } = await perfTimer.trackAsync(
  'CREATE Single Initiative',
  'create',
  () => initiativeRepo.create(payload),
  50,  // SLA threshold (ms)
  { recordCount: 1 }  // metadata
);

expect(measure.duration).toBeLessThan(50);
expect(result.id).toBeDefined();
```

---

## Adicionando novos testes

### Passo 1: Defina o test case

```typescript
it('should measure [OPERATION] latency ([SCENARIO])', async () => {
  // setup
  const testData = ...;

  // measure
  const { result, measure } = await perfTimer.trackAsync(
    '[TEST NAME]',
    '[operation]',
    () => repositoryMethod(testData),
    SLA_THRESHOLD,
    { /* metadata */ }
  );

  // assert
  expect(measure.duration).toBeLessThan(SLA_THRESHOLD);
  expect(result).toBeDefined();
});
```

### Passo 2: Escolha SLA apropriado

| Operação | SLA | Justificativa |
|---|---|---|
| Single CRUD | 50ms | Repouso de latência de rede (~20ms) + query parsing (~10ms) + I/O (20ms) |
| Bulk INSERT/UPDATE | 1000ms cumulative | Permite time linear em contagem |
| LIST (< 100 records) | 100ms | Single query + desserialização |
| Pool stress | 200ms | Contention + wait time permitido |

### Passo 3: Adicione metadata útil

```typescript
{
  recordCount: 50,
  mode: 'sequential',
  complexity: 'deep',
  milestones: 2,
  tasks: 10
}
```

Isso aparece no JSON report e ajuda a debugar.

### Passo 4: Rode localmente

```bash
npm run api:test:performance
```

Verificar output e JSON report em `./test-results/`.

---

## Integrando com CI/CD

### GitHub Actions (exemplo)

```yaml
name: Performance Tests

on: [push, pull_request]

jobs:
  perf:
    runs-on: ubuntu-latest
    services:
      oracle:
        image: gvenzl/oracle-xe:latest
        env:
          ORACLE_RANDOM_PASSWORD: true
        options: >-
          --health-cmd healthcheck.sh
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - run: npm ci
      - run: npm run oracle:schema  # create schema
      - run: npm run api:test:performance
      
      - name: Upload performance report
        uses: actions/upload-artifact@v3
        with:
          name: perf-report
          path: test-results/oracle-performance-report.json
```

### Validação de SLA em CI

```bash
# Fail if any violation
cat test-results/oracle-performance-report.json | jq '.violations | length' | grep -q '^0$' || exit 1
```

---

## Troubleshooting

### "pool is not initialized" / "Missing required environment variable"

**Causa**: Credenciais Oracle não configuradas.

**Solução**:
```bash
export ORACLE_USER=seu_usuario
export ORACLE_PASSWORD=sua_senha
export ORACLE_CONNECTION_STRING=host:1521/service
npm run api:test:performance
```

### Testes muito lentos (> 600ms para CRUD)

**Causa possível**: Pool esgotado, queries lentas, ou Oracle sobrecarregado.

**Diagnóstico**:
```sql
-- No Oracle SQL*Plus
SELECT COUNT(*) FROM v$session WHERE status = 'ACTIVE';
SELECT * FROM v$sysstat WHERE name LIKE '%session%';
```

**Solução**:
1. Aumente `ORACLE_POOL_MAX` (default 10)
2. Rode em horário calmo (fora de backups/índices)
3. Analise EXPLAIN PLAN das queries lentes

### "Jest timeout"

**Causa**: 1+ teste levou > 300s.

**Solução**: Revise threshold no `jest.performance.config.ts` ou otimize a operação.

---

## Controle de revisões

| Data | Versão | Mudança |
|---|---|---|
| jun/2025 | 1.0 | Implementação inicial: CRUD, bulk ops, pool tests, SLA < 50ms |
