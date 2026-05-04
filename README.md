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

**Back-End Invoice** هو خادم REST مبني على **Express** يوفّر نظام فواتير **متعدد المستأجرين (Multi-tenant)**؛ كل **متجر (Shop)** مسجّل بحساب خاص، والبيانات مرتبطة بالمتجر المُصادَق عليه عبر **JWT**. يدعم إدارة **العملاء** و**المنتجات** و**الفواتير** مع **دفعات**، **تقارير مبيعات**، وتصدير **فواتير PDF** (بما في ذلك دعم **تشكيل النص العربي** عبر `arabic-reshaper` و`pdfkit`).

---

## ✨ المميزات

| الميزة | الوصف |
|--------|--------|
| 🔐 **المصادقة** | تسجيل متجر، تسجيل دخول، حماية المسارات بـ Bearer Token |
| 👥 **العملاء** | CRUD كامل للعملاء ضمن نطاق المتجر |
| 📦 **المنتجات** | CRUD كامل للمنتجات |
| 🧾 **الفواتير** | إنشاء وعرض وقائمة فواتير + **تنزيل PDF** |
| 💰 **الدفعات** | ربط دفعات بالفواتير |
| 📊 **التقارير** | تقرير مبيعات (مثال: `/api/reports/sales`) |
| 🏥 **الصحة** | مسار `GET /api/health` للتحقق من عمل الخادم |

---

## 🛠️ التقنيات

- **Runtime:** Node.js (CommonJS)
- **Framework:** Express 5
- **قاعدة البيانات:** PostgreSQL (`pg`)
- **الأمان:** `bcrypt`, `jsonwebtoken`, `cors`
- **PDF:** `pdfkit` + `arabic-reshaper`
- **البيئة:** `dotenv` مع تحميل ذكي لملف `.env` من جذر المشروع

---

## 📋 المتطلبات

- [Node.js](https://nodejs.org/) (يُنصح بإصدار LTS)
- [PostgreSQL](https://www.postgresql.org/) قيد التشغيل وقاعدة بيانات مُنشأة
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

التفاصيل الكاملة في [`.env.example`](.env.example).

---

## 🌐 هيكل واجهة البرمجة (API)

**القاعدة:** `/api`

| المسار | الوصف |
|--------|--------|
| `GET /health` | فحص الصحة |
| `POST /auth/register` | تسجيل متجر جديد |
| `POST /auth/login` | تسجيل دخول وإصدار JWT |
| `/customers` | العملاء (محمي) |
| `/products` | المنتجات (محمي) |
| `/invoices` | الفواتير + دفعات + `GET .../pdf` (محمي) |
| `/reports` | التقارير (محمي) |

> المسارات المحمية تتوقع رأسًا: `Authorization: Bearer <token>`.

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
│   ├── modules/           # منطق الأعمال (مثل auth، shop)
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
