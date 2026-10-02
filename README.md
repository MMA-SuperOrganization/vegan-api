# vegan-api-mma302

Backend API cho Vegan Support Mobile Application (MMA302). Hệ thống được xây dựng để cung cấp các luồng nghiệp vụ đầy đủ cho app hỗ trợ chế độ ăn thực vật, bao gồm: quản lý tài khoản, công thức nấu ăn, theo dõi dinh dưỡng, kế hoạch bữa ăn, nhật ký sức khỏe, mua sắm, nhận diện nguyên liệu, AI hỗ trợ, và mạng xã hội.

## 1. Mô tả dự án và phạm vi

Dự án này là Backend hoàn chỉnh cung cấp API cho ứng dụng di động MMA302. Nó thực hiện xác thực qua Firebase, lưu trữ media trực tiếp qua Cloudflare R2 bằng Presigned URL, xử lý logic nghiệp vụ về dinh dưỡng, AI, và lên kế hoạch bữa ăn. Kiến trúc được thiết kế theo hướng Modular Monolith, đảm bảo khả năng bảo trì và dễ dàng test.

## 2. Kiến trúc và luồng request

Hệ thống sử dụng **Modular Monolith** với thủ công Dependency Injection (DI) qua `src/container.js`.
Luồng xử lý một request tiêu chuẩn:
`Client Request -> Route -> authenticate/authorize (Middleware) -> validate Zod (Middleware) -> Controller -> Service -> Repository -> Mongoose Model -> Database`.

- **Controller**: Chịu trách nhiệm nhận HTTP request, đọc `req.validated` và `req.auth`, gọi Service và trả về API Response chuẩn.
- **Service**: Nơi tập trung business logic, throw `AppError` nếu có lỗi.
- **Repository**: Nơi duy nhất gọi đến MongoDB. Trả dữ liệu dạng Plain JS Object (`.lean()`).
- **Model**: Định nghĩa Schema, Index, Validation mức DB.

## 3. Yêu cầu hệ thống

- **Node.js**: >= 24 (Sử dụng `--env-file` và `--watch` built-in, không dùng dotenv hay nodemon).
- **npm**: >= 10.
- **MongoDB**: v8+ (Local, Docker hoặc Atlas).
- **Firebase**: Project đã bật Authentication. Cần Service Account để verify ID Token.
- **Cloudflare R2**: Bucket S3-compatible cho media upload (video, avatar, recipe image).
- **AI Provider**: (Tùy chọn) OpenAI-compatible API cho các tính năng Meal Plan, Chatbot.

## 4. Hướng dẫn cài đặt

Thực hiện các bước sau để chạy local:

```bash
git clone <repo_url>
cd vegan-api-mma302
npm install
```

## 5. Cấu hình biến môi trường (.env)

Copy file cấu hình mẫu và điền thông tin:

```bash
cp .env.example .env
```

Bảng mô tả các biến môi trường:

