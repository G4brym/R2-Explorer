# R2 Explorer Dashboard


Generate PWA icons

```bash
convert logo.svg -resize '192x192' icons/android-chrome-192x192.png
convert logo.svg -resize '512x512' icons/android-chrome-512x512.png
convert logo.svg -resize '154x154' -gravity center -background transparent -extent 192x192 icons/android-chrome-maskable-192x192.png
convert logo.svg -resize '410x410' -gravity center -background transparent -extent 512x512 icons/android-chrome-maskable-512x512.png
convert logo.svg -resize '180x180' -background white icons/apple-touch-icon.png
convert logo.svg -resize '60x60' -background white icons/apple-touch-icon-60x60.png
convert logo.svg -resize '76x76' -background white icons/apple-touch-icon-76x76.png
convert logo.svg -resize '120x120' -background white icons/apple-touch-icon-120x120.png
convert logo.svg -resize '180x180' -background white icons/apple-touch-icon-180x180.png
convert logo.svg -resize '152x152' -background white icons/apple-touch-icon-152x152.png
convert logo.svg -resize '16x16' icons/favicon-16x16.png
convert logo.svg -resize '32x32' icons/favicon-32x32.png
convert logo.svg -resize '144x144' icons/msapplication-icon-144x144.png
convert logo.svg -resize '150x150' -background transparent -compose Copy -gravity center -extent 270x270 icons/mstile-150x150.png
convert logo.svg -resize '512x512' icons/safari-pinned-tab.svg
```
