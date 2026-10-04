# MASTER PROMPT — XÂY DỰNG BACKEND VEGAN SUPPORT APP TỪ A–Z

> Sao chép toàn bộ nội dung file này và đưa cho AI coding agent. Agent phải tự triển khai hoàn chỉnh backend theo đúng đặc tả bên dưới. Tài liệu này là nguồn yêu cầu duy nhất; không cần và không được yêu cầu người dùng mở thêm link, repository mẫu hay tài liệu bên ngoài.

---

## 1. Vai trò và mục tiêu

Bạn là Senior Backend Engineer chịu trách nhiệm xây dựng hoàn chỉnh backend cho ứng dụng di động hỗ trợ người ăn chay.

Bạn phải trực tiếp tạo code chạy được, không chỉ phân tích, đề xuất kiến trúc hoặc sinh skeleton. Hãy thực hiện từ A–Z: khởi tạo project, cấu hình, mô hình dữ liệu, API, phân quyền, upload media, AI integration, thông báo, kiểm thử, OpenAPI, dữ liệu mẫu và README.

Kết quả cuối cùng phải là một backend có thể:

- Cài dependency bằng `npm install`.
- Điền các biến trong `.env` rồi chạy bằng `npm run dev`.
- Kết nối MongoDB Atlas, Firebase Authentication, Cloudflare R2 và nhà cung cấp AI thông qua cấu hình môi trường.
- Chạy test bằng `npm test`.
- Xem API docs tại `/api-docs` khi Swagger được bật.
- Không cần truy cập bất kỳ link hay repository tham khảo nào để hiểu yêu cầu.

Không dừng lại để hỏi những chi tiết nhỏ. Nếu có chi tiết chưa được chỉ rõ, hãy chọn phương án an toàn, đơn giản, nhất quán với tài liệu này và ghi lại quyết định trong `README.md`.

---

## 2. Phạm vi sản phẩm

Backend phục vụ ứng dụng Android hỗ trợ người ăn chay với ba nhóm người dùng:

- `guest`: người chưa đăng nhập, chỉ được xem nội dung công khai.
- `user`: người dùng đã đăng nhập.
- `admin`: quản trị viên.

Các nhóm chức năng chính:

1. Xác thực và đồng bộ tài khoản bằng Firebase Authentication.
2. Hồ sơ cá nhân và hồ sơ dinh dưỡng.
3. Danh mục thực phẩm, chất gây dị ứng và nguyên liệu.
4. Công thức món ăn, tìm kiếm và khám phá.
5. Tủ thực phẩm cá nhân.
6. Kế hoạch bữa ăn theo tuần.
7. Danh sách mua sắm.
8. Nhật ký ăn uống, cân nặng và lượng nước uống.
9. Bài viết, bình luận, cảm xúc và nội dung đã lưu.
10. Upload ảnh/video qua Cloudflare R2.
11. Trợ lý AI, gợi ý thực đơn, nhận diện nguyên liệu và tóm tắt nội dung video.
12. Thông báo và nhắc nhở.
13. Báo cáo vi phạm, kiểm duyệt, quản trị và nhật ký thao tác.

Không triển khai trong phiên bản này:

- iOS, Apple Sign In hoặc bất kỳ yêu cầu riêng cho Apple.
- Nhà hàng, cửa hàng, địa điểm, bản đồ hoặc GPS.
- Thanh toán, đơn hàng hoặc giao hàng.
- Chat thời gian thực giữa người dùng.
- BullMQ, Redis hoặc hệ thống hàng đợi phân tán.

---

## 3. Công nghệ bắt buộc

### 3.1 Nền tảng

- Node.js 24 LTS.
- Express.js 5.
- JavaScript thuần, không dùng TypeScript.
- ES Modules với `"type": "module"`.
- npm.
- MongoDB Atlas và Mongoose.
- Firebase Authentication; backend dùng Firebase Admin SDK để xác minh ID token và gửi FCM.
- Zod cho toàn bộ validation ở biên API và biến môi trường.
- Cloudflare R2 để lưu media, giao tiếp bằng AWS S3 SDK.
- Pino và pino-http cho logging.
- OpenAPI YAML và Swagger UI.
- Vitest và Supertest cho kiểm thử.
- Prettier cho định dạng code.
- Native `fetch` của Node.js cho AI HTTP API.

### 3.2 Dependency được phép

Production dependencies:

```text
express
mongoose
firebase-admin
zod
cors
helmet
compression
express-rate-limit
pino
pino-http
@aws-sdk/client-s3
@aws-sdk/s3-request-presigner
dayjs
slugify
swagger-ui-express
yaml
```

Development dependencies:

```text
vitest
supertest
prettier
pino-pretty
```

Chỉ thêm dependency khác nếu thực sự không thể hoàn thành yêu cầu bằng Node.js API hoặc danh sách trên. Nếu phải thêm, giải thích lý do trong README.

### 3.3 Không được sử dụng

- TypeScript.
- CommonJS `require`/`module.exports`.
- BullMQ, Redis, ioredis.
- ESLint.
- Nodemon.
- dotenv; dùng `node --env-file=.env`.
- Cloudinary.
- Multer; file được upload trực tiếp từ client lên R2 bằng presigned URL.
- bcrypt, jsonwebtoken, Passport, express-session.
- cookie-parser, body-parser.
- axios.
- morgan.
- express-async-errors.
- Lưu mật khẩu hoặc hash mật khẩu trong MongoDB.

---

## 4. Nguyên tắc thực thi

1. Trước khi sửa, kiểm tra workspace hiện tại và giữ nguyên mọi nội dung không liên quan của người dùng.
2. Nếu project chưa tồn tại, khởi tạo mới ngay tại thư mục hiện tại.
3. Nếu đã có project, tích hợp cẩn thận, không xóa hoặc ghi đè mù quáng.
4. Không dùng lệnh phá hủy như `git reset --hard`, `git clean -fd` hoặc xóa toàn bộ thư mục.
5. Không commit secret thật.
6. Tạo cả `.env.example` và `.env` với placeholder có sẵn; `.env` phải nằm trong `.gitignore`.
7. Không hỏi người dùng truy cập tài liệu ngoài. Mọi quyết định phải dựa trên file này.
8. Không chỉ tạo TODO, stub hoặc hàm giả ở luồng nghiệp vụ chính.
9. Tất cả route công khai phải được mô tả trong `docs/openapi.yaml`.
10. Mọi module phải có validation, controller, service, repository và model phù hợp; module nhỏ có thể bỏ repository riêng nếu không có persistence, nhưng phải ghi rõ lý do.
11. Sau mỗi giai đoạn, chạy kiểm tra phù hợp và sửa lỗi trước khi chuyển tiếp.
12. Cuối cùng phải chạy toàn bộ test, format check và kiểm tra ứng dụng khởi động.

---

## 5. Kiến trúc bắt buộc

Sử dụng **modular monolith theo domain**, áp dụng SOLID thực dụng và dependency injection thủ công.

Luồng xử lý chuẩn:

```text
Route
  → authentication / authorization middleware
  → Zod validation middleware
  → Controller
  → Service
  → Repository
  → Mongoose Model
```

Luồng gọi dịch vụ ngoài:

```text
Service → Provider/Adapter → Firebase Admin | Cloudflare R2 | AI HTTP API
```

Quy tắc trách nhiệm:

- Route: khai báo endpoint và middleware.
- Controller: lấy input đã validate, gọi service, trả HTTP response; không chứa nghiệp vụ.
- Service: chứa quy tắc nghiệp vụ, quyền sở hữu, orchestration và transaction.
- Repository: truy vấn database, không biết HTTP.
- Model: schema, index, default, enum và persistence constraint.
- Provider: cô lập SDK/API bên ngoài.
- Validator: Zod schema cho params, query và body.
- Middleware: cross-cutting concern, không chứa nghiệp vụ domain.
- Không tạo `BaseController`, `BaseService` hoặc abstraction chung nếu chưa có tái sử dụng thực tế.
- Module không được import file nội bộ sâu của module khác. Hãy giao tiếp qua service/public contract được export từ `index.js` của module.
- Dùng factory function để tạo repository, service và controller; dependency phải được truyền vào thay vì import singleton tùy tiện.

### 5.1 Quy ước code

- Tên file: `kebab-case.js`.
- Biến và hàm: `camelCase`.
- Class/schema/model: `PascalCase` khi phù hợp.
- Constant: `UPPER_SNAKE_CASE`.
- Dùng named export; chỉ dùng default export nếu thư viện buộc phải dùng.
- Dùng `async/await`.
- Không để promise bị bỏ quên.
- Không log token, private key, API key, nội dung nhạy cảm hoặc toàn bộ request body.
- Dùng UTC trong database; trả ISO 8601.
- ID public là MongoDB ObjectId dạng string; Firebase UID chỉ dùng để ánh xạ danh tính.
- Soft delete cho nội dung cần kiểm duyệt/khôi phục; hard delete chỉ cho dữ liệu tạm hoặc được mô tả rõ.

---

## 6. Cấu trúc thư mục phải tạo