| Biến                                     | Bắt buộc      | Mặc định            | Ghi chú                                             |
| ---------------------------------------- | ------------- | ------------------- | --------------------------------------------------- |
| `NODE_ENV`                               | Có            | `development`       | `development`, `test`, `production`                 |
| `PORT`                                   | Không         | `3000`              | Cổng chạy app                                       |
| `MONGODB_URI`                            | Có            | -                   | URI kết nối MongoDB (Local hoặc Atlas)              |
| `MONGODB_URI_TEST`                       | Không         | -                   | Dùng riêng cho Integration test (tùy chọn)          |
| `CORS_ORIGINS`                           | Không         | `*`                 | Origin cho phép, phân tách bằng dấu phẩy            |
| `LOG_LEVEL`                              | Không         | `info`              | Mức log của Pino (`debug`, `info`, `warn`, `error`) |
| `TRUST_PROXY`                            | Không         | `0`                 | Số lượng proxy nếu chạy sau Nginx/Cloudflare        |
| `SWAGGER_ENABLED`                        | Không         | `true`              | Bật/tắt `/api-docs`                                 |
| `FIREBASE_PROJECT_ID`                    | Có            | -                   | ID dự án Firebase                                   |
| `FIREBASE_CLIENT_EMAIL`                  | Tùy chọn      | -                   | Email từ Service Account                            |
| `FIREBASE_PRIVATE_KEY`                   | Tùy chọn      | -                   | Khóa bí mật từ Service Account (giữ nguyên `\n`)    |
| `CLOUDFLARE_R2_ENDPOINT`                 | Có            | -                   | S3 Endpoint API của Cloudflare R2                   |
| `CLOUDFLARE_R2_ACCESS_KEY_ID`            | Có            | -                   | Access key R2                                       |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY`        | Có            | -                   | Secret key R2                                       |
| `CLOUDFLARE_R2_BUCKET_NAME`              | Có            | -                   | Tên bucket R2                                       |
| `CLOUDFLARE_R2_PUBLIC_URL`               | Không         | -                   | URL Public/Custom Domain của R2 để lấy file         |
| `CLOUDFLARE_R2_PRESIGNED_URL_EXPIRES_IN` | Không         | `300`               | TTL cho URL upload (giây)                           |
| `AI_ENABLED`                             | Không         | `false`             | Bật/tắt gọi AI Provider                             |
| `AI_BASE_URL`                            | Có khi AI bật | -                   | Base URL của OpenAI-compatible API                  |
| `AI_API_KEY`                             | Có khi AI bật | -                   | Key gọi AI API                                      |
| `AI_MODEL`                               | Không         | `gpt-4o-mini`       | Model sử dụng                                       |
| `SEED_ADMIN_FIREBASE_UID`                | Không         | `CHANGE_ME`         | UID Firebase để cấp quyền Admin khi seed            |
| `SEED_ADMIN_EMAIL`                       | Không         | `admin@example.com` | Email hiển thị của Admin khi seed                   |

## 6. Firebase Admin Credentials

Để backend xác minh được `idToken` gửi từ mobile, cần thông tin Service Account.

1. Truy cập Firebase Console -> Project Settings -> Service Accounts.
2. Bấm "Generate new private key".
3. Mở file JSON tải về, copy `project_id`, `client_email`, và toàn bộ `private_key` (bao gồm các ký tự `\n`).
4. Dán vào `.env`. Backend tự parse `\n` thành newline thật.

## 7. Cấu hình Cloudflare R2 CORS

Để ứng dụng di động (Android/iOS) có thể gọi `PUT` trực tiếp lên R2 thông qua presigned URL mà không bị lỗi trình duyệt, bạn cần thiết lập CORS Policy cho Bucket.
Tạo một quy tắc CORS trong dashboard Cloudflare R2 cho phép:

- Allowed Origins: `*` (hoặc các domain của bạn)
- Allowed Methods: `GET`, `PUT`
- Allowed Headers: `*`
  Nếu bạn dùng Custom Domain cho public access, hãy điền tên miền vào biến `CLOUDFLARE_R2_PUBLIC_URL`.

## 8. Các lệnh khởi chạy

- **Chạy môi trường phát triển (Watch mode):**
  ```bash
  npm run dev
  ```
- **Chạy môi trường Production:**
  _(Biến môi trường cần được truyền từ hệ thống/container, không dùng `.env` file)_
  ```bash
  npm start
  ```
- **Chạy Tests (Unit & Integration):**
  ```bash
  npm run test:run
  npm test          # Watch mode
  ```
- **Format Code (Prettier):**
  ```bash
  npm run format
  npm run format:check
  ```
- **Nạp dữ liệu mẫu (Seed):**
  ```bash
  npm run db:seed
  ```
  _(Lưu ý: Bạn phải thiết lập `SEED_ADMIN_FIREBASE_UID` khác `CHANGE_ME` để gán quyền admin. Không xóa dữ liệu cũ, chạy idempotent)._

## 9. Luồng xác thực Firebase

1. Mobile app tích hợp Firebase SDK, người dùng login/register qua Client (Google, Email, v.v.).
2. Mobile gọi SDK lấy `idToken`.
3. Mobile gửi HTTP request đến Backend với Header: `Authorization: Bearer <idToken>`.
4. Backend nhận request, dùng `firebase-admin` verify token, giải mã ra `uid`.
5. Backend ánh xạ `uid` vào MongoDB, xác định `userId` nội bộ, role và status.

## 10. Luồng Upload Media (Cloudflare R2)

1. Mobile yêu cầu upload một file (VD: ảnh avatar): Gửi `POST /api/v1/media/upload-requests` với `{ filename, mimeType, sizeBytes, purpose }`.
2. Backend kiểm tra giới hạn size, mimeType và tạo Object Key an toàn theo namespace (vd: `avatars/<uuid>.jpg`).
3. Backend tạo bản ghi `MediaAsset` với status `pending` và sinh Presigned URL từ R2 (S3 API).
4. Backend trả về Presigned URL cho Mobile.
5. Mobile tự gọi phương thức `PUT` kèm file lên Presigned URL.
6. Mobile gọi `POST /api/v1/media/<id>/confirm` báo hoàn tất. Backend `HeadObject` kiểm tra tồn tại và size, chuyển file sang trạng thái `ready`.

## 11. Hành vi của AI Provider

- Nếu `AI_ENABLED=false`, các endpoint AI sẽ trả về lỗi `503 AI_DISABLED`, app di động sẽ xử lý gracefully (ẩn tính năng AI) mà không crash.
- Mọi giao tiếp với AI API dùng `fetch` native với timeout bằng `AbortController`.
- Bất kỳ kết quả trả về từ AI (Meal Plan, Pantry Proposal, Ingredient recognition) đều được parse bằng `Zod` schema. Nếu sai cấu trúc, backend reject lỗi 500/502.
- Người dùng LUÔN PHẢI GỌI bước xác nhận `confirm` từ endpoint để thay đổi CSDL; AI không được phép tự ghi đè CSDL của người dùng.

## 12. Scheduler Nhắc Nhở (Reminders)

- Backend tích hợp một cơ chế poll database đơn giản bằng `setInterval` để xử lý các reminders `nextRunAt <= now()`.
- Chống race condition bằng cách `findOneAndUpdate` kết hợp trạng thái `locked` và `lockedBy`.
- **Hạn chế:** Hệ thống scheduler này chỉ được thiết kế cho **một instance duy nhất**. Nếu triển khai nhiều instance (scale horizontal), cần chuyển sang hệ thống Queue (Redis/BullMQ) hoặc Leader Election.

## 13. Danh sách Module & API Docs

- Swagger UI có sẵn tại: `http://localhost:3000/api-docs` (Khi chạy môi trường Dev).
- Các module tích hợp: `users`, `auth`, `categories`, `allergens`, `food-items`, `recipes`, `nutrition-profiles`, `posts`, `comments`, `reactions`, `saved-items`, `media`, `pantries`, `meal-plans`, `grocery-lists`, `diary`, `weight-logs`, `water-logs`, `ai`, `notifications`, `reminders`, `reports`, `moderation`, `admin-dashboard`, `ai-monitoring`.

