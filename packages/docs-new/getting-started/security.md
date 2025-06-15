## Basic Auth

Basic Auth was added in the `v1.0.2`, with support for multiple users.

To enable this feature, update your `src/index.ts` file with the desired usernames and passwords.

```ts:src/index.ts
import { R2Explorer } from 'r2-explorer';

export default R2Explorer({ readonly: false, basicAuth: [{
    username: 'teste',
    password: 'abc'
  },{
    username: 'anotherUser',
    password: '123567'
  }]
});
```

After this, just deploy your application normally with:

```bash
wrangler deploy
```

---

You can also define just a single user like this:

```ts:src/index.ts
import { R2Explorer } from 'r2-explorer';

export default R2Explorer({ readonly: false, basicAuth: {
    username: 'anotherUser',
    password: '123567'
  }
});
```


## Authenticating with Cloudflare Access

In order to enable Cloudflare Access authentication, you only need to get your team name.

You can find the team name, in the Zero trust dashboard -> Settings -> Custom Pages -> Team domain.

In my account the team name is `r2explorer`.

![Cloudflare Zero Trust Dashboard](/assets/cloudflare-access.png)

---

Now update your `src/index.ts` file with the team name, like this:

```ts:src/index.ts
import { R2Explorer } from 'r2-explorer';

export default R2Explorer({ readonly: false, cfAccessTeamName: 'r2explorer' });
```

After this, just deploy your application normally with:

```bash
wrangler deploy
```
