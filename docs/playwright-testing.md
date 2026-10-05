# Playwright backend acceptance tests

Bộ test ánh xạ **841 mã case** từ `VEGAN_APP_BACKEND_TEST_CASES.xlsx`: 764 API, 53 Business/Integration, 24 Security/NFR. Mỗi case có tên, priority, sheet/dòng Excel và kỳ vọng gốc trong annotation. `tests/playwright/cases.json` là bản snapshot có SHA-256 của workbook, không thay đổi file Excel.

## Chạy

Yêu cầu **Node >=24** đúng `package.json`. Dùng Playwright APIRequestContext qua HTTP thật đến Express trên cổng loopback ngẫu nhiên. Không cần tải Chromium hoặc khởi động backend trước.

```bash
npm ci
npm run test:playwright:coverage
npm run test:playwright
npm run test:playwright:report
```

Chọn case hoặc nhóm:

```bash
npm run test:playwright -- --grep API-0132
npm run test:playwright -- --grep @business
npm run test:playwright -- --grep @nfr
npm run test:playwright -- --grep @P0
npm run test:playwright:list
```

Kết quả HTML: `playwright-report/index.html`; JSON: `test-results/playwright.json`; trace/HTTP response của API lỗi nằm trong `test-results/`. Các thư mục này được gitignore. Lệnh coverage kiểm tra đủ mã, không trùng, không case thừa và workbook không đổi nếu workbook có mặt. Nó **không** khẳng định mọi case đã pass.

Nếu workbook thay đổi, import lại bằng Python 3 (chỉ dùng thư viện chuẩn):

```bash
python scripts/import-playwright-cases.py ../VEGAN_APP_BACKEND_TEST_CASES.xlsx
npm run test:playwright:coverage
```

## Fixture và assertions

Mỗi test có app, repositories và providers riêng. Test API dùng đúng trạng thái nội dung, owner A/B/admin, tham chiếu master data, meal/ingredient snapshot, object metadata và AI output có cấu trúc. Test kiểm tra status, success/error envelope, requestId/header, danh sách rỗng, persistence sau mutation, không sửa dữ liệu B và không mutation khi request bị từ chối. Kịch bản nghiệp vụ kiểm tra các giá trị cụ thể như nutrition 100 kcal/10 g protein, BMI 20, grocery 1500 g, rating 4→2→1, summary 350→150, counters và delivery deduplication.

Firebase, R2, FCM và AI được thay bằng provider xác định cho phần offline. Repository giả lập có transaction rollback/CAS và các aggregation cần cho HTTP service. Điều này kiểm tra logic backend, không chứng minh unique index, độ bền dữ liệu hoặc hành vi của provider thật. Nhóm DB bên dưới kiểm tra riêng bằng MongoDB thật. Các phép đo latency/memory có attachment, không tự đặt SLA để tính pass.

## Case cần cấu hình bổ sung

Thiếu điều kiện được Playwright biểu diễn là **skipped** với lý do `Blocked: ...`, không tính Pass. Mặc định có 11 case cần môi trường/điều kiện bổ sung:

| Case     | Điều kiện                                                                             |
| -------- | ------------------------------------------------------------------------------------- |
| BIZ-0001 | Firebase expired token thật và token mới trên staging                                 |
| BIZ-0025 | R2 thật; chờ URL hết hạn, PUT bị từ chối, xin URL mới, upload/confirm                 |
| BIZ-0041 | AI thật và secret canary do QA cấu hình                                               |
| NFR-0008 | Endpoint staging HTTPS, kiểm tra Git tracked credentials                              |
| NFR-0009 | Staging, recipe fixture; workload 20 clients/5 phút và SLA đã chốt                    |
| NFR-0010 | MongoDB replica set; tạo 10.000 recipes, kiểm tra pagination, số query, explain/index |
| NFR-0011 | R2 staging; PUT trực tiếp 500 MiB, confirm, reject thêm 1 byte                        |
| NFR-0012 | Node `--expose-gc`, ngân sách heap/RSS; 1.000 request và metadata uploads             |
| NFR-0017 | MongoDB replica set; chạy seed hai lần và so ID/count, giữ user khác                  |
| NFR-0018 | MongoDB replica set, mongodump/mongorestore; restore sang DB mới, so records/indexes  |
| NFR-0022 | MongoDB replica set; unique indexes với insert race và concurrency API                |

PowerShell cấu hình **QA staging riêng có thể bỏ sau test**:

