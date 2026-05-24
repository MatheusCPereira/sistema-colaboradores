# Sistema de Colaboradores QLP — IPAUSSU 2026

Sistema web completo de cadastro e pesquisa de colaboradores.

---

## Pré-requisitos
- **Node.js** v18 ou superior: https://nodejs.org/
- **pandas**
- **openpyxl**

---

## Instalação

```bash
# 1. Extraia todos os arquivos do projeto
# 2. Entre na pasta do projeto
cd sistema-colaboradores

# 3. Instale as dependências
npm install

# 4. Inicie o servidor
node server.js
```

O sistema estará disponível em: **http://localhost:3000**

---

## Login padrão

| Usuário | Senha     | Perfil        |
|---------|-----------|---------------|
| admin   | admin123  | Administrador |

> ⚠️ **Troque a senha do admin assim que entrar pela primeira vez!**
> Acesse → Usuários do Sistema → Editar → Nova Senha

---

## Perfis de acesso

| Perfil          | Visualizar | Cadastrar | Editar | Excluir | Gerenciar Usuários |
|-----------------|:----------:|:---------:|:------:|:-------:|:------------------:|
| Visualizador    |     ✅     |     ❌    |   ❌   |    ❌   |         ❌         |
| Editor          |     ✅     |     ✅    |   ✅   |    ❌   |         ❌         |
| Administrador   |     ✅     |     ✅    |   ✅   |    ✅   |         ✅         |

---

## Estrutura do projeto

```
sistema-colaboradores/
├── server.js          — Servidor Express (backend)
├── database.js        — Camada de dados (Excel / preparado para SQL)
├── package.json       — Dependências Node
├── data/
│   ├── colaboradores.xlsx  — Base de dados (planilha original)
│   └── users.json          — Usuários do sistema (criado automaticamente)
└── public/
    ├── css/style.css  — Estilos globais
    ├── js/app.js      — Utilitários JavaScript
    ├── login.html
    ├── dashboard.html
    ├── colaboradores.html
    ├── cadastro.html
    └── usuarios.html
```

---

## Funcionalidades

- **Login seguro** com sessão de 8 horas
- **Dashboard** com estatísticas em tempo real
- **Listagem** com busca, filtros e paginação
- **Cadastro** de novos colaboradores (formulário completo)
- **Edição** de dados via modal
- **Exclusão** (somente admins)
- **Gerenciamento de usuários** com controle de perfis

---

## Migração futura para SQL

O arquivo `database.js` contém uma camada de abstração.
Para migrar para MySQL/PostgreSQL:

1. Instale `mysql2` ou `pg`
2. Crie as tabelas (ver scripts em `/data/schema.sql` — a gerar)
3. Substitua as funções em `database.js` pelas equivalentes SQL
4. Todas as rotas em `server.js` permanecem inalteradas

---

## Segurança

- Senhas armazenadas com **bcrypt** (hash + salt)
- Sessões server-side com chave secreta
- Todas as rotas de API requerem autenticação
- Rotas admin verificam perfil de acesso no servidor
- Páginas HTML protegidas no backend (sem bypass via URL)
