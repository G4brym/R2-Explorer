# Add R2 buckets

The R2 Explorer will only be able to access the buckets you give it access to.

After creating the buckets you want in the [Cloudflare dashboard](https://dash.cloudflare.com/?to=/:account/r2/overview).

Update your `wrangler.toml` file, and add the binding for all the buckets you want to access. In this example i'm
adding 2 buckets to my application called `personal-files` and `server-backups`:

```ts:wrangler.toml
name = "my-r2-explorer"
main = "src/index.ts"
compatibility_date = "2023-05-12"

[[r2_buckets]]
binding = 'personal-files'
bucket_name = 'personal-files'
preview_bucket_name = 'personal-files'

[[r2_buckets]]
binding = 'server-backups'
bucket_name = 'jfk-server-backups'
preview_bucket_name = 'jfk-server-backups'
```

After this, just deploy your application normally with:

```bash
wrangler deploy
```

:::info
Notice that you can customize the `binding` name to be whatever you would like and that name is used inside the
dashboard to access the bucket.
:::