```powershell
$env:PW_STAGING_URL = 'https://qa.example.test/api/v1'
$env:PW_STAGING_ISOLATED = 'true'
$env:PW_USER_TOKEN = '<Firebase ID token of active QA user>'
$env:PW_EXPIRED_FIREBASE_TOKEN = '<expired Firebase ID token for the same user>'
$env:PW_RECIPE_ID = '<published QA recipe ObjectId>'
$env:PW_AI_SECRET_CANARY = '<QA canary value that must never appear in output>'
$env:PW_P95_SLA_MS = '<agreed p95 milliseconds>'
$env:PW_P99_SLA_MS = '<agreed p99 milliseconds>'
$env:PW_LARGE_UPLOAD = 'true'
```

Các test staging tạo tài nguyên QA để đọc lại và để lại bằng chứng/lifecycle cleanup trên môi trường đó. Không dùng dữ liệu hoặc token production. Workload upload lớn chỉ chạy khi opt-in đúng `PW_LARGE_UPLOAD=true`. URL upload không được đưa vào metrics attachment.

MongoDB:

```powershell
$env:RUN_DATABASE_TESTS = 'true'
$env:MONGODB_URI_TEST = 'mongodb://localhost:27017/test_vegan_playwright_20261005?replicaSet=rs0&directConnection=true'
$env:PW_MONGODUMP = 'C:\MongoDB\bin\mongodump.exe'
$env:PW_MONGORESTORE = 'C:\MongoDB\bin\mongorestore.exe'
```

Helper dùng bộ guard database hiện có, không fallback sang `MONGODB_URI` của ứng dụng. Mỗi case tạo database `test_vegan_..._<UUID>` riêng, tạo index, rồi chỉ xóa đúng DB do case đó tạo. Backup/restore sử dụng DB QA mới khác nguồn; file archive được xóa sau so sánh. Không chạy vào DB ứng dụng.

Memory:

```powershell
$env:PW_HEAP_BUDGET_MB = '<agreed allowed retained heap growth>'
$env:PW_RSS_BUDGET_MB = '<agreed allowed RSS growth>'
npm run test:playwright:memory
```

## Giới hạn kiểm chứng và sai khác contract

Các business test offline là simulation của logic được mô tả trong workbook có precondition staging. Chúng không thay thế nghiệm thu provider/DB thật. Cụ thể, BIZ-0027 kiểm tra quyền cấp URL qua API và private URL provider contract, không chứng minh ACL bucket ngoài môi trường thật; BIZ-0034 không chứng minh thu hồi ngay URL R2 đã cấp; BIZ-0047/0048 dùng state/lock giả lập, không chứng minh khôi phục sau process/DB crash thật. NFR-0015 kiểm tra exported shutdown lifecycle trong child process (Windows dùng IPC vì thiếu POSIX SIGTERM); DB connect bị thay thế và không chứng minh đóng kết nối MongoDB thật. NFR-0016 giả lập outage/readiness; NFR-0024 inject lỗi để kiểm tra rollback của transaction giả lập. NFR-0011 đo upload ở phía client và xác nhận binary đi thẳng storage, không đo CPU/RSS Express trên host staging. BIZ-0041 kiểm tra output với canary và role; việc đánh giá mọi prompt injection/system-prompt disclosure vẫn cần nghiệm thu AI thực tế.

Hai kỳ vọng Excel khác hành vi hiện tại, được giữ nguyên dưới dạng test fail để không che sai khác:

| Case     | Excel                                             | Backend hiện tại                                              |
| -------- | ------------------------------------------------- | ------------------------------------------------------------- |
| API-0014 | B xóa FCM tokenId của A → 403/404, không mutation | 200 idempotent trên tokens của B; tokens A vẫn còn            |
| API-0682 | B ghi progress video của A → 403/404              | Video public cho phép B xem và ghi history/progress của **B** |

Sai khác thứ hai liên quan cách hiểu owner của nội dung so với owner của tiến độ xem. Cần chốt contract trước khi sửa backend hoặc workbook. Bộ test không sửa production logic để ép xanh.

## Kiểm chứng cục bộ ngày 2026-10-05

Runtime kiểm tra: Node 24.19.0. Coverage đăng ký đủ 841/841 ID. Bộ Vitest hiện có chạy 530 pass, 9 skip; format và `git diff --check` đạt. Không chạy provider staging, MongoDB thật, workload lớn hoặc backup/restore trong phiên này. Kết quả Playwright và các lỗi contract nằm trong HTML/JSON report tạo bởi lệnh chạy ở trên.
