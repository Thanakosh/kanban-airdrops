# AirdropBoard

![AirdropBoard Logo](input_file_0.png)

O **AirdropBoard** é um quadro Kanban local-first para acompanhar oportunidades de airdrop, tarefas e prazos sem depender de backend. Tudo fica salvo no `localStorage` do navegador.

## O que o app faz

- Organiza oportunidades em colunas personalizáveis.
- Cria cartões com descrição, prioridade, prazo, link, tags e checklist.
- Filtra por texto, status e prioridade.
- Mostra dashboard com estatísticas e calendário de prazos.
- Exporta e importa dados em JSON.
- Suporta tema claro/escuro e interface multilíngue.

## Melhorias do MVP atual

- Estado vazio com ação clara para começar o quadro.
- Modelo inicial de colunas para o primeiro uso.
- Resumo do workspace já na tela principal.
- Fluxo de edição de cartão corrigido, incluindo troca de coluna pelo modal.
- Link de projeto tratado corretamente quando o campo fica vazio.

## Como executar

Como é um projeto estático, você pode abrir o `index.html` direto no navegador. Para servir localmente:

```bash
npm start
```

Isso executa:

```bash
python -m http.server 8000
```

Depois abra `http://localhost:8000`.

## Stack

- HTML
- CSS
- JavaScript vanilla
- Bootstrap 5
- Font Awesome
- Chart.js
- FullCalendar

## Estrutura principal

- `index.html`: estrutura da interface
- `style.css`: visual principal do app
- `kanban.js`: modelo, view, controller e i18n
- `config.js`, `utils.js`, `notifications.js`: suporte e utilidades

## Observações

- Os dados são locais ao navegador e ao dispositivo.
- Exporte o JSON periodicamente se quiser backup manual.
- Ainda não há suíte automatizada de testes.

## Licença

MIT. Veja [`LICENSE`](LICENSE).
