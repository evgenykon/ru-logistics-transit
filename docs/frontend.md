# Frontend Subsystem

**Stack:** Nuxt 4 + Vue 3 + TypeScript + Tailwind CSS + SCSS + Pinia

## Entry Point

`frontend/app.vue` — Nuxt SSR application on port 3000.

## Structure

```
frontend/
├── app.vue               # root component
├── error.vue             # error page
├── nuxt.config.ts        # Nuxt configuration
├── assets/scss/          # design tokens, fonts
├── pages/                # route pages
├── components/           # Vue components
├── layouts/              # layout components
├── composables/          # reusable composition functions
├── stores/               # Pinia stores
├── plugins/              # Nuxt plugins
├── middleware/            # route middleware
├── services/             # API clients
├── types/                # TypeScript types
├── constants/            # route paths, enums
├── utils/                # utility functions
├── public/               # static assets
└── server/               # Nitro server routes (metrics, sitemap)
```

## Conventions

- State management via Pinia
- API calls via Axios ($api plugin)
- Styling: Tailwind utility classes + SCSS design tokens
- TypeScript strict mode
