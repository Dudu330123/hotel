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
- `src/data/supabaseDataSource.ts`: ponte inicial para perfil autenticado no Supabase.
- `src/lib/supabase.ts`: cliente Supabase opcional, ativado por variáveis de ambiente.
- `src/types/dashboard.ts`: contratos entre a interface e a fonte de dados.
- `supabase/schema.sql`: estrutura inicial do banco, políticas RLS e dados-base de quartos.

A interface usa uma fonte de dados abstrata (`DashboardDataSource`). A próxima etapa pode adicionar uma implementação com Supabase sem reescrever os componentes do painel.

## Supabase

O esquema inicial já está preparado no projeto Supabase `Hotel.teste`. Para conectar localmente, copie `.env.example` para `.env.local` e preencha a URL do projeto e a chave pública `anon`/`publishable`.

Nunca coloque a chave `service_role` no navegador ou no repositório.

## Escopo atual

O painel inclui indicadores, gráficos, tabelas, filtro de período, busca demonstrativa, navegação entre módulos e modal de nova reserva. Os demais módulos estão preparados como estados de protótipo para validação visual.
