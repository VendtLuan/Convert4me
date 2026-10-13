## Description

API para converter relatório SOULMV (PDF — Lista de Pacientes Agendados) em planilha Excel.

### Testar no Postman

1. Importe `postman/convert4me.postman_collection.json` e, opcionalmente, `postman/local.postman_environment.json`.
2. Request **Converter PDF para Excel** (Body → **form-data**):
   - **Produção (Genesys):** `conversationId`, `messageId` (texto) e `Authorization: Bearer <token Genesys>`. Não envie `file`; o PDF vem do anexo da mensagem.
   - **Desenvolvimento / teste local:** envie `file` (PDF). A Genesys **não** é chamada; `conversationId` e `messageId` são opcionais.
3. Para baixar o `.xlsx`, use **Send and Download** (menu na seta ao lado de **Send**) ou **Save response** → **Save to a file** após enviar.
4. Não adicione header `Content-Type` manual; deixe o Postman montar o multipart.

Servidor local: `npm run start:dev` → `http://localhost:3000`.

### Autenticação

O endpoint `POST /convert` repassa o Bearer para a API Genesys (`GENESYS_API_URL` no `.env`):

```http
Authorization: Bearer <token Genesys>
```

Configure `GENESYS_API_URL` em `.env` na raiz do projeto (veja `.env.example`). O arquivo é carregado na subida via `dotenv` em `main.ts`.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test
```