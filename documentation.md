# PROJECT CONTEXT: post-flow

Справка для восстановления контекста без чтения всего кода. Строго
разделяет "реально в проекте" и "обсуждалось/предлагалось в чате, но не
применено" — не путать одно с другим.

---

## Стек

- Express 5
- TypeScript
- Prisma **6.19.3** (зафиксировано, не обновлять до 7 — см. "Известные грабли")
- PostgreSQL, БД `post-flow-db`, локально через pgAdmin
- bcrypt, jsonwebtoken, nodemailer, node-cron — установлены и используются
- swagger-jsdoc + swagger-ui-express — документация на `/api-docs`
- Разработка: `nodemon --exec tsx src/server.ts`

Окружение: Windows, PowerShell, Node.js v24.18.0.

---

## Известные грабли (не наступать повторно)

- **Prisma 7 несовместим** с текущим `schema.prisma` — `url` в `datasource`
  не поддерживается в v7. Проект держим на **Prisma 6**, версия
  зафиксирована без `^` в package.json.
- **Антивирус перехватывает HTTPS** (self-signed certificate in chain) —
  ломает `npm install`, `npx prisma init/generate`. Временный обход:
  `$env:NODE_TLS_REJECT_UNAUTHORIZED = "0"` или отключение HTTPS-инспекции
  в антивирусе.
- **PowerShell `mkdir -p` с несколькими путями не работает** — по одной
  папке за раз или `New-Item -ItemType Directory -Path a, b, c`.
- **Gmail SMTP (порты 465/587) блокируется на Timeweb Cloud** по
  умолчанию на облачных серверах — актуально при деплое, не решено.
- `tsconfig.json` обязателен `"include": ["src/**/*"]`, иначе TypeScript
  пытается скомпилировать `prisma.config.ts` из корня.

---

## ЧТО РЕАЛЬНО ЕСТЬ В ПРОЕКТЕ СЕЙЧАС

### Структура файлов (только то, что реально существует)

```
server/
├── prisma/
│   └── schema.prisma            # только модель User
├── src/
│   ├── config/
│   │   ├── prisma.ts
│   │   └── swagger.ts
│   ├── jobs/
│   │   └── cleanup-unverified.ts
│   ├── routes/
│   │   └── user.routes.ts       # /register, /verify, /login
│   ├── services/
│   │   ├── auth.service.ts
│   │   └── email.service.ts
│   ├── types/
│   │   └── express.d.ts
│   ├── utils/
│   │   ├── code.ts
│   │   └── jwt.ts               # только generateToken()
│   ├── app.ts
│   └── server.ts
├── .env
├── prisma.config.ts
├── tsconfig.json
└── package.json
```

**Папок `middleware/`, `controllers/` с содержимым нет.** `middleware/`
либо пустая, либо не создана.

