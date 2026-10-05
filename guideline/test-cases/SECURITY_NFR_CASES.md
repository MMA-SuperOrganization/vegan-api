# Security / NFR — bảo mật, chất lượng và vận hành

[Quay lại danh mục FE](../BACKEND_TEST_CASES.md) · [Mã Playwright](../../tests/playwright/nfr-cases.spec.js)

Tổng cộng **24 case**. Dữ liệu yêu cầu dưới đây giữ nguyên từ sheet `Security NFR`; kết quả chạy: **11:38:54 5/10/26 (Asia/Ho_Chi_Minh)**. Xem phạm vi mô phỏng và khác biệt contract trong danh mục FE trước khi dùng trạng thái để đánh giá tích hợp.

## Mục lục

- [Security / Quality / Operations (24 case)](#module-1)

<a id="module-1"></a>

## Security / Quality / Operations

| ID                    | Chức năng / endpoint                      | Loại test      | Ưu tiên | Actor    | Kết quả chạy        |
| --------------------- | ----------------------------------------- | -------------- | ------- | -------- | ------------------- |
| [NFR-0001](#nfr-0001) | SEC-01 NoSQL injection                    | Non-functional | P1      | QA/Admin | Đạt                 |
| [NFR-0002](#nfr-0002) | SEC-02 Mass assignment                    | Non-functional | P1      | QA/Admin | Đạt                 |
| [NFR-0003](#nfr-0003) | SEC-03 CORS                               | Non-functional | P1      | QA/Admin | Đạt                 |
| [NFR-0004](#nfr-0004) | SEC-04 Rate limit                         | Non-functional | P1      | QA/Admin | Đạt                 |
| [NFR-0005](#nfr-0005) | SEC-05 Log redaction                      | Non-functional | P1      | QA/Admin | Đạt                 |
| [NFR-0006](#nfr-0006) | SEC-06 Error exposure                     | Non-functional | P1      | QA/Admin | Đạt                 |
| [NFR-0007](#nfr-0007) | SEC-07 JSON body limit                    | Non-functional | P1      | QA/Admin | Đạt                 |
| [NFR-0008](#nfr-0008) | SEC-08 HTTPS và secret phía server        | Non-functional | P1      | QA/Admin | Chưa chạy (Blocked) |
| [NFR-0009](#nfr-0009) | PERF-01 API latency baseline              | Non-functional | P1      | QA/Admin | Chưa chạy (Blocked) |
| [NFR-0010](#nfr-0010) | PERF-02 Large list query                  | Non-functional | P1      | QA/Admin | Chưa chạy (Blocked) |
| [NFR-0011](#nfr-0011) | PERF-03 Upload lớn                        | Non-functional | P1      | QA/Admin | Chưa chạy (Blocked) |
| [NFR-0012](#nfr-0012) | PERF-04 Memory stability                  | Non-functional | P1      | QA/Admin | Chưa chạy (Blocked) |
| [NFR-0013](#nfr-0013) | OPS-01 Fail-fast env                      | Non-functional | P1      | QA/Admin | Đạt                 |
| [NFR-0014](#nfr-0014) | OPS-02 Optional AI disabled               | Non-functional | P1      | QA/Admin | Đạt                 |
| [NFR-0015](#nfr-0015) | OPS-03 Graceful shutdown                  | Non-functional | P1      | QA/Admin | Đạt                 |
| [NFR-0016](#nfr-0016) | OPS-04 DB outage                          | Non-functional | P1      | QA/Admin | Đạt                 |
| [NFR-0017](#nfr-0017) | OPS-05 Seed idempotent                    | Non-functional | P1      | QA/Admin | Chưa chạy (Blocked) |
| [NFR-0018](#nfr-0018) | OPS-06 Backup restore                     | Non-functional | P1      | QA/Admin | Chưa chạy (Blocked) |
| [NFR-0019](#nfr-0019) | CONTRACT-01 184 routes đủ                 | Non-functional | P1      | QA/Admin | Đạt                 |
| [NFR-0020](#nfr-0020) | CONTRACT-02 Response standard             | Non-functional | P1      | QA/Admin | Đạt                 |
| [NFR-0021](#nfr-0021) | CONTRACT-03 Sorting/pagination validation | Non-functional | P1      | QA/Admin | Đạt                 |
| [NFR-0022](#nfr-0022) | DATA-01 Unique indexes                    | Non-functional | P1      | QA/Admin | Chưa chạy (Blocked) |
| [NFR-0023](#nfr-0023) | DATA-02 UTC serialization                 | Non-functional | P1      | QA/Admin | Đạt                 |
| [NFR-0024](#nfr-0024) | DATA-03 Rollback transaction              | Non-functional | P1      | QA/Admin | Đạt                 |

<a id="nfr-0001"></a>

### NFR-0001

**Chức năng:** SEC-01 NoSQL injection

**Module:** Security / Quality / Operations · **Loại:** Non-functional · **Ưu tiên:** P1 · **Actor:** QA/Admin

**Nguồn Excel:** Security NFR, hàng 2 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Staging độc lập; không load/destructive test vào production
```

**Dữ liệu test:**

```text
q[$ne]=x; body {$set:{role:admin}}; id {$gt:""}
```

**Các bước thực hiện:**

```text
Gửi payload từng endpoint nhận query/body
```

**Kết quả mong đợi (Excel):**

```text
400 hoặc bỏ field theo strict contract; không query mở rộng, không role escalation
```

<a id="nfr-0002"></a>

### NFR-0002

**Chức năng:** SEC-02 Mass assignment

**Module:** Security / Quality / Operations · **Loại:** Non-functional · **Ưu tiên:** P1 · **Actor:** QA/Admin

**Nguồn Excel:** Security NFR, hàng 3 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Staging độc lập; không load/destructive test vào production
```

**Dữ liệu test:**

```text
role=admin; userId=B; createdAt cũ; counter=999
```

**Các bước thực hiện:**

```text
Gửi PATCH profile/post/recipe
```

**Kết quả mong đợi (Excel):**

```text
Field bị reject; dữ liệu hệ thống không đổi
```

<a id="nfr-0003"></a>

### NFR-0003

**Chức năng:** SEC-03 CORS

**Module:** Security / Quality / Operations · **Loại:** Non-functional · **Ưu tiên:** P1 · **Actor:** QA/Admin

**Nguồn Excel:** Security NFR, hàng 4 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Staging độc lập; không load/destructive test vào production
```

**Dữ liệu test:**

```text
Origin lạ và origin allowlist
```

**Các bước thực hiện:**

```text
OPTIONS + request cả hai Origin
```

**Kết quả mong đợi (Excel):**

```text
CORS trả allow-origin/header đúng allowlist; origin ngoài allowlist không được cấp quyền qua browser. Mọi request vẫn phải qua authentication/authorization; CORS không thay auth.
```

<a id="nfr-0004"></a>

### NFR-0004

**Chức năng:** SEC-04 Rate limit

**Module:** Security / Quality / Operations · **Loại:** Non-functional · **Ưu tiên:** P1 · **Actor:** QA/Admin

**Nguồn Excel:** Security NFR, hàng 5 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Staging độc lập; không load/destructive test vào production
```

**Dữ liệu test:**

```text
RATE_LIMIT_MAX+1 request; auth/upload/AI giới hạn riêng
```

**Các bước thực hiện:**

```text
Gửi burst staging; chờ window reset
```

**Kết quả mong đợi (Excel):**

```text
429 với header phù hợp; không crash; reset đúng env
```

<a id="nfr-0005"></a>

### NFR-0005

**Chức năng:** SEC-05 Log redaction

**Module:** Security / Quality / Operations · **Loại:** Non-functional · **Ưu tiên:** P1 · **Actor:** QA/Admin

**Nguồn Excel:** Security NFR, hàng 6 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Staging độc lập; không load/destructive test vào production
```

**Dữ liệu test:**

```text
Bearer secret, FCM token, medical notes
```

**Các bước thực hiện:**

```text
Gửi request lỗi/thành công; đọc log
```

**Kết quả mong đợi (Excel):**

```text
Không raw token/secret/medical notes; có requestId
```

<a id="nfr-0006"></a>

### NFR-0006

**Chức năng:** SEC-06 Error exposure

**Module:** Security / Quality / Operations · **Loại:** Non-functional · **Ưu tiên:** P1 · **Actor:** QA/Admin

**Nguồn Excel:** Security NFR, hàng 7 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Staging độc lập; không load/destructive test vào production
```

**Dữ liệu test:**

```text
Giả Mongo/Firebase/R2 lỗi
```

**Các bước thực hiện:**

```text
Trigger từng provider error
```

**Kết quả mong đợi (Excel):**

```text
Error code ổn định; không stack/URI/private key; log nội bộ có requestId
```

<a id="nfr-0007"></a>

### NFR-0007

**Chức năng:** SEC-07 JSON body limit

**Module:** Security / Quality / Operations · **Loại:** Non-functional · **Ưu tiên:** P1 · **Actor:** QA/Admin

**Nguồn Excel:** Security NFR, hàng 8 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Staging độc lập; không load/destructive test vào production
```

**Dữ liệu test:**

```text
Body lớn hơn JSON_BODY_LIMIT
```

**Các bước thực hiện:**

```text
Gửi request vượt giới hạn
```

**Kết quả mong đợi (Excel):**

```text
413 có kiểm soát; không xử lý body nặng
```

<a id="nfr-0008"></a>

### NFR-0008

**Chức năng:** SEC-08 HTTPS và secret phía server

**Module:** Security / Quality / Operations · **Loại:** Non-functional · **Ưu tiên:** P1 · **Actor:** QA/Admin

**Nguồn Excel:** Security NFR, hàng 9 · **Kết quả chạy:** Chưa chạy (Blocked)

**Lý do chưa chạy:**

```text
Blocked: missing PW_STAGING_URL, PW_STAGING_ISOLATED; this case needs real staging providers
```

**Điều kiện trước khi test:**

```text
Staging độc lập; không load/destructive test vào production
```

**Dữ liệu test:**

```text
Production config, source repository và log staging
```

**Các bước thực hiện:**

```text
Kiểm tra API endpoint HTTPS, env placeholder, Git tracked files và log
```

**Kết quả mong đợi (Excel):**

```text
API production phục vụ HTTPS qua reverse proxy cấu hình đúng; server credentials không hard-code hoặc commit; .env được gitignore; log redact.
```

<a id="nfr-0009"></a>

### NFR-0009

**Chức năng:** PERF-01 API latency baseline

**Module:** Security / Quality / Operations · **Loại:** Non-functional · **Ưu tiên:** P1 · **Actor:** QA/Admin

**Nguồn Excel:** Security NFR, hàng 10 · **Kết quả chạy:** Chưa chạy (Blocked)

**Lý do chưa chạy:**

```text
Blocked: agreed PW_P95_SLA_MS and PW_P99_SLA_MS are required by workbook
```

**Điều kiện trước khi test:**

```text
Staging độc lập; không load/destructive test vào production
```

**Dữ liệu test:**

```text
Staging cùng dữ liệu; 20 concurrent users, 5 phút
```

**Các bước thực hiện:**

```text
Đo p50/p95/p99 và 5xx cho home/search/detail
```

**Kết quả mong đợi (Excel):**

```text
Ghi số đo thật; so với SLA đã chốt; nếu chưa SLA đánh Blocked, không tự Pass
```

<a id="nfr-0010"></a>

### NFR-0010

**Chức năng:** PERF-02 Large list query

**Module:** Security / Quality / Operations · **Loại:** Non-functional · **Ưu tiên:** P1 · **Actor:** QA/Admin

**Nguồn Excel:** Security NFR, hàng 11 · **Kết quả chạy:** Chưa chạy (Blocked)

**Lý do chưa chạy:**

```text
Blocked: RUN_DATABASE_TESTS=true and a dedicated replica-set MONGODB_URI_TEST are required
```

**Điều kiện trước khi test:**

```text
Staging độc lập; không load/destructive test vào production
```

**Dữ liệu test:**

```text
10000 content records; page limit100
```

**Các bước thực hiện:**

```text
Đo list/search với profiler
```

**Kết quả mong đợi (Excel):**

```text
Có pagination/projection/index; không N+1/scan không giới hạn; báo số đo
```

<a id="nfr-0011"></a>

### NFR-0011

**Chức năng:** PERF-03 Upload lớn

**Module:** Security / Quality / Operations · **Loại:** Non-functional · **Ưu tiên:** P1 · **Actor:** QA/Admin

**Nguồn Excel:** Security NFR, hàng 12 · **Kết quả chạy:** Chưa chạy (Blocked)

**Lý do chưa chạy:**

```text
Blocked: missing PW_STAGING_URL, PW_STAGING_ISOLATED, PW_USER_TOKEN, PW_LARGE_UPLOAD; this case needs real staging providers
```

**Điều kiện trước khi test:**

```text
Staging độc lập; không load/destructive test vào production
```

**Dữ liệu test:**

```text
Video 500MiB và 500MiB+1
```

**Các bước thực hiện:**

```text
1. Xin upload request sát giới hạn và vượt 1 byte.
2. PUT trực tiếp R2 trong staging.
3. Confirm và đo tải Express.
```

**Kết quả mong đợi (Excel):**

```text
Giới hạn size theo env; vượt max bị reject; Express chỉ xử lý metadata, không giữ binary video; confirm kiểm tra object thực.
```

<a id="nfr-0012"></a>

### NFR-0012

**Chức năng:** PERF-04 Memory stability

**Module:** Security / Quality / Operations · **Loại:** Non-functional · **Ưu tiên:** P1 · **Actor:** QA/Admin

**Nguồn Excel:** Security NFR, hàng 13 · **Kết quả chạy:** Chưa chạy (Blocked)

**Lý do chưa chạy:**

```text
Blocked: run Node with --expose-gc and set agreed PW_HEAP_BUDGET_MB / PW_RSS_BUDGET_MB
```

**Điều kiện trước khi test:**

```text
Staging độc lập; không load/destructive test vào production
```

**Dữ liệu test:**

```text
Lặp 1000 request + upload metadata
```

**Các bước thực hiện:**

```text
Đo heap/RSS trước/sau workload
```

**Kết quả mong đợi (Excel):**

```text
Không tăng memory liên tục sau GC; ghi số đo và budget được chốt
```

<a id="nfr-0013"></a>

### NFR-0013

**Chức năng:** OPS-01 Fail-fast env

**Module:** Security / Quality / Operations · **Loại:** Non-functional · **Ưu tiên:** P1 · **Actor:** QA/Admin

**Nguồn Excel:** Security NFR, hàng 14 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Staging độc lập; không load/destructive test vào production
```

**Dữ liệu test:**

```text
CHANGE_ME credential khi integration bật
```

**Các bước thực hiện:**

```text
Khởi động từng cấu hình sai
```

**Kết quả mong đợi (Excel):**

```text
Fail rõ tên biến thiếu; không log value secret; không giả ready
```

<a id="nfr-0014"></a>

### NFR-0014

**Chức năng:** OPS-02 Optional AI disabled

**Module:** Security / Quality / Operations · **Loại:** Non-functional · **Ưu tiên:** P1 · **Actor:** QA/Admin

**Nguồn Excel:** Security NFR, hàng 15 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Staging độc lập; không load/destructive test vào production
```

**Dữ liệu test:**

```text
AI=false và key trống
```

**Các bước thực hiện:**

```text
Start app; gọi health/core/AI
```

**Kết quả mong đợi (Excel):**

```text
Core hoạt động; AI503; không crash vì key AI thiếu
```

<a id="nfr-0015"></a>

### NFR-0015

**Chức năng:** OPS-03 Graceful shutdown

**Module:** Security / Quality / Operations · **Loại:** Non-functional · **Ưu tiên:** P1 · **Actor:** QA/Admin

**Nguồn Excel:** Security NFR, hàng 16 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Staging độc lập; không load/destructive test vào production
```

**Dữ liệu test:**

```text
Request đang chạy + scheduler
```

**Các bước thực hiện:**

```text
Gửi SIGTERM
```

**Kết quả mong đợi (Excel):**

```text
Ngừng nhận mới; dừng scheduler; đóng DB trong timeout; log rõ
```

<a id="nfr-0016"></a>

### NFR-0016

**Chức năng:** OPS-04 DB outage

**Module:** Security / Quality / Operations · **Loại:** Non-functional · **Ưu tiên:** P1 · **Actor:** QA/Admin

**Nguồn Excel:** Security NFR, hàng 17 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Staging độc lập; không load/destructive test vào production
```

**Dữ liệu test:**

```text
MongoDB unavailable
```

**Các bước thực hiện:**

```text
Gọi readiness/core; phục hồi DB
```

**Kết quả mong đợi (Excel):**

```text
Readiness không ready; controlled lỗi core; hồi phục hoặc restart đúng runbook
```

<a id="nfr-0017"></a>

### NFR-0017

**Chức năng:** OPS-05 Seed idempotent

**Module:** Security / Quality / Operations · **Loại:** Non-functional · **Ưu tiên:** P1 · **Actor:** QA/Admin

**Nguồn Excel:** Security NFR, hàng 18 · **Kết quả chạy:** Chưa chạy (Blocked)

**Lý do chưa chạy:**

```text
Blocked: RUN_DATABASE_TESTS=true and a dedicated replica-set MONGODB_URI_TEST are required
```

**Điều kiện trước khi test:**

```text
Staging độc lập; không load/destructive test vào production
```

**Dữ liệu test:**

```text
Chạy seed hai lần
```

**Các bước thực hiện:**

```text
So sánh count/IDs trước-sau
```

**Kết quả mong đợi (Excel):**

```text
Không duplicate master data/admin; không xóa data user
```

<a id="nfr-0018"></a>

### NFR-0018

**Chức năng:** OPS-06 Backup restore

**Module:** Security / Quality / Operations · **Loại:** Non-functional · **Ưu tiên:** P1 · **Actor:** QA/Admin

**Nguồn Excel:** Security NFR, hàng 19 · **Kết quả chạy:** Chưa chạy (Blocked)

**Lý do chưa chạy:**

```text
Blocked: paths to mongodump and mongorestore are required
```

**Điều kiện trước khi test:**

```text
Staging độc lập; không load/destructive test vào production
```

**Dữ liệu test:**

```text
Backup staging chứa user/recipe/diary
```

**Các bước thực hiện:**

```text
Restore vào DB test; đọc số bản ghi/index
```

**Kết quả mong đợi (Excel):**

```text
Dữ liệu/index phục hồi; không thực hiện trên production
```

<a id="nfr-0019"></a>

### NFR-0019

**Chức năng:** CONTRACT-01 184 routes đủ

**Module:** Security / Quality / Operations · **Loại:** Non-functional · **Ưu tiên:** P1 · **Actor:** QA/Admin

**Nguồn Excel:** Security NFR, hàng 20 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Staging độc lập; không load/destructive test vào production
```

**Dữ liệu test:**

```text
API manifest/OpenAPI/app route list
```

**Các bước thực hiện:**

```text
So sánh method + normalized path
```

**Kết quả mong đợi (Excel):**

```text
Đủ 184 source operations trong manifest, Express routes và OpenAPI; không route rỗng/OpenAPI ảo; operationId duy nhất; auth level đúng.
```

<a id="nfr-0020"></a>

### NFR-0020

**Chức năng:** CONTRACT-02 Response standard

**Module:** Security / Quality / Operations · **Loại:** Non-functional · **Ưu tiên:** P1 · **Actor:** QA/Admin

**Nguồn Excel:** Security NFR, hàng 21 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Staging độc lập; không load/destructive test vào production
```

**Dữ liệu test:**

```text
Success/error/list của mỗi module
```

**Các bước thực hiện:**

```text
Đọc sample response
```

**Kết quả mong đợi (Excel):**

```text
success,data/meta hoặc error/meta đúng contract; requestId hiện diện
```

<a id="nfr-0021"></a>

### NFR-0021

**Chức năng:** CONTRACT-03 Sorting/pagination validation

**Module:** Security / Quality / Operations · **Loại:** Non-functional · **Ưu tiên:** P1 · **Actor:** QA/Admin

**Nguồn Excel:** Security NFR, hàng 22 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Staging độc lập; không load/destructive test vào production
```

**Dữ liệu test:**

```text
page0; limit101; sort=$where; from>to
```

**Các bước thực hiện:**

```text
Gọi list/range tương ứng
```

**Kết quả mong đợi (Excel):**

```text
400 hoặc cap policy công bố; sort whitelist; không unsafe query
```

<a id="nfr-0022"></a>

### NFR-0022

**Chức năng:** DATA-01 Unique indexes

**Module:** Security / Quality / Operations · **Loại:** Non-functional · **Ưu tiên:** P1 · **Actor:** QA/Admin

**Nguồn Excel:** Security NFR, hàng 23 · **Kết quả chạy:** Chưa chạy (Blocked)

**Lý do chưa chạy:**

```text
Blocked: RUN_DATABASE_TESTS=true and a dedicated replica-set MONGODB_URI_TEST are required
```

**Điều kiện trước khi test:**

```text
Staging độc lập; không load/destructive test vào production
```

**Dữ liệu test:**

```text
Duplicate firebaseUid/user-profile/reaction/rating/save
```

**Các bước thực hiện:**

```text
Insert via concurrency API tests
```

**Kết quả mong đợi (Excel):**

```text
Unique invariant được DB bảo vệ; controlled conflict, không raw E11000
```

<a id="nfr-0023"></a>

### NFR-0023

**Chức năng:** DATA-02 UTC serialization

**Module:** Security / Quality / Operations · **Loại:** Non-functional · **Ưu tiên:** P1 · **Actor:** QA/Admin

**Nguồn Excel:** Security NFR, hàng 24 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Staging độc lập; không load/destructive test vào production
```

**Dữ liệu test:**

```text
Date/time fixture UTC/local
```

**Các bước thực hiện:**

```text
Ghi và đọc tất cả tracking/reminder
```

**Kết quả mong đợi (Excel):**

```text
DB UTC; JSON ISO8601; timezone calculation đúng
```

<a id="nfr-0024"></a>

### NFR-0024

**Chức năng:** DATA-03 Rollback transaction

**Module:** Security / Quality / Operations · **Loại:** Non-functional · **Ưu tiên:** P1 · **Actor:** QA/Admin

**Nguồn Excel:** Security NFR, hàng 25 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Staging độc lập; không load/destructive test vào production
```

**Dữ liệu test:**

```text
Fail sau cập nhật target trước audit/counter
```

**Các bước thực hiện:**

```text
Inject lỗi staging giữa transaction
```

**Kết quả mong đợi (Excel):**

```text
Rollback hoặc recovery rõ; không state nửa chừng
```
