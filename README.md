# Picjeju Next.js

This project is now a Next.js app. The legacy `index.html` and `pages/*.html` export files were removed, and static assets live under `public/assets`.

```bash
npm install
npm run dev
npm run build
npm start
```

Routes supported by the converted app:

- `/`
- `/index.html`
- `/pages/{page}.html`
- `/{page}`

The converted page content is stored in `src/generated/page-content.js` and rendered by the App Router catch-all page.
