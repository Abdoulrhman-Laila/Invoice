<div align="center">

# 🧾 Back-End Invoice API

**واجهة برمجية متعددة المستأجرين لإدارة الفواتير والمتاجر**

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)

</div>

---

## 📌 نظرة عامة

**Back-End Invoice** هو خادم REST مبني على **Express** يوفّر نظام فواتير **متعدد المستأجرين (Multi-tenant)**؛ كل **متجر (Shop)** مسجّل بحساب خاص، والبيانات مرتبطة بالمتجر المُصادَق عليه عبر **JWT**. يدعم إدارة **العملاء** و**المنتجات** و**الفواتير** مع **دفعات**، **تقارير مبيعات**، **ملف المتجر**، وتصدير **فواتير PDF** عبر **HTML + Chromium** (`puppeteer-core`) مع **العربية واتجاه RTL** (`lang="ar"`, `dir="rtl"` وخطوط عربية).

---

## ✨ المميزات

| الميزة | الوصف |
|--------|--------|
| 🔐 **المصادقة** | تسجيل متجر، تسجيل دخول، حماية المسارات بـ Bearer Token |
| 👥 **العملاء** | CRUD كامل للعملاء ضمن نطاق المتجر |
| 📦 **المنتجات** | CRUD كامل للمنتجات |
| 🧾 **الفواتير** | إنشاء وعرض وقائمة فواتير + **تنزيل PDF** (Chrome/Edge على السيرفر) |
| 💰 **الدفعات** | ربط دفعات بالفواتير |
| 📊 **التقارير** | تقرير مبيعات (مثال: `/api/reports/sales`) |
| 🏪 **المتجر** | ملف المتجر وكلمة المرور (محمي) |
| 🏥 **الصحة** | مسار `GET /api/health` للتحقق من عمل الخادم |

---

## 🛠️ التقنيات

- **Runtime:** Node.js (CommonJS)
- **Framework:** Express 5
- **قاعدة البيانات:** PostgreSQL (`pg`)
- **الأمان:** `bcrypt`, `jsonwebtoken`, `cors`
- **PDF:** `puppeteer-core` + **Chrome أو Edge** مثبت على الجهاز (HTML → PDF، عربي RTL)
- **البيئة:** `dotenv` مع تحميل ذكي لملف `.env` من جذر المشروع

---

## 📋 المتطلبات

- [Node.js](https://nodejs.org/) (يُنصح بإصدار LTS)
- [PostgreSQL](https://www.postgresql.org/) قيد التشغيل وقاعدة بيانات مُنشأة
- لتصدير PDF: **Google Chrome** أو **Microsoft Edge** مثبت على نفس الجهاز الذي يشغّل الخادم، أو تعيين **`PUPPETEER_EXECUTABLE_PATH`** لمسار التنفيذ
- (اختياري) [nodemon](https://www.npmjs.com/package/nodemon) للتطوير — مُضمّن كـ devDependency

---

## 🚀 التشغيل السريع

### 1) تثبيت الاعتمادات

```bash
npm install
```

### 2) إعداد البيئة

انسخ ملف المثال وعدّل القيم:

```bash
copy .env.example .env
```

> على Linux/macOS: `cp .env.example .env`

عيّن على الأقل: اتصال PostgreSQL (`DATABASE_URL` **أو** `PGHOST` / `PGDATABASE` / `PGUSER` / `PGPASSWORD` …) و **`JWT_SECRET`**.

### 3) ترحيل قاعدة البيانات

```bash
npm run migrate
```

للتحقق من حالة الترحيل:

```bash
npm run migrate:status
```

### 4) تشغيل الخادم

```bash
npm start
```

للتطوير مع إعادة التشغيل التلقائي:

```bash
npm run dev
```

الخادم يستمع افتراضيًا على **`http://localhost:3000`** (أو المنفذ المعرّف في `PORT`).

---

## 🔑 متغيرات البيئة (ملخص)

| المتغير | الوصف |
|---------|--------|
| `PORT` | منفذ HTTP (افتراضي: `3000`) |
| `DATABASE_URL` أو `PG*` | اتصال PostgreSQL |
| `JWT_SECRET` | مفتاح توقيع التوكن (إلزامي) |
| `JWT_EXPIRES_IN` | مدة صلاحية التوكن (مثل `7d`) |
| `BCRYPT_SALT_ROUNDS` | جولات bcrypt |
| `PUPPETEER_EXECUTABLE_PATH` | (اختياري) مسار `chrome.exe` أو `msedge.exe` إن لم يُكتشف تلقائياً |
| `PDF_MAX_CONCURRENT` | (اختياري) أقصى عدد طلبات PDF متزامنة (افتراضي: `4`) |
| `PDF_OPERATION_TIMEOUT_MS` | (اختياري) مهلة توليد PDF بالمللي ثانية (افتراضي: `45000`) |
| `PDF_USE_REMOTE_FONTS` | (اختياري) `false` على سيرفر بدون إنترنت؛ يعتمد على خطوط النظام (يفضّل تثبيت خطوط عربية مثل Noto على Linux) |

التفاصيل الكاملة في [`.env.example`](.env.example).

---

## 🌐 هيكل واجهة البرمجة (API)

**القاعدة:** `/api`

| المسار | الوصف |
|--------|--------|
| `GET /api/health` | فحص الصحة |
| `POST /api/auth/register` | تسجيل متجر جديد |
| `POST /api/auth/login` | تسجيل دخول وإصدار JWT |
| `/api/shop/me`، `PATCH /api/shop/me`، `PATCH /api/shop/me/password` | ملف المتجر وكلمة المرور (محمي) |
| `/api/customers` | العملاء (محمي) |
| `/api/products` | المنتجات (محمي) |
| `/api/invoices` | الفواتير (محمي) |
| `GET /api/invoices/:id/pdf` | تنزيل فاتورة بصيغة PDF (محمي، `Content-Disposition: attachment`) |
| `POST/GET /api/invoices/:id/payments` | دفعات الفاتورة (محمي) |
| `/api/reports` | التقارير (محمي) |

> المسارات المحمية تتوقع رأسًا: `Authorization: Bearer <token>`.

### تصدير PDF

- **لا يُحمّل Chromium** مع `npm install`؛ يُستخدم **`puppeteer-core`** مع متصفح النظام لتفادي فشل التحميل على شبكات ضعيفة أو بيئات مقيّدة.
- عند الفشل قد يعيد الخادم JSON يحتوي على **`code`** يبدأ بـ `PDF_` (مثل `PDF_BROWSER_UNAVAILABLE`, `PDF_RENDER_FAILED`) مع **`message`** و **`hint`** عند الحاجة.
- عند الإيقاف (`SIGTERM` / `SIGINT`) يُغلق متصفح PDF مع الخادم لتفادي عمليات معلّقة.

---

## 📁 هيكل المشروع (مبسّط)

```
BackEndInvoice/
├── src/
│   ├── server.js          # نقطة الدخول
│   ├── app.js             # إعداد Express و CORS
│   ├── config/            # قاعدة البيانات وتحميل البيئة
│   ├── routes/            # مسارات API
│   ├── controllers/
│   ├── middleware/
│   ├── modules/           # منطق الأعمال (auth، shop، invoice، …) + خدمة PDF
│   └── db/                # ترحيلات قاعدة البيانات
├── package.json
├── .env.example
└── README.md
```

---

## 📄 الترخيص

هذا المشروع مرخّص تحت **ISC** — راجع حقل `license` في `package.json`.

---

<div align="center">

**صُمّم ليكون خلفية قوية لتطبيقات الفواتير والمحاسبة الصغيرة والمتوسطة**

</div>
