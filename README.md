# PROJECT CONTEXT: post-flow

Последнее обновление: 2026-07-25

Справка для восстановления контекста без чтения всего кода. Строго
разделяет "реально в проекте" и "обсуждалось/предлагалось в чате, но не
применено" — не путать одно с другим.

**Оговорка к этой версии:** разделы 1–2 не менялись с последней проверки
по реальному архиву проекта (2026-07-24). `SocialConnection` подтверждена
как реально работающая 2026-07-25 — вы прислали скриншот pgAdmin с
реальными записями и реальный JSON-ответ эндпоинта `GET
/api/social-connections`, показывающий именно то поведение, которое
закладывалось (`hasAccessToken`/`hasRefreshToken` вместо самих токенов).
Схема `Template` также уточнена по вашему прямому вью файла
`schema.prisma` (2026-07-25) — поле `coverHtml`, которое было в версии
от 24-го числа, в реальном файле отсутствует.

**Всё ещё не подтверждено** (см. раздел 8): `PATCH /api/posts/:id`
(`patchPost`), `src/config/social-platforms.ts`, любая логика реальной
публикации в соцсети.

---

## 1. Стек

- Express **5.2.1**
- TypeScript
- Prisma **6.19.3** (зафиксировано, не обновлять до 7 — см. "Известные грабли")
- PostgreSQL, БД `post-flow-db` (через `DATABASE_URL`)
- bcrypt, jsonwebtoken, nodemailer, node-cron — установлены и используются
- swagger-jsdoc + swagger-ui-express — документация на `/api-docs`
- Разработка: `nodemon --exec tsx src/server.ts`
- Сборка: `tsc` → `dist/`, запуск прод-сборки: `node dist/server.js`

Окружение: Windows, PowerShell, Node.js v24.18.0.

---

## 2. Известные грабли (не наступать повторно)

- **Prisma 7 несовместим** с текущим `schema.prisma` — `url` в `datasource`
  не поддерживается в v7. Проект держим на **Prisma 6**, версия
  зафиксирована без `^` в package.json (по факту в `package.json` на
  момент проверки был `^6.19.3` — со стрелкой; если это принципиально,
  стоит перепроверить и зафиксировать жёстко).
- **Антивирус перехватывает HTTPS** (self-signed certificate in chain) —
  ломает `npm install`, `npx prisma init/generate`. Временный обход:
  `$env:NODE_TLS_REJECT_UNAUTHORIZED = "0"` или отключение HTTPS-инспекции
  в антивирусе.
- **PowerShell `mkdir -p` с несколькими путями не работает** — по одной
  папке за раз или `New-Item -ItemType Directory -Path a, b, c`.
- **Gmail SMTP (порты 465/587) блокируется на Timeweb Cloud** по
  умолчанию на облачных серверах — актуально при деплое, не решено.
- **После любого изменения `schema.prisma`** обязательны `npx prisma
  migrate dev` (или `generate` отдельно) **и** перезапуск `nodemon`-процесса
  — иначе TypeScript продолжает видеть старую версию `PrismaClient` и
  кидает `Property 'X' does not exist on type 'PrismaClient'`. Уже
  наступали на это дважды (с `Post`, затем с `SocialConnection`).
- `tsconfig.json` обязателен `"include": ["src/**/*"]` — на момент
  последней проверки архива этой строки в файле не было (не проверено,
  ломает ли это сборку сейчас).

---

## 3. Структура файлов (по факту распакованного архива, 2026-07-24)

