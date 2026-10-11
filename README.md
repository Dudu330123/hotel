# Hotel Aurora PMS

Protótipo desktop-first de um painel interno para gestão hoteleira.

## Rodar localmente

```bash
npm install
npm run dev
```

Para validar a versão de produção:

```bash
npm run build
npm run preview
```

## Estrutura

- `src/App.tsx`: composição das telas, navegação e interações do protótipo.
- `src/data/mockData.ts`: fonte de dados fictícios usada nesta primeira fase.
- `src/types/dashboard.ts`: contratos entre a interface e a fonte de dados.

A interface usa uma fonte de dados abstrata (`DashboardDataSource`). A próxima etapa pode adicionar uma implementação com Supabase sem reescrever os componentes do painel.

## Escopo atual

O painel inclui indicadores, gráficos, tabelas, filtro de período, busca demonstrativa, navegação entre módulos e modal de nova reserva. Os demais módulos estão preparados como estados de protótipo para validação visual.
