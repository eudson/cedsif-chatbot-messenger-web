# CEDSIF Chatbot - Guia de Desenvolvimento

## 🚀 Executar Aplicações

### Opção 1: Executar Admin e Widget Simultaneamente (Recomendado)

```bash
# Usando npm script
npm run start:both

# Ou diretamente o script
./run-dev.sh
```

**URLs:**
- Widget (chatbot): http://localhost:4200
- Admin (gestão): http://localhost:4201

### Opção 2: Executar Separadamente

**Terminal 1 - Widget:**
```bash
npm run start:widget
# ou
ng serve chatbot-widget --port 4200
```

**Terminal 2 - Admin:**
```bash
npm start
# ou
ng serve chatbot-admin --port 4201
```

## 📦 Build para Produção

### Build Admin
```bash
npm run build
# Output: dist/chatbot-admin/
```

### Build Widget
```bash
npm run build:widget
# Output: dist/chatbot-widget/
```

### Build Widget como Web Component
```bash
npm run build:widget:elements
# Output: dist/chatbot-widget/chatbot-widget.js (bundled)
```

### Build Tudo
```bash
npm run build:all
```

## 🔧 Estrutura do Workspace

```
cedsif-chatbot-web/
├── projects/
│   ├── chatbot-admin/       → Aplicação de gestão (porta 4201)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── index.html
│   │   │   └── main.ts
│   │   └── ...
│   └── chatbot-widget/      → Widget de chat (porta 4200)
│       ├── src/
│       │   ├── app/
│       │   ├── index.html
│       │   └── main.ts
│       └── ...
├── angular.json
├── package.json
└── run-dev.sh
```

## 🌐 Configuração de Portas

As portas estão configuradas em `angular.json`:

- **chatbot-widget**: porta 4200 (padrão Angular)
- **chatbot-admin**: porta 4201

Para alterar, edite `angular.json` → `projects` → `[projeto]` → `architect` → `serve` → `options` → `port`

## 📝 Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm start` | Executa Admin na porta 4201 |
| `npm run start:widget` | Executa Widget na porta 4200 |
| `npm run start:both` | Executa Admin e Widget simultaneamente |
| `npm run build` | Build de produção do Admin |
| `npm run build:widget` | Build de produção do Widget |
| `npm run build:all` | Build de ambos os projetos |
| `npm test` | Executa testes |

## 🔗 Backend API

Por padrão, as aplicações esperam que o backend esteja em:
- **API**: http://localhost:8080

Configure em:
- Admin: `projects/chatbot-admin/src/environments/environment.ts`
- Widget: `projects/chatbot-widget/src/environments/environment.ts`

## 📚 Mais Informações

- [Angular 19 Documentation](https://angular.dev)
- [Angular Material](https://material.angular.io)
- [Angular Elements](https://angular.io/guide/elements)