```
server/
├── prisma/
│   ├── migrations/           # + миграция для SocialConnection (имя не подтверждено)
│   └── schema.prisma         # User, Template, Post, SocialConnection
├── src/
│   ├── config/
│   │   ├── prisma.ts
│   │   └── swagger.ts
│   ├── controllers/
│   │   ├── post.controller.ts              # getAllPosts, getPostById, createPost, updatePost, deletePost
│   │   └── social-connection.controller.ts  # getAllConnections, getConnectionById, createConnection, patchConnection, deleteConnection
│   ├── jobs/
│   │   └── cleanup-unverified.ts
│   ├── middleware/
│   │   └── auth.middleware.ts   # authMiddleware — проверка Bearer-токена
│   ├── routes/
│   │   ├── post.routes.ts               # /api/posts — CRUD, всё под authMiddleware
│   │   ├── social-connection.routes.ts  # /api/social-connections — CRUD, всё под authMiddleware
│   │   ├── test.routes.ts               # /api/test-auth — служебный, для проверки токена
│   │   └── user.routes.ts               # /register, /verify, /login (логика прямо в роуте)
│   ├── services/
│   │   ├── auth.service.ts
│   │   └── email.service.ts
│   ├── types/
│   │   └── express.d.ts         # расширяет Request полем user: { id, email }
│   ├── utils/
│   │   ├── code.ts
│   │   └── jwt.ts               # generateToken() И verifyToken() — обе реализованы
│   ├── app.ts
│   └── server.ts
├── .env
├── prisma.config.ts
├── tsconfig.json
└── package.json
```

**Не подтверждено:** есть ли `PATCH /api/posts/:id` (`patchPost`) в
`post.controller.ts` — см. раздел 8. `src/config/social-platforms.ts` —
не создан.

---

## 4. Схема БД (подтверждено по архиву 2026-07-24)

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

  posts             Post[]
  templates         Template[]
  socialConnections SocialConnection[]
}

model Template {
  id           Int      @id @default(autoincrement())
  name         String
  htmlPath     String
  imagesPath   String?
  placeholders String[]

  ownerId Int
  owner   User @relation(fields: [ownerId], references: [id])

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  posts Post[]
}