```text
.
├── src
│   ├── app.js
│   ├── server.js
│   ├── container.js
│   ├── config
│   │   ├── env.js
│   │   ├── database.js
│   │   ├── logger.js
│   │   └── swagger.js
│   ├── common
│   │   ├── constants
│   │   │   ├── roles.js
│   │   │   ├── statuses.js
│   │   │   └── units.js
│   │   ├── errors
│   │   │   ├── app-error.js
│   │   │   ├── error-codes.js
│   │   │   └── error-mapper.js
│   │   ├── middlewares
│   │   │   ├── authenticate.js
│   │   │   ├── authorize.js
│   │   │   ├── error-handler.js
│   │   │   ├── not-found.js
│   │   │   ├── request-id.js
│   │   │   ├── validate.js
│   │   │   └── rate-limiters.js
│   │   ├── utils
│   │   │   ├── async-handler.js
│   │   │   ├── api-response.js
│   │   │   ├── pagination.js
│   │   │   ├── normalize-text.js
│   │   │   └── object-id.js
│   │   └── validators
│   │       └── common.schemas.js
│   ├── providers
│   │   ├── firebase
│   │   │   ├── firebase-admin.js
│   │   │   ├── firebase-auth.provider.js
│   │   │   └── firebase-messaging.provider.js
│   │   ├── r2
│   │   │   └── r2-storage.provider.js
│   │   └── ai
│   │       ├── ai.provider.js
│   │       ├── ai-prompts.js
│   │       └── ai-output.schemas.js
│   ├── modules
│   │   ├── app-config
│   │   ├── home
│   │   ├── health
│   │   ├── auth
│   │   ├── users
│   │   ├── onboarding
│   │   ├── nutrition-profiles
│   │   ├── categories
│   │   ├── allergens
│   │   ├── food-items
│   │   ├── recipes
│   │   ├── search
│   │   ├── recommendations
│   │   ├── pantries
│   │   ├── meal-plans
│   │   ├── grocery-lists
│   │   ├── diary
│   │   ├── weight-logs
│   │   ├── water-logs
│   │   ├── media
│   │   ├── posts
│   │   ├── videos
│   │   ├── comments
│   │   ├── reactions
│   │   ├── ratings
│   │   ├── saved-items
│   │   ├── view-history
│   │   ├── ai
│   │   ├── notifications
│   │   ├── reminders
│   │   ├── reports
│   │   ├── moderation
│   │   ├── admin-dashboard
│   │   ├── ai-monitoring
│   │   └── audit-logs
│   ├── routes
│   │   ├── api-manifest.js
│   │   └── index.js
│   └── scheduler
│       └── reminder-scheduler.js
├── docs
│   └── openapi.yaml
├── scripts
│   └── seed.js
├── tests
│   ├── helpers
│   │   ├── test-app.js
│   │   ├── auth-stubs.js
│   │   └── fixtures.js
│   ├── unit
│   ├── contract
│   └── integration
├── .env
├── .env.example
├── .gitignore
├── .prettierignore
├── .prettierrc.json
├── package.json
└── README.md
```

Mỗi module có persistence nên theo cấu trúc:

```text
module-name/
├── module-name.model.js
├── module-name.repository.js
├── module-name.service.js
├── module-name.controller.js
├── module-name.validation.js
├── module-name.routes.js
└── index.js
```

Nếu module cần nhiều model hoặc use case, chia nhỏ rõ ràng trong chính module đó, không gom tất cả vào một file lớn.

---

## 7. `package.json` và scripts

Tạo `package.json` với:

```json
{
  "name": "vegan-support-api",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "engines": {
    "node": ">=24"
  },
  "scripts": {
    "dev": "node --watch --env-file=.env src/server.js",
    "start": "node --env-file=.env src/server.js",
    "test": "vitest",
    "test:run": "vitest run",
    "test:contract": "vitest run tests/contract",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "seed": "node --env-file=.env scripts/seed.js"
  }
}
```

Cài đúng dependency ở mục 3. Không thêm script ESLint.

---

## 8. Biến môi trường phải tạo sẵn

Tạo `.env.example` và `.env` với đúng các key dưới đây. `.env` dùng cùng placeholder để người dùng chỉ việc thay giá trị. Không tự điền secret giả có vẻ như thật.

```dotenv
# Application
NODE_ENV=development
PORT=3000
API_PREFIX=/api/v1
APP_NAME=vegan-support-api
APP_BASE_URL=http://localhost:3000
TRUST_PROXY=0
SHUTDOWN_TIMEOUT_MS=10000
JSON_BODY_LIMIT=1mb
CORS_ORIGINS=http://localhost:8081,http://localhost:19006
LOG_LEVEL=debug

# MongoDB Atlas
MONGODB_URI=CHANGE_ME_MONGODB_ATLAS_CONNECTION_STRING
MONGODB_DB_NAME=vegan_support
MONGODB_MIN_POOL_SIZE=1
MONGODB_MAX_POOL_SIZE=10
MONGODB_SERVER_SELECTION_TIMEOUT_MS=10000

# Firebase Admin / Firebase Authentication / FCM
FIREBASE_PROJECT_ID=CHANGE_ME
FIREBASE_CLIENT_EMAIL=CHANGE_ME
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nCHANGE_ME\n-----END PRIVATE KEY-----\n"
FCM_ENABLED=false

# Cloudflare R2
CLOUDFLARE_R2_ACCOUNT_ID=CHANGE_ME
CLOUDFLARE_R2_ACCESS_KEY_ID=CHANGE_ME
CLOUDFLARE_R2_SECRET_ACCESS_KEY=CHANGE_ME
CLOUDFLARE_R2_BUCKET_NAME=CHANGE_ME
CLOUDFLARE_R2_PUBLIC_BASE_URL=CHANGE_ME_HTTPS_PUBLIC_DOMAIN
CLOUDFLARE_R2_PRESIGNED_URL_EXPIRES_IN=300
CLOUDFLARE_R2_MAX_IMAGE_SIZE_BYTES=10485760
CLOUDFLARE_R2_MAX_VIDEO_SIZE_BYTES=524288000

# AI provider — OpenAI-compatible HTTP API via native fetch
AI_ENABLED=false
AI_PROVIDER=openai-compatible
AI_BASE_URL=CHANGE_ME_HTTPS_API_BASE_URL
AI_API_KEY=CHANGE_ME
AI_CHAT_MODEL=CHANGE_ME
AI_VISION_MODEL=CHANGE_ME
AI_TIMEOUT_MS=30000
AI_MAX_RETRIES=1

# Reminder scheduler — DB polling, no Redis/BullMQ
REMINDER_SCHEDULER_ENABLED=false
REMINDER_POLL_INTERVAL_MS=60000
REMINDER_BATCH_SIZE=50
REMINDER_LOCK_TTL_MS=120000

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=200
AUTH_RATE_LIMIT_MAX=30
UPLOAD_RATE_LIMIT_MAX=30
AI_RATE_LIMIT_MAX=20

# API documentation
SWAGGER_ENABLED=true

# Seed admin — Firebase user must already exist
SEED_ADMIN_FIREBASE_UID=CHANGE_ME
SEED_ADMIN_EMAIL=CHANGE_ME
```

Yêu cầu cho `src/config/env.js`:

- Dùng Zod để parse và validate `process.env` đúng một lần khi khởi động.
- Coerce number/boolean an toàn; không dùng `Boolean("false")`.
- `CORS_ORIGINS` được tách thành array, trim và bỏ phần tử rỗng.
- Chuyển `\\n` trong `FIREBASE_PRIVATE_KEY` thành newline thực khi khởi tạo Firebase Admin.
- Production phải từ chối các placeholder `CHANGE_ME` đối với tích hợp được bật.
- Khi `AI_ENABLED=false`, không bắt buộc AI credentials.
- Khi `FCM_ENABLED=false`, không bắt buộc gửi notification qua FCM nhưng Firebase Auth credentials vẫn cần khi chạy route được bảo vệ.
- Khi scheduler tắt, không khởi chạy interval.
- Không log giá trị secret.

`.gitignore` tối thiểu:

```gitignore
node_modules/
.env
coverage/
logs/
*.log
.DS_Store
```

---

## 9. Khởi tạo ứng dụng và hạ tầng

### 9.1 `app.js`

`createApp(dependencies)` phải tạo và trả về Express app nhưng không listen port. Thứ tự middleware:

1. Trust proxy theo env.
2. Request ID: nhận `x-request-id` hợp lệ hoặc tạo `crypto.randomUUID()`; trả lại header.
3. pino-http, có redact authorization và dữ liệu nhạy cảm.
4. Helmet.
5. CORS allowlist.
6. Compression.
7. `express.json({ limit: env.JSON_BODY_LIMIT })`.
8. Global rate limiter.
9. Swagger khi bật.
10. API routes.
11. Not found middleware.
12. Central error handler.

### 9.2 `server.js`

- Validate env.
- Kết nối MongoDB.
- Khởi tạo Firebase, R2, AI providers theo cấu hình.
- Tạo dependency container.
- Tạo app và listen.
- Khởi chạy reminder scheduler nếu bật.
- Xử lý `SIGINT`, `SIGTERM`, unhandled rejection và uncaught exception theo cách có log.
- Graceful shutdown: ngừng nhận request, dừng scheduler, đóng MongoDB trong giới hạn `SHUTDOWN_TIMEOUT_MS`.

### 9.3 Database

- Không bật `autoIndex` trong production; README phải hướng dẫn tạo index khi deploy.
- Kết nối có pool size và timeout từ env.
- Health check trả trạng thái database nhưng không để lộ URI.
- Các thao tác nhiều document cần tính nguyên tử phải dùng transaction khi MongoDB deployment hỗ trợ.

### 9.4 Dependency container

`src/container.js` khởi tạo theo thứ tự:

1. Providers.
2. Models/repositories.
3. Services.
4. Controllers.
5. Routers.

Test phải có khả năng inject mock provider và auth verifier mà không gọi Firebase, R2 hoặc AI thật.

### 9.5 API manifest và chống thiếu endpoint

Tạo `src/routes/api-manifest.js` export danh sách chuẩn hóa `{ method, path, auth, module, operationId }` cho toàn bộ endpoint bắt buộc ở chương 13. Route registration và contract test phải dùng/đối chiếu manifest này để tránh ba danh sách bị lệch nhau.

Contract test phải fail khi:

- Endpoint bắt buộc có trong manifest nhưng chưa được mount.
- Route đã mount nhưng không có path/method tương ứng trong OpenAPI.
- OpenAPI khai báo endpoint không tồn tại trong app.
- `operationId` trùng nhau.
- Route bảo vệ bị khai báo public sai với manifest.

Không được “làm test pass” bằng cách xóa endpoint khỏi manifest. Chương 13 và `docs/api-matrix.md` là nguồn nghiệp vụ bắt buộc.

---

## 10. Chuẩn API dùng chung

Base path: `/api/v1`.

Success response:

```json
{
  "success": true,
  "data": {},
  "meta": {
    "requestId": "uuid"
  }
}
```

