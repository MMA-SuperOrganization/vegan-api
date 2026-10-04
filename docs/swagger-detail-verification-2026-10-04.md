# Swagger/OpenAPI: mô tả và kiểm chứng — 2026-10-04

Phạm vi: tài liệu và khả năng sử dụng Swagger của **backend**. Không triển khai Android/Admin UI.

## Độ phủ tài liệu

| Nội dung                                                 | Trước |                      Sau |
| -------------------------------------------------------- | ----: | -----------------------: |
| API có trong OpenAPI                                     |   184 |                      184 |
| API có description nghiệp vụ, quyền, input/output và lỗi |     0 |                      184 |
| Tham số có mô tả                                         | 0/331 |                  331/331 |
| Tham số có ví dụ                                         | 0/331 |                  331/331 |
| API có body với ví dụ request                            |  0/86 |                    86/86 |
| Tổng ví dụ request                                       |     0 |                      117 |
| API có ví dụ cho tất cả response đã khai báo             | 0/184 |                  184/184 |
| Tổng ví dụ response thành công/lỗi                       |     0 |                    1.644 |
| Nhóm API có mô tả                                        |  0/35 |                    35/35 |
| Component schema                                         |   489 | 489, có annotation mô tả |

Các schema có 3.217 lần khai báo property, tính cả schema con và các nhánh. Mỗi property đều được mô tả; nhiều tên trường xuất hiện ở nhiều operation nên đây không phải số trường duy nhất. Các constraint gốc từ validator vẫn được giữ nguyên.

## Nội dung bổ sung

- Mỗi operation có ghi chú riêng, quyền public/optional/Firebase/user/owner/admin, cách gửi JSON, quy tắc query, response envelope và phạm vi lỗi.
- Hướng dẫn Firebase ID token và Authorize; không nhầm ID token với FCM registration token/custom token/refresh token.
- Mô tả parameter và property: ý nghĩa, đơn vị, default, enum, ID, ngày lịch, timestamp, múi giờ, pagination, trạng thái và snapshot.
- Ví dụ request tối thiểu và các ví dụ nghiệp vụ: thực phẩm vegan, công thức có nguyên liệu/bước, kho bulk có idempotencyKey, kế hoạch ăn, danh sách mua sắm, upload ảnh/video, xác nhận AI đã chọn, hồ sơ/mục tiêu dinh dưỡng.
- Ví dụ các nhánh nhật ký `recipe/food/custom`, lịch nhắc `once/daily/weekly`, mục mua sắm thực phẩm chuẩn/tự nhập.
- Ví dụ response thành công và lỗi, mô tả mã lỗi, `X-Request-Id`, các header rate limit khi HTTP 429.

Ví dụ dùng ID/URL/ngày tổng hợp. Validator xác nhận cấu trúc hợp lệ; service vẫn kiểm tra bản ghi thực tế, quyền sở hữu, trạng thái, dị ứng, ngày còn hợp lệ và dependency. Ví dụ response được kiểm tra theo JSON Schema của operation; chúng không phải dữ liệu truy vấn từ database hay kết quả provider thật.

## Những điểm đã sửa cho khớp backend

1. `requestBody.required` dựa trên kết quả validator với `{}`, thay vì chỉ nhìn danh sách required của JSON Schema. PATCH nonempty bắt buộc body; các action cho phép `{}` vẫn không bắt buộc body. PUT hồ sơ/onboarding có refine nonempty cũng được xử lý đúng.
2. HTTP 422 `AI_VIDEO_UNSUPPORTED` chỉ khai báo cho hai API video summary. HTTP 502 còn được mô tả cho confirmation có thể gặp structured output không hợp lệ.
3. HTTP 503 được khai báo như lỗi dependency chung, bao gồm Firebase/storage/transaction/service, không giới hạn trong AI/media.
4. Ví dụ boolean query dùng chuỗi `true/false`, kể cả khi default nội bộ là boolean; ví dụ path UUID không dùng ObjectId.
5. Default server của Swagger dùng cùng origin và `API_PREFIX` cấu hình thật khi phục vụ spec. Có server tùy biến base URL/prefix cho môi trường khác.
6. Mô tả master-data DELETE ghi rõ chuyển `inactive`, không xóa cứng. `getPost` nhận ObjectId, không nhận slug.
7. Dashboard trend hiện dùng UTC cố định; không mô tả sai rằng nhận timezone query. Phân biệt activeUsers với DAU và flagged với số target duy nhất.
8. Video progress ghi rõ completed yêu cầu ngưỡng 90%; AI confirmation ghi rõ hạn proposal, transaction, retry trả kết quả cũ và kiểm tra an toàn hiện tại.

## Cách đọc và thử Swagger

Khi backend đang chạy với `SWAGGER_ENABLED=true`:

- UI: `/api-docs/` — ví dụ local `http://localhost:3000/api-docs/`.
- JSON: `/api-docs.json`.
- YAML: `/api-docs/openapi.yaml`.

Lấy Firebase ID token từ client SDK, nhập **chỉ token** trong Authorize, gọi `POST /auth/sync`, rồi dùng API đúng quyền. Chọn server cùng origin khi dùng backend hiện tại; server tùy chỉnh dành cho base URL/prefix khác. Thay ID ví dụ bằng các resource có quyền truy cập. Khi thay đổi YAML/generator, khởi động lại process để Swagger nạp spec mới.

Upload media: xin signed PUT URL → PUT binary với `requiredHeaders` → confirm upload → dùng media ID ở API nội dung. Endpoint xin upload không nhận multipart file.

AI proposal: tạo proposal → xem/chọn dữ liệu → confirm với proposal ID. Tạo proposal chưa ghi kho/kế hoạch. Gửi lại confirmation đã consumed trả kết quả lần đầu.

## Duy trì tài liệu

- Nguồn annotation: `scripts/openapi-details.js`.
- Bộ sinh: `scripts/generate-openapi.js`.
- Tài liệu được sinh: `docs/openapi.yaml`; không chỉnh tay file này.
- Route, Zod validator và response registry tiếp tục là nguồn constraint.

```sh
npm run docs:generate
npm run docs:check
npm run test:contract
npm run format:check
```

`tests/contract/openapi-details.test.js` có 7 test kiểm tra ghi chú riêng cho toàn bộ 184 operation, description của schema/parameter, ví dụ path/query/request theo validator thật, ví dụ response theo schema, header request ID, phạm vi 422, spec JSON/Swagger UI được phục vụ và custom API prefix. Contract hiện có 21 test trong 4 file.

Các kiểm tra offline không sử dụng credential thật và không chứng minh kết nối Firebase/R2/AI/Atlas hoạt động. Database suite cần cấu hình riêng; kết quả kiểm thử Swagger không thay thế kiểm thử provider/staging.

Kết quả sau thay đổi: cài dependency sạch bằng `npm ci` trong Docker Node **24.21.0**, `docs:check` đạt; full suite **529 passed, 9 database tests skipped**, 30 file đạt và 1 file bỏ qua. Lần chạy đầu của bản sao Docker thiếu `docker-compose.yml`; sau khi bổ sung đầy đủ fixture cấu hình, chạy lại toàn bộ suite đạt. Bộ suite trên host Node 22 cũng đạt cùng số test, nhưng Node 24 là runtime được project hỗ trợ. `format:check` và `git diff --check` đạt.
