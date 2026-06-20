# Migration Runbook: Supabase -> Oracle

## Goal
Clone schema and data from Supabase (PostgreSQL) to Oracle with deterministic validation and rollback safety.

## Scope
- Source: Supabase PostgreSQL (current production-like source of truth).
- Target: Corporate Oracle instance (VPN required).
- Result: Oracle schema and data parity for backend runtime with DB_PROVIDER=oracle.

## Prerequisites
- VPN connected.
- Source credentials available (Supabase read access).
- Target credentials available (Oracle DDL + DML access).
- Maintenance window approved for cutover.

## Required Environment Variables

```env
# Source (Supabase / PostgreSQL)
SUPABASE_DATABASE_URL="postgresql://..."

# Target (Oracle)
ORACLE_USER="..."
ORACLE_PASSWORD="..."
ORACLE_CONNECTION_STRING="host:1521/service_name"

# Runtime switch
DB_PROVIDER="oracle"
```

## Migration Phases

1. Discovery and connectivity
- Validate source and target connectivity.
- Record database versions, timezone, charset, and target schema owner.

2. Logical freeze and cut line (T0)
- Define T0 for consistent extraction.
- If needed, execute initial load + final delta.

3. Schema inventory
- Extract full PostgreSQL metadata:
  - tables, columns, data types
  - PK/FK/unique/check constraints
  - indexes
  - sequences/defaults
  - enums, views, triggers, policies

4. Type mapping (PostgreSQL -> Oracle)
- UUID -> VARCHAR2(36) (or RAW(16) if normalized strategy is chosen).
- JSON/JSONB -> CLOB with JSON constraint (or native JSON type depending on Oracle version).
- Arrays -> JSON column or relational child table strategy.
- BOOLEAN -> NUMBER(1) CHECK (0/1) or CHAR(1) convention.
- TIMESTAMP WITH TIME ZONE -> TIMESTAMP WITH TIME ZONE.
- TEXT -> CLOB.

5. Oracle DDL generation
- Generate idempotent scripts ordered by dependency.
- Create tables first, then constraints and indexes.

6. Initial data load
- Export source in batches.
- Import into Oracle in topological order (parent tables first).
- Use transaction batching and reject logging.

7. Post-load normalization
- Reconcile identities/sequences.
- Rebuild heavy indexes if delayed.
- Refresh table/index stats.

8. Integrity validation
- Row counts by table.
- Checksums by deterministic chunks.
- FK orphan detection.
- Functional smoke queries for critical entities.

9. Delta sync and cutover
- Sync writes changed after T0.
- Re-run validations.
- Switch runtime by DB_PROVIDER=oracle.

10. Rollback plan
- Keep fallback path to Supabase.
- Define rollback trigger criteria and communication path.

## Suggested Automation Scripts
- scripts/migration/schema-map.ts
- scripts/migration/supabase-export.ts
- scripts/migration/oracle-import.ts
- scripts/migration/verify-counts.ts
- scripts/migration/verify-checksum.ts

## Acceptance Criteria
- Zero blocking integrity errors.
- Row count parity for all core tables.
- Core API smoke tests passing with DB_PROVIDER=oracle.
- Cutover + rollback rehearsed before production switch.
