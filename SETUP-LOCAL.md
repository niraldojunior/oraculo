# 🚀 Guia: Rodar Oráculo Localmente com Supabase

## 1️⃣ Pré-requisitos
- [Node.js](https://nodejs.org) v18+
- Conta no [Supabase](https://supabase.com) (gratuita)

## 2️⃣ Configurar Supabase

### A. Criar Projeto no Supabase
1. Acesse https://app.supabase.com
2. Clique em "New project"
3. Escolha um nome e senha do PostgreSQL
4. Aguarde o build (~2 minutos)

### B. Pegar Credenciais
1. Acesse em: **Settings → Database → Connection**
2. Copie a string de conexão PostgreSQL (escolha **URI** ou **Params**, copie **URI**)
3. Deverá parecer com:
   ```
   postgresql://postgres.xxxxx:password@db.xxxxx.supabase.co:5432/postgres
   ```

## 3️⃣ Configurar Arquivo .env.local

Edite `.env.local` na raiz do projeto e substitua os valores:

```env
DATABASE_URL="postgresql://postgres.xxxxx:password@db.xxxxx.supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres.xxxxx:password@db.xxxxx.supabase.co:5432/postgres"
PORT=3001
```

## 4️⃣ Executar em Dois Terminais

### **OPÇÃO A: PowerShell (Recomendado)**

**Terminal 1 - Backend:**
```powershell
.\run-backend.ps1
```

**Terminal 2 - Frontend:**
```powershell
.\run-frontend.ps1
```

### **OPÇÃO B: CMD/PowerShell**

**Terminal 1 - Backend:**
```cmd
run-backend.bat
```

**Terminal 2 - Frontend:**
```cmd
run-frontend.bat
```

## 5️⃣ Parar a Aplicação
Pressione **CTRL+C** em cada terminal

## 📝 Alternativa: Rodar Manualmente

Se o script não funcionar:

**Terminal 1 (Backend):**
```bash
npm run server
```

**Terminal 2 (Frontend):**
```bash
npm run dev
```

## 🆘 Troubleshooting

### Erro: "Cannot find module @prisma/client"
```bash
npx prisma generate
```

### Erro: "Failed to connect to database"
- Verifique se a credencial do Supabase está correta em `.env.local`
- Verifique se a senha contém caracteres especiais (encode em URL se necessário)
- Teste a conexão: `npx prisma db push`

### Frontend não conecta ao backend
- Verifique se backend está rodando em `http://localhost:3001`
- Abra DevTools (F12) → Network → veja se `/api` está retornando erro

---

📧 **Dúvidas?** Abra uma issue no GitHub!