## 14. Business Rules Quan Trọng

1. Một Firebase UID chỉ ánh xạ đến MỘT người dùng MongoDB duy nhất.
2. FoodItem là Master Data (Admin quản lý). Ingredient trong công thức là FoodItem + lượng + đơn vị.
3. Không tự ý trừ Pantry khi hoàn thành bữa ăn trừ khi user đồng ý.
4. Xóa mềm (Soft-delete): Các dữ liệu quan trọng như Recipe, Post, Account được đánh cờ xóa, không xóa vật lý để giữ tính nhất quán của dữ liệu cũ.
5. AI được coi là trợ lý tham khảo, mọi gợi ý (meal plan) cần người dùng "confirm" trước khi active. AI không thay thế tư vấn y tế.

## 15. Security & Privacy

- **Những thứ không lưu / không log:** Không lưu password, API Key, Token thô, dữ liệu prompt rác của AI, FCM token, hoặc IP người dùng vào text logs tĩnh chưa redact.
- Dùng `helmet`, chống NoSQL Injection bằng cách filter object, cấu hình CORS nghiêm ngặt cho app.
- Role/Status không bao giờ được thay đổi qua `req.body` từ client; Zod `.strict()` loại bỏ mọi trường lạ.

## 16. Deployment Checklist

Trước khi đưa lên Production, hãy rà soát:

- [ ] Môi trường nạp biến hệ thống (`NODE_ENV=production`), không đọc file `.env`.
- [ ] MongoDB URL đã thay thành Replica Set/Atlas chuyên dụng.
- [ ] Các Index của Mongoose đã được build xong (`pantryItemSchema.index`, `diarySchema.index`, v.v.).
- [ ] Health Check (`/api/v1/health/ready`) pass.
- [ ] CORS đã cấu hình đúng với Origin cần thiết (nếu truy cập từ Web). Mobile bỏ qua CORS nhưng R2 Bucket vẫn cần CORS.
- [ ] R2 Bucket đã sinh Presigned URL hoạt động.
- [ ] Firebase Service Account đã config đúng, không bị lộ.
- [ ] Tính năng Swagger đã tự động tắt (`SWAGGER_ENABLED=false`).
- [ ] Đã triển khai Graceful Shutdown để không làm đứt request.

## 17. Known Limitations & Tương Lai

- **Reminders Engine**: Poll memory DB đơn giản chỉ phù hợp với lưu lượng vừa/nhỏ và Single Instance. Tương lai cần thay bằng Message Queue (RabbitMQ/BullMQ).
- **Phân tích Media/Video Streaming**: Hiện video được tải thẳng qua R2. Nếu lượng user cao, cần Cloudflare Stream hoặc Mux để adaptive streaming, transcode thành HLS/DASH thay vì `video/mp4` nguyên gốc.
- **Tính toán lượng calo**: Tạm thời cộng dồn theo Food Items, có sai số với việc hao hụt trong chế biến.
