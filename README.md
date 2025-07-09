
# 📦 Sistema de Processamento de Pedidos com Upload de Comprovantes

## 🎯 Objetivo
Criar uma API robusta onde:
- Usuários possam cadastrar pedidos com upload de imagens (ex: comprovantes, imagens de referência, etc.)
- Admins possam aprovar, rejeitar e acompanhar esses pedidos
- Tarefas pesadas (processamento de imagem, envio de email, atualizações de status) sejam feitas em background com **BullMQ**

---

## 🧱 Arquitetura Geral

### 📦 Backend
- **Node.js + TypeScript**
- **Express** para rotas e middlewares
- **BullMQ** para filas assíncronas
- **Redis** como broker da fila
- **JWT + Bcrypt** para autenticação com controle de acesso por **roles** (`user` e `admin`)
- **Cloudinary** (ou S3) para armazenar imagens
- **Nodemailer** para envio de e-mails
- **Docker** para containerização
- **NGINX** como proxy reverso
- **Banco de dados:** PostgreSQL com **Prisma ORM**

---


## 🧑‍💻 Funcionalidades

### Usuário Comum
- POST /register — criar conta
- POST /login — login com JWT
- POST /orders — criar novo pedido com imagem (upload)
- GET /orders — listar seus pedidos
- GET /orders/:id — ver detalhes do pedido

### Admin
- GET /admin/orders — listar todos os pedidos
- PATCH /admin/orders/:id — aprovar ou rejeitar pedido

---

## 📊 Entidades (modelo de dados)

### User
- id
- name
- email
- password
- role (`user` | `admin`)
- createdAt

### Order
- id
- userId
- title
- description
- imageUrl
- status (`pending` | `processing` | `approved` | `rejected`)
- createdAt
- processedAt

---

## 🔁 BullMQ - Tarefas Assíncronas

- **Job:** `processOrder`
  - Tarefa:
    - Redimensionar imagem (opcional)
    - Enviar e-mail de "Pedido recebido"
    - Alterar status para `processing`
    - Simular aprovação automática (opcional)
    - Enviar e-mail de resultado

---

## 📬 Email (Nodemailer)

- Confirmação de envio de pedido
- Resultado de aprovação ou rejeição

---

## 🐳 Docker e NGINX

- Containers:
  - API (Node)
  - Redis
  - PostgreSQL
- NGINX como proxy reverso

---

## ✅ Requisitos Funcionais

1. Cadastro e login de usuários com roles.
2. Criação de pedidos com upload de imagem.
3. Listagem e detalhamento de pedidos para o usuário.
4. Acesso a todos os pedidos e moderação para admin.
5. Armazenamento de imagens externo.
6. Processamento assíncrono com BullMQ.
7. Envio de emails automáticos.
8. Acompanhamento de status de pedidos.

---

## 🚫 Regras de Negócio

1. Apenas usuários autenticados podem criar pedidos.
2. Um usuário só vê seus próprios pedidos.
3. Apenas admin vê todos os pedidos e aprova/rejeita.
4. Status do pedido segue ciclo: pending → processing → approved/rejected.
5. Um pedido não pode ser aprovado/rejeitado mais de uma vez.
6. Tipos de imagens aceitas: `.png`, `.jpg`, `.jpeg`.

---

## 📚 Documentação da API

A API possui documentação interativa completa com **Swagger UI**, incluindo:

### 🎨 Temas Visuais Personalizados
- **8 temas únicos** disponíveis (escuro, claro, neon, cyberpunk, material design, oceânico, pôr do sol, roxo)
- **Fácil troca de temas** editando uma linha de código
- **Interface responsiva** para desktop e mobile

### 📖 Acesso à Documentação
```bash
# Executar a aplicação
npm run dev

# Acessar documentação
http://localhost:3001/api-docs
```

### 🔧 Personalizando Temas
Veja o guia completo: [SWAGGER_THEMES_GUIDE.md](./SWAGGER_THEMES_GUIDE.md)

### 📄 Outras Documentações
- [Guia de Configuração CORS](./CORS_GUIDE.md)
- [Guia de Uso do Swagger](./SWAGGER_GUIDE.md)
- [Lista de Tarefas Pendentes](./TODO.md)

---

## ⚙️ Requisitos Não Funcionais

1. API containerizada com Docker.
2. Uso de NGINX como reverse proxy.
3. Autenticação via JWT.
4. Uploads armazenados externamente.
5. Banco de dados relacional com Prisma/PostgreSQL.
6. Fila BullMQ com Redis.
7. Código modular e tipado com TypeScript.
8. Logs básicos e estrutura RESTful.
