# Ballon Centre

Telegram Mini App orqali ochiladigan premium ballon marketplace.

## Tezkor start (demo)

```bash
npm install
npm run dev
```

Brauzerda: http://localhost:3000

Admin panel: http://localhost:3000/admin/login  
Parol: `.env` dagi `ADMIN_SECRET` (`dev-admin-secret-change-me`)

`USE_MOCK_DATA=true` bo‘lsa PostgreSQL shart emas — katalog demo ma’lumotdan ishlaydi.

## PostgreSQL + Prisma

```bash
docker compose up -d
```

`.env` ichida `USE_MOCK_DATA="false"` qiling, keyin:

```bash
npx prisma migrate dev --name init
npm run db:seed
```

## Telegram bot

1. [@BotFather](https://t.me/BotFather) orqali bot yarating.
2. `BOT_TOKEN` va `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` ni `.env` ga yozing.
3. Mini App URL ni BotFather `/newapp` orqali ulang (`NEXT_PUBLIC_APP_URL`).
4. Lokal ishlatish uchun HTTPS tunnel (ngrok/cloudflare) kerak.

```bash
npm run bot
```

Webhook:

```bash
curl "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=<NEXT_PUBLIC_APP_URL>/api/telegram/webhook"
```

## Asosiy buyruqlar

- `npm run lint`
- `npm run typecheck`
- `npm run build`
