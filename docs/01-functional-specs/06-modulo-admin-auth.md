# Módulo 6 — Admin & Autenticação

> Status: **Produção** (com gap de segurança conhecido — ver §7 e [security.md](../02-system-design/security.md)). Entidade: `AuthUser` (não é um model Prisma próprio — é a visão de autenticação sobre `Collaborator`).

## 1. Propósito do módulo

Autenticar colaboradores e controlar o acesso à área administrativa (`/admin`) do frontend.

## 2. Entidade

```ts
// src/domain/entities/Auth.ts
interface AuthUser {
  id: string; email: string; password: string; name: string;
  isAdmin: boolean; companyId: string; departmentId: string;
  role: string; associatedCompanyIds: string[];
}
interface LoginResult { user: AuthUser; isAdmin: boolean; type: 'collaborator'; }
```

`AuthUser` não é uma entidade separada no schema Prisma — é a projeção de `Collaborator` usada no fluxo de login (`AuthRepository.findCollaboratorByEmail`).

## 3. Regras de negócio

Fonte: `src/application/services/auth.service.ts`.

- `login(email, password)` normaliza o email (`trim().toLowerCase()`) e busca o colaborador correspondente.
- **Comparação de senha em texto plano**: `user.password !== password` — não há hashing (bcrypt/argon2/scrypt) em nenhum ponto do fluxo. Ver [security.md](../02-system-design/security.md) para o gap completo.
- Se usuário não encontrado ou senha incorreta: `UnauthorizedException('Credenciais inválidas')`.
- **Sem emissão de token/sessão no backend** — `login()` retorna o objeto do usuário diretamente. Persistência de sessão no cliente é responsabilidade do frontend (`web/src/context/AuthContext.tsx`).
- **Um único tipo de usuário**: `type: 'collaborator'` é fixo — não existe hoje um segundo papel de autenticação (ex.: usuário de sistema/API key).
- Acesso à área `/admin` é decidido no frontend por `isAdmin` (`ProtectedRoute adminOnly` em `App.tsx`) — não há um guard/middleware de autorização no backend que bloqueie chamadas de API por `isAdmin`.

## 4. Endpoints

| Método | Rota | Body | Descrição |
|---|---|---|---|
| POST | `/auth/login`, `/api/auth/login` | `LoginDto { email, password }` | Autentica colaborador |

`LoginDto` (`src/application/dtos/auth.dto.ts`): `email` validado com `@IsEmail`, `password` com `@IsString`. Não existem DTOs de registro, troca de senha ou refresh — esses fluxos não existem no backend hoje.

## 5. Fluxo ilustrativo

```
1. Usuário submete email/senha em LoginPage.
2. POST /auth/login → AuthService.login() → comparação direta de senha.
3. Frontend recebe { user, isAdmin, type } e persiste no AuthContext (mecanismo de persistência fora do escopo do backend).
4. ProtectedRoute do React Router decide acesso a rotas autenticadas/admin com base em isAdmin vindo do contexto.
```

## 6. Contratos com outros módulos

| Módulo | Tipo de consumo | Detalhe |
|---|---|---|
| Organização | Fonte de dados | `AuthUser` é uma projeção de `Collaborator` — `isAdmin`, `companyId`, `departmentId` vêm do mesmo registro usado em Organização |

## 7. Questões em aberto / dívida técnica conhecida

- **Senha em texto plano é o gap de segurança mais crítico do sistema** — qualquer mudança aqui deve ser tratada como projeto próprio (migração de dados existentes), não como fix pontual. Ver [security.md](../02-system-design/security.md).
- **Sem autorização no backend por `isAdmin`** — rotas administrativas de outros módulos (ex.: criação de `Company`/`Department`) não parecem ter guard de admin no controller; a proteção é só de UI. Precisa validação explícita antes de considerar o backend seguro para exposição externa.
- **Sem expiração/invalidação de sessão** — como não há token, não há conceito de logout server-side ou expiração de sessão.

---

## Controle de revisões

| Data | Autor | Mudança |
|---|---|---|
| 2026-07-16 | Agente de IA (Claude) | Criação inicial. |
