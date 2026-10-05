# Danh mục test case backend dành cho FE

Có **841 test case** từ `VEGAN_APP_BACKEND_TEST_CASES.xlsx`: 764 API, 53 nghiệp vụ và 24 Security/NFR. Mỗi case bên dưới giữ nguyên ID, module, chức năng, loại test, ưu tiên, actor, điều kiện, dữ liệu, bước thực hiện và kết quả mong đợi của Excel; kèm trạng thái Playwright để FE phân biệt case đã có với case đã chạy đạt.

Nguồn đối chiếu: [catalog JSON](../tests/playwright/cases.json), SHA-256 workbook: `43e622cce80a340d4346a5a4ab1fa653dbfab6f2e722f172168cc8a54ba93757`.

## Cách dùng khi làm FE

1. Tìm module/endpoint trong bảng bên dưới rồi mở danh sách ID tương ứng.
2. Đọc điều kiện và dữ liệu test trước khi gọi API; thay ID mẫu bằng ID fixture thật, dùng đúng vai trò và chủ sở hữu.
3. Dùng kết quả mong đợi để xác định nhánh UI cần xử lý: thành công, lỗi validation, thiếu/hết hạn token, thiếu quyền, dữ liệu rỗng, phân trang và xung đột. Các bước trong catalog là kiểm thử backend; FE vẫn cần kiểm thử màn hình, điều hướng và trạng thái tải riêng.
4. Khi báo lỗi, ghi ID case, request/response và requestId nếu có; đối chiếu OpenAPI và [hướng dẫn chạy Playwright](../docs/playwright-testing.md) khi cần chi tiết contract hiện tại.

P0/P1/P2 và actor giữ nguyên ký hiệu Excel. User A/User B là các tài khoản fixture khác nhau; chú ý case cross-user trước khi hiển thị hoặc sửa dữ liệu của người khác.

## Kết quả chạy được ghi nhận

Thời điểm bắt đầu: **11:38:54 5/10/26 (Asia/Ho_Chi_Minh)**. Đây là ảnh chụp kết quả tại thời điểm chạy, không tự cập nhật khi backend thay đổi.

| Trạng thái          | Số case | Ý nghĩa                                                     |
| ------------------- | ------: | ----------------------------------------------------------- |
| Đạt                 |     828 | Assertion Playwright đạt trong môi trường chạy đã cấu hình. |
| Không đạt           |       2 | Cần đối chiếu yêu cầu Excel với contract backend.           |
| Chưa chạy (Blocked) |      11 | Có test nhưng thiếu môi trường/biến cấu hình để thực thi.   |

Các test offline dùng HTTP server thật với repository/provider giả lập. Trạng thái Đạt không xác nhận Firebase, MongoDB, R2, AI, FCM thật hoặc UI FE đã đạt acceptance. Phạm vi mô phỏng và các yêu cầu staging/replica set được ghi trong [tài liệu kiểm thử](../docs/playwright-testing.md).

### Hai case cần chốt contract với BE