List response:

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "requestId": "uuid"
  }
}
```

Error response:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu không hợp lệ",
    "details": []
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

Quy tắc:

- Không trả stack trace trong production.
- Validation error trả `400` và details theo field path.
- Token thiếu/sai/hết hạn trả `401`.
- Không đủ role/quyền sở hữu trả `403`.
- Không tìm thấy trả `404`.
- Conflict/duplicate trả `409`.
- Rate limit trả `429`.
- Provider tạm không khả dụng trả `503` với error code ổn định.
- Lỗi không mong đợi trả `500` và được log cùng request ID.
- Không để lộ lỗi raw từ MongoDB/Firebase/R2/AI cho client.

### 10.1 Pagination, sort và filter

- Mặc định `page=1`, `limit=20`, tối đa `limit=100`.
- Whitelist field được sort; không truyền trực tiếp query sort của client vào MongoDB.
- `sort=-createdAt` nghĩa là giảm dần.
- Search text phải trim, giới hạn độ dài và escape regex nếu dùng regex.
- Với feed lớn, có thể dùng cursor; nếu dùng phải mô tả rõ trong OpenAPI. Các danh sách quản trị vẫn có thể dùng page/limit.

---

## 11. Authentication và authorization

### 11.1 Nguyên tắc

- Client đăng ký/đăng nhập/đổi mật khẩu/quên mật khẩu trực tiếp qua Firebase Authentication.
- Backend chỉ nhận `Authorization: Bearer <Firebase ID token>`.
- Backend xác minh token bằng Firebase Admin.
- Không lưu password, password hash, refresh token hoặc Firebase ID token trong MongoDB.
- `firebaseUid` ánh xạ một-một với một user nội bộ.
- Sau khi xác minh token, middleware gắn identity tối thiểu vào `req.auth`.
- User nội bộ bị `suspended` hoặc `deleted` không được dùng route bảo vệ dù token Firebase còn hợp lệ.

### 11.2 Endpoint auth

| Method | Path                        | Quyền          | Mục đích                                          |
| ------ | --------------------------- | -------------- | ------------------------------------------------- |
| POST   | `/auth/sync`                | Firebase token | Tạo hoặc đồng bộ user nội bộ từ token đã xác minh |
| GET    | `/auth/me`                  | user/admin     | Trả identity, role, status và profile cơ bản      |
| POST   | `/auth/fcm-tokens`          | user/admin     | Đăng ký/cập nhật FCM device token                 |
| DELETE | `/auth/fcm-tokens/:tokenId` | owner          | Gỡ device token khỏi tài khoản                    |

`/auth/sync` phải idempotent. Email/display name/avatar từ Firebase chỉ dùng để khởi tạo hoặc cập nhật các field được phép; không được tự nâng role dựa trên custom claim/email. Role nguồn sự thật nằm trong MongoDB và chỉ admin có quyền đổi.

### 11.3 Middleware

- `authenticate`: xác minh Bearer token và load user nội bộ.
- `optionalAuthenticate`: route công khai có thể nhận user để đánh dấu saved/reacted.
- `authorize(...roles)`: kiểm tra role.
- Ownership được kiểm tra trong service, không tin `userId` từ body.

---

## 12. Mô hình dữ liệu tổng thể

Không tối ưu theo một con số collection tùy ý. Tách collection khi dữ liệu tăng độc lập, cần truy vấn/phân trang riêng, cần audit/lịch sử hoặc có vòng đời riêng; embed khi dữ liệu nhỏ, luôn đi cùng aggregate root và được cập nhật cùng nhau.

### 12.1 Quy ước model chung

- Mongoose timestamps `createdAt`, `updatedAt`.
- Dùng `{ versionKey: false }` nếu không dùng optimistic concurrency; với aggregate dễ xung đột như pantry/meal plan nên bật optimistic concurrency hoặc kiểm tra version.
- String trim; enum rõ ràng.
- Mọi ObjectId ref cần index khi thường xuyên truy vấn.
- Public content có `status`, `visibility`, `publishedAt`, `deletedAt` phù hợp.
- Không trả field nội bộ bằng JSON transform.
- Index phải được khai báo trong schema và liệt kê trong README.

### 12.2 Collection và field tối thiểu

#### `users`

- `firebaseUid` unique, required.
- `email` normalized, sparse index.
- `displayName`, `avatarUrl`.
- `role`: `user | admin`.
- `status`: `active | suspended | deleted`.
- `onboardingCompleted`.
- `fcmTokens[]`: `{ tokenId, token, platform: android, deviceName, lastUsedAt }`; token unique theo logic service, không expose đầy đủ cho client.
- `lastLoginAt`, `deletedAt`.

#### `userProfiles`

- `userId` unique.
- `bio`, `dateOfBirth`, `gender` dạng tùy chọn.
- `dietType`: `vegan | vegetarian | lacto_vegetarian | ovo_vegetarian | lacto_ovo_vegetarian | pescatarian | flexitarian | other`.
- `preferredCuisines[]`, `dislikedFoodItemIds[]`.
- `locale`, `timezone`.

#### `nutritionProfiles`

- `userId` unique.
- `heightCm`, `currentWeightKg`.
- `activityLevel`: `sedentary | light | moderate | active | very_active`.
- `goal`: `lose_weight | maintain | gain_weight | improve_nutrition`.
- `dailyCalorieTarget`, `proteinTargetG`, `carbTargetG`, `fatTargetG`, `fiberTargetG`, `waterTargetMl`.
- `allergenIds[]`, `medicalNotes` tùy chọn và nhạy cảm.
- `bmi`, `bmiCategory`, `calculatedAt` chỉ mang tính tham khảo.

#### `categories`

- `name`, `slug` unique, `description`, `type`: `food | recipe | post`, `status`, `sortOrder`.

#### `allergens`

- `name`, `slug` unique, `description`, `severityNote`, `status`.

#### `foodItems`

Đây là dữ liệu nguyên liệu/thực phẩm chuẩn. “Ingredient” trong một công thức chính là tham chiếu tới `foodItem` cộng số lượng và đơn vị, không cần collection ingredient riêng.

- `name`, `normalizedName`, `slug` unique.
- `aliases[]`.
- `categoryId`.
- `imageUrl`.
- `defaultServing`: `{ amount, unit, gramEquivalent }`.
- `nutritionPer100g`: `{ caloriesKcal, proteinG, carbsG, fatG, fiberG, sugarG, sodiumMg, calciumMg, ironMg, vitaminB12Mcg, vitaminDMcg }`.
- `allergenIds[]`.
- `isVegan`, `isVegetarian`.
- `status`: `active | inactive`.
- `createdBy`, `updatedBy`.

#### `recipes`

- `title`, `slug` unique, `summary`, `description`.
- `coverMediaId`, `mediaIds[]`.
- `categoryIds[]`, `tags[]`, `cuisine`.
- `servings`, `prepMinutes`, `cookMinutes`, `difficulty`.
- `ingredients[]` embedded: `{ foodItemId, foodNameSnapshot, quantity, unit, gramEquivalent, note, optional, order }`.
- `steps[]` embedded: `{ order, instruction, mediaId, timerSeconds }`.
- `nutritionPerServing` snapshot.
- `allergenIds[]` snapshot.
- `authorId`, `sourceType`: `admin | community | ai_assisted`.
- `status`: `draft | pending_review | published | rejected | hidden | deleted`.
- `visibility`: `public | private | unlisted`.
- `publishedAt`, `deletedAt`.

#### `pantries`

- `userId` unique.
- `items[]` embedded: `{ itemId, foodItemId, foodNameSnapshot, quantity, unit, expiresAt, note, addedAt, updatedAt }`.
- Mỗi item có UUID `itemId` để cập nhật/xóa ổn định.
- Index phù hợp cho `userId`; tránh pantry tăng vô hạn bằng giới hạn hợp lý và validation.

#### `mealPlans`

- `userId`, `weekStartDate`, `title`, `status`: `draft | active | archived`.
- `days[]` embedded: `{ date, meals[] }`.
- `meals[]`: `{ mealId, type: breakfast|lunch|dinner|snack, recipeId, recipeSnapshot, servings, note, completed }`.
- `nutritionSummary` snapshot.
- Unique một plan active cho một user trong cùng tuần bằng service/partial index phù hợp.

#### `groceryLists`

- `userId`, `name`, `sourceMealPlanId`, `status`: `active | completed | archived`.
- `items[]` embedded: `{ itemId, foodItemId, nameSnapshot, quantity, unit, categorySnapshot, checked, note }`.

#### `diaryEntries`

- `userId`, `date`, `mealType`.
- `sourceType`: `recipe | food | custom`.
- `recipeId`, `foodItemId` tùy nguồn.
- `nameSnapshot`, `servings`, `quantity`, `unit`.
- `nutritionSnapshot`.
- `note`, `consumedAt`.
- Index `{ userId, date }`.

#### `weightLogs`

- `userId`, `weightKg`, `recordedAt`, `note`.
- Index `{ userId, recordedAt: -1 }`.

#### `waterLogs`

- `userId`, `amountMl`, `recordedAt`, `note`.
- Index `{ userId, recordedAt: -1 }`.

#### `mediaAssets`

- `ownerId`, `objectKey` unique, `bucket`, `publicUrl`.
- `kind`: `image | video`.
- `purpose`: `avatar | recipe | recipe_step | post | ai_ingredient | other`.
- `mimeType`, `sizeBytes`, `etag`.
- `status`: `pending | ready | rejected | deleted`.
- `linkedEntityType`, `linkedEntityId`, `confirmedAt`, `deletedAt`.

#### `posts`

- `authorId`, `title`, `content`, `mediaIds[]`, `tags[]`, `categoryIds[]`.
- `postType`: `community | blog`; blog thường do admin xuất bản, community post do user tạo và gửi duyệt.
- `status`: `draft | pending_review | published | rejected | hidden | deleted`.
- `visibility`: `public | private`.
- Denormalized counters: `commentCount`, `reactionCount`, `saveCount`.
- `publishedAt`, `deletedAt`.

#### `videos`

- `authorId`, `title`, `slug` unique, `description`, `thumbnailMediaId`, `videoMediaId`.
- `categoryIds[]`, `tags[]`, `durationSeconds`, `difficulty`, `recipeId` tùy chọn.
- `transcript`, `summary`, `chapters[]`: `{ title, startSeconds, endSeconds }`.
- `status`: `draft | pending_review | processing | published | rejected | hidden | deleted`.
- `visibility`: `public | private | unlisted`.
- Denormalized counters: `viewCount`, `commentCount`, `reactionCount`, `saveCount`, `ratingCount`, `ratingAverage`.
- `publishedAt`, `deletedAt`.

#### `comments`

- `authorId`.
- `targetType`: `post | recipe | video`.
- `targetId`.
- `parentCommentId` nullable; chỉ hỗ trợ tối đa một cấp reply để tránh cây vô hạn.
- `content`.
- `status`: `visible | hidden | deleted`.
- Index `{ targetType, targetId, createdAt }`.

#### `reactions`

- `userId`, `targetType`: `post | recipe | video | comment`, `targetId`.
- `type`: `like | love | helpful`.
- Unique compound `{ userId, targetType, targetId }`.

#### `savedItems`

- `userId`, `targetType`: `post | recipe | video`, `targetId`.
- Unique compound `{ userId, targetType, targetId }`.

#### `ratings`

- `userId`, `targetType`: `recipe | video`, `targetId`.
- `score`: integer `1..5`, `review` tùy chọn.
- Unique compound `{ userId, targetType, targetId }`.
- Service cập nhật `ratingCount`/`ratingAverage` an toàn trên target; không tin aggregate từ client.

#### `viewHistories`

- `userId`, `targetType`: `recipe | post | video`, `targetId`.
- `lastViewedAt`, `viewCount`.
- Với video: `progressSeconds`, `completed`, `lastProgressAt`.
- Unique compound `{ userId, targetType, targetId }`.
- Lịch sử thuộc riêng user; lượt xem public chỉ tăng theo cơ chế chống spam hợp lý.

#### `aiConversations`

- `userId`, `title`, `status`: `active | archived`, `lastMessageAt`.

#### `aiMessages`

- `conversationId`, `userId`.
- `role`: `user | assistant | system`.
- `content`, `structuredData`.
- `model`, `usage`, `status`: `completed | failed | blocked`.
- `createdAt`; index theo conversation và thời gian.

#### `aiRuns`

- `userId`, `feature`: `chat | meal_plan | ingredient_recognition | video_summary`.
- `provider`, `model`, `status`, `latencyMs`, `tokenUsage`, `estimatedCost` tùy chọn.
- `inputMetadata`, `outputMetadata` đã loại nội dung nhạy cảm; không lưu API key hoặc raw image.
- `errorCode`, `createdAt`.
- Dùng cho quan sát chất lượng/vận hành, không trả công khai.

#### `aiFeedback`

- `userId`, `aiRunId`, `rating`: `helpful | not_helpful`, `reason`, `comment` tùy chọn.
- Unique compound `{ userId, aiRunId }`.
- Admin chỉ xem dữ liệu tổng hợp hoặc nội dung đã được bảo vệ phù hợp.

#### `notificationPreferences`

- `userId` unique.
- `pushEnabled`, `mealReminderEnabled`, `waterReminderEnabled`, `contentEnabled`.
- `quietHours`: `{ enabled, start, end }`.
- `timezone`.

#### `notifications`

- `userId`, `type`, `title`, `body`, `data`.
- `channel`: `in_app | push`.
- `status`: `pending | sent | failed | read`.
- `readAt`, `sentAt`, `failureReason` đã sanitize.
- Index `{ userId, createdAt: -1 }` và unread query.

#### `reminders`

- `userId`, `type`: `meal | water | custom`.
- `title`, `body`.
- `schedule`: `{ mode: once|daily|weekly, at, daysOfWeek[], timezone }`.
- `nextRunAt`, `lastRunAt`.
- `status`: `active | paused | completed | cancelled`.
- Claim fields: `lockedAt`, `lockedBy`, `lockExpiresAt`.
- Index `{ status, nextRunAt }`.

#### `reports`

- `reporterId`, `targetType`: `post | recipe | video | comment | user`, `targetId`.
- `reason`: `spam | harmful | misinformation | harassment | copyright | other`.
- `description`, `status`: `open | reviewing | resolved | dismissed`.
- `assignedAdminId`, `resolution`, `resolvedAt`.

#### `moderationCases`

- `reportIds[]`, `targetType`, `targetId`.
- `status`, `priority`, `assignedAdminId`.
- `actions[]`: snapshot của quyết định kiểm duyệt.

#### `auditLogs`

- `actorId`, `actorRole`, `action`, `targetType`, `targetId`.
- `before`, `after` đã redact dữ liệu nhạy cảm.
- `requestId`, `ipHash` hoặc IP đã xử lý theo chính sách.
- `createdAt`; immutable, không có API update/delete thông thường.

### 12.3 Business rules bắt buộc

1. Một Firebase UID chỉ ánh xạ tới một user.
2. Mỗi user có tối đa một user profile, nutrition profile, pantry và notification preferences.
3. Food item là master data; ingredient trong ngữ cảnh là food item + quantity + unit.
4. Recipe ingredients/steps, pantry items, meal-plan days/meals và grocery items là embedded subdocuments.
5. Weight log, water log, diary entry, AI message, notification và audit log là document riêng.
6. Chỉ owner được sửa dữ liệu cá nhân/nội dung riêng; admin chỉ can thiệp khi use case quản trị cho phép và phải audit.
7. Snapshot lịch sử không tự đổi khi dữ liệu nguồn thay đổi.
8. Nội dung hidden/deleted/unpublished không xuất hiện ở API public.
9. Mỗi user chỉ có một reaction, một saved item và một rating trên cùng target tương ứng.
10. Target đa hình phải được service xác minh tồn tại và đúng loại.
11. AI chỉ đề xuất; mọi thay đổi pantry hoặc kích hoạt meal plan do AI tạo phải được user xác nhận rõ ràng.
12. AI không chẩn đoán bệnh hoặc thay thế tư vấn y tế.
13. Video chỉ được publish khi media đã `ready`; video processing/hidden/deleted không xuất hiện ở API public.
14. View history, recent search, watch progress và AI feedback luôn thuộc owner, không được user khác truy cập.

---

## 13. API phải triển khai

Tất cả endpoint dưới đây phải có validation, authorization, error mapping, OpenAPI và test cho happy path cùng các lỗi quan trọng.

Danh sách ở chương này là **API contract tối thiểu bắt buộc cho toàn bộ mobile app**, không phải ví dụ tham khảo. Agent phải triển khai tất cả endpoint, không được tự ý bỏ endpoint vì cho rằng chưa cần. Nếu trong lúc code phát hiện một màn hình/use case bắt buộc cần thêm endpoint phụ, hãy bổ sung endpoint đó, OpenAPI, test và `docs/api-matrix.md` thay vì để mobile tự xử lý sai nghiệp vụ.

Tạo `docs/api-matrix.md` với các cột:

| Actor | Mobile screen/use case | Endpoint | Method | Auth | Request schema | Response schema | Module | Test |
| ----- | ---------------------- | -------- | ------ | ---- | -------------- | --------------- | ------ | ---- |

Mọi màn hình/use case phải có ít nhất một trong hai trạng thái:

- Có endpoint backend cụ thể và đường dẫn test tương ứng.
- Được đánh dấu `CLIENT_ONLY` kèm lý do hợp lệ, ví dụ Firebase login/register/reset-password thực hiện bằng Firebase client SDK hoặc thao tác hiển thị thuần túy.

Không được đánh dấu `CLIENT_ONLY` cho business logic, authorization, persistence, AI, media, notification hoặc dữ liệu dùng chung.

### 13.0 App bootstrap, home và onboarding

| Method | Path                   | Quyền         | Chức năng                                                                                                       |
| ------ | ---------------------- | ------------- | --------------------------------------------------------------------------------------------------------------- |
| GET    | `/app/config`          | public        | Trả cấu hình public: app version policy, enums/limits cần cho client, feature flags; tuyệt đối không trả secret |
| GET    | `/app/bootstrap`       | optional auth | Payload khởi động gọn: public config, auth summary, onboarding status, unread count và master-data version      |
| GET    | `/home`                | optional auth | Home feed tổng hợp: featured recipes/videos/blogs và khối personalized nếu đăng nhập                            |
| GET    | `/onboarding/status`   | user/admin    | Trạng thái và bước còn thiếu                                                                                    |
| PUT    | `/onboarding`          | owner         | Lưu lựa chọn diet, allergens, mục tiêu, activity và hoàn tất onboarding theo từng bước                          |
| POST   | `/onboarding/complete` | owner         | Xác nhận hoàn tất sau khi server kiểm tra field bắt buộc                                                        |

`/app/bootstrap` và `/home` phải giới hạn kích thước, không thay thế toàn bộ API chi tiết và không trả content draft/hidden/deleted.

### 13.1 Health

| Method | Path            | Quyền  | Chức năng                                |
| ------ | --------------- | ------ | ---------------------------------------- |
| GET    | `/health`       | public | Liveness: app/version/timestamp          |
| GET    | `/health/ready` | public | Readiness: database và provider bắt buộc |

Không trả secret hoặc chi tiết nội bộ nhạy cảm.

### 13.2 User và profile

| Method | Path                                 | Quyền      | Chức năng                                            |
| ------ | ------------------------------------ | ---------- | ---------------------------------------------------- |
| GET    | `/users/me`                          | user/admin | Xem tài khoản và profile tổng hợp                    |
| PATCH  | `/users/me`                          | owner      | Cập nhật display name/avatar                         |
| DELETE | `/users/me`                          | owner      | Soft-delete tài khoản nội bộ, thu hồi quyền dùng app |
| GET    | `/users/:userId/public`              | public     | Hồ sơ công khai đã giới hạn field                    |
| GET    | `/users/me/content`                  | owner      | Nội dung do mình tạo, filter type/status             |
| GET    | `/users/me/activity`                 | owner      | Tóm tắt hoạt động của chính mình                     |
| GET    | `/profiles/me`                       | owner      | Xem user profile                                     |
| PUT    | `/profiles/me`                       | owner      | Upsert user profile                                  |
| GET    | `/nutrition-profiles/me`             | owner      | Xem hồ sơ dinh dưỡng                                 |
| PUT    | `/nutrition-profiles/me`             | owner      | Upsert và tính chỉ số tham khảo                      |
| POST   | `/nutrition-profiles/me/recalculate` | owner      | Tính lại mục tiêu dinh dưỡng/BMI                     |

Không trả `medicalNotes` qua public profile. Kết quả BMI/calorie target phải ghi rõ là ước tính, không phải chẩn đoán.

### 13.3 Category, allergen và food item

| Method | Path              | Quyền  | Chức năng                      |
| ------ | ----------------- | ------ | ------------------------------ |
| GET    | `/categories`     | public | Danh sách active, filter type  |
| POST   | `/categories`     | admin  | Tạo category                   |
| PATCH  | `/categories/:id` | admin  | Sửa category                   |
| DELETE | `/categories/:id` | admin  | Inactivate nếu đang được dùng  |
| GET    | `/allergens`      | public | Danh sách active               |
| POST   | `/allergens`      | admin  | Tạo allergen                   |
| PATCH  | `/allergens/:id`  | admin  | Sửa allergen                   |
| DELETE | `/allergens/:id`  | admin  | Inactivate nếu đang được dùng  |
| GET    | `/food-items`     | public | Search/filter/pagination       |
| GET    | `/food-items/:id` | public | Chi tiết và nutrition          |
| POST   | `/food-items`     | admin  | Tạo food item                  |
| PATCH  | `/food-items/:id` | admin  | Cập nhật                       |
| DELETE | `/food-items/:id` | admin  | Inactivate, không phá snapshot |

Food search hỗ trợ `q`, category, allergen exclusion, vegan flag và sort whitelist.

### 13.4 Recipe và discovery

| Method | Path                       | Quyền                | Chức năng                                              |
| ------ | -------------------------- | -------------------- | ------------------------------------------------------ |
| GET    | `/recipes`                 | public               | Danh sách recipe published/public                      |
| GET    | `/recipes/mine`            | owner                | Recipe do mình tạo theo status                         |
| GET    | `/recipes/:idOrSlug`       | public/optional auth | Chi tiết, đánh dấu saved/reacted nếu đăng nhập         |
| POST   | `/recipes`                 | user/admin           | Tạo draft                                              |
| PATCH  | `/recipes/:id`             | owner/admin          | Cập nhật draft hoặc nội dung cho phép                  |
| DELETE | `/recipes/:id`             | owner/admin          | Soft delete                                            |
| POST   | `/recipes/:id/submit`      | owner                | Gửi duyệt                                              |
| POST   | `/recipes/:id/publish`     | admin                | Duyệt và publish                                       |
| POST   | `/recipes/:id/reject`      | admin                | Từ chối có lý do                                       |
| GET    | `/recipes/:id/nutrition`   | public               | Nutrition per serving snapshot                         |
| GET    | `/search`                  | public               | Tìm recipe, food item và post theo type/filter         |
| GET    | `/search/suggestions`      | public               | Autocomplete có giới hạn, chỉ từ dữ liệu public/active |
| GET    | `/search/recent`           | owner                | Lịch sử tìm kiếm gần đây của user                      |
| DELETE | `/search/recent`           | owner                | Xóa toàn bộ lịch sử tìm kiếm                           |
| DELETE | `/search/recent/:id`       | owner                | Xóa một mục lịch sử                                    |
| GET    | `/discover`                | public/optional auth | Nội dung nổi bật và gợi ý có giải thích ngắn           |
| GET    | `/recommendations/recipes` | user/admin           | Gợi ý cá nhân theo diet/allergen/pantry/mục tiêu       |
| GET    | `/recommendations/content` | user/admin           | Gợi ý blog/video/recipe đã publish                     |

Filter recipe tối thiểu: `q`, category, cuisine, difficulty, max total minutes, tags, exclude allergen IDs, diet type và sort. Search không được trả nội dung chưa publish.

### 13.5 Pantry

| Method | Path                         | Quyền | Chức năng                              |
| ------ | ---------------------------- | ----- | -------------------------------------- |
| GET    | `/pantry`                    | owner | Xem pantry                             |
| POST   | `/pantry/items`              | owner | Thêm item                              |
| POST   | `/pantry/items/bulk`         | owner | Thêm nhiều item đã validate/idempotent |
| PATCH  | `/pantry/items/:itemId`      | owner | Sửa quantity/unit/expiry/note          |
| DELETE | `/pantry/items/:itemId`      | owner | Xóa item                               |
| GET    | `/pantry/expiring`           | owner | Item sắp hết hạn                       |
| GET    | `/pantry/recipe-suggestions` | owner | Gợi ý recipe theo mức khớp nguyên liệu |

Việc trừ pantry khi đánh dấu bữa ăn hoàn thành không tự động nếu chưa có xác nhận của user.

### 13.6 Meal plan

| Method | Path                            | Quyền | Chức năng                                            |
| ------ | ------------------------------- | ----- | ---------------------------------------------------- |
| GET    | `/meal-plans`                   | owner | Danh sách theo tuần/status                           |
| GET    | `/meal-plans/current`           | owner | Plan active của tuần/ngày hiện tại                   |
| GET    | `/meal-plans/:id`               | owner | Chi tiết                                             |
| POST   | `/meal-plans`                   | owner | Tạo plan thủ công                                    |
| PATCH  | `/meal-plans/:id`               | owner | Sửa metadata/status cho phép                         |
| DELETE | `/meal-plans/:id`               | owner | Archive/delete hợp lệ                                |
| POST   | `/meal-plans/:id/meals`         | owner | Thêm meal                                            |
| PATCH  | `/meal-plans/:id/meals/:mealId` | owner | Sửa meal/completed                                   |
| DELETE | `/meal-plans/:id/meals/:mealId` | owner | Xóa meal                                             |
| POST   | `/meal-plans/:id/activate`      | owner | Kích hoạt plan, đảm bảo quy tắc một active plan/tuần |
| POST   | `/meal-plans/:id/clone`         | owner | Sao chép sang tuần khác và tạo draft                 |
| POST   | `/meal-plans/:id/grocery-list`  | owner | Sinh grocery list từ plan                            |

### 13.7 Grocery list

| Method | Path                               | Quyền | Chức năng                                         |
| ------ | ---------------------------------- | ----- | ------------------------------------------------- |
| GET    | `/grocery-lists`                   | owner | Danh sách                                         |
| GET    | `/grocery-lists/:id`               | owner | Chi tiết                                          |
| POST   | `/grocery-lists`                   | owner | Tạo thủ công                                      |
| PATCH  | `/grocery-lists/:id`               | owner | Đổi tên/status                                    |
| DELETE | `/grocery-lists/:id`               | owner | Archive/delete                                    |
| POST   | `/grocery-lists/:id/items`         | owner | Thêm item                                         |
| PATCH  | `/grocery-lists/:id/items/:itemId` | owner | Sửa/check item                                    |
| DELETE | `/grocery-lists/:id/items/:itemId` | owner | Xóa item                                          |
| POST   | `/grocery-lists/:id/clear-checked` | owner | Xóa/archive các item đã chọn theo cách idempotent |

Khi sinh từ meal plan, cộng gộp cùng food item và đơn vị có thể quy đổi; item không quy đổi được phải giữ riêng, không cộng sai.

### 13.8 Diary, weight và water

| Method | Path                 | Quyền | Chức năng                      |
| ------ | -------------------- | ----- | ------------------------------ |
| GET    | `/diary`             | owner | Lấy entry theo ngày/range      |
| POST   | `/diary`             | owner | Ghi món đã dùng với snapshot   |
| PATCH  | `/diary/:id`         | owner | Sửa lượng/ghi chú              |
| DELETE | `/diary/:id`         | owner | Xóa entry                      |
| GET    | `/diary/summary`     | owner | Tổng nutrition theo ngày/range |
| GET    | `/weight-logs`       | owner | Lịch sử                        |
| POST   | `/weight-logs`       | owner | Ghi cân nặng                   |
| PATCH  | `/weight-logs/:id`   | owner | Sửa                            |
| DELETE | `/weight-logs/:id`   | owner | Xóa                            |
| GET    | `/weight-logs/trend` | owner | Trend theo range               |
| GET    | `/water-logs`        | owner | Lịch sử/tổng theo ngày         |
| POST   | `/water-logs`        | owner | Ghi lượng nước                 |
| PATCH  | `/water-logs/:id`    | owner | Sửa                            |
| DELETE | `/water-logs/:id`    | owner | Xóa                            |

Giới hạn range truy vấn để tránh scan không kiểm soát.

### 13.9 Media và Cloudflare R2

| Method | Path                     | Quyền             | Chức năng                                             |
| ------ | ------------------------ | ----------------- | ----------------------------------------------------- |
| POST   | `/media/upload-requests` | user/admin        | Tạo presigned PUT URL                                 |
| GET    | `/media/mine`            | owner             | List media của mình theo status/purpose               |
| POST   | `/media/:id/confirm`     | owner             | Xác minh object đã upload và đánh dấu ready           |
| GET    | `/media/:id`             | public hoặc owner | Metadata theo quyền entity                            |
| DELETE | `/media/:id`             | owner/admin       | Xóa object và soft-delete metadata nếu không còn dùng |

Luồng upload bắt buộc:

1. Client gửi `filename`, `mimeType`, `sizeBytes`, `purpose`.
2. Backend validate MIME và giới hạn size; không tin extension.
3. Backend sinh object key không đoán được: namespace theo user/purpose/date + UUID; không dùng filename thô.
4. Tạo `mediaAsset` status `pending`.
5. Trả presigned PUT URL hết hạn theo env, required headers và asset ID.
6. Client upload trực tiếp lên R2.
7. Client gọi confirm.
8. Backend `HeadObject`, kiểm tra tồn tại/content type/size, rồi chuyển `ready`.
9. Chỉ media `ready` mới được gắn vào entity.

Allowed MIME tối thiểu:

- Image: `image/jpeg`, `image/png`, `image/webp`.
- Video: `video/mp4`, `video/webm`.

Không chấp nhận SVG ở phiên bản này. Tạo cơ chế dọn `pending` quá hạn bằng script/service an toàn; không cần queue.

### 13.10 Post, comment, reaction và saved item

| Method | Path                                 | Quyền                | Chức năng                              |
| ------ | ------------------------------------ | -------------------- | -------------------------------------- |
| GET    | `/posts`                             | public               | Feed published/public                  |
| GET    | `/posts/mine`                        | owner                | Post/blog do mình tạo theo status/type |
| GET    | `/posts/:id`                         | public/optional auth | Chi tiết                               |
| POST   | `/posts`                             | user/admin           | Tạo draft                              |
| PATCH  | `/posts/:id`                         | owner/admin          | Sửa                                    |
| DELETE | `/posts/:id`                         | owner/admin          | Soft delete                            |
| POST   | `/posts/:id/submit`                  | owner                | Gửi duyệt                              |
| POST   | `/posts/:id/publish`                 | admin                | Publish                                |
| POST   | `/posts/:id/reject`                  | admin                | Reject có lý do                        |
| GET    | `/comments`                          | public               | List theo target                       |
| POST   | `/comments`                          | user/admin           | Tạo comment/reply                      |
| PATCH  | `/comments/:id`                      | owner                | Sửa comment visible                    |
| DELETE | `/comments/:id`                      | owner/admin          | Soft delete                            |
| PUT    | `/reactions/:targetType/:targetId`   | user/admin           | Upsert reaction                        |
| DELETE | `/reactions/:targetType/:targetId`   | owner                | Bỏ reaction                            |
| GET    | `/saved-items`                       | owner                | Danh sách đã lưu                       |
| PUT    | `/saved-items/:targetType/:targetId` | owner                | Lưu idempotent                         |
| DELETE | `/saved-items/:targetType/:targetId` | owner                | Bỏ lưu idempotent                      |

Counters phải nhất quán. Dùng transaction hoặc cơ chế cập nhật an toàn; có thể cung cấp script reconcile counters nếu cần.

### 13.11 AI

| Method | Path                                          | Quyền | Chức năng                                                  |
| ------ | --------------------------------------------- | ----- | ---------------------------------------------------------- |
| GET    | `/ai/conversations`                           | owner | Danh sách conversation                                     |
| POST   | `/ai/conversations`                           | owner | Tạo conversation                                           |
| GET    | `/ai/conversations/:id/messages`              | owner | Lịch sử message                                            |
| POST   | `/ai/conversations/:id/messages`              | owner | Hỏi trợ lý dinh dưỡng/ẩm thực                              |
| POST   | `/ai/meal-plan-proposals`                     | owner | Sinh đề xuất meal plan có cấu trúc                         |
| POST   | `/ai/meal-plan-proposals/:proposalId/confirm` | owner | User xác nhận rồi mới tạo/kích hoạt plan                   |
| POST   | `/ai/ingredient-recognition`                  | owner | Nhận diện nguyên liệu từ media ready                       |
| POST   | `/ai/pantry-proposals/:proposalId/confirm`    | owner | User xác nhận rồi mới thêm pantry                          |
| POST   | `/ai/video-summaries`                         | owner | Tóm tắt/transcript từ media video nếu provider hỗ trợ      |
| PUT    | `/ai/runs/:runId/feedback`                    | owner | Upsert helpful/not-helpful feedback cho AI result của mình |

Yêu cầu AI provider:

- Dùng native `fetch`, timeout bằng `AbortController`.
- API ở dạng OpenAI-compatible; base URL, model và key từ env.
- Không hard-code nhà cung cấp.
- Retry tối đa theo env, chỉ retry lỗi tạm thời/idempotent.
- Validate mọi structured output bằng Zod; nếu parse sai, trả lỗi có kiểm soát.
- Không đưa secret hoặc dữ liệu không cần thiết vào prompt.
- Giới hạn độ dài context/message.
- Rate limit riêng cho AI.
- Nếu `AI_ENABLED=false`, endpoint trả `503 AI_DISABLED`, không làm app crash.
- Test dùng mock provider, tuyệt đối không gọi API thật.
- Kết quả AI cần disclaimer: chỉ là gợi ý, không thay thế chuyên gia y tế.
- Nếu câu hỏi yêu cầu chẩn đoán/điều trị hoặc có dấu hiệu khẩn cấp, trả lời an toàn, khuyến nghị liên hệ chuyên gia/dịch vụ khẩn cấp phù hợp; không tự chẩn đoán.
- Meal plan/pantry proposal phải lưu trạng thái pending có TTL hoặc structuredData đủ để confirm an toàn. Confirm phải kiểm tra owner, expiry và chưa được dùng; thao tác idempotent.

### 13.12 Notification và reminder

| Method | Path                          | Quyền | Chức năng                               |
| ------ | ----------------------------- | ----- | --------------------------------------- |
| GET    | `/notifications`              | owner | List notification                       |
| GET    | `/notifications/unread-count` | owner | Số thông báo chưa đọc                   |
| PATCH  | `/notifications/:id/read`     | owner | Đánh dấu đã đọc                         |
| POST   | `/notifications/read-all`     | owner | Đánh dấu tất cả đã đọc                  |
| DELETE | `/notifications/:id`          | owner | Ẩn/xóa notification khỏi inbox của mình |
| GET    | `/notification-preferences`   | owner | Xem preferences                         |
| PUT    | `/notification-preferences`   | owner | Upsert preferences                      |
| GET    | `/reminders`                  | owner | List reminder                           |
| POST   | `/reminders`                  | owner | Tạo reminder                            |
| PATCH  | `/reminders/:id`              | owner | Sửa/pause/resume                        |
| DELETE | `/reminders/:id`              | owner | Cancel                                  |

Không dùng Redis/BullMQ. Triển khai scheduler đơn giản cho một process:

- `setInterval` poll reminder active có `nextRunAt <= now`.
- Claim atomically bằng `findOneAndUpdate` với lock hết hạn.
- `lockedBy` là instance UUID; lock TTL từ env.
- Tạo notification idempotent bằng unique delivery key như `reminderId + scheduledAt`.
- Gửi FCM nếu user bật push, có token và `FCM_ENABLED=true`.
- Luôn có thể tạo in-app notification dù push tắt.
- Tính `nextRunAt` theo timezone và lịch once/daily/weekly, tránh gửi lặp khi restart.
- Một lần poll xử lý tối đa batch size.
- Bắt lỗi từng reminder, không làm chết scheduler.
- README phải nêu rõ scheduler này phù hợp triển khai một instance; khi scale nhiều instance cần hệ thống queue/leader election trong tương lai.

### 13.13 Report, moderation, admin và audit

| Method | Path                                              | Quyền      | Chức năng                 |
| ------ | ------------------------------------------------- | ---------- | ------------------------- |
| POST   | `/reports`                                        | user/admin | Báo cáo target            |
| GET    | `/reports/mine`                                   | owner      | Xem báo cáo của mình      |
| GET    | `/reports/mine/:id`                               | owner      | Chi tiết báo cáo của mình |
| GET    | `/admin/reports`                                  | admin      | Queue báo cáo             |
| PATCH  | `/admin/reports/:id`                              | admin      | Assign/status/resolution  |
| GET    | `/admin/moderation-cases`                         | admin      | List case                 |
| POST   | `/admin/moderation-cases`                         | admin      | Tạo/gộp case              |
| PATCH  | `/admin/moderation-cases/:id`                     | admin      | Cập nhật case             |
| POST   | `/admin/moderation/:targetType/:targetId/hide`    | admin      | Ẩn nội dung               |
| POST   | `/admin/moderation/:targetType/:targetId/restore` | admin      | Khôi phục                 |
| POST   | `/admin/users/:id/suspend`                        | admin      | Đình chỉ user             |
| POST   | `/admin/users/:id/activate`                       | admin      | Kích hoạt lại             |
| GET    | `/admin/users`                                    | admin      | Tìm/list user             |
| GET    | `/admin/audit-logs`                               | admin      | List audit read-only      |

Mọi thao tác admin thay đổi trạng thái, nội dung hoặc quyền user phải ghi audit log với before/after đã redact. Không có API xóa/sửa audit log.

### 13.14 Video hướng dẫn

Video là tài nguyên nghiệp vụ riêng, không chỉ là một file media. `mediaAsset` lưu object R2; `video` lưu metadata, trạng thái duyệt, transcript, summary, counters và quan hệ nội dung.

| Method | Path                           | Quyền                | Chức năng                                                      |
| ------ | ------------------------------ | -------------------- | -------------------------------------------------------------- |
| GET    | `/videos`                      | public               | Danh sách video published/public, search/filter/pagination     |
| GET    | `/videos/mine`                 | owner                | Video do mình tạo theo status                                  |
| GET    | `/videos/:idOrSlug`            | public/optional auth | Chi tiết video và trạng thái saved/reacted/rated/progress      |
| POST   | `/videos`                      | user/admin           | Tạo draft từ `videoMediaId` ready                              |
| PATCH  | `/videos/:id`                  | owner/admin          | Sửa metadata khi trạng thái cho phép                           |
| DELETE | `/videos/:id`                  | owner/admin          | Soft delete                                                    |
| POST   | `/videos/:id/submit`           | owner                | Gửi duyệt                                                      |
| POST   | `/videos/:id/publish`          | admin                | Publish sau khi kiểm tra media                                 |
| POST   | `/videos/:id/reject`           | admin                | Từ chối có lý do                                               |
| GET    | `/videos/:id/related`          | public               | Video/recipe liên quan đã publish                              |
| PUT    | `/videos/:id/progress`         | owner                | Upsert thời lượng đã xem/completed                             |
| GET    | `/videos/:id/transcript`       | public               | Transcript/chapter của video published nếu có                  |
| POST   | `/videos/:id/generate-summary` | owner/admin          | Yêu cầu AI tạo transcript/summary khi owner có quyền và AI bật |

Không stream/proxy file video qua Express. Client dùng URL R2/CDN phù hợp. Không tăng `viewCount` ở mọi lần refresh mù quáng; áp dụng deduplication/rate rule và ghi view history cho authenticated user.

### 13.15 Rating, vote và lịch sử xem

`reaction` biểu diễn vote/cảm xúc nhanh; `rating` biểu diễn điểm đánh giá 1–5. Hai khái niệm không được nhập làm một.

| Method | Path                                     | Quyền      | Chức năng                                                       |
| ------ | ---------------------------------------- | ---------- | --------------------------------------------------------------- |
| PUT    | `/ratings/:targetType/:targetId`         | user/admin | Upsert score/review cho recipe hoặc video                       |
| DELETE | `/ratings/:targetType/:targetId`         | owner      | Xóa rating của mình                                             |
| GET    | `/ratings/:targetType/:targetId/summary` | public     | Average/count/distribution và rating của current user nếu có    |
| GET    | `/view-history`                          | owner      | Lịch sử recipe/post/video, filter type                          |
| DELETE | `/view-history`                          | owner      | Xóa toàn bộ lịch sử của mình                                    |
| DELETE | `/view-history/:targetType/:targetId`    | owner      | Xóa một mục lịch sử                                             |
| PUT    | `/view-history/:targetType/:targetId`    | owner      | Ghi nhận xem; video progress ưu tiên endpoint video chuyên biệt |

### 13.16 Dashboard quản trị và giám sát AI

| Method | Path                              | Quyền | Chức năng                                                       |
| ------ | --------------------------------- | ----- | --------------------------------------------------------------- |
| GET    | `/admin/dashboard/summary`        | admin | Tổng quan user/content/report/AI trong range                    |
| GET    | `/admin/dashboard/content-trends` | admin | Xu hướng recipe/post/video published/flagged                    |
| GET    | `/admin/dashboard/user-trends`    | admin | User active/new/suspended theo range                            |
| GET    | `/admin/content/pending`          | admin | Queue recipe/post/video chờ duyệt                               |
| GET    | `/admin/users/:id`                | admin | Chi tiết quản trị đã giới hạn dữ liệu nhạy cảm                  |
| PATCH  | `/admin/users/:id/role`           | admin | Đổi role với guard chống tự hạ quyền admin cuối cùng            |
| GET    | `/admin/ai/runs`                  | admin | List AI runs theo feature/model/status/time                     |
| GET    | `/admin/ai/runs/:id`              | admin | Chi tiết metadata đã redact của một run                         |
| GET    | `/admin/ai/metrics`               | admin | Success rate, latency, usage, feedback rate; không bịa accuracy |
| GET    | `/admin/ai/feedback`              | admin | List/tổng hợp user feedback đã bảo vệ dữ liệu                   |

Nếu chưa có ground-truth dataset thì dashboard không được gọi một metric là “accuracy”. Dùng các tên đo được như success rate, schema-valid rate, user helpful rate và latency. Mọi admin filter phải có pagination/range limit.

### 13.17 Checklist API dành riêng cho mobile

Trước khi coi là hoàn thành, agent phải đối chiếu các luồng mobile sau với API thật:

- Mở app, bootstrap, guest home, authenticated home.
- Firebase login/register/reset-password là `CLIENT_ONLY`; sync account và lấy `/auth/me` là backend.
- Onboarding diet/allergen/goal/activity.
- Xem/sửa profile, nutrition profile, avatar qua media flow.
- Browse/search/filter/autocomplete/recent search/discover/recommendation.
- Xem recipe, nguyên liệu, nutrition, comment, reaction, rating, save.
- Tạo/sửa/gửi duyệt recipe của user.
- Pantry thủ công, bulk và AI recognition-confirm.
- Meal plan thủ công, AI proposal-confirm, active/current/clone.
- Grocery list tạo thủ công hoặc từ meal plan, check/clear item.
- Diary, daily summary, weight trend, water total.
- Blog/community post CRUD, submit, comment, reaction, save, report.
- Video upload qua R2, metadata CRUD, submit/publish, playback URL, progress, transcript, summary, related content.
- Saved list, ratings, activity và view history.
- AI chat/conversation, ingredient recognition, meal planning, video summary, feedback.
- FCM token, inbox notification, unread count, preferences, reminder CRUD.
- Report content/user và theo dõi báo cáo của mình.
- Admin dashboard, user management, master data, moderation queue, content review, reports, AI metrics và audit logs.

Nếu một luồng trên không thể hoàn thành chỉ với contract hiện có, phải bổ sung API trước khi bàn giao.

---

## 14. Validation chi tiết

Tạo Zod schemas riêng cho `params`, `query`, `body`. Middleware trả dữ liệu đã parse/coerce vào `req.validated` để controller không dùng input raw.

Quy tắc tối thiểu:

- ObjectId phải hợp lệ trước khi query.
- String trim, min/max length rõ ràng.
- Email normalize lowercase.
- Số phải finite; quantity/weight/height/calorie > 0 và có giới hạn hợp lý.
- Ngày phải parse được; range `from <= to`.
- URL chỉ cho `https` ở production, ngoại trừ localhost development.
- Array có giới hạn số phần tử; loại duplicate khi hợp lý.
- Unit lấy từ enum tập trung: `g`, `kg`, `ml`, `l`, `piece`, `tbsp`, `tsp`, `cup`, `serving`.
- Reject field lạ đối với body quan trọng bằng `.strict()`.
- Không cho client gửi `userId`, `role`, `status`, counters, `createdAt` để tự chiếm quyền hoặc sửa dữ liệu hệ thống.
- Với PATCH, yêu cầu ít nhất một field được phép.
- Validate target type bằng enum và kiểm tra target thực tế trong service.

---

## 15. Security và privacy

- Helmet với cấu hình phù hợp cho API và Swagger.
- CORS allowlist; không dùng `*` khi có authorization.
- Rate limit global và riêng cho auth sync, upload request, AI.
- Giới hạn JSON body.
- Không nhận binary upload qua Express.
- Chống NoSQL injection bằng validation/whitelist; không đưa object raw của client vào filter/update.
- Chỉ dùng `$set` từ object đã pick field.
- Escape regex search và giới hạn search length.
- Log redaction cho Authorization, Firebase token, FCM token, private key, API key, medical notes.
- Error response không lộ stack/SDK details.
- Quyền sở hữu kiểm tra tại service bằng authenticated user, không tin path/body user ID.
- Media key không đoán được; presigned URL thời gian ngắn.
- Admin endpoint luôn cần role admin.
- Soft-deleted/suspended account không được thực hiện action.
- Dữ liệu dinh dưỡng/sức khỏe chỉ trả cho owner hoặc use case admin được phép và có audit.
- Không thu thập dữ liệu không cần thiết.
- Tạo endpoint account deletion ở mức dữ liệu nội bộ; README ghi rõ việc xóa Firebase user cần quy trình quản trị riêng nếu chưa tự động hóa.

---

## 16. Logging và observability

- Pino JSON log ở production; pretty transport chỉ development.
- Mỗi request có request ID.
- Log start/finish, status code, duration; không log body mặc định.
- Log domain error ở level phù hợp; 4xx dự kiến không cần stack noise.
- Provider call log tên provider, operation, duration, success/failure; không log prompt/media/token nhạy cảm.
- Scheduler log batch, claimed, sent, failed.
- Health endpoint có version và uptime.

---

## 17. OpenAPI và Swagger

Tạo `docs/openapi.yaml` theo OpenAPI 3.1 hoặc 3.0.3, bao gồm:

- Server URL theo API prefix.
- Bearer security scheme mô tả Firebase ID token.
- Tags theo module.
- Tất cả path ở mục 13.
- Params/query/body schemas.
- Response success/error dùng reusable components.
- Pagination metadata.
- Enum và example hợp lý, không chứa secret.
- Mô tả rõ route public/user/admin/owner.
- Media upload request/confirm flow.
- AI disabled và provider error responses.
- App bootstrap/home/onboarding, video, rating, view history, recommendation, admin dashboard và AI monitoring.
- `operationId` duy nhất cho mọi operation.

Swagger UI mount tại `/api-docs` khi `SWAGGER_ENABLED=true`. Raw spec tại `/api-docs/openapi.yaml` hoặc endpoint tương đương.

Tạo contract test đối chiếu `src/routes/api-manifest.js` với `docs/openapi.yaml`. Số endpoint trong manifest, số operation OpenAPI và số route đã mount phải khớp sau khi chuẩn hóa path parameter. Mọi ngoại lệ kỹ thuật như Swagger route phải được whitelist rõ ràng trong test, không bỏ qua toàn cục.

---

## 18. Seed data

Tạo `scripts/seed.js` idempotent:

- Upsert admin bằng `SEED_ADMIN_FIREBASE_UID` và `SEED_ADMIN_EMAIL`; không tạo password.
- Seed category thực phẩm/công thức/bài viết cơ bản.
- Seed các allergen phổ biến.
- Seed tối thiểu 20 food items thực vật với nutrition hợp lý và ghi rõ dữ liệu demo.
- Seed tối thiểu 8 recipe mẫu có ingredients/steps/nutrition snapshot.
- Không xóa dữ liệu đang có.
- Có log số bản ghi tạo mới/cập nhật.
- Từ chối chạy nếu seed admin vẫn là `CHANGE_ME`, nhưng có thể seed master data bằng option rõ ràng hoặc bỏ qua admin an toàn.

---

## 19. Testing bắt buộc

### 19.1 Nguyên tắc

- Vitest + Supertest.
- Test không gọi Firebase, R2, FCM hoặc AI thật.
- Provider và auth verifier phải injectable/mocked.
- Không phụ thuộc thứ tự test.
- Mỗi test tự tạo/cleanup fixture của nó.
- Nếu integration test cần database, cho phép dùng MongoDB test URI riêng được inject trong test; không được chạy vào production DB.

### 19.2 Unit test tối thiểu

- Env schema: boolean/number/private key parsing và conditional requirement.
- Error mapper.
- Auth middleware: missing/malformed/invalid/valid token; suspended user.
- Authorization roles.
- Validation middleware và representative schemas.
- Nutrition calculation/aggregation.
- Recipe nutrition snapshot calculation.
- Grocery item merge/conversion.
- Pantry recipe matching score.
- Meal plan activation invariant.
- Unique reaction/saved behavior.
- AI structured output validation và disabled state.
- Reminder next-run calculation, atomic claim và idempotency key.
- R2 key/MIME/size validation.
- Video publish guard, watch progress và view deduplication.
- Rating aggregate/recalculation.
- Recommendation loại trừ allergen và nội dung không public.
- AI run metric/feedback aggregation không lộ raw prompt.

### 19.3 Integration/API test tối thiểu

- Health/liveness/readiness.
- Auth sync idempotency.
- Owner không truy cập dữ liệu user khác.
- User không gọi admin route.
- Admin CRUD category/allergen/food.
- Recipe draft → submit → publish → public visibility.
- Pantry CRUD.
- Meal plan CRUD/activate/grocery generation.
- Diary summary.
- Media upload request/confirm với mock R2.
- Post/comment/reaction/saved flows.
- AI proposal → confirm idempotently với mock AI.
- Notification read/preferences.
- Report → moderation action → audit log.
- App config/bootstrap/home không lộ secret hoặc draft content.
- Onboarding status → update → complete.
- Search suggestions/recent history và xóa history.
- Recommendation không trả allergen bị loại trừ.
- Video draft → upload media ready → submit → publish → progress/transcript/related.
- Rating create/update/delete và aggregate chính xác.
- View history chỉ owner truy cập được.
- Admin dashboard/AI metrics chỉ admin truy cập được.
- Validation error shape, 404, conflict và rate limit representative.

### 19.4 Contract test bắt buộc

- Tất cả endpoint chương 13 tồn tại trong `api-manifest`.
- Tất cả manifest endpoint được mount.
- Tất cả mounted business routes có trong OpenAPI.
- Tất cả OpenAPI operations có route thật.
- Auth level và role chính khớp manifest.
- Mọi `operationId` duy nhất.
- `docs/api-matrix.md` không có dòng nghiệp vụ để trống endpoint/test, ngoại trừ dòng `CLIENT_ONLY` có lý do.

Nếu không thể dùng MongoDB in-memory vì danh sách dependency bị giới hạn, hãy thiết kế repository tests với mock và cung cấp integration tests chạy khi có `MONGODB_URI_TEST`; các test còn lại không được thất bại chỉ vì không có external service. Ghi rõ lệnh chạy integration DB trong README.

---

## 20. README bắt buộc

`README.md` phải hoàn toàn tự đủ, bao gồm:

1. Mô tả project và phạm vi.
2. Kiến trúc và luồng request.
3. Yêu cầu Node.js/npm/MongoDB/Firebase/R2/AI.
4. Hướng dẫn cài đặt từng bước.
5. Cách sao chép/điền `.env`; bảng mô tả tất cả biến môi trường, required/optional/default.
6. Cách lấy Firebase Admin credentials ở mức khái niệm, nhưng không yêu cầu link ngoài.
7. Cách cấu hình Cloudflare R2 CORS để Android client PUT trực tiếp và public/custom domain nếu dùng.
8. Cách chạy development/production/test/format/seed.
9. Cách client lấy Firebase ID token và gửi Bearer token ở mức flow, không chứa code mobile ngoài phạm vi.
10. Media upload flow.
11. AI provider behavior và cách app hoạt động khi AI tắt.
12. Reminder scheduler behavior và giới hạn single-instance.
13. Danh sách module/API docs URL.
14. Business rules quan trọng.
15. Security notes và những gì không được log/lưu.
16. Deployment checklist: env, Mongo indexes, health check, graceful shutdown, CORS, R2, Firebase, Swagger production.
17. Known limitations và hướng mở rộng tương lai.

README không được chứa link bắt buộc để hiểu cách chạy project.

---

## 21. Chất lượng và hiệu năng

- Route phổ biến phải dùng lean query khi không cần Mongoose document behavior.
- Projection để không tải field thừa.
- Populate có chọn field; tránh nested populate không giới hạn.
- Không N+1 query trong list.
- Pagination mọi collection tăng trưởng.
- Index phù hợp với query thực tế.
- Không dùng transaction cho read đơn giản.
- Service giữ function nhỏ, tên thể hiện use case.
- Code không có `console.log` tùy tiện; dùng logger.
- Không có TODO/FIXME trong luồng bắt buộc khi bàn giao.
- Không có secret thật trong repository.
- Error code ổn định và có thể dùng bởi mobile client.
- Tất cả thời gian lưu UTC; timezone chỉ dùng khi tính lịch/hiển thị.
- Các thao tác confirm/submit/activate/save/reaction phải idempotent khi có thể.

---

## 22. Thứ tự triển khai bắt buộc

Thực hiện tuần tự nhưng tiếp tục tự động, không dừng sau mỗi phase để xin phép.

### Phase 0 — Khảo sát

- Kiểm tra workspace, Git status và file có sẵn.
- Xác định phần nào cần giữ nguyên.
- Lập checklist ngắn trong quá trình làm, không thay thế việc code.

### Phase 1 — Foundation

- `package.json`, config, env, logger, database.
- Errors, response, validation middleware, auth/authorize.
- Firebase/R2/AI provider interface.
- App/server/container/routes.
- Health endpoints.
- Basic tests.
- API manifest, OpenAPI skeleton và API matrix skeleton được tạo ngay từ đầu.

### Phase 2 — Identity và master data

- Auth sync, users, profiles, nutrition profiles.
- Categories, allergens, food items.
- Indexes, authorization và tests.

### Phase 3 — Planning và tracking

- Recipes/search/discover.
- Pantry, meal plans, grocery lists.
- Diary, weight, water.
- Business calculations và tests.

### Phase 4 — Media và community

- R2 presigned upload/confirm/delete.
- Posts, comments, reactions, saved items.
- Video tutorial, rating và view/watch history.
- Counters, moderation status và tests.

### Phase 5 — AI và notifications

- Conversations/messages.
- Meal-plan/pantry proposals và confirmation.
- Ingredient recognition/video summary adapters.
- Notifications/preferences/reminders.
- DB polling scheduler và tests.
- AI runs, user feedback và metric aggregation.

### Phase 6 — Admin và moderation

- Reports, moderation cases, user suspension.
- Audit log cho mọi admin mutation.
- Dashboard, pending-content queue và AI monitoring.
- Tests.

### Phase 7 — Documentation và hardening

- Hoàn thiện OpenAPI cho mọi route.
- Seed script.
- README.
- Hoàn thiện `docs/api-matrix.md`; chạy contract test API manifest ↔ Express routes ↔ OpenAPI.
- Format, test, startup smoke test.
- Rà soát security, ownership, indexes, secret leakage và dead code.

---

## 23. Kiểm tra trước khi bàn giao

Chạy tối thiểu:

```bash
npm install
npm run format
npm run format:check
npm run test:run
```

Sau đó thực hiện smoke test khởi động bằng env test/local hợp lệ. Nếu external credentials chưa được người dùng điền:

- Không giả vờ kết nối thành công.
- Test phải dùng mock.
- Báo rõ smoke test nào bị chặn vì placeholder.
- Ứng dụng phải fail fast với thông báo cấu hình rõ ràng khi integration bắt buộc được bật nhưng credential thiếu.

Rà soát bằng tìm kiếm toàn project:

- Không còn `require(` hoặc `module.exports`.
- Không có password/passwordHash trong model.
- Không có hard-coded secret.
- Không có dependency bị cấm.
- Không có route thiếu validation/authorization cần thiết.
- Không có controller chứa business logic lớn.
- Không có endpoint public trả draft/hidden/deleted.
- Không có TODO trong yêu cầu bắt buộc.

---

## 24. Definition of Done

Chỉ được coi là hoàn thành khi:

- Project cài được dependency và có cấu trúc đầy đủ.
- `.env` và `.env.example` đã tạo sẵn toàn bộ key để người dùng chỉ điền giá trị.
- Database models, constraints và indexes đã triển khai.
- Tất cả endpoint bắt buộc đã có code thật.
- Toàn bộ luồng mobile trong mục 13.17 đã được map sang API hoặc `CLIENT_ONLY` hợp lệ.
- `api-manifest`, Express routes, OpenAPI và `docs/api-matrix.md` đã được contract test và không lệch nhau.
- Firebase auth verification, R2 presigned upload, AI adapter và FCM adapter được cô lập qua provider.
- Không lưu mật khẩu trong MongoDB.
- Ownership/role được kiểm tra đúng.
- Zod validation áp dụng ở tất cả API boundary.
- OpenAPI mô tả đầy đủ API.
- Seed script idempotent.
- Test quan trọng chạy qua hoặc blocker external được nêu chính xác.
- Video, rating/vote, view history, recommendation, admin dashboard và AI monitoring đã có API/test đầy đủ.
- Code đã format.
- README đủ để một developer mới chạy project mà không cần đọc link khác.
- Không dùng BullMQ, Redis, ESLint, Nodemon hoặc dependency bị cấm.

---

## 25. Báo cáo cuối cùng của agent

Sau khi hoàn thành, trả lời người dùng bằng báo cáo ngắn, có bằng chứng:

1. Những gì đã tạo/thay đổi.
2. Kiến trúc và module đã hoàn thành.
3. Kết quả các lệnh format/test/smoke test.
4. Những biến `.env` người dùng cần điền trước tiên.
5. Bất kỳ phần nào bị chặn bởi credential/dịch vụ ngoài.
6. Cách chạy ngay:

```bash
npm install
# điền .env
npm run seed
npm run dev
```

Không kết thúc bằng một kế hoạch chưa thực hiện. Hãy xây dựng backend thực tế từ A–Z theo tài liệu này.
