Deploy:

```
mkdocs build
cp _redirects site
npx wrangler pages deploy site --project-name=r2-explorer-docs  --branch main
```
