# API — endpoint và các nhánh xử lý

[Quay lại danh mục FE](../BACKEND_TEST_CASES.md) · [Mã Playwright](../../tests/playwright/api-cases.spec.js)

Tổng cộng **764 case**. Dữ liệu yêu cầu dưới đây giữ nguyên từ sheet `API Cases`; kết quả chạy: **11:38:54 5/10/26 (Asia/Ho_Chi_Minh)**. Xem phạm vi mô phỏng và khác biệt contract trong danh mục FE trước khi dùng trạng thái để đánh giá tích hợp.

## Mục lục

- [Auth (14 case)](#module-1)
- [App bootstrap, home và onboarding (13 case)](#module-2)
- [Health (2 case)](#module-3)
- [User và profile (38 case)](#module-4)
- [Category, allergen và food item (56 case)](#module-5)
- [Recipe và discovery (66 case)](#module-6)
- [Pantry (28 case)](#module-7)
- [Meal plan (59 case)](#module-8)
- [Grocery list (42 case)](#module-9)
- [Diary, weight và water (65 case)](#module-10)
- [Media và Cloudflare R2 (21 case)](#module-11)
- [Post, comment, reaction và saved item (73 case)](#module-12)
- [AI (47 case)](#module-13)
- [Notification và reminder (46 case)](#module-14)
- [Report, moderation, admin và audit (68 case)](#module-15)
- [Video hướng dẫn (53 case)](#module-16)
- [Rating, vote và lịch sử xem (22 case)](#module-17)
- [Dashboard quản trị và giám sát AI (51 case)](#module-18)

<a id="module-1"></a>

## Auth

| ID                    | Chức năng / endpoint                    | Loại test         | Ưu tiên | Actor  | Kết quả chạy |
| --------------------- | --------------------------------------- | ----------------- | ------- | ------ | ------------ |
| [API-0001](#api-0001) | POST /api/v1/auth/sync                  | Happy path        | P1      | User A | Đạt          |
| [API-0002](#api-0002) | POST /api/v1/auth/sync                  | Missing auth      | P0      | Guest  | Đạt          |
| [API-0003](#api-0003) | POST /api/v1/auth/sync                  | Invalid auth      | P0      | User A | Đạt          |
| [API-0004](#api-0004) | GET /api/v1/auth/me                     | Happy path        | P1      | User A | Đạt          |
| [API-0005](#api-0005) | GET /api/v1/auth/me                     | Missing auth      | P0      | Guest  | Đạt          |
| [API-0006](#api-0006) | GET /api/v1/auth/me                     | Invalid auth      | P0      | User A | Đạt          |
| [API-0007](#api-0007) | POST /api/v1/auth/fcm-tokens            | Happy path        | P1      | User A | Đạt          |
| [API-0008](#api-0008) | POST /api/v1/auth/fcm-tokens            | Missing auth      | P0      | Guest  | Đạt          |
| [API-0009](#api-0009) | POST /api/v1/auth/fcm-tokens            | Invalid auth      | P0      | User A | Đạt          |
| [API-0010](#api-0010) | POST /api/v1/auth/fcm-tokens            | Invalid payload   | P1      | User A | Đạt          |
| [API-0011](#api-0011) | DELETE /api/v1/auth/fcm-tokens/:tokenId | Happy path        | P1      | User A | Đạt          |
| [API-0012](#api-0012) | DELETE /api/v1/auth/fcm-tokens/:tokenId | Missing auth      | P0      | Guest  | Đạt          |
| [API-0013](#api-0013) | DELETE /api/v1/auth/fcm-tokens/:tokenId | Invalid auth      | P0      | User A | Đạt          |
| [API-0014](#api-0014) | DELETE /api/v1/auth/fcm-tokens/:tokenId | Cross-user access | P0      | User B | Không đạt    |

<a id="api-0001"></a>

### API-0001

**Chức năng:** POST /api/v1/auth/sync

**Module:** Auth · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 2 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Auth; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Tạo hoặc đồng bộ user nội bộ từ token đã xác minh.
```

**Dữ liệu test:**

```text
Fixture đúng schema OpenAPI; ID User A/target A; page=1,limit=20 cho list; reason=kiểm tra khi moderation
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi POST /api/v1/auth/sync với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Tạo hoặc đồng bộ user nội bộ từ token đã xác minh; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0002"></a>

### API-0002

**Chức năng:** POST /api/v1/auth/sync

**Module:** Auth · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 3 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Auth; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Tạo hoặc đồng bộ user nội bộ từ token đã xác minh.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi POST /api/v1/auth/sync không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0003"></a>

### API-0003

**Chức năng:** POST /api/v1/auth/sync

**Module:** Auth · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 4 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Auth; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Tạo hoặc đồng bộ user nội bộ từ token đã xác minh.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/auth/sync với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0004"></a>

### API-0004

**Chức năng:** GET /api/v1/auth/me

**Module:** Auth · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 5 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Auth; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Trả identity, role, status và profile cơ bản.
```

**Dữ liệu test:**

```text
Fixture đúng schema OpenAPI; ID User A/target A; page=1,limit=20 cho list; reason=kiểm tra khi moderation
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/auth/me với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: Trả identity, role, status và profile cơ bản; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0005"></a>

### API-0005

**Chức năng:** GET /api/v1/auth/me

**Module:** Auth · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 6 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Auth; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Trả identity, role, status và profile cơ bản.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi GET /api/v1/auth/me không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0006"></a>

### API-0006

**Chức năng:** GET /api/v1/auth/me

**Module:** Auth · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 7 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Auth; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Trả identity, role, status và profile cơ bản.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/auth/me với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0007"></a>

### API-0007

**Chức năng:** POST /api/v1/auth/fcm-tokens

**Module:** Auth · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 8 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Auth; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Đăng ký/cập nhật FCM device token.
```

**Dữ liệu test:**

```text
{token: FCM_TEST_A, platform: android, deviceName: Pixel test}
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi POST /api/v1/auth/fcm-tokens với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Đăng ký/cập nhật FCM device token; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0008"></a>

### API-0008

**Chức năng:** POST /api/v1/auth/fcm-tokens

**Module:** Auth · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 9 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Auth; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Đăng ký/cập nhật FCM device token.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi POST /api/v1/auth/fcm-tokens không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0009"></a>

### API-0009

**Chức năng:** POST /api/v1/auth/fcm-tokens

**Module:** Auth · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 10 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Auth; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Đăng ký/cập nhật FCM device token.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/auth/fcm-tokens với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0010"></a>

### API-0010

**Chức năng:** POST /api/v1/auth/fcm-tokens

**Module:** Auth · **Loại:** Invalid payload · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 11 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Auth; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Đăng ký/cập nhật FCM device token.
```

**Dữ liệu test:**

```text
Body chứa field bắt buộc rỗng/sai type; PATCH={} hoặc score=6/quantity=-1 khi áp dụng
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/auth/fcm-tokens với body sai schema.
2. Đối chiếu field error.
3. Xác minh DB giữ nguyên.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 400 VALIDATION_ERROR; details chỉ rõ field; không lưu dữ liệu sai.
```

<a id="api-0011"></a>

### API-0011

**Chức năng:** DELETE /api/v1/auth/fcm-tokens/:tokenId

**Module:** Auth · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 12 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Auth; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Gỡ device token khỏi tài khoản.
```

**Dữ liệu test:**

```text
{token: FCM_TEST_A, platform: android, deviceName: Pixel test}
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi DELETE /api/v1/auth/fcm-tokens/:tokenId với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Gỡ device token khỏi tài khoản; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0012"></a>

### API-0012

**Chức năng:** DELETE /api/v1/auth/fcm-tokens/:tokenId

**Module:** Auth · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 13 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Auth; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Gỡ device token khỏi tài khoản.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi DELETE /api/v1/auth/fcm-tokens/:tokenId không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0013"></a>

### API-0013

**Chức năng:** DELETE /api/v1/auth/fcm-tokens/:tokenId

**Module:** Auth · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 14 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Auth; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Gỡ device token khỏi tài khoản.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi DELETE /api/v1/auth/fcm-tokens/:tokenId với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0014"></a>

### API-0014

**Chức năng:** DELETE /api/v1/auth/fcm-tokens/:tokenId

**Module:** Auth · **Loại:** Cross-user access · **Ưu tiên:** P0 · **Actor:** User B

**Nguồn Excel:** API Cases, hàng 15 · **Kết quả chạy:** Không đạt

**Điều kiện trước khi test:**

```text
Target thuộc User A; User B có token hợp lệ
```

**Dữ liệu test:**

```text
{token: FCM_TEST_A (không thuộc B), platform: android, deviceName: Pixel test}
```

**Các bước thực hiện:**

```text
1. Gửi DELETE /api/v1/auth/fcm-tokens/:tokenId với ID của User A và token B.
2. Kiểm tra response/DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403 hoặc 404 theo chính sách chống dò ID; không lộ dữ liệu A; không mutation.
```

<a id="module-2"></a>

## App bootstrap, home và onboarding

| ID                    | Chức năng / endpoint             | Loại test       | Ưu tiên | Actor  | Kết quả chạy |
| --------------------- | -------------------------------- | --------------- | ------- | ------ | ------------ |
| [API-0015](#api-0015) | GET /api/v1/app/config           | Happy path      | P1      | Guest  | Đạt          |
| [API-0016](#api-0016) | GET /api/v1/app/bootstrap        | Happy path      | P1      | Guest  | Đạt          |
| [API-0017](#api-0017) | GET /api/v1/home                 | Happy path      | P1      | Guest  | Đạt          |
| [API-0018](#api-0018) | GET /api/v1/onboarding/status    | Happy path      | P1      | User A | Đạt          |
| [API-0019](#api-0019) | GET /api/v1/onboarding/status    | Missing auth    | P0      | Guest  | Đạt          |
| [API-0020](#api-0020) | GET /api/v1/onboarding/status    | Invalid auth    | P0      | User A | Đạt          |
| [API-0021](#api-0021) | PUT /api/v1/onboarding           | Happy path      | P1      | User A | Đạt          |
| [API-0022](#api-0022) | PUT /api/v1/onboarding           | Missing auth    | P0      | Guest  | Đạt          |
| [API-0023](#api-0023) | PUT /api/v1/onboarding           | Invalid auth    | P0      | User A | Đạt          |
| [API-0024](#api-0024) | PUT /api/v1/onboarding           | Invalid payload | P1      | User A | Đạt          |
| [API-0025](#api-0025) | POST /api/v1/onboarding/complete | Happy path      | P1      | User A | Đạt          |
| [API-0026](#api-0026) | POST /api/v1/onboarding/complete | Missing auth    | P0      | Guest  | Đạt          |
| [API-0027](#api-0027) | POST /api/v1/onboarding/complete | Invalid auth    | P0      | User A | Đạt          |

<a id="api-0015"></a>

### API-0015

**Chức năng:** GET /api/v1/app/config

**Module:** App bootstrap, home và onboarding · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 16 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho App bootstrap, home và onboarding; không gửi token; target đúng trạng thái cho Trả cấu hình public: app version policy, enums/limits cần cho client, feature flags; tuyệt đối không trả secret.
```

**Dữ liệu test:**

```text
Fixture đúng schema OpenAPI; ID User A/target A; page=1,limit=20 cho list; reason=kiểm tra khi moderation
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/app/config với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: Trả cấu hình public: app version policy, enums/limits cần cho client, feature flags; tuyệt đối không trả secret; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0016"></a>

### API-0016

**Chức năng:** GET /api/v1/app/bootstrap

**Module:** App bootstrap, home và onboarding · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 17 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho App bootstrap, home và onboarding; không gửi token; target đúng trạng thái cho Payload khởi động gọn: public config, auth summary, onboarding status, unread count và master-data version.
```

**Dữ liệu test:**

```text
Fixture đúng schema OpenAPI; ID User A/target A; page=1,limit=20 cho list; reason=kiểm tra khi moderation
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/app/bootstrap với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: Payload khởi động gọn: public config, auth summary, onboarding status, unread count và master-data version; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0017"></a>

### API-0017

**Chức năng:** GET /api/v1/home

**Module:** App bootstrap, home và onboarding · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 18 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho App bootstrap, home và onboarding; không gửi token; target đúng trạng thái cho Home feed tổng hợp: featured recipes/videos/blogs và khối personalized nếu đăng nhập.
```

**Dữ liệu test:**

```text
Fixture đúng schema OpenAPI; ID User A/target A; page=1,limit=20 cho list; reason=kiểm tra khi moderation
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/home với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: Home feed tổng hợp: featured recipes/videos/blogs và khối personalized nếu đăng nhập; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0018"></a>

### API-0018

**Chức năng:** GET /api/v1/onboarding/status

**Module:** App bootstrap, home và onboarding · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 19 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho App bootstrap, home và onboarding; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Trạng thái và bước còn thiếu.
```

**Dữ liệu test:**

```text
Fixture đúng schema OpenAPI; ID User A/target A; page=1,limit=20 cho list; reason=kiểm tra khi moderation
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/onboarding/status với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: Trạng thái và bước còn thiếu; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0019"></a>

### API-0019

**Chức năng:** GET /api/v1/onboarding/status

**Module:** App bootstrap, home và onboarding · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 20 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho App bootstrap, home và onboarding; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Trạng thái và bước còn thiếu.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi GET /api/v1/onboarding/status không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0020"></a>

### API-0020

**Chức năng:** GET /api/v1/onboarding/status

**Module:** App bootstrap, home và onboarding · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 21 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho App bootstrap, home và onboarding; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Trạng thái và bước còn thiếu.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/onboarding/status với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0021"></a>

### API-0021

**Chức năng:** PUT /api/v1/onboarding

**Module:** App bootstrap, home và onboarding · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 22 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho App bootstrap, home và onboarding; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Lưu lựa chọn diet, allergens, mục tiêu, activity và hoàn tất onboarding theo từng bước.
```

**Dữ liệu test:**

```text
{heightCm:165,currentWeightKg:60,activityLevel:moderate,goal:maintain,allergenIds:[ALLERGEN_PEANUT]}
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi PUT /api/v1/onboarding với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Lưu lựa chọn diet, allergens, mục tiêu, activity và hoàn tất onboarding theo từng bước; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0022"></a>

### API-0022

**Chức năng:** PUT /api/v1/onboarding

**Module:** App bootstrap, home và onboarding · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 23 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho App bootstrap, home và onboarding; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Lưu lựa chọn diet, allergens, mục tiêu, activity và hoàn tất onboarding theo từng bước.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi PUT /api/v1/onboarding không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0023"></a>

### API-0023

**Chức năng:** PUT /api/v1/onboarding

**Module:** App bootstrap, home và onboarding · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 24 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho App bootstrap, home và onboarding; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Lưu lựa chọn diet, allergens, mục tiêu, activity và hoàn tất onboarding theo từng bước.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi PUT /api/v1/onboarding với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0024"></a>

### API-0024

**Chức năng:** PUT /api/v1/onboarding

**Module:** App bootstrap, home và onboarding · **Loại:** Invalid payload · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 25 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho App bootstrap, home và onboarding; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Lưu lựa chọn diet, allergens, mục tiêu, activity và hoàn tất onboarding theo từng bước.
```

**Dữ liệu test:**

```text
Body chứa field bắt buộc rỗng/sai type; PATCH={} hoặc score=6/quantity=-1 khi áp dụng
```

**Các bước thực hiện:**

```text
1. Gửi PUT /api/v1/onboarding với body sai schema.
2. Đối chiếu field error.
3. Xác minh DB giữ nguyên.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 400 VALIDATION_ERROR; details chỉ rõ field; không lưu dữ liệu sai.
```

<a id="api-0025"></a>

### API-0025

**Chức năng:** POST /api/v1/onboarding/complete

**Module:** App bootstrap, home và onboarding · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 26 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho App bootstrap, home và onboarding; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Xác nhận hoàn tất sau khi server kiểm tra field bắt buộc.
```

**Dữ liệu test:**

```text
Fixture đúng schema OpenAPI; ID User A/target A; page=1,limit=20 cho list; reason=kiểm tra khi moderation
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi POST /api/v1/onboarding/complete với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Xác nhận hoàn tất sau khi server kiểm tra field bắt buộc; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0026"></a>

### API-0026

**Chức năng:** POST /api/v1/onboarding/complete

**Module:** App bootstrap, home và onboarding · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 27 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho App bootstrap, home và onboarding; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Xác nhận hoàn tất sau khi server kiểm tra field bắt buộc.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi POST /api/v1/onboarding/complete không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0027"></a>

### API-0027

**Chức năng:** POST /api/v1/onboarding/complete

**Module:** App bootstrap, home và onboarding · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 28 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho App bootstrap, home và onboarding; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Xác nhận hoàn tất sau khi server kiểm tra field bắt buộc.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/onboarding/complete với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="module-3"></a>

## Health

| ID                    | Chức năng / endpoint     | Loại test  | Ưu tiên | Actor | Kết quả chạy |
| --------------------- | ------------------------ | ---------- | ------- | ----- | ------------ |
| [API-0028](#api-0028) | GET /api/v1/health       | Happy path | P1      | Guest | Đạt          |
| [API-0029](#api-0029) | GET /api/v1/health/ready | Happy path | P1      | Guest | Đạt          |

<a id="api-0028"></a>

### API-0028

**Chức năng:** GET /api/v1/health

**Module:** Health · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 29 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Health; không gửi token; target đúng trạng thái cho Liveness: app/version/timestamp.
```

**Dữ liệu test:**

```text
Fixture đúng schema OpenAPI; ID User A/target A; page=1,limit=20 cho list; reason=kiểm tra khi moderation
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/health với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: Liveness: app/version/timestamp; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0029"></a>

### API-0029

**Chức năng:** GET /api/v1/health/ready

**Module:** Health · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 30 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Health; không gửi token; target đúng trạng thái cho Readiness: database và provider bắt buộc.
```

**Dữ liệu test:**

```text
Fixture đúng schema OpenAPI; ID User A/target A; page=1,limit=20 cho list; reason=kiểm tra khi moderation
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/health/ready với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: Readiness: database và provider bắt buộc; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="module-4"></a>

## User và profile

| ID                    | Chức năng / endpoint                           | Loại test       | Ưu tiên | Actor  | Kết quả chạy |
| --------------------- | ---------------------------------------------- | --------------- | ------- | ------ | ------------ |
| [API-0030](#api-0030) | GET /api/v1/users/me                           | Happy path      | P1      | User A | Đạt          |
| [API-0031](#api-0031) | GET /api/v1/users/me                           | Missing auth    | P0      | Guest  | Đạt          |
| [API-0032](#api-0032) | GET /api/v1/users/me                           | Invalid auth    | P0      | User A | Đạt          |
| [API-0033](#api-0033) | GET /api/v1/users/me                           | Empty result    | P2      | User A | Đạt          |
| [API-0034](#api-0034) | PATCH /api/v1/users/me                         | Happy path      | P1      | User A | Đạt          |
| [API-0035](#api-0035) | PATCH /api/v1/users/me                         | Missing auth    | P0      | Guest  | Đạt          |
| [API-0036](#api-0036) | PATCH /api/v1/users/me                         | Invalid auth    | P0      | User A | Đạt          |
| [API-0037](#api-0037) | PATCH /api/v1/users/me                         | Invalid payload | P1      | User A | Đạt          |
| [API-0038](#api-0038) | DELETE /api/v1/users/me                        | Happy path      | P1      | User A | Đạt          |
| [API-0039](#api-0039) | DELETE /api/v1/users/me                        | Missing auth    | P0      | Guest  | Đạt          |
| [API-0040](#api-0040) | DELETE /api/v1/users/me                        | Invalid auth    | P0      | User A | Đạt          |
| [API-0041](#api-0041) | GET /api/v1/users/:userId/public               | Happy path      | P1      | Guest  | Đạt          |
| [API-0042](#api-0042) | GET /api/v1/users/:userId/public               | Missing target  | P1      | Guest  | Đạt          |
| [API-0043](#api-0043) | GET /api/v1/users/me/content                   | Happy path      | P1      | User A | Đạt          |
| [API-0044](#api-0044) | GET /api/v1/users/me/content                   | Missing auth    | P0      | Guest  | Đạt          |
| [API-0045](#api-0045) | GET /api/v1/users/me/content                   | Invalid auth    | P0      | User A | Đạt          |
| [API-0046](#api-0046) | GET /api/v1/users/me/content                   | Empty result    | P2      | User A | Đạt          |
| [API-0047](#api-0047) | GET /api/v1/users/me/activity                  | Happy path      | P1      | User A | Đạt          |
| [API-0048](#api-0048) | GET /api/v1/users/me/activity                  | Missing auth    | P0      | Guest  | Đạt          |
| [API-0049](#api-0049) | GET /api/v1/users/me/activity                  | Invalid auth    | P0      | User A | Đạt          |
| [API-0050](#api-0050) | GET /api/v1/users/me/activity                  | Empty result    | P2      | User A | Đạt          |
| [API-0051](#api-0051) | GET /api/v1/profiles/me                        | Happy path      | P1      | User A | Đạt          |
| [API-0052](#api-0052) | GET /api/v1/profiles/me                        | Missing auth    | P0      | Guest  | Đạt          |
| [API-0053](#api-0053) | GET /api/v1/profiles/me                        | Invalid auth    | P0      | User A | Đạt          |
| [API-0054](#api-0054) | PUT /api/v1/profiles/me                        | Happy path      | P1      | User A | Đạt          |
| [API-0055](#api-0055) | PUT /api/v1/profiles/me                        | Missing auth    | P0      | Guest  | Đạt          |
| [API-0056](#api-0056) | PUT /api/v1/profiles/me                        | Invalid auth    | P0      | User A | Đạt          |
| [API-0057](#api-0057) | PUT /api/v1/profiles/me                        | Invalid payload | P1      | User A | Đạt          |
| [API-0058](#api-0058) | GET /api/v1/nutrition-profiles/me              | Happy path      | P1      | User A | Đạt          |
| [API-0059](#api-0059) | GET /api/v1/nutrition-profiles/me              | Missing auth    | P0      | Guest  | Đạt          |
| [API-0060](#api-0060) | GET /api/v1/nutrition-profiles/me              | Invalid auth    | P0      | User A | Đạt          |
| [API-0061](#api-0061) | PUT /api/v1/nutrition-profiles/me              | Happy path      | P1      | User A | Đạt          |
| [API-0062](#api-0062) | PUT /api/v1/nutrition-profiles/me              | Missing auth    | P0      | Guest  | Đạt          |
| [API-0063](#api-0063) | PUT /api/v1/nutrition-profiles/me              | Invalid auth    | P0      | User A | Đạt          |
| [API-0064](#api-0064) | PUT /api/v1/nutrition-profiles/me              | Invalid payload | P1      | User A | Đạt          |
| [API-0065](#api-0065) | POST /api/v1/nutrition-profiles/me/recalculate | Happy path      | P1      | User A | Đạt          |
| [API-0066](#api-0066) | POST /api/v1/nutrition-profiles/me/recalculate | Missing auth    | P0      | Guest  | Đạt          |
| [API-0067](#api-0067) | POST /api/v1/nutrition-profiles/me/recalculate | Invalid auth    | P0      | User A | Đạt          |

<a id="api-0030"></a>

### API-0030

**Chức năng:** GET /api/v1/users/me

**Module:** User và profile · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 31 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho User và profile; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Xem tài khoản và profile tổng hợp.
```

**Dữ liệu test:**

```text
Fixture đúng schema OpenAPI; ID User A/target A; page=1,limit=20 cho list; reason=kiểm tra khi moderation
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/users/me với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: Xem tài khoản và profile tổng hợp; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0031"></a>

### API-0031

**Chức năng:** GET /api/v1/users/me

**Module:** User và profile · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 32 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho User và profile; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Xem tài khoản và profile tổng hợp.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi GET /api/v1/users/me không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0032"></a>

### API-0032

**Chức năng:** GET /api/v1/users/me

**Module:** User và profile · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 33 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho User và profile; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Xem tài khoản và profile tổng hợp.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/users/me với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0033"></a>

### API-0033

**Chức năng:** GET /api/v1/users/me

**Module:** User và profile · **Loại:** Empty result · **Ưu tiên:** P2 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 34 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Không có dữ liệu khớp filter hoặc user mới
```

**Dữ liệu test:**

```text
Filter hợp lệ không có kết quả
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/users/me với filter rỗng kết quả.
2. Kiểm tra payload.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; list rỗng/tổng bằng 0 đúng schema; không lỗi 500 hoặc dữ liệu user khác.
```

<a id="api-0034"></a>

### API-0034

**Chức năng:** PATCH /api/v1/users/me

**Module:** User và profile · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 35 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho User và profile; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Cập nhật display name/avatar.
```

**Dữ liệu test:**

```text
Fixture đúng schema OpenAPI; ID User A/target A; page=1,limit=20 cho list; reason=kiểm tra khi moderation
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi PATCH /api/v1/users/me với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Cập nhật display name/avatar; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0035"></a>

### API-0035

**Chức năng:** PATCH /api/v1/users/me

**Module:** User và profile · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 36 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho User và profile; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Cập nhật display name/avatar.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi PATCH /api/v1/users/me không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0036"></a>

### API-0036

**Chức năng:** PATCH /api/v1/users/me

**Module:** User và profile · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 37 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho User và profile; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Cập nhật display name/avatar.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/users/me với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0037"></a>

### API-0037

**Chức năng:** PATCH /api/v1/users/me

**Module:** User và profile · **Loại:** Invalid payload · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 38 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho User và profile; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Cập nhật display name/avatar.
```

**Dữ liệu test:**

```text
Body chứa field bắt buộc rỗng/sai type; PATCH={} hoặc score=6/quantity=-1 khi áp dụng
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/users/me với body sai schema.
2. Đối chiếu field error.
3. Xác minh DB giữ nguyên.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 400 VALIDATION_ERROR; details chỉ rõ field; không lưu dữ liệu sai.
```

<a id="api-0038"></a>

### API-0038

**Chức năng:** DELETE /api/v1/users/me

**Module:** User và profile · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 39 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho User và profile; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Soft-delete tài khoản nội bộ, thu hồi quyền dùng app.
```

**Dữ liệu test:**

```text
Fixture đúng schema OpenAPI; ID User A/target A; page=1,limit=20 cho list; reason=kiểm tra khi moderation
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi DELETE /api/v1/users/me với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Soft-delete tài khoản nội bộ, thu hồi quyền dùng app; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0039"></a>

### API-0039

**Chức năng:** DELETE /api/v1/users/me

**Module:** User và profile · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 40 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho User và profile; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Soft-delete tài khoản nội bộ, thu hồi quyền dùng app.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi DELETE /api/v1/users/me không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0040"></a>

### API-0040

**Chức năng:** DELETE /api/v1/users/me

**Module:** User và profile · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 41 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho User và profile; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Soft-delete tài khoản nội bộ, thu hồi quyền dùng app.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi DELETE /api/v1/users/me với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0041"></a>

### API-0041

**Chức năng:** GET /api/v1/users/:userId/public

**Module:** User và profile · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 42 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho User và profile; không gửi token; target đúng trạng thái cho Hồ sơ công khai đã giới hạn field.
```

**Dữ liệu test:**

```text
Fixture đúng schema OpenAPI; ID User A/target A; page=1,limit=20 cho list; reason=kiểm tra khi moderation
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/users/:userId/public với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: Hồ sơ công khai đã giới hạn field; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0042"></a>

### API-0042

**Chức năng:** GET /api/v1/users/:userId/public

**Module:** User và profile · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 43 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/users/:userId/public với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0043"></a>

### API-0043

**Chức năng:** GET /api/v1/users/me/content

**Module:** User và profile · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 44 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho User và profile; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Nội dung do mình tạo, filter type/status.
```

**Dữ liệu test:**

```text
Fixture đúng schema OpenAPI; ID User A/target A; page=1,limit=20 cho list; reason=kiểm tra khi moderation
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/users/me/content với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: Nội dung do mình tạo, filter type/status; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0044"></a>

### API-0044

**Chức năng:** GET /api/v1/users/me/content

**Module:** User và profile · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 45 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho User và profile; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Nội dung do mình tạo, filter type/status.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi GET /api/v1/users/me/content không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0045"></a>

### API-0045

**Chức năng:** GET /api/v1/users/me/content

**Module:** User và profile · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 46 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho User và profile; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Nội dung do mình tạo, filter type/status.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/users/me/content với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0046"></a>

### API-0046

**Chức năng:** GET /api/v1/users/me/content

**Module:** User và profile · **Loại:** Empty result · **Ưu tiên:** P2 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 47 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Không có dữ liệu khớp filter hoặc user mới
```

**Dữ liệu test:**

```text
Filter hợp lệ không có kết quả
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/users/me/content với filter rỗng kết quả.
2. Kiểm tra payload.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; list rỗng/tổng bằng 0 đúng schema; không lỗi 500 hoặc dữ liệu user khác.
```

<a id="api-0047"></a>

### API-0047

**Chức năng:** GET /api/v1/users/me/activity

**Module:** User và profile · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 48 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho User và profile; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Tóm tắt hoạt động của chính mình.
```

**Dữ liệu test:**

```text
Fixture đúng schema OpenAPI; ID User A/target A; page=1,limit=20 cho list; reason=kiểm tra khi moderation
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/users/me/activity với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: Tóm tắt hoạt động của chính mình; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0048"></a>

### API-0048

**Chức năng:** GET /api/v1/users/me/activity

**Module:** User và profile · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 49 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho User và profile; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Tóm tắt hoạt động của chính mình.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi GET /api/v1/users/me/activity không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0049"></a>

### API-0049

**Chức năng:** GET /api/v1/users/me/activity

**Module:** User và profile · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 50 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho User và profile; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Tóm tắt hoạt động của chính mình.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/users/me/activity với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0050"></a>

### API-0050

**Chức năng:** GET /api/v1/users/me/activity

**Module:** User và profile · **Loại:** Empty result · **Ưu tiên:** P2 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 51 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Không có dữ liệu khớp filter hoặc user mới
```

**Dữ liệu test:**

```text
Filter hợp lệ không có kết quả
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/users/me/activity với filter rỗng kết quả.
2. Kiểm tra payload.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; list rỗng/tổng bằng 0 đúng schema; không lỗi 500 hoặc dữ liệu user khác.
```

<a id="api-0051"></a>

### API-0051

**Chức năng:** GET /api/v1/profiles/me

**Module:** User và profile · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 52 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho User và profile; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Xem user profile.
```

**Dữ liệu test:**

```text
dietType=vegan; timezone=Asia/Ho_Chi_Minh; locale=vi
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/profiles/me với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: Xem user profile; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0052"></a>

### API-0052

**Chức năng:** GET /api/v1/profiles/me

**Module:** User và profile · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 53 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho User và profile; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Xem user profile.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi GET /api/v1/profiles/me không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0053"></a>

### API-0053

**Chức năng:** GET /api/v1/profiles/me

**Module:** User và profile · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 54 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho User và profile; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Xem user profile.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/profiles/me với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0054"></a>

### API-0054

**Chức năng:** PUT /api/v1/profiles/me

**Module:** User và profile · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 55 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho User và profile; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Upsert user profile.
```

**Dữ liệu test:**

```text
dietType=vegan; timezone=Asia/Ho_Chi_Minh; locale=vi
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi PUT /api/v1/profiles/me với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Upsert user profile; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0055"></a>

### API-0055

**Chức năng:** PUT /api/v1/profiles/me

**Module:** User và profile · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 56 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho User và profile; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Upsert user profile.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi PUT /api/v1/profiles/me không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0056"></a>

### API-0056

**Chức năng:** PUT /api/v1/profiles/me

**Module:** User và profile · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 57 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho User và profile; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Upsert user profile.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi PUT /api/v1/profiles/me với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0057"></a>

### API-0057

**Chức năng:** PUT /api/v1/profiles/me

**Module:** User và profile · **Loại:** Invalid payload · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 58 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho User và profile; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Upsert user profile.
```

**Dữ liệu test:**

```text
Body chứa field bắt buộc rỗng/sai type; PATCH={} hoặc score=6/quantity=-1 khi áp dụng
```

**Các bước thực hiện:**

```text
1. Gửi PUT /api/v1/profiles/me với body sai schema.
2. Đối chiếu field error.
3. Xác minh DB giữ nguyên.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 400 VALIDATION_ERROR; details chỉ rõ field; không lưu dữ liệu sai.
```

<a id="api-0058"></a>

### API-0058

**Chức năng:** GET /api/v1/nutrition-profiles/me

**Module:** User và profile · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 59 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho User và profile; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Xem hồ sơ dinh dưỡng.
```

**Dữ liệu test:**

```text
{heightCm:165,currentWeightKg:60,activityLevel:moderate,goal:maintain,allergenIds:[ALLERGEN_PEANUT]}
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/nutrition-profiles/me với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: Xem hồ sơ dinh dưỡng; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0059"></a>

### API-0059

**Chức năng:** GET /api/v1/nutrition-profiles/me

**Module:** User và profile · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 60 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho User và profile; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Xem hồ sơ dinh dưỡng.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi GET /api/v1/nutrition-profiles/me không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0060"></a>

### API-0060

**Chức năng:** GET /api/v1/nutrition-profiles/me

**Module:** User và profile · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 61 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho User và profile; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Xem hồ sơ dinh dưỡng.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/nutrition-profiles/me với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0061"></a>

### API-0061

**Chức năng:** PUT /api/v1/nutrition-profiles/me

**Module:** User và profile · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 62 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho User và profile; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Upsert và tính chỉ số tham khảo.
```

**Dữ liệu test:**

```text
{heightCm:165,currentWeightKg:60,activityLevel:moderate,goal:maintain,allergenIds:[ALLERGEN_PEANUT]}
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi PUT /api/v1/nutrition-profiles/me với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Upsert và tính chỉ số tham khảo; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0062"></a>

### API-0062

**Chức năng:** PUT /api/v1/nutrition-profiles/me

**Module:** User và profile · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 63 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho User và profile; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Upsert và tính chỉ số tham khảo.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi PUT /api/v1/nutrition-profiles/me không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0063"></a>

### API-0063

**Chức năng:** PUT /api/v1/nutrition-profiles/me

**Module:** User và profile · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 64 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho User và profile; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Upsert và tính chỉ số tham khảo.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi PUT /api/v1/nutrition-profiles/me với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0064"></a>

### API-0064

**Chức năng:** PUT /api/v1/nutrition-profiles/me

**Module:** User và profile · **Loại:** Invalid payload · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 65 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho User và profile; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Upsert và tính chỉ số tham khảo.
```

**Dữ liệu test:**

```text
Body chứa field bắt buộc rỗng/sai type; PATCH={} hoặc score=6/quantity=-1 khi áp dụng
```

**Các bước thực hiện:**

```text
1. Gửi PUT /api/v1/nutrition-profiles/me với body sai schema.
2. Đối chiếu field error.
3. Xác minh DB giữ nguyên.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 400 VALIDATION_ERROR; details chỉ rõ field; không lưu dữ liệu sai.
```

<a id="api-0065"></a>

### API-0065

**Chức năng:** POST /api/v1/nutrition-profiles/me/recalculate

**Module:** User và profile · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 66 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho User và profile; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Tính lại mục tiêu dinh dưỡng/BMI.
```

**Dữ liệu test:**

```text
{heightCm:165,currentWeightKg:60,activityLevel:moderate,goal:maintain,allergenIds:[ALLERGEN_PEANUT]}
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi POST /api/v1/nutrition-profiles/me/recalculate với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Tính lại mục tiêu dinh dưỡng/BMI; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0066"></a>

### API-0066

**Chức năng:** POST /api/v1/nutrition-profiles/me/recalculate

**Module:** User và profile · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 67 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho User và profile; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Tính lại mục tiêu dinh dưỡng/BMI.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi POST /api/v1/nutrition-profiles/me/recalculate không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0067"></a>

### API-0067

**Chức năng:** POST /api/v1/nutrition-profiles/me/recalculate

**Module:** User và profile · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 68 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho User và profile; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Tính lại mục tiêu dinh dưỡng/BMI.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/nutrition-profiles/me/recalculate với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="module-5"></a>

## Category, allergen và food item

| ID                    | Chức năng / endpoint          | Loại test       | Ưu tiên | Actor  | Kết quả chạy |
| --------------------- | ----------------------------- | --------------- | ------- | ------ | ------------ |
| [API-0068](#api-0068) | GET /api/v1/categories        | Happy path      | P1      | Guest  | Đạt          |
| [API-0069](#api-0069) | GET /api/v1/categories        | Empty result    | P2      | Guest  | Đạt          |
| [API-0070](#api-0070) | POST /api/v1/categories       | Happy path      | P1      | Admin  | Đạt          |
| [API-0071](#api-0071) | POST /api/v1/categories       | Missing auth    | P0      | Guest  | Đạt          |
| [API-0072](#api-0072) | POST /api/v1/categories       | Invalid auth    | P0      | Admin  | Đạt          |
| [API-0073](#api-0073) | POST /api/v1/categories       | Role denied     | P0      | User A | Đạt          |
| [API-0074](#api-0074) | POST /api/v1/categories       | Invalid payload | P1      | Admin  | Đạt          |
| [API-0075](#api-0075) | PATCH /api/v1/categories/:id  | Happy path      | P1      | Admin  | Đạt          |
| [API-0076](#api-0076) | PATCH /api/v1/categories/:id  | Missing auth    | P0      | Guest  | Đạt          |
| [API-0077](#api-0077) | PATCH /api/v1/categories/:id  | Invalid auth    | P0      | Admin  | Đạt          |
| [API-0078](#api-0078) | PATCH /api/v1/categories/:id  | Role denied     | P0      | User A | Đạt          |
| [API-0079](#api-0079) | PATCH /api/v1/categories/:id  | Missing target  | P1      | Admin  | Đạt          |
| [API-0080](#api-0080) | PATCH /api/v1/categories/:id  | Invalid payload | P1      | Admin  | Đạt          |
| [API-0081](#api-0081) | DELETE /api/v1/categories/:id | Happy path      | P1      | Admin  | Đạt          |
| [API-0082](#api-0082) | DELETE /api/v1/categories/:id | Missing auth    | P0      | Guest  | Đạt          |
| [API-0083](#api-0083) | DELETE /api/v1/categories/:id | Invalid auth    | P0      | Admin  | Đạt          |
| [API-0084](#api-0084) | DELETE /api/v1/categories/:id | Role denied     | P0      | User A | Đạt          |
| [API-0085](#api-0085) | DELETE /api/v1/categories/:id | Missing target  | P1      | Admin  | Đạt          |
| [API-0086](#api-0086) | GET /api/v1/allergens         | Happy path      | P1      | Guest  | Đạt          |
| [API-0087](#api-0087) | GET /api/v1/allergens         | Empty result    | P2      | Guest  | Đạt          |
| [API-0088](#api-0088) | POST /api/v1/allergens        | Happy path      | P1      | Admin  | Đạt          |
| [API-0089](#api-0089) | POST /api/v1/allergens        | Missing auth    | P0      | Guest  | Đạt          |
| [API-0090](#api-0090) | POST /api/v1/allergens        | Invalid auth    | P0      | Admin  | Đạt          |
| [API-0091](#api-0091) | POST /api/v1/allergens        | Role denied     | P0      | User A | Đạt          |
| [API-0092](#api-0092) | POST /api/v1/allergens        | Invalid payload | P1      | Admin  | Đạt          |
| [API-0093](#api-0093) | PATCH /api/v1/allergens/:id   | Happy path      | P1      | Admin  | Đạt          |
| [API-0094](#api-0094) | PATCH /api/v1/allergens/:id   | Missing auth    | P0      | Guest  | Đạt          |
| [API-0095](#api-0095) | PATCH /api/v1/allergens/:id   | Invalid auth    | P0      | Admin  | Đạt          |
| [API-0096](#api-0096) | PATCH /api/v1/allergens/:id   | Role denied     | P0      | User A | Đạt          |
| [API-0097](#api-0097) | PATCH /api/v1/allergens/:id   | Missing target  | P1      | Admin  | Đạt          |
| [API-0098](#api-0098) | PATCH /api/v1/allergens/:id   | Invalid payload | P1      | Admin  | Đạt          |
| [API-0099](#api-0099) | DELETE /api/v1/allergens/:id  | Happy path      | P1      | Admin  | Đạt          |
| [API-0100](#api-0100) | DELETE /api/v1/allergens/:id  | Missing auth    | P0      | Guest  | Đạt          |
| [API-0101](#api-0101) | DELETE /api/v1/allergens/:id  | Invalid auth    | P0      | Admin  | Đạt          |
| [API-0102](#api-0102) | DELETE /api/v1/allergens/:id  | Role denied     | P0      | User A | Đạt          |
| [API-0103](#api-0103) | DELETE /api/v1/allergens/:id  | Missing target  | P1      | Admin  | Đạt          |
| [API-0104](#api-0104) | GET /api/v1/food-items        | Happy path      | P1      | Guest  | Đạt          |
| [API-0105](#api-0105) | GET /api/v1/food-items        | Empty result    | P2      | Guest  | Đạt          |
| [API-0106](#api-0106) | GET /api/v1/food-items/:id    | Happy path      | P1      | Guest  | Đạt          |
| [API-0107](#api-0107) | GET /api/v1/food-items/:id    | Missing target  | P1      | Guest  | Đạt          |
| [API-0108](#api-0108) | POST /api/v1/food-items       | Happy path      | P1      | Admin  | Đạt          |
| [API-0109](#api-0109) | POST /api/v1/food-items       | Missing auth    | P0      | Guest  | Đạt          |
| [API-0110](#api-0110) | POST /api/v1/food-items       | Invalid auth    | P0      | Admin  | Đạt          |
| [API-0111](#api-0111) | POST /api/v1/food-items       | Role denied     | P0      | User A | Đạt          |
| [API-0112](#api-0112) | POST /api/v1/food-items       | Invalid payload | P1      | Admin  | Đạt          |
| [API-0113](#api-0113) | PATCH /api/v1/food-items/:id  | Happy path      | P1      | Admin  | Đạt          |
| [API-0114](#api-0114) | PATCH /api/v1/food-items/:id  | Missing auth    | P0      | Guest  | Đạt          |
| [API-0115](#api-0115) | PATCH /api/v1/food-items/:id  | Invalid auth    | P0      | Admin  | Đạt          |
| [API-0116](#api-0116) | PATCH /api/v1/food-items/:id  | Role denied     | P0      | User A | Đạt          |
| [API-0117](#api-0117) | PATCH /api/v1/food-items/:id  | Missing target  | P1      | Admin  | Đạt          |
| [API-0118](#api-0118) | PATCH /api/v1/food-items/:id  | Invalid payload | P1      | Admin  | Đạt          |
| [API-0119](#api-0119) | DELETE /api/v1/food-items/:id | Happy path      | P1      | Admin  | Đạt          |
| [API-0120](#api-0120) | DELETE /api/v1/food-items/:id | Missing auth    | P0      | Guest  | Đạt          |
| [API-0121](#api-0121) | DELETE /api/v1/food-items/:id | Invalid auth    | P0      | Admin  | Đạt          |
| [API-0122](#api-0122) | DELETE /api/v1/food-items/:id | Role denied     | P0      | User A | Đạt          |
| [API-0123](#api-0123) | DELETE /api/v1/food-items/:id | Missing target  | P1      | Admin  | Đạt          |

<a id="api-0068"></a>

### API-0068

**Chức năng:** GET /api/v1/categories

**Module:** Category, allergen và food item · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 69 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Category, allergen và food item; không gửi token; target đúng trạng thái cho Danh sách active, filter type.
```

**Dữ liệu test:**

```text
name=Món chính; type=recipe; slug=mon-chinh
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/categories với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: Danh sách active, filter type; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0069"></a>

### API-0069

**Chức năng:** GET /api/v1/categories

**Module:** Category, allergen và food item · **Loại:** Empty result · **Ưu tiên:** P2 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 70 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Không có dữ liệu khớp filter hoặc user mới
```

**Dữ liệu test:**

```text
Filter hợp lệ không có kết quả
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/categories với filter rỗng kết quả.
2. Kiểm tra payload.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; list rỗng/tổng bằng 0 đúng schema; không lỗi 500 hoặc dữ liệu user khác.
```

<a id="api-0070"></a>

### API-0070

**Chức năng:** POST /api/v1/categories

**Module:** Category, allergen và food item · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 71 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Category, allergen và food item; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Tạo category.
```

**Dữ liệu test:**

```text
name=Món chính; type=recipe; slug=mon-chinh
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi POST /api/v1/categories với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Tạo category; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0071"></a>

### API-0071

**Chức năng:** POST /api/v1/categories

**Module:** Category, allergen và food item · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 72 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Category, allergen và food item; Admin active, có Firebase token bị bỏ; target đúng trạng thái cho Tạo category.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi POST /api/v1/categories không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0072"></a>

### API-0072

**Chức năng:** POST /api/v1/categories

**Module:** Category, allergen và food item · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 73 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Category, allergen và food item; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Tạo category.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/categories với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0073"></a>

### API-0073

**Chức năng:** POST /api/v1/categories

**Module:** Category, allergen và food item · **Loại:** Role denied · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 74 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
User A active có role=user; target hợp lệ
```

**Dữ liệu test:**

```text
name=Món chính; type=recipe; slug=mon-chinh
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/categories bằng token user.
2. Kiểm tra DB/audit.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403; không đọc admin data hoặc thực hiện mutation; không nâng quyền.
```

<a id="api-0074"></a>

### API-0074

**Chức năng:** POST /api/v1/categories

**Module:** Category, allergen và food item · **Loại:** Invalid payload · **Ưu tiên:** P1 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 75 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Category, allergen và food item; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Tạo category.
```

**Dữ liệu test:**

```text
Body chứa field bắt buộc rỗng/sai type; PATCH={} hoặc score=6/quantity=-1 khi áp dụng
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/categories với body sai schema.
2. Đối chiếu field error.
3. Xác minh DB giữ nguyên.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 400 VALIDATION_ERROR; details chỉ rõ field; không lưu dữ liệu sai.
```

<a id="api-0075"></a>

### API-0075

**Chức năng:** PATCH /api/v1/categories/:id

**Module:** Category, allergen và food item · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 76 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Category, allergen và food item; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Sửa category.
```

**Dữ liệu test:**

```text
name=Món chính; type=recipe; slug=mon-chinh
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi PATCH /api/v1/categories/:id với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Sửa category; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0076"></a>

### API-0076

**Chức năng:** PATCH /api/v1/categories/:id

**Module:** Category, allergen và food item · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 77 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Category, allergen và food item; Admin active, có Firebase token bị bỏ; target đúng trạng thái cho Sửa category.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi PATCH /api/v1/categories/:id không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0077"></a>

### API-0077

**Chức năng:** PATCH /api/v1/categories/:id

**Module:** Category, allergen và food item · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 78 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Category, allergen và food item; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Sửa category.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/categories/:id với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0078"></a>

### API-0078

**Chức năng:** PATCH /api/v1/categories/:id

**Module:** Category, allergen và food item · **Loại:** Role denied · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 79 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
User A active có role=user; target hợp lệ
```

**Dữ liệu test:**

```text
name=Món chính; type=recipe; slug=mon-chinh
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/categories/:id bằng token user.
2. Kiểm tra DB/audit.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403; không đọc admin data hoặc thực hiện mutation; không nâng quyền.
```

<a id="api-0079"></a>

### API-0079

**Chức năng:** PATCH /api/v1/categories/:id

**Module:** Category, allergen và food item · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 80 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/categories/:id với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0080"></a>

### API-0080

**Chức năng:** PATCH /api/v1/categories/:id

**Module:** Category, allergen và food item · **Loại:** Invalid payload · **Ưu tiên:** P1 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 81 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Category, allergen và food item; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Sửa category.
```

**Dữ liệu test:**

```text
Body chứa field bắt buộc rỗng/sai type; PATCH={} hoặc score=6/quantity=-1 khi áp dụng
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/categories/:id với body sai schema.
2. Đối chiếu field error.
3. Xác minh DB giữ nguyên.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 400 VALIDATION_ERROR; details chỉ rõ field; không lưu dữ liệu sai.
```

<a id="api-0081"></a>

### API-0081

**Chức năng:** DELETE /api/v1/categories/:id

**Module:** Category, allergen và food item · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 82 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Category, allergen và food item; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Inactivate nếu đang được dùng.
```

**Dữ liệu test:**

```text
name=Món chính; type=recipe; slug=mon-chinh
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi DELETE /api/v1/categories/:id với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Inactivate nếu đang được dùng; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0082"></a>

### API-0082

**Chức năng:** DELETE /api/v1/categories/:id

**Module:** Category, allergen và food item · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 83 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Category, allergen và food item; Admin active, có Firebase token bị bỏ; target đúng trạng thái cho Inactivate nếu đang được dùng.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi DELETE /api/v1/categories/:id không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0083"></a>

### API-0083

**Chức năng:** DELETE /api/v1/categories/:id

**Module:** Category, allergen và food item · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 84 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Category, allergen và food item; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Inactivate nếu đang được dùng.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi DELETE /api/v1/categories/:id với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0084"></a>

### API-0084

**Chức năng:** DELETE /api/v1/categories/:id

**Module:** Category, allergen và food item · **Loại:** Role denied · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 85 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
User A active có role=user; target hợp lệ
```

**Dữ liệu test:**

```text
name=Món chính; type=recipe; slug=mon-chinh
```

**Các bước thực hiện:**

```text
1. Gửi DELETE /api/v1/categories/:id bằng token user.
2. Kiểm tra DB/audit.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403; không đọc admin data hoặc thực hiện mutation; không nâng quyền.
```

<a id="api-0085"></a>

### API-0085

**Chức năng:** DELETE /api/v1/categories/:id

**Module:** Category, allergen và food item · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 86 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi DELETE /api/v1/categories/:id với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0086"></a>

### API-0086

**Chức năng:** GET /api/v1/allergens

**Module:** Category, allergen và food item · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 87 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Category, allergen và food item; không gửi token; target đúng trạng thái cho Danh sách active.
```

**Dữ liệu test:**

```text
name=Đậu phộng; slug=dau-phong
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/allergens với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: Danh sách active; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0087"></a>

### API-0087

**Chức năng:** GET /api/v1/allergens

**Module:** Category, allergen và food item · **Loại:** Empty result · **Ưu tiên:** P2 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 88 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Không có dữ liệu khớp filter hoặc user mới
```

**Dữ liệu test:**

```text
Filter hợp lệ không có kết quả
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/allergens với filter rỗng kết quả.
2. Kiểm tra payload.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; list rỗng/tổng bằng 0 đúng schema; không lỗi 500 hoặc dữ liệu user khác.
```

<a id="api-0088"></a>

### API-0088

**Chức năng:** POST /api/v1/allergens

**Module:** Category, allergen và food item · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 89 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Category, allergen và food item; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Tạo allergen.
```

**Dữ liệu test:**

```text
name=Đậu phộng; slug=dau-phong
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi POST /api/v1/allergens với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Tạo allergen; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0089"></a>

### API-0089

**Chức năng:** POST /api/v1/allergens

**Module:** Category, allergen và food item · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 90 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Category, allergen và food item; Admin active, có Firebase token bị bỏ; target đúng trạng thái cho Tạo allergen.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi POST /api/v1/allergens không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0090"></a>

### API-0090

**Chức năng:** POST /api/v1/allergens

**Module:** Category, allergen và food item · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 91 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Category, allergen và food item; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Tạo allergen.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/allergens với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0091"></a>

### API-0091

**Chức năng:** POST /api/v1/allergens

**Module:** Category, allergen và food item · **Loại:** Role denied · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 92 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
User A active có role=user; target hợp lệ
```

**Dữ liệu test:**

```text
name=Đậu phộng; slug=dau-phong
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/allergens bằng token user.
2. Kiểm tra DB/audit.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403; không đọc admin data hoặc thực hiện mutation; không nâng quyền.
```

<a id="api-0092"></a>

### API-0092

**Chức năng:** POST /api/v1/allergens

**Module:** Category, allergen và food item · **Loại:** Invalid payload · **Ưu tiên:** P1 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 93 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Category, allergen và food item; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Tạo allergen.
```

**Dữ liệu test:**

```text
Body chứa field bắt buộc rỗng/sai type; PATCH={} hoặc score=6/quantity=-1 khi áp dụng
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/allergens với body sai schema.
2. Đối chiếu field error.
3. Xác minh DB giữ nguyên.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 400 VALIDATION_ERROR; details chỉ rõ field; không lưu dữ liệu sai.
```

<a id="api-0093"></a>

### API-0093

**Chức năng:** PATCH /api/v1/allergens/:id

**Module:** Category, allergen và food item · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 94 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Category, allergen và food item; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Sửa allergen.
```

**Dữ liệu test:**

```text
name=Đậu phộng; slug=dau-phong
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi PATCH /api/v1/allergens/:id với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Sửa allergen; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0094"></a>

### API-0094

**Chức năng:** PATCH /api/v1/allergens/:id

**Module:** Category, allergen và food item · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 95 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Category, allergen và food item; Admin active, có Firebase token bị bỏ; target đúng trạng thái cho Sửa allergen.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi PATCH /api/v1/allergens/:id không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0095"></a>

### API-0095

**Chức năng:** PATCH /api/v1/allergens/:id

**Module:** Category, allergen và food item · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 96 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Category, allergen và food item; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Sửa allergen.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/allergens/:id với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0096"></a>

### API-0096

**Chức năng:** PATCH /api/v1/allergens/:id

**Module:** Category, allergen và food item · **Loại:** Role denied · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 97 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
User A active có role=user; target hợp lệ
```

**Dữ liệu test:**

```text
name=Đậu phộng; slug=dau-phong
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/allergens/:id bằng token user.
2. Kiểm tra DB/audit.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403; không đọc admin data hoặc thực hiện mutation; không nâng quyền.
```

<a id="api-0097"></a>

### API-0097

**Chức năng:** PATCH /api/v1/allergens/:id

**Module:** Category, allergen và food item · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 98 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/allergens/:id với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0098"></a>

### API-0098

**Chức năng:** PATCH /api/v1/allergens/:id

**Module:** Category, allergen và food item · **Loại:** Invalid payload · **Ưu tiên:** P1 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 99 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Category, allergen và food item; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Sửa allergen.
```

**Dữ liệu test:**

```text
Body chứa field bắt buộc rỗng/sai type; PATCH={} hoặc score=6/quantity=-1 khi áp dụng
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/allergens/:id với body sai schema.
2. Đối chiếu field error.
3. Xác minh DB giữ nguyên.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 400 VALIDATION_ERROR; details chỉ rõ field; không lưu dữ liệu sai.
```

<a id="api-0099"></a>

### API-0099

**Chức năng:** DELETE /api/v1/allergens/:id

**Module:** Category, allergen và food item · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 100 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Category, allergen và food item; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Inactivate nếu đang được dùng.
```

**Dữ liệu test:**

```text
name=Đậu phộng; slug=dau-phong
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi DELETE /api/v1/allergens/:id với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Inactivate nếu đang được dùng; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0100"></a>

### API-0100

**Chức năng:** DELETE /api/v1/allergens/:id

**Module:** Category, allergen và food item · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 101 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Category, allergen và food item; Admin active, có Firebase token bị bỏ; target đúng trạng thái cho Inactivate nếu đang được dùng.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi DELETE /api/v1/allergens/:id không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0101"></a>

### API-0101

**Chức năng:** DELETE /api/v1/allergens/:id

**Module:** Category, allergen và food item · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 102 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Category, allergen và food item; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Inactivate nếu đang được dùng.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi DELETE /api/v1/allergens/:id với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0102"></a>

### API-0102

**Chức năng:** DELETE /api/v1/allergens/:id

**Module:** Category, allergen và food item · **Loại:** Role denied · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 103 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
User A active có role=user; target hợp lệ
```

**Dữ liệu test:**

```text
name=Đậu phộng; slug=dau-phong
```

**Các bước thực hiện:**

```text
1. Gửi DELETE /api/v1/allergens/:id bằng token user.
2. Kiểm tra DB/audit.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403; không đọc admin data hoặc thực hiện mutation; không nâng quyền.
```

<a id="api-0103"></a>

### API-0103

**Chức năng:** DELETE /api/v1/allergens/:id

**Module:** Category, allergen và food item · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 104 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi DELETE /api/v1/allergens/:id với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0104"></a>

### API-0104

**Chức năng:** GET /api/v1/food-items

**Module:** Category, allergen và food item · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 105 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Category, allergen và food item; không gửi token; target đúng trạng thái cho Search/filter/pagination.
```

**Dữ liệu test:**

```text
FOOD_TOFU; name=Đậu hũ; nutritionPer100g={caloriesKcal:76,proteinG:8,carbsG:2,fatG:4}
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/food-items với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: Search/filter/pagination; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0105"></a>

### API-0105

**Chức năng:** GET /api/v1/food-items

**Module:** Category, allergen và food item · **Loại:** Empty result · **Ưu tiên:** P2 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 106 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Không có dữ liệu khớp filter hoặc user mới
```

**Dữ liệu test:**

```text
Filter hợp lệ không có kết quả
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/food-items với filter rỗng kết quả.
2. Kiểm tra payload.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; list rỗng/tổng bằng 0 đúng schema; không lỗi 500 hoặc dữ liệu user khác.
```

<a id="api-0106"></a>

### API-0106

**Chức năng:** GET /api/v1/food-items/:id

**Module:** Category, allergen và food item · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 107 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Category, allergen và food item; không gửi token; target đúng trạng thái cho Chi tiết và nutrition.
```

**Dữ liệu test:**

```text
FOOD_TOFU; name=Đậu hũ; nutritionPer100g={caloriesKcal:76,proteinG:8,carbsG:2,fatG:4}
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/food-items/:id với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: Chi tiết và nutrition; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0107"></a>

### API-0107

**Chức năng:** GET /api/v1/food-items/:id

**Module:** Category, allergen và food item · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 108 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/food-items/:id với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0108"></a>

### API-0108

**Chức năng:** POST /api/v1/food-items

**Module:** Category, allergen và food item · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 109 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Category, allergen và food item; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Tạo food item.
```

**Dữ liệu test:**

```text
FOOD_TOFU; name=Đậu hũ; nutritionPer100g={caloriesKcal:76,proteinG:8,carbsG:2,fatG:4}
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi POST /api/v1/food-items với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Tạo food item; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0109"></a>

### API-0109

**Chức năng:** POST /api/v1/food-items

**Module:** Category, allergen và food item · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 110 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Category, allergen và food item; Admin active, có Firebase token bị bỏ; target đúng trạng thái cho Tạo food item.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi POST /api/v1/food-items không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0110"></a>

### API-0110

**Chức năng:** POST /api/v1/food-items

**Module:** Category, allergen và food item · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 111 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Category, allergen và food item; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Tạo food item.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/food-items với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0111"></a>

### API-0111

**Chức năng:** POST /api/v1/food-items

**Module:** Category, allergen và food item · **Loại:** Role denied · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 112 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
User A active có role=user; target hợp lệ
```

**Dữ liệu test:**

```text
FOOD_TOFU; name=Đậu hũ; nutritionPer100g={caloriesKcal:76,proteinG:8,carbsG:2,fatG:4}
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/food-items bằng token user.
2. Kiểm tra DB/audit.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403; không đọc admin data hoặc thực hiện mutation; không nâng quyền.
```

<a id="api-0112"></a>

### API-0112

**Chức năng:** POST /api/v1/food-items

**Module:** Category, allergen và food item · **Loại:** Invalid payload · **Ưu tiên:** P1 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 113 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Category, allergen và food item; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Tạo food item.
```

**Dữ liệu test:**

```text
Body chứa field bắt buộc rỗng/sai type; PATCH={} hoặc score=6/quantity=-1 khi áp dụng
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/food-items với body sai schema.
2. Đối chiếu field error.
3. Xác minh DB giữ nguyên.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 400 VALIDATION_ERROR; details chỉ rõ field; không lưu dữ liệu sai.
```

<a id="api-0113"></a>

### API-0113

**Chức năng:** PATCH /api/v1/food-items/:id

**Module:** Category, allergen và food item · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 114 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Category, allergen và food item; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Cập nhật.
```

**Dữ liệu test:**

```text
FOOD_TOFU; name=Đậu hũ; nutritionPer100g={caloriesKcal:76,proteinG:8,carbsG:2,fatG:4}
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi PATCH /api/v1/food-items/:id với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Cập nhật; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0114"></a>

### API-0114

**Chức năng:** PATCH /api/v1/food-items/:id

**Module:** Category, allergen và food item · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 115 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Category, allergen và food item; Admin active, có Firebase token bị bỏ; target đúng trạng thái cho Cập nhật.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi PATCH /api/v1/food-items/:id không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0115"></a>

### API-0115

**Chức năng:** PATCH /api/v1/food-items/:id

**Module:** Category, allergen và food item · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 116 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Category, allergen và food item; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Cập nhật.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/food-items/:id với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0116"></a>

### API-0116

**Chức năng:** PATCH /api/v1/food-items/:id

**Module:** Category, allergen và food item · **Loại:** Role denied · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 117 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
User A active có role=user; target hợp lệ
```

**Dữ liệu test:**

```text
FOOD_TOFU; name=Đậu hũ; nutritionPer100g={caloriesKcal:76,proteinG:8,carbsG:2,fatG:4}
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/food-items/:id bằng token user.
2. Kiểm tra DB/audit.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403; không đọc admin data hoặc thực hiện mutation; không nâng quyền.
```

<a id="api-0117"></a>

### API-0117

**Chức năng:** PATCH /api/v1/food-items/:id

**Module:** Category, allergen và food item · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 118 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/food-items/:id với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0118"></a>

### API-0118

**Chức năng:** PATCH /api/v1/food-items/:id

**Module:** Category, allergen và food item · **Loại:** Invalid payload · **Ưu tiên:** P1 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 119 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Category, allergen và food item; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Cập nhật.
```

**Dữ liệu test:**

```text
Body chứa field bắt buộc rỗng/sai type; PATCH={} hoặc score=6/quantity=-1 khi áp dụng
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/food-items/:id với body sai schema.
2. Đối chiếu field error.
3. Xác minh DB giữ nguyên.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 400 VALIDATION_ERROR; details chỉ rõ field; không lưu dữ liệu sai.
```

<a id="api-0119"></a>

### API-0119

**Chức năng:** DELETE /api/v1/food-items/:id

**Module:** Category, allergen và food item · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 120 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Category, allergen và food item; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Inactivate, không phá snapshot.
```

**Dữ liệu test:**

```text
FOOD_TOFU; name=Đậu hũ; nutritionPer100g={caloriesKcal:76,proteinG:8,carbsG:2,fatG:4}
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi DELETE /api/v1/food-items/:id với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Inactivate, không phá snapshot; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0120"></a>

### API-0120

**Chức năng:** DELETE /api/v1/food-items/:id

**Module:** Category, allergen và food item · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 121 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Category, allergen và food item; Admin active, có Firebase token bị bỏ; target đúng trạng thái cho Inactivate, không phá snapshot.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi DELETE /api/v1/food-items/:id không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0121"></a>

### API-0121

**Chức năng:** DELETE /api/v1/food-items/:id

**Module:** Category, allergen và food item · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 122 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Category, allergen và food item; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Inactivate, không phá snapshot.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi DELETE /api/v1/food-items/:id với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0122"></a>

### API-0122

**Chức năng:** DELETE /api/v1/food-items/:id

**Module:** Category, allergen và food item · **Loại:** Role denied · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 123 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
User A active có role=user; target hợp lệ
```

**Dữ liệu test:**

```text
FOOD_TOFU; name=Đậu hũ; nutritionPer100g={caloriesKcal:76,proteinG:8,carbsG:2,fatG:4}
```

**Các bước thực hiện:**

```text
1. Gửi DELETE /api/v1/food-items/:id bằng token user.
2. Kiểm tra DB/audit.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403; không đọc admin data hoặc thực hiện mutation; không nâng quyền.
```

<a id="api-0123"></a>

### API-0123

**Chức năng:** DELETE /api/v1/food-items/:id

**Module:** Category, allergen và food item · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 124 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi DELETE /api/v1/food-items/:id với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="module-6"></a>

## Recipe và discovery

| ID                    | Chức năng / endpoint                | Loại test         | Ưu tiên | Actor  | Kết quả chạy |
| --------------------- | ----------------------------------- | ----------------- | ------- | ------ | ------------ |
| [API-0124](#api-0124) | GET /api/v1/recipes                 | Happy path        | P1      | Guest  | Đạt          |
| [API-0125](#api-0125) | GET /api/v1/recipes                 | Empty result      | P2      | Guest  | Đạt          |
| [API-0126](#api-0126) | GET /api/v1/recipes/mine            | Happy path        | P1      | User A | Đạt          |
| [API-0127](#api-0127) | GET /api/v1/recipes/mine            | Missing auth      | P0      | Guest  | Đạt          |
| [API-0128](#api-0128) | GET /api/v1/recipes/mine            | Invalid auth      | P0      | User A | Đạt          |
| [API-0129](#api-0129) | GET /api/v1/recipes/mine            | Empty result      | P2      | User A | Đạt          |
| [API-0130](#api-0130) | GET /api/v1/recipes/:idOrSlug       | Happy path        | P1      | Guest  | Đạt          |
| [API-0131](#api-0131) | GET /api/v1/recipes/:idOrSlug       | Missing target    | P1      | Guest  | Đạt          |
| [API-0132](#api-0132) | POST /api/v1/recipes                | Happy path        | P1      | User A | Đạt          |
| [API-0133](#api-0133) | POST /api/v1/recipes                | Missing auth      | P0      | Guest  | Đạt          |
| [API-0134](#api-0134) | POST /api/v1/recipes                | Invalid auth      | P0      | User A | Đạt          |
| [API-0135](#api-0135) | POST /api/v1/recipes                | Invalid payload   | P1      | User A | Đạt          |
| [API-0136](#api-0136) | PATCH /api/v1/recipes/:id           | Happy path        | P1      | User A | Đạt          |
| [API-0137](#api-0137) | PATCH /api/v1/recipes/:id           | Missing auth      | P0      | Guest  | Đạt          |
| [API-0138](#api-0138) | PATCH /api/v1/recipes/:id           | Invalid auth      | P0      | User A | Đạt          |
| [API-0139](#api-0139) | PATCH /api/v1/recipes/:id           | Cross-user access | P0      | User B | Đạt          |
| [API-0140](#api-0140) | PATCH /api/v1/recipes/:id           | Missing target    | P1      | User A | Đạt          |
| [API-0141](#api-0141) | PATCH /api/v1/recipes/:id           | Invalid payload   | P1      | User A | Đạt          |
| [API-0142](#api-0142) | DELETE /api/v1/recipes/:id          | Happy path        | P1      | User A | Đạt          |
| [API-0143](#api-0143) | DELETE /api/v1/recipes/:id          | Missing auth      | P0      | Guest  | Đạt          |
| [API-0144](#api-0144) | DELETE /api/v1/recipes/:id          | Invalid auth      | P0      | User A | Đạt          |
| [API-0145](#api-0145) | DELETE /api/v1/recipes/:id          | Cross-user access | P0      | User B | Đạt          |
| [API-0146](#api-0146) | DELETE /api/v1/recipes/:id          | Missing target    | P1      | User A | Đạt          |
| [API-0147](#api-0147) | POST /api/v1/recipes/:id/submit     | Happy path        | P1      | User A | Đạt          |
| [API-0148](#api-0148) | POST /api/v1/recipes/:id/submit     | Missing auth      | P0      | Guest  | Đạt          |
| [API-0149](#api-0149) | POST /api/v1/recipes/:id/submit     | Invalid auth      | P0      | User A | Đạt          |
| [API-0150](#api-0150) | POST /api/v1/recipes/:id/submit     | Cross-user access | P0      | User B | Đạt          |
| [API-0151](#api-0151) | POST /api/v1/recipes/:id/submit     | Missing target    | P1      | User A | Đạt          |
| [API-0152](#api-0152) | POST /api/v1/recipes/:id/publish    | Happy path        | P1      | Admin  | Đạt          |
| [API-0153](#api-0153) | POST /api/v1/recipes/:id/publish    | Missing auth      | P0      | Guest  | Đạt          |
| [API-0154](#api-0154) | POST /api/v1/recipes/:id/publish    | Invalid auth      | P0      | Admin  | Đạt          |
| [API-0155](#api-0155) | POST /api/v1/recipes/:id/publish    | Role denied       | P0      | User A | Đạt          |
| [API-0156](#api-0156) | POST /api/v1/recipes/:id/publish    | Missing target    | P1      | Admin  | Đạt          |
| [API-0157](#api-0157) | POST /api/v1/recipes/:id/reject     | Happy path        | P1      | Admin  | Đạt          |
| [API-0158](#api-0158) | POST /api/v1/recipes/:id/reject     | Missing auth      | P0      | Guest  | Đạt          |
| [API-0159](#api-0159) | POST /api/v1/recipes/:id/reject     | Invalid auth      | P0      | Admin  | Đạt          |
| [API-0160](#api-0160) | POST /api/v1/recipes/:id/reject     | Role denied       | P0      | User A | Đạt          |
| [API-0161](#api-0161) | POST /api/v1/recipes/:id/reject     | Missing target    | P1      | Admin  | Đạt          |
| [API-0162](#api-0162) | GET /api/v1/recipes/:id/nutrition   | Happy path        | P1      | Guest  | Đạt          |
| [API-0163](#api-0163) | GET /api/v1/recipes/:id/nutrition   | Missing target    | P1      | Guest  | Đạt          |
| [API-0164](#api-0164) | GET /api/v1/search                  | Happy path        | P1      | Guest  | Đạt          |
| [API-0165](#api-0165) | GET /api/v1/search                  | Empty result      | P2      | Guest  | Đạt          |
| [API-0166](#api-0166) | GET /api/v1/search/suggestions      | Happy path        | P1      | Guest  | Đạt          |
| [API-0167](#api-0167) | GET /api/v1/search/suggestions      | Empty result      | P2      | Guest  | Đạt          |
| [API-0168](#api-0168) | GET /api/v1/search/recent           | Happy path        | P1      | User A | Đạt          |
| [API-0169](#api-0169) | GET /api/v1/search/recent           | Missing auth      | P0      | Guest  | Đạt          |
| [API-0170](#api-0170) | GET /api/v1/search/recent           | Invalid auth      | P0      | User A | Đạt          |
| [API-0171](#api-0171) | GET /api/v1/search/recent           | Empty result      | P2      | User A | Đạt          |
| [API-0172](#api-0172) | DELETE /api/v1/search/recent        | Happy path        | P1      | User A | Đạt          |
| [API-0173](#api-0173) | DELETE /api/v1/search/recent        | Missing auth      | P0      | Guest  | Đạt          |
| [API-0174](#api-0174) | DELETE /api/v1/search/recent        | Invalid auth      | P0      | User A | Đạt          |
| [API-0175](#api-0175) | DELETE /api/v1/search/recent/:id    | Happy path        | P1      | User A | Đạt          |
| [API-0176](#api-0176) | DELETE /api/v1/search/recent/:id    | Missing auth      | P0      | Guest  | Đạt          |
| [API-0177](#api-0177) | DELETE /api/v1/search/recent/:id    | Invalid auth      | P0      | User A | Đạt          |
| [API-0178](#api-0178) | DELETE /api/v1/search/recent/:id    | Cross-user access | P0      | User B | Đạt          |
| [API-0179](#api-0179) | DELETE /api/v1/search/recent/:id    | Missing target    | P1      | User A | Đạt          |
| [API-0180](#api-0180) | GET /api/v1/discover                | Happy path        | P1      | Guest  | Đạt          |
| [API-0181](#api-0181) | GET /api/v1/discover                | Empty result      | P2      | Guest  | Đạt          |
| [API-0182](#api-0182) | GET /api/v1/recommendations/recipes | Happy path        | P1      | User A | Đạt          |
| [API-0183](#api-0183) | GET /api/v1/recommendations/recipes | Missing auth      | P0      | Guest  | Đạt          |
| [API-0184](#api-0184) | GET /api/v1/recommendations/recipes | Invalid auth      | P0      | User A | Đạt          |
| [API-0185](#api-0185) | GET /api/v1/recommendations/recipes | Empty result      | P2      | User A | Đạt          |
| [API-0186](#api-0186) | GET /api/v1/recommendations/content | Happy path        | P1      | User A | Đạt          |
| [API-0187](#api-0187) | GET /api/v1/recommendations/content | Missing auth      | P0      | Guest  | Đạt          |
| [API-0188](#api-0188) | GET /api/v1/recommendations/content | Invalid auth      | P0      | User A | Đạt          |
| [API-0189](#api-0189) | GET /api/v1/recommendations/content | Empty result      | P2      | User A | Đạt          |

<a id="api-0124"></a>

### API-0124

**Chức năng:** GET /api/v1/recipes

**Module:** Recipe và discovery · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 125 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Recipe và discovery; không gửi token; target đúng trạng thái cho Danh sách recipe published/public.
```

**Dữ liệu test:**

```text
RECIPE_A; title=Đậu hũ sốt nấm; servings=2; ingredients=[FOOD_TOFU 200g]; steps=[Nấu chín 10 phút]
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/recipes với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: Danh sách recipe published/public; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0125"></a>

### API-0125

**Chức năng:** GET /api/v1/recipes

**Module:** Recipe và discovery · **Loại:** Empty result · **Ưu tiên:** P2 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 126 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Không có dữ liệu khớp filter hoặc user mới
```

**Dữ liệu test:**

```text
Filter hợp lệ không có kết quả
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/recipes với filter rỗng kết quả.
2. Kiểm tra payload.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; list rỗng/tổng bằng 0 đúng schema; không lỗi 500 hoặc dữ liệu user khác.
```

<a id="api-0126"></a>

### API-0126

**Chức năng:** GET /api/v1/recipes/mine

**Module:** Recipe và discovery · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 127 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Recipe và discovery; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Recipe do mình tạo theo status.
```

**Dữ liệu test:**

```text
RECIPE_A; title=Đậu hũ sốt nấm; servings=2; ingredients=[FOOD_TOFU 200g]; steps=[Nấu chín 10 phút]
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/recipes/mine với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: Recipe do mình tạo theo status; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0127"></a>

### API-0127

**Chức năng:** GET /api/v1/recipes/mine

**Module:** Recipe và discovery · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 128 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Recipe và discovery; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Recipe do mình tạo theo status.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi GET /api/v1/recipes/mine không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0128"></a>

### API-0128

**Chức năng:** GET /api/v1/recipes/mine

**Module:** Recipe và discovery · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 129 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Recipe và discovery; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Recipe do mình tạo theo status.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/recipes/mine với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0129"></a>

### API-0129

**Chức năng:** GET /api/v1/recipes/mine

**Module:** Recipe và discovery · **Loại:** Empty result · **Ưu tiên:** P2 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 130 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Không có dữ liệu khớp filter hoặc user mới
```

**Dữ liệu test:**

```text
Filter hợp lệ không có kết quả
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/recipes/mine với filter rỗng kết quả.
2. Kiểm tra payload.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; list rỗng/tổng bằng 0 đúng schema; không lỗi 500 hoặc dữ liệu user khác.
```

<a id="api-0130"></a>

### API-0130

**Chức năng:** GET /api/v1/recipes/:idOrSlug

**Module:** Recipe và discovery · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 131 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Recipe và discovery; không gửi token; target đúng trạng thái cho Chi tiết, đánh dấu saved/reacted nếu đăng nhập.
```

**Dữ liệu test:**

```text
RECIPE_A; title=Đậu hũ sốt nấm; servings=2; ingredients=[FOOD_TOFU 200g]; steps=[Nấu chín 10 phút]
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/recipes/:idOrSlug với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: Chi tiết, đánh dấu saved/reacted nếu đăng nhập; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0131"></a>

### API-0131

**Chức năng:** GET /api/v1/recipes/:idOrSlug

**Module:** Recipe và discovery · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 132 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/recipes/:idOrSlug với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0132"></a>

### API-0132

**Chức năng:** POST /api/v1/recipes

**Module:** Recipe và discovery · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 133 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Recipe và discovery; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Tạo draft.
```

**Dữ liệu test:**

```text
RECIPE_A; title=Đậu hũ sốt nấm; servings=2; ingredients=[FOOD_TOFU 200g]; steps=[Nấu chín 10 phút]
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi POST /api/v1/recipes với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Tạo draft; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0133"></a>

### API-0133

**Chức năng:** POST /api/v1/recipes

**Module:** Recipe và discovery · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 134 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Recipe và discovery; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Tạo draft.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi POST /api/v1/recipes không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0134"></a>

### API-0134

**Chức năng:** POST /api/v1/recipes

**Module:** Recipe và discovery · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 135 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Recipe và discovery; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Tạo draft.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/recipes với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0135"></a>

### API-0135

**Chức năng:** POST /api/v1/recipes

**Module:** Recipe và discovery · **Loại:** Invalid payload · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 136 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Recipe và discovery; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Tạo draft.
```

**Dữ liệu test:**

```text
Body chứa field bắt buộc rỗng/sai type; PATCH={} hoặc score=6/quantity=-1 khi áp dụng
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/recipes với body sai schema.
2. Đối chiếu field error.
3. Xác minh DB giữ nguyên.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 400 VALIDATION_ERROR; details chỉ rõ field; không lưu dữ liệu sai.
```

<a id="api-0136"></a>

### API-0136

**Chức năng:** PATCH /api/v1/recipes/:id

**Module:** Recipe và discovery · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 137 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Recipe và discovery; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Cập nhật draft hoặc nội dung cho phép.
```

**Dữ liệu test:**

```text
RECIPE_A; title=Đậu hũ sốt nấm; servings=2; ingredients=[FOOD_TOFU 200g]; steps=[Nấu chín 10 phút]
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi PATCH /api/v1/recipes/:id với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Cập nhật draft hoặc nội dung cho phép; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0137"></a>

### API-0137

**Chức năng:** PATCH /api/v1/recipes/:id

**Module:** Recipe và discovery · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 138 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Recipe và discovery; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Cập nhật draft hoặc nội dung cho phép.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi PATCH /api/v1/recipes/:id không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0138"></a>

### API-0138

**Chức năng:** PATCH /api/v1/recipes/:id

**Module:** Recipe và discovery · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 139 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Recipe và discovery; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Cập nhật draft hoặc nội dung cho phép.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/recipes/:id với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0139"></a>

### API-0139

**Chức năng:** PATCH /api/v1/recipes/:id

**Module:** Recipe và discovery · **Loại:** Cross-user access · **Ưu tiên:** P0 · **Actor:** User B

**Nguồn Excel:** API Cases, hàng 140 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Target thuộc User A; User B có token hợp lệ
```

**Dữ liệu test:**

```text
RECIPE_A (không thuộc B); title=Đậu hũ sốt nấm; servings=2; ingredients=[FOOD_TOFU 200g]; steps=[Nấu chín 10 phút]
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/recipes/:id với ID của User A và token B.
2. Kiểm tra response/DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403 hoặc 404 theo chính sách chống dò ID; không lộ dữ liệu A; không mutation.
```

<a id="api-0140"></a>

### API-0140

**Chức năng:** PATCH /api/v1/recipes/:id

**Module:** Recipe và discovery · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 141 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/recipes/:id với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0141"></a>

### API-0141

**Chức năng:** PATCH /api/v1/recipes/:id

**Module:** Recipe và discovery · **Loại:** Invalid payload · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 142 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Recipe và discovery; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Cập nhật draft hoặc nội dung cho phép.
```

**Dữ liệu test:**

```text
Body chứa field bắt buộc rỗng/sai type; PATCH={} hoặc score=6/quantity=-1 khi áp dụng
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/recipes/:id với body sai schema.
2. Đối chiếu field error.
3. Xác minh DB giữ nguyên.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 400 VALIDATION_ERROR; details chỉ rõ field; không lưu dữ liệu sai.
```

<a id="api-0142"></a>

### API-0142

**Chức năng:** DELETE /api/v1/recipes/:id

**Module:** Recipe và discovery · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 143 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Recipe và discovery; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Soft delete.
```

**Dữ liệu test:**

```text
RECIPE_A; title=Đậu hũ sốt nấm; servings=2; ingredients=[FOOD_TOFU 200g]; steps=[Nấu chín 10 phút]
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi DELETE /api/v1/recipes/:id với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Soft delete; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0143"></a>

### API-0143

**Chức năng:** DELETE /api/v1/recipes/:id

**Module:** Recipe và discovery · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 144 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Recipe và discovery; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Soft delete.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi DELETE /api/v1/recipes/:id không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0144"></a>

### API-0144

**Chức năng:** DELETE /api/v1/recipes/:id

**Module:** Recipe và discovery · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 145 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Recipe và discovery; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Soft delete.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi DELETE /api/v1/recipes/:id với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0145"></a>

### API-0145

**Chức năng:** DELETE /api/v1/recipes/:id

**Module:** Recipe và discovery · **Loại:** Cross-user access · **Ưu tiên:** P0 · **Actor:** User B

**Nguồn Excel:** API Cases, hàng 146 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Target thuộc User A; User B có token hợp lệ
```

**Dữ liệu test:**

```text
RECIPE_A (không thuộc B); title=Đậu hũ sốt nấm; servings=2; ingredients=[FOOD_TOFU 200g]; steps=[Nấu chín 10 phút]
```

**Các bước thực hiện:**

```text
1. Gửi DELETE /api/v1/recipes/:id với ID của User A và token B.
2. Kiểm tra response/DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403 hoặc 404 theo chính sách chống dò ID; không lộ dữ liệu A; không mutation.
```

<a id="api-0146"></a>

### API-0146

**Chức năng:** DELETE /api/v1/recipes/:id

**Module:** Recipe và discovery · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 147 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi DELETE /api/v1/recipes/:id với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0147"></a>

### API-0147

**Chức năng:** POST /api/v1/recipes/:id/submit

**Module:** Recipe và discovery · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 148 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Recipe và discovery; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Gửi duyệt.
```

**Dữ liệu test:**

```text
RECIPE_A; title=Đậu hũ sốt nấm; servings=2; ingredients=[FOOD_TOFU 200g]; steps=[Nấu chín 10 phút]
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi POST /api/v1/recipes/:id/submit với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Gửi duyệt; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0148"></a>

### API-0148

**Chức năng:** POST /api/v1/recipes/:id/submit

**Module:** Recipe và discovery · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 149 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Recipe và discovery; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Gửi duyệt.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi POST /api/v1/recipes/:id/submit không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0149"></a>

### API-0149

**Chức năng:** POST /api/v1/recipes/:id/submit

**Module:** Recipe và discovery · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 150 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Recipe và discovery; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Gửi duyệt.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/recipes/:id/submit với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0150"></a>

### API-0150

**Chức năng:** POST /api/v1/recipes/:id/submit

**Module:** Recipe và discovery · **Loại:** Cross-user access · **Ưu tiên:** P0 · **Actor:** User B

**Nguồn Excel:** API Cases, hàng 151 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Target thuộc User A; User B có token hợp lệ
```

**Dữ liệu test:**

```text
RECIPE_A (không thuộc B); title=Đậu hũ sốt nấm; servings=2; ingredients=[FOOD_TOFU 200g]; steps=[Nấu chín 10 phút]
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/recipes/:id/submit với ID của User A và token B.
2. Kiểm tra response/DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403 hoặc 404 theo chính sách chống dò ID; không lộ dữ liệu A; không mutation.
```

<a id="api-0151"></a>

### API-0151

**Chức năng:** POST /api/v1/recipes/:id/submit

**Module:** Recipe và discovery · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 152 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/recipes/:id/submit với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0152"></a>

### API-0152

**Chức năng:** POST /api/v1/recipes/:id/publish

**Module:** Recipe và discovery · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 153 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Recipe và discovery; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Duyệt và publish.
```

**Dữ liệu test:**

```text
RECIPE_A; title=Đậu hũ sốt nấm; servings=2; ingredients=[FOOD_TOFU 200g]; steps=[Nấu chín 10 phút]
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi POST /api/v1/recipes/:id/publish với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Duyệt và publish; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0153"></a>

### API-0153

**Chức năng:** POST /api/v1/recipes/:id/publish

**Module:** Recipe và discovery · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 154 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Recipe và discovery; Admin active, có Firebase token bị bỏ; target đúng trạng thái cho Duyệt và publish.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi POST /api/v1/recipes/:id/publish không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0154"></a>

### API-0154

**Chức năng:** POST /api/v1/recipes/:id/publish

**Module:** Recipe và discovery · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 155 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Recipe và discovery; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Duyệt và publish.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/recipes/:id/publish với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0155"></a>

### API-0155

**Chức năng:** POST /api/v1/recipes/:id/publish

**Module:** Recipe và discovery · **Loại:** Role denied · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 156 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
User A active có role=user; target hợp lệ
```

**Dữ liệu test:**

```text
RECIPE_A; title=Đậu hũ sốt nấm; servings=2; ingredients=[FOOD_TOFU 200g]; steps=[Nấu chín 10 phút]
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/recipes/:id/publish bằng token user.
2. Kiểm tra DB/audit.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403; không đọc admin data hoặc thực hiện mutation; không nâng quyền.
```

<a id="api-0156"></a>

### API-0156

**Chức năng:** POST /api/v1/recipes/:id/publish

**Module:** Recipe và discovery · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 157 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/recipes/:id/publish với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0157"></a>

### API-0157

**Chức năng:** POST /api/v1/recipes/:id/reject

**Module:** Recipe và discovery · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 158 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Recipe và discovery; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Từ chối có lý do.
```

**Dữ liệu test:**

```text
RECIPE_A; title=Đậu hũ sốt nấm; servings=2; ingredients=[FOOD_TOFU 200g]; steps=[Nấu chín 10 phút]
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi POST /api/v1/recipes/:id/reject với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Từ chối có lý do; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0158"></a>

### API-0158

**Chức năng:** POST /api/v1/recipes/:id/reject

**Module:** Recipe và discovery · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 159 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Recipe và discovery; Admin active, có Firebase token bị bỏ; target đúng trạng thái cho Từ chối có lý do.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi POST /api/v1/recipes/:id/reject không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0159"></a>

### API-0159

**Chức năng:** POST /api/v1/recipes/:id/reject

**Module:** Recipe và discovery · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 160 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Recipe và discovery; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Từ chối có lý do.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/recipes/:id/reject với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0160"></a>

### API-0160

**Chức năng:** POST /api/v1/recipes/:id/reject

**Module:** Recipe và discovery · **Loại:** Role denied · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 161 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
User A active có role=user; target hợp lệ
```

**Dữ liệu test:**

```text
RECIPE_A; title=Đậu hũ sốt nấm; servings=2; ingredients=[FOOD_TOFU 200g]; steps=[Nấu chín 10 phút]
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/recipes/:id/reject bằng token user.
2. Kiểm tra DB/audit.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403; không đọc admin data hoặc thực hiện mutation; không nâng quyền.
```

<a id="api-0161"></a>

### API-0161

**Chức năng:** POST /api/v1/recipes/:id/reject

**Module:** Recipe và discovery · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 162 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/recipes/:id/reject với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0162"></a>

### API-0162

**Chức năng:** GET /api/v1/recipes/:id/nutrition

**Module:** Recipe và discovery · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 163 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Recipe và discovery; không gửi token; target đúng trạng thái cho Nutrition per serving snapshot.
```

**Dữ liệu test:**

```text
RECIPE_A; title=Đậu hũ sốt nấm; servings=2; ingredients=[FOOD_TOFU 200g]; steps=[Nấu chín 10 phút]
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/recipes/:id/nutrition với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: Nutrition per serving snapshot; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0163"></a>

### API-0163

**Chức năng:** GET /api/v1/recipes/:id/nutrition

**Module:** Recipe và discovery · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 164 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/recipes/:id/nutrition với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0164"></a>

### API-0164

**Chức năng:** GET /api/v1/search

**Module:** Recipe và discovery · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 165 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Recipe và discovery; không gửi token; target đúng trạng thái cho Tìm recipe, food item và post theo type/filter.
```

**Dữ liệu test:**

```text
q=đậu hũ; type=recipe; page=1; limit=20
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/search với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: Tìm recipe, food item và post theo type/filter; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0165"></a>

### API-0165

**Chức năng:** GET /api/v1/search

**Module:** Recipe và discovery · **Loại:** Empty result · **Ưu tiên:** P2 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 166 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Không có dữ liệu khớp filter hoặc user mới
```

**Dữ liệu test:**

```text
Filter hợp lệ không có kết quả
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/search với filter rỗng kết quả.
2. Kiểm tra payload.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; list rỗng/tổng bằng 0 đúng schema; không lỗi 500 hoặc dữ liệu user khác.
```

<a id="api-0166"></a>

### API-0166

**Chức năng:** GET /api/v1/search/suggestions

**Module:** Recipe và discovery · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 167 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Recipe và discovery; không gửi token; target đúng trạng thái cho Autocomplete có giới hạn, chỉ từ dữ liệu public/active.
```

**Dữ liệu test:**

```text
q=đậu hũ; type=recipe; page=1; limit=20
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/search/suggestions với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: Autocomplete có giới hạn, chỉ từ dữ liệu public/active; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0167"></a>

### API-0167

**Chức năng:** GET /api/v1/search/suggestions

**Module:** Recipe và discovery · **Loại:** Empty result · **Ưu tiên:** P2 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 168 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Không có dữ liệu khớp filter hoặc user mới
```

**Dữ liệu test:**

```text
Filter hợp lệ không có kết quả
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/search/suggestions với filter rỗng kết quả.
2. Kiểm tra payload.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; list rỗng/tổng bằng 0 đúng schema; không lỗi 500 hoặc dữ liệu user khác.
```

<a id="api-0168"></a>

### API-0168

**Chức năng:** GET /api/v1/search/recent

**Module:** Recipe và discovery · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 169 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Recipe và discovery; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Lịch sử tìm kiếm gần đây của user.
```

**Dữ liệu test:**

```text
q=đậu hũ; type=recipe; page=1; limit=20
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/search/recent với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: Lịch sử tìm kiếm gần đây của user; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0169"></a>

### API-0169

**Chức năng:** GET /api/v1/search/recent

**Module:** Recipe và discovery · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 170 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Recipe và discovery; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Lịch sử tìm kiếm gần đây của user.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi GET /api/v1/search/recent không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0170"></a>

### API-0170

**Chức năng:** GET /api/v1/search/recent

**Module:** Recipe và discovery · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 171 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Recipe và discovery; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Lịch sử tìm kiếm gần đây của user.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/search/recent với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0171"></a>

### API-0171

**Chức năng:** GET /api/v1/search/recent

**Module:** Recipe và discovery · **Loại:** Empty result · **Ưu tiên:** P2 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 172 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Không có dữ liệu khớp filter hoặc user mới
```

**Dữ liệu test:**

```text
Filter hợp lệ không có kết quả
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/search/recent với filter rỗng kết quả.
2. Kiểm tra payload.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; list rỗng/tổng bằng 0 đúng schema; không lỗi 500 hoặc dữ liệu user khác.
```

<a id="api-0172"></a>

### API-0172

**Chức năng:** DELETE /api/v1/search/recent

**Module:** Recipe và discovery · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 173 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Recipe và discovery; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Xóa toàn bộ lịch sử tìm kiếm.
```

**Dữ liệu test:**

```text
q=đậu hũ; type=recipe; page=1; limit=20
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi DELETE /api/v1/search/recent với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Xóa toàn bộ lịch sử tìm kiếm; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0173"></a>

### API-0173

**Chức năng:** DELETE /api/v1/search/recent

**Module:** Recipe và discovery · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 174 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Recipe và discovery; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Xóa toàn bộ lịch sử tìm kiếm.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi DELETE /api/v1/search/recent không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0174"></a>

### API-0174

**Chức năng:** DELETE /api/v1/search/recent

**Module:** Recipe và discovery · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 175 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Recipe và discovery; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Xóa toàn bộ lịch sử tìm kiếm.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi DELETE /api/v1/search/recent với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0175"></a>

### API-0175

**Chức năng:** DELETE /api/v1/search/recent/:id

**Module:** Recipe và discovery · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 176 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Recipe và discovery; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Xóa một mục lịch sử.
```

**Dữ liệu test:**

```text
q=đậu hũ; type=recipe; page=1; limit=20
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi DELETE /api/v1/search/recent/:id với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Xóa một mục lịch sử; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0176"></a>

### API-0176

**Chức năng:** DELETE /api/v1/search/recent/:id

**Module:** Recipe và discovery · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 177 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Recipe và discovery; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Xóa một mục lịch sử.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi DELETE /api/v1/search/recent/:id không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0177"></a>

### API-0177

**Chức năng:** DELETE /api/v1/search/recent/:id

**Module:** Recipe và discovery · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 178 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Recipe và discovery; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Xóa một mục lịch sử.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi DELETE /api/v1/search/recent/:id với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0178"></a>

### API-0178

**Chức năng:** DELETE /api/v1/search/recent/:id

**Module:** Recipe và discovery · **Loại:** Cross-user access · **Ưu tiên:** P0 · **Actor:** User B

**Nguồn Excel:** API Cases, hàng 179 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Target thuộc User A; User B có token hợp lệ
```

**Dữ liệu test:**

```text
q=đậu hũ; type=recipe; page=1; limit=20
```

**Các bước thực hiện:**

```text
1. Gửi DELETE /api/v1/search/recent/:id với ID của User A và token B.
2. Kiểm tra response/DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403 hoặc 404 theo chính sách chống dò ID; không lộ dữ liệu A; không mutation.
```

<a id="api-0179"></a>

### API-0179

**Chức năng:** DELETE /api/v1/search/recent/:id

**Module:** Recipe và discovery · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 180 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi DELETE /api/v1/search/recent/:id với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0180"></a>

### API-0180

**Chức năng:** GET /api/v1/discover

**Module:** Recipe và discovery · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 181 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Recipe và discovery; không gửi token; target đúng trạng thái cho Nội dung nổi bật và gợi ý có giải thích ngắn.
```

**Dữ liệu test:**

```text
Fixture đúng schema OpenAPI; ID User A/target A; page=1,limit=20 cho list; reason=kiểm tra khi moderation
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/discover với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: Nội dung nổi bật và gợi ý có giải thích ngắn; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0181"></a>

### API-0181

**Chức năng:** GET /api/v1/discover

**Module:** Recipe và discovery · **Loại:** Empty result · **Ưu tiên:** P2 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 182 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Không có dữ liệu khớp filter hoặc user mới
```

**Dữ liệu test:**

```text
Filter hợp lệ không có kết quả
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/discover với filter rỗng kết quả.
2. Kiểm tra payload.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; list rỗng/tổng bằng 0 đúng schema; không lỗi 500 hoặc dữ liệu user khác.
```

<a id="api-0182"></a>

### API-0182

**Chức năng:** GET /api/v1/recommendations/recipes

**Module:** Recipe và discovery · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 183 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Recipe và discovery; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Gợi ý cá nhân theo diet/allergen/pantry/mục tiêu.
```

**Dữ liệu test:**

```text
RECIPE_A; title=Đậu hũ sốt nấm; servings=2; ingredients=[FOOD_TOFU 200g]; steps=[Nấu chín 10 phút]
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/recommendations/recipes với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: Gợi ý cá nhân theo diet/allergen/pantry/mục tiêu; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0183"></a>

### API-0183

**Chức năng:** GET /api/v1/recommendations/recipes

**Module:** Recipe và discovery · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 184 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Recipe và discovery; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Gợi ý cá nhân theo diet/allergen/pantry/mục tiêu.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi GET /api/v1/recommendations/recipes không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0184"></a>

### API-0184

**Chức năng:** GET /api/v1/recommendations/recipes

**Module:** Recipe và discovery · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 185 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Recipe và discovery; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Gợi ý cá nhân theo diet/allergen/pantry/mục tiêu.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/recommendations/recipes với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0185"></a>

### API-0185

**Chức năng:** GET /api/v1/recommendations/recipes

**Module:** Recipe và discovery · **Loại:** Empty result · **Ưu tiên:** P2 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 186 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Không có dữ liệu khớp filter hoặc user mới
```

**Dữ liệu test:**

```text
Filter hợp lệ không có kết quả
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/recommendations/recipes với filter rỗng kết quả.
2. Kiểm tra payload.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; list rỗng/tổng bằng 0 đúng schema; không lỗi 500 hoặc dữ liệu user khác.
```

<a id="api-0186"></a>

### API-0186

**Chức năng:** GET /api/v1/recommendations/content

**Module:** Recipe và discovery · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 187 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Recipe và discovery; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Gợi ý blog/video/recipe đã publish.
```

**Dữ liệu test:**

```text
Fixture đúng schema OpenAPI; ID User A/target A; page=1,limit=20 cho list; reason=kiểm tra khi moderation
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/recommendations/content với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: Gợi ý blog/video/recipe đã publish; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0187"></a>

### API-0187

**Chức năng:** GET /api/v1/recommendations/content

**Module:** Recipe và discovery · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 188 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Recipe và discovery; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Gợi ý blog/video/recipe đã publish.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi GET /api/v1/recommendations/content không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0188"></a>

### API-0188

**Chức năng:** GET /api/v1/recommendations/content

**Module:** Recipe và discovery · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 189 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Recipe và discovery; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Gợi ý blog/video/recipe đã publish.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/recommendations/content với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0189"></a>

### API-0189

**Chức năng:** GET /api/v1/recommendations/content

**Module:** Recipe và discovery · **Loại:** Empty result · **Ưu tiên:** P2 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 190 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Không có dữ liệu khớp filter hoặc user mới
```

**Dữ liệu test:**

```text
Filter hợp lệ không có kết quả
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/recommendations/content với filter rỗng kết quả.
2. Kiểm tra payload.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; list rỗng/tổng bằng 0 đúng schema; không lỗi 500 hoặc dữ liệu user khác.
```

<a id="module-7"></a>

## Pantry

| ID                    | Chức năng / endpoint                  | Loại test         | Ưu tiên | Actor  | Kết quả chạy |
| --------------------- | ------------------------------------- | ----------------- | ------- | ------ | ------------ |
| [API-0190](#api-0190) | GET /api/v1/pantry                    | Happy path        | P1      | User A | Đạt          |
| [API-0191](#api-0191) | GET /api/v1/pantry                    | Missing auth      | P0      | Guest  | Đạt          |
| [API-0192](#api-0192) | GET /api/v1/pantry                    | Invalid auth      | P0      | User A | Đạt          |
| [API-0193](#api-0193) | POST /api/v1/pantry/items             | Happy path        | P1      | User A | Đạt          |
| [API-0194](#api-0194) | POST /api/v1/pantry/items             | Missing auth      | P0      | Guest  | Đạt          |
| [API-0195](#api-0195) | POST /api/v1/pantry/items             | Invalid auth      | P0      | User A | Đạt          |
| [API-0196](#api-0196) | POST /api/v1/pantry/items             | Invalid payload   | P1      | User A | Đạt          |
| [API-0197](#api-0197) | POST /api/v1/pantry/items/bulk        | Happy path        | P1      | User A | Đạt          |
| [API-0198](#api-0198) | POST /api/v1/pantry/items/bulk        | Missing auth      | P0      | Guest  | Đạt          |
| [API-0199](#api-0199) | POST /api/v1/pantry/items/bulk        | Invalid auth      | P0      | User A | Đạt          |
| [API-0200](#api-0200) | POST /api/v1/pantry/items/bulk        | Invalid payload   | P1      | User A | Đạt          |
| [API-0201](#api-0201) | PATCH /api/v1/pantry/items/:itemId    | Happy path        | P1      | User A | Đạt          |
| [API-0202](#api-0202) | PATCH /api/v1/pantry/items/:itemId    | Missing auth      | P0      | Guest  | Đạt          |
| [API-0203](#api-0203) | PATCH /api/v1/pantry/items/:itemId    | Invalid auth      | P0      | User A | Đạt          |
| [API-0204](#api-0204) | PATCH /api/v1/pantry/items/:itemId    | Cross-user access | P0      | User B | Đạt          |
| [API-0205](#api-0205) | PATCH /api/v1/pantry/items/:itemId    | Invalid payload   | P1      | User A | Đạt          |
| [API-0206](#api-0206) | DELETE /api/v1/pantry/items/:itemId   | Happy path        | P1      | User A | Đạt          |
| [API-0207](#api-0207) | DELETE /api/v1/pantry/items/:itemId   | Missing auth      | P0      | Guest  | Đạt          |
| [API-0208](#api-0208) | DELETE /api/v1/pantry/items/:itemId   | Invalid auth      | P0      | User A | Đạt          |
| [API-0209](#api-0209) | DELETE /api/v1/pantry/items/:itemId   | Cross-user access | P0      | User B | Đạt          |
| [API-0210](#api-0210) | GET /api/v1/pantry/expiring           | Happy path        | P1      | User A | Đạt          |
| [API-0211](#api-0211) | GET /api/v1/pantry/expiring           | Missing auth      | P0      | Guest  | Đạt          |
| [API-0212](#api-0212) | GET /api/v1/pantry/expiring           | Invalid auth      | P0      | User A | Đạt          |
| [API-0213](#api-0213) | GET /api/v1/pantry/expiring           | Empty result      | P2      | User A | Đạt          |
| [API-0214](#api-0214) | GET /api/v1/pantry/recipe-suggestions | Happy path        | P1      | User A | Đạt          |
| [API-0215](#api-0215) | GET /api/v1/pantry/recipe-suggestions | Missing auth      | P0      | Guest  | Đạt          |
| [API-0216](#api-0216) | GET /api/v1/pantry/recipe-suggestions | Invalid auth      | P0      | User A | Đạt          |
| [API-0217](#api-0217) | GET /api/v1/pantry/recipe-suggestions | Empty result      | P2      | User A | Đạt          |

<a id="api-0190"></a>

### API-0190

**Chức năng:** GET /api/v1/pantry

**Module:** Pantry · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 191 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Pantry; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Xem pantry.
```

**Dữ liệu test:**

```text
Fixture đúng schema OpenAPI; ID User A/target A; page=1,limit=20 cho list; reason=kiểm tra khi moderation
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/pantry với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: Xem pantry; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0191"></a>

### API-0191

**Chức năng:** GET /api/v1/pantry

**Module:** Pantry · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 192 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Pantry; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Xem pantry.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi GET /api/v1/pantry không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0192"></a>

### API-0192

**Chức năng:** GET /api/v1/pantry

**Module:** Pantry · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 193 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Pantry; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Xem pantry.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/pantry với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0193"></a>

### API-0193

**Chức năng:** POST /api/v1/pantry/items

**Module:** Pantry · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 194 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Pantry; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Thêm item.
```

**Dữ liệu test:**

```text
{foodItemId:FOOD_TOFU,quantity:200,unit:g,expiresAt:2026-10-10T00:00:00Z}
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi POST /api/v1/pantry/items với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Thêm item; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0194"></a>

### API-0194

**Chức năng:** POST /api/v1/pantry/items

**Module:** Pantry · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 195 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Pantry; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Thêm item.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi POST /api/v1/pantry/items không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0195"></a>

### API-0195

**Chức năng:** POST /api/v1/pantry/items

**Module:** Pantry · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 196 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Pantry; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Thêm item.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/pantry/items với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0196"></a>

### API-0196

**Chức năng:** POST /api/v1/pantry/items

**Module:** Pantry · **Loại:** Invalid payload · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 197 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Pantry; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Thêm item.
```

**Dữ liệu test:**

```text
Body chứa field bắt buộc rỗng/sai type; PATCH={} hoặc score=6/quantity=-1 khi áp dụng
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/pantry/items với body sai schema.
2. Đối chiếu field error.
3. Xác minh DB giữ nguyên.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 400 VALIDATION_ERROR; details chỉ rõ field; không lưu dữ liệu sai.
```

<a id="api-0197"></a>

### API-0197

**Chức năng:** POST /api/v1/pantry/items/bulk

**Module:** Pantry · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 198 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Pantry; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Thêm nhiều item đã validate/idempotent.
```

**Dữ liệu test:**

```text
{foodItemId:FOOD_TOFU,quantity:200,unit:g,expiresAt:2026-10-10T00:00:00Z}
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi POST /api/v1/pantry/items/bulk với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Thêm nhiều item đã validate/idempotent; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0198"></a>

### API-0198

**Chức năng:** POST /api/v1/pantry/items/bulk

**Module:** Pantry · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 199 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Pantry; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Thêm nhiều item đã validate/idempotent.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi POST /api/v1/pantry/items/bulk không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0199"></a>

### API-0199

**Chức năng:** POST /api/v1/pantry/items/bulk

**Module:** Pantry · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 200 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Pantry; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Thêm nhiều item đã validate/idempotent.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/pantry/items/bulk với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0200"></a>

### API-0200

**Chức năng:** POST /api/v1/pantry/items/bulk

**Module:** Pantry · **Loại:** Invalid payload · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 201 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Pantry; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Thêm nhiều item đã validate/idempotent.
```

**Dữ liệu test:**

```text
Body chứa field bắt buộc rỗng/sai type; PATCH={} hoặc score=6/quantity=-1 khi áp dụng
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/pantry/items/bulk với body sai schema.
2. Đối chiếu field error.
3. Xác minh DB giữ nguyên.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 400 VALIDATION_ERROR; details chỉ rõ field; không lưu dữ liệu sai.
```

<a id="api-0201"></a>

### API-0201

**Chức năng:** PATCH /api/v1/pantry/items/:itemId

**Module:** Pantry · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 202 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Pantry; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Sửa quantity/unit/expiry/note.
```

**Dữ liệu test:**

```text
{foodItemId:FOOD_TOFU,quantity:200,unit:g,expiresAt:2026-10-10T00:00:00Z}
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi PATCH /api/v1/pantry/items/:itemId với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Sửa quantity/unit/expiry/note; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0202"></a>

### API-0202

**Chức năng:** PATCH /api/v1/pantry/items/:itemId

**Module:** Pantry · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 203 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Pantry; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Sửa quantity/unit/expiry/note.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi PATCH /api/v1/pantry/items/:itemId không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0203"></a>

### API-0203

**Chức năng:** PATCH /api/v1/pantry/items/:itemId

**Module:** Pantry · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 204 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Pantry; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Sửa quantity/unit/expiry/note.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/pantry/items/:itemId với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0204"></a>

### API-0204

**Chức năng:** PATCH /api/v1/pantry/items/:itemId

**Module:** Pantry · **Loại:** Cross-user access · **Ưu tiên:** P0 · **Actor:** User B

**Nguồn Excel:** API Cases, hàng 205 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Target thuộc User A; User B có token hợp lệ
```

**Dữ liệu test:**

```text
{foodItemId:FOOD_TOFU,quantity:200,unit:g,expiresAt:2026-10-10T00:00:00Z}
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/pantry/items/:itemId với ID của User A và token B.
2. Kiểm tra response/DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403 hoặc 404 theo chính sách chống dò ID; không lộ dữ liệu A; không mutation.
```

<a id="api-0205"></a>

### API-0205

**Chức năng:** PATCH /api/v1/pantry/items/:itemId

**Module:** Pantry · **Loại:** Invalid payload · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 206 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Pantry; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Sửa quantity/unit/expiry/note.
```

**Dữ liệu test:**

```text
Body chứa field bắt buộc rỗng/sai type; PATCH={} hoặc score=6/quantity=-1 khi áp dụng
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/pantry/items/:itemId với body sai schema.
2. Đối chiếu field error.
3. Xác minh DB giữ nguyên.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 400 VALIDATION_ERROR; details chỉ rõ field; không lưu dữ liệu sai.
```

<a id="api-0206"></a>

### API-0206

**Chức năng:** DELETE /api/v1/pantry/items/:itemId

**Module:** Pantry · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 207 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Pantry; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Xóa item.
```

**Dữ liệu test:**

```text
{foodItemId:FOOD_TOFU,quantity:200,unit:g,expiresAt:2026-10-10T00:00:00Z}
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi DELETE /api/v1/pantry/items/:itemId với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Xóa item; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0207"></a>

### API-0207

**Chức năng:** DELETE /api/v1/pantry/items/:itemId

**Module:** Pantry · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 208 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Pantry; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Xóa item.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi DELETE /api/v1/pantry/items/:itemId không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0208"></a>

### API-0208

**Chức năng:** DELETE /api/v1/pantry/items/:itemId

**Module:** Pantry · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 209 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Pantry; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Xóa item.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi DELETE /api/v1/pantry/items/:itemId với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0209"></a>

### API-0209

**Chức năng:** DELETE /api/v1/pantry/items/:itemId

**Module:** Pantry · **Loại:** Cross-user access · **Ưu tiên:** P0 · **Actor:** User B

**Nguồn Excel:** API Cases, hàng 210 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Target thuộc User A; User B có token hợp lệ
```

**Dữ liệu test:**

```text
{foodItemId:FOOD_TOFU,quantity:200,unit:g,expiresAt:2026-10-10T00:00:00Z}
```

**Các bước thực hiện:**

```text
1. Gửi DELETE /api/v1/pantry/items/:itemId với ID của User A và token B.
2. Kiểm tra response/DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403 hoặc 404 theo chính sách chống dò ID; không lộ dữ liệu A; không mutation.
```

<a id="api-0210"></a>

### API-0210

**Chức năng:** GET /api/v1/pantry/expiring

**Module:** Pantry · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 211 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Pantry; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Item sắp hết hạn.
```

**Dữ liệu test:**

```text
Fixture đúng schema OpenAPI; ID User A/target A; page=1,limit=20 cho list; reason=kiểm tra khi moderation
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/pantry/expiring với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: Item sắp hết hạn; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0211"></a>

### API-0211

**Chức năng:** GET /api/v1/pantry/expiring

**Module:** Pantry · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 212 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Pantry; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Item sắp hết hạn.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi GET /api/v1/pantry/expiring không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0212"></a>

### API-0212

**Chức năng:** GET /api/v1/pantry/expiring

**Module:** Pantry · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 213 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Pantry; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Item sắp hết hạn.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/pantry/expiring với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0213"></a>

### API-0213

**Chức năng:** GET /api/v1/pantry/expiring

**Module:** Pantry · **Loại:** Empty result · **Ưu tiên:** P2 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 214 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Không có dữ liệu khớp filter hoặc user mới
```

**Dữ liệu test:**

```text
Filter hợp lệ không có kết quả
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/pantry/expiring với filter rỗng kết quả.
2. Kiểm tra payload.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; list rỗng/tổng bằng 0 đúng schema; không lỗi 500 hoặc dữ liệu user khác.
```

<a id="api-0214"></a>

### API-0214

**Chức năng:** GET /api/v1/pantry/recipe-suggestions

**Module:** Pantry · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 215 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Pantry; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Gợi ý recipe theo mức khớp nguyên liệu.
```

**Dữ liệu test:**

```text
Fixture đúng schema OpenAPI; ID User A/target A; page=1,limit=20 cho list; reason=kiểm tra khi moderation
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/pantry/recipe-suggestions với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: Gợi ý recipe theo mức khớp nguyên liệu; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0215"></a>

### API-0215

**Chức năng:** GET /api/v1/pantry/recipe-suggestions

**Module:** Pantry · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 216 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Pantry; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Gợi ý recipe theo mức khớp nguyên liệu.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi GET /api/v1/pantry/recipe-suggestions không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0216"></a>

### API-0216

**Chức năng:** GET /api/v1/pantry/recipe-suggestions

**Module:** Pantry · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 217 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Pantry; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Gợi ý recipe theo mức khớp nguyên liệu.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/pantry/recipe-suggestions với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0217"></a>

### API-0217

**Chức năng:** GET /api/v1/pantry/recipe-suggestions

**Module:** Pantry · **Loại:** Empty result · **Ưu tiên:** P2 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 218 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Không có dữ liệu khớp filter hoặc user mới
```

**Dữ liệu test:**

```text
Filter hợp lệ không có kết quả
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/pantry/recipe-suggestions với filter rỗng kết quả.
2. Kiểm tra payload.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; list rỗng/tổng bằng 0 đúng schema; không lỗi 500 hoặc dữ liệu user khác.
```

<a id="module-8"></a>

## Meal plan

| ID                    | Chức năng / endpoint                        | Loại test         | Ưu tiên | Actor  | Kết quả chạy |
| --------------------- | ------------------------------------------- | ----------------- | ------- | ------ | ------------ |
| [API-0218](#api-0218) | GET /api/v1/meal-plans                      | Happy path        | P1      | User A | Đạt          |
| [API-0219](#api-0219) | GET /api/v1/meal-plans                      | Missing auth      | P0      | Guest  | Đạt          |
| [API-0220](#api-0220) | GET /api/v1/meal-plans                      | Invalid auth      | P0      | User A | Đạt          |
| [API-0221](#api-0221) | GET /api/v1/meal-plans                      | Empty result      | P2      | User A | Đạt          |
| [API-0222](#api-0222) | GET /api/v1/meal-plans/current              | Happy path        | P1      | User A | Đạt          |
| [API-0223](#api-0223) | GET /api/v1/meal-plans/current              | Missing auth      | P0      | Guest  | Đạt          |
| [API-0224](#api-0224) | GET /api/v1/meal-plans/current              | Invalid auth      | P0      | User A | Đạt          |
| [API-0225](#api-0225) | GET /api/v1/meal-plans/:id                  | Happy path        | P1      | User A | Đạt          |
| [API-0226](#api-0226) | GET /api/v1/meal-plans/:id                  | Missing auth      | P0      | Guest  | Đạt          |
| [API-0227](#api-0227) | GET /api/v1/meal-plans/:id                  | Invalid auth      | P0      | User A | Đạt          |
| [API-0228](#api-0228) | GET /api/v1/meal-plans/:id                  | Cross-user access | P0      | User B | Đạt          |
| [API-0229](#api-0229) | GET /api/v1/meal-plans/:id                  | Missing target    | P1      | User A | Đạt          |
| [API-0230](#api-0230) | POST /api/v1/meal-plans                     | Happy path        | P1      | User A | Đạt          |
| [API-0231](#api-0231) | POST /api/v1/meal-plans                     | Missing auth      | P0      | Guest  | Đạt          |
| [API-0232](#api-0232) | POST /api/v1/meal-plans                     | Invalid auth      | P0      | User A | Đạt          |
| [API-0233](#api-0233) | POST /api/v1/meal-plans                     | Invalid payload   | P1      | User A | Đạt          |
| [API-0234](#api-0234) | PATCH /api/v1/meal-plans/:id                | Happy path        | P1      | User A | Đạt          |
| [API-0235](#api-0235) | PATCH /api/v1/meal-plans/:id                | Missing auth      | P0      | Guest  | Đạt          |
| [API-0236](#api-0236) | PATCH /api/v1/meal-plans/:id                | Invalid auth      | P0      | User A | Đạt          |
| [API-0237](#api-0237) | PATCH /api/v1/meal-plans/:id                | Cross-user access | P0      | User B | Đạt          |
| [API-0238](#api-0238) | PATCH /api/v1/meal-plans/:id                | Missing target    | P1      | User A | Đạt          |
| [API-0239](#api-0239) | PATCH /api/v1/meal-plans/:id                | Invalid payload   | P1      | User A | Đạt          |
| [API-0240](#api-0240) | DELETE /api/v1/meal-plans/:id               | Happy path        | P1      | User A | Đạt          |
| [API-0241](#api-0241) | DELETE /api/v1/meal-plans/:id               | Missing auth      | P0      | Guest  | Đạt          |
| [API-0242](#api-0242) | DELETE /api/v1/meal-plans/:id               | Invalid auth      | P0      | User A | Đạt          |
| [API-0243](#api-0243) | DELETE /api/v1/meal-plans/:id               | Cross-user access | P0      | User B | Đạt          |
| [API-0244](#api-0244) | DELETE /api/v1/meal-plans/:id               | Missing target    | P1      | User A | Đạt          |
| [API-0245](#api-0245) | POST /api/v1/meal-plans/:id/meals           | Happy path        | P1      | User A | Đạt          |
| [API-0246](#api-0246) | POST /api/v1/meal-plans/:id/meals           | Missing auth      | P0      | Guest  | Đạt          |
| [API-0247](#api-0247) | POST /api/v1/meal-plans/:id/meals           | Invalid auth      | P0      | User A | Đạt          |
| [API-0248](#api-0248) | POST /api/v1/meal-plans/:id/meals           | Cross-user access | P0      | User B | Đạt          |
| [API-0249](#api-0249) | POST /api/v1/meal-plans/:id/meals           | Missing target    | P1      | User A | Đạt          |
| [API-0250](#api-0250) | POST /api/v1/meal-plans/:id/meals           | Invalid payload   | P1      | User A | Đạt          |
| [API-0251](#api-0251) | PATCH /api/v1/meal-plans/:id/meals/:mealId  | Happy path        | P1      | User A | Đạt          |
| [API-0252](#api-0252) | PATCH /api/v1/meal-plans/:id/meals/:mealId  | Missing auth      | P0      | Guest  | Đạt          |
| [API-0253](#api-0253) | PATCH /api/v1/meal-plans/:id/meals/:mealId  | Invalid auth      | P0      | User A | Đạt          |
| [API-0254](#api-0254) | PATCH /api/v1/meal-plans/:id/meals/:mealId  | Cross-user access | P0      | User B | Đạt          |
| [API-0255](#api-0255) | PATCH /api/v1/meal-plans/:id/meals/:mealId  | Missing target    | P1      | User A | Đạt          |
| [API-0256](#api-0256) | PATCH /api/v1/meal-plans/:id/meals/:mealId  | Invalid payload   | P1      | User A | Đạt          |
| [API-0257](#api-0257) | DELETE /api/v1/meal-plans/:id/meals/:mealId | Happy path        | P1      | User A | Đạt          |
| [API-0258](#api-0258) | DELETE /api/v1/meal-plans/:id/meals/:mealId | Missing auth      | P0      | Guest  | Đạt          |
| [API-0259](#api-0259) | DELETE /api/v1/meal-plans/:id/meals/:mealId | Invalid auth      | P0      | User A | Đạt          |
| [API-0260](#api-0260) | DELETE /api/v1/meal-plans/:id/meals/:mealId | Cross-user access | P0      | User B | Đạt          |
| [API-0261](#api-0261) | DELETE /api/v1/meal-plans/:id/meals/:mealId | Missing target    | P1      | User A | Đạt          |
| [API-0262](#api-0262) | POST /api/v1/meal-plans/:id/activate        | Happy path        | P1      | User A | Đạt          |
| [API-0263](#api-0263) | POST /api/v1/meal-plans/:id/activate        | Missing auth      | P0      | Guest  | Đạt          |
| [API-0264](#api-0264) | POST /api/v1/meal-plans/:id/activate        | Invalid auth      | P0      | User A | Đạt          |
| [API-0265](#api-0265) | POST /api/v1/meal-plans/:id/activate        | Cross-user access | P0      | User B | Đạt          |
| [API-0266](#api-0266) | POST /api/v1/meal-plans/:id/activate        | Missing target    | P1      | User A | Đạt          |
| [API-0267](#api-0267) | POST /api/v1/meal-plans/:id/clone           | Happy path        | P1      | User A | Đạt          |
| [API-0268](#api-0268) | POST /api/v1/meal-plans/:id/clone           | Missing auth      | P0      | Guest  | Đạt          |
| [API-0269](#api-0269) | POST /api/v1/meal-plans/:id/clone           | Invalid auth      | P0      | User A | Đạt          |
| [API-0270](#api-0270) | POST /api/v1/meal-plans/:id/clone           | Cross-user access | P0      | User B | Đạt          |
| [API-0271](#api-0271) | POST /api/v1/meal-plans/:id/clone           | Missing target    | P1      | User A | Đạt          |
| [API-0272](#api-0272) | POST /api/v1/meal-plans/:id/grocery-list    | Happy path        | P1      | User A | Đạt          |
| [API-0273](#api-0273) | POST /api/v1/meal-plans/:id/grocery-list    | Missing auth      | P0      | Guest  | Đạt          |
| [API-0274](#api-0274) | POST /api/v1/meal-plans/:id/grocery-list    | Invalid auth      | P0      | User A | Đạt          |
| [API-0275](#api-0275) | POST /api/v1/meal-plans/:id/grocery-list    | Cross-user access | P0      | User B | Đạt          |
| [API-0276](#api-0276) | POST /api/v1/meal-plans/:id/grocery-list    | Missing target    | P1      | User A | Đạt          |

<a id="api-0218"></a>

### API-0218

**Chức năng:** GET /api/v1/meal-plans

**Module:** Meal plan · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 219 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Meal plan; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Danh sách theo tuần/status.
```

**Dữ liệu test:**

```text
PLAN_A tuần 2026-10-05; meals: RECIPE_A, servings=2; proposalId=PROPOSAL_A nếu confirm
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/meal-plans với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: Danh sách theo tuần/status; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0219"></a>

### API-0219

**Chức năng:** GET /api/v1/meal-plans

**Module:** Meal plan · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 220 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Meal plan; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Danh sách theo tuần/status.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi GET /api/v1/meal-plans không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0220"></a>

### API-0220

**Chức năng:** GET /api/v1/meal-plans

**Module:** Meal plan · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 221 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Meal plan; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Danh sách theo tuần/status.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/meal-plans với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0221"></a>

### API-0221

**Chức năng:** GET /api/v1/meal-plans

**Module:** Meal plan · **Loại:** Empty result · **Ưu tiên:** P2 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 222 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Không có dữ liệu khớp filter hoặc user mới
```

**Dữ liệu test:**

```text
Filter hợp lệ không có kết quả
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/meal-plans với filter rỗng kết quả.
2. Kiểm tra payload.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; list rỗng/tổng bằng 0 đúng schema; không lỗi 500 hoặc dữ liệu user khác.
```

<a id="api-0222"></a>

### API-0222

**Chức năng:** GET /api/v1/meal-plans/current

**Module:** Meal plan · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 223 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Meal plan; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Plan active của tuần/ngày hiện tại.
```

**Dữ liệu test:**

```text
PLAN_A tuần 2026-10-05; meals: RECIPE_A, servings=2; proposalId=PROPOSAL_A nếu confirm
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/meal-plans/current với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: Plan active của tuần/ngày hiện tại; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0223"></a>

### API-0223

**Chức năng:** GET /api/v1/meal-plans/current

**Module:** Meal plan · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 224 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Meal plan; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Plan active của tuần/ngày hiện tại.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi GET /api/v1/meal-plans/current không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0224"></a>

### API-0224

**Chức năng:** GET /api/v1/meal-plans/current

**Module:** Meal plan · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 225 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Meal plan; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Plan active của tuần/ngày hiện tại.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/meal-plans/current với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0225"></a>

### API-0225

**Chức năng:** GET /api/v1/meal-plans/:id

**Module:** Meal plan · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 226 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Meal plan; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Chi tiết.
```

**Dữ liệu test:**

```text
PLAN_A tuần 2026-10-05; meals: RECIPE_A, servings=2; proposalId=PROPOSAL_A nếu confirm
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/meal-plans/:id với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: Chi tiết; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0226"></a>

### API-0226

**Chức năng:** GET /api/v1/meal-plans/:id

**Module:** Meal plan · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 227 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Meal plan; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Chi tiết.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi GET /api/v1/meal-plans/:id không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0227"></a>

### API-0227

**Chức năng:** GET /api/v1/meal-plans/:id

**Module:** Meal plan · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 228 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Meal plan; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Chi tiết.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/meal-plans/:id với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0228"></a>

### API-0228

**Chức năng:** GET /api/v1/meal-plans/:id

**Module:** Meal plan · **Loại:** Cross-user access · **Ưu tiên:** P0 · **Actor:** User B

**Nguồn Excel:** API Cases, hàng 229 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Target thuộc User A; User B có token hợp lệ
```

**Dữ liệu test:**

```text
PLAN_A (không thuộc B) tuần 2026-10-05; meals: RECIPE_A (không thuộc B), servings=2; proposalId=PROPOSAL_A (không thuộc B) nếu confirm
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/meal-plans/:id với ID của User A và token B.
2. Kiểm tra response/DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403 hoặc 404 theo chính sách chống dò ID; không lộ dữ liệu A; không mutation.
```

<a id="api-0229"></a>

### API-0229

**Chức năng:** GET /api/v1/meal-plans/:id

**Module:** Meal plan · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 230 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/meal-plans/:id với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0230"></a>

### API-0230

**Chức năng:** POST /api/v1/meal-plans

**Module:** Meal plan · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 231 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Meal plan; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Tạo plan thủ công.
```

**Dữ liệu test:**

```text
PLAN_A tuần 2026-10-05; meals: RECIPE_A, servings=2; proposalId=PROPOSAL_A nếu confirm
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi POST /api/v1/meal-plans với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Tạo plan thủ công; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0231"></a>

### API-0231

**Chức năng:** POST /api/v1/meal-plans

**Module:** Meal plan · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 232 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Meal plan; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Tạo plan thủ công.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi POST /api/v1/meal-plans không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0232"></a>

### API-0232

**Chức năng:** POST /api/v1/meal-plans

**Module:** Meal plan · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 233 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Meal plan; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Tạo plan thủ công.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/meal-plans với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0233"></a>

### API-0233

**Chức năng:** POST /api/v1/meal-plans

**Module:** Meal plan · **Loại:** Invalid payload · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 234 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Meal plan; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Tạo plan thủ công.
```

**Dữ liệu test:**

```text
Body chứa field bắt buộc rỗng/sai type; PATCH={} hoặc score=6/quantity=-1 khi áp dụng
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/meal-plans với body sai schema.
2. Đối chiếu field error.
3. Xác minh DB giữ nguyên.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 400 VALIDATION_ERROR; details chỉ rõ field; không lưu dữ liệu sai.
```

<a id="api-0234"></a>

### API-0234

**Chức năng:** PATCH /api/v1/meal-plans/:id

**Module:** Meal plan · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 235 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Meal plan; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Sửa metadata/status cho phép.
```

**Dữ liệu test:**

```text
PLAN_A tuần 2026-10-05; meals: RECIPE_A, servings=2; proposalId=PROPOSAL_A nếu confirm
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi PATCH /api/v1/meal-plans/:id với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Sửa metadata/status cho phép; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0235"></a>

### API-0235

**Chức năng:** PATCH /api/v1/meal-plans/:id

**Module:** Meal plan · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 236 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Meal plan; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Sửa metadata/status cho phép.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi PATCH /api/v1/meal-plans/:id không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0236"></a>

### API-0236

**Chức năng:** PATCH /api/v1/meal-plans/:id

**Module:** Meal plan · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 237 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Meal plan; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Sửa metadata/status cho phép.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/meal-plans/:id với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0237"></a>

### API-0237

**Chức năng:** PATCH /api/v1/meal-plans/:id

**Module:** Meal plan · **Loại:** Cross-user access · **Ưu tiên:** P0 · **Actor:** User B

**Nguồn Excel:** API Cases, hàng 238 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Target thuộc User A; User B có token hợp lệ
```

**Dữ liệu test:**

```text
PLAN_A (không thuộc B) tuần 2026-10-05; meals: RECIPE_A (không thuộc B), servings=2; proposalId=PROPOSAL_A (không thuộc B) nếu confirm
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/meal-plans/:id với ID của User A và token B.
2. Kiểm tra response/DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403 hoặc 404 theo chính sách chống dò ID; không lộ dữ liệu A; không mutation.
```

<a id="api-0238"></a>

### API-0238

**Chức năng:** PATCH /api/v1/meal-plans/:id

**Module:** Meal plan · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 239 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/meal-plans/:id với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0239"></a>

### API-0239

**Chức năng:** PATCH /api/v1/meal-plans/:id

**Module:** Meal plan · **Loại:** Invalid payload · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 240 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Meal plan; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Sửa metadata/status cho phép.
```

**Dữ liệu test:**

```text
Body chứa field bắt buộc rỗng/sai type; PATCH={} hoặc score=6/quantity=-1 khi áp dụng
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/meal-plans/:id với body sai schema.
2. Đối chiếu field error.
3. Xác minh DB giữ nguyên.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 400 VALIDATION_ERROR; details chỉ rõ field; không lưu dữ liệu sai.
```

<a id="api-0240"></a>

### API-0240

**Chức năng:** DELETE /api/v1/meal-plans/:id

**Module:** Meal plan · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 241 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Meal plan; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Archive/delete hợp lệ.
```

**Dữ liệu test:**

```text
PLAN_A tuần 2026-10-05; meals: RECIPE_A, servings=2; proposalId=PROPOSAL_A nếu confirm
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi DELETE /api/v1/meal-plans/:id với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Archive/delete hợp lệ; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0241"></a>

### API-0241

**Chức năng:** DELETE /api/v1/meal-plans/:id

**Module:** Meal plan · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 242 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Meal plan; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Archive/delete hợp lệ.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi DELETE /api/v1/meal-plans/:id không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0242"></a>

### API-0242

**Chức năng:** DELETE /api/v1/meal-plans/:id

**Module:** Meal plan · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 243 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Meal plan; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Archive/delete hợp lệ.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi DELETE /api/v1/meal-plans/:id với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0243"></a>

### API-0243

**Chức năng:** DELETE /api/v1/meal-plans/:id

**Module:** Meal plan · **Loại:** Cross-user access · **Ưu tiên:** P0 · **Actor:** User B

**Nguồn Excel:** API Cases, hàng 244 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Target thuộc User A; User B có token hợp lệ
```

**Dữ liệu test:**

```text
PLAN_A (không thuộc B) tuần 2026-10-05; meals: RECIPE_A (không thuộc B), servings=2; proposalId=PROPOSAL_A (không thuộc B) nếu confirm
```

**Các bước thực hiện:**

```text
1. Gửi DELETE /api/v1/meal-plans/:id với ID của User A và token B.
2. Kiểm tra response/DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403 hoặc 404 theo chính sách chống dò ID; không lộ dữ liệu A; không mutation.
```

<a id="api-0244"></a>

### API-0244

**Chức năng:** DELETE /api/v1/meal-plans/:id

**Module:** Meal plan · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 245 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi DELETE /api/v1/meal-plans/:id với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0245"></a>

### API-0245

**Chức năng:** POST /api/v1/meal-plans/:id/meals

**Module:** Meal plan · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 246 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Meal plan; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Thêm meal.
```

**Dữ liệu test:**

```text
PLAN_A tuần 2026-10-05; meals: RECIPE_A, servings=2; proposalId=PROPOSAL_A nếu confirm
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi POST /api/v1/meal-plans/:id/meals với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Thêm meal; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0246"></a>

### API-0246

**Chức năng:** POST /api/v1/meal-plans/:id/meals

**Module:** Meal plan · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 247 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Meal plan; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Thêm meal.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi POST /api/v1/meal-plans/:id/meals không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0247"></a>

### API-0247

**Chức năng:** POST /api/v1/meal-plans/:id/meals

**Module:** Meal plan · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 248 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Meal plan; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Thêm meal.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/meal-plans/:id/meals với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0248"></a>

### API-0248

**Chức năng:** POST /api/v1/meal-plans/:id/meals

**Module:** Meal plan · **Loại:** Cross-user access · **Ưu tiên:** P0 · **Actor:** User B

**Nguồn Excel:** API Cases, hàng 249 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Target thuộc User A; User B có token hợp lệ
```

**Dữ liệu test:**

```text
PLAN_A (không thuộc B) tuần 2026-10-05; meals: RECIPE_A (không thuộc B), servings=2; proposalId=PROPOSAL_A (không thuộc B) nếu confirm
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/meal-plans/:id/meals với ID của User A và token B.
2. Kiểm tra response/DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403 hoặc 404 theo chính sách chống dò ID; không lộ dữ liệu A; không mutation.
```

<a id="api-0249"></a>

### API-0249

**Chức năng:** POST /api/v1/meal-plans/:id/meals

**Module:** Meal plan · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 250 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/meal-plans/:id/meals với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0250"></a>

### API-0250

**Chức năng:** POST /api/v1/meal-plans/:id/meals

**Module:** Meal plan · **Loại:** Invalid payload · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 251 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Meal plan; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Thêm meal.
```

**Dữ liệu test:**

```text
Body chứa field bắt buộc rỗng/sai type; PATCH={} hoặc score=6/quantity=-1 khi áp dụng
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/meal-plans/:id/meals với body sai schema.
2. Đối chiếu field error.
3. Xác minh DB giữ nguyên.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 400 VALIDATION_ERROR; details chỉ rõ field; không lưu dữ liệu sai.
```

<a id="api-0251"></a>

### API-0251

**Chức năng:** PATCH /api/v1/meal-plans/:id/meals/:mealId

**Module:** Meal plan · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 252 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Meal plan; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Sửa meal/completed.
```

**Dữ liệu test:**

```text
PLAN_A tuần 2026-10-05; meals: RECIPE_A, servings=2; proposalId=PROPOSAL_A nếu confirm
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi PATCH /api/v1/meal-plans/:id/meals/:mealId với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Sửa meal/completed; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0252"></a>

### API-0252

**Chức năng:** PATCH /api/v1/meal-plans/:id/meals/:mealId

**Module:** Meal plan · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 253 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Meal plan; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Sửa meal/completed.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi PATCH /api/v1/meal-plans/:id/meals/:mealId không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0253"></a>

### API-0253

**Chức năng:** PATCH /api/v1/meal-plans/:id/meals/:mealId

**Module:** Meal plan · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 254 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Meal plan; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Sửa meal/completed.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/meal-plans/:id/meals/:mealId với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0254"></a>

### API-0254

**Chức năng:** PATCH /api/v1/meal-plans/:id/meals/:mealId

**Module:** Meal plan · **Loại:** Cross-user access · **Ưu tiên:** P0 · **Actor:** User B

**Nguồn Excel:** API Cases, hàng 255 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Target thuộc User A; User B có token hợp lệ
```

**Dữ liệu test:**

```text
PLAN_A (không thuộc B) tuần 2026-10-05; meals: RECIPE_A (không thuộc B), servings=2; proposalId=PROPOSAL_A (không thuộc B) nếu confirm
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/meal-plans/:id/meals/:mealId với ID của User A và token B.
2. Kiểm tra response/DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403 hoặc 404 theo chính sách chống dò ID; không lộ dữ liệu A; không mutation.
```

<a id="api-0255"></a>

### API-0255

**Chức năng:** PATCH /api/v1/meal-plans/:id/meals/:mealId

**Module:** Meal plan · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 256 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/meal-plans/:id/meals/:mealId với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0256"></a>

### API-0256

**Chức năng:** PATCH /api/v1/meal-plans/:id/meals/:mealId

**Module:** Meal plan · **Loại:** Invalid payload · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 257 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Meal plan; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Sửa meal/completed.
```

**Dữ liệu test:**

```text
Body chứa field bắt buộc rỗng/sai type; PATCH={} hoặc score=6/quantity=-1 khi áp dụng
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/meal-plans/:id/meals/:mealId với body sai schema.
2. Đối chiếu field error.
3. Xác minh DB giữ nguyên.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 400 VALIDATION_ERROR; details chỉ rõ field; không lưu dữ liệu sai.
```

<a id="api-0257"></a>

### API-0257

**Chức năng:** DELETE /api/v1/meal-plans/:id/meals/:mealId

**Module:** Meal plan · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 258 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Meal plan; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Xóa meal.
```

**Dữ liệu test:**

```text
PLAN_A tuần 2026-10-05; meals: RECIPE_A, servings=2; proposalId=PROPOSAL_A nếu confirm
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi DELETE /api/v1/meal-plans/:id/meals/:mealId với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Xóa meal; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0258"></a>

### API-0258

**Chức năng:** DELETE /api/v1/meal-plans/:id/meals/:mealId

**Module:** Meal plan · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 259 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Meal plan; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Xóa meal.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi DELETE /api/v1/meal-plans/:id/meals/:mealId không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0259"></a>

### API-0259

**Chức năng:** DELETE /api/v1/meal-plans/:id/meals/:mealId

**Module:** Meal plan · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 260 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Meal plan; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Xóa meal.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi DELETE /api/v1/meal-plans/:id/meals/:mealId với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0260"></a>

### API-0260

**Chức năng:** DELETE /api/v1/meal-plans/:id/meals/:mealId

**Module:** Meal plan · **Loại:** Cross-user access · **Ưu tiên:** P0 · **Actor:** User B

**Nguồn Excel:** API Cases, hàng 261 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Target thuộc User A; User B có token hợp lệ
```

**Dữ liệu test:**

```text
PLAN_A (không thuộc B) tuần 2026-10-05; meals: RECIPE_A (không thuộc B), servings=2; proposalId=PROPOSAL_A (không thuộc B) nếu confirm
```

**Các bước thực hiện:**

```text
1. Gửi DELETE /api/v1/meal-plans/:id/meals/:mealId với ID của User A và token B.
2. Kiểm tra response/DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403 hoặc 404 theo chính sách chống dò ID; không lộ dữ liệu A; không mutation.
```

<a id="api-0261"></a>

### API-0261

**Chức năng:** DELETE /api/v1/meal-plans/:id/meals/:mealId

**Module:** Meal plan · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 262 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi DELETE /api/v1/meal-plans/:id/meals/:mealId với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0262"></a>

### API-0262

**Chức năng:** POST /api/v1/meal-plans/:id/activate

**Module:** Meal plan · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 263 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Meal plan; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Kích hoạt plan, đảm bảo quy tắc một active plan/tuần.
```

**Dữ liệu test:**

```text
PLAN_A tuần 2026-10-05; meals: RECIPE_A, servings=2; proposalId=PROPOSAL_A nếu confirm
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi POST /api/v1/meal-plans/:id/activate với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Kích hoạt plan, đảm bảo quy tắc một active plan/tuần; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0263"></a>

### API-0263

**Chức năng:** POST /api/v1/meal-plans/:id/activate

**Module:** Meal plan · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 264 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Meal plan; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Kích hoạt plan, đảm bảo quy tắc một active plan/tuần.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi POST /api/v1/meal-plans/:id/activate không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0264"></a>

### API-0264

**Chức năng:** POST /api/v1/meal-plans/:id/activate

**Module:** Meal plan · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 265 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Meal plan; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Kích hoạt plan, đảm bảo quy tắc một active plan/tuần.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/meal-plans/:id/activate với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0265"></a>

### API-0265

**Chức năng:** POST /api/v1/meal-plans/:id/activate

**Module:** Meal plan · **Loại:** Cross-user access · **Ưu tiên:** P0 · **Actor:** User B

**Nguồn Excel:** API Cases, hàng 266 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Target thuộc User A; User B có token hợp lệ
```

**Dữ liệu test:**

```text
PLAN_A (không thuộc B) tuần 2026-10-05; meals: RECIPE_A (không thuộc B), servings=2; proposalId=PROPOSAL_A (không thuộc B) nếu confirm
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/meal-plans/:id/activate với ID của User A và token B.
2. Kiểm tra response/DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403 hoặc 404 theo chính sách chống dò ID; không lộ dữ liệu A; không mutation.
```

<a id="api-0266"></a>

### API-0266

**Chức năng:** POST /api/v1/meal-plans/:id/activate

**Module:** Meal plan · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 267 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/meal-plans/:id/activate với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0267"></a>

### API-0267

**Chức năng:** POST /api/v1/meal-plans/:id/clone

**Module:** Meal plan · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 268 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Meal plan; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Sao chép sang tuần khác và tạo draft.
```

**Dữ liệu test:**

```text
PLAN_A tuần 2026-10-05; meals: RECIPE_A, servings=2; proposalId=PROPOSAL_A nếu confirm
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi POST /api/v1/meal-plans/:id/clone với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Sao chép sang tuần khác và tạo draft; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0268"></a>

### API-0268

**Chức năng:** POST /api/v1/meal-plans/:id/clone

**Module:** Meal plan · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 269 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Meal plan; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Sao chép sang tuần khác và tạo draft.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi POST /api/v1/meal-plans/:id/clone không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0269"></a>

### API-0269

**Chức năng:** POST /api/v1/meal-plans/:id/clone

**Module:** Meal plan · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 270 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Meal plan; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Sao chép sang tuần khác và tạo draft.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/meal-plans/:id/clone với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0270"></a>

### API-0270

**Chức năng:** POST /api/v1/meal-plans/:id/clone

**Module:** Meal plan · **Loại:** Cross-user access · **Ưu tiên:** P0 · **Actor:** User B

**Nguồn Excel:** API Cases, hàng 271 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Target thuộc User A; User B có token hợp lệ
```

**Dữ liệu test:**

```text
PLAN_A (không thuộc B) tuần 2026-10-05; meals: RECIPE_A (không thuộc B), servings=2; proposalId=PROPOSAL_A (không thuộc B) nếu confirm
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/meal-plans/:id/clone với ID của User A và token B.
2. Kiểm tra response/DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403 hoặc 404 theo chính sách chống dò ID; không lộ dữ liệu A; không mutation.
```

<a id="api-0271"></a>

### API-0271

**Chức năng:** POST /api/v1/meal-plans/:id/clone

**Module:** Meal plan · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 272 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/meal-plans/:id/clone với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0272"></a>

### API-0272

**Chức năng:** POST /api/v1/meal-plans/:id/grocery-list

**Module:** Meal plan · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 273 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Meal plan; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Sinh grocery list từ plan.
```

**Dữ liệu test:**

```text
PLAN_A tuần 2026-10-05; meals: RECIPE_A, servings=2; proposalId=PROPOSAL_A nếu confirm
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi POST /api/v1/meal-plans/:id/grocery-list với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Sinh grocery list từ plan; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0273"></a>

### API-0273

**Chức năng:** POST /api/v1/meal-plans/:id/grocery-list

**Module:** Meal plan · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 274 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Meal plan; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Sinh grocery list từ plan.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi POST /api/v1/meal-plans/:id/grocery-list không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0274"></a>

### API-0274

**Chức năng:** POST /api/v1/meal-plans/:id/grocery-list

**Module:** Meal plan · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 275 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Meal plan; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Sinh grocery list từ plan.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/meal-plans/:id/grocery-list với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0275"></a>

### API-0275

**Chức năng:** POST /api/v1/meal-plans/:id/grocery-list

**Module:** Meal plan · **Loại:** Cross-user access · **Ưu tiên:** P0 · **Actor:** User B

**Nguồn Excel:** API Cases, hàng 276 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Target thuộc User A; User B có token hợp lệ
```

**Dữ liệu test:**

```text
PLAN_A (không thuộc B) tuần 2026-10-05; meals: RECIPE_A (không thuộc B), servings=2; proposalId=PROPOSAL_A (không thuộc B) nếu confirm
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/meal-plans/:id/grocery-list với ID của User A và token B.
2. Kiểm tra response/DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403 hoặc 404 theo chính sách chống dò ID; không lộ dữ liệu A; không mutation.
```

<a id="api-0276"></a>

### API-0276

**Chức năng:** POST /api/v1/meal-plans/:id/grocery-list

**Module:** Meal plan · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 277 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/meal-plans/:id/grocery-list với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="module-9"></a>

## Grocery list

| ID                    | Chức năng / endpoint                           | Loại test         | Ưu tiên | Actor  | Kết quả chạy |
| --------------------- | ---------------------------------------------- | ----------------- | ------- | ------ | ------------ |
| [API-0277](#api-0277) | GET /api/v1/grocery-lists                      | Happy path        | P1      | User A | Đạt          |
| [API-0278](#api-0278) | GET /api/v1/grocery-lists                      | Missing auth      | P0      | Guest  | Đạt          |
| [API-0279](#api-0279) | GET /api/v1/grocery-lists                      | Invalid auth      | P0      | User A | Đạt          |
| [API-0280](#api-0280) | GET /api/v1/grocery-lists                      | Empty result      | P2      | User A | Đạt          |
| [API-0281](#api-0281) | GET /api/v1/grocery-lists/:id                  | Happy path        | P1      | User A | Đạt          |
| [API-0282](#api-0282) | GET /api/v1/grocery-lists/:id                  | Missing auth      | P0      | Guest  | Đạt          |
| [API-0283](#api-0283) | GET /api/v1/grocery-lists/:id                  | Invalid auth      | P0      | User A | Đạt          |
| [API-0284](#api-0284) | GET /api/v1/grocery-lists/:id                  | Cross-user access | P0      | User B | Đạt          |
| [API-0285](#api-0285) | GET /api/v1/grocery-lists/:id                  | Missing target    | P1      | User A | Đạt          |
| [API-0286](#api-0286) | POST /api/v1/grocery-lists                     | Happy path        | P1      | User A | Đạt          |
| [API-0287](#api-0287) | POST /api/v1/grocery-lists                     | Missing auth      | P0      | Guest  | Đạt          |
| [API-0288](#api-0288) | POST /api/v1/grocery-lists                     | Invalid auth      | P0      | User A | Đạt          |
| [API-0289](#api-0289) | PATCH /api/v1/grocery-lists/:id                | Happy path        | P1      | User A | Đạt          |
| [API-0290](#api-0290) | PATCH /api/v1/grocery-lists/:id                | Missing auth      | P0      | Guest  | Đạt          |
| [API-0291](#api-0291) | PATCH /api/v1/grocery-lists/:id                | Invalid auth      | P0      | User A | Đạt          |
| [API-0292](#api-0292) | PATCH /api/v1/grocery-lists/:id                | Cross-user access | P0      | User B | Đạt          |
| [API-0293](#api-0293) | PATCH /api/v1/grocery-lists/:id                | Missing target    | P1      | User A | Đạt          |
| [API-0294](#api-0294) | DELETE /api/v1/grocery-lists/:id               | Happy path        | P1      | User A | Đạt          |
| [API-0295](#api-0295) | DELETE /api/v1/grocery-lists/:id               | Missing auth      | P0      | Guest  | Đạt          |
| [API-0296](#api-0296) | DELETE /api/v1/grocery-lists/:id               | Invalid auth      | P0      | User A | Đạt          |
| [API-0297](#api-0297) | DELETE /api/v1/grocery-lists/:id               | Cross-user access | P0      | User B | Đạt          |
| [API-0298](#api-0298) | DELETE /api/v1/grocery-lists/:id               | Missing target    | P1      | User A | Đạt          |
| [API-0299](#api-0299) | POST /api/v1/grocery-lists/:id/items           | Happy path        | P1      | User A | Đạt          |
| [API-0300](#api-0300) | POST /api/v1/grocery-lists/:id/items           | Missing auth      | P0      | Guest  | Đạt          |
| [API-0301](#api-0301) | POST /api/v1/grocery-lists/:id/items           | Invalid auth      | P0      | User A | Đạt          |
| [API-0302](#api-0302) | POST /api/v1/grocery-lists/:id/items           | Cross-user access | P0      | User B | Đạt          |
| [API-0303](#api-0303) | POST /api/v1/grocery-lists/:id/items           | Missing target    | P1      | User A | Đạt          |
| [API-0304](#api-0304) | PATCH /api/v1/grocery-lists/:id/items/:itemId  | Happy path        | P1      | User A | Đạt          |
| [API-0305](#api-0305) | PATCH /api/v1/grocery-lists/:id/items/:itemId  | Missing auth      | P0      | Guest  | Đạt          |
| [API-0306](#api-0306) | PATCH /api/v1/grocery-lists/:id/items/:itemId  | Invalid auth      | P0      | User A | Đạt          |
| [API-0307](#api-0307) | PATCH /api/v1/grocery-lists/:id/items/:itemId  | Cross-user access | P0      | User B | Đạt          |
| [API-0308](#api-0308) | PATCH /api/v1/grocery-lists/:id/items/:itemId  | Missing target    | P1      | User A | Đạt          |
| [API-0309](#api-0309) | DELETE /api/v1/grocery-lists/:id/items/:itemId | Happy path        | P1      | User A | Đạt          |
| [API-0310](#api-0310) | DELETE /api/v1/grocery-lists/:id/items/:itemId | Missing auth      | P0      | Guest  | Đạt          |
| [API-0311](#api-0311) | DELETE /api/v1/grocery-lists/:id/items/:itemId | Invalid auth      | P0      | User A | Đạt          |
| [API-0312](#api-0312) | DELETE /api/v1/grocery-lists/:id/items/:itemId | Cross-user access | P0      | User B | Đạt          |
| [API-0313](#api-0313) | DELETE /api/v1/grocery-lists/:id/items/:itemId | Missing target    | P1      | User A | Đạt          |
| [API-0314](#api-0314) | POST /api/v1/grocery-lists/:id/clear-checked   | Happy path        | P1      | User A | Đạt          |
| [API-0315](#api-0315) | POST /api/v1/grocery-lists/:id/clear-checked   | Missing auth      | P0      | Guest  | Đạt          |
| [API-0316](#api-0316) | POST /api/v1/grocery-lists/:id/clear-checked   | Invalid auth      | P0      | User A | Đạt          |
| [API-0317](#api-0317) | POST /api/v1/grocery-lists/:id/clear-checked   | Cross-user access | P0      | User B | Đạt          |
| [API-0318](#api-0318) | POST /api/v1/grocery-lists/:id/clear-checked   | Missing target    | P1      | User A | Đạt          |

<a id="api-0277"></a>

### API-0277

**Chức năng:** GET /api/v1/grocery-lists

**Module:** Grocery list · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 278 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Grocery list; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Danh sách.
```

**Dữ liệu test:**

```text
LIST_A; foodItemId=FOOD_TOFU,quantity=200,unit=g,checked=true khi check
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/grocery-lists với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: Danh sách; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0278"></a>

### API-0278

**Chức năng:** GET /api/v1/grocery-lists

**Module:** Grocery list · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 279 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Grocery list; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Danh sách.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi GET /api/v1/grocery-lists không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0279"></a>

### API-0279

**Chức năng:** GET /api/v1/grocery-lists

**Module:** Grocery list · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 280 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Grocery list; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Danh sách.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/grocery-lists với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0280"></a>

### API-0280

**Chức năng:** GET /api/v1/grocery-lists

**Module:** Grocery list · **Loại:** Empty result · **Ưu tiên:** P2 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 281 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Không có dữ liệu khớp filter hoặc user mới
```

**Dữ liệu test:**

```text
Filter hợp lệ không có kết quả
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/grocery-lists với filter rỗng kết quả.
2. Kiểm tra payload.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; list rỗng/tổng bằng 0 đúng schema; không lỗi 500 hoặc dữ liệu user khác.
```

<a id="api-0281"></a>

### API-0281

**Chức năng:** GET /api/v1/grocery-lists/:id

**Module:** Grocery list · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 282 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Grocery list; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Chi tiết.
```

**Dữ liệu test:**

```text
LIST_A; foodItemId=FOOD_TOFU,quantity=200,unit=g,checked=true khi check
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/grocery-lists/:id với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: Chi tiết; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0282"></a>

### API-0282

**Chức năng:** GET /api/v1/grocery-lists/:id

**Module:** Grocery list · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 283 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Grocery list; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Chi tiết.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi GET /api/v1/grocery-lists/:id không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0283"></a>

### API-0283

**Chức năng:** GET /api/v1/grocery-lists/:id

**Module:** Grocery list · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 284 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Grocery list; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Chi tiết.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/grocery-lists/:id với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0284"></a>

### API-0284

**Chức năng:** GET /api/v1/grocery-lists/:id

**Module:** Grocery list · **Loại:** Cross-user access · **Ưu tiên:** P0 · **Actor:** User B

**Nguồn Excel:** API Cases, hàng 285 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Target thuộc User A; User B có token hợp lệ
```

**Dữ liệu test:**

```text
LIST_A (không thuộc B); foodItemId=FOOD_TOFU,quantity=200,unit=g,checked=true khi check
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/grocery-lists/:id với ID của User A và token B.
2. Kiểm tra response/DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403 hoặc 404 theo chính sách chống dò ID; không lộ dữ liệu A; không mutation.
```

<a id="api-0285"></a>

### API-0285

**Chức năng:** GET /api/v1/grocery-lists/:id

**Module:** Grocery list · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 286 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/grocery-lists/:id với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0286"></a>

### API-0286

**Chức năng:** POST /api/v1/grocery-lists

**Module:** Grocery list · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 287 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Grocery list; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Tạo thủ công.
```

**Dữ liệu test:**

```text
LIST_A; foodItemId=FOOD_TOFU,quantity=200,unit=g,checked=true khi check
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi POST /api/v1/grocery-lists với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Tạo thủ công; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0287"></a>

### API-0287

**Chức năng:** POST /api/v1/grocery-lists

**Module:** Grocery list · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 288 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Grocery list; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Tạo thủ công.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi POST /api/v1/grocery-lists không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0288"></a>

### API-0288

**Chức năng:** POST /api/v1/grocery-lists

**Module:** Grocery list · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 289 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Grocery list; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Tạo thủ công.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/grocery-lists với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0289"></a>

### API-0289

**Chức năng:** PATCH /api/v1/grocery-lists/:id

**Module:** Grocery list · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 290 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Grocery list; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Đổi tên/status.
```

**Dữ liệu test:**

```text
LIST_A; foodItemId=FOOD_TOFU,quantity=200,unit=g,checked=true khi check
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi PATCH /api/v1/grocery-lists/:id với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Đổi tên/status; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0290"></a>

### API-0290

**Chức năng:** PATCH /api/v1/grocery-lists/:id

**Module:** Grocery list · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 291 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Grocery list; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Đổi tên/status.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi PATCH /api/v1/grocery-lists/:id không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0291"></a>

### API-0291

**Chức năng:** PATCH /api/v1/grocery-lists/:id

**Module:** Grocery list · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 292 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Grocery list; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Đổi tên/status.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/grocery-lists/:id với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0292"></a>

### API-0292

**Chức năng:** PATCH /api/v1/grocery-lists/:id

**Module:** Grocery list · **Loại:** Cross-user access · **Ưu tiên:** P0 · **Actor:** User B

**Nguồn Excel:** API Cases, hàng 293 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Target thuộc User A; User B có token hợp lệ
```

**Dữ liệu test:**

```text
LIST_A (không thuộc B); foodItemId=FOOD_TOFU,quantity=200,unit=g,checked=true khi check
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/grocery-lists/:id với ID của User A và token B.
2. Kiểm tra response/DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403 hoặc 404 theo chính sách chống dò ID; không lộ dữ liệu A; không mutation.
```

<a id="api-0293"></a>

### API-0293

**Chức năng:** PATCH /api/v1/grocery-lists/:id

**Module:** Grocery list · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 294 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/grocery-lists/:id với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0294"></a>

### API-0294

**Chức năng:** DELETE /api/v1/grocery-lists/:id

**Module:** Grocery list · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 295 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Grocery list; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Archive/delete.
```

**Dữ liệu test:**

```text
LIST_A; foodItemId=FOOD_TOFU,quantity=200,unit=g,checked=true khi check
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi DELETE /api/v1/grocery-lists/:id với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Archive/delete; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0295"></a>

### API-0295

**Chức năng:** DELETE /api/v1/grocery-lists/:id

**Module:** Grocery list · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 296 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Grocery list; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Archive/delete.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi DELETE /api/v1/grocery-lists/:id không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0296"></a>

### API-0296

**Chức năng:** DELETE /api/v1/grocery-lists/:id

**Module:** Grocery list · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 297 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Grocery list; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Archive/delete.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi DELETE /api/v1/grocery-lists/:id với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0297"></a>

### API-0297

**Chức năng:** DELETE /api/v1/grocery-lists/:id

**Module:** Grocery list · **Loại:** Cross-user access · **Ưu tiên:** P0 · **Actor:** User B

**Nguồn Excel:** API Cases, hàng 298 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Target thuộc User A; User B có token hợp lệ
```

**Dữ liệu test:**

```text
LIST_A (không thuộc B); foodItemId=FOOD_TOFU,quantity=200,unit=g,checked=true khi check
```

**Các bước thực hiện:**

```text
1. Gửi DELETE /api/v1/grocery-lists/:id với ID của User A và token B.
2. Kiểm tra response/DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403 hoặc 404 theo chính sách chống dò ID; không lộ dữ liệu A; không mutation.
```

<a id="api-0298"></a>

### API-0298

**Chức năng:** DELETE /api/v1/grocery-lists/:id

**Module:** Grocery list · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 299 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi DELETE /api/v1/grocery-lists/:id với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0299"></a>

### API-0299

**Chức năng:** POST /api/v1/grocery-lists/:id/items

**Module:** Grocery list · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 300 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Grocery list; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Thêm item.
```

**Dữ liệu test:**

```text
LIST_A; foodItemId=FOOD_TOFU,quantity=200,unit=g,checked=true khi check
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi POST /api/v1/grocery-lists/:id/items với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Thêm item; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0300"></a>

### API-0300

**Chức năng:** POST /api/v1/grocery-lists/:id/items

**Module:** Grocery list · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 301 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Grocery list; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Thêm item.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi POST /api/v1/grocery-lists/:id/items không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0301"></a>

### API-0301

**Chức năng:** POST /api/v1/grocery-lists/:id/items

**Module:** Grocery list · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 302 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Grocery list; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Thêm item.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/grocery-lists/:id/items với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0302"></a>

### API-0302

**Chức năng:** POST /api/v1/grocery-lists/:id/items

**Module:** Grocery list · **Loại:** Cross-user access · **Ưu tiên:** P0 · **Actor:** User B

**Nguồn Excel:** API Cases, hàng 303 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Target thuộc User A; User B có token hợp lệ
```

**Dữ liệu test:**

```text
LIST_A (không thuộc B); foodItemId=FOOD_TOFU,quantity=200,unit=g,checked=true khi check
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/grocery-lists/:id/items với ID của User A và token B.
2. Kiểm tra response/DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403 hoặc 404 theo chính sách chống dò ID; không lộ dữ liệu A; không mutation.
```

<a id="api-0303"></a>

### API-0303

**Chức năng:** POST /api/v1/grocery-lists/:id/items

**Module:** Grocery list · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 304 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/grocery-lists/:id/items với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0304"></a>

### API-0304

**Chức năng:** PATCH /api/v1/grocery-lists/:id/items/:itemId

**Module:** Grocery list · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 305 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Grocery list; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Sửa/check item.
```

**Dữ liệu test:**

```text
LIST_A; foodItemId=FOOD_TOFU,quantity=200,unit=g,checked=true khi check
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi PATCH /api/v1/grocery-lists/:id/items/:itemId với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Sửa/check item; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0305"></a>

### API-0305

**Chức năng:** PATCH /api/v1/grocery-lists/:id/items/:itemId

**Module:** Grocery list · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 306 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Grocery list; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Sửa/check item.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi PATCH /api/v1/grocery-lists/:id/items/:itemId không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0306"></a>

### API-0306

**Chức năng:** PATCH /api/v1/grocery-lists/:id/items/:itemId

**Module:** Grocery list · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 307 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Grocery list; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Sửa/check item.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/grocery-lists/:id/items/:itemId với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0307"></a>

### API-0307

**Chức năng:** PATCH /api/v1/grocery-lists/:id/items/:itemId

**Module:** Grocery list · **Loại:** Cross-user access · **Ưu tiên:** P0 · **Actor:** User B

**Nguồn Excel:** API Cases, hàng 308 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Target thuộc User A; User B có token hợp lệ
```

**Dữ liệu test:**

```text
LIST_A (không thuộc B); foodItemId=FOOD_TOFU,quantity=200,unit=g,checked=true khi check
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/grocery-lists/:id/items/:itemId với ID của User A và token B.
2. Kiểm tra response/DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403 hoặc 404 theo chính sách chống dò ID; không lộ dữ liệu A; không mutation.
```

<a id="api-0308"></a>

### API-0308

**Chức năng:** PATCH /api/v1/grocery-lists/:id/items/:itemId

**Module:** Grocery list · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 309 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/grocery-lists/:id/items/:itemId với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0309"></a>

### API-0309

**Chức năng:** DELETE /api/v1/grocery-lists/:id/items/:itemId

**Module:** Grocery list · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 310 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Grocery list; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Xóa item.
```

**Dữ liệu test:**

```text
LIST_A; foodItemId=FOOD_TOFU,quantity=200,unit=g,checked=true khi check
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi DELETE /api/v1/grocery-lists/:id/items/:itemId với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Xóa item; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0310"></a>

### API-0310

**Chức năng:** DELETE /api/v1/grocery-lists/:id/items/:itemId

**Module:** Grocery list · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 311 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Grocery list; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Xóa item.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi DELETE /api/v1/grocery-lists/:id/items/:itemId không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0311"></a>

### API-0311

**Chức năng:** DELETE /api/v1/grocery-lists/:id/items/:itemId

**Module:** Grocery list · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 312 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Grocery list; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Xóa item.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi DELETE /api/v1/grocery-lists/:id/items/:itemId với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0312"></a>

### API-0312

**Chức năng:** DELETE /api/v1/grocery-lists/:id/items/:itemId

**Module:** Grocery list · **Loại:** Cross-user access · **Ưu tiên:** P0 · **Actor:** User B

**Nguồn Excel:** API Cases, hàng 313 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Target thuộc User A; User B có token hợp lệ
```

**Dữ liệu test:**

```text
LIST_A (không thuộc B); foodItemId=FOOD_TOFU,quantity=200,unit=g,checked=true khi check
```

**Các bước thực hiện:**

```text
1. Gửi DELETE /api/v1/grocery-lists/:id/items/:itemId với ID của User A và token B.
2. Kiểm tra response/DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403 hoặc 404 theo chính sách chống dò ID; không lộ dữ liệu A; không mutation.
```

<a id="api-0313"></a>

### API-0313

**Chức năng:** DELETE /api/v1/grocery-lists/:id/items/:itemId

**Module:** Grocery list · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 314 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi DELETE /api/v1/grocery-lists/:id/items/:itemId với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0314"></a>

### API-0314

**Chức năng:** POST /api/v1/grocery-lists/:id/clear-checked

**Module:** Grocery list · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 315 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Grocery list; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Xóa/archive các item đã chọn theo cách idempotent.
```

**Dữ liệu test:**

```text
LIST_A; foodItemId=FOOD_TOFU,quantity=200,unit=g,checked=true khi check
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi POST /api/v1/grocery-lists/:id/clear-checked với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Xóa/archive các item đã chọn theo cách idempotent; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0315"></a>

### API-0315

**Chức năng:** POST /api/v1/grocery-lists/:id/clear-checked

**Module:** Grocery list · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 316 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Grocery list; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Xóa/archive các item đã chọn theo cách idempotent.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi POST /api/v1/grocery-lists/:id/clear-checked không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0316"></a>

### API-0316

**Chức năng:** POST /api/v1/grocery-lists/:id/clear-checked

**Module:** Grocery list · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 317 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Grocery list; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Xóa/archive các item đã chọn theo cách idempotent.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/grocery-lists/:id/clear-checked với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0317"></a>

### API-0317

**Chức năng:** POST /api/v1/grocery-lists/:id/clear-checked

**Module:** Grocery list · **Loại:** Cross-user access · **Ưu tiên:** P0 · **Actor:** User B

**Nguồn Excel:** API Cases, hàng 318 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Target thuộc User A; User B có token hợp lệ
```

**Dữ liệu test:**

```text
LIST_A (không thuộc B); foodItemId=FOOD_TOFU,quantity=200,unit=g,checked=true khi check
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/grocery-lists/:id/clear-checked với ID của User A và token B.
2. Kiểm tra response/DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403 hoặc 404 theo chính sách chống dò ID; không lộ dữ liệu A; không mutation.
```

<a id="api-0318"></a>

### API-0318

**Chức năng:** POST /api/v1/grocery-lists/:id/clear-checked

**Module:** Grocery list · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 319 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/grocery-lists/:id/clear-checked với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="module-10"></a>

## Diary, weight và water

| ID                    | Chức năng / endpoint           | Loại test         | Ưu tiên | Actor  | Kết quả chạy |
| --------------------- | ------------------------------ | ----------------- | ------- | ------ | ------------ |
| [API-0319](#api-0319) | GET /api/v1/diary              | Happy path        | P1      | User A | Đạt          |
| [API-0320](#api-0320) | GET /api/v1/diary              | Missing auth      | P0      | Guest  | Đạt          |
| [API-0321](#api-0321) | GET /api/v1/diary              | Invalid auth      | P0      | User A | Đạt          |
| [API-0322](#api-0322) | GET /api/v1/diary              | Empty result      | P2      | User A | Đạt          |
| [API-0323](#api-0323) | POST /api/v1/diary             | Happy path        | P1      | User A | Đạt          |
| [API-0324](#api-0324) | POST /api/v1/diary             | Missing auth      | P0      | Guest  | Đạt          |
| [API-0325](#api-0325) | POST /api/v1/diary             | Invalid auth      | P0      | User A | Đạt          |
| [API-0326](#api-0326) | POST /api/v1/diary             | Invalid payload   | P1      | User A | Đạt          |
| [API-0327](#api-0327) | PATCH /api/v1/diary/:id        | Happy path        | P1      | User A | Đạt          |
| [API-0328](#api-0328) | PATCH /api/v1/diary/:id        | Missing auth      | P0      | Guest  | Đạt          |
| [API-0329](#api-0329) | PATCH /api/v1/diary/:id        | Invalid auth      | P0      | User A | Đạt          |
| [API-0330](#api-0330) | PATCH /api/v1/diary/:id        | Cross-user access | P0      | User B | Đạt          |
| [API-0331](#api-0331) | PATCH /api/v1/diary/:id        | Missing target    | P1      | User A | Đạt          |
| [API-0332](#api-0332) | PATCH /api/v1/diary/:id        | Invalid payload   | P1      | User A | Đạt          |
| [API-0333](#api-0333) | DELETE /api/v1/diary/:id       | Happy path        | P1      | User A | Đạt          |
| [API-0334](#api-0334) | DELETE /api/v1/diary/:id       | Missing auth      | P0      | Guest  | Đạt          |
| [API-0335](#api-0335) | DELETE /api/v1/diary/:id       | Invalid auth      | P0      | User A | Đạt          |
| [API-0336](#api-0336) | DELETE /api/v1/diary/:id       | Cross-user access | P0      | User B | Đạt          |
| [API-0337](#api-0337) | DELETE /api/v1/diary/:id       | Missing target    | P1      | User A | Đạt          |
| [API-0338](#api-0338) | GET /api/v1/diary/summary      | Happy path        | P1      | User A | Đạt          |
| [API-0339](#api-0339) | GET /api/v1/diary/summary      | Missing auth      | P0      | Guest  | Đạt          |
| [API-0340](#api-0340) | GET /api/v1/diary/summary      | Invalid auth      | P0      | User A | Đạt          |
| [API-0341](#api-0341) | GET /api/v1/diary/summary      | Empty result      | P2      | User A | Đạt          |
| [API-0342](#api-0342) | GET /api/v1/weight-logs        | Happy path        | P1      | User A | Đạt          |
| [API-0343](#api-0343) | GET /api/v1/weight-logs        | Missing auth      | P0      | Guest  | Đạt          |
| [API-0344](#api-0344) | GET /api/v1/weight-logs        | Invalid auth      | P0      | User A | Đạt          |
| [API-0345](#api-0345) | GET /api/v1/weight-logs        | Empty result      | P2      | User A | Đạt          |
| [API-0346](#api-0346) | POST /api/v1/weight-logs       | Happy path        | P1      | User A | Đạt          |
| [API-0347](#api-0347) | POST /api/v1/weight-logs       | Missing auth      | P0      | Guest  | Đạt          |
| [API-0348](#api-0348) | POST /api/v1/weight-logs       | Invalid auth      | P0      | User A | Đạt          |
| [API-0349](#api-0349) | POST /api/v1/weight-logs       | Invalid payload   | P1      | User A | Đạt          |
| [API-0350](#api-0350) | PATCH /api/v1/weight-logs/:id  | Happy path        | P1      | User A | Đạt          |
| [API-0351](#api-0351) | PATCH /api/v1/weight-logs/:id  | Missing auth      | P0      | Guest  | Đạt          |
| [API-0352](#api-0352) | PATCH /api/v1/weight-logs/:id  | Invalid auth      | P0      | User A | Đạt          |
| [API-0353](#api-0353) | PATCH /api/v1/weight-logs/:id  | Cross-user access | P0      | User B | Đạt          |
| [API-0354](#api-0354) | PATCH /api/v1/weight-logs/:id  | Missing target    | P1      | User A | Đạt          |
| [API-0355](#api-0355) | PATCH /api/v1/weight-logs/:id  | Invalid payload   | P1      | User A | Đạt          |
| [API-0356](#api-0356) | DELETE /api/v1/weight-logs/:id | Happy path        | P1      | User A | Đạt          |
| [API-0357](#api-0357) | DELETE /api/v1/weight-logs/:id | Missing auth      | P0      | Guest  | Đạt          |
| [API-0358](#api-0358) | DELETE /api/v1/weight-logs/:id | Invalid auth      | P0      | User A | Đạt          |
| [API-0359](#api-0359) | DELETE /api/v1/weight-logs/:id | Cross-user access | P0      | User B | Đạt          |
| [API-0360](#api-0360) | DELETE /api/v1/weight-logs/:id | Missing target    | P1      | User A | Đạt          |
| [API-0361](#api-0361) | GET /api/v1/weight-logs/trend  | Happy path        | P1      | User A | Đạt          |
| [API-0362](#api-0362) | GET /api/v1/weight-logs/trend  | Missing auth      | P0      | Guest  | Đạt          |
| [API-0363](#api-0363) | GET /api/v1/weight-logs/trend  | Invalid auth      | P0      | User A | Đạt          |
| [API-0364](#api-0364) | GET /api/v1/weight-logs/trend  | Empty result      | P2      | User A | Đạt          |
| [API-0365](#api-0365) | GET /api/v1/water-logs         | Happy path        | P1      | User A | Đạt          |
| [API-0366](#api-0366) | GET /api/v1/water-logs         | Missing auth      | P0      | Guest  | Đạt          |
| [API-0367](#api-0367) | GET /api/v1/water-logs         | Invalid auth      | P0      | User A | Đạt          |
| [API-0368](#api-0368) | GET /api/v1/water-logs         | Empty result      | P2      | User A | Đạt          |
| [API-0369](#api-0369) | POST /api/v1/water-logs        | Happy path        | P1      | User A | Đạt          |
| [API-0370](#api-0370) | POST /api/v1/water-logs        | Missing auth      | P0      | Guest  | Đạt          |
| [API-0371](#api-0371) | POST /api/v1/water-logs        | Invalid auth      | P0      | User A | Đạt          |
| [API-0372](#api-0372) | POST /api/v1/water-logs        | Invalid payload   | P1      | User A | Đạt          |
| [API-0373](#api-0373) | PATCH /api/v1/water-logs/:id   | Happy path        | P1      | User A | Đạt          |
| [API-0374](#api-0374) | PATCH /api/v1/water-logs/:id   | Missing auth      | P0      | Guest  | Đạt          |
| [API-0375](#api-0375) | PATCH /api/v1/water-logs/:id   | Invalid auth      | P0      | User A | Đạt          |
| [API-0376](#api-0376) | PATCH /api/v1/water-logs/:id   | Cross-user access | P0      | User B | Đạt          |
| [API-0377](#api-0377) | PATCH /api/v1/water-logs/:id   | Missing target    | P1      | User A | Đạt          |
| [API-0378](#api-0378) | PATCH /api/v1/water-logs/:id   | Invalid payload   | P1      | User A | Đạt          |
| [API-0379](#api-0379) | DELETE /api/v1/water-logs/:id  | Happy path        | P1      | User A | Đạt          |
| [API-0380](#api-0380) | DELETE /api/v1/water-logs/:id  | Missing auth      | P0      | Guest  | Đạt          |
| [API-0381](#api-0381) | DELETE /api/v1/water-logs/:id  | Invalid auth      | P0      | User A | Đạt          |
| [API-0382](#api-0382) | DELETE /api/v1/water-logs/:id  | Cross-user access | P0      | User B | Đạt          |
| [API-0383](#api-0383) | DELETE /api/v1/water-logs/:id  | Missing target    | P1      | User A | Đạt          |

<a id="api-0319"></a>

### API-0319

**Chức năng:** GET /api/v1/diary

**Module:** Diary, weight và water · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 320 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Diary, weight và water; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Lấy entry theo ngày/range.
```

**Dữ liệu test:**

```text
date=2026-10-05; mealType=lunch; sourceType=recipe; recipeId=RECIPE_A; servings=2
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/diary với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: Lấy entry theo ngày/range; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0320"></a>

### API-0320

**Chức năng:** GET /api/v1/diary

**Module:** Diary, weight và water · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 321 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Diary, weight và water; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Lấy entry theo ngày/range.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi GET /api/v1/diary không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0321"></a>

### API-0321

**Chức năng:** GET /api/v1/diary

**Module:** Diary, weight và water · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 322 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Diary, weight và water; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Lấy entry theo ngày/range.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/diary với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0322"></a>

### API-0322

**Chức năng:** GET /api/v1/diary

**Module:** Diary, weight và water · **Loại:** Empty result · **Ưu tiên:** P2 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 323 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Không có dữ liệu khớp filter hoặc user mới
```

**Dữ liệu test:**

```text
Filter hợp lệ không có kết quả
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/diary với filter rỗng kết quả.
2. Kiểm tra payload.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; list rỗng/tổng bằng 0 đúng schema; không lỗi 500 hoặc dữ liệu user khác.
```

<a id="api-0323"></a>

### API-0323

**Chức năng:** POST /api/v1/diary

**Module:** Diary, weight và water · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 324 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Diary, weight và water; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Ghi món đã dùng với snapshot.
```

**Dữ liệu test:**

```text
date=2026-10-05; mealType=lunch; sourceType=recipe; recipeId=RECIPE_A; servings=2
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi POST /api/v1/diary với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Ghi món đã dùng với snapshot; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0324"></a>

### API-0324

**Chức năng:** POST /api/v1/diary

**Module:** Diary, weight và water · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 325 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Diary, weight và water; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Ghi món đã dùng với snapshot.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi POST /api/v1/diary không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0325"></a>

### API-0325

**Chức năng:** POST /api/v1/diary

**Module:** Diary, weight và water · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 326 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Diary, weight và water; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Ghi món đã dùng với snapshot.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/diary với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0326"></a>

### API-0326

**Chức năng:** POST /api/v1/diary

**Module:** Diary, weight và water · **Loại:** Invalid payload · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 327 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Diary, weight và water; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Ghi món đã dùng với snapshot.
```

**Dữ liệu test:**

```text
Body chứa field bắt buộc rỗng/sai type; PATCH={} hoặc score=6/quantity=-1 khi áp dụng
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/diary với body sai schema.
2. Đối chiếu field error.
3. Xác minh DB giữ nguyên.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 400 VALIDATION_ERROR; details chỉ rõ field; không lưu dữ liệu sai.
```

<a id="api-0327"></a>

### API-0327

**Chức năng:** PATCH /api/v1/diary/:id

**Module:** Diary, weight và water · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 328 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Diary, weight và water; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Sửa lượng/ghi chú.
```

**Dữ liệu test:**

```text
date=2026-10-05; mealType=lunch; sourceType=recipe; recipeId=RECIPE_A; servings=2
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi PATCH /api/v1/diary/:id với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Sửa lượng/ghi chú; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0328"></a>

### API-0328

**Chức năng:** PATCH /api/v1/diary/:id

**Module:** Diary, weight và water · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 329 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Diary, weight và water; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Sửa lượng/ghi chú.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi PATCH /api/v1/diary/:id không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0329"></a>

### API-0329

**Chức năng:** PATCH /api/v1/diary/:id

**Module:** Diary, weight và water · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 330 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Diary, weight và water; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Sửa lượng/ghi chú.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/diary/:id với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0330"></a>

### API-0330

**Chức năng:** PATCH /api/v1/diary/:id

**Module:** Diary, weight và water · **Loại:** Cross-user access · **Ưu tiên:** P0 · **Actor:** User B

**Nguồn Excel:** API Cases, hàng 331 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Target thuộc User A; User B có token hợp lệ
```

**Dữ liệu test:**

```text
date=2026-10-05; mealType=lunch; sourceType=recipe; recipeId=RECIPE_A (không thuộc B); servings=2
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/diary/:id với ID của User A và token B.
2. Kiểm tra response/DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403 hoặc 404 theo chính sách chống dò ID; không lộ dữ liệu A; không mutation.
```

<a id="api-0331"></a>

### API-0331

**Chức năng:** PATCH /api/v1/diary/:id

**Module:** Diary, weight và water · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 332 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/diary/:id với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0332"></a>

### API-0332

**Chức năng:** PATCH /api/v1/diary/:id

**Module:** Diary, weight và water · **Loại:** Invalid payload · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 333 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Diary, weight và water; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Sửa lượng/ghi chú.
```

**Dữ liệu test:**

```text
Body chứa field bắt buộc rỗng/sai type; PATCH={} hoặc score=6/quantity=-1 khi áp dụng
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/diary/:id với body sai schema.
2. Đối chiếu field error.
3. Xác minh DB giữ nguyên.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 400 VALIDATION_ERROR; details chỉ rõ field; không lưu dữ liệu sai.
```

<a id="api-0333"></a>

### API-0333

**Chức năng:** DELETE /api/v1/diary/:id

**Module:** Diary, weight và water · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 334 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Diary, weight và water; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Xóa entry.
```

**Dữ liệu test:**

```text
date=2026-10-05; mealType=lunch; sourceType=recipe; recipeId=RECIPE_A; servings=2
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi DELETE /api/v1/diary/:id với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Xóa entry; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0334"></a>

### API-0334

**Chức năng:** DELETE /api/v1/diary/:id

**Module:** Diary, weight và water · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 335 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Diary, weight và water; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Xóa entry.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi DELETE /api/v1/diary/:id không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0335"></a>

### API-0335

**Chức năng:** DELETE /api/v1/diary/:id

**Module:** Diary, weight và water · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 336 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Diary, weight và water; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Xóa entry.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi DELETE /api/v1/diary/:id với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0336"></a>

### API-0336

**Chức năng:** DELETE /api/v1/diary/:id

**Module:** Diary, weight và water · **Loại:** Cross-user access · **Ưu tiên:** P0 · **Actor:** User B

**Nguồn Excel:** API Cases, hàng 337 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Target thuộc User A; User B có token hợp lệ
```

**Dữ liệu test:**

```text
date=2026-10-05; mealType=lunch; sourceType=recipe; recipeId=RECIPE_A (không thuộc B); servings=2
```

**Các bước thực hiện:**

```text
1. Gửi DELETE /api/v1/diary/:id với ID của User A và token B.
2. Kiểm tra response/DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403 hoặc 404 theo chính sách chống dò ID; không lộ dữ liệu A; không mutation.
```

<a id="api-0337"></a>

### API-0337

**Chức năng:** DELETE /api/v1/diary/:id

**Module:** Diary, weight và water · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 338 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi DELETE /api/v1/diary/:id với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0338"></a>

### API-0338

**Chức năng:** GET /api/v1/diary/summary

**Module:** Diary, weight và water · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 339 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Diary, weight và water; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Tổng nutrition theo ngày/range.
```

**Dữ liệu test:**

```text
date=2026-10-05; mealType=lunch; sourceType=recipe; recipeId=RECIPE_A; servings=2
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/diary/summary với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: Tổng nutrition theo ngày/range; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0339"></a>

### API-0339

**Chức năng:** GET /api/v1/diary/summary

**Module:** Diary, weight và water · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 340 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Diary, weight và water; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Tổng nutrition theo ngày/range.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi GET /api/v1/diary/summary không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0340"></a>

### API-0340

**Chức năng:** GET /api/v1/diary/summary

**Module:** Diary, weight và water · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 341 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Diary, weight và water; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Tổng nutrition theo ngày/range.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/diary/summary với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0341"></a>

### API-0341

**Chức năng:** GET /api/v1/diary/summary

**Module:** Diary, weight và water · **Loại:** Empty result · **Ưu tiên:** P2 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 342 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Không có dữ liệu khớp filter hoặc user mới
```

**Dữ liệu test:**

```text
Filter hợp lệ không có kết quả
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/diary/summary với filter rỗng kết quả.
2. Kiểm tra payload.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; list rỗng/tổng bằng 0 đúng schema; không lỗi 500 hoặc dữ liệu user khác.
```

<a id="api-0342"></a>

### API-0342

**Chức năng:** GET /api/v1/weight-logs

**Module:** Diary, weight và water · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 343 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Diary, weight và water; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Lịch sử.
```

**Dữ liệu test:**

```text
weightKg=60; recordedAt=2026-10-05T03:00:00Z
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/weight-logs với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: Lịch sử; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0343"></a>

### API-0343

**Chức năng:** GET /api/v1/weight-logs

**Module:** Diary, weight và water · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 344 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Diary, weight và water; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Lịch sử.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi GET /api/v1/weight-logs không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0344"></a>

### API-0344

**Chức năng:** GET /api/v1/weight-logs

**Module:** Diary, weight và water · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 345 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Diary, weight và water; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Lịch sử.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/weight-logs với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0345"></a>

### API-0345

**Chức năng:** GET /api/v1/weight-logs

**Module:** Diary, weight và water · **Loại:** Empty result · **Ưu tiên:** P2 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 346 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Không có dữ liệu khớp filter hoặc user mới
```

**Dữ liệu test:**

```text
Filter hợp lệ không có kết quả
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/weight-logs với filter rỗng kết quả.
2. Kiểm tra payload.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; list rỗng/tổng bằng 0 đúng schema; không lỗi 500 hoặc dữ liệu user khác.
```

<a id="api-0346"></a>

### API-0346

**Chức năng:** POST /api/v1/weight-logs

**Module:** Diary, weight và water · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 347 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Diary, weight và water; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Ghi cân nặng.
```

**Dữ liệu test:**

```text
weightKg=60; recordedAt=2026-10-05T03:00:00Z
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi POST /api/v1/weight-logs với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Ghi cân nặng; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0347"></a>

### API-0347

**Chức năng:** POST /api/v1/weight-logs

**Module:** Diary, weight và water · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 348 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Diary, weight và water; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Ghi cân nặng.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi POST /api/v1/weight-logs không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0348"></a>

### API-0348

**Chức năng:** POST /api/v1/weight-logs

**Module:** Diary, weight và water · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 349 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Diary, weight và water; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Ghi cân nặng.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/weight-logs với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0349"></a>

### API-0349

**Chức năng:** POST /api/v1/weight-logs

**Module:** Diary, weight và water · **Loại:** Invalid payload · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 350 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Diary, weight và water; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Ghi cân nặng.
```

**Dữ liệu test:**

```text
Body chứa field bắt buộc rỗng/sai type; PATCH={} hoặc score=6/quantity=-1 khi áp dụng
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/weight-logs với body sai schema.
2. Đối chiếu field error.
3. Xác minh DB giữ nguyên.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 400 VALIDATION_ERROR; details chỉ rõ field; không lưu dữ liệu sai.
```

<a id="api-0350"></a>

### API-0350

**Chức năng:** PATCH /api/v1/weight-logs/:id

**Module:** Diary, weight và water · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 351 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Diary, weight và water; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Sửa.
```

**Dữ liệu test:**

```text
weightKg=60; recordedAt=2026-10-05T03:00:00Z
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi PATCH /api/v1/weight-logs/:id với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Sửa; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0351"></a>

### API-0351

**Chức năng:** PATCH /api/v1/weight-logs/:id

**Module:** Diary, weight và water · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 352 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Diary, weight và water; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Sửa.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi PATCH /api/v1/weight-logs/:id không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0352"></a>

### API-0352

**Chức năng:** PATCH /api/v1/weight-logs/:id

**Module:** Diary, weight và water · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 353 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Diary, weight và water; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Sửa.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/weight-logs/:id với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0353"></a>

### API-0353

**Chức năng:** PATCH /api/v1/weight-logs/:id

**Module:** Diary, weight và water · **Loại:** Cross-user access · **Ưu tiên:** P0 · **Actor:** User B

**Nguồn Excel:** API Cases, hàng 354 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Target thuộc User A; User B có token hợp lệ
```

**Dữ liệu test:**

```text
weightKg=60; recordedAt=2026-10-05T03:00:00Z
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/weight-logs/:id với ID của User A và token B.
2. Kiểm tra response/DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403 hoặc 404 theo chính sách chống dò ID; không lộ dữ liệu A; không mutation.
```

<a id="api-0354"></a>

### API-0354

**Chức năng:** PATCH /api/v1/weight-logs/:id

**Module:** Diary, weight và water · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 355 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/weight-logs/:id với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0355"></a>

### API-0355

**Chức năng:** PATCH /api/v1/weight-logs/:id

**Module:** Diary, weight và water · **Loại:** Invalid payload · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 356 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Diary, weight và water; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Sửa.
```

**Dữ liệu test:**

```text
Body chứa field bắt buộc rỗng/sai type; PATCH={} hoặc score=6/quantity=-1 khi áp dụng
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/weight-logs/:id với body sai schema.
2. Đối chiếu field error.
3. Xác minh DB giữ nguyên.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 400 VALIDATION_ERROR; details chỉ rõ field; không lưu dữ liệu sai.
```

<a id="api-0356"></a>

### API-0356

**Chức năng:** DELETE /api/v1/weight-logs/:id

**Module:** Diary, weight và water · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 357 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Diary, weight và water; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Xóa.
```

**Dữ liệu test:**

```text
weightKg=60; recordedAt=2026-10-05T03:00:00Z
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi DELETE /api/v1/weight-logs/:id với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Xóa; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0357"></a>

### API-0357

**Chức năng:** DELETE /api/v1/weight-logs/:id

**Module:** Diary, weight và water · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 358 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Diary, weight và water; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Xóa.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi DELETE /api/v1/weight-logs/:id không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0358"></a>

### API-0358

**Chức năng:** DELETE /api/v1/weight-logs/:id

**Module:** Diary, weight và water · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 359 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Diary, weight và water; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Xóa.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi DELETE /api/v1/weight-logs/:id với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0359"></a>

### API-0359

**Chức năng:** DELETE /api/v1/weight-logs/:id

**Module:** Diary, weight và water · **Loại:** Cross-user access · **Ưu tiên:** P0 · **Actor:** User B

**Nguồn Excel:** API Cases, hàng 360 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Target thuộc User A; User B có token hợp lệ
```

**Dữ liệu test:**

```text
weightKg=60; recordedAt=2026-10-05T03:00:00Z
```

**Các bước thực hiện:**

```text
1. Gửi DELETE /api/v1/weight-logs/:id với ID của User A và token B.
2. Kiểm tra response/DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403 hoặc 404 theo chính sách chống dò ID; không lộ dữ liệu A; không mutation.
```

<a id="api-0360"></a>

### API-0360

**Chức năng:** DELETE /api/v1/weight-logs/:id

**Module:** Diary, weight và water · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 361 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi DELETE /api/v1/weight-logs/:id với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0361"></a>

### API-0361

**Chức năng:** GET /api/v1/weight-logs/trend

**Module:** Diary, weight và water · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 362 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Diary, weight và water; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Trend theo range.
```

**Dữ liệu test:**

```text
weightKg=60; recordedAt=2026-10-05T03:00:00Z
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/weight-logs/trend với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: Trend theo range; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0362"></a>

### API-0362

**Chức năng:** GET /api/v1/weight-logs/trend

**Module:** Diary, weight và water · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 363 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Diary, weight và water; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Trend theo range.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi GET /api/v1/weight-logs/trend không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0363"></a>

### API-0363

**Chức năng:** GET /api/v1/weight-logs/trend

**Module:** Diary, weight và water · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 364 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Diary, weight và water; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Trend theo range.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/weight-logs/trend với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0364"></a>

### API-0364

**Chức năng:** GET /api/v1/weight-logs/trend

**Module:** Diary, weight và water · **Loại:** Empty result · **Ưu tiên:** P2 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 365 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Không có dữ liệu khớp filter hoặc user mới
```

**Dữ liệu test:**

```text
Filter hợp lệ không có kết quả
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/weight-logs/trend với filter rỗng kết quả.
2. Kiểm tra payload.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; list rỗng/tổng bằng 0 đúng schema; không lỗi 500 hoặc dữ liệu user khác.
```

<a id="api-0365"></a>

### API-0365

**Chức năng:** GET /api/v1/water-logs

**Module:** Diary, weight và water · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 366 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Diary, weight và water; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Lịch sử/tổng theo ngày.
```

**Dữ liệu test:**

```text
amountMl=250; recordedAt=2026-10-05T03:00:00Z
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/water-logs với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: Lịch sử/tổng theo ngày; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0366"></a>

### API-0366

**Chức năng:** GET /api/v1/water-logs

**Module:** Diary, weight và water · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 367 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Diary, weight và water; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Lịch sử/tổng theo ngày.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi GET /api/v1/water-logs không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0367"></a>

### API-0367

**Chức năng:** GET /api/v1/water-logs

**Module:** Diary, weight và water · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 368 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Diary, weight và water; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Lịch sử/tổng theo ngày.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/water-logs với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0368"></a>

### API-0368

**Chức năng:** GET /api/v1/water-logs

**Module:** Diary, weight và water · **Loại:** Empty result · **Ưu tiên:** P2 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 369 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Không có dữ liệu khớp filter hoặc user mới
```

**Dữ liệu test:**

```text
Filter hợp lệ không có kết quả
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/water-logs với filter rỗng kết quả.
2. Kiểm tra payload.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; list rỗng/tổng bằng 0 đúng schema; không lỗi 500 hoặc dữ liệu user khác.
```

<a id="api-0369"></a>

### API-0369

**Chức năng:** POST /api/v1/water-logs

**Module:** Diary, weight và water · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 370 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Diary, weight và water; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Ghi lượng nước.
```

**Dữ liệu test:**

```text
amountMl=250; recordedAt=2026-10-05T03:00:00Z
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi POST /api/v1/water-logs với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Ghi lượng nước; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0370"></a>

### API-0370

**Chức năng:** POST /api/v1/water-logs

**Module:** Diary, weight và water · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 371 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Diary, weight và water; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Ghi lượng nước.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi POST /api/v1/water-logs không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0371"></a>

### API-0371

**Chức năng:** POST /api/v1/water-logs

**Module:** Diary, weight và water · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 372 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Diary, weight và water; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Ghi lượng nước.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/water-logs với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0372"></a>

### API-0372

**Chức năng:** POST /api/v1/water-logs

**Module:** Diary, weight và water · **Loại:** Invalid payload · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 373 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Diary, weight và water; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Ghi lượng nước.
```

**Dữ liệu test:**

```text
Body chứa field bắt buộc rỗng/sai type; PATCH={} hoặc score=6/quantity=-1 khi áp dụng
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/water-logs với body sai schema.
2. Đối chiếu field error.
3. Xác minh DB giữ nguyên.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 400 VALIDATION_ERROR; details chỉ rõ field; không lưu dữ liệu sai.
```

<a id="api-0373"></a>

### API-0373

**Chức năng:** PATCH /api/v1/water-logs/:id

**Module:** Diary, weight và water · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 374 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Diary, weight và water; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Sửa.
```

**Dữ liệu test:**

```text
amountMl=250; recordedAt=2026-10-05T03:00:00Z
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi PATCH /api/v1/water-logs/:id với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Sửa; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0374"></a>

### API-0374

**Chức năng:** PATCH /api/v1/water-logs/:id

**Module:** Diary, weight và water · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 375 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Diary, weight và water; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Sửa.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi PATCH /api/v1/water-logs/:id không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0375"></a>

### API-0375

**Chức năng:** PATCH /api/v1/water-logs/:id

**Module:** Diary, weight và water · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 376 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Diary, weight và water; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Sửa.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/water-logs/:id với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0376"></a>

### API-0376

**Chức năng:** PATCH /api/v1/water-logs/:id

**Module:** Diary, weight và water · **Loại:** Cross-user access · **Ưu tiên:** P0 · **Actor:** User B

**Nguồn Excel:** API Cases, hàng 377 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Target thuộc User A; User B có token hợp lệ
```

**Dữ liệu test:**

```text
amountMl=250; recordedAt=2026-10-05T03:00:00Z
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/water-logs/:id với ID của User A và token B.
2. Kiểm tra response/DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403 hoặc 404 theo chính sách chống dò ID; không lộ dữ liệu A; không mutation.
```

<a id="api-0377"></a>

### API-0377

**Chức năng:** PATCH /api/v1/water-logs/:id

**Module:** Diary, weight và water · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 378 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/water-logs/:id với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0378"></a>

### API-0378

**Chức năng:** PATCH /api/v1/water-logs/:id

**Module:** Diary, weight và water · **Loại:** Invalid payload · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 379 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Diary, weight và water; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Sửa.
```

**Dữ liệu test:**

```text
Body chứa field bắt buộc rỗng/sai type; PATCH={} hoặc score=6/quantity=-1 khi áp dụng
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/water-logs/:id với body sai schema.
2. Đối chiếu field error.
3. Xác minh DB giữ nguyên.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 400 VALIDATION_ERROR; details chỉ rõ field; không lưu dữ liệu sai.
```

<a id="api-0379"></a>

### API-0379

**Chức năng:** DELETE /api/v1/water-logs/:id

**Module:** Diary, weight và water · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 380 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Diary, weight và water; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Xóa.
```

**Dữ liệu test:**

```text
amountMl=250; recordedAt=2026-10-05T03:00:00Z
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi DELETE /api/v1/water-logs/:id với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Xóa; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0380"></a>

### API-0380

**Chức năng:** DELETE /api/v1/water-logs/:id

**Module:** Diary, weight và water · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 381 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Diary, weight và water; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Xóa.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi DELETE /api/v1/water-logs/:id không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0381"></a>

### API-0381

**Chức năng:** DELETE /api/v1/water-logs/:id

**Module:** Diary, weight và water · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 382 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Diary, weight và water; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Xóa.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi DELETE /api/v1/water-logs/:id với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0382"></a>

### API-0382

**Chức năng:** DELETE /api/v1/water-logs/:id

**Module:** Diary, weight và water · **Loại:** Cross-user access · **Ưu tiên:** P0 · **Actor:** User B

**Nguồn Excel:** API Cases, hàng 383 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Target thuộc User A; User B có token hợp lệ
```

**Dữ liệu test:**

```text
amountMl=250; recordedAt=2026-10-05T03:00:00Z
```

**Các bước thực hiện:**

```text
1. Gửi DELETE /api/v1/water-logs/:id với ID của User A và token B.
2. Kiểm tra response/DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403 hoặc 404 theo chính sách chống dò ID; không lộ dữ liệu A; không mutation.
```

<a id="api-0383"></a>

### API-0383

**Chức năng:** DELETE /api/v1/water-logs/:id

**Module:** Diary, weight và water · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 384 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi DELETE /api/v1/water-logs/:id với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="module-11"></a>

## Media và Cloudflare R2

| ID                    | Chức năng / endpoint               | Loại test         | Ưu tiên | Actor  | Kết quả chạy |
| --------------------- | ---------------------------------- | ----------------- | ------- | ------ | ------------ |
| [API-0384](#api-0384) | POST /api/v1/media/upload-requests | Happy path        | P1      | User A | Đạt          |
| [API-0385](#api-0385) | POST /api/v1/media/upload-requests | Missing auth      | P0      | Guest  | Đạt          |
| [API-0386](#api-0386) | POST /api/v1/media/upload-requests | Invalid auth      | P0      | User A | Đạt          |
| [API-0387](#api-0387) | POST /api/v1/media/upload-requests | Invalid payload   | P1      | User A | Đạt          |
| [API-0388](#api-0388) | GET /api/v1/media/mine             | Happy path        | P1      | User A | Đạt          |
| [API-0389](#api-0389) | GET /api/v1/media/mine             | Missing auth      | P0      | Guest  | Đạt          |
| [API-0390](#api-0390) | GET /api/v1/media/mine             | Invalid auth      | P0      | User A | Đạt          |
| [API-0391](#api-0391) | GET /api/v1/media/mine             | Empty result      | P2      | User A | Đạt          |
| [API-0392](#api-0392) | POST /api/v1/media/:id/confirm     | Happy path        | P1      | User A | Đạt          |
| [API-0393](#api-0393) | POST /api/v1/media/:id/confirm     | Missing auth      | P0      | Guest  | Đạt          |
| [API-0394](#api-0394) | POST /api/v1/media/:id/confirm     | Invalid auth      | P0      | User A | Đạt          |
| [API-0395](#api-0395) | POST /api/v1/media/:id/confirm     | Cross-user access | P0      | User B | Đạt          |
| [API-0396](#api-0396) | POST /api/v1/media/:id/confirm     | Missing target    | P1      | User A | Đạt          |
| [API-0397](#api-0397) | GET /api/v1/media/:id              | Happy path        | P1      | Guest  | Đạt          |
| [API-0398](#api-0398) | GET /api/v1/media/:id              | Cross-user access | P0      | User B | Đạt          |
| [API-0399](#api-0399) | GET /api/v1/media/:id              | Missing target    | P1      | Guest  | Đạt          |
| [API-0400](#api-0400) | DELETE /api/v1/media/:id           | Happy path        | P1      | User A | Đạt          |
| [API-0401](#api-0401) | DELETE /api/v1/media/:id           | Missing auth      | P0      | Guest  | Đạt          |
| [API-0402](#api-0402) | DELETE /api/v1/media/:id           | Invalid auth      | P0      | User A | Đạt          |
| [API-0403](#api-0403) | DELETE /api/v1/media/:id           | Cross-user access | P0      | User B | Đạt          |
| [API-0404](#api-0404) | DELETE /api/v1/media/:id           | Missing target    | P1      | User A | Đạt          |

<a id="api-0384"></a>

### API-0384

**Chức năng:** POST /api/v1/media/upload-requests

**Module:** Media và Cloudflare R2 · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 385 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Media và Cloudflare R2; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Tạo presigned PUT URL.
```

**Dữ liệu test:**

```text
filename=tofu.jpg; mimeType=image/jpeg; sizeBytes=102400; purpose=recipe
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi POST /api/v1/media/upload-requests với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Tạo presigned PUT URL; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0385"></a>

### API-0385

**Chức năng:** POST /api/v1/media/upload-requests

**Module:** Media và Cloudflare R2 · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 386 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Media và Cloudflare R2; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Tạo presigned PUT URL.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi POST /api/v1/media/upload-requests không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0386"></a>

### API-0386

**Chức năng:** POST /api/v1/media/upload-requests

**Module:** Media và Cloudflare R2 · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 387 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Media và Cloudflare R2; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Tạo presigned PUT URL.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/media/upload-requests với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0387"></a>

### API-0387

**Chức năng:** POST /api/v1/media/upload-requests

**Module:** Media và Cloudflare R2 · **Loại:** Invalid payload · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 388 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Media và Cloudflare R2; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Tạo presigned PUT URL.
```

**Dữ liệu test:**

```text
Body chứa field bắt buộc rỗng/sai type; PATCH={} hoặc score=6/quantity=-1 khi áp dụng
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/media/upload-requests với body sai schema.
2. Đối chiếu field error.
3. Xác minh DB giữ nguyên.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 400 VALIDATION_ERROR; details chỉ rõ field; không lưu dữ liệu sai.
```

<a id="api-0388"></a>

### API-0388

**Chức năng:** GET /api/v1/media/mine

**Module:** Media và Cloudflare R2 · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 389 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Media và Cloudflare R2; User A active, có Firebase token hợp lệ; target đúng trạng thái cho List media của mình theo status/purpose.
```

**Dữ liệu test:**

```text
MEDIA_A thuộc User A; R2 object tồn tại nếu confirm
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/media/mine với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: List media của mình theo status/purpose; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0389"></a>

### API-0389

**Chức năng:** GET /api/v1/media/mine

**Module:** Media và Cloudflare R2 · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 390 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Media và Cloudflare R2; User A active, có Firebase token bị bỏ; target đúng trạng thái cho List media của mình theo status/purpose.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi GET /api/v1/media/mine không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0390"></a>

### API-0390

**Chức năng:** GET /api/v1/media/mine

**Module:** Media và Cloudflare R2 · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 391 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Media và Cloudflare R2; User A active, có Firebase token hợp lệ; target đúng trạng thái cho List media của mình theo status/purpose.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/media/mine với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0391"></a>

### API-0391

**Chức năng:** GET /api/v1/media/mine

**Module:** Media và Cloudflare R2 · **Loại:** Empty result · **Ưu tiên:** P2 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 392 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Không có dữ liệu khớp filter hoặc user mới
```

**Dữ liệu test:**

```text
Filter hợp lệ không có kết quả
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/media/mine với filter rỗng kết quả.
2. Kiểm tra payload.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; list rỗng/tổng bằng 0 đúng schema; không lỗi 500 hoặc dữ liệu user khác.
```

<a id="api-0392"></a>

### API-0392

**Chức năng:** POST /api/v1/media/:id/confirm

**Module:** Media và Cloudflare R2 · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 393 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Media và Cloudflare R2; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Xác minh object đã upload và đánh dấu ready.
```

**Dữ liệu test:**

```text
MEDIA_A thuộc User A; R2 object tồn tại nếu confirm
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi POST /api/v1/media/:id/confirm với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Xác minh object đã upload và đánh dấu ready; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0393"></a>

### API-0393

**Chức năng:** POST /api/v1/media/:id/confirm

**Module:** Media và Cloudflare R2 · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 394 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Media và Cloudflare R2; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Xác minh object đã upload và đánh dấu ready.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi POST /api/v1/media/:id/confirm không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0394"></a>

### API-0394

**Chức năng:** POST /api/v1/media/:id/confirm

**Module:** Media và Cloudflare R2 · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 395 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Media và Cloudflare R2; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Xác minh object đã upload và đánh dấu ready.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/media/:id/confirm với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0395"></a>

### API-0395

**Chức năng:** POST /api/v1/media/:id/confirm

**Module:** Media và Cloudflare R2 · **Loại:** Cross-user access · **Ưu tiên:** P0 · **Actor:** User B

**Nguồn Excel:** API Cases, hàng 396 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Target thuộc User A; User B có token hợp lệ
```

**Dữ liệu test:**

```text
MEDIA_A (không thuộc B) thuộc User A; R2 object tồn tại nếu confirm
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/media/:id/confirm với ID của User A và token B.
2. Kiểm tra response/DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403 hoặc 404 theo chính sách chống dò ID; không lộ dữ liệu A; không mutation.
```

<a id="api-0396"></a>

### API-0396

**Chức năng:** POST /api/v1/media/:id/confirm

**Module:** Media và Cloudflare R2 · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 397 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/media/:id/confirm với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0397"></a>

### API-0397

**Chức năng:** GET /api/v1/media/:id

**Module:** Media và Cloudflare R2 · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 398 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Media và Cloudflare R2; không gửi token; target đúng trạng thái cho Metadata theo quyền entity.
```

**Dữ liệu test:**

```text
MEDIA_A thuộc User A; R2 object tồn tại nếu confirm
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/media/:id với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: Metadata theo quyền entity; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0398"></a>

### API-0398

**Chức năng:** GET /api/v1/media/:id

**Module:** Media và Cloudflare R2 · **Loại:** Cross-user access · **Ưu tiên:** P0 · **Actor:** User B

**Nguồn Excel:** API Cases, hàng 399 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Target thuộc User A; User B có token hợp lệ
```

**Dữ liệu test:**

```text
MEDIA_A (không thuộc B) thuộc User A; R2 object tồn tại nếu confirm
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/media/:id với ID của User A và token B.
2. Kiểm tra response/DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403 hoặc 404 theo chính sách chống dò ID; không lộ dữ liệu A; không mutation.
```

<a id="api-0399"></a>

### API-0399

**Chức năng:** GET /api/v1/media/:id

**Module:** Media và Cloudflare R2 · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 400 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/media/:id với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0400"></a>

### API-0400

**Chức năng:** DELETE /api/v1/media/:id

**Module:** Media và Cloudflare R2 · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 401 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Media và Cloudflare R2; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Xóa object và soft-delete metadata nếu không còn dùng.
```

**Dữ liệu test:**

```text
MEDIA_A thuộc User A; R2 object tồn tại nếu confirm
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi DELETE /api/v1/media/:id với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Xóa object và soft-delete metadata nếu không còn dùng; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0401"></a>

### API-0401

**Chức năng:** DELETE /api/v1/media/:id

**Module:** Media và Cloudflare R2 · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 402 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Media và Cloudflare R2; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Xóa object và soft-delete metadata nếu không còn dùng.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi DELETE /api/v1/media/:id không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0402"></a>

### API-0402

**Chức năng:** DELETE /api/v1/media/:id

**Module:** Media và Cloudflare R2 · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 403 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Media và Cloudflare R2; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Xóa object và soft-delete metadata nếu không còn dùng.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi DELETE /api/v1/media/:id với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0403"></a>

### API-0403

**Chức năng:** DELETE /api/v1/media/:id

**Module:** Media và Cloudflare R2 · **Loại:** Cross-user access · **Ưu tiên:** P0 · **Actor:** User B

**Nguồn Excel:** API Cases, hàng 404 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Target thuộc User A; User B có token hợp lệ
```

**Dữ liệu test:**

```text
MEDIA_A (không thuộc B) thuộc User A; R2 object tồn tại nếu confirm
```

**Các bước thực hiện:**

```text
1. Gửi DELETE /api/v1/media/:id với ID của User A và token B.
2. Kiểm tra response/DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403 hoặc 404 theo chính sách chống dò ID; không lộ dữ liệu A; không mutation.
```

<a id="api-0404"></a>

### API-0404

**Chức năng:** DELETE /api/v1/media/:id

**Module:** Media và Cloudflare R2 · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 405 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi DELETE /api/v1/media/:id với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="module-12"></a>

## Post, comment, reaction và saved item

| ID                    | Chức năng / endpoint                             | Loại test         | Ưu tiên | Actor  | Kết quả chạy |
| --------------------- | ------------------------------------------------ | ----------------- | ------- | ------ | ------------ |
| [API-0405](#api-0405) | GET /api/v1/posts                                | Happy path        | P1      | Guest  | Đạt          |
| [API-0406](#api-0406) | GET /api/v1/posts                                | Empty result      | P2      | Guest  | Đạt          |
| [API-0407](#api-0407) | GET /api/v1/posts/mine                           | Happy path        | P1      | User A | Đạt          |
| [API-0408](#api-0408) | GET /api/v1/posts/mine                           | Missing auth      | P0      | Guest  | Đạt          |
| [API-0409](#api-0409) | GET /api/v1/posts/mine                           | Invalid auth      | P0      | User A | Đạt          |
| [API-0410](#api-0410) | GET /api/v1/posts/mine                           | Empty result      | P2      | User A | Đạt          |
| [API-0411](#api-0411) | GET /api/v1/posts/:id                            | Happy path        | P1      | Guest  | Đạt          |
| [API-0412](#api-0412) | GET /api/v1/posts/:id                            | Missing target    | P1      | Guest  | Đạt          |
| [API-0413](#api-0413) | POST /api/v1/posts                               | Happy path        | P1      | User A | Đạt          |
| [API-0414](#api-0414) | POST /api/v1/posts                               | Missing auth      | P0      | Guest  | Đạt          |
| [API-0415](#api-0415) | POST /api/v1/posts                               | Invalid auth      | P0      | User A | Đạt          |
| [API-0416](#api-0416) | POST /api/v1/posts                               | Invalid payload   | P1      | User A | Đạt          |
| [API-0417](#api-0417) | PATCH /api/v1/posts/:id                          | Happy path        | P1      | User A | Đạt          |
| [API-0418](#api-0418) | PATCH /api/v1/posts/:id                          | Missing auth      | P0      | Guest  | Đạt          |
| [API-0419](#api-0419) | PATCH /api/v1/posts/:id                          | Invalid auth      | P0      | User A | Đạt          |
| [API-0420](#api-0420) | PATCH /api/v1/posts/:id                          | Cross-user access | P0      | User B | Đạt          |
| [API-0421](#api-0421) | PATCH /api/v1/posts/:id                          | Missing target    | P1      | User A | Đạt          |
| [API-0422](#api-0422) | PATCH /api/v1/posts/:id                          | Invalid payload   | P1      | User A | Đạt          |
| [API-0423](#api-0423) | DELETE /api/v1/posts/:id                         | Happy path        | P1      | User A | Đạt          |
| [API-0424](#api-0424) | DELETE /api/v1/posts/:id                         | Missing auth      | P0      | Guest  | Đạt          |
| [API-0425](#api-0425) | DELETE /api/v1/posts/:id                         | Invalid auth      | P0      | User A | Đạt          |
| [API-0426](#api-0426) | DELETE /api/v1/posts/:id                         | Cross-user access | P0      | User B | Đạt          |
| [API-0427](#api-0427) | DELETE /api/v1/posts/:id                         | Missing target    | P1      | User A | Đạt          |
| [API-0428](#api-0428) | POST /api/v1/posts/:id/submit                    | Happy path        | P1      | User A | Đạt          |
| [API-0429](#api-0429) | POST /api/v1/posts/:id/submit                    | Missing auth      | P0      | Guest  | Đạt          |
| [API-0430](#api-0430) | POST /api/v1/posts/:id/submit                    | Invalid auth      | P0      | User A | Đạt          |
| [API-0431](#api-0431) | POST /api/v1/posts/:id/submit                    | Cross-user access | P0      | User B | Đạt          |
| [API-0432](#api-0432) | POST /api/v1/posts/:id/submit                    | Missing target    | P1      | User A | Đạt          |
| [API-0433](#api-0433) | POST /api/v1/posts/:id/publish                   | Happy path        | P1      | Admin  | Đạt          |
| [API-0434](#api-0434) | POST /api/v1/posts/:id/publish                   | Missing auth      | P0      | Guest  | Đạt          |
| [API-0435](#api-0435) | POST /api/v1/posts/:id/publish                   | Invalid auth      | P0      | Admin  | Đạt          |
| [API-0436](#api-0436) | POST /api/v1/posts/:id/publish                   | Role denied       | P0      | User A | Đạt          |
| [API-0437](#api-0437) | POST /api/v1/posts/:id/publish                   | Missing target    | P1      | Admin  | Đạt          |
| [API-0438](#api-0438) | POST /api/v1/posts/:id/reject                    | Happy path        | P1      | Admin  | Đạt          |
| [API-0439](#api-0439) | POST /api/v1/posts/:id/reject                    | Missing auth      | P0      | Guest  | Đạt          |
| [API-0440](#api-0440) | POST /api/v1/posts/:id/reject                    | Invalid auth      | P0      | Admin  | Đạt          |
| [API-0441](#api-0441) | POST /api/v1/posts/:id/reject                    | Role denied       | P0      | User A | Đạt          |
| [API-0442](#api-0442) | POST /api/v1/posts/:id/reject                    | Missing target    | P1      | Admin  | Đạt          |
| [API-0443](#api-0443) | GET /api/v1/comments                             | Happy path        | P1      | Guest  | Đạt          |
| [API-0444](#api-0444) | GET /api/v1/comments                             | Empty result      | P2      | Guest  | Đạt          |
| [API-0445](#api-0445) | POST /api/v1/comments                            | Happy path        | P1      | User A | Đạt          |
| [API-0446](#api-0446) | POST /api/v1/comments                            | Missing auth      | P0      | Guest  | Đạt          |
| [API-0447](#api-0447) | POST /api/v1/comments                            | Invalid auth      | P0      | User A | Đạt          |
| [API-0448](#api-0448) | POST /api/v1/comments                            | Invalid payload   | P1      | User A | Đạt          |
| [API-0449](#api-0449) | PATCH /api/v1/comments/:id                       | Happy path        | P1      | User A | Đạt          |
| [API-0450](#api-0450) | PATCH /api/v1/comments/:id                       | Missing auth      | P0      | Guest  | Đạt          |
| [API-0451](#api-0451) | PATCH /api/v1/comments/:id                       | Invalid auth      | P0      | User A | Đạt          |
| [API-0452](#api-0452) | PATCH /api/v1/comments/:id                       | Cross-user access | P0      | User B | Đạt          |
| [API-0453](#api-0453) | PATCH /api/v1/comments/:id                       | Missing target    | P1      | User A | Đạt          |
| [API-0454](#api-0454) | PATCH /api/v1/comments/:id                       | Invalid payload   | P1      | User A | Đạt          |
| [API-0455](#api-0455) | DELETE /api/v1/comments/:id                      | Happy path        | P1      | User A | Đạt          |
| [API-0456](#api-0456) | DELETE /api/v1/comments/:id                      | Missing auth      | P0      | Guest  | Đạt          |
| [API-0457](#api-0457) | DELETE /api/v1/comments/:id                      | Invalid auth      | P0      | User A | Đạt          |
| [API-0458](#api-0458) | DELETE /api/v1/comments/:id                      | Cross-user access | P0      | User B | Đạt          |
| [API-0459](#api-0459) | DELETE /api/v1/comments/:id                      | Missing target    | P1      | User A | Đạt          |
| [API-0460](#api-0460) | PUT /api/v1/reactions/:targetType/:targetId      | Happy path        | P1      | User A | Đạt          |
| [API-0461](#api-0461) | PUT /api/v1/reactions/:targetType/:targetId      | Missing auth      | P0      | Guest  | Đạt          |
| [API-0462](#api-0462) | PUT /api/v1/reactions/:targetType/:targetId      | Invalid auth      | P0      | User A | Đạt          |
| [API-0463](#api-0463) | PUT /api/v1/reactions/:targetType/:targetId      | Invalid payload   | P1      | User A | Đạt          |
| [API-0464](#api-0464) | DELETE /api/v1/reactions/:targetType/:targetId   | Happy path        | P1      | User A | Đạt          |
| [API-0465](#api-0465) | DELETE /api/v1/reactions/:targetType/:targetId   | Missing auth      | P0      | Guest  | Đạt          |
| [API-0466](#api-0466) | DELETE /api/v1/reactions/:targetType/:targetId   | Invalid auth      | P0      | User A | Đạt          |
| [API-0467](#api-0467) | GET /api/v1/saved-items                          | Happy path        | P1      | User A | Đạt          |
| [API-0468](#api-0468) | GET /api/v1/saved-items                          | Missing auth      | P0      | Guest  | Đạt          |
| [API-0469](#api-0469) | GET /api/v1/saved-items                          | Invalid auth      | P0      | User A | Đạt          |
| [API-0470](#api-0470) | GET /api/v1/saved-items                          | Empty result      | P2      | User A | Đạt          |
| [API-0471](#api-0471) | PUT /api/v1/saved-items/:targetType/:targetId    | Happy path        | P1      | User A | Đạt          |
| [API-0472](#api-0472) | PUT /api/v1/saved-items/:targetType/:targetId    | Missing auth      | P0      | Guest  | Đạt          |
| [API-0473](#api-0473) | PUT /api/v1/saved-items/:targetType/:targetId    | Invalid auth      | P0      | User A | Đạt          |
| [API-0474](#api-0474) | PUT /api/v1/saved-items/:targetType/:targetId    | Invalid payload   | P1      | User A | Đạt          |
| [API-0475](#api-0475) | DELETE /api/v1/saved-items/:targetType/:targetId | Happy path        | P1      | User A | Đạt          |
| [API-0476](#api-0476) | DELETE /api/v1/saved-items/:targetType/:targetId | Missing auth      | P0      | Guest  | Đạt          |
| [API-0477](#api-0477) | DELETE /api/v1/saved-items/:targetType/:targetId | Invalid auth      | P0      | User A | Đạt          |

<a id="api-0405"></a>

### API-0405

**Chức năng:** GET /api/v1/posts

**Module:** Post, comment, reaction và saved item · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 406 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Post, comment, reaction và saved item; không gửi token; target đúng trạng thái cho Feed published/public.
```

**Dữ liệu test:**

```text
POST_A; title=Món chay hôm nay; content=Nội dung mẫu; postType=community
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/posts với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: Feed published/public; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0406"></a>

### API-0406

**Chức năng:** GET /api/v1/posts

**Module:** Post, comment, reaction và saved item · **Loại:** Empty result · **Ưu tiên:** P2 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 407 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Không có dữ liệu khớp filter hoặc user mới
```

**Dữ liệu test:**

```text
Filter hợp lệ không có kết quả
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/posts với filter rỗng kết quả.
2. Kiểm tra payload.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; list rỗng/tổng bằng 0 đúng schema; không lỗi 500 hoặc dữ liệu user khác.
```

<a id="api-0407"></a>

### API-0407

**Chức năng:** GET /api/v1/posts/mine

**Module:** Post, comment, reaction và saved item · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 408 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Post, comment, reaction và saved item; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Post/blog do mình tạo theo status/type.
```

**Dữ liệu test:**

```text
POST_A; title=Món chay hôm nay; content=Nội dung mẫu; postType=community
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/posts/mine với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: Post/blog do mình tạo theo status/type; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0408"></a>

### API-0408

**Chức năng:** GET /api/v1/posts/mine

**Module:** Post, comment, reaction và saved item · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 409 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Post, comment, reaction và saved item; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Post/blog do mình tạo theo status/type.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi GET /api/v1/posts/mine không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0409"></a>

### API-0409

**Chức năng:** GET /api/v1/posts/mine

**Module:** Post, comment, reaction và saved item · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 410 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Post, comment, reaction và saved item; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Post/blog do mình tạo theo status/type.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/posts/mine với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0410"></a>

### API-0410

**Chức năng:** GET /api/v1/posts/mine

**Module:** Post, comment, reaction và saved item · **Loại:** Empty result · **Ưu tiên:** P2 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 411 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Không có dữ liệu khớp filter hoặc user mới
```

**Dữ liệu test:**

```text
Filter hợp lệ không có kết quả
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/posts/mine với filter rỗng kết quả.
2. Kiểm tra payload.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; list rỗng/tổng bằng 0 đúng schema; không lỗi 500 hoặc dữ liệu user khác.
```

<a id="api-0411"></a>

### API-0411

**Chức năng:** GET /api/v1/posts/:id

**Module:** Post, comment, reaction và saved item · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 412 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Post, comment, reaction và saved item; không gửi token; target đúng trạng thái cho Chi tiết.
```

**Dữ liệu test:**

```text
POST_A; title=Món chay hôm nay; content=Nội dung mẫu; postType=community
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/posts/:id với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: Chi tiết; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0412"></a>

### API-0412

**Chức năng:** GET /api/v1/posts/:id

**Module:** Post, comment, reaction và saved item · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 413 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/posts/:id với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0413"></a>

### API-0413

**Chức năng:** POST /api/v1/posts

**Module:** Post, comment, reaction và saved item · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 414 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Post, comment, reaction và saved item; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Tạo draft.
```

**Dữ liệu test:**

```text
POST_A; title=Món chay hôm nay; content=Nội dung mẫu; postType=community
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi POST /api/v1/posts với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Tạo draft; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0414"></a>

### API-0414

**Chức năng:** POST /api/v1/posts

**Module:** Post, comment, reaction và saved item · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 415 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Post, comment, reaction và saved item; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Tạo draft.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi POST /api/v1/posts không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0415"></a>

### API-0415

**Chức năng:** POST /api/v1/posts

**Module:** Post, comment, reaction và saved item · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 416 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Post, comment, reaction và saved item; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Tạo draft.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/posts với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0416"></a>

### API-0416

**Chức năng:** POST /api/v1/posts

**Module:** Post, comment, reaction và saved item · **Loại:** Invalid payload · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 417 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Post, comment, reaction và saved item; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Tạo draft.
```

**Dữ liệu test:**

```text
Body chứa field bắt buộc rỗng/sai type; PATCH={} hoặc score=6/quantity=-1 khi áp dụng
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/posts với body sai schema.
2. Đối chiếu field error.
3. Xác minh DB giữ nguyên.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 400 VALIDATION_ERROR; details chỉ rõ field; không lưu dữ liệu sai.
```

<a id="api-0417"></a>

### API-0417

**Chức năng:** PATCH /api/v1/posts/:id

**Module:** Post, comment, reaction và saved item · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 418 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Post, comment, reaction và saved item; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Sửa.
```

**Dữ liệu test:**

```text
POST_A; title=Món chay hôm nay; content=Nội dung mẫu; postType=community
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi PATCH /api/v1/posts/:id với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Sửa; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0418"></a>

### API-0418

**Chức năng:** PATCH /api/v1/posts/:id

**Module:** Post, comment, reaction và saved item · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 419 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Post, comment, reaction và saved item; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Sửa.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi PATCH /api/v1/posts/:id không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0419"></a>

### API-0419

**Chức năng:** PATCH /api/v1/posts/:id

**Module:** Post, comment, reaction và saved item · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 420 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Post, comment, reaction và saved item; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Sửa.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/posts/:id với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0420"></a>

### API-0420

**Chức năng:** PATCH /api/v1/posts/:id

**Module:** Post, comment, reaction và saved item · **Loại:** Cross-user access · **Ưu tiên:** P0 · **Actor:** User B

**Nguồn Excel:** API Cases, hàng 421 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Target thuộc User A; User B có token hợp lệ
```

**Dữ liệu test:**

```text
POST_A (không thuộc B); title=Món chay hôm nay; content=Nội dung mẫu; postType=community
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/posts/:id với ID của User A và token B.
2. Kiểm tra response/DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403 hoặc 404 theo chính sách chống dò ID; không lộ dữ liệu A; không mutation.
```

<a id="api-0421"></a>

### API-0421

**Chức năng:** PATCH /api/v1/posts/:id

**Module:** Post, comment, reaction và saved item · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 422 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/posts/:id với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0422"></a>

### API-0422

**Chức năng:** PATCH /api/v1/posts/:id

**Module:** Post, comment, reaction và saved item · **Loại:** Invalid payload · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 423 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Post, comment, reaction và saved item; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Sửa.
```

**Dữ liệu test:**

```text
Body chứa field bắt buộc rỗng/sai type; PATCH={} hoặc score=6/quantity=-1 khi áp dụng
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/posts/:id với body sai schema.
2. Đối chiếu field error.
3. Xác minh DB giữ nguyên.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 400 VALIDATION_ERROR; details chỉ rõ field; không lưu dữ liệu sai.
```

<a id="api-0423"></a>

### API-0423

**Chức năng:** DELETE /api/v1/posts/:id

**Module:** Post, comment, reaction và saved item · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 424 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Post, comment, reaction và saved item; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Soft delete.
```

**Dữ liệu test:**

```text
POST_A; title=Món chay hôm nay; content=Nội dung mẫu; postType=community
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi DELETE /api/v1/posts/:id với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Soft delete; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0424"></a>

### API-0424

**Chức năng:** DELETE /api/v1/posts/:id

**Module:** Post, comment, reaction và saved item · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 425 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Post, comment, reaction và saved item; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Soft delete.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi DELETE /api/v1/posts/:id không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0425"></a>

### API-0425

**Chức năng:** DELETE /api/v1/posts/:id

**Module:** Post, comment, reaction và saved item · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 426 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Post, comment, reaction và saved item; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Soft delete.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi DELETE /api/v1/posts/:id với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0426"></a>

### API-0426

**Chức năng:** DELETE /api/v1/posts/:id

**Module:** Post, comment, reaction và saved item · **Loại:** Cross-user access · **Ưu tiên:** P0 · **Actor:** User B

**Nguồn Excel:** API Cases, hàng 427 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Target thuộc User A; User B có token hợp lệ
```

**Dữ liệu test:**

```text
POST_A (không thuộc B); title=Món chay hôm nay; content=Nội dung mẫu; postType=community
```

**Các bước thực hiện:**

```text
1. Gửi DELETE /api/v1/posts/:id với ID của User A và token B.
2. Kiểm tra response/DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403 hoặc 404 theo chính sách chống dò ID; không lộ dữ liệu A; không mutation.
```

<a id="api-0427"></a>

### API-0427

**Chức năng:** DELETE /api/v1/posts/:id

**Module:** Post, comment, reaction và saved item · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 428 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi DELETE /api/v1/posts/:id với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0428"></a>

### API-0428

**Chức năng:** POST /api/v1/posts/:id/submit

**Module:** Post, comment, reaction và saved item · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 429 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Post, comment, reaction và saved item; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Gửi duyệt.
```

**Dữ liệu test:**

```text
POST_A; title=Món chay hôm nay; content=Nội dung mẫu; postType=community
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi POST /api/v1/posts/:id/submit với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Gửi duyệt; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0429"></a>

### API-0429

**Chức năng:** POST /api/v1/posts/:id/submit

**Module:** Post, comment, reaction và saved item · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 430 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Post, comment, reaction và saved item; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Gửi duyệt.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi POST /api/v1/posts/:id/submit không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0430"></a>

### API-0430

**Chức năng:** POST /api/v1/posts/:id/submit

**Module:** Post, comment, reaction và saved item · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 431 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Post, comment, reaction và saved item; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Gửi duyệt.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/posts/:id/submit với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0431"></a>

### API-0431

**Chức năng:** POST /api/v1/posts/:id/submit

**Module:** Post, comment, reaction và saved item · **Loại:** Cross-user access · **Ưu tiên:** P0 · **Actor:** User B

**Nguồn Excel:** API Cases, hàng 432 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Target thuộc User A; User B có token hợp lệ
```

**Dữ liệu test:**

```text
POST_A (không thuộc B); title=Món chay hôm nay; content=Nội dung mẫu; postType=community
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/posts/:id/submit với ID của User A và token B.
2. Kiểm tra response/DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403 hoặc 404 theo chính sách chống dò ID; không lộ dữ liệu A; không mutation.
```

<a id="api-0432"></a>

### API-0432

**Chức năng:** POST /api/v1/posts/:id/submit

**Module:** Post, comment, reaction và saved item · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 433 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/posts/:id/submit với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0433"></a>

### API-0433

**Chức năng:** POST /api/v1/posts/:id/publish

**Module:** Post, comment, reaction và saved item · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 434 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Post, comment, reaction và saved item; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Publish.
```

**Dữ liệu test:**

```text
POST_A; title=Món chay hôm nay; content=Nội dung mẫu; postType=community
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi POST /api/v1/posts/:id/publish với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Publish; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0434"></a>

### API-0434

**Chức năng:** POST /api/v1/posts/:id/publish

**Module:** Post, comment, reaction và saved item · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 435 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Post, comment, reaction và saved item; Admin active, có Firebase token bị bỏ; target đúng trạng thái cho Publish.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi POST /api/v1/posts/:id/publish không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0435"></a>

### API-0435

**Chức năng:** POST /api/v1/posts/:id/publish

**Module:** Post, comment, reaction và saved item · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 436 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Post, comment, reaction và saved item; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Publish.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/posts/:id/publish với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0436"></a>

### API-0436

**Chức năng:** POST /api/v1/posts/:id/publish

**Module:** Post, comment, reaction và saved item · **Loại:** Role denied · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 437 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
User A active có role=user; target hợp lệ
```

**Dữ liệu test:**

```text
POST_A; title=Món chay hôm nay; content=Nội dung mẫu; postType=community
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/posts/:id/publish bằng token user.
2. Kiểm tra DB/audit.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403; không đọc admin data hoặc thực hiện mutation; không nâng quyền.
```

<a id="api-0437"></a>

### API-0437

**Chức năng:** POST /api/v1/posts/:id/publish

**Module:** Post, comment, reaction và saved item · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 438 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/posts/:id/publish với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0438"></a>

### API-0438

**Chức năng:** POST /api/v1/posts/:id/reject

**Module:** Post, comment, reaction và saved item · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 439 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Post, comment, reaction và saved item; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Reject có lý do.
```

**Dữ liệu test:**

```text
POST_A; title=Món chay hôm nay; content=Nội dung mẫu; postType=community
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi POST /api/v1/posts/:id/reject với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Reject có lý do; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0439"></a>

### API-0439

**Chức năng:** POST /api/v1/posts/:id/reject

**Module:** Post, comment, reaction và saved item · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 440 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Post, comment, reaction và saved item; Admin active, có Firebase token bị bỏ; target đúng trạng thái cho Reject có lý do.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi POST /api/v1/posts/:id/reject không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0440"></a>

### API-0440

**Chức năng:** POST /api/v1/posts/:id/reject

**Module:** Post, comment, reaction và saved item · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 441 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Post, comment, reaction và saved item; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Reject có lý do.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/posts/:id/reject với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0441"></a>

### API-0441

**Chức năng:** POST /api/v1/posts/:id/reject

**Module:** Post, comment, reaction và saved item · **Loại:** Role denied · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 442 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
User A active có role=user; target hợp lệ
```

**Dữ liệu test:**

```text
POST_A; title=Món chay hôm nay; content=Nội dung mẫu; postType=community
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/posts/:id/reject bằng token user.
2. Kiểm tra DB/audit.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403; không đọc admin data hoặc thực hiện mutation; không nâng quyền.
```

<a id="api-0442"></a>

### API-0442

**Chức năng:** POST /api/v1/posts/:id/reject

**Module:** Post, comment, reaction và saved item · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 443 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/posts/:id/reject với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0443"></a>

### API-0443

**Chức năng:** GET /api/v1/comments

**Module:** Post, comment, reaction và saved item · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 444 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Post, comment, reaction và saved item; không gửi token; target đúng trạng thái cho List theo target.
```

**Dữ liệu test:**

```text
{targetType:post,targetId:POST_PUBLIC,content:Bài viết hữu ích}
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/comments với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: List theo target; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0444"></a>

### API-0444

**Chức năng:** GET /api/v1/comments

**Module:** Post, comment, reaction và saved item · **Loại:** Empty result · **Ưu tiên:** P2 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 445 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Không có dữ liệu khớp filter hoặc user mới
```

**Dữ liệu test:**

```text
Filter hợp lệ không có kết quả
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/comments với filter rỗng kết quả.
2. Kiểm tra payload.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; list rỗng/tổng bằng 0 đúng schema; không lỗi 500 hoặc dữ liệu user khác.
```

<a id="api-0445"></a>

### API-0445

**Chức năng:** POST /api/v1/comments

**Module:** Post, comment, reaction và saved item · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 446 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Post, comment, reaction và saved item; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Tạo comment/reply.
```

**Dữ liệu test:**

```text
{targetType:post,targetId:POST_PUBLIC,content:Bài viết hữu ích}
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi POST /api/v1/comments với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Tạo comment/reply; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0446"></a>

### API-0446

**Chức năng:** POST /api/v1/comments

**Module:** Post, comment, reaction và saved item · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 447 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Post, comment, reaction và saved item; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Tạo comment/reply.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi POST /api/v1/comments không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0447"></a>

### API-0447

**Chức năng:** POST /api/v1/comments

**Module:** Post, comment, reaction và saved item · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 448 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Post, comment, reaction và saved item; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Tạo comment/reply.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/comments với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0448"></a>

### API-0448

**Chức năng:** POST /api/v1/comments

**Module:** Post, comment, reaction và saved item · **Loại:** Invalid payload · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 449 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Post, comment, reaction và saved item; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Tạo comment/reply.
```

**Dữ liệu test:**

```text
Body chứa field bắt buộc rỗng/sai type; PATCH={} hoặc score=6/quantity=-1 khi áp dụng
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/comments với body sai schema.
2. Đối chiếu field error.
3. Xác minh DB giữ nguyên.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 400 VALIDATION_ERROR; details chỉ rõ field; không lưu dữ liệu sai.
```

<a id="api-0449"></a>

### API-0449

**Chức năng:** PATCH /api/v1/comments/:id

**Module:** Post, comment, reaction và saved item · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 450 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Post, comment, reaction và saved item; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Sửa comment visible.
```

**Dữ liệu test:**

```text
{targetType:post,targetId:POST_PUBLIC,content:Bài viết hữu ích}
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi PATCH /api/v1/comments/:id với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Sửa comment visible; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0450"></a>

### API-0450

**Chức năng:** PATCH /api/v1/comments/:id

**Module:** Post, comment, reaction và saved item · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 451 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Post, comment, reaction và saved item; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Sửa comment visible.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi PATCH /api/v1/comments/:id không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0451"></a>

### API-0451

**Chức năng:** PATCH /api/v1/comments/:id

**Module:** Post, comment, reaction và saved item · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 452 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Post, comment, reaction và saved item; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Sửa comment visible.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/comments/:id với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0452"></a>

### API-0452

**Chức năng:** PATCH /api/v1/comments/:id

**Module:** Post, comment, reaction và saved item · **Loại:** Cross-user access · **Ưu tiên:** P0 · **Actor:** User B

**Nguồn Excel:** API Cases, hàng 453 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Target thuộc User A; User B có token hợp lệ
```

**Dữ liệu test:**

```text
{targetType:post,targetId:POST_PUBLIC,content:Bài viết hữu ích}
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/comments/:id với ID của User A và token B.
2. Kiểm tra response/DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403 hoặc 404 theo chính sách chống dò ID; không lộ dữ liệu A; không mutation.
```

<a id="api-0453"></a>

### API-0453

**Chức năng:** PATCH /api/v1/comments/:id

**Module:** Post, comment, reaction và saved item · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 454 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/comments/:id với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0454"></a>

### API-0454

**Chức năng:** PATCH /api/v1/comments/:id

**Module:** Post, comment, reaction và saved item · **Loại:** Invalid payload · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 455 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Post, comment, reaction và saved item; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Sửa comment visible.
```

**Dữ liệu test:**

```text
Body chứa field bắt buộc rỗng/sai type; PATCH={} hoặc score=6/quantity=-1 khi áp dụng
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/comments/:id với body sai schema.
2. Đối chiếu field error.
3. Xác minh DB giữ nguyên.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 400 VALIDATION_ERROR; details chỉ rõ field; không lưu dữ liệu sai.
```

<a id="api-0455"></a>

### API-0455

**Chức năng:** DELETE /api/v1/comments/:id

**Module:** Post, comment, reaction và saved item · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 456 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Post, comment, reaction và saved item; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Soft delete.
```

**Dữ liệu test:**

```text
{targetType:post,targetId:POST_PUBLIC,content:Bài viết hữu ích}
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi DELETE /api/v1/comments/:id với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Soft delete; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0456"></a>

### API-0456

**Chức năng:** DELETE /api/v1/comments/:id

**Module:** Post, comment, reaction và saved item · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 457 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Post, comment, reaction và saved item; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Soft delete.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi DELETE /api/v1/comments/:id không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0457"></a>

### API-0457

**Chức năng:** DELETE /api/v1/comments/:id

**Module:** Post, comment, reaction và saved item · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 458 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Post, comment, reaction và saved item; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Soft delete.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi DELETE /api/v1/comments/:id với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0458"></a>

### API-0458

**Chức năng:** DELETE /api/v1/comments/:id

**Module:** Post, comment, reaction và saved item · **Loại:** Cross-user access · **Ưu tiên:** P0 · **Actor:** User B

**Nguồn Excel:** API Cases, hàng 459 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Target thuộc User A; User B có token hợp lệ
```

**Dữ liệu test:**

```text
{targetType:post,targetId:POST_PUBLIC,content:Bài viết hữu ích}
```

**Các bước thực hiện:**

```text
1. Gửi DELETE /api/v1/comments/:id với ID của User A và token B.
2. Kiểm tra response/DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403 hoặc 404 theo chính sách chống dò ID; không lộ dữ liệu A; không mutation.
```

<a id="api-0459"></a>

### API-0459

**Chức năng:** DELETE /api/v1/comments/:id

**Module:** Post, comment, reaction và saved item · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 460 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi DELETE /api/v1/comments/:id với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0460"></a>

### API-0460

**Chức năng:** PUT /api/v1/reactions/:targetType/:targetId

**Module:** Post, comment, reaction và saved item · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 461 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Post, comment, reaction và saved item; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Upsert reaction.
```

**Dữ liệu test:**

```text
{type:like}
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi PUT /api/v1/reactions/:targetType/:targetId với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Upsert reaction; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0461"></a>

### API-0461

**Chức năng:** PUT /api/v1/reactions/:targetType/:targetId

**Module:** Post, comment, reaction và saved item · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 462 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Post, comment, reaction và saved item; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Upsert reaction.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi PUT /api/v1/reactions/:targetType/:targetId không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0462"></a>

### API-0462

**Chức năng:** PUT /api/v1/reactions/:targetType/:targetId

**Module:** Post, comment, reaction và saved item · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 463 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Post, comment, reaction và saved item; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Upsert reaction.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi PUT /api/v1/reactions/:targetType/:targetId với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0463"></a>

### API-0463

**Chức năng:** PUT /api/v1/reactions/:targetType/:targetId

**Module:** Post, comment, reaction và saved item · **Loại:** Invalid payload · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 464 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Post, comment, reaction và saved item; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Upsert reaction.
```

**Dữ liệu test:**

```text
Body chứa field bắt buộc rỗng/sai type; PATCH={} hoặc score=6/quantity=-1 khi áp dụng
```

**Các bước thực hiện:**

```text
1. Gửi PUT /api/v1/reactions/:targetType/:targetId với body sai schema.
2. Đối chiếu field error.
3. Xác minh DB giữ nguyên.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 400 VALIDATION_ERROR; details chỉ rõ field; không lưu dữ liệu sai.
```

<a id="api-0464"></a>

### API-0464

**Chức năng:** DELETE /api/v1/reactions/:targetType/:targetId

**Module:** Post, comment, reaction và saved item · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 465 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Post, comment, reaction và saved item; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Bỏ reaction.
```

**Dữ liệu test:**

```text
{type:like}
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi DELETE /api/v1/reactions/:targetType/:targetId với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Bỏ reaction; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0465"></a>

### API-0465

**Chức năng:** DELETE /api/v1/reactions/:targetType/:targetId

**Module:** Post, comment, reaction và saved item · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 466 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Post, comment, reaction và saved item; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Bỏ reaction.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi DELETE /api/v1/reactions/:targetType/:targetId không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0466"></a>

### API-0466

**Chức năng:** DELETE /api/v1/reactions/:targetType/:targetId

**Module:** Post, comment, reaction và saved item · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 467 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Post, comment, reaction và saved item; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Bỏ reaction.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi DELETE /api/v1/reactions/:targetType/:targetId với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0467"></a>

### API-0467

**Chức năng:** GET /api/v1/saved-items

**Module:** Post, comment, reaction và saved item · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 468 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Post, comment, reaction và saved item; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Danh sách đã lưu.
```

**Dữ liệu test:**

```text
Fixture đúng schema OpenAPI; ID User A/target A; page=1,limit=20 cho list; reason=kiểm tra khi moderation
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/saved-items với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: Danh sách đã lưu; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0468"></a>

### API-0468

**Chức năng:** GET /api/v1/saved-items

**Module:** Post, comment, reaction và saved item · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 469 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Post, comment, reaction và saved item; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Danh sách đã lưu.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi GET /api/v1/saved-items không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0469"></a>

### API-0469

**Chức năng:** GET /api/v1/saved-items

**Module:** Post, comment, reaction và saved item · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 470 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Post, comment, reaction và saved item; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Danh sách đã lưu.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/saved-items với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0470"></a>

### API-0470

**Chức năng:** GET /api/v1/saved-items

**Module:** Post, comment, reaction và saved item · **Loại:** Empty result · **Ưu tiên:** P2 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 471 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Không có dữ liệu khớp filter hoặc user mới
```

**Dữ liệu test:**

```text
Filter hợp lệ không có kết quả
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/saved-items với filter rỗng kết quả.
2. Kiểm tra payload.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; list rỗng/tổng bằng 0 đúng schema; không lỗi 500 hoặc dữ liệu user khác.
```

<a id="api-0471"></a>

### API-0471

**Chức năng:** PUT /api/v1/saved-items/:targetType/:targetId

**Module:** Post, comment, reaction và saved item · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 472 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Post, comment, reaction và saved item; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Lưu idempotent.
```

**Dữ liệu test:**

```text
Fixture đúng schema OpenAPI; ID User A/target A; page=1,limit=20 cho list; reason=kiểm tra khi moderation
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi PUT /api/v1/saved-items/:targetType/:targetId với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Lưu idempotent; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0472"></a>

### API-0472

**Chức năng:** PUT /api/v1/saved-items/:targetType/:targetId

**Module:** Post, comment, reaction và saved item · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 473 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Post, comment, reaction và saved item; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Lưu idempotent.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi PUT /api/v1/saved-items/:targetType/:targetId không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0473"></a>

### API-0473

**Chức năng:** PUT /api/v1/saved-items/:targetType/:targetId

**Module:** Post, comment, reaction và saved item · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 474 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Post, comment, reaction và saved item; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Lưu idempotent.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi PUT /api/v1/saved-items/:targetType/:targetId với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0474"></a>

### API-0474

**Chức năng:** PUT /api/v1/saved-items/:targetType/:targetId

**Module:** Post, comment, reaction và saved item · **Loại:** Invalid payload · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 475 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Post, comment, reaction và saved item; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Lưu idempotent.
```

**Dữ liệu test:**

```text
Body chứa field bắt buộc rỗng/sai type; PATCH={} hoặc score=6/quantity=-1 khi áp dụng
```

**Các bước thực hiện:**

```text
1. Gửi PUT /api/v1/saved-items/:targetType/:targetId với body sai schema.
2. Đối chiếu field error.
3. Xác minh DB giữ nguyên.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 400 VALIDATION_ERROR; details chỉ rõ field; không lưu dữ liệu sai.
```

<a id="api-0475"></a>

### API-0475

**Chức năng:** DELETE /api/v1/saved-items/:targetType/:targetId

**Module:** Post, comment, reaction và saved item · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 476 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Post, comment, reaction và saved item; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Bỏ lưu idempotent.
```

**Dữ liệu test:**

```text
Fixture đúng schema OpenAPI; ID User A/target A; page=1,limit=20 cho list; reason=kiểm tra khi moderation
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi DELETE /api/v1/saved-items/:targetType/:targetId với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Bỏ lưu idempotent; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0476"></a>

### API-0476

**Chức năng:** DELETE /api/v1/saved-items/:targetType/:targetId

**Module:** Post, comment, reaction và saved item · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 477 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Post, comment, reaction và saved item; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Bỏ lưu idempotent.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi DELETE /api/v1/saved-items/:targetType/:targetId không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0477"></a>

### API-0477

**Chức năng:** DELETE /api/v1/saved-items/:targetType/:targetId

**Module:** Post, comment, reaction và saved item · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 478 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Post, comment, reaction và saved item; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Bỏ lưu idempotent.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi DELETE /api/v1/saved-items/:targetType/:targetId với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="module-13"></a>

## AI

| ID                    | Chức năng / endpoint                                    | Loại test         | Ưu tiên | Actor  | Kết quả chạy |
| --------------------- | ------------------------------------------------------- | ----------------- | ------- | ------ | ------------ |
| [API-0478](#api-0478) | GET /api/v1/ai/conversations                            | Happy path        | P1      | User A | Đạt          |
| [API-0479](#api-0479) | GET /api/v1/ai/conversations                            | Missing auth      | P0      | Guest  | Đạt          |
| [API-0480](#api-0480) | GET /api/v1/ai/conversations                            | Invalid auth      | P0      | User A | Đạt          |
| [API-0481](#api-0481) | GET /api/v1/ai/conversations                            | Empty result      | P2      | User A | Đạt          |
| [API-0482](#api-0482) | POST /api/v1/ai/conversations                           | Happy path        | P1      | User A | Đạt          |
| [API-0483](#api-0483) | POST /api/v1/ai/conversations                           | Missing auth      | P0      | Guest  | Đạt          |
| [API-0484](#api-0484) | POST /api/v1/ai/conversations                           | Invalid auth      | P0      | User A | Đạt          |
| [API-0485](#api-0485) | POST /api/v1/ai/conversations                           | Invalid payload   | P1      | User A | Đạt          |
| [API-0486](#api-0486) | GET /api/v1/ai/conversations/:id/messages               | Happy path        | P1      | User A | Đạt          |
| [API-0487](#api-0487) | GET /api/v1/ai/conversations/:id/messages               | Missing auth      | P0      | Guest  | Đạt          |
| [API-0488](#api-0488) | GET /api/v1/ai/conversations/:id/messages               | Invalid auth      | P0      | User A | Đạt          |
| [API-0489](#api-0489) | GET /api/v1/ai/conversations/:id/messages               | Cross-user access | P0      | User B | Đạt          |
| [API-0490](#api-0490) | GET /api/v1/ai/conversations/:id/messages               | Missing target    | P1      | User A | Đạt          |
| [API-0491](#api-0491) | POST /api/v1/ai/conversations/:id/messages              | Happy path        | P1      | User A | Đạt          |
| [API-0492](#api-0492) | POST /api/v1/ai/conversations/:id/messages              | Missing auth      | P0      | Guest  | Đạt          |
| [API-0493](#api-0493) | POST /api/v1/ai/conversations/:id/messages              | Invalid auth      | P0      | User A | Đạt          |
| [API-0494](#api-0494) | POST /api/v1/ai/conversations/:id/messages              | Cross-user access | P0      | User B | Đạt          |
| [API-0495](#api-0495) | POST /api/v1/ai/conversations/:id/messages              | Missing target    | P1      | User A | Đạt          |
| [API-0496](#api-0496) | POST /api/v1/ai/conversations/:id/messages              | Invalid payload   | P1      | User A | Đạt          |
| [API-0497](#api-0497) | POST /api/v1/ai/meal-plan-proposals                     | Happy path        | P1      | User A | Đạt          |
| [API-0498](#api-0498) | POST /api/v1/ai/meal-plan-proposals                     | Missing auth      | P0      | Guest  | Đạt          |
| [API-0499](#api-0499) | POST /api/v1/ai/meal-plan-proposals                     | Invalid auth      | P0      | User A | Đạt          |
| [API-0500](#api-0500) | POST /api/v1/ai/meal-plan-proposals                     | Invalid payload   | P1      | User A | Đạt          |
| [API-0501](#api-0501) | POST /api/v1/ai/meal-plan-proposals/:proposalId/confirm | Happy path        | P1      | User A | Đạt          |
| [API-0502](#api-0502) | POST /api/v1/ai/meal-plan-proposals/:proposalId/confirm | Missing auth      | P0      | Guest  | Đạt          |
| [API-0503](#api-0503) | POST /api/v1/ai/meal-plan-proposals/:proposalId/confirm | Invalid auth      | P0      | User A | Đạt          |
| [API-0504](#api-0504) | POST /api/v1/ai/meal-plan-proposals/:proposalId/confirm | Cross-user access | P0      | User B | Đạt          |
| [API-0505](#api-0505) | POST /api/v1/ai/meal-plan-proposals/:proposalId/confirm | Missing target    | P1      | User A | Đạt          |
| [API-0506](#api-0506) | POST /api/v1/ai/ingredient-recognition                  | Happy path        | P1      | User A | Đạt          |
| [API-0507](#api-0507) | POST /api/v1/ai/ingredient-recognition                  | Missing auth      | P0      | Guest  | Đạt          |
| [API-0508](#api-0508) | POST /api/v1/ai/ingredient-recognition                  | Invalid auth      | P0      | User A | Đạt          |
| [API-0509](#api-0509) | POST /api/v1/ai/ingredient-recognition                  | Invalid payload   | P1      | User A | Đạt          |
| [API-0510](#api-0510) | POST /api/v1/ai/pantry-proposals/:proposalId/confirm    | Happy path        | P1      | User A | Đạt          |
| [API-0511](#api-0511) | POST /api/v1/ai/pantry-proposals/:proposalId/confirm    | Missing auth      | P0      | Guest  | Đạt          |
| [API-0512](#api-0512) | POST /api/v1/ai/pantry-proposals/:proposalId/confirm    | Invalid auth      | P0      | User A | Đạt          |
| [API-0513](#api-0513) | POST /api/v1/ai/pantry-proposals/:proposalId/confirm    | Cross-user access | P0      | User B | Đạt          |
| [API-0514](#api-0514) | POST /api/v1/ai/pantry-proposals/:proposalId/confirm    | Missing target    | P1      | User A | Đạt          |
| [API-0515](#api-0515) | POST /api/v1/ai/video-summaries                         | Happy path        | P1      | User A | Đạt          |
| [API-0516](#api-0516) | POST /api/v1/ai/video-summaries                         | Missing auth      | P0      | Guest  | Đạt          |
| [API-0517](#api-0517) | POST /api/v1/ai/video-summaries                         | Invalid auth      | P0      | User A | Đạt          |
| [API-0518](#api-0518) | POST /api/v1/ai/video-summaries                         | Invalid payload   | P1      | User A | Đạt          |
| [API-0519](#api-0519) | PUT /api/v1/ai/runs/:runId/feedback                     | Happy path        | P1      | User A | Đạt          |
| [API-0520](#api-0520) | PUT /api/v1/ai/runs/:runId/feedback                     | Missing auth      | P0      | Guest  | Đạt          |
| [API-0521](#api-0521) | PUT /api/v1/ai/runs/:runId/feedback                     | Invalid auth      | P0      | User A | Đạt          |
| [API-0522](#api-0522) | PUT /api/v1/ai/runs/:runId/feedback                     | Cross-user access | P0      | User B | Đạt          |
| [API-0523](#api-0523) | PUT /api/v1/ai/runs/:runId/feedback                     | Missing target    | P1      | User A | Đạt          |
| [API-0524](#api-0524) | PUT /api/v1/ai/runs/:runId/feedback                     | Invalid payload   | P1      | User A | Đạt          |

<a id="api-0478"></a>

### API-0478

**Chức năng:** GET /api/v1/ai/conversations

**Module:** AI · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 479 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho AI; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Danh sách conversation.
```

**Dữ liệu test:**

```text
CONVERSATION_A / PROPOSAL_A / RUN_A; content=Gợi ý bữa chay giàu protein; mediaId=MEDIA_READY khi nhận diện
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/ai/conversations với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: Danh sách conversation; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0479"></a>

### API-0479

**Chức năng:** GET /api/v1/ai/conversations

**Module:** AI · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 480 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho AI; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Danh sách conversation.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi GET /api/v1/ai/conversations không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0480"></a>

### API-0480

**Chức năng:** GET /api/v1/ai/conversations

**Module:** AI · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 481 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho AI; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Danh sách conversation.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/ai/conversations với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0481"></a>

### API-0481

**Chức năng:** GET /api/v1/ai/conversations

**Module:** AI · **Loại:** Empty result · **Ưu tiên:** P2 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 482 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Không có dữ liệu khớp filter hoặc user mới
```

**Dữ liệu test:**

```text
Filter hợp lệ không có kết quả
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/ai/conversations với filter rỗng kết quả.
2. Kiểm tra payload.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; list rỗng/tổng bằng 0 đúng schema; không lỗi 500 hoặc dữ liệu user khác.
```

<a id="api-0482"></a>

### API-0482

**Chức năng:** POST /api/v1/ai/conversations

**Module:** AI · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 483 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho AI; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Tạo conversation.
```

**Dữ liệu test:**

```text
CONVERSATION_A / PROPOSAL_A / RUN_A; content=Gợi ý bữa chay giàu protein; mediaId=MEDIA_READY khi nhận diện
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi POST /api/v1/ai/conversations với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Tạo conversation; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0483"></a>

### API-0483

**Chức năng:** POST /api/v1/ai/conversations

**Module:** AI · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 484 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho AI; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Tạo conversation.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi POST /api/v1/ai/conversations không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0484"></a>

### API-0484

**Chức năng:** POST /api/v1/ai/conversations

**Module:** AI · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 485 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho AI; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Tạo conversation.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/ai/conversations với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0485"></a>

### API-0485

**Chức năng:** POST /api/v1/ai/conversations

**Module:** AI · **Loại:** Invalid payload · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 486 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho AI; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Tạo conversation.
```

**Dữ liệu test:**

```text
Body chứa field bắt buộc rỗng/sai type; PATCH={} hoặc score=6/quantity=-1 khi áp dụng
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/ai/conversations với body sai schema.
2. Đối chiếu field error.
3. Xác minh DB giữ nguyên.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 400 VALIDATION_ERROR; details chỉ rõ field; không lưu dữ liệu sai.
```

<a id="api-0486"></a>

### API-0486

**Chức năng:** GET /api/v1/ai/conversations/:id/messages

**Module:** AI · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 487 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho AI; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Lịch sử message.
```

**Dữ liệu test:**

```text
CONVERSATION_A / PROPOSAL_A / RUN_A; content=Gợi ý bữa chay giàu protein; mediaId=MEDIA_READY khi nhận diện
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/ai/conversations/:id/messages với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: Lịch sử message; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0487"></a>

### API-0487

**Chức năng:** GET /api/v1/ai/conversations/:id/messages

**Module:** AI · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 488 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho AI; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Lịch sử message.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi GET /api/v1/ai/conversations/:id/messages không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0488"></a>

### API-0488

**Chức năng:** GET /api/v1/ai/conversations/:id/messages

**Module:** AI · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 489 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho AI; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Lịch sử message.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/ai/conversations/:id/messages với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0489"></a>

### API-0489

**Chức năng:** GET /api/v1/ai/conversations/:id/messages

**Module:** AI · **Loại:** Cross-user access · **Ưu tiên:** P0 · **Actor:** User B

**Nguồn Excel:** API Cases, hàng 490 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Target thuộc User A; User B có token hợp lệ
```

**Dữ liệu test:**

```text
CONVERSATION_A (không thuộc B) / PROPOSAL_A (không thuộc B) / RUN_A (không thuộc B); content=Gợi ý bữa chay giàu protein; mediaId=MEDIA_READY khi nhận diện
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/ai/conversations/:id/messages với ID của User A và token B.
2. Kiểm tra response/DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403 hoặc 404 theo chính sách chống dò ID; không lộ dữ liệu A; không mutation.
```

<a id="api-0490"></a>

### API-0490

**Chức năng:** GET /api/v1/ai/conversations/:id/messages

**Module:** AI · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 491 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/ai/conversations/:id/messages với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0491"></a>

### API-0491

**Chức năng:** POST /api/v1/ai/conversations/:id/messages

**Module:** AI · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 492 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho AI; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Hỏi trợ lý dinh dưỡng/ẩm thực.
```

**Dữ liệu test:**

```text
CONVERSATION_A / PROPOSAL_A / RUN_A; content=Gợi ý bữa chay giàu protein; mediaId=MEDIA_READY khi nhận diện
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi POST /api/v1/ai/conversations/:id/messages với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Hỏi trợ lý dinh dưỡng/ẩm thực; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0492"></a>

### API-0492

**Chức năng:** POST /api/v1/ai/conversations/:id/messages

**Module:** AI · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 493 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho AI; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Hỏi trợ lý dinh dưỡng/ẩm thực.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi POST /api/v1/ai/conversations/:id/messages không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0493"></a>

### API-0493

**Chức năng:** POST /api/v1/ai/conversations/:id/messages

**Module:** AI · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 494 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho AI; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Hỏi trợ lý dinh dưỡng/ẩm thực.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/ai/conversations/:id/messages với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0494"></a>

### API-0494

**Chức năng:** POST /api/v1/ai/conversations/:id/messages

**Module:** AI · **Loại:** Cross-user access · **Ưu tiên:** P0 · **Actor:** User B

**Nguồn Excel:** API Cases, hàng 495 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Target thuộc User A; User B có token hợp lệ
```

**Dữ liệu test:**

```text
CONVERSATION_A (không thuộc B) / PROPOSAL_A (không thuộc B) / RUN_A (không thuộc B); content=Gợi ý bữa chay giàu protein; mediaId=MEDIA_READY khi nhận diện
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/ai/conversations/:id/messages với ID của User A và token B.
2. Kiểm tra response/DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403 hoặc 404 theo chính sách chống dò ID; không lộ dữ liệu A; không mutation.
```

<a id="api-0495"></a>

### API-0495

**Chức năng:** POST /api/v1/ai/conversations/:id/messages

**Module:** AI · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 496 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/ai/conversations/:id/messages với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0496"></a>

### API-0496

**Chức năng:** POST /api/v1/ai/conversations/:id/messages

**Module:** AI · **Loại:** Invalid payload · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 497 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho AI; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Hỏi trợ lý dinh dưỡng/ẩm thực.
```

**Dữ liệu test:**

```text
Body chứa field bắt buộc rỗng/sai type; PATCH={} hoặc score=6/quantity=-1 khi áp dụng
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/ai/conversations/:id/messages với body sai schema.
2. Đối chiếu field error.
3. Xác minh DB giữ nguyên.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 400 VALIDATION_ERROR; details chỉ rõ field; không lưu dữ liệu sai.
```

<a id="api-0497"></a>

### API-0497

**Chức năng:** POST /api/v1/ai/meal-plan-proposals

**Module:** AI · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 498 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho AI; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Sinh đề xuất meal plan có cấu trúc.
```

**Dữ liệu test:**

```text
PLAN_A tuần 2026-10-05; meals: RECIPE_A, servings=2; proposalId=PROPOSAL_A nếu confirm
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi POST /api/v1/ai/meal-plan-proposals với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Sinh đề xuất meal plan có cấu trúc; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0498"></a>

### API-0498

**Chức năng:** POST /api/v1/ai/meal-plan-proposals

**Module:** AI · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 499 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho AI; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Sinh đề xuất meal plan có cấu trúc.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi POST /api/v1/ai/meal-plan-proposals không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0499"></a>

### API-0499

**Chức năng:** POST /api/v1/ai/meal-plan-proposals

**Module:** AI · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 500 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho AI; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Sinh đề xuất meal plan có cấu trúc.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/ai/meal-plan-proposals với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0500"></a>

### API-0500

**Chức năng:** POST /api/v1/ai/meal-plan-proposals

**Module:** AI · **Loại:** Invalid payload · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 501 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho AI; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Sinh đề xuất meal plan có cấu trúc.
```

**Dữ liệu test:**

```text
Body chứa field bắt buộc rỗng/sai type; PATCH={} hoặc score=6/quantity=-1 khi áp dụng
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/ai/meal-plan-proposals với body sai schema.
2. Đối chiếu field error.
3. Xác minh DB giữ nguyên.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 400 VALIDATION_ERROR; details chỉ rõ field; không lưu dữ liệu sai.
```

<a id="api-0501"></a>

### API-0501

**Chức năng:** POST /api/v1/ai/meal-plan-proposals/:proposalId/confirm

**Module:** AI · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 502 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho AI; User A active, có Firebase token hợp lệ; target đúng trạng thái cho User xác nhận rồi mới tạo/kích hoạt plan.
```

**Dữ liệu test:**

```text
PLAN_A tuần 2026-10-05; meals: RECIPE_A, servings=2; proposalId=PROPOSAL_A nếu confirm
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi POST /api/v1/ai/meal-plan-proposals/:proposalId/confirm với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); User xác nhận rồi mới tạo/kích hoạt plan; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0502"></a>

### API-0502

**Chức năng:** POST /api/v1/ai/meal-plan-proposals/:proposalId/confirm

**Module:** AI · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 503 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho AI; User A active, có Firebase token bị bỏ; target đúng trạng thái cho User xác nhận rồi mới tạo/kích hoạt plan.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi POST /api/v1/ai/meal-plan-proposals/:proposalId/confirm không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0503"></a>

### API-0503

**Chức năng:** POST /api/v1/ai/meal-plan-proposals/:proposalId/confirm

**Module:** AI · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 504 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho AI; User A active, có Firebase token hợp lệ; target đúng trạng thái cho User xác nhận rồi mới tạo/kích hoạt plan.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/ai/meal-plan-proposals/:proposalId/confirm với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0504"></a>

### API-0504

**Chức năng:** POST /api/v1/ai/meal-plan-proposals/:proposalId/confirm

**Module:** AI · **Loại:** Cross-user access · **Ưu tiên:** P0 · **Actor:** User B

**Nguồn Excel:** API Cases, hàng 505 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Target thuộc User A; User B có token hợp lệ
```

**Dữ liệu test:**

```text
PLAN_A (không thuộc B) tuần 2026-10-05; meals: RECIPE_A (không thuộc B), servings=2; proposalId=PROPOSAL_A (không thuộc B) nếu confirm
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/ai/meal-plan-proposals/:proposalId/confirm với ID của User A và token B.
2. Kiểm tra response/DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403 hoặc 404 theo chính sách chống dò ID; không lộ dữ liệu A; không mutation.
```

<a id="api-0505"></a>

### API-0505

**Chức năng:** POST /api/v1/ai/meal-plan-proposals/:proposalId/confirm

**Module:** AI · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 506 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/ai/meal-plan-proposals/:proposalId/confirm với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0506"></a>

### API-0506

**Chức năng:** POST /api/v1/ai/ingredient-recognition

**Module:** AI · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 507 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho AI; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Nhận diện nguyên liệu từ media ready.
```

**Dữ liệu test:**

```text
CONVERSATION_A / PROPOSAL_A / RUN_A; content=Gợi ý bữa chay giàu protein; mediaId=MEDIA_READY khi nhận diện
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi POST /api/v1/ai/ingredient-recognition với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Nhận diện nguyên liệu từ media ready; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0507"></a>

### API-0507

**Chức năng:** POST /api/v1/ai/ingredient-recognition

**Module:** AI · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 508 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho AI; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Nhận diện nguyên liệu từ media ready.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi POST /api/v1/ai/ingredient-recognition không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0508"></a>

### API-0508

**Chức năng:** POST /api/v1/ai/ingredient-recognition

**Module:** AI · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 509 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho AI; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Nhận diện nguyên liệu từ media ready.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/ai/ingredient-recognition với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0509"></a>

### API-0509

**Chức năng:** POST /api/v1/ai/ingredient-recognition

**Module:** AI · **Loại:** Invalid payload · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 510 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho AI; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Nhận diện nguyên liệu từ media ready.
```

**Dữ liệu test:**

```text
Body chứa field bắt buộc rỗng/sai type; PATCH={} hoặc score=6/quantity=-1 khi áp dụng
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/ai/ingredient-recognition với body sai schema.
2. Đối chiếu field error.
3. Xác minh DB giữ nguyên.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 400 VALIDATION_ERROR; details chỉ rõ field; không lưu dữ liệu sai.
```

<a id="api-0510"></a>

### API-0510

**Chức năng:** POST /api/v1/ai/pantry-proposals/:proposalId/confirm

**Module:** AI · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 511 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho AI; User A active, có Firebase token hợp lệ; target đúng trạng thái cho User xác nhận rồi mới thêm pantry.
```

**Dữ liệu test:**

```text
CONVERSATION_A / PROPOSAL_A / RUN_A; content=Gợi ý bữa chay giàu protein; mediaId=MEDIA_READY khi nhận diện
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi POST /api/v1/ai/pantry-proposals/:proposalId/confirm với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); User xác nhận rồi mới thêm pantry; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0511"></a>

### API-0511

**Chức năng:** POST /api/v1/ai/pantry-proposals/:proposalId/confirm

**Module:** AI · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 512 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho AI; User A active, có Firebase token bị bỏ; target đúng trạng thái cho User xác nhận rồi mới thêm pantry.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi POST /api/v1/ai/pantry-proposals/:proposalId/confirm không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0512"></a>

### API-0512

**Chức năng:** POST /api/v1/ai/pantry-proposals/:proposalId/confirm

**Module:** AI · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 513 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho AI; User A active, có Firebase token hợp lệ; target đúng trạng thái cho User xác nhận rồi mới thêm pantry.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/ai/pantry-proposals/:proposalId/confirm với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0513"></a>

### API-0513

**Chức năng:** POST /api/v1/ai/pantry-proposals/:proposalId/confirm

**Module:** AI · **Loại:** Cross-user access · **Ưu tiên:** P0 · **Actor:** User B

**Nguồn Excel:** API Cases, hàng 514 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Target thuộc User A; User B có token hợp lệ
```

**Dữ liệu test:**

```text
CONVERSATION_A (không thuộc B) / PROPOSAL_A (không thuộc B) / RUN_A (không thuộc B); content=Gợi ý bữa chay giàu protein; mediaId=MEDIA_READY khi nhận diện
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/ai/pantry-proposals/:proposalId/confirm với ID của User A và token B.
2. Kiểm tra response/DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403 hoặc 404 theo chính sách chống dò ID; không lộ dữ liệu A; không mutation.
```

<a id="api-0514"></a>

### API-0514

**Chức năng:** POST /api/v1/ai/pantry-proposals/:proposalId/confirm

**Module:** AI · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 515 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/ai/pantry-proposals/:proposalId/confirm với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0515"></a>

### API-0515

**Chức năng:** POST /api/v1/ai/video-summaries

**Module:** AI · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 516 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho AI; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Tóm tắt/transcript từ media video nếu provider hỗ trợ.
```

**Dữ liệu test:**

```text
CONVERSATION_A / PROPOSAL_A / RUN_A; content=Gợi ý bữa chay giàu protein; mediaId=MEDIA_READY khi nhận diện
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi POST /api/v1/ai/video-summaries với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Tóm tắt/transcript từ media video nếu provider hỗ trợ; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0516"></a>

### API-0516

**Chức năng:** POST /api/v1/ai/video-summaries

**Module:** AI · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 517 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho AI; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Tóm tắt/transcript từ media video nếu provider hỗ trợ.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi POST /api/v1/ai/video-summaries không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0517"></a>

### API-0517

**Chức năng:** POST /api/v1/ai/video-summaries

**Module:** AI · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 518 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho AI; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Tóm tắt/transcript từ media video nếu provider hỗ trợ.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/ai/video-summaries với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0518"></a>

### API-0518

**Chức năng:** POST /api/v1/ai/video-summaries

**Module:** AI · **Loại:** Invalid payload · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 519 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho AI; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Tóm tắt/transcript từ media video nếu provider hỗ trợ.
```

**Dữ liệu test:**

```text
Body chứa field bắt buộc rỗng/sai type; PATCH={} hoặc score=6/quantity=-1 khi áp dụng
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/ai/video-summaries với body sai schema.
2. Đối chiếu field error.
3. Xác minh DB giữ nguyên.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 400 VALIDATION_ERROR; details chỉ rõ field; không lưu dữ liệu sai.
```

<a id="api-0519"></a>

### API-0519

**Chức năng:** PUT /api/v1/ai/runs/:runId/feedback

**Module:** AI · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 520 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho AI; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Upsert helpful/not-helpful feedback cho AI result của mình.
```

**Dữ liệu test:**

```text
CONVERSATION_A / PROPOSAL_A / RUN_A; content=Gợi ý bữa chay giàu protein; mediaId=MEDIA_READY khi nhận diện
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi PUT /api/v1/ai/runs/:runId/feedback với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Upsert helpful/not-helpful feedback cho AI result của mình; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0520"></a>

### API-0520

**Chức năng:** PUT /api/v1/ai/runs/:runId/feedback

**Module:** AI · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 521 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho AI; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Upsert helpful/not-helpful feedback cho AI result của mình.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi PUT /api/v1/ai/runs/:runId/feedback không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0521"></a>

### API-0521

**Chức năng:** PUT /api/v1/ai/runs/:runId/feedback

**Module:** AI · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 522 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho AI; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Upsert helpful/not-helpful feedback cho AI result của mình.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi PUT /api/v1/ai/runs/:runId/feedback với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0522"></a>

### API-0522

**Chức năng:** PUT /api/v1/ai/runs/:runId/feedback

**Module:** AI · **Loại:** Cross-user access · **Ưu tiên:** P0 · **Actor:** User B

**Nguồn Excel:** API Cases, hàng 523 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Target thuộc User A; User B có token hợp lệ
```

**Dữ liệu test:**

```text
CONVERSATION_A (không thuộc B) / PROPOSAL_A (không thuộc B) / RUN_A (không thuộc B); content=Gợi ý bữa chay giàu protein; mediaId=MEDIA_READY khi nhận diện
```

**Các bước thực hiện:**

```text
1. Gửi PUT /api/v1/ai/runs/:runId/feedback với ID của User A và token B.
2. Kiểm tra response/DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403 hoặc 404 theo chính sách chống dò ID; không lộ dữ liệu A; không mutation.
```

<a id="api-0523"></a>

### API-0523

**Chức năng:** PUT /api/v1/ai/runs/:runId/feedback

**Module:** AI · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 524 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi PUT /api/v1/ai/runs/:runId/feedback với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0524"></a>

### API-0524

**Chức năng:** PUT /api/v1/ai/runs/:runId/feedback

**Module:** AI · **Loại:** Invalid payload · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 525 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho AI; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Upsert helpful/not-helpful feedback cho AI result của mình.
```

**Dữ liệu test:**

```text
Body chứa field bắt buộc rỗng/sai type; PATCH={} hoặc score=6/quantity=-1 khi áp dụng
```

**Các bước thực hiện:**

```text
1. Gửi PUT /api/v1/ai/runs/:runId/feedback với body sai schema.
2. Đối chiếu field error.
3. Xác minh DB giữ nguyên.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 400 VALIDATION_ERROR; details chỉ rõ field; không lưu dữ liệu sai.
```

<a id="module-14"></a>

## Notification và reminder

| ID                    | Chức năng / endpoint                   | Loại test         | Ưu tiên | Actor  | Kết quả chạy |
| --------------------- | -------------------------------------- | ----------------- | ------- | ------ | ------------ |
| [API-0525](#api-0525) | GET /api/v1/notifications              | Happy path        | P1      | User A | Đạt          |
| [API-0526](#api-0526) | GET /api/v1/notifications              | Missing auth      | P0      | Guest  | Đạt          |
| [API-0527](#api-0527) | GET /api/v1/notifications              | Invalid auth      | P0      | User A | Đạt          |
| [API-0528](#api-0528) | GET /api/v1/notifications              | Empty result      | P2      | User A | Đạt          |
| [API-0529](#api-0529) | GET /api/v1/notifications/unread-count | Happy path        | P1      | User A | Đạt          |
| [API-0530](#api-0530) | GET /api/v1/notifications/unread-count | Missing auth      | P0      | Guest  | Đạt          |
| [API-0531](#api-0531) | GET /api/v1/notifications/unread-count | Invalid auth      | P0      | User A | Đạt          |
| [API-0532](#api-0532) | PATCH /api/v1/notifications/:id/read   | Happy path        | P1      | User A | Đạt          |
| [API-0533](#api-0533) | PATCH /api/v1/notifications/:id/read   | Missing auth      | P0      | Guest  | Đạt          |
| [API-0534](#api-0534) | PATCH /api/v1/notifications/:id/read   | Invalid auth      | P0      | User A | Đạt          |
| [API-0535](#api-0535) | PATCH /api/v1/notifications/:id/read   | Cross-user access | P0      | User B | Đạt          |
| [API-0536](#api-0536) | PATCH /api/v1/notifications/:id/read   | Missing target    | P1      | User A | Đạt          |
| [API-0537](#api-0537) | POST /api/v1/notifications/read-all    | Happy path        | P1      | User A | Đạt          |
| [API-0538](#api-0538) | POST /api/v1/notifications/read-all    | Missing auth      | P0      | Guest  | Đạt          |
| [API-0539](#api-0539) | POST /api/v1/notifications/read-all    | Invalid auth      | P0      | User A | Đạt          |
| [API-0540](#api-0540) | DELETE /api/v1/notifications/:id       | Happy path        | P1      | User A | Đạt          |
| [API-0541](#api-0541) | DELETE /api/v1/notifications/:id       | Missing auth      | P0      | Guest  | Đạt          |
| [API-0542](#api-0542) | DELETE /api/v1/notifications/:id       | Invalid auth      | P0      | User A | Đạt          |
| [API-0543](#api-0543) | DELETE /api/v1/notifications/:id       | Cross-user access | P0      | User B | Đạt          |
| [API-0544](#api-0544) | DELETE /api/v1/notifications/:id       | Missing target    | P1      | User A | Đạt          |
| [API-0545](#api-0545) | GET /api/v1/notification-preferences   | Happy path        | P1      | User A | Đạt          |
| [API-0546](#api-0546) | GET /api/v1/notification-preferences   | Missing auth      | P0      | Guest  | Đạt          |
| [API-0547](#api-0547) | GET /api/v1/notification-preferences   | Invalid auth      | P0      | User A | Đạt          |
| [API-0548](#api-0548) | PUT /api/v1/notification-preferences   | Happy path        | P1      | User A | Đạt          |
| [API-0549](#api-0549) | PUT /api/v1/notification-preferences   | Missing auth      | P0      | Guest  | Đạt          |
| [API-0550](#api-0550) | PUT /api/v1/notification-preferences   | Invalid auth      | P0      | User A | Đạt          |
| [API-0551](#api-0551) | PUT /api/v1/notification-preferences   | Invalid payload   | P1      | User A | Đạt          |
| [API-0552](#api-0552) | GET /api/v1/reminders                  | Happy path        | P1      | User A | Đạt          |
| [API-0553](#api-0553) | GET /api/v1/reminders                  | Missing auth      | P0      | Guest  | Đạt          |
| [API-0554](#api-0554) | GET /api/v1/reminders                  | Invalid auth      | P0      | User A | Đạt          |
| [API-0555](#api-0555) | GET /api/v1/reminders                  | Empty result      | P2      | User A | Đạt          |
| [API-0556](#api-0556) | POST /api/v1/reminders                 | Happy path        | P1      | User A | Đạt          |
| [API-0557](#api-0557) | POST /api/v1/reminders                 | Missing auth      | P0      | Guest  | Đạt          |
| [API-0558](#api-0558) | POST /api/v1/reminders                 | Invalid auth      | P0      | User A | Đạt          |
| [API-0559](#api-0559) | POST /api/v1/reminders                 | Invalid payload   | P1      | User A | Đạt          |
| [API-0560](#api-0560) | PATCH /api/v1/reminders/:id            | Happy path        | P1      | User A | Đạt          |
| [API-0561](#api-0561) | PATCH /api/v1/reminders/:id            | Missing auth      | P0      | Guest  | Đạt          |
| [API-0562](#api-0562) | PATCH /api/v1/reminders/:id            | Invalid auth      | P0      | User A | Đạt          |
| [API-0563](#api-0563) | PATCH /api/v1/reminders/:id            | Cross-user access | P0      | User B | Đạt          |
| [API-0564](#api-0564) | PATCH /api/v1/reminders/:id            | Missing target    | P1      | User A | Đạt          |
| [API-0565](#api-0565) | PATCH /api/v1/reminders/:id            | Invalid payload   | P1      | User A | Đạt          |
| [API-0566](#api-0566) | DELETE /api/v1/reminders/:id           | Happy path        | P1      | User A | Đạt          |
| [API-0567](#api-0567) | DELETE /api/v1/reminders/:id           | Missing auth      | P0      | Guest  | Đạt          |
| [API-0568](#api-0568) | DELETE /api/v1/reminders/:id           | Invalid auth      | P0      | User A | Đạt          |
| [API-0569](#api-0569) | DELETE /api/v1/reminders/:id           | Cross-user access | P0      | User B | Đạt          |
| [API-0570](#api-0570) | DELETE /api/v1/reminders/:id           | Missing target    | P1      | User A | Đạt          |

<a id="api-0525"></a>

### API-0525

**Chức năng:** GET /api/v1/notifications

**Module:** Notification và reminder · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 526 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Notification và reminder; User A active, có Firebase token hợp lệ; target đúng trạng thái cho List notification.
```

**Dữ liệu test:**

```text
Fixture đúng schema OpenAPI; ID User A/target A; page=1,limit=20 cho list; reason=kiểm tra khi moderation
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/notifications với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: List notification; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0526"></a>

### API-0526

**Chức năng:** GET /api/v1/notifications

**Module:** Notification và reminder · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 527 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Notification và reminder; User A active, có Firebase token bị bỏ; target đúng trạng thái cho List notification.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi GET /api/v1/notifications không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0527"></a>

### API-0527

**Chức năng:** GET /api/v1/notifications

**Module:** Notification và reminder · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 528 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Notification và reminder; User A active, có Firebase token hợp lệ; target đúng trạng thái cho List notification.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/notifications với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0528"></a>

### API-0528

**Chức năng:** GET /api/v1/notifications

**Module:** Notification và reminder · **Loại:** Empty result · **Ưu tiên:** P2 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 529 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Không có dữ liệu khớp filter hoặc user mới
```

**Dữ liệu test:**

```text
Filter hợp lệ không có kết quả
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/notifications với filter rỗng kết quả.
2. Kiểm tra payload.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; list rỗng/tổng bằng 0 đúng schema; không lỗi 500 hoặc dữ liệu user khác.
```

<a id="api-0529"></a>

### API-0529

**Chức năng:** GET /api/v1/notifications/unread-count

**Module:** Notification và reminder · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 530 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Notification và reminder; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Số thông báo chưa đọc.
```

**Dữ liệu test:**

```text
Fixture đúng schema OpenAPI; ID User A/target A; page=1,limit=20 cho list; reason=kiểm tra khi moderation
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/notifications/unread-count với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: Số thông báo chưa đọc; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0530"></a>

### API-0530

**Chức năng:** GET /api/v1/notifications/unread-count

**Module:** Notification và reminder · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 531 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Notification và reminder; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Số thông báo chưa đọc.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi GET /api/v1/notifications/unread-count không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0531"></a>

### API-0531

**Chức năng:** GET /api/v1/notifications/unread-count

**Module:** Notification và reminder · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 532 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Notification và reminder; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Số thông báo chưa đọc.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/notifications/unread-count với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0532"></a>

### API-0532

**Chức năng:** PATCH /api/v1/notifications/:id/read

**Module:** Notification và reminder · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 533 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Notification và reminder; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Đánh dấu đã đọc.
```

**Dữ liệu test:**

```text
Fixture đúng schema OpenAPI; ID User A/target A; page=1,limit=20 cho list; reason=kiểm tra khi moderation
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi PATCH /api/v1/notifications/:id/read với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Đánh dấu đã đọc; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0533"></a>

### API-0533

**Chức năng:** PATCH /api/v1/notifications/:id/read

**Module:** Notification và reminder · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 534 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Notification và reminder; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Đánh dấu đã đọc.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi PATCH /api/v1/notifications/:id/read không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0534"></a>

### API-0534

**Chức năng:** PATCH /api/v1/notifications/:id/read

**Module:** Notification và reminder · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 535 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Notification và reminder; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Đánh dấu đã đọc.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/notifications/:id/read với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0535"></a>

### API-0535

**Chức năng:** PATCH /api/v1/notifications/:id/read

**Module:** Notification và reminder · **Loại:** Cross-user access · **Ưu tiên:** P0 · **Actor:** User B

**Nguồn Excel:** API Cases, hàng 536 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Target thuộc User A; User B có token hợp lệ
```

**Dữ liệu test:**

```text
Fixture đúng schema OpenAPI; ID User A/target A; page=1,limit=20 cho list; reason=kiểm tra khi moderation
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/notifications/:id/read với ID của User A và token B.
2. Kiểm tra response/DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403 hoặc 404 theo chính sách chống dò ID; không lộ dữ liệu A; không mutation.
```

<a id="api-0536"></a>

### API-0536

**Chức năng:** PATCH /api/v1/notifications/:id/read

**Module:** Notification và reminder · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 537 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/notifications/:id/read với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0537"></a>

### API-0537

**Chức năng:** POST /api/v1/notifications/read-all

**Module:** Notification và reminder · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 538 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Notification và reminder; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Đánh dấu tất cả đã đọc.
```

**Dữ liệu test:**

```text
Fixture đúng schema OpenAPI; ID User A/target A; page=1,limit=20 cho list; reason=kiểm tra khi moderation
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi POST /api/v1/notifications/read-all với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Đánh dấu tất cả đã đọc; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0538"></a>

### API-0538

**Chức năng:** POST /api/v1/notifications/read-all

**Module:** Notification và reminder · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 539 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Notification và reminder; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Đánh dấu tất cả đã đọc.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi POST /api/v1/notifications/read-all không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0539"></a>

### API-0539

**Chức năng:** POST /api/v1/notifications/read-all

**Module:** Notification và reminder · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 540 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Notification và reminder; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Đánh dấu tất cả đã đọc.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/notifications/read-all với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0540"></a>

### API-0540

**Chức năng:** DELETE /api/v1/notifications/:id

**Module:** Notification và reminder · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 541 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Notification và reminder; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Ẩn/xóa notification khỏi inbox của mình.
```

**Dữ liệu test:**

```text
Fixture đúng schema OpenAPI; ID User A/target A; page=1,limit=20 cho list; reason=kiểm tra khi moderation
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi DELETE /api/v1/notifications/:id với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Ẩn/xóa notification khỏi inbox của mình; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0541"></a>

### API-0541

**Chức năng:** DELETE /api/v1/notifications/:id

**Module:** Notification và reminder · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 542 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Notification và reminder; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Ẩn/xóa notification khỏi inbox của mình.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi DELETE /api/v1/notifications/:id không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0542"></a>

### API-0542

**Chức năng:** DELETE /api/v1/notifications/:id

**Module:** Notification và reminder · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 543 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Notification và reminder; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Ẩn/xóa notification khỏi inbox của mình.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi DELETE /api/v1/notifications/:id với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0543"></a>

### API-0543

**Chức năng:** DELETE /api/v1/notifications/:id

**Module:** Notification và reminder · **Loại:** Cross-user access · **Ưu tiên:** P0 · **Actor:** User B

**Nguồn Excel:** API Cases, hàng 544 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Target thuộc User A; User B có token hợp lệ
```

**Dữ liệu test:**

```text
Fixture đúng schema OpenAPI; ID User A/target A; page=1,limit=20 cho list; reason=kiểm tra khi moderation
```

**Các bước thực hiện:**

```text
1. Gửi DELETE /api/v1/notifications/:id với ID của User A và token B.
2. Kiểm tra response/DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403 hoặc 404 theo chính sách chống dò ID; không lộ dữ liệu A; không mutation.
```

<a id="api-0544"></a>

### API-0544

**Chức năng:** DELETE /api/v1/notifications/:id

**Module:** Notification và reminder · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 545 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi DELETE /api/v1/notifications/:id với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0545"></a>

### API-0545

**Chức năng:** GET /api/v1/notification-preferences

**Module:** Notification và reminder · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 546 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Notification và reminder; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Xem preferences.
```

**Dữ liệu test:**

```text
pushEnabled=true; quietHours={enabled:true,start:22:00,end:07:00}; timezone=Asia/Ho_Chi_Minh
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/notification-preferences với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: Xem preferences; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0546"></a>

### API-0546

**Chức năng:** GET /api/v1/notification-preferences

**Module:** Notification và reminder · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 547 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Notification và reminder; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Xem preferences.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi GET /api/v1/notification-preferences không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0547"></a>

### API-0547

**Chức năng:** GET /api/v1/notification-preferences

**Module:** Notification và reminder · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 548 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Notification và reminder; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Xem preferences.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/notification-preferences với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0548"></a>

### API-0548

**Chức năng:** PUT /api/v1/notification-preferences

**Module:** Notification và reminder · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 549 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Notification và reminder; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Upsert preferences.
```

**Dữ liệu test:**

```text
pushEnabled=true; quietHours={enabled:true,start:22:00,end:07:00}; timezone=Asia/Ho_Chi_Minh
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi PUT /api/v1/notification-preferences với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Upsert preferences; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0549"></a>

### API-0549

**Chức năng:** PUT /api/v1/notification-preferences

**Module:** Notification và reminder · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 550 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Notification và reminder; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Upsert preferences.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi PUT /api/v1/notification-preferences không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0550"></a>

### API-0550

**Chức năng:** PUT /api/v1/notification-preferences

**Module:** Notification và reminder · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 551 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Notification và reminder; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Upsert preferences.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi PUT /api/v1/notification-preferences với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0551"></a>

### API-0551

**Chức năng:** PUT /api/v1/notification-preferences

**Module:** Notification và reminder · **Loại:** Invalid payload · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 552 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Notification và reminder; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Upsert preferences.
```

**Dữ liệu test:**

```text
Body chứa field bắt buộc rỗng/sai type; PATCH={} hoặc score=6/quantity=-1 khi áp dụng
```

**Các bước thực hiện:**

```text
1. Gửi PUT /api/v1/notification-preferences với body sai schema.
2. Đối chiếu field error.
3. Xác minh DB giữ nguyên.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 400 VALIDATION_ERROR; details chỉ rõ field; không lưu dữ liệu sai.
```

<a id="api-0552"></a>

### API-0552

**Chức năng:** GET /api/v1/reminders

**Module:** Notification và reminder · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 553 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Notification và reminder; User A active, có Firebase token hợp lệ; target đúng trạng thái cho List reminder.
```

**Dữ liệu test:**

```text
type=water; mode=once; at=2026-10-06T03:00:00Z; timezone=Asia/Ho_Chi_Minh
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/reminders với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: List reminder; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0553"></a>

### API-0553

**Chức năng:** GET /api/v1/reminders

**Module:** Notification và reminder · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 554 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Notification và reminder; User A active, có Firebase token bị bỏ; target đúng trạng thái cho List reminder.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi GET /api/v1/reminders không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0554"></a>

### API-0554

**Chức năng:** GET /api/v1/reminders

**Module:** Notification và reminder · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 555 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Notification và reminder; User A active, có Firebase token hợp lệ; target đúng trạng thái cho List reminder.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/reminders với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0555"></a>

### API-0555

**Chức năng:** GET /api/v1/reminders

**Module:** Notification và reminder · **Loại:** Empty result · **Ưu tiên:** P2 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 556 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Không có dữ liệu khớp filter hoặc user mới
```

**Dữ liệu test:**

```text
Filter hợp lệ không có kết quả
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/reminders với filter rỗng kết quả.
2. Kiểm tra payload.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; list rỗng/tổng bằng 0 đúng schema; không lỗi 500 hoặc dữ liệu user khác.
```

<a id="api-0556"></a>

### API-0556

**Chức năng:** POST /api/v1/reminders

**Module:** Notification và reminder · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 557 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Notification và reminder; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Tạo reminder.
```

**Dữ liệu test:**

```text
type=water; mode=once; at=2026-10-06T03:00:00Z; timezone=Asia/Ho_Chi_Minh
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi POST /api/v1/reminders với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Tạo reminder; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0557"></a>

### API-0557

**Chức năng:** POST /api/v1/reminders

**Module:** Notification và reminder · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 558 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Notification và reminder; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Tạo reminder.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi POST /api/v1/reminders không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0558"></a>

### API-0558

**Chức năng:** POST /api/v1/reminders

**Module:** Notification và reminder · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 559 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Notification và reminder; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Tạo reminder.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/reminders với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0559"></a>

### API-0559

**Chức năng:** POST /api/v1/reminders

**Module:** Notification và reminder · **Loại:** Invalid payload · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 560 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Notification và reminder; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Tạo reminder.
```

**Dữ liệu test:**

```text
Body chứa field bắt buộc rỗng/sai type; PATCH={} hoặc score=6/quantity=-1 khi áp dụng
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/reminders với body sai schema.
2. Đối chiếu field error.
3. Xác minh DB giữ nguyên.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 400 VALIDATION_ERROR; details chỉ rõ field; không lưu dữ liệu sai.
```

<a id="api-0560"></a>

### API-0560

**Chức năng:** PATCH /api/v1/reminders/:id

**Module:** Notification và reminder · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 561 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Notification và reminder; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Sửa/pause/resume.
```

**Dữ liệu test:**

```text
type=water; mode=once; at=2026-10-06T03:00:00Z; timezone=Asia/Ho_Chi_Minh
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi PATCH /api/v1/reminders/:id với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Sửa/pause/resume; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0561"></a>

### API-0561

**Chức năng:** PATCH /api/v1/reminders/:id

**Module:** Notification và reminder · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 562 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Notification và reminder; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Sửa/pause/resume.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi PATCH /api/v1/reminders/:id không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0562"></a>

### API-0562

**Chức năng:** PATCH /api/v1/reminders/:id

**Module:** Notification và reminder · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 563 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Notification và reminder; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Sửa/pause/resume.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/reminders/:id với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0563"></a>

### API-0563

**Chức năng:** PATCH /api/v1/reminders/:id

**Module:** Notification và reminder · **Loại:** Cross-user access · **Ưu tiên:** P0 · **Actor:** User B

**Nguồn Excel:** API Cases, hàng 564 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Target thuộc User A; User B có token hợp lệ
```

**Dữ liệu test:**

```text
type=water; mode=once; at=2026-10-06T03:00:00Z; timezone=Asia/Ho_Chi_Minh
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/reminders/:id với ID của User A và token B.
2. Kiểm tra response/DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403 hoặc 404 theo chính sách chống dò ID; không lộ dữ liệu A; không mutation.
```

<a id="api-0564"></a>

### API-0564

**Chức năng:** PATCH /api/v1/reminders/:id

**Module:** Notification và reminder · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 565 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/reminders/:id với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0565"></a>

### API-0565

**Chức năng:** PATCH /api/v1/reminders/:id

**Module:** Notification và reminder · **Loại:** Invalid payload · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 566 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Notification và reminder; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Sửa/pause/resume.
```

**Dữ liệu test:**

```text
Body chứa field bắt buộc rỗng/sai type; PATCH={} hoặc score=6/quantity=-1 khi áp dụng
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/reminders/:id với body sai schema.
2. Đối chiếu field error.
3. Xác minh DB giữ nguyên.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 400 VALIDATION_ERROR; details chỉ rõ field; không lưu dữ liệu sai.
```

<a id="api-0566"></a>

### API-0566

**Chức năng:** DELETE /api/v1/reminders/:id

**Module:** Notification và reminder · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 567 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Notification và reminder; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Cancel.
```

**Dữ liệu test:**

```text
type=water; mode=once; at=2026-10-06T03:00:00Z; timezone=Asia/Ho_Chi_Minh
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi DELETE /api/v1/reminders/:id với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Cancel; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0567"></a>

### API-0567

**Chức năng:** DELETE /api/v1/reminders/:id

**Module:** Notification và reminder · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 568 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Notification và reminder; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Cancel.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi DELETE /api/v1/reminders/:id không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0568"></a>

### API-0568

**Chức năng:** DELETE /api/v1/reminders/:id

**Module:** Notification và reminder · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 569 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Notification và reminder; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Cancel.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi DELETE /api/v1/reminders/:id với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0569"></a>

### API-0569

**Chức năng:** DELETE /api/v1/reminders/:id

**Module:** Notification và reminder · **Loại:** Cross-user access · **Ưu tiên:** P0 · **Actor:** User B

**Nguồn Excel:** API Cases, hàng 570 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Target thuộc User A; User B có token hợp lệ
```

**Dữ liệu test:**

```text
type=water; mode=once; at=2026-10-06T03:00:00Z; timezone=Asia/Ho_Chi_Minh
```

**Các bước thực hiện:**

```text
1. Gửi DELETE /api/v1/reminders/:id với ID của User A và token B.
2. Kiểm tra response/DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403 hoặc 404 theo chính sách chống dò ID; không lộ dữ liệu A; không mutation.
```

<a id="api-0570"></a>

### API-0570

**Chức năng:** DELETE /api/v1/reminders/:id

**Module:** Notification và reminder · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 571 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi DELETE /api/v1/reminders/:id với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="module-15"></a>

## Report, moderation, admin và audit

| ID                    | Chức năng / endpoint                                        | Loại test         | Ưu tiên | Actor  | Kết quả chạy |
| --------------------- | ----------------------------------------------------------- | ----------------- | ------- | ------ | ------------ |
| [API-0571](#api-0571) | POST /api/v1/reports                                        | Happy path        | P1      | User A | Đạt          |
| [API-0572](#api-0572) | POST /api/v1/reports                                        | Missing auth      | P0      | Guest  | Đạt          |
| [API-0573](#api-0573) | POST /api/v1/reports                                        | Invalid auth      | P0      | User A | Đạt          |
| [API-0574](#api-0574) | POST /api/v1/reports                                        | Invalid payload   | P1      | User A | Đạt          |
| [API-0575](#api-0575) | GET /api/v1/reports/mine                                    | Happy path        | P1      | User A | Đạt          |
| [API-0576](#api-0576) | GET /api/v1/reports/mine                                    | Missing auth      | P0      | Guest  | Đạt          |
| [API-0577](#api-0577) | GET /api/v1/reports/mine                                    | Invalid auth      | P0      | User A | Đạt          |
| [API-0578](#api-0578) | GET /api/v1/reports/mine                                    | Empty result      | P2      | User A | Đạt          |
| [API-0579](#api-0579) | GET /api/v1/reports/mine/:id                                | Happy path        | P1      | User A | Đạt          |
| [API-0580](#api-0580) | GET /api/v1/reports/mine/:id                                | Missing auth      | P0      | Guest  | Đạt          |
| [API-0581](#api-0581) | GET /api/v1/reports/mine/:id                                | Invalid auth      | P0      | User A | Đạt          |
| [API-0582](#api-0582) | GET /api/v1/reports/mine/:id                                | Cross-user access | P0      | User B | Đạt          |
| [API-0583](#api-0583) | GET /api/v1/reports/mine/:id                                | Missing target    | P1      | User A | Đạt          |
| [API-0584](#api-0584) | GET /api/v1/admin/reports                                   | Happy path        | P1      | Admin  | Đạt          |
| [API-0585](#api-0585) | GET /api/v1/admin/reports                                   | Missing auth      | P0      | Guest  | Đạt          |
| [API-0586](#api-0586) | GET /api/v1/admin/reports                                   | Invalid auth      | P0      | Admin  | Đạt          |
| [API-0587](#api-0587) | GET /api/v1/admin/reports                                   | Role denied       | P0      | User A | Đạt          |
| [API-0588](#api-0588) | GET /api/v1/admin/reports                                   | Empty result      | P2      | Admin  | Đạt          |
| [API-0589](#api-0589) | PATCH /api/v1/admin/reports/:id                             | Happy path        | P1      | Admin  | Đạt          |
| [API-0590](#api-0590) | PATCH /api/v1/admin/reports/:id                             | Missing auth      | P0      | Guest  | Đạt          |
| [API-0591](#api-0591) | PATCH /api/v1/admin/reports/:id                             | Invalid auth      | P0      | Admin  | Đạt          |
| [API-0592](#api-0592) | PATCH /api/v1/admin/reports/:id                             | Role denied       | P0      | User A | Đạt          |
| [API-0593](#api-0593) | PATCH /api/v1/admin/reports/:id                             | Missing target    | P1      | Admin  | Đạt          |
| [API-0594](#api-0594) | PATCH /api/v1/admin/reports/:id                             | Invalid payload   | P1      | Admin  | Đạt          |
| [API-0595](#api-0595) | GET /api/v1/admin/moderation-cases                          | Happy path        | P1      | Admin  | Đạt          |
| [API-0596](#api-0596) | GET /api/v1/admin/moderation-cases                          | Missing auth      | P0      | Guest  | Đạt          |
| [API-0597](#api-0597) | GET /api/v1/admin/moderation-cases                          | Invalid auth      | P0      | Admin  | Đạt          |
| [API-0598](#api-0598) | GET /api/v1/admin/moderation-cases                          | Role denied       | P0      | User A | Đạt          |
| [API-0599](#api-0599) | GET /api/v1/admin/moderation-cases                          | Empty result      | P2      | Admin  | Đạt          |
| [API-0600](#api-0600) | POST /api/v1/admin/moderation-cases                         | Happy path        | P1      | Admin  | Đạt          |
| [API-0601](#api-0601) | POST /api/v1/admin/moderation-cases                         | Missing auth      | P0      | Guest  | Đạt          |
| [API-0602](#api-0602) | POST /api/v1/admin/moderation-cases                         | Invalid auth      | P0      | Admin  | Đạt          |
| [API-0603](#api-0603) | POST /api/v1/admin/moderation-cases                         | Role denied       | P0      | User A | Đạt          |
| [API-0604](#api-0604) | POST /api/v1/admin/moderation-cases                         | Invalid payload   | P1      | Admin  | Đạt          |
| [API-0605](#api-0605) | PATCH /api/v1/admin/moderation-cases/:id                    | Happy path        | P1      | Admin  | Đạt          |
| [API-0606](#api-0606) | PATCH /api/v1/admin/moderation-cases/:id                    | Missing auth      | P0      | Guest  | Đạt          |
| [API-0607](#api-0607) | PATCH /api/v1/admin/moderation-cases/:id                    | Invalid auth      | P0      | Admin  | Đạt          |
| [API-0608](#api-0608) | PATCH /api/v1/admin/moderation-cases/:id                    | Role denied       | P0      | User A | Đạt          |
| [API-0609](#api-0609) | PATCH /api/v1/admin/moderation-cases/:id                    | Missing target    | P1      | Admin  | Đạt          |
| [API-0610](#api-0610) | PATCH /api/v1/admin/moderation-cases/:id                    | Invalid payload   | P1      | Admin  | Đạt          |
| [API-0611](#api-0611) | POST /api/v1/admin/moderation/:targetType/:targetId/hide    | Happy path        | P1      | Admin  | Đạt          |
| [API-0612](#api-0612) | POST /api/v1/admin/moderation/:targetType/:targetId/hide    | Missing auth      | P0      | Guest  | Đạt          |
| [API-0613](#api-0613) | POST /api/v1/admin/moderation/:targetType/:targetId/hide    | Invalid auth      | P0      | Admin  | Đạt          |
| [API-0614](#api-0614) | POST /api/v1/admin/moderation/:targetType/:targetId/hide    | Role denied       | P0      | User A | Đạt          |
| [API-0615](#api-0615) | POST /api/v1/admin/moderation/:targetType/:targetId/restore | Happy path        | P1      | Admin  | Đạt          |
| [API-0616](#api-0616) | POST /api/v1/admin/moderation/:targetType/:targetId/restore | Missing auth      | P0      | Guest  | Đạt          |
| [API-0617](#api-0617) | POST /api/v1/admin/moderation/:targetType/:targetId/restore | Invalid auth      | P0      | Admin  | Đạt          |
| [API-0618](#api-0618) | POST /api/v1/admin/moderation/:targetType/:targetId/restore | Role denied       | P0      | User A | Đạt          |
| [API-0619](#api-0619) | POST /api/v1/admin/users/:id/suspend                        | Happy path        | P1      | Admin  | Đạt          |
| [API-0620](#api-0620) | POST /api/v1/admin/users/:id/suspend                        | Missing auth      | P0      | Guest  | Đạt          |
| [API-0621](#api-0621) | POST /api/v1/admin/users/:id/suspend                        | Invalid auth      | P0      | Admin  | Đạt          |
| [API-0622](#api-0622) | POST /api/v1/admin/users/:id/suspend                        | Role denied       | P0      | User A | Đạt          |
| [API-0623](#api-0623) | POST /api/v1/admin/users/:id/suspend                        | Missing target    | P1      | Admin  | Đạt          |
| [API-0624](#api-0624) | POST /api/v1/admin/users/:id/activate                       | Happy path        | P1      | Admin  | Đạt          |
| [API-0625](#api-0625) | POST /api/v1/admin/users/:id/activate                       | Missing auth      | P0      | Guest  | Đạt          |
| [API-0626](#api-0626) | POST /api/v1/admin/users/:id/activate                       | Invalid auth      | P0      | Admin  | Đạt          |
| [API-0627](#api-0627) | POST /api/v1/admin/users/:id/activate                       | Role denied       | P0      | User A | Đạt          |
| [API-0628](#api-0628) | POST /api/v1/admin/users/:id/activate                       | Missing target    | P1      | Admin  | Đạt          |
| [API-0629](#api-0629) | GET /api/v1/admin/users                                     | Happy path        | P1      | Admin  | Đạt          |
| [API-0630](#api-0630) | GET /api/v1/admin/users                                     | Missing auth      | P0      | Guest  | Đạt          |
| [API-0631](#api-0631) | GET /api/v1/admin/users                                     | Invalid auth      | P0      | Admin  | Đạt          |
| [API-0632](#api-0632) | GET /api/v1/admin/users                                     | Role denied       | P0      | User A | Đạt          |
| [API-0633](#api-0633) | GET /api/v1/admin/users                                     | Empty result      | P2      | Admin  | Đạt          |
| [API-0634](#api-0634) | GET /api/v1/admin/audit-logs                                | Happy path        | P1      | Admin  | Đạt          |
| [API-0635](#api-0635) | GET /api/v1/admin/audit-logs                                | Missing auth      | P0      | Guest  | Đạt          |
| [API-0636](#api-0636) | GET /api/v1/admin/audit-logs                                | Invalid auth      | P0      | Admin  | Đạt          |
| [API-0637](#api-0637) | GET /api/v1/admin/audit-logs                                | Role denied       | P0      | User A | Đạt          |
| [API-0638](#api-0638) | GET /api/v1/admin/audit-logs                                | Empty result      | P2      | Admin  | Đạt          |

<a id="api-0571"></a>

### API-0571

**Chức năng:** POST /api/v1/reports

**Module:** Report, moderation, admin và audit · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 572 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Report, moderation, admin và audit; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Báo cáo target.
```

**Dữ liệu test:**

```text
{targetType:post,targetId:POST_PUBLIC,reason:spam,description:Nội dung quảng cáo lặp}
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi POST /api/v1/reports với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Báo cáo target; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0572"></a>

### API-0572

**Chức năng:** POST /api/v1/reports

**Module:** Report, moderation, admin và audit · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 573 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Report, moderation, admin và audit; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Báo cáo target.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi POST /api/v1/reports không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0573"></a>

### API-0573

**Chức năng:** POST /api/v1/reports

**Module:** Report, moderation, admin và audit · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 574 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Report, moderation, admin và audit; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Báo cáo target.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/reports với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0574"></a>

### API-0574

**Chức năng:** POST /api/v1/reports

**Module:** Report, moderation, admin và audit · **Loại:** Invalid payload · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 575 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Report, moderation, admin và audit; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Báo cáo target.
```

**Dữ liệu test:**

```text
Body chứa field bắt buộc rỗng/sai type; PATCH={} hoặc score=6/quantity=-1 khi áp dụng
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/reports với body sai schema.
2. Đối chiếu field error.
3. Xác minh DB giữ nguyên.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 400 VALIDATION_ERROR; details chỉ rõ field; không lưu dữ liệu sai.
```

<a id="api-0575"></a>

### API-0575

**Chức năng:** GET /api/v1/reports/mine

**Module:** Report, moderation, admin và audit · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 576 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Report, moderation, admin và audit; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Xem báo cáo của mình.
```

**Dữ liệu test:**

```text
{targetType:post,targetId:POST_PUBLIC,reason:spam,description:Nội dung quảng cáo lặp}
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/reports/mine với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: Xem báo cáo của mình; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0576"></a>

### API-0576

**Chức năng:** GET /api/v1/reports/mine

**Module:** Report, moderation, admin và audit · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 577 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Report, moderation, admin và audit; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Xem báo cáo của mình.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi GET /api/v1/reports/mine không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0577"></a>

### API-0577

**Chức năng:** GET /api/v1/reports/mine

**Module:** Report, moderation, admin và audit · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 578 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Report, moderation, admin và audit; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Xem báo cáo của mình.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/reports/mine với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0578"></a>

### API-0578

**Chức năng:** GET /api/v1/reports/mine

**Module:** Report, moderation, admin và audit · **Loại:** Empty result · **Ưu tiên:** P2 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 579 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Không có dữ liệu khớp filter hoặc user mới
```

**Dữ liệu test:**

```text
Filter hợp lệ không có kết quả
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/reports/mine với filter rỗng kết quả.
2. Kiểm tra payload.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; list rỗng/tổng bằng 0 đúng schema; không lỗi 500 hoặc dữ liệu user khác.
```

<a id="api-0579"></a>

### API-0579

**Chức năng:** GET /api/v1/reports/mine/:id

**Module:** Report, moderation, admin và audit · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 580 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Report, moderation, admin và audit; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Chi tiết báo cáo của mình.
```

**Dữ liệu test:**

```text
{targetType:post,targetId:POST_PUBLIC,reason:spam,description:Nội dung quảng cáo lặp}
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/reports/mine/:id với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: Chi tiết báo cáo của mình; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0580"></a>

### API-0580

**Chức năng:** GET /api/v1/reports/mine/:id

**Module:** Report, moderation, admin và audit · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 581 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Report, moderation, admin và audit; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Chi tiết báo cáo của mình.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi GET /api/v1/reports/mine/:id không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0581"></a>

### API-0581

**Chức năng:** GET /api/v1/reports/mine/:id

**Module:** Report, moderation, admin và audit · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 582 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Report, moderation, admin và audit; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Chi tiết báo cáo của mình.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/reports/mine/:id với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0582"></a>

### API-0582

**Chức năng:** GET /api/v1/reports/mine/:id

**Module:** Report, moderation, admin và audit · **Loại:** Cross-user access · **Ưu tiên:** P0 · **Actor:** User B

**Nguồn Excel:** API Cases, hàng 583 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Target thuộc User A; User B có token hợp lệ
```

**Dữ liệu test:**

```text
{targetType:post,targetId:POST_PUBLIC,reason:spam,description:Nội dung quảng cáo lặp}
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/reports/mine/:id với ID của User A và token B.
2. Kiểm tra response/DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403 hoặc 404 theo chính sách chống dò ID; không lộ dữ liệu A; không mutation.
```

<a id="api-0583"></a>

### API-0583

**Chức năng:** GET /api/v1/reports/mine/:id

**Module:** Report, moderation, admin và audit · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 584 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/reports/mine/:id với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0584"></a>

### API-0584

**Chức năng:** GET /api/v1/admin/reports

**Module:** Report, moderation, admin và audit · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 585 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Report, moderation, admin và audit; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Queue báo cáo.
```

**Dữ liệu test:**

```text
{targetType:post,targetId:POST_PUBLIC,reason:spam,description:Nội dung quảng cáo lặp}
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/admin/reports với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: Queue báo cáo; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0585"></a>

### API-0585

**Chức năng:** GET /api/v1/admin/reports

**Module:** Report, moderation, admin và audit · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 586 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Report, moderation, admin và audit; Admin active, có Firebase token bị bỏ; target đúng trạng thái cho Queue báo cáo.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi GET /api/v1/admin/reports không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0586"></a>

### API-0586

**Chức năng:** GET /api/v1/admin/reports

**Module:** Report, moderation, admin và audit · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 587 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Report, moderation, admin và audit; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Queue báo cáo.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/admin/reports với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0587"></a>

### API-0587

**Chức năng:** GET /api/v1/admin/reports

**Module:** Report, moderation, admin và audit · **Loại:** Role denied · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 588 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
User A active có role=user; target hợp lệ
```

**Dữ liệu test:**

```text
{targetType:post,targetId:POST_PUBLIC,reason:spam,description:Nội dung quảng cáo lặp}
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/admin/reports bằng token user.
2. Kiểm tra DB/audit.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403; không đọc admin data hoặc thực hiện mutation; không nâng quyền.
```

<a id="api-0588"></a>

### API-0588

**Chức năng:** GET /api/v1/admin/reports

**Module:** Report, moderation, admin và audit · **Loại:** Empty result · **Ưu tiên:** P2 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 589 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Không có dữ liệu khớp filter hoặc user mới
```

**Dữ liệu test:**

```text
Filter hợp lệ không có kết quả
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/admin/reports với filter rỗng kết quả.
2. Kiểm tra payload.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; list rỗng/tổng bằng 0 đúng schema; không lỗi 500 hoặc dữ liệu user khác.
```

<a id="api-0589"></a>

### API-0589

**Chức năng:** PATCH /api/v1/admin/reports/:id

**Module:** Report, moderation, admin và audit · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 590 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Report, moderation, admin và audit; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Assign/status/resolution.
```

**Dữ liệu test:**

```text
{targetType:post,targetId:POST_PUBLIC,reason:spam,description:Nội dung quảng cáo lặp}
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi PATCH /api/v1/admin/reports/:id với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Assign/status/resolution; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0590"></a>

### API-0590

**Chức năng:** PATCH /api/v1/admin/reports/:id

**Module:** Report, moderation, admin và audit · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 591 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Report, moderation, admin và audit; Admin active, có Firebase token bị bỏ; target đúng trạng thái cho Assign/status/resolution.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi PATCH /api/v1/admin/reports/:id không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0591"></a>

### API-0591

**Chức năng:** PATCH /api/v1/admin/reports/:id

**Module:** Report, moderation, admin và audit · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 592 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Report, moderation, admin và audit; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Assign/status/resolution.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/admin/reports/:id với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0592"></a>

### API-0592

**Chức năng:** PATCH /api/v1/admin/reports/:id

**Module:** Report, moderation, admin và audit · **Loại:** Role denied · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 593 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
User A active có role=user; target hợp lệ
```

**Dữ liệu test:**

```text
{targetType:post,targetId:POST_PUBLIC,reason:spam,description:Nội dung quảng cáo lặp}
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/admin/reports/:id bằng token user.
2. Kiểm tra DB/audit.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403; không đọc admin data hoặc thực hiện mutation; không nâng quyền.
```

<a id="api-0593"></a>

### API-0593

**Chức năng:** PATCH /api/v1/admin/reports/:id

**Module:** Report, moderation, admin và audit · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 594 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/admin/reports/:id với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0594"></a>

### API-0594

**Chức năng:** PATCH /api/v1/admin/reports/:id

**Module:** Report, moderation, admin và audit · **Loại:** Invalid payload · **Ưu tiên:** P1 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 595 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Report, moderation, admin và audit; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Assign/status/resolution.
```

**Dữ liệu test:**

```text
Body chứa field bắt buộc rỗng/sai type; PATCH={} hoặc score=6/quantity=-1 khi áp dụng
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/admin/reports/:id với body sai schema.
2. Đối chiếu field error.
3. Xác minh DB giữ nguyên.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 400 VALIDATION_ERROR; details chỉ rõ field; không lưu dữ liệu sai.
```

<a id="api-0595"></a>

### API-0595

**Chức năng:** GET /api/v1/admin/moderation-cases

**Module:** Report, moderation, admin và audit · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 596 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Report, moderation, admin và audit; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho List case.
```

**Dữ liệu test:**

```text
Fixture đúng schema OpenAPI; ID User A/target A; page=1,limit=20 cho list; reason=kiểm tra khi moderation
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/admin/moderation-cases với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: List case; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0596"></a>

### API-0596

**Chức năng:** GET /api/v1/admin/moderation-cases

**Module:** Report, moderation, admin và audit · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 597 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Report, moderation, admin và audit; Admin active, có Firebase token bị bỏ; target đúng trạng thái cho List case.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi GET /api/v1/admin/moderation-cases không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0597"></a>

### API-0597

**Chức năng:** GET /api/v1/admin/moderation-cases

**Module:** Report, moderation, admin và audit · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 598 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Report, moderation, admin và audit; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho List case.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/admin/moderation-cases với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0598"></a>

### API-0598

**Chức năng:** GET /api/v1/admin/moderation-cases

**Module:** Report, moderation, admin và audit · **Loại:** Role denied · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 599 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
User A active có role=user; target hợp lệ
```

**Dữ liệu test:**

```text
Fixture đúng schema OpenAPI; ID User A/target A; page=1,limit=20 cho list; reason=kiểm tra khi moderation
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/admin/moderation-cases bằng token user.
2. Kiểm tra DB/audit.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403; không đọc admin data hoặc thực hiện mutation; không nâng quyền.
```

<a id="api-0599"></a>

### API-0599

**Chức năng:** GET /api/v1/admin/moderation-cases

**Module:** Report, moderation, admin và audit · **Loại:** Empty result · **Ưu tiên:** P2 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 600 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Không có dữ liệu khớp filter hoặc user mới
```

**Dữ liệu test:**

```text
Filter hợp lệ không có kết quả
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/admin/moderation-cases với filter rỗng kết quả.
2. Kiểm tra payload.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; list rỗng/tổng bằng 0 đúng schema; không lỗi 500 hoặc dữ liệu user khác.
```

<a id="api-0600"></a>

### API-0600

**Chức năng:** POST /api/v1/admin/moderation-cases

**Module:** Report, moderation, admin và audit · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 601 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Report, moderation, admin và audit; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Tạo/gộp case.
```

**Dữ liệu test:**

```text
Fixture đúng schema OpenAPI; ID User A/target A; page=1,limit=20 cho list; reason=kiểm tra khi moderation
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi POST /api/v1/admin/moderation-cases với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Tạo/gộp case; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0601"></a>

### API-0601

**Chức năng:** POST /api/v1/admin/moderation-cases

**Module:** Report, moderation, admin và audit · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 602 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Report, moderation, admin và audit; Admin active, có Firebase token bị bỏ; target đúng trạng thái cho Tạo/gộp case.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi POST /api/v1/admin/moderation-cases không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0602"></a>

### API-0602

**Chức năng:** POST /api/v1/admin/moderation-cases

**Module:** Report, moderation, admin và audit · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 603 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Report, moderation, admin và audit; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Tạo/gộp case.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/admin/moderation-cases với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0603"></a>

### API-0603

**Chức năng:** POST /api/v1/admin/moderation-cases

**Module:** Report, moderation, admin và audit · **Loại:** Role denied · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 604 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
User A active có role=user; target hợp lệ
```

**Dữ liệu test:**

```text
Fixture đúng schema OpenAPI; ID User A/target A; page=1,limit=20 cho list; reason=kiểm tra khi moderation
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/admin/moderation-cases bằng token user.
2. Kiểm tra DB/audit.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403; không đọc admin data hoặc thực hiện mutation; không nâng quyền.
```

<a id="api-0604"></a>

### API-0604

**Chức năng:** POST /api/v1/admin/moderation-cases

**Module:** Report, moderation, admin và audit · **Loại:** Invalid payload · **Ưu tiên:** P1 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 605 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Report, moderation, admin và audit; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Tạo/gộp case.
```

**Dữ liệu test:**

```text
Body chứa field bắt buộc rỗng/sai type; PATCH={} hoặc score=6/quantity=-1 khi áp dụng
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/admin/moderation-cases với body sai schema.
2. Đối chiếu field error.
3. Xác minh DB giữ nguyên.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 400 VALIDATION_ERROR; details chỉ rõ field; không lưu dữ liệu sai.
```

<a id="api-0605"></a>

### API-0605

**Chức năng:** PATCH /api/v1/admin/moderation-cases/:id

**Module:** Report, moderation, admin và audit · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 606 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Report, moderation, admin và audit; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Cập nhật case.
```

**Dữ liệu test:**

```text
Fixture đúng schema OpenAPI; ID User A/target A; page=1,limit=20 cho list; reason=kiểm tra khi moderation
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi PATCH /api/v1/admin/moderation-cases/:id với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Cập nhật case; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0606"></a>

### API-0606

**Chức năng:** PATCH /api/v1/admin/moderation-cases/:id

**Module:** Report, moderation, admin và audit · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 607 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Report, moderation, admin và audit; Admin active, có Firebase token bị bỏ; target đúng trạng thái cho Cập nhật case.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi PATCH /api/v1/admin/moderation-cases/:id không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0607"></a>

### API-0607

**Chức năng:** PATCH /api/v1/admin/moderation-cases/:id

**Module:** Report, moderation, admin và audit · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 608 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Report, moderation, admin và audit; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Cập nhật case.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/admin/moderation-cases/:id với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0608"></a>

### API-0608

**Chức năng:** PATCH /api/v1/admin/moderation-cases/:id

**Module:** Report, moderation, admin và audit · **Loại:** Role denied · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 609 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
User A active có role=user; target hợp lệ
```

**Dữ liệu test:**

```text
Fixture đúng schema OpenAPI; ID User A/target A; page=1,limit=20 cho list; reason=kiểm tra khi moderation
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/admin/moderation-cases/:id bằng token user.
2. Kiểm tra DB/audit.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403; không đọc admin data hoặc thực hiện mutation; không nâng quyền.
```

<a id="api-0609"></a>

### API-0609

**Chức năng:** PATCH /api/v1/admin/moderation-cases/:id

**Module:** Report, moderation, admin và audit · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 610 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/admin/moderation-cases/:id với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0610"></a>

### API-0610

**Chức năng:** PATCH /api/v1/admin/moderation-cases/:id

**Module:** Report, moderation, admin và audit · **Loại:** Invalid payload · **Ưu tiên:** P1 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 611 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Report, moderation, admin và audit; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Cập nhật case.
```

**Dữ liệu test:**

```text
Body chứa field bắt buộc rỗng/sai type; PATCH={} hoặc score=6/quantity=-1 khi áp dụng
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/admin/moderation-cases/:id với body sai schema.
2. Đối chiếu field error.
3. Xác minh DB giữ nguyên.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 400 VALIDATION_ERROR; details chỉ rõ field; không lưu dữ liệu sai.
```

<a id="api-0611"></a>

### API-0611

**Chức năng:** POST /api/v1/admin/moderation/:targetType/:targetId/hide

**Module:** Report, moderation, admin và audit · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 612 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Report, moderation, admin và audit; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Ẩn nội dung.
```

**Dữ liệu test:**

```text
Fixture đúng schema OpenAPI; ID User A/target A; page=1,limit=20 cho list; reason=kiểm tra khi moderation
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi POST /api/v1/admin/moderation/:targetType/:targetId/hide với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Ẩn nội dung; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0612"></a>

### API-0612

**Chức năng:** POST /api/v1/admin/moderation/:targetType/:targetId/hide

**Module:** Report, moderation, admin và audit · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 613 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Report, moderation, admin và audit; Admin active, có Firebase token bị bỏ; target đúng trạng thái cho Ẩn nội dung.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi POST /api/v1/admin/moderation/:targetType/:targetId/hide không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0613"></a>

### API-0613

**Chức năng:** POST /api/v1/admin/moderation/:targetType/:targetId/hide

**Module:** Report, moderation, admin và audit · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 614 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Report, moderation, admin và audit; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Ẩn nội dung.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/admin/moderation/:targetType/:targetId/hide với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0614"></a>

### API-0614

**Chức năng:** POST /api/v1/admin/moderation/:targetType/:targetId/hide

**Module:** Report, moderation, admin và audit · **Loại:** Role denied · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 615 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
User A active có role=user; target hợp lệ
```

**Dữ liệu test:**

```text
Fixture đúng schema OpenAPI; ID User A/target A; page=1,limit=20 cho list; reason=kiểm tra khi moderation
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/admin/moderation/:targetType/:targetId/hide bằng token user.
2. Kiểm tra DB/audit.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403; không đọc admin data hoặc thực hiện mutation; không nâng quyền.
```

<a id="api-0615"></a>

### API-0615

**Chức năng:** POST /api/v1/admin/moderation/:targetType/:targetId/restore

**Module:** Report, moderation, admin và audit · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 616 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Report, moderation, admin và audit; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Khôi phục.
```

**Dữ liệu test:**

```text
Fixture đúng schema OpenAPI; ID User A/target A; page=1,limit=20 cho list; reason=kiểm tra khi moderation
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi POST /api/v1/admin/moderation/:targetType/:targetId/restore với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Khôi phục; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0616"></a>

### API-0616

**Chức năng:** POST /api/v1/admin/moderation/:targetType/:targetId/restore

**Module:** Report, moderation, admin và audit · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 617 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Report, moderation, admin và audit; Admin active, có Firebase token bị bỏ; target đúng trạng thái cho Khôi phục.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi POST /api/v1/admin/moderation/:targetType/:targetId/restore không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0617"></a>

### API-0617

**Chức năng:** POST /api/v1/admin/moderation/:targetType/:targetId/restore

**Module:** Report, moderation, admin và audit · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 618 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Report, moderation, admin và audit; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Khôi phục.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/admin/moderation/:targetType/:targetId/restore với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0618"></a>

### API-0618

**Chức năng:** POST /api/v1/admin/moderation/:targetType/:targetId/restore

**Module:** Report, moderation, admin và audit · **Loại:** Role denied · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 619 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
User A active có role=user; target hợp lệ
```

**Dữ liệu test:**

```text
Fixture đúng schema OpenAPI; ID User A/target A; page=1,limit=20 cho list; reason=kiểm tra khi moderation
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/admin/moderation/:targetType/:targetId/restore bằng token user.
2. Kiểm tra DB/audit.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403; không đọc admin data hoặc thực hiện mutation; không nâng quyền.
```

<a id="api-0619"></a>

### API-0619

**Chức năng:** POST /api/v1/admin/users/:id/suspend

**Module:** Report, moderation, admin và audit · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 620 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Report, moderation, admin và audit; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Đình chỉ user.
```

**Dữ liệu test:**

```text
Fixture đúng schema OpenAPI; ID User A/target A; page=1,limit=20 cho list; reason=kiểm tra khi moderation
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi POST /api/v1/admin/users/:id/suspend với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Đình chỉ user; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0620"></a>

### API-0620

**Chức năng:** POST /api/v1/admin/users/:id/suspend

**Module:** Report, moderation, admin và audit · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 621 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Report, moderation, admin và audit; Admin active, có Firebase token bị bỏ; target đúng trạng thái cho Đình chỉ user.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi POST /api/v1/admin/users/:id/suspend không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0621"></a>

### API-0621

**Chức năng:** POST /api/v1/admin/users/:id/suspend

**Module:** Report, moderation, admin và audit · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 622 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Report, moderation, admin và audit; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Đình chỉ user.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/admin/users/:id/suspend với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0622"></a>

### API-0622

**Chức năng:** POST /api/v1/admin/users/:id/suspend

**Module:** Report, moderation, admin và audit · **Loại:** Role denied · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 623 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
User A active có role=user; target hợp lệ
```

**Dữ liệu test:**

```text
Fixture đúng schema OpenAPI; ID User A/target A; page=1,limit=20 cho list; reason=kiểm tra khi moderation
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/admin/users/:id/suspend bằng token user.
2. Kiểm tra DB/audit.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403; không đọc admin data hoặc thực hiện mutation; không nâng quyền.
```

<a id="api-0623"></a>

### API-0623

**Chức năng:** POST /api/v1/admin/users/:id/suspend

**Module:** Report, moderation, admin và audit · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 624 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/admin/users/:id/suspend với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0624"></a>

### API-0624

**Chức năng:** POST /api/v1/admin/users/:id/activate

**Module:** Report, moderation, admin và audit · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 625 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Report, moderation, admin và audit; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Kích hoạt lại.
```

**Dữ liệu test:**

```text
Fixture đúng schema OpenAPI; ID User A/target A; page=1,limit=20 cho list; reason=kiểm tra khi moderation
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi POST /api/v1/admin/users/:id/activate với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Kích hoạt lại; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0625"></a>

### API-0625

**Chức năng:** POST /api/v1/admin/users/:id/activate

**Module:** Report, moderation, admin và audit · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 626 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Report, moderation, admin và audit; Admin active, có Firebase token bị bỏ; target đúng trạng thái cho Kích hoạt lại.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi POST /api/v1/admin/users/:id/activate không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0626"></a>

### API-0626

**Chức năng:** POST /api/v1/admin/users/:id/activate

**Module:** Report, moderation, admin và audit · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 627 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Report, moderation, admin và audit; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Kích hoạt lại.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/admin/users/:id/activate với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0627"></a>

### API-0627

**Chức năng:** POST /api/v1/admin/users/:id/activate

**Module:** Report, moderation, admin và audit · **Loại:** Role denied · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 628 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
User A active có role=user; target hợp lệ
```

**Dữ liệu test:**

```text
Fixture đúng schema OpenAPI; ID User A/target A; page=1,limit=20 cho list; reason=kiểm tra khi moderation
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/admin/users/:id/activate bằng token user.
2. Kiểm tra DB/audit.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403; không đọc admin data hoặc thực hiện mutation; không nâng quyền.
```

<a id="api-0628"></a>

### API-0628

**Chức năng:** POST /api/v1/admin/users/:id/activate

**Module:** Report, moderation, admin và audit · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 629 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/admin/users/:id/activate với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0629"></a>

### API-0629

**Chức năng:** GET /api/v1/admin/users

**Module:** Report, moderation, admin và audit · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 630 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Report, moderation, admin và audit; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Tìm/list user.
```

**Dữ liệu test:**

```text
Fixture đúng schema OpenAPI; ID User A/target A; page=1,limit=20 cho list; reason=kiểm tra khi moderation
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/admin/users với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: Tìm/list user; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0630"></a>

### API-0630

**Chức năng:** GET /api/v1/admin/users

**Module:** Report, moderation, admin và audit · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 631 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Report, moderation, admin và audit; Admin active, có Firebase token bị bỏ; target đúng trạng thái cho Tìm/list user.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi GET /api/v1/admin/users không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0631"></a>

### API-0631

**Chức năng:** GET /api/v1/admin/users

**Module:** Report, moderation, admin và audit · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 632 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Report, moderation, admin và audit; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Tìm/list user.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/admin/users với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0632"></a>

### API-0632

**Chức năng:** GET /api/v1/admin/users

**Module:** Report, moderation, admin và audit · **Loại:** Role denied · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 633 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
User A active có role=user; target hợp lệ
```

**Dữ liệu test:**

```text
Fixture đúng schema OpenAPI; ID User A/target A; page=1,limit=20 cho list; reason=kiểm tra khi moderation
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/admin/users bằng token user.
2. Kiểm tra DB/audit.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403; không đọc admin data hoặc thực hiện mutation; không nâng quyền.
```

<a id="api-0633"></a>

### API-0633

**Chức năng:** GET /api/v1/admin/users

**Module:** Report, moderation, admin và audit · **Loại:** Empty result · **Ưu tiên:** P2 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 634 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Không có dữ liệu khớp filter hoặc user mới
```

**Dữ liệu test:**

```text
Filter hợp lệ không có kết quả
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/admin/users với filter rỗng kết quả.
2. Kiểm tra payload.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; list rỗng/tổng bằng 0 đúng schema; không lỗi 500 hoặc dữ liệu user khác.
```

<a id="api-0634"></a>

### API-0634

**Chức năng:** GET /api/v1/admin/audit-logs

**Module:** Report, moderation, admin và audit · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 635 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Report, moderation, admin và audit; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho List audit read-only.
```

**Dữ liệu test:**

```text
Fixture đúng schema OpenAPI; ID User A/target A; page=1,limit=20 cho list; reason=kiểm tra khi moderation
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/admin/audit-logs với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: List audit read-only; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0635"></a>

### API-0635

**Chức năng:** GET /api/v1/admin/audit-logs

**Module:** Report, moderation, admin và audit · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 636 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Report, moderation, admin và audit; Admin active, có Firebase token bị bỏ; target đúng trạng thái cho List audit read-only.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi GET /api/v1/admin/audit-logs không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0636"></a>

### API-0636

**Chức năng:** GET /api/v1/admin/audit-logs

**Module:** Report, moderation, admin và audit · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 637 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Report, moderation, admin và audit; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho List audit read-only.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/admin/audit-logs với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0637"></a>

### API-0637

**Chức năng:** GET /api/v1/admin/audit-logs

**Module:** Report, moderation, admin và audit · **Loại:** Role denied · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 638 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
User A active có role=user; target hợp lệ
```

**Dữ liệu test:**

```text
Fixture đúng schema OpenAPI; ID User A/target A; page=1,limit=20 cho list; reason=kiểm tra khi moderation
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/admin/audit-logs bằng token user.
2. Kiểm tra DB/audit.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403; không đọc admin data hoặc thực hiện mutation; không nâng quyền.
```

<a id="api-0638"></a>

### API-0638

**Chức năng:** GET /api/v1/admin/audit-logs

**Module:** Report, moderation, admin và audit · **Loại:** Empty result · **Ưu tiên:** P2 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 639 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Không có dữ liệu khớp filter hoặc user mới
```

**Dữ liệu test:**

```text
Filter hợp lệ không có kết quả
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/admin/audit-logs với filter rỗng kết quả.
2. Kiểm tra payload.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; list rỗng/tổng bằng 0 đúng schema; không lỗi 500 hoặc dữ liệu user khác.
```

<a id="module-16"></a>

## Video hướng dẫn

| ID                    | Chức năng / endpoint                     | Loại test         | Ưu tiên | Actor  | Kết quả chạy |
| --------------------- | ---------------------------------------- | ----------------- | ------- | ------ | ------------ |
| [API-0639](#api-0639) | GET /api/v1/videos                       | Happy path        | P1      | Guest  | Đạt          |
| [API-0640](#api-0640) | GET /api/v1/videos                       | Empty result      | P2      | Guest  | Đạt          |
| [API-0641](#api-0641) | GET /api/v1/videos/mine                  | Happy path        | P1      | User A | Đạt          |
| [API-0642](#api-0642) | GET /api/v1/videos/mine                  | Missing auth      | P0      | Guest  | Đạt          |
| [API-0643](#api-0643) | GET /api/v1/videos/mine                  | Invalid auth      | P0      | User A | Đạt          |
| [API-0644](#api-0644) | GET /api/v1/videos/mine                  | Empty result      | P2      | User A | Đạt          |
| [API-0645](#api-0645) | GET /api/v1/videos/:idOrSlug             | Happy path        | P1      | Guest  | Đạt          |
| [API-0646](#api-0646) | GET /api/v1/videos/:idOrSlug             | Missing target    | P1      | Guest  | Đạt          |
| [API-0647](#api-0647) | POST /api/v1/videos                      | Happy path        | P1      | User A | Đạt          |
| [API-0648](#api-0648) | POST /api/v1/videos                      | Missing auth      | P0      | Guest  | Đạt          |
| [API-0649](#api-0649) | POST /api/v1/videos                      | Invalid auth      | P0      | User A | Đạt          |
| [API-0650](#api-0650) | POST /api/v1/videos                      | Invalid payload   | P1      | User A | Đạt          |
| [API-0651](#api-0651) | PATCH /api/v1/videos/:id                 | Happy path        | P1      | User A | Đạt          |
| [API-0652](#api-0652) | PATCH /api/v1/videos/:id                 | Missing auth      | P0      | Guest  | Đạt          |
| [API-0653](#api-0653) | PATCH /api/v1/videos/:id                 | Invalid auth      | P0      | User A | Đạt          |
| [API-0654](#api-0654) | PATCH /api/v1/videos/:id                 | Cross-user access | P0      | User B | Đạt          |
| [API-0655](#api-0655) | PATCH /api/v1/videos/:id                 | Missing target    | P1      | User A | Đạt          |
| [API-0656](#api-0656) | PATCH /api/v1/videos/:id                 | Invalid payload   | P1      | User A | Đạt          |
| [API-0657](#api-0657) | DELETE /api/v1/videos/:id                | Happy path        | P1      | User A | Đạt          |
| [API-0658](#api-0658) | DELETE /api/v1/videos/:id                | Missing auth      | P0      | Guest  | Đạt          |
| [API-0659](#api-0659) | DELETE /api/v1/videos/:id                | Invalid auth      | P0      | User A | Đạt          |
| [API-0660](#api-0660) | DELETE /api/v1/videos/:id                | Cross-user access | P0      | User B | Đạt          |
| [API-0661](#api-0661) | DELETE /api/v1/videos/:id                | Missing target    | P1      | User A | Đạt          |
| [API-0662](#api-0662) | POST /api/v1/videos/:id/submit           | Happy path        | P1      | User A | Đạt          |
| [API-0663](#api-0663) | POST /api/v1/videos/:id/submit           | Missing auth      | P0      | Guest  | Đạt          |
| [API-0664](#api-0664) | POST /api/v1/videos/:id/submit           | Invalid auth      | P0      | User A | Đạt          |
| [API-0665](#api-0665) | POST /api/v1/videos/:id/submit           | Cross-user access | P0      | User B | Đạt          |
| [API-0666](#api-0666) | POST /api/v1/videos/:id/submit           | Missing target    | P1      | User A | Đạt          |
| [API-0667](#api-0667) | POST /api/v1/videos/:id/publish          | Happy path        | P1      | Admin  | Đạt          |
| [API-0668](#api-0668) | POST /api/v1/videos/:id/publish          | Missing auth      | P0      | Guest  | Đạt          |
| [API-0669](#api-0669) | POST /api/v1/videos/:id/publish          | Invalid auth      | P0      | Admin  | Đạt          |
| [API-0670](#api-0670) | POST /api/v1/videos/:id/publish          | Role denied       | P0      | User A | Đạt          |
| [API-0671](#api-0671) | POST /api/v1/videos/:id/publish          | Missing target    | P1      | Admin  | Đạt          |
| [API-0672](#api-0672) | POST /api/v1/videos/:id/reject           | Happy path        | P1      | Admin  | Đạt          |
| [API-0673](#api-0673) | POST /api/v1/videos/:id/reject           | Missing auth      | P0      | Guest  | Đạt          |
| [API-0674](#api-0674) | POST /api/v1/videos/:id/reject           | Invalid auth      | P0      | Admin  | Đạt          |
| [API-0675](#api-0675) | POST /api/v1/videos/:id/reject           | Role denied       | P0      | User A | Đạt          |
| [API-0676](#api-0676) | POST /api/v1/videos/:id/reject           | Missing target    | P1      | Admin  | Đạt          |
| [API-0677](#api-0677) | GET /api/v1/videos/:id/related           | Happy path        | P1      | Guest  | Đạt          |
| [API-0678](#api-0678) | GET /api/v1/videos/:id/related           | Missing target    | P1      | Guest  | Đạt          |
| [API-0679](#api-0679) | PUT /api/v1/videos/:id/progress          | Happy path        | P1      | User A | Đạt          |
| [API-0680](#api-0680) | PUT /api/v1/videos/:id/progress          | Missing auth      | P0      | Guest  | Đạt          |
| [API-0681](#api-0681) | PUT /api/v1/videos/:id/progress          | Invalid auth      | P0      | User A | Đạt          |
| [API-0682](#api-0682) | PUT /api/v1/videos/:id/progress          | Cross-user access | P0      | User B | Không đạt    |
| [API-0683](#api-0683) | PUT /api/v1/videos/:id/progress          | Missing target    | P1      | User A | Đạt          |
| [API-0684](#api-0684) | PUT /api/v1/videos/:id/progress          | Invalid payload   | P1      | User A | Đạt          |
| [API-0685](#api-0685) | GET /api/v1/videos/:id/transcript        | Happy path        | P1      | Guest  | Đạt          |
| [API-0686](#api-0686) | GET /api/v1/videos/:id/transcript        | Missing target    | P1      | Guest  | Đạt          |
| [API-0687](#api-0687) | POST /api/v1/videos/:id/generate-summary | Happy path        | P1      | User A | Đạt          |
| [API-0688](#api-0688) | POST /api/v1/videos/:id/generate-summary | Missing auth      | P0      | Guest  | Đạt          |
| [API-0689](#api-0689) | POST /api/v1/videos/:id/generate-summary | Invalid auth      | P0      | User A | Đạt          |
| [API-0690](#api-0690) | POST /api/v1/videos/:id/generate-summary | Cross-user access | P0      | User B | Đạt          |
| [API-0691](#api-0691) | POST /api/v1/videos/:id/generate-summary | Missing target    | P1      | User A | Đạt          |

<a id="api-0639"></a>

### API-0639

**Chức năng:** GET /api/v1/videos

**Module:** Video hướng dẫn · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 640 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Video hướng dẫn; không gửi token; target đúng trạng thái cho Danh sách video published/public, search/filter/pagination.
```

**Dữ liệu test:**

```text
VIDEO_A; title=Hướng dẫn đậu hũ; videoMediaId=VIDEO_MEDIA_READY; progressSeconds=30
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/videos với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: Danh sách video published/public, search/filter/pagination; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0640"></a>

### API-0640

**Chức năng:** GET /api/v1/videos

**Module:** Video hướng dẫn · **Loại:** Empty result · **Ưu tiên:** P2 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 641 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Không có dữ liệu khớp filter hoặc user mới
```

**Dữ liệu test:**

```text
Filter hợp lệ không có kết quả
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/videos với filter rỗng kết quả.
2. Kiểm tra payload.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; list rỗng/tổng bằng 0 đúng schema; không lỗi 500 hoặc dữ liệu user khác.
```

<a id="api-0641"></a>

### API-0641

**Chức năng:** GET /api/v1/videos/mine

**Module:** Video hướng dẫn · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 642 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Video hướng dẫn; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Video do mình tạo theo status.
```

**Dữ liệu test:**

```text
VIDEO_A; title=Hướng dẫn đậu hũ; videoMediaId=VIDEO_MEDIA_READY; progressSeconds=30
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/videos/mine với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: Video do mình tạo theo status; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0642"></a>

### API-0642

**Chức năng:** GET /api/v1/videos/mine

**Module:** Video hướng dẫn · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 643 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Video hướng dẫn; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Video do mình tạo theo status.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi GET /api/v1/videos/mine không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0643"></a>

### API-0643

**Chức năng:** GET /api/v1/videos/mine

**Module:** Video hướng dẫn · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 644 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Video hướng dẫn; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Video do mình tạo theo status.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/videos/mine với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0644"></a>

### API-0644

**Chức năng:** GET /api/v1/videos/mine

**Module:** Video hướng dẫn · **Loại:** Empty result · **Ưu tiên:** P2 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 645 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Không có dữ liệu khớp filter hoặc user mới
```

**Dữ liệu test:**

```text
Filter hợp lệ không có kết quả
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/videos/mine với filter rỗng kết quả.
2. Kiểm tra payload.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; list rỗng/tổng bằng 0 đúng schema; không lỗi 500 hoặc dữ liệu user khác.
```

<a id="api-0645"></a>

### API-0645

**Chức năng:** GET /api/v1/videos/:idOrSlug

**Module:** Video hướng dẫn · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 646 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Video hướng dẫn; không gửi token; target đúng trạng thái cho Chi tiết video và trạng thái saved/reacted/rated/progress.
```

**Dữ liệu test:**

```text
VIDEO_A; title=Hướng dẫn đậu hũ; videoMediaId=VIDEO_MEDIA_READY; progressSeconds=30
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/videos/:idOrSlug với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: Chi tiết video và trạng thái saved/reacted/rated/progress; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0646"></a>

### API-0646

**Chức năng:** GET /api/v1/videos/:idOrSlug

**Module:** Video hướng dẫn · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 647 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/videos/:idOrSlug với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0647"></a>

### API-0647

**Chức năng:** POST /api/v1/videos

**Module:** Video hướng dẫn · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 648 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Video hướng dẫn; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Tạo draft từ `videoMediaId` ready.
```

**Dữ liệu test:**

```text
VIDEO_A; title=Hướng dẫn đậu hũ; videoMediaId=VIDEO_MEDIA_READY; progressSeconds=30
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi POST /api/v1/videos với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Tạo draft từ `videoMediaId` ready; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0648"></a>

### API-0648

**Chức năng:** POST /api/v1/videos

**Module:** Video hướng dẫn · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 649 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Video hướng dẫn; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Tạo draft từ `videoMediaId` ready.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi POST /api/v1/videos không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0649"></a>

### API-0649

**Chức năng:** POST /api/v1/videos

**Module:** Video hướng dẫn · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 650 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Video hướng dẫn; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Tạo draft từ `videoMediaId` ready.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/videos với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0650"></a>

### API-0650

**Chức năng:** POST /api/v1/videos

**Module:** Video hướng dẫn · **Loại:** Invalid payload · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 651 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Video hướng dẫn; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Tạo draft từ `videoMediaId` ready.
```

**Dữ liệu test:**

```text
Body chứa field bắt buộc rỗng/sai type; PATCH={} hoặc score=6/quantity=-1 khi áp dụng
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/videos với body sai schema.
2. Đối chiếu field error.
3. Xác minh DB giữ nguyên.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 400 VALIDATION_ERROR; details chỉ rõ field; không lưu dữ liệu sai.
```

<a id="api-0651"></a>

### API-0651

**Chức năng:** PATCH /api/v1/videos/:id

**Module:** Video hướng dẫn · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 652 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Video hướng dẫn; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Sửa metadata khi trạng thái cho phép.
```

**Dữ liệu test:**

```text
VIDEO_A; title=Hướng dẫn đậu hũ; videoMediaId=VIDEO_MEDIA_READY; progressSeconds=30
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi PATCH /api/v1/videos/:id với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Sửa metadata khi trạng thái cho phép; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0652"></a>

### API-0652

**Chức năng:** PATCH /api/v1/videos/:id

**Module:** Video hướng dẫn · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 653 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Video hướng dẫn; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Sửa metadata khi trạng thái cho phép.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi PATCH /api/v1/videos/:id không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0653"></a>

### API-0653

**Chức năng:** PATCH /api/v1/videos/:id

**Module:** Video hướng dẫn · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 654 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Video hướng dẫn; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Sửa metadata khi trạng thái cho phép.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/videos/:id với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0654"></a>

### API-0654

**Chức năng:** PATCH /api/v1/videos/:id

**Module:** Video hướng dẫn · **Loại:** Cross-user access · **Ưu tiên:** P0 · **Actor:** User B

**Nguồn Excel:** API Cases, hàng 655 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Target thuộc User A; User B có token hợp lệ
```

**Dữ liệu test:**

```text
VIDEO_A (không thuộc B); title=Hướng dẫn đậu hũ; videoMediaId=VIDEO_MEDIA_READY; progressSeconds=30
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/videos/:id với ID của User A và token B.
2. Kiểm tra response/DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403 hoặc 404 theo chính sách chống dò ID; không lộ dữ liệu A; không mutation.
```

<a id="api-0655"></a>

### API-0655

**Chức năng:** PATCH /api/v1/videos/:id

**Module:** Video hướng dẫn · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 656 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/videos/:id với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0656"></a>

### API-0656

**Chức năng:** PATCH /api/v1/videos/:id

**Module:** Video hướng dẫn · **Loại:** Invalid payload · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 657 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Video hướng dẫn; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Sửa metadata khi trạng thái cho phép.
```

**Dữ liệu test:**

```text
Body chứa field bắt buộc rỗng/sai type; PATCH={} hoặc score=6/quantity=-1 khi áp dụng
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/videos/:id với body sai schema.
2. Đối chiếu field error.
3. Xác minh DB giữ nguyên.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 400 VALIDATION_ERROR; details chỉ rõ field; không lưu dữ liệu sai.
```

<a id="api-0657"></a>

### API-0657

**Chức năng:** DELETE /api/v1/videos/:id

**Module:** Video hướng dẫn · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 658 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Video hướng dẫn; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Soft delete.
```

**Dữ liệu test:**

```text
VIDEO_A; title=Hướng dẫn đậu hũ; videoMediaId=VIDEO_MEDIA_READY; progressSeconds=30
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi DELETE /api/v1/videos/:id với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Soft delete; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0658"></a>

### API-0658

**Chức năng:** DELETE /api/v1/videos/:id

**Module:** Video hướng dẫn · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 659 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Video hướng dẫn; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Soft delete.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi DELETE /api/v1/videos/:id không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0659"></a>

### API-0659

**Chức năng:** DELETE /api/v1/videos/:id

**Module:** Video hướng dẫn · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 660 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Video hướng dẫn; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Soft delete.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi DELETE /api/v1/videos/:id với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0660"></a>

### API-0660

**Chức năng:** DELETE /api/v1/videos/:id

**Module:** Video hướng dẫn · **Loại:** Cross-user access · **Ưu tiên:** P0 · **Actor:** User B

**Nguồn Excel:** API Cases, hàng 661 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Target thuộc User A; User B có token hợp lệ
```

**Dữ liệu test:**

```text
VIDEO_A (không thuộc B); title=Hướng dẫn đậu hũ; videoMediaId=VIDEO_MEDIA_READY; progressSeconds=30
```

**Các bước thực hiện:**

```text
1. Gửi DELETE /api/v1/videos/:id với ID của User A và token B.
2. Kiểm tra response/DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403 hoặc 404 theo chính sách chống dò ID; không lộ dữ liệu A; không mutation.
```

<a id="api-0661"></a>

### API-0661

**Chức năng:** DELETE /api/v1/videos/:id

**Module:** Video hướng dẫn · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 662 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi DELETE /api/v1/videos/:id với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0662"></a>

### API-0662

**Chức năng:** POST /api/v1/videos/:id/submit

**Module:** Video hướng dẫn · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 663 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Video hướng dẫn; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Gửi duyệt.
```

**Dữ liệu test:**

```text
VIDEO_A; title=Hướng dẫn đậu hũ; videoMediaId=VIDEO_MEDIA_READY; progressSeconds=30
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi POST /api/v1/videos/:id/submit với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Gửi duyệt; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0663"></a>

### API-0663

**Chức năng:** POST /api/v1/videos/:id/submit

**Module:** Video hướng dẫn · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 664 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Video hướng dẫn; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Gửi duyệt.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi POST /api/v1/videos/:id/submit không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0664"></a>

### API-0664

**Chức năng:** POST /api/v1/videos/:id/submit

**Module:** Video hướng dẫn · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 665 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Video hướng dẫn; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Gửi duyệt.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/videos/:id/submit với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0665"></a>

### API-0665

**Chức năng:** POST /api/v1/videos/:id/submit

**Module:** Video hướng dẫn · **Loại:** Cross-user access · **Ưu tiên:** P0 · **Actor:** User B

**Nguồn Excel:** API Cases, hàng 666 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Target thuộc User A; User B có token hợp lệ
```

**Dữ liệu test:**

```text
VIDEO_A (không thuộc B); title=Hướng dẫn đậu hũ; videoMediaId=VIDEO_MEDIA_READY; progressSeconds=30
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/videos/:id/submit với ID của User A và token B.
2. Kiểm tra response/DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403 hoặc 404 theo chính sách chống dò ID; không lộ dữ liệu A; không mutation.
```

<a id="api-0666"></a>

### API-0666

**Chức năng:** POST /api/v1/videos/:id/submit

**Module:** Video hướng dẫn · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 667 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/videos/:id/submit với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0667"></a>

### API-0667

**Chức năng:** POST /api/v1/videos/:id/publish

**Module:** Video hướng dẫn · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 668 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Video hướng dẫn; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Publish sau khi kiểm tra media.
```

**Dữ liệu test:**

```text
VIDEO_A; title=Hướng dẫn đậu hũ; videoMediaId=VIDEO_MEDIA_READY; progressSeconds=30
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi POST /api/v1/videos/:id/publish với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Publish sau khi kiểm tra media; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0668"></a>

### API-0668

**Chức năng:** POST /api/v1/videos/:id/publish

**Module:** Video hướng dẫn · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 669 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Video hướng dẫn; Admin active, có Firebase token bị bỏ; target đúng trạng thái cho Publish sau khi kiểm tra media.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi POST /api/v1/videos/:id/publish không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0669"></a>

### API-0669

**Chức năng:** POST /api/v1/videos/:id/publish

**Module:** Video hướng dẫn · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 670 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Video hướng dẫn; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Publish sau khi kiểm tra media.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/videos/:id/publish với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0670"></a>

### API-0670

**Chức năng:** POST /api/v1/videos/:id/publish

**Module:** Video hướng dẫn · **Loại:** Role denied · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 671 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
User A active có role=user; target hợp lệ
```

**Dữ liệu test:**

```text
VIDEO_A; title=Hướng dẫn đậu hũ; videoMediaId=VIDEO_MEDIA_READY; progressSeconds=30
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/videos/:id/publish bằng token user.
2. Kiểm tra DB/audit.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403; không đọc admin data hoặc thực hiện mutation; không nâng quyền.
```

<a id="api-0671"></a>

### API-0671

**Chức năng:** POST /api/v1/videos/:id/publish

**Module:** Video hướng dẫn · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 672 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/videos/:id/publish với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0672"></a>

### API-0672

**Chức năng:** POST /api/v1/videos/:id/reject

**Module:** Video hướng dẫn · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 673 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Video hướng dẫn; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Từ chối có lý do.
```

**Dữ liệu test:**

```text
VIDEO_A; title=Hướng dẫn đậu hũ; videoMediaId=VIDEO_MEDIA_READY; progressSeconds=30
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi POST /api/v1/videos/:id/reject với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Từ chối có lý do; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0673"></a>

### API-0673

**Chức năng:** POST /api/v1/videos/:id/reject

**Module:** Video hướng dẫn · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 674 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Video hướng dẫn; Admin active, có Firebase token bị bỏ; target đúng trạng thái cho Từ chối có lý do.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi POST /api/v1/videos/:id/reject không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0674"></a>

### API-0674

**Chức năng:** POST /api/v1/videos/:id/reject

**Module:** Video hướng dẫn · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 675 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Video hướng dẫn; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Từ chối có lý do.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/videos/:id/reject với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0675"></a>

### API-0675

**Chức năng:** POST /api/v1/videos/:id/reject

**Module:** Video hướng dẫn · **Loại:** Role denied · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 676 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
User A active có role=user; target hợp lệ
```

**Dữ liệu test:**

```text
VIDEO_A; title=Hướng dẫn đậu hũ; videoMediaId=VIDEO_MEDIA_READY; progressSeconds=30
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/videos/:id/reject bằng token user.
2. Kiểm tra DB/audit.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403; không đọc admin data hoặc thực hiện mutation; không nâng quyền.
```

<a id="api-0676"></a>

### API-0676

**Chức năng:** POST /api/v1/videos/:id/reject

**Module:** Video hướng dẫn · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 677 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/videos/:id/reject với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0677"></a>

### API-0677

**Chức năng:** GET /api/v1/videos/:id/related

**Module:** Video hướng dẫn · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 678 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Video hướng dẫn; không gửi token; target đúng trạng thái cho Video/recipe liên quan đã publish.
```

**Dữ liệu test:**

```text
VIDEO_A; title=Hướng dẫn đậu hũ; videoMediaId=VIDEO_MEDIA_READY; progressSeconds=30
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/videos/:id/related với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: Video/recipe liên quan đã publish; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0678"></a>

### API-0678

**Chức năng:** GET /api/v1/videos/:id/related

**Module:** Video hướng dẫn · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 679 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/videos/:id/related với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0679"></a>

### API-0679

**Chức năng:** PUT /api/v1/videos/:id/progress

**Module:** Video hướng dẫn · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 680 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Video hướng dẫn; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Upsert thời lượng đã xem/completed.
```

**Dữ liệu test:**

```text
VIDEO_A; title=Hướng dẫn đậu hũ; videoMediaId=VIDEO_MEDIA_READY; progressSeconds=30
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi PUT /api/v1/videos/:id/progress với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Upsert thời lượng đã xem/completed; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0680"></a>

### API-0680

**Chức năng:** PUT /api/v1/videos/:id/progress

**Module:** Video hướng dẫn · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 681 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Video hướng dẫn; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Upsert thời lượng đã xem/completed.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi PUT /api/v1/videos/:id/progress không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0681"></a>

### API-0681

**Chức năng:** PUT /api/v1/videos/:id/progress

**Module:** Video hướng dẫn · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 682 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Video hướng dẫn; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Upsert thời lượng đã xem/completed.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi PUT /api/v1/videos/:id/progress với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0682"></a>

### API-0682

**Chức năng:** PUT /api/v1/videos/:id/progress

**Module:** Video hướng dẫn · **Loại:** Cross-user access · **Ưu tiên:** P0 · **Actor:** User B

**Nguồn Excel:** API Cases, hàng 683 · **Kết quả chạy:** Không đạt

**Điều kiện trước khi test:**

```text
Target thuộc User A; User B có token hợp lệ
```

**Dữ liệu test:**

```text
VIDEO_A (không thuộc B); title=Hướng dẫn đậu hũ; videoMediaId=VIDEO_MEDIA_READY; progressSeconds=30
```

**Các bước thực hiện:**

```text
1. Gửi PUT /api/v1/videos/:id/progress với ID của User A và token B.
2. Kiểm tra response/DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403 hoặc 404 theo chính sách chống dò ID; không lộ dữ liệu A; không mutation.
```

<a id="api-0683"></a>

### API-0683

**Chức năng:** PUT /api/v1/videos/:id/progress

**Module:** Video hướng dẫn · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 684 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi PUT /api/v1/videos/:id/progress với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0684"></a>

### API-0684

**Chức năng:** PUT /api/v1/videos/:id/progress

**Module:** Video hướng dẫn · **Loại:** Invalid payload · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 685 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Video hướng dẫn; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Upsert thời lượng đã xem/completed.
```

**Dữ liệu test:**

```text
Body chứa field bắt buộc rỗng/sai type; PATCH={} hoặc score=6/quantity=-1 khi áp dụng
```

**Các bước thực hiện:**

```text
1. Gửi PUT /api/v1/videos/:id/progress với body sai schema.
2. Đối chiếu field error.
3. Xác minh DB giữ nguyên.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 400 VALIDATION_ERROR; details chỉ rõ field; không lưu dữ liệu sai.
```

<a id="api-0685"></a>

### API-0685

**Chức năng:** GET /api/v1/videos/:id/transcript

**Module:** Video hướng dẫn · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 686 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Video hướng dẫn; không gửi token; target đúng trạng thái cho Transcript/chapter của video published nếu có.
```

**Dữ liệu test:**

```text
VIDEO_A; title=Hướng dẫn đậu hũ; videoMediaId=VIDEO_MEDIA_READY; progressSeconds=30
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/videos/:id/transcript với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: Transcript/chapter của video published nếu có; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0686"></a>

### API-0686

**Chức năng:** GET /api/v1/videos/:id/transcript

**Module:** Video hướng dẫn · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 687 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/videos/:id/transcript với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0687"></a>

### API-0687

**Chức năng:** POST /api/v1/videos/:id/generate-summary

**Module:** Video hướng dẫn · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 688 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Video hướng dẫn; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Yêu cầu AI tạo transcript/summary khi owner có quyền và AI bật.
```

**Dữ liệu test:**

```text
VIDEO_A; title=Hướng dẫn đậu hũ; videoMediaId=VIDEO_MEDIA_READY; progressSeconds=30
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi POST /api/v1/videos/:id/generate-summary với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Yêu cầu AI tạo transcript/summary khi owner có quyền và AI bật; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0688"></a>

### API-0688

**Chức năng:** POST /api/v1/videos/:id/generate-summary

**Module:** Video hướng dẫn · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 689 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Video hướng dẫn; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Yêu cầu AI tạo transcript/summary khi owner có quyền và AI bật.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi POST /api/v1/videos/:id/generate-summary không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0689"></a>

### API-0689

**Chức năng:** POST /api/v1/videos/:id/generate-summary

**Module:** Video hướng dẫn · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 690 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Video hướng dẫn; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Yêu cầu AI tạo transcript/summary khi owner có quyền và AI bật.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/videos/:id/generate-summary với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0690"></a>

### API-0690

**Chức năng:** POST /api/v1/videos/:id/generate-summary

**Module:** Video hướng dẫn · **Loại:** Cross-user access · **Ưu tiên:** P0 · **Actor:** User B

**Nguồn Excel:** API Cases, hàng 691 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Target thuộc User A; User B có token hợp lệ
```

**Dữ liệu test:**

```text
VIDEO_A (không thuộc B); title=Hướng dẫn đậu hũ; videoMediaId=VIDEO_MEDIA_READY; progressSeconds=30
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/videos/:id/generate-summary với ID của User A và token B.
2. Kiểm tra response/DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403 hoặc 404 theo chính sách chống dò ID; không lộ dữ liệu A; không mutation.
```

<a id="api-0691"></a>

### API-0691

**Chức năng:** POST /api/v1/videos/:id/generate-summary

**Module:** Video hướng dẫn · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 692 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi POST /api/v1/videos/:id/generate-summary với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="module-17"></a>

## Rating, vote và lịch sử xem

| ID                    | Chức năng / endpoint                              | Loại test       | Ưu tiên | Actor  | Kết quả chạy |
| --------------------- | ------------------------------------------------- | --------------- | ------- | ------ | ------------ |
| [API-0692](#api-0692) | PUT /api/v1/ratings/:targetType/:targetId         | Happy path      | P1      | User A | Đạt          |
| [API-0693](#api-0693) | PUT /api/v1/ratings/:targetType/:targetId         | Missing auth    | P0      | Guest  | Đạt          |
| [API-0694](#api-0694) | PUT /api/v1/ratings/:targetType/:targetId         | Invalid auth    | P0      | User A | Đạt          |
| [API-0695](#api-0695) | PUT /api/v1/ratings/:targetType/:targetId         | Invalid payload | P1      | User A | Đạt          |
| [API-0696](#api-0696) | DELETE /api/v1/ratings/:targetType/:targetId      | Happy path      | P1      | User A | Đạt          |
| [API-0697](#api-0697) | DELETE /api/v1/ratings/:targetType/:targetId      | Missing auth    | P0      | Guest  | Đạt          |
| [API-0698](#api-0698) | DELETE /api/v1/ratings/:targetType/:targetId      | Invalid auth    | P0      | User A | Đạt          |
| [API-0699](#api-0699) | GET /api/v1/ratings/:targetType/:targetId/summary | Happy path      | P1      | Guest  | Đạt          |
| [API-0700](#api-0700) | GET /api/v1/view-history                          | Happy path      | P1      | User A | Đạt          |
| [API-0701](#api-0701) | GET /api/v1/view-history                          | Missing auth    | P0      | Guest  | Đạt          |
| [API-0702](#api-0702) | GET /api/v1/view-history                          | Invalid auth    | P0      | User A | Đạt          |
| [API-0703](#api-0703) | GET /api/v1/view-history                          | Empty result    | P2      | User A | Đạt          |
| [API-0704](#api-0704) | DELETE /api/v1/view-history                       | Happy path      | P1      | User A | Đạt          |
| [API-0705](#api-0705) | DELETE /api/v1/view-history                       | Missing auth    | P0      | Guest  | Đạt          |
| [API-0706](#api-0706) | DELETE /api/v1/view-history                       | Invalid auth    | P0      | User A | Đạt          |
| [API-0707](#api-0707) | DELETE /api/v1/view-history/:targetType/:targetId | Happy path      | P1      | User A | Đạt          |
| [API-0708](#api-0708) | DELETE /api/v1/view-history/:targetType/:targetId | Missing auth    | P0      | Guest  | Đạt          |
| [API-0709](#api-0709) | DELETE /api/v1/view-history/:targetType/:targetId | Invalid auth    | P0      | User A | Đạt          |
| [API-0710](#api-0710) | PUT /api/v1/view-history/:targetType/:targetId    | Happy path      | P1      | User A | Đạt          |
| [API-0711](#api-0711) | PUT /api/v1/view-history/:targetType/:targetId    | Missing auth    | P0      | Guest  | Đạt          |
| [API-0712](#api-0712) | PUT /api/v1/view-history/:targetType/:targetId    | Invalid auth    | P0      | User A | Đạt          |
| [API-0713](#api-0713) | PUT /api/v1/view-history/:targetType/:targetId    | Invalid payload | P1      | User A | Đạt          |

<a id="api-0692"></a>

### API-0692

**Chức năng:** PUT /api/v1/ratings/:targetType/:targetId

**Module:** Rating, vote và lịch sử xem · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 693 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Rating, vote và lịch sử xem; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Upsert score/review cho recipe hoặc video.
```

**Dữ liệu test:**

```text
{score:4,review: Dễ thực hiện}
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi PUT /api/v1/ratings/:targetType/:targetId với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Upsert score/review cho recipe hoặc video; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0693"></a>

### API-0693

**Chức năng:** PUT /api/v1/ratings/:targetType/:targetId

**Module:** Rating, vote và lịch sử xem · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 694 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Rating, vote và lịch sử xem; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Upsert score/review cho recipe hoặc video.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi PUT /api/v1/ratings/:targetType/:targetId không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0694"></a>

### API-0694

**Chức năng:** PUT /api/v1/ratings/:targetType/:targetId

**Module:** Rating, vote và lịch sử xem · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 695 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Rating, vote và lịch sử xem; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Upsert score/review cho recipe hoặc video.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi PUT /api/v1/ratings/:targetType/:targetId với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0695"></a>

### API-0695

**Chức năng:** PUT /api/v1/ratings/:targetType/:targetId

**Module:** Rating, vote và lịch sử xem · **Loại:** Invalid payload · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 696 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Rating, vote và lịch sử xem; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Upsert score/review cho recipe hoặc video.
```

**Dữ liệu test:**

```text
Body chứa field bắt buộc rỗng/sai type; PATCH={} hoặc score=6/quantity=-1 khi áp dụng
```

**Các bước thực hiện:**

```text
1. Gửi PUT /api/v1/ratings/:targetType/:targetId với body sai schema.
2. Đối chiếu field error.
3. Xác minh DB giữ nguyên.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 400 VALIDATION_ERROR; details chỉ rõ field; không lưu dữ liệu sai.
```

<a id="api-0696"></a>

### API-0696

**Chức năng:** DELETE /api/v1/ratings/:targetType/:targetId

**Module:** Rating, vote và lịch sử xem · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 697 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Rating, vote và lịch sử xem; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Xóa rating của mình.
```

**Dữ liệu test:**

```text
{score:4,review: Dễ thực hiện}
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi DELETE /api/v1/ratings/:targetType/:targetId với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Xóa rating của mình; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0697"></a>

### API-0697

**Chức năng:** DELETE /api/v1/ratings/:targetType/:targetId

**Module:** Rating, vote và lịch sử xem · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 698 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Rating, vote và lịch sử xem; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Xóa rating của mình.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi DELETE /api/v1/ratings/:targetType/:targetId không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0698"></a>

### API-0698

**Chức năng:** DELETE /api/v1/ratings/:targetType/:targetId

**Module:** Rating, vote và lịch sử xem · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 699 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Rating, vote và lịch sử xem; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Xóa rating của mình.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi DELETE /api/v1/ratings/:targetType/:targetId với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0699"></a>

### API-0699

**Chức năng:** GET /api/v1/ratings/:targetType/:targetId/summary

**Module:** Rating, vote và lịch sử xem · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 700 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Rating, vote và lịch sử xem; không gửi token; target đúng trạng thái cho Average/count/distribution và rating của current user nếu có.
```

**Dữ liệu test:**

```text
{score:4,review: Dễ thực hiện}
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/ratings/:targetType/:targetId/summary với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: Average/count/distribution và rating của current user nếu có; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0700"></a>

### API-0700

**Chức năng:** GET /api/v1/view-history

**Module:** Rating, vote và lịch sử xem · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 701 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Rating, vote và lịch sử xem; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Lịch sử recipe/post/video, filter type.
```

**Dữ liệu test:**

```text
Fixture đúng schema OpenAPI; ID User A/target A; page=1,limit=20 cho list; reason=kiểm tra khi moderation
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/view-history với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: Lịch sử recipe/post/video, filter type; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0701"></a>

### API-0701

**Chức năng:** GET /api/v1/view-history

**Module:** Rating, vote và lịch sử xem · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 702 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Rating, vote và lịch sử xem; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Lịch sử recipe/post/video, filter type.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi GET /api/v1/view-history không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0702"></a>

### API-0702

**Chức năng:** GET /api/v1/view-history

**Module:** Rating, vote và lịch sử xem · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 703 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Rating, vote và lịch sử xem; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Lịch sử recipe/post/video, filter type.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/view-history với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0703"></a>

### API-0703

**Chức năng:** GET /api/v1/view-history

**Module:** Rating, vote và lịch sử xem · **Loại:** Empty result · **Ưu tiên:** P2 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 704 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Không có dữ liệu khớp filter hoặc user mới
```

**Dữ liệu test:**

```text
Filter hợp lệ không có kết quả
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/view-history với filter rỗng kết quả.
2. Kiểm tra payload.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; list rỗng/tổng bằng 0 đúng schema; không lỗi 500 hoặc dữ liệu user khác.
```

<a id="api-0704"></a>

### API-0704

**Chức năng:** DELETE /api/v1/view-history

**Module:** Rating, vote và lịch sử xem · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 705 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Rating, vote và lịch sử xem; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Xóa toàn bộ lịch sử của mình.
```

**Dữ liệu test:**

```text
Fixture đúng schema OpenAPI; ID User A/target A; page=1,limit=20 cho list; reason=kiểm tra khi moderation
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi DELETE /api/v1/view-history với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Xóa toàn bộ lịch sử của mình; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0705"></a>

### API-0705

**Chức năng:** DELETE /api/v1/view-history

**Module:** Rating, vote và lịch sử xem · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 706 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Rating, vote và lịch sử xem; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Xóa toàn bộ lịch sử của mình.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi DELETE /api/v1/view-history không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0706"></a>

### API-0706

**Chức năng:** DELETE /api/v1/view-history

**Module:** Rating, vote và lịch sử xem · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 707 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Rating, vote và lịch sử xem; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Xóa toàn bộ lịch sử của mình.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi DELETE /api/v1/view-history với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0707"></a>

### API-0707

**Chức năng:** DELETE /api/v1/view-history/:targetType/:targetId

**Module:** Rating, vote và lịch sử xem · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 708 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Rating, vote và lịch sử xem; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Xóa một mục lịch sử.
```

**Dữ liệu test:**

```text
Fixture đúng schema OpenAPI; ID User A/target A; page=1,limit=20 cho list; reason=kiểm tra khi moderation
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi DELETE /api/v1/view-history/:targetType/:targetId với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Xóa một mục lịch sử; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0708"></a>

### API-0708

**Chức năng:** DELETE /api/v1/view-history/:targetType/:targetId

**Module:** Rating, vote và lịch sử xem · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 709 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Rating, vote và lịch sử xem; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Xóa một mục lịch sử.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi DELETE /api/v1/view-history/:targetType/:targetId không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0709"></a>

### API-0709

**Chức năng:** DELETE /api/v1/view-history/:targetType/:targetId

**Module:** Rating, vote và lịch sử xem · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 710 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Rating, vote và lịch sử xem; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Xóa một mục lịch sử.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi DELETE /api/v1/view-history/:targetType/:targetId với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0710"></a>

### API-0710

**Chức năng:** PUT /api/v1/view-history/:targetType/:targetId

**Module:** Rating, vote và lịch sử xem · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 711 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Rating, vote và lịch sử xem; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Ghi nhận xem; video progress ưu tiên endpoint video chuyên biệt.
```

**Dữ liệu test:**

```text
Fixture đúng schema OpenAPI; ID User A/target A; page=1,limit=20 cho list; reason=kiểm tra khi moderation
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi PUT /api/v1/view-history/:targetType/:targetId với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Ghi nhận xem; video progress ưu tiên endpoint video chuyên biệt; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0711"></a>

### API-0711

**Chức năng:** PUT /api/v1/view-history/:targetType/:targetId

**Module:** Rating, vote và lịch sử xem · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 712 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Rating, vote và lịch sử xem; User A active, có Firebase token bị bỏ; target đúng trạng thái cho Ghi nhận xem; video progress ưu tiên endpoint video chuyên biệt.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi PUT /api/v1/view-history/:targetType/:targetId không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0712"></a>

### API-0712

**Chức năng:** PUT /api/v1/view-history/:targetType/:targetId

**Module:** Rating, vote và lịch sử xem · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 713 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Rating, vote và lịch sử xem; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Ghi nhận xem; video progress ưu tiên endpoint video chuyên biệt.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi PUT /api/v1/view-history/:targetType/:targetId với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0713"></a>

### API-0713

**Chức năng:** PUT /api/v1/view-history/:targetType/:targetId

**Module:** Rating, vote và lịch sử xem · **Loại:** Invalid payload · **Ưu tiên:** P1 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 714 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Rating, vote và lịch sử xem; User A active, có Firebase token hợp lệ; target đúng trạng thái cho Ghi nhận xem; video progress ưu tiên endpoint video chuyên biệt.
```

**Dữ liệu test:**

```text
Body chứa field bắt buộc rỗng/sai type; PATCH={} hoặc score=6/quantity=-1 khi áp dụng
```

**Các bước thực hiện:**

```text
1. Gửi PUT /api/v1/view-history/:targetType/:targetId với body sai schema.
2. Đối chiếu field error.
3. Xác minh DB giữ nguyên.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 400 VALIDATION_ERROR; details chỉ rõ field; không lưu dữ liệu sai.
```

<a id="module-18"></a>

## Dashboard quản trị và giám sát AI

| ID                    | Chức năng / endpoint                       | Loại test       | Ưu tiên | Actor  | Kết quả chạy |
| --------------------- | ------------------------------------------ | --------------- | ------- | ------ | ------------ |
| [API-0714](#api-0714) | GET /api/v1/admin/dashboard/summary        | Happy path      | P1      | Admin  | Đạt          |
| [API-0715](#api-0715) | GET /api/v1/admin/dashboard/summary        | Missing auth    | P0      | Guest  | Đạt          |
| [API-0716](#api-0716) | GET /api/v1/admin/dashboard/summary        | Invalid auth    | P0      | Admin  | Đạt          |
| [API-0717](#api-0717) | GET /api/v1/admin/dashboard/summary        | Role denied     | P0      | User A | Đạt          |
| [API-0718](#api-0718) | GET /api/v1/admin/dashboard/summary        | Empty result    | P2      | Admin  | Đạt          |
| [API-0719](#api-0719) | GET /api/v1/admin/dashboard/content-trends | Happy path      | P1      | Admin  | Đạt          |
| [API-0720](#api-0720) | GET /api/v1/admin/dashboard/content-trends | Missing auth    | P0      | Guest  | Đạt          |
| [API-0721](#api-0721) | GET /api/v1/admin/dashboard/content-trends | Invalid auth    | P0      | Admin  | Đạt          |
| [API-0722](#api-0722) | GET /api/v1/admin/dashboard/content-trends | Role denied     | P0      | User A | Đạt          |
| [API-0723](#api-0723) | GET /api/v1/admin/dashboard/content-trends | Empty result    | P2      | Admin  | Đạt          |
| [API-0724](#api-0724) | GET /api/v1/admin/dashboard/user-trends    | Happy path      | P1      | Admin  | Đạt          |
| [API-0725](#api-0725) | GET /api/v1/admin/dashboard/user-trends    | Missing auth    | P0      | Guest  | Đạt          |
| [API-0726](#api-0726) | GET /api/v1/admin/dashboard/user-trends    | Invalid auth    | P0      | Admin  | Đạt          |
| [API-0727](#api-0727) | GET /api/v1/admin/dashboard/user-trends    | Role denied     | P0      | User A | Đạt          |
| [API-0728](#api-0728) | GET /api/v1/admin/dashboard/user-trends    | Empty result    | P2      | Admin  | Đạt          |
| [API-0729](#api-0729) | GET /api/v1/admin/content/pending          | Happy path      | P1      | Admin  | Đạt          |
| [API-0730](#api-0730) | GET /api/v1/admin/content/pending          | Missing auth    | P0      | Guest  | Đạt          |
| [API-0731](#api-0731) | GET /api/v1/admin/content/pending          | Invalid auth    | P0      | Admin  | Đạt          |
| [API-0732](#api-0732) | GET /api/v1/admin/content/pending          | Role denied     | P0      | User A | Đạt          |
| [API-0733](#api-0733) | GET /api/v1/admin/content/pending          | Empty result    | P2      | Admin  | Đạt          |
| [API-0734](#api-0734) | GET /api/v1/admin/users/:id                | Happy path      | P1      | Admin  | Đạt          |
| [API-0735](#api-0735) | GET /api/v1/admin/users/:id                | Missing auth    | P0      | Guest  | Đạt          |
| [API-0736](#api-0736) | GET /api/v1/admin/users/:id                | Invalid auth    | P0      | Admin  | Đạt          |
| [API-0737](#api-0737) | GET /api/v1/admin/users/:id                | Role denied     | P0      | User A | Đạt          |
| [API-0738](#api-0738) | GET /api/v1/admin/users/:id                | Missing target  | P1      | Admin  | Đạt          |
| [API-0739](#api-0739) | PATCH /api/v1/admin/users/:id/role         | Happy path      | P1      | Admin  | Đạt          |
| [API-0740](#api-0740) | PATCH /api/v1/admin/users/:id/role         | Missing auth    | P0      | Guest  | Đạt          |
| [API-0741](#api-0741) | PATCH /api/v1/admin/users/:id/role         | Invalid auth    | P0      | Admin  | Đạt          |
| [API-0742](#api-0742) | PATCH /api/v1/admin/users/:id/role         | Role denied     | P0      | User A | Đạt          |
| [API-0743](#api-0743) | PATCH /api/v1/admin/users/:id/role         | Missing target  | P1      | Admin  | Đạt          |
| [API-0744](#api-0744) | PATCH /api/v1/admin/users/:id/role         | Invalid payload | P1      | Admin  | Đạt          |
| [API-0745](#api-0745) | GET /api/v1/admin/ai/runs                  | Happy path      | P1      | Admin  | Đạt          |
| [API-0746](#api-0746) | GET /api/v1/admin/ai/runs                  | Missing auth    | P0      | Guest  | Đạt          |
| [API-0747](#api-0747) | GET /api/v1/admin/ai/runs                  | Invalid auth    | P0      | Admin  | Đạt          |
| [API-0748](#api-0748) | GET /api/v1/admin/ai/runs                  | Role denied     | P0      | User A | Đạt          |
| [API-0749](#api-0749) | GET /api/v1/admin/ai/runs                  | Empty result    | P2      | Admin  | Đạt          |
| [API-0750](#api-0750) | GET /api/v1/admin/ai/runs/:id              | Happy path      | P1      | Admin  | Đạt          |
| [API-0751](#api-0751) | GET /api/v1/admin/ai/runs/:id              | Missing auth    | P0      | Guest  | Đạt          |
| [API-0752](#api-0752) | GET /api/v1/admin/ai/runs/:id              | Invalid auth    | P0      | Admin  | Đạt          |
| [API-0753](#api-0753) | GET /api/v1/admin/ai/runs/:id              | Role denied     | P0      | User A | Đạt          |
| [API-0754](#api-0754) | GET /api/v1/admin/ai/runs/:id              | Missing target  | P1      | Admin  | Đạt          |
| [API-0755](#api-0755) | GET /api/v1/admin/ai/metrics               | Happy path      | P1      | Admin  | Đạt          |
| [API-0756](#api-0756) | GET /api/v1/admin/ai/metrics               | Missing auth    | P0      | Guest  | Đạt          |
| [API-0757](#api-0757) | GET /api/v1/admin/ai/metrics               | Invalid auth    | P0      | Admin  | Đạt          |
| [API-0758](#api-0758) | GET /api/v1/admin/ai/metrics               | Role denied     | P0      | User A | Đạt          |
| [API-0759](#api-0759) | GET /api/v1/admin/ai/metrics               | Empty result    | P2      | Admin  | Đạt          |
| [API-0760](#api-0760) | GET /api/v1/admin/ai/feedback              | Happy path      | P1      | Admin  | Đạt          |
| [API-0761](#api-0761) | GET /api/v1/admin/ai/feedback              | Missing auth    | P0      | Guest  | Đạt          |
| [API-0762](#api-0762) | GET /api/v1/admin/ai/feedback              | Invalid auth    | P0      | Admin  | Đạt          |
| [API-0763](#api-0763) | GET /api/v1/admin/ai/feedback              | Role denied     | P0      | User A | Đạt          |
| [API-0764](#api-0764) | GET /api/v1/admin/ai/feedback              | Empty result    | P2      | Admin  | Đạt          |

<a id="api-0714"></a>

### API-0714

**Chức năng:** GET /api/v1/admin/dashboard/summary

**Module:** Dashboard quản trị và giám sát AI · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 715 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Dashboard quản trị và giám sát AI; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Tổng quan user/content/report/AI trong range.
```

**Dữ liệu test:**

```text
Fixture đúng schema OpenAPI; ID User A/target A; page=1,limit=20 cho list; reason=kiểm tra khi moderation
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/admin/dashboard/summary với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: Tổng quan user/content/report/AI trong range; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0715"></a>

### API-0715

**Chức năng:** GET /api/v1/admin/dashboard/summary

**Module:** Dashboard quản trị và giám sát AI · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 716 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Dashboard quản trị và giám sát AI; Admin active, có Firebase token bị bỏ; target đúng trạng thái cho Tổng quan user/content/report/AI trong range.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi GET /api/v1/admin/dashboard/summary không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0716"></a>

### API-0716

**Chức năng:** GET /api/v1/admin/dashboard/summary

**Module:** Dashboard quản trị và giám sát AI · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 717 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Dashboard quản trị và giám sát AI; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Tổng quan user/content/report/AI trong range.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/admin/dashboard/summary với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0717"></a>

### API-0717

**Chức năng:** GET /api/v1/admin/dashboard/summary

**Module:** Dashboard quản trị và giám sát AI · **Loại:** Role denied · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 718 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
User A active có role=user; target hợp lệ
```

**Dữ liệu test:**

```text
Fixture đúng schema OpenAPI; ID User A/target A; page=1,limit=20 cho list; reason=kiểm tra khi moderation
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/admin/dashboard/summary bằng token user.
2. Kiểm tra DB/audit.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403; không đọc admin data hoặc thực hiện mutation; không nâng quyền.
```

<a id="api-0718"></a>

### API-0718

**Chức năng:** GET /api/v1/admin/dashboard/summary

**Module:** Dashboard quản trị và giám sát AI · **Loại:** Empty result · **Ưu tiên:** P2 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 719 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Không có dữ liệu khớp filter hoặc user mới
```

**Dữ liệu test:**

```text
Filter hợp lệ không có kết quả
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/admin/dashboard/summary với filter rỗng kết quả.
2. Kiểm tra payload.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; list rỗng/tổng bằng 0 đúng schema; không lỗi 500 hoặc dữ liệu user khác.
```

<a id="api-0719"></a>

### API-0719

**Chức năng:** GET /api/v1/admin/dashboard/content-trends

**Module:** Dashboard quản trị và giám sát AI · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 720 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Dashboard quản trị và giám sát AI; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Xu hướng recipe/post/video published/flagged.
```

**Dữ liệu test:**

```text
Fixture đúng schema OpenAPI; ID User A/target A; page=1,limit=20 cho list; reason=kiểm tra khi moderation
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/admin/dashboard/content-trends với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: Xu hướng recipe/post/video published/flagged; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0720"></a>

### API-0720

**Chức năng:** GET /api/v1/admin/dashboard/content-trends

**Module:** Dashboard quản trị và giám sát AI · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 721 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Dashboard quản trị và giám sát AI; Admin active, có Firebase token bị bỏ; target đúng trạng thái cho Xu hướng recipe/post/video published/flagged.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi GET /api/v1/admin/dashboard/content-trends không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0721"></a>

### API-0721

**Chức năng:** GET /api/v1/admin/dashboard/content-trends

**Module:** Dashboard quản trị và giám sát AI · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 722 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Dashboard quản trị và giám sát AI; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Xu hướng recipe/post/video published/flagged.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/admin/dashboard/content-trends với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0722"></a>

### API-0722

**Chức năng:** GET /api/v1/admin/dashboard/content-trends

**Module:** Dashboard quản trị và giám sát AI · **Loại:** Role denied · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 723 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
User A active có role=user; target hợp lệ
```

**Dữ liệu test:**

```text
Fixture đúng schema OpenAPI; ID User A/target A; page=1,limit=20 cho list; reason=kiểm tra khi moderation
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/admin/dashboard/content-trends bằng token user.
2. Kiểm tra DB/audit.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403; không đọc admin data hoặc thực hiện mutation; không nâng quyền.
```

<a id="api-0723"></a>

### API-0723

**Chức năng:** GET /api/v1/admin/dashboard/content-trends

**Module:** Dashboard quản trị và giám sát AI · **Loại:** Empty result · **Ưu tiên:** P2 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 724 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Không có dữ liệu khớp filter hoặc user mới
```

**Dữ liệu test:**

```text
Filter hợp lệ không có kết quả
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/admin/dashboard/content-trends với filter rỗng kết quả.
2. Kiểm tra payload.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; list rỗng/tổng bằng 0 đúng schema; không lỗi 500 hoặc dữ liệu user khác.
```

<a id="api-0724"></a>

### API-0724

**Chức năng:** GET /api/v1/admin/dashboard/user-trends

**Module:** Dashboard quản trị và giám sát AI · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 725 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Dashboard quản trị và giám sát AI; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho User active/new/suspended theo range.
```

**Dữ liệu test:**

```text
Fixture đúng schema OpenAPI; ID User A/target A; page=1,limit=20 cho list; reason=kiểm tra khi moderation
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/admin/dashboard/user-trends với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: User active/new/suspended theo range; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0725"></a>

### API-0725

**Chức năng:** GET /api/v1/admin/dashboard/user-trends

**Module:** Dashboard quản trị và giám sát AI · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 726 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Dashboard quản trị và giám sát AI; Admin active, có Firebase token bị bỏ; target đúng trạng thái cho User active/new/suspended theo range.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi GET /api/v1/admin/dashboard/user-trends không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0726"></a>

### API-0726

**Chức năng:** GET /api/v1/admin/dashboard/user-trends

**Module:** Dashboard quản trị và giám sát AI · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 727 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Dashboard quản trị và giám sát AI; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho User active/new/suspended theo range.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/admin/dashboard/user-trends với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0727"></a>

### API-0727

**Chức năng:** GET /api/v1/admin/dashboard/user-trends

**Module:** Dashboard quản trị và giám sát AI · **Loại:** Role denied · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 728 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
User A active có role=user; target hợp lệ
```

**Dữ liệu test:**

```text
Fixture đúng schema OpenAPI; ID User A/target A; page=1,limit=20 cho list; reason=kiểm tra khi moderation
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/admin/dashboard/user-trends bằng token user.
2. Kiểm tra DB/audit.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403; không đọc admin data hoặc thực hiện mutation; không nâng quyền.
```

<a id="api-0728"></a>

### API-0728

**Chức năng:** GET /api/v1/admin/dashboard/user-trends

**Module:** Dashboard quản trị và giám sát AI · **Loại:** Empty result · **Ưu tiên:** P2 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 729 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Không có dữ liệu khớp filter hoặc user mới
```

**Dữ liệu test:**

```text
Filter hợp lệ không có kết quả
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/admin/dashboard/user-trends với filter rỗng kết quả.
2. Kiểm tra payload.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; list rỗng/tổng bằng 0 đúng schema; không lỗi 500 hoặc dữ liệu user khác.
```

<a id="api-0729"></a>

### API-0729

**Chức năng:** GET /api/v1/admin/content/pending

**Module:** Dashboard quản trị và giám sát AI · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 730 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Dashboard quản trị và giám sát AI; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Queue recipe/post/video chờ duyệt.
```

**Dữ liệu test:**

```text
Fixture đúng schema OpenAPI; ID User A/target A; page=1,limit=20 cho list; reason=kiểm tra khi moderation
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/admin/content/pending với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: Queue recipe/post/video chờ duyệt; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0730"></a>

### API-0730

**Chức năng:** GET /api/v1/admin/content/pending

**Module:** Dashboard quản trị và giám sát AI · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 731 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Dashboard quản trị và giám sát AI; Admin active, có Firebase token bị bỏ; target đúng trạng thái cho Queue recipe/post/video chờ duyệt.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi GET /api/v1/admin/content/pending không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0731"></a>

### API-0731

**Chức năng:** GET /api/v1/admin/content/pending

**Module:** Dashboard quản trị và giám sát AI · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 732 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Dashboard quản trị và giám sát AI; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Queue recipe/post/video chờ duyệt.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/admin/content/pending với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0732"></a>

### API-0732

**Chức năng:** GET /api/v1/admin/content/pending

**Module:** Dashboard quản trị và giám sát AI · **Loại:** Role denied · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 733 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
User A active có role=user; target hợp lệ
```

**Dữ liệu test:**

```text
Fixture đúng schema OpenAPI; ID User A/target A; page=1,limit=20 cho list; reason=kiểm tra khi moderation
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/admin/content/pending bằng token user.
2. Kiểm tra DB/audit.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403; không đọc admin data hoặc thực hiện mutation; không nâng quyền.
```

<a id="api-0733"></a>

### API-0733

**Chức năng:** GET /api/v1/admin/content/pending

**Module:** Dashboard quản trị và giám sát AI · **Loại:** Empty result · **Ưu tiên:** P2 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 734 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Không có dữ liệu khớp filter hoặc user mới
```

**Dữ liệu test:**

```text
Filter hợp lệ không có kết quả
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/admin/content/pending với filter rỗng kết quả.
2. Kiểm tra payload.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; list rỗng/tổng bằng 0 đúng schema; không lỗi 500 hoặc dữ liệu user khác.
```

<a id="api-0734"></a>

### API-0734

**Chức năng:** GET /api/v1/admin/users/:id

**Module:** Dashboard quản trị và giám sát AI · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 735 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Dashboard quản trị và giám sát AI; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Chi tiết quản trị đã giới hạn dữ liệu nhạy cảm.
```

**Dữ liệu test:**

```text
Fixture đúng schema OpenAPI; ID User A/target A; page=1,limit=20 cho list; reason=kiểm tra khi moderation
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/admin/users/:id với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: Chi tiết quản trị đã giới hạn dữ liệu nhạy cảm; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0735"></a>

### API-0735

**Chức năng:** GET /api/v1/admin/users/:id

**Module:** Dashboard quản trị và giám sát AI · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 736 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Dashboard quản trị và giám sát AI; Admin active, có Firebase token bị bỏ; target đúng trạng thái cho Chi tiết quản trị đã giới hạn dữ liệu nhạy cảm.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi GET /api/v1/admin/users/:id không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0736"></a>

### API-0736

**Chức năng:** GET /api/v1/admin/users/:id

**Module:** Dashboard quản trị và giám sát AI · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 737 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Dashboard quản trị và giám sát AI; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Chi tiết quản trị đã giới hạn dữ liệu nhạy cảm.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/admin/users/:id với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0737"></a>

### API-0737

**Chức năng:** GET /api/v1/admin/users/:id

**Module:** Dashboard quản trị và giám sát AI · **Loại:** Role denied · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 738 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
User A active có role=user; target hợp lệ
```

**Dữ liệu test:**

```text
Fixture đúng schema OpenAPI; ID User A/target A; page=1,limit=20 cho list; reason=kiểm tra khi moderation
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/admin/users/:id bằng token user.
2. Kiểm tra DB/audit.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403; không đọc admin data hoặc thực hiện mutation; không nâng quyền.
```

<a id="api-0738"></a>

### API-0738

**Chức năng:** GET /api/v1/admin/users/:id

**Module:** Dashboard quản trị và giám sát AI · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 739 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/admin/users/:id với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0739"></a>

### API-0739

**Chức năng:** PATCH /api/v1/admin/users/:id/role

**Module:** Dashboard quản trị và giám sát AI · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 740 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Dashboard quản trị và giám sát AI; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Đổi role với guard chống tự hạ quyền admin cuối cùng.
```

**Dữ liệu test:**

```text
role=user; target User B; còn ít nhất 2 admin
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi PATCH /api/v1/admin/users/:id/role với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP thành công đúng OpenAPI (200/201; 204 chỉ nếu contract chốt); Đổi role với guard chống tự hạ quyền admin cuối cùng; mutation đúng target/owner; đọc lại xác nhận; không có side effect ngoài quyền.
```

<a id="api-0740"></a>

### API-0740

**Chức năng:** PATCH /api/v1/admin/users/:id/role

**Module:** Dashboard quản trị và giám sát AI · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 741 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Dashboard quản trị và giám sát AI; Admin active, có Firebase token bị bỏ; target đúng trạng thái cho Đổi role với guard chống tự hạ quyền admin cuối cùng.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi PATCH /api/v1/admin/users/:id/role không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0741"></a>

### API-0741

**Chức năng:** PATCH /api/v1/admin/users/:id/role

**Module:** Dashboard quản trị và giám sát AI · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 742 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Dashboard quản trị và giám sát AI; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Đổi role với guard chống tự hạ quyền admin cuối cùng.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/admin/users/:id/role với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0742"></a>

### API-0742

**Chức năng:** PATCH /api/v1/admin/users/:id/role

**Module:** Dashboard quản trị và giám sát AI · **Loại:** Role denied · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 743 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
User A active có role=user; target hợp lệ
```

**Dữ liệu test:**

```text
role=user; target User B; còn ít nhất 2 admin
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/admin/users/:id/role bằng token user.
2. Kiểm tra DB/audit.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403; không đọc admin data hoặc thực hiện mutation; không nâng quyền.
```

<a id="api-0743"></a>

### API-0743

**Chức năng:** PATCH /api/v1/admin/users/:id/role

**Module:** Dashboard quản trị và giám sát AI · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 744 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/admin/users/:id/role với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0744"></a>

### API-0744

**Chức năng:** PATCH /api/v1/admin/users/:id/role

**Module:** Dashboard quản trị và giám sát AI · **Loại:** Invalid payload · **Ưu tiên:** P1 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 745 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Dashboard quản trị và giám sát AI; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Đổi role với guard chống tự hạ quyền admin cuối cùng.
```

**Dữ liệu test:**

```text
Body chứa field bắt buộc rỗng/sai type; PATCH={} hoặc score=6/quantity=-1 khi áp dụng
```

**Các bước thực hiện:**

```text
1. Gửi PATCH /api/v1/admin/users/:id/role với body sai schema.
2. Đối chiếu field error.
3. Xác minh DB giữ nguyên.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 400 VALIDATION_ERROR; details chỉ rõ field; không lưu dữ liệu sai.
```

<a id="api-0745"></a>

### API-0745

**Chức năng:** GET /api/v1/admin/ai/runs

**Module:** Dashboard quản trị và giám sát AI · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 746 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Dashboard quản trị và giám sát AI; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho List AI runs theo feature/model/status/time.
```

**Dữ liệu test:**

```text
CONVERSATION_A / PROPOSAL_A / RUN_A; content=Gợi ý bữa chay giàu protein; mediaId=MEDIA_READY khi nhận diện
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/admin/ai/runs với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: List AI runs theo feature/model/status/time; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0746"></a>

### API-0746

**Chức năng:** GET /api/v1/admin/ai/runs

**Module:** Dashboard quản trị và giám sát AI · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 747 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Dashboard quản trị và giám sát AI; Admin active, có Firebase token bị bỏ; target đúng trạng thái cho List AI runs theo feature/model/status/time.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi GET /api/v1/admin/ai/runs không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0747"></a>

### API-0747

**Chức năng:** GET /api/v1/admin/ai/runs

**Module:** Dashboard quản trị và giám sát AI · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 748 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Dashboard quản trị và giám sát AI; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho List AI runs theo feature/model/status/time.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/admin/ai/runs với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0748"></a>

### API-0748

**Chức năng:** GET /api/v1/admin/ai/runs

**Module:** Dashboard quản trị và giám sát AI · **Loại:** Role denied · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 749 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
User A active có role=user; target hợp lệ
```

**Dữ liệu test:**

```text
CONVERSATION_A / PROPOSAL_A / RUN_A; content=Gợi ý bữa chay giàu protein; mediaId=MEDIA_READY khi nhận diện
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/admin/ai/runs bằng token user.
2. Kiểm tra DB/audit.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403; không đọc admin data hoặc thực hiện mutation; không nâng quyền.
```

<a id="api-0749"></a>

### API-0749

**Chức năng:** GET /api/v1/admin/ai/runs

**Module:** Dashboard quản trị và giám sát AI · **Loại:** Empty result · **Ưu tiên:** P2 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 750 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Không có dữ liệu khớp filter hoặc user mới
```

**Dữ liệu test:**

```text
Filter hợp lệ không có kết quả
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/admin/ai/runs với filter rỗng kết quả.
2. Kiểm tra payload.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; list rỗng/tổng bằng 0 đúng schema; không lỗi 500 hoặc dữ liệu user khác.
```

<a id="api-0750"></a>

### API-0750

**Chức năng:** GET /api/v1/admin/ai/runs/:id

**Module:** Dashboard quản trị và giám sát AI · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 751 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Dashboard quản trị và giám sát AI; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Chi tiết metadata đã redact của một run.
```

**Dữ liệu test:**

```text
CONVERSATION_A / PROPOSAL_A / RUN_A; content=Gợi ý bữa chay giàu protein; mediaId=MEDIA_READY khi nhận diện
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/admin/ai/runs/:id với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: Chi tiết metadata đã redact của một run; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0751"></a>

### API-0751

**Chức năng:** GET /api/v1/admin/ai/runs/:id

**Module:** Dashboard quản trị và giám sát AI · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 752 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Dashboard quản trị và giám sát AI; Admin active, có Firebase token bị bỏ; target đúng trạng thái cho Chi tiết metadata đã redact của một run.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi GET /api/v1/admin/ai/runs/:id không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0752"></a>

### API-0752

**Chức năng:** GET /api/v1/admin/ai/runs/:id

**Module:** Dashboard quản trị và giám sát AI · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 753 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Dashboard quản trị và giám sát AI; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Chi tiết metadata đã redact của một run.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/admin/ai/runs/:id với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0753"></a>

### API-0753

**Chức năng:** GET /api/v1/admin/ai/runs/:id

**Module:** Dashboard quản trị và giám sát AI · **Loại:** Role denied · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 754 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
User A active có role=user; target hợp lệ
```

**Dữ liệu test:**

```text
CONVERSATION_A / PROPOSAL_A / RUN_A; content=Gợi ý bữa chay giàu protein; mediaId=MEDIA_READY khi nhận diện
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/admin/ai/runs/:id bằng token user.
2. Kiểm tra DB/audit.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403; không đọc admin data hoặc thực hiện mutation; không nâng quyền.
```

<a id="api-0754"></a>

### API-0754

**Chức năng:** GET /api/v1/admin/ai/runs/:id

**Module:** Dashboard quản trị và giám sát AI · **Loại:** Missing target · **Ưu tiên:** P1 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 755 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Token đúng quyền; target ID không tồn tại
```

**Dữ liệu test:**

```text
ObjectId=ffffffffffffffffffffffff; các input khác hợp lệ
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/admin/ai/runs/:id với ID không tồn tại.
2. Kiểm tra lỗi.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 404; lỗi ổn định; không tạo target thay thế, không side effect.
```

<a id="api-0755"></a>

### API-0755

**Chức năng:** GET /api/v1/admin/ai/metrics

**Module:** Dashboard quản trị và giám sát AI · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 756 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Dashboard quản trị và giám sát AI; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Success rate, latency, usage, feedback rate; không bịa accuracy.
```

**Dữ liệu test:**

```text
CONVERSATION_A / PROPOSAL_A / RUN_A; content=Gợi ý bữa chay giàu protein; mediaId=MEDIA_READY khi nhận diện
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/admin/ai/metrics với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: Success rate, latency, usage, feedback rate; không bịa accuracy; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0756"></a>

### API-0756

**Chức năng:** GET /api/v1/admin/ai/metrics

**Module:** Dashboard quản trị và giám sát AI · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 757 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Dashboard quản trị và giám sát AI; Admin active, có Firebase token bị bỏ; target đúng trạng thái cho Success rate, latency, usage, feedback rate; không bịa accuracy.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi GET /api/v1/admin/ai/metrics không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0757"></a>

### API-0757

**Chức năng:** GET /api/v1/admin/ai/metrics

**Module:** Dashboard quản trị và giám sát AI · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 758 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Dashboard quản trị và giám sát AI; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho Success rate, latency, usage, feedback rate; không bịa accuracy.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/admin/ai/metrics với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0758"></a>

### API-0758

**Chức năng:** GET /api/v1/admin/ai/metrics

**Module:** Dashboard quản trị và giám sát AI · **Loại:** Role denied · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 759 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
User A active có role=user; target hợp lệ
```

**Dữ liệu test:**

```text
CONVERSATION_A / PROPOSAL_A / RUN_A; content=Gợi ý bữa chay giàu protein; mediaId=MEDIA_READY khi nhận diện
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/admin/ai/metrics bằng token user.
2. Kiểm tra DB/audit.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403; không đọc admin data hoặc thực hiện mutation; không nâng quyền.
```

<a id="api-0759"></a>

### API-0759

**Chức năng:** GET /api/v1/admin/ai/metrics

**Module:** Dashboard quản trị và giám sát AI · **Loại:** Empty result · **Ưu tiên:** P2 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 760 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Không có dữ liệu khớp filter hoặc user mới
```

**Dữ liệu test:**

```text
Filter hợp lệ không có kết quả
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/admin/ai/metrics với filter rỗng kết quả.
2. Kiểm tra payload.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; list rỗng/tổng bằng 0 đúng schema; không lỗi 500 hoặc dữ liệu user khác.
```

<a id="api-0760"></a>

### API-0760

**Chức năng:** GET /api/v1/admin/ai/feedback

**Module:** Dashboard quản trị và giám sát AI · **Loại:** Happy path · **Ưu tiên:** P1 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 761 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Dashboard quản trị và giám sát AI; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho List/tổng hợp user feedback đã bảo vệ dữ liệu.
```

**Dữ liệu test:**

```text
CONVERSATION_A / PROPOSAL_A / RUN_A; content=Gợi ý bữa chay giàu protein; mediaId=MEDIA_READY khi nhận diện
```

**Các bước thực hiện:**

```text
1. Chuẩn bị fixture và thay :id/:targetId bằng ID thật.
2. Gửi GET /api/v1/admin/ai/feedback với dữ liệu test.
3. Kiểm tra response và đọc lại dữ liệu/DB nếu có mutation.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; success=true; dữ liệu đúng use case: List/tổng hợp user feedback đã bảo vệ dữ liệu; không lộ secret/private field; list có meta phân trang khi áp dụng.
```

<a id="api-0761"></a>

### API-0761

**Chức năng:** GET /api/v1/admin/ai/feedback

**Module:** Dashboard quản trị và giám sát AI · **Loại:** Missing auth · **Ưu tiên:** P0 · **Actor:** Guest

**Nguồn Excel:** API Cases, hàng 762 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Dashboard quản trị và giám sát AI; Admin active, có Firebase token bị bỏ; target đúng trạng thái cho List/tổng hợp user feedback đã bảo vệ dữ liệu.
```

**Dữ liệu test:**

```text
Không có Authorization header
```

**Các bước thực hiện:**

```text
1. Dùng fixture hợp lệ.
2. Gửi GET /api/v1/admin/ai/feedback không token.
3. So sánh dữ liệu trước/sau.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; error code ổn định; không trả private data; không ghi dữ liệu.
```

<a id="api-0762"></a>

### API-0762

**Chức năng:** GET /api/v1/admin/ai/feedback

**Module:** Dashboard quản trị và giám sát AI · **Loại:** Invalid auth · **Ưu tiên:** P0 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 763 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Seed fixture hợp lệ cho Dashboard quản trị và giám sát AI; Admin active, có Firebase token hợp lệ; target đúng trạng thái cho List/tổng hợp user feedback đã bảo vệ dữ liệu.
```

**Dữ liệu test:**

```text
Authorization: Bearer invalid.jwt
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/admin/ai/feedback với token sai chữ ký.
2. Kiểm tra response và DB.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 401; không lộ Firebase raw error; không side effect.
```

<a id="api-0763"></a>

### API-0763

**Chức năng:** GET /api/v1/admin/ai/feedback

**Module:** Dashboard quản trị và giám sát AI · **Loại:** Role denied · **Ưu tiên:** P0 · **Actor:** User A

**Nguồn Excel:** API Cases, hàng 764 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
User A active có role=user; target hợp lệ
```

**Dữ liệu test:**

```text
CONVERSATION_A / PROPOSAL_A / RUN_A; content=Gợi ý bữa chay giàu protein; mediaId=MEDIA_READY khi nhận diện
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/admin/ai/feedback bằng token user.
2. Kiểm tra DB/audit.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 403; không đọc admin data hoặc thực hiện mutation; không nâng quyền.
```

<a id="api-0764"></a>

### API-0764

**Chức năng:** GET /api/v1/admin/ai/feedback

**Module:** Dashboard quản trị và giám sát AI · **Loại:** Empty result · **Ưu tiên:** P2 · **Actor:** Admin

**Nguồn Excel:** API Cases, hàng 765 · **Kết quả chạy:** Đạt

**Điều kiện trước khi test:**

```text
Không có dữ liệu khớp filter hoặc user mới
```

**Dữ liệu test:**

```text
Filter hợp lệ không có kết quả
```

**Các bước thực hiện:**

```text
1. Gửi GET /api/v1/admin/ai/feedback với filter rỗng kết quả.
2. Kiểm tra payload.
```

**Kết quả mong đợi (Excel):**

```text
HTTP 200; list rỗng/tổng bằng 0 đúng schema; không lỗi 500 hoặc dữ liệu user khác.
```