### Схема БД — реально в `schema.prisma` только это

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           Int      @id @default(autoincrement())
  email        String   @unique
  passwordHash String

  isVerified               Boolean   @default(false)
  verificationCode         String?
  verificationCodeExpires  DateTime?
}
```

Полей `posts Post[]` / `templates Template[]` в реальной схеме **нет** —
моделей `Post` и `Template` в БД не существует, миграция не проводилась.

### `.env` (ключи, не значения)

```
DATABASE_URL
JWT_SECRET
EMAIL_USER
EMAIL_APP_PASSWORD
```

---

## Реализованные эндпоинты — подробно

### `POST /api/users/register`

Создаёт пользователя с `isVerified: false`, генерирует 6-значный код,
отправляет на email через Gmail. **Токен не выдаёт.**

**Тело запроса:**

```json
{ "email": "ivan@gmail.com", "password": "mypassword123" }
```

**Успех — `201 Created`:**

```json
{
  "message": "Код подтверждения отправлен на почту",
  "email": "ivan@gmail.com"
}
```

**Ошибки:**

| HTTP-код | Тело ответа                                     | Когда происходит                                                  |
| -------- | ----------------------------------------------- | ----------------------------------------------------------------- |
| `400`    | `{ "message": "email и password обязательны" }` | Одно из полей пустое/отсутствует                                  |
| `409`    | `{ "message": "Email уже используется" }`       | Email занят уже подтверждённым (`isVerified: true`) пользователем |
| `500`    | `{ "message": "Ошибка сервера" }`               | Любая необработанная ошибка (например, БД недоступна)             |

Код живёт **1 минуту** (`CODE_LIFETIME_MS = 60 * 1000`), затем cron
(`cleanup-unverified.ts`, каждую минуту) удаляет запись, если код не
подтверждён — email освобождается сам.

---

### `POST /api/users/verify`

Подтверждает email кодом из письма. Активирует аккаунт (`isVerified: true`),
очищает код, **выдаёт JWT-токен**.

**Тело запроса:**

```json
{ "email": "ivan@gmail.com", "code": "042817" }
```

**Успех — `200 OK`:**

```json
{
  "user": { "id": 1, "email": "ivan@gmail.com" },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Ошибки — все `400 Bad Request`, различаются только текстом:**

| Тело ответа                                   | Когда происходит                                 |
| --------------------------------------------- | ------------------------------------------------ |
| `{ "message": "email и code обязательны" }`   | Одно из полей не передано                        |
| `{ "message": "Пользователь не найден" }`     | Такого email нет в БД                            |
| `{ "message": "Email уже подтверждён" }`      | Повторный вызов /verify после успешной активации |
| `{ "message": "Неверный код" }`               | Код не совпадает с сохранённым                   |
| `{ "message": "Код истёк, запросите новый" }` | Прошло больше 1 минуты с момента отправки        |

`500` с `{ "message": "Ошибка сервера" }` — для необработанных случаев.

---

### `POST /api/users/login`

Вход по email/паролю. Требует подтверждённый email.

**Тело запроса:**

```json
{ "email": "ivan@gmail.com", "password": "mypassword123" }
```

**Успех — `200 OK`:**

```json
{
  "user": { "id": 1, "email": "ivan@gmail.com" },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Ошибки:**

| HTTP-код | Тело ответа                                               | Когда происходит                                                                                                                 |
| -------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `400`    | `{ "message": "email и password обязательны" }`           | Одно из полей не передано                                                                                                        |
| `401`    | `{ "message": "Неверный email или пароль" }`              | Email не найден **или** пароль неверный — специально одна и та же ошибка на оба случая, чтобы не раскрывать, существует ли email |
| `403`    | `{ "message": "Email не подтверждён. Проверьте почту." }` | Пароль верный, но `isVerified: false`                                                                                            |
| `500`    | `{ "message": "Ошибка сервера" }`                         | Необработанные случаи                                                                                                            |

**Важно про порядок проверок внутри `login()`:** сначала сверяется
пароль (`bcrypt.compare`), и только потом — `isVerified`. Если бы было
наоборот, по разным ответам можно было бы понять, существует ли email
вообще, не зная пароля.

Токен во всех трёх эндпоинтах — через `generateToken()`
(`src/utils/jwt.ts`), подписан `JWT_SECRET`, живёт 7 дней
(`expiresIn: "7d"`), payload: `{ id, email }`.

---

## ЧТО ОБСУЖДАЛОСЬ, НО НЕ ПРИМЕНЕНО К ПРОЕКТУ

Всё ниже — код был написан/показан в чате, но **не добавлен в реальные
файлы проекта**. Прежде чем на это опираться, нужно явно реализовать.

- `src/middleware/auth.middleware.ts` — проверка Bearer-токена
- `verifyToken()` в `src/utils/jwt.ts` — нужен для миддлвара, сейчас там
  только `generateToken()`
- `model Post` и `model Template` в `schema.prisma` — предложенная схема
  с полями `title/status/socialNetwork/scheduledAt/tags/images/templateId`
  (Post) и `name/htmlPath/imagesPath/placeholders/coverHtml/ownerId`
  (Template) — **не мигрирована**, таблиц в БД нет
- `src/routes/post.routes.ts` — CRUD-роут под предложенную схему `Post`
- `src/routes/templates.routes.ts` — не существует вообще
- `TemplateServices`, `PostServices` — сервисный слой, не создан
- Google OAuth — не реализован
- Переход email-отправки на HTTPS API (Resend/SendGrid) вместо Gmail SMTP
- Zod вместо ручной валидации (`if (!email || !password)`)

---

## Конвенции, которых придерживались в реализованном коде

- Ошибки в сервисах — `throw new Error("КОД_ОШИБКИ")`, роут ловит
  `err.message`, мапит на HTTP-статус + текст на русском через
  `try/catch` с проверкой конкретных строк ошибок.
- `passwordHash` никогда не возвращается в ответах API — только `id` и
  `email`.
- Комментарии в коде — на русском, объясняют "зачем", не дублируют
  очевидное из названия переменной.
- Swagger JSDoc — прямо над каждым роутом в файле роута.
