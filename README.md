# LUISS Wallet Pass Generator

Because opening an app in the rain at 8am should be a crime.

## The problem

Every now and then the luiss app likes to make mischief, asking you to change passwords.
This would be fine if you never had to use it while running late, standing in the rain or with frozen fingers in January. Unfortunately, that's exactly when you need it.

This tool puts your badge QR code in Apple Wallet — same place as your boarding passes and coffee loyalty cards — so you can scan in with a double-click of the side button. 
No app. No login. No password reset at 7:58am.

## What it does

1. **Upload your badge QR code** — screenshot it from the LUISS app while you still remember your password.
2. **Enter your name and role** — yes, you have to type it yourself.
   No, I can't hack the LUISS database (I don't want to get in trouble).
3. **Download your `.pkpass`** — add it to Apple Wallet and scan in faster than the person in front of you can find their student badge.

Once it's in Wallet, you scan in straight from the lock screen.
The badge reader doesn't know the difference. We won't tell.

## How signing works

Raw `.pkpass` files need a cryptographic signature or iOS won't touch them.
Since getting an Apple Developer certificate costs $99/year and you're a student, we use a [Cloudflare Worker](worker.js) that proxies to the [WalletWallet API](https://walletwallet.dev). The API key lives encrypted on the worker. You get a signed pass. Everyone goes home happy.
```
Browser → Cloudflare Worker → WalletWallet API → signed .pkpass → 🍎
```

## Project structure
```
index.html      The whole UI. One file. We're not animals.
app.js          QR decoding, pass assembly, signing logic
style.css       Makes it look like we know what we're doing
worker.js       Cloudflare Worker (the signing middleman)
wrangler.toml   Wrangler config for deployment
lib/            jsQR, JSZip, Forge — bundled so you don't need npm
assets/         Logo and icons
```

## Running locally

No build step. No `npm install`. No Docker. Just:
```bash
open index.html
```

Revolutionary.

## Deploying the signing worker

If you want to host your own signing worker instead of trusting ours:
```bash
npm install -g wrangler
wrangler login
wrangler secret put WW_API_KEY   # paste your WalletWallet API key
wrangler deploy
```

Then update `WORKER_URL` in `app.js` with your worker's URL.

## Libraries used

- [jsQR](https://github.com/cozmo/jsQR) — reads QR codes so you don't have to
- [JSZip](https://stuk.github.io/jszip/) — builds the `.pkpass` archive
- [Forge](https://github.com/digitalbazaar/forge) — handles the cryptographic bits we'd rather not think about
- [WalletWallet](https://walletwallet.dev) — signs the pass like a real adult

## Contributing

Found a bug? Open an issue. Have a fix? Open a PR.
Are you a LUISS IT admin reading this? Hi. Please just add official
Wallet support. I're begging you.