- [API-0014](test-cases/API_CASES.md#api-0014): Excel mong 403/404 khi B xóa FCM token của A. Backend trả 200 theo cơ chế xóa idempotent trong tập token của B; token của A không bị xóa. FE cần thống nhất cách hiểu response thành công.
- [API-0682](test-cases/API_CASES.md#api-0682): Excel mong 403/404 khi B cập nhật progress cho video của A. Backend cho phép xem video công khai và lưu progress/history của B. FE cần thống nhất quyền xem và việc lưu tiến độ riêng của từng người.

Hai khác biệt này được ghi nhận trong lần chạy trên; không sửa kỳ vọng Excel để biến test thành đạt.

## Tra cứu theo module

### API — endpoint và các nhánh xử lý

[Chi tiết toàn bộ 764 case](test-cases/API_CASES.md) · [Mã Playwright](../tests/playwright/api-cases.spec.js)

| Module                                | Số case | Danh sách ID                                             |
| ------------------------------------- | ------: | -------------------------------------------------------- |
| Auth                                  |      14 | [API-0001 → API-0014](test-cases/API_CASES.md#module-1)  |
| App bootstrap, home và onboarding     |      13 | [API-0015 → API-0027](test-cases/API_CASES.md#module-2)  |
| Health                                |       2 | [API-0028 → API-0029](test-cases/API_CASES.md#module-3)  |
| User và profile                       |      38 | [API-0030 → API-0067](test-cases/API_CASES.md#module-4)  |
| Category, allergen và food item       |      56 | [API-0068 → API-0123](test-cases/API_CASES.md#module-5)  |
| Recipe và discovery                   |      66 | [API-0124 → API-0189](test-cases/API_CASES.md#module-6)  |
| Pantry                                |      28 | [API-0190 → API-0217](test-cases/API_CASES.md#module-7)  |
| Meal plan                             |      59 | [API-0218 → API-0276](test-cases/API_CASES.md#module-8)  |
| Grocery list                          |      42 | [API-0277 → API-0318](test-cases/API_CASES.md#module-9)  |
| Diary, weight và water                |      65 | [API-0319 → API-0383](test-cases/API_CASES.md#module-10) |
| Media và Cloudflare R2                |      21 | [API-0384 → API-0404](test-cases/API_CASES.md#module-11) |
| Post, comment, reaction và saved item |      73 | [API-0405 → API-0477](test-cases/API_CASES.md#module-12) |
| AI                                    |      47 | [API-0478 → API-0524](test-cases/API_CASES.md#module-13) |
| Notification và reminder              |      46 | [API-0525 → API-0570](test-cases/API_CASES.md#module-14) |
| Report, moderation, admin và audit    |      68 | [API-0571 → API-0638](test-cases/API_CASES.md#module-15) |
| Video hướng dẫn                       |      53 | [API-0639 → API-0691](test-cases/API_CASES.md#module-16) |
| Rating, vote và lịch sử xem           |      22 | [API-0692 → API-0713](test-cases/API_CASES.md#module-17) |
| Dashboard quản trị và giám sát AI     |      51 | [API-0714 → API-0764](test-cases/API_CASES.md#module-18) |

### Business — luồng nghiệp vụ backend

[Chi tiết toàn bộ 53 case](test-cases/BUSINESS_CASES.md) · [Mã Playwright](../tests/playwright/business-cases.spec.js)

| Module         | Số case | Danh sách ID                                                  |
| -------------- | ------: | ------------------------------------------------------------- |
| Auth           |       4 | [BIZ-0001 → BIZ-0004](test-cases/BUSINESS_CASES.md#module-1)  |
| Profile        |       1 | [BIZ-0005 → BIZ-0005](test-cases/BUSINESS_CASES.md#module-2)  |
| Nutrition      |       3 | [BIZ-0006 → BIZ-0008](test-cases/BUSINESS_CASES.md#module-3)  |
| Recipe         |       2 | [BIZ-0009 → BIZ-0010](test-cases/BUSINESS_CASES.md#module-4)  |
| Search         |       2 | [BIZ-0011 → BIZ-0012](test-cases/BUSINESS_CASES.md#module-5)  |
| Recommendation |       1 | [BIZ-0013 → BIZ-0013](test-cases/BUSINESS_CASES.md#module-6)  |
| Pantry         |       2 | [BIZ-0014 → BIZ-0015](test-cases/BUSINESS_CASES.md#module-7)  |
| Meal plan      |       2 | [BIZ-0016 → BIZ-0017](test-cases/BUSINESS_CASES.md#module-8)  |
| Grocery        |       2 | [BIZ-0018 → BIZ-0019](test-cases/BUSINESS_CASES.md#module-9)  |
| Diary          |       2 | [BIZ-0020 → BIZ-0021](test-cases/BUSINESS_CASES.md#module-10) |
| Media          |       6 | [BIZ-0022 → BIZ-0027](test-cases/BUSINESS_CASES.md#module-11) |
| Community      |       3 | [BIZ-0028 → BIZ-0030](test-cases/BUSINESS_CASES.md#module-12) |
| Rating         |       1 | [BIZ-0031 → BIZ-0031](test-cases/BUSINESS_CASES.md#module-13) |
| Video          |       3 | [BIZ-0032 → BIZ-0034](test-cases/BUSINESS_CASES.md#module-14) |
| AI             |       9 | [BIZ-0035 → BIZ-0043](test-cases/BUSINESS_CASES.md#module-15) |
| Notification   |       3 | [BIZ-0044 → BIZ-0046](test-cases/BUSINESS_CASES.md#module-16) |
| Reminder       |       4 | [BIZ-0047 → BIZ-0050](test-cases/BUSINESS_CASES.md#module-17) |
| Admin          |       3 | [BIZ-0051 → BIZ-0053](test-cases/BUSINESS_CASES.md#module-18) |

### Security / NFR — bảo mật, chất lượng và vận hành

[Chi tiết toàn bộ 24 case](test-cases/SECURITY_NFR_CASES.md) · [Mã Playwright](../tests/playwright/nfr-cases.spec.js)

| Module                          | Số case | Danh sách ID                                                     |
| ------------------------------- | ------: | ---------------------------------------------------------------- |
| Security / Quality / Operations |      24 | [NFR-0001 → NFR-0024](test-cases/SECURITY_NFR_CASES.md#module-1) |

## Cập nhật danh mục

Các trang chi tiết được sinh từ catalog để không bỏ sót hoặc viết lại sai yêu cầu Excel. Sau khi import lại workbook hoặc chạy lại suite, dùng Node 24 tại thư mục repository:

```powershell
node scripts/generate-fe-test-guideline.js test-results/playwright.json
```

Nếu chỉ muốn sinh danh mục chưa có kết quả chạy, bỏ đối số report. Đối số report phải là JSON của lần chạy đủ toàn bộ case; script từ chối report thiếu ID. Không chỉnh tay các trang được sinh: cập nhật workbook/catalog và sinh lại.