model Post {
  id            Int       @id @default(autoincrement())
  title         String
  status        String    @default("draft")   // draft | scheduled | published
  socialNetwork String                        // instagram | telegram | vk | x
  scheduledAt   DateTime?
  tags          String[]
  images        String[]

  templateId Int?
  template   Template? @relation(fields: [templateId], references: [id])

  authorId Int
  author   User @relation(fields: [authorId], references: [id])

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model SocialConnection {
  id       Int    @id @default(autoincrement())
  platform String                          // telegram | instagram | threads

  accessToken  String
  refreshToken String?
  expiresAt    DateTime?

  accountName String
  metadata    Json?

  ownerId Int
  owner   User @relation(fields: [ownerId], references: [id])

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Кардинальность `SocialConnection → User`:** много подключений могут
принадлежать одному пользователю (`M → 1`), не наоборот — подтверждено
исправлением ошибки M↔M на диаграмме перед реализацией.

### `.env` (ключи, не значения)

```
DATABASE_URL
JWT_SECRET
EMAIL_USER
EMAIL_APP_PASSWORD
```

---

## 5. Реализованные сервисы

### `authService` (`src/services/auth.service.ts`)

- **`hashPassword(password: string): Promise<string>`**
  Обёртка над `bcrypt.hash`, `SALT_ROUNDS = 10`.

- **`register(email, password): Promise<{ user }>`**
  Проверяет уникальность email → хэширует пароль → генерирует
  6-значный код → создаёт `User` с `isVerified: false` → отправляет
  код на почту через `emailService`. Токен НЕ возвращает.
  Бросает: `EMAIL_TAKEN`.

- **`verifyEmail(email, code): Promise<{ user, token }>`**
  Проверяет код и срок жизни (`CODE_LIFETIME_MS = 60сек`) → ставит
  `isVerified: true`, обнуляет `verificationCode`/`verificationCodeExpires`
  → выдаёт JWT.
  Бросает: `USER_NOT_FOUND`, `ALREADY_VERIFIED`, `INVALID_CODE`, `CODE_EXPIRED`.

- **`login(email, password): Promise<{ user, token }>`**
  Порядок проверок важен: сначала пароль, потом `isVerified`
  (чтобы не раскрывать существование email через разные ошибки).
  Бросает: `INVALID_CREDENTIALS`, `EMAIL_NOT_VERIFIED`.

### `emailService` (`src/services/email.service.ts`)

- **`sendVerificationCode(to: string, code: string): Promise<void>`**
  Отправляет письмо с кодом через Gmail SMTP (`nodemailer`, аккаунт из
  `EMAIL_USER`/`EMAIL_APP_PASSWORD`). Побочный эффект для отладки: код
  дополнительно логируется в консоль (`console.log(code)`) — при деплое
  стоит решить, оставлять ли это в проде.

### `utils/jwt.ts`

- **`generateToken(payload: { id, email }): string`** — подписывает JWT,
  живёт 7 дней (`expiresIn: "7d"`).
- **`verifyToken(token: string): TokenPayload`** — проверяет подпись и
  срок действия, бросает исключение jsonwebtoken при невалидном токене
  (используется в `authMiddleware`, там же и ловится).

**Сервиса для `Post` нет** — Prisma вызывается напрямую из
`post.controller.ts`, без промежуточного `post.service.ts`.

---

## 6. Реализованные эндпоинты

### `/api/users/*` (`user.routes.ts` — логика прямо в роуте, без контроллера)

- **`POST /api/users/register`**
  Body: `{ email, password }`.
  Создаёт пользователя (`isVerified: false`), отправляет код на почту.
  Токен не выдаёт.
  → `201` `{ message, email }`
  → `400` email/password не переданы · `409` `EMAIL_TAKEN` · `500` прочее

- **`POST /api/users/verify`**
  Body: `{ email, code }`.
  Подтверждает код, активирует аккаунт, выдаёт JWT.
  → `200` `{ user: { id, email }, token }`
  → `400` email/code не переданы, `USER_NOT_FOUND`, `ALREADY_VERIFIED`,
     `INVALID_CODE`, `CODE_EXPIRED` (текст ошибки зависит от кейса)
  → `500` прочее

- **`POST /api/users/login`**
  Body: `{ email, password }`.
  Требует подтверждённый email.
  → `200` `{ user: { id, email }, token }`
  → `400` email/password не переданы
  → `401` `INVALID_CREDENTIALS` (email не найден ИЛИ пароль неверный —
     намеренно одна ошибка на оба случая)
  → `403` `EMAIL_NOT_VERIFIED`
  → `500` прочее

> Важно: в `login` порядок — сначала пароль, потом `isVerified`,
> чтобы не раскрывать существование email через разницу в ошибках.

Токен во всех трёх — через `generateToken()`, payload `{ id, email }`.

### `/api/posts/*` (`post.routes.ts` + `post.controller.ts`, всё под `authMiddleware`)

Требуют заголовок `Authorization: Bearer <token>`. Владелец поста
определяется по `authorId === req.user.id`, чужой пост — `403`.

- **`GET /api/posts`**
  Возвращает посты текущего пользователя (`orderBy: createdAt desc`).
  → `200` массив постов
  → `401` токен не передан/невалиден

- **`GET /api/posts/:id`**
  → `200` пост
  → `403` `"Это не ваш пост"` · `404` `"Пост не найден"`

- **`POST /api/posts`**
  Body: `{ title, socialNetwork, scheduledAt?, tags?, images? }`.
  `status` выставляется автоматически: `"scheduled"`, если передан
  `scheduledAt`, иначе `"draft"`. Клиент `status` напрямую не задаёт.
  → `201` созданный пост
  → `400` `title`/`socialNetwork` не переданы

- **`PUT /api/posts/:id`**
  Body (все поля не обязательны — частичное обновление): `{ title?,
  status?, socialNetwork?, scheduledAt?, tags?, images? }`.
  Prisma игнорирует `undefined`-поля — реально обновляются только
  переданные. Валидации содержимого (например `status` из
  фиксированного набора) на уровне контроллера нет.
  → `200` обновлённый пост
  → `403` / `404` как выше

- **`DELETE /api/posts/:id`**
  → `200` `{ message: "Пост удалён" }`
  → `403` / `404` как выше

**`PATCH /api/posts/:id` — статус не подтверждён.** В чате обсуждалась
отдельная функция `patchPost` (с явной проверкой "хотя бы одно поле
передано" → `400`, в отличие от `PUT`, который на пустое тело просто
ничего не меняет), но не подтверждено, что она добавлена в реальный
`post.controller.ts`. См. раздел 8.

### `/api/social-connections/*` (`social-connection.routes.ts` + `social-connection.controller.ts`, всё под `authMiddleware`)

Владелец определяется по `ownerId === req.user.id`, чужое подключение —
`403`. **Ответы никогда не содержат сами `accessToken`/`refreshToken`** —
вместо них `hasAccessToken`/`hasRefreshToken: boolean` (функция
`toSafeConnection`, вырезает оба поля перед `res.json`). Подтверждено
реальным ответом эндпоинта 2026-07-25.

- **`GET /api/social-connections`**
  → `200` массив подключений текущего пользователя (без токенов)
  → `401` токен не передан/невалиден

- **`GET /api/social-connections/:id`**
  → `200` подключение (без токенов)
  → `403` `"Это не ваше подключение"` · `404` `"Подключение не найдено"`

- **`POST /api/social-connections`**
  Body: `{ platform, accessToken, accountName, refreshToken?, expiresAt?,
  metadata? }`.
  → `201` созданное подключение (без токенов в ответе)
  → `400` `platform`/`accessToken`/`accountName` не переданы

- **`PATCH /api/social-connections/:id`**
  Body (частичное, любой поднабор): `{ accessToken?, refreshToken?,
  expiresAt?, accountName?, metadata? }`.
  → `200` обновлённое подключение
  → `400` не передано ни одного поля · `403` / `404` как выше

- **`DELETE /api/social-connections/:id`**
  → `200` `{ message: "Подключение удалено" }`
  → `403` / `404` как выше

### `/api/test-auth` (`test.routes.ts`) — служебный, не бизнес-логика

- **`GET /api/test-auth`**
  Возвращает данные из токена, если он валиден. Существует только для
  ручной проверки `authMiddleware`.
  → `200` `{ message, user: { id, email } }` · `401` токен не передан/невалиден

---

## 7. Конвенции проекта

- **Паттерн роут/контроллер/сервис применён непоследовательно**:
  `post.routes.ts` разделён на роут + `post.controller.ts` (контроллер —
  плоские `export async function`, не объект и не класс). `user.routes.ts`
  всё ещё держит логику прямо в роуте, контроллера для users не создано.
  Если добавляете новый ресурс — следуйте паттерну `post.*` (роут тонкий,
  контроллер обрабатывает).
- Middleware `authMiddleware` кладёт `req.user = { id, email }`,
  тип расширен через `src/types/express.d.ts`. В контроллерах используется
  `req.user!.id` (non-null assertion — предполагается, что миддлвар уже
  отработал и гарантированно поставил `user`).
- Ошибки в сервисах — `throw new Error("КОД_ОШИБКИ")`, роут/контроллер
  ловит `err.message`, мапит на HTTP-статус + текст на русском через
  `try/catch` с проверкой конкретных строк ошибок. В `post.controller.ts`
  этот паттерн не используется — там ошибки обрабатываются напрямую
  через ранние `return res.status(...)`, без `throw`/`catch` на уровне
  сервиса (сервисного слоя для Post вообще нет — Prisma вызывается прямо
  из контроллера).
- `passwordHash` никогда не возвращается в ответах API — только `id` и
  `email`. Тот же принцип подтверждён для `SocialConnection`:
  `accessToken`/`refreshToken` вырезаются функцией `toSafeConnection()`
  в контроллере, наружу идут только `hasAccessToken`/`hasRefreshToken:
  boolean`.
- Комментарии в коде — на русском, объясняют "зачем", не дублируют
  очевидное из названия переменной.
- Swagger JSDoc — прямо над каждым роутом в файле роута (сохраняется и
  для `post.routes.ts`, и для `test.routes.ts`).
- Список поддерживаемых соцсетей и их обязательных полей предложено
  хранить в коде (`src/config/social-platforms.ts`), не отдельной
  Prisma-моделью — см. раздел 9, решение не подтверждено как применённое.

---

## 8. Обсуждалось, но не применено

Всё ниже — обсуждалось в чате с Claude (2026-07-24 / 2026-07-25), в
реальный код **не подтверждено как внесённое**.

- IP-whitelist middleware для ограничения доступа по адресам
- httpOnly cookie вместо возврата токена в JSON-теле ответа
- CORS-конфигурация (`app.ts` не содержит `cors()`)
- Rate limiting (`express-rate-limit`)
- Google OAuth
- Переход email-отправки на HTTPS API (Resend/SendGrid) вместо Gmail SMTP
- Zod вместо ручной валидации (`if (!email || !password)`)
- Вынос логики `user.routes.ts` в `user.controller.ts` по аналогии с Post
- Сервисный слой для Post (`post.service.ts`) — сейчас Prisma вызывается
  напрямую из контроллера, в отличие от `authService`
- **`PATCH /api/posts/:id`** — отдельная функция `patchPost` с явной
  проверкой непустого тела запроса (в отличие от `PUT`)
- **`model SocialConnection`** в `schema.prisma`: поля `platform`,
  `accessToken`, `refreshToken?`, `expiresAt?`, `accountName`, `metadata
  Json?`, `ownerId` → `owner User`; связь `User.socialConnections
  SocialConnection[]`. Кардинальность обсуждена и исправлена на
  диаграмме (было ошибочно M↔M, должно быть M→1 к User) — код миграции
  дан, применение не подтверждено.
- **CRUD для `SocialConnection`**: `social-connection.controller.ts`
  (`getAllConnections`, `getConnectionById`, `createConnection`,
  `patchConnection`, `deleteConnection` — с `toSafeConnection()`,
  скрывающей `accessToken`/`refreshToken` из ответов, отдавая вместо
  них `hasAccessToken`/`hasRefreshToken: boolean`) и
  `social-connection.routes.ts` (все под `authMiddleware`, владелец —
  `ownerId === req.user.id`, чужое подключение → `403`). Последнее
  известное состояние — ошибка компиляции `Property 'socialConnection'
  does not exist on type 'PrismaClient'`, т.е. на момент ошибки миграция
  либо не была применена, либо `prisma generate` не запускался после
  правки схемы. Подтверждения, что ошибка устранена, не было.
- Список платформ (`SOCIAL_PLATFORMS` с `displayName`, `authType`,
  `requiredFields`) — предложено хранить в коде
  (`src/config/social-platforms.ts`), не отдельной таблицей БД; плюс
  идея эндпоинта `GET /api/social-platforms`, отдающего этот список
  фронтенду. Файл не создан.
- Публикация постов в соцсети и загрузка медиафайлов — решено (в
  обсуждении, не в коде), что публикация идёт только через бэкенд
  (токены соцсетей не могут покидать сервер; запланированные посты
  требуют cron, а не активной вкладки браузера), а загрузка самих
  файлов может идти напрямую с клиента в объектное хранилище через
  presigned URL. Планируется по платформам отдельно: Telegram
  (Bot API, токен не истекает, публикация одним запросом) как первая,
  затем Threads/Instagram (Meta Graph API, OAuth2, токен живёт ~60 дней
  и требует refresh, публикация двухэтапная: создать контейнер → 
  опубликовать). Ничего из этого не реализовано.

---

## 9. Открытые технические решения

- **Хранение токена на клиенте**: сейчас JSON-ответ (`{ token }` в теле).
  Обсуждался переход на httpOnly cookie ради защиты от XSS — решение не
  принято, код не менялся.
- **CORS-политика**: не настроена вообще. Нужно решить allowed origins,
  когда определится домен фронтенда.
- **`sameSite` для будущей cookie**: обсуждались `strict`/`lax`/`none` —
  зависит от того, будут ли фронт и API на одном домене (пока неизвестно).
- **Валидация `status` в `PUT /api/posts/:id`**: сейчас можно передать
  любую строку, не только `draft`/`scheduled`/`published` — не решено,
  добавлять ли enum-валидацию на уровне контроллера или Prisma-схемы.
- **Логирование кода подтверждения в консоль** (`email.service.ts`) —
  не решено, убирать ли перед деплоем в прод.
- **Нужна ли обратная связь `Post → SocialConnection`** (чтобы пост знал,
  через какое именно подключение публикуется, если у пользователя
  несколько аккаунтов одной платформы) — поднято, решение отложено до
  реализации самой публикации.