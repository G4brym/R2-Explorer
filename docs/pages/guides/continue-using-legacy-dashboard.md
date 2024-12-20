The new dashboard v2 is now stable, and we are no longer providing update to the legacy (dashboard v1) version.

But if you want, you can keep using the legacy version, by defining `dashboardUrl` in your `index.js` file, like this:

```js title="src/index.js"
import { R2Explorer } from 'r2-explorer';

const explorer = R2Explorer({ 
  // ... other settings, you may have
  dashboardUrl: "https://dashboard-v1.r2-explorer-dashboard.pages.dev/",
})

export default {
  async fetch(request, env, context) {
    return explorer(request, env, context)
  }
};
```
