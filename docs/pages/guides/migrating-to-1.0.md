## What changed

- The UI/Dashboard is no longer bundled with in the worker
- The way your personal worker exported the R2 Explorer instance is different

## Updating your worker

Why is the `export default` change required?

This change is required to support more features in the near future, like the new [Email Explorer](setup-email-explorer.md).


Your `src/index.js` should look like this currently:
```js title="src/index.js"
import { R2Explorer } from 'r2-explorer';

const explorer = R2Explorer({ readonly: false, cors: true })

export default {
  async fetch(request, env, context) {
    return explorer(request, env, context)
  }
};
```

And you should update it to look like this:
```js title="src/index.js"
import { R2Explorer } from 'r2-explorer';

export default R2Explorer({ readonly: false, cors: true });
```

!!! note

    Notice all the configs and everything else is exacly the same, you should only update the export default to be
    the instance of the `R2Explorer()` function.

## Installing the latest version


To finish the update you should install the latest version with:

```bash
npm install r2-explorer@latest --save
```

Then proceed to deploy your application:
```bash
wrangler deploy
```

## Why is the Dashboard no longer bundled in the worker? 

In the 0.x versions of R2 Explorer the UI/Dashboard was compiled and bundled with the worker in your personal account,
but recently the dashboard has been getting bigger with each release. And max worker size is 1MB compressed
(read more [here](https://developers.cloudflare.com/workers/platform/limits/#worker-size)).

So it was decided that moving forward the project is getting split into Dashboard hosted on Cloudflare Pages and the 
API hosted in Cloudflare Workers. To keep the theme of the project as to be simple for everyone to deploy,
the worker is going to proxy dashboard requests to the Pages project, so the casual user is still just going to
just deploy the Worker and never think about the Pages project.

Advantages of this approach, as the Pages project is automatically deployed with each release by the maintainers of
R2 Explorer, users with the default settings are going to get new updates without having to update their worker (as
long as the update didn't require an API change).

For anyone wanting to deploy their own Pages project, all you need to do is to Fork the 
[github repo](https://github.com/G4brym/R2-Explorer), and create a new Cloudflare Pages project connected to your own
Git repository and set the Root directory to `packages/dashboard`, then in your `R2Explorer()` configuration define the
`dashboardUrl` setting to the url of your new project (ex: `https://demo.r2explorer.dev`).
