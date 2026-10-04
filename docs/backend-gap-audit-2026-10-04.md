# Đối chiếu backend và kế hoạch sửa — 04/10/2026

Nguồn yêu cầu: `../../AI_AGENT_PROMPT_BUILD_VEGAN_BE_A_TO_Z.md`. Phạm vi khảo sát: code đang được `src/container.js` và `src/routes/index.js` sử dụng, model/repository/provider, tài liệu, script vận hành và kiểm thử. Phần khảo sát dưới đây lưu baseline trước sửa. Sau yêu cầu tiếp theo của người dùng, đã sửa code và bổ sung bằng chứng trong phần Kết quả khắc phục cuối tài liệu.

## Kết luận

Backend đã có implementation và validation được mount cho **184 endpoint**, OpenAPI và API matrix tương ứng. Các domain chính đều đã hiện diện: identity/onboarding/master data, planning/tracking, community/video/media, AI/notification/reminder, moderation/admin/audit. Không cần xây lại từ đầu hoặc bổ sung hàng loạt endpoint chỉ vì tên file khác đặc tả.

Tuy nhiên, chưa thể kết luận đạt toàn bộ Definition of Done. Có lỗi nghiệp vụ tái hiện được, khoảng trống trong luồng avatar và vận hành media, sai lệch kiến trúc so với yêu cầu, cùng các bước xác minh database/provider/runtime chưa thực hiện. Test hiện tại pass nhưng chưa bắt được những trường hợp dưới đây.

## Bằng chứng kiểm tra

| Kiểm tra                | Kết quả tại lần khảo sát này                                                                 |
| ----------------------- | -------------------------------------------------------------------------------------------- |
| Runtime host            | Node v22.19.0; yêu cầu Node 24+. Dockerfile đã dùng Node 24                                  |
| `npm run test:run`      | 25 file pass, 1 file skip; 472 test pass, 5 test skip                                        |
| `npm run format:check`  | Pass                                                                                         |
| `npm run docs:check`    | Pass; OpenAPI và API matrix khớp 184 operation                                               |
| `npm run smoke`         | Pass import/listen/health/readiness/Swagger/auth/shutdown với mock                           |
| MongoDB thật            | 5 test persistence bị skip; chưa có bằng chứng thực thi transaction/index trên DB thật       |
| Firebase/R2/FCM/AI thật | Chưa chạy round trip; smoke dùng mock                                                        |
| Environment             | `.env` và `.env.example` đều có 47 key, mỗi file có 15 key chứa placeholder; không in secret |
| Git                     | Checkout con có Git; sạch trước khi tạo báo cáo này                                          |

Chưa chạy lại cài dependency trên môi trường sạch, chưa build Docker, chưa seed/migrate/cleanup database thật. Smoke readiness ở đây dùng trạng thái DB giả lập, không chứng minh Atlas đã sẵn sàng.

## Các vấn đề đã xác nhận

### G01 — Search popular bị lặp/mất kết quả giữa các trang (P1)

- Vị trí: `src/modules/search/search.service.js`, `sorting()` và `search()`.
- MongoDB lấy ứng viên theo `viewCount DESC, createdAt DESC, _id DESC`, nhưng bước merge JS theo `viewCount DESC, _id DESC`, thiếu `createdAt`.
- Tái hiện với hai recipe cùng view count: recipe mới hơn có ID nhỏ hơn. `page=1&limit=1&sort=popular&type=recipe` trả `newer`; page 2 cũng trả `newer`, làm `older` bị bỏ sót.
- Sửa: dùng cùng một thứ tự so sánh và tie-breaker ở query và merge; cân nhắc chuyển union/sort/pagination vào aggregation cho tìm kiếm nhiều collection.
- Nghiệm thu: dữ liệu cùng điểm, nhiều loại và nhiều trang không trùng/thiếu; thứ tự ổn định với bộ dữ liệu không thay đổi.

### G02 — Search và pending queue báo trang không thể truy cập (P1)

- Vị trí: search validation giới hạn `page <= 20`; pending queue cũng giới hạn page 20. Meta vẫn dùng tổng document thật.
- Tái hiện search với 1.001 recipe, `limit=50&page=20`: HTTP 200, `total=1001`, `totalPages=21`; `page=21` trả HTTP 400.
- Sửa: thiết kế giới hạn phân trang nhất quán với metadata. Ưu tiên phân trang ở DB; nếu áp dụng cửa sổ kết quả hữu hạn phải mô tả và trả metadata đúng cửa sổ đó.
- Nghiệm thu: mọi trang được API quảng bá đều truy cập được; kiểm tra cả search và pending queue trên dữ liệu vượt ngưỡng hiện tại.

### G03 — Pending queue mặc định bỏ sót nội dung cũ (P1)

- Vị trí: `src/modules/admin-dashboard/admin-dashboard.service.js`, `getPendingContent()` dùng `range()` mặc định 30 ngày và lọc theo `createdAt`.
- Tái hiện: recipe `pending_review` tạo ngày 01/08/2026 không xuất hiện khi gọi queue mặc định tại clock test ngày 03/10/2026.
- Nội dung tạo từ lâu rồi mới submit cũng có thể bị bỏ sót vì timestamp lọc là ngày tạo.
- Sửa: queue mặc định liệt kê toàn bộ nội dung đang chờ; chỉ lọc thời gian khi client yêu cầu. Nếu cần thời điểm gửi duyệt, lưu `submittedAt` và định nghĩa rõ.
- Nghiệm thu: draft cũ vừa submit và pending hơn 30 ngày vẫn xuất hiện; date filter chỉ tác động khi có input.

### G04 — Bộ lọc diet không đồng nhất và thiếu mô hình hỗ trợ (P1)

- Vị trí: `recipes.service.js:listPublic`, `search.service.js:makeFilter`, `recommendations.service.js:fitsDiet`, `recipes.model.js`.
- `/recipes` chỉ xử lý vegan và nhóm vegetarian; các giá trị khác được chấp nhận nhưng không áp dụng filter tương ứng. Search/recommendation đọc `dietTypes` cho một số diet trong khi canonical recipe model không khai báo field đó.
- Tái hiện với cùng hai recipe vegan: `/recipes?dietType=pescatarian` trả 2; `/search?type=recipe&dietType=pescatarian` trả 0.
- Sửa: định nghĩa quy tắc tương thích cho toàn bộ enum diet; dùng chung một contract/filter giữa browse, search, recommendation và AI. Không loại recipe vegan khỏi diet linh hoạt chỉ vì thiếu một field không được persist.
- Nghiệm thu: bảng test cho cả 8 diet, kết quả nhất quán giữa các API; diet flags do server tính từ nguyên liệu.

### G05 — Luồng avatar R2 chưa khép kín (P1)

- Vị trí: `users.validation.js:updateMeBodySchema`, `users.service.js:updateMyProfile`, `media.service.js:referencedDocuments`.
- PATCH user chỉ nhận `avatarUrl` và lưu trực tiếp. Không kiểm tra media ready/owner/kind/purpose và không tạo liên kết media. Trong khi service media kiểm tra user tham chiếu bằng `avatarMediaId`.
- Tái hiện: PATCH avatar bằng một HTTPS URL bất kỳ trả HTTP 200 mà không có media asset.
- Với bucket riêng tư và signed GET URL ngắn hạn, lưu URL vào profile làm avatar hết hạn; thiếu reference cũng khiến cơ chế bảo vệ media đang sử dụng không thấy avatar này.
- Sửa: nhận `avatarMediaId`, xác minh image ready thuộc owner, purpose avatar; link/unlink khi đổi ảnh trong transaction. Khi đọc profile trả URL được cấp mới theo quyền. Phân biệt avatar nguồn Firebase với ảnh R2 do user upload.
- Nghiệm thu: upload → confirm → gắn avatar → xem lại sau thời hạn URL cũ; từ chối media user khác/chưa ready/sai purpose; không xóa được avatar đang dùng; đổi ảnh giải phóng reference cũ. Cập nhật OpenAPI/matrix/mobile contract.

### G06 — CLI cleanup chưa dọn được pending của user thông thường (P2)

- Vị trí: `scripts/cleanup-media.js:runCleanup`, `pendingCleanupFilter`; `media.service.js:cleanupPending`.
- CLI chỉ chọn upload thuộc chính seed admin; không xử lý pending của user thông thường, rejected hoặc retry deleting. README đã thừa nhận giới hạn này.
- Service nội bộ có cleanup rộng hơn, nhưng chưa có workflow CLI tương ứng với phạm vi và guard rõ ràng.
- Sửa: CLI dry-run/apply theo owner cụ thể hoặc phạm vi admin được chỉ định; batch hữu hạn, namespace/bucket/reference guard, atomic claim, retry deleting an toàn, audit. Hợp nhất logic CLI/service để tránh hai chính sách khác nhau.
- Nghiệm thu: dọn pending hết hạn của user thường; giữ nguyên ready/referenced/fresh; chạy lại idempotent; không xóa object ngoài namespace/bucket; report retry/failure rõ ràng.

### G07 — Kiến trúc đang chạy chưa khớp cấu trúc được yêu cầu (P2)

- Vị trí: `container.js`, `routes/index.js`, các module `index.js`, file controller/routes/repository song song.
- Router trung tâm gọi operation do service tạo trực tiếp; nhiều controller/routes riêng không được wiring. Có cả họ file singular/plural lịch sử; tài liệu persistence đã chỉ ra model lịch sử không có thẩm quyền.
- Có import nội bộ sâu xuyên module, ví dụ posts/videos/media/comments/reactions/ratings/saved-items lấy helper từ `recipes/content.service.js`; trái quy tắc giao tiếp qua `index.js` ở mục 5.
- `scripts/fix-validation.cjs` còn CommonJS; generator lịch sử còn chuỗi TODO dù đã bị vô hiệu hóa. Đây là code lịch sử, không phải bằng chứng luồng production đang stub, nhưng vẫn chưa đạt kiểm tra toàn project ở mục 23.
- Sửa: giữ manifest làm nguồn mount, thêm controller adapter thật, service API rõ ràng; export public contract hoặc chuyển helper dùng chung về common. Kiểm kê import trước khi chuyển/xóa code lịch sử và generator. Không đổi collection/model ID một cách cơ học.
- Nghiệm thu: code production tuân thủ route → validation/auth → controller → service → repository → model; không import nội bộ xuyên domain; không còn CommonJS/TODO trong code được bàn giao; 184 endpoint giữ nguyên và regression pass.

### G08 — Truy vấn discovery/search/pending còn tải field thừa (P2)

- Vị trí: search và pending gọi `findMany()` không projection rồi mới rút gọn response bằng JS; recommendation lấy tối đa 200 candidate mỗi loại cũng không projection.
- Với recipe nhiều steps/ingredients hoặc video transcript lớn, query vẫn tải toàn document dù response chỉ là card. Search/pending còn lấy `page * limit` mỗi collection để merge.
- Sửa: projection dành riêng card/suggestion/ranking; query chuyên biệt cho từng domain; kiểm tra query plan và thêm index theo filter/sort thực tế. Recommendation đã khai báo candidate limit 200, nên giữ hoặc thay đổi theo quyết định sản phẩm rõ ràng, không gọi đó là toàn bộ catalog.
- Nghiệm thu: kiểm tra query shape/projection; đo query count, bytes và latency trên dataset lớn; không N+1 ở list; dùng `explain` để xác minh index trên staging. Không suy ra hiệu năng production từ mock.

### G09 — Docker Compose mặc định trust proxy không phù hợp mọi topology (P2)

- Vị trí: `docker-compose.yml:17`, default `TRUST_PROXY=1`; env runtime mặc định 0.
- Compose hiện expose API trực tiếp qua host port và không khai báo reverse proxy. Khi truy cập trực tiếp với trust proxy 1, client có thể ảnh hưởng IP được Express sử dụng bằng `X-Forwarded-For`, tác động rate limiting/ipHash.
- Sửa: default 0 cho topology truy cập trực tiếp; chỉ bật số hop phù hợp khi deploy sau proxy có kiểm soát. Ghi cấu hình deployment cụ thể.
- Nghiệm thu: test IP/rate limit với header giả ở direct mode và với proxy topology thật.

## Khoảng trống xác minh và hoàn thiện vận hành

### G10 — Chưa xác minh Node 24 và cài sạch (P1)

Dockerfile đã dùng Node 24 nhưng host hiện là Node 22. Tạo job CI Node 24 chạy `npm ci`, test, format, docs và smoke; build container và xác minh graceful shutdown. Không cần nâng dependency chỉ để làm đúng tên/version project trong prompt.

### G11 — Persistence/index/migration chưa được nghiệm thu trên MongoDB thật (P1)

Suite database có sẵn nhưng bị skip. Chạy trên replica set/Atlas test riêng với `RUN_DATABASE_TESTS=true` và `MONGODB_URI_TEST` hợp lệ; kiểm tra transaction rollback, concurrency, unique index, last-admin guard, seed chạy hai lần và proposal confirmation.

`docs/persistence-mapping.md` yêu cầu chuyển index active meal plan sang slot ổn định. Script migrate hiện inventory và từ chối các trường hợp cần review; chưa tự backfill slot/build/drop index. Với DB đã có dữ liệu, cần công cụ/runbook bảo trì được review, kiểm kê conflict và thử restore/rollback trên staging. Với DB mới, xác minh canonical index/slot được tạo đúng trước khi nhận traffic. Chưa biết DB thực tế của người dùng có legacy data hay không.

### G12 — Provider thật và luồng mobile chưa có bằng chứng nghiệm thu (P1 trước deploy)

Dùng credential staging và dữ liệu test để xác minh Firebase token/sync, R2 PUT/HEAD/signed GET/delete, FCM Android, AI chat/vision/proposal và reminder occurrence. AI/FCM tắt vẫn là cấu hình hợp lệ nếu release chưa bật các feature đó; không bắt buộc bật chỉ để đạt test offline.

Đối chiếu từng flow ở mục 13.17 bằng HTTP workflow và mobile staging, đặc biệt avatar, moderation queue, video playback sau URL expiry, AI confirm idempotency, push/in-app và account suspended/deleted. Test thường xuyên vẫn dùng mock; các round trip staging phải tách khỏi suite offline.

Readiness hiện kiểm tra MongoDB và sự hiện diện object provider trong production, không gọi dịch vụ để chứng minh credential còn hoạt động. Giữ endpoint nhẹ và bổ sung preflight/kiểm tra vận hành có timeout để phân biệt configured với verified; tránh gọi mọi provider ở từng health poll.

## Kế hoạch thực hiện theo thứ tự

| Giai đoạn                     | Công việc                                                                                       | Điều kiện hoàn tất                                                                           |
| ----------------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 0. Baseline runtime           | G10; lưu baseline 184 API, dùng Node 24/CI; kiểm kê wiring/model/index                          | Cài sạch và kiểm tra baseline pass trên runtime hỗ trợ                                       |
| 1. Sửa lỗi truy vấn           | G01–G04; regression test trước khi sửa, thống nhất diet/sort/pagination, sửa pending queue      | Các tình huống tái hiện ở trên pass; docs/contract khớp                                      |
| 2. Hoàn thiện media/profile   | G05–G06; avatar ID/reference/URL, cleanup workflow/retry                                        | E2E mock avatar và cleanup race/idempotency pass                                             |
| 3. Chuẩn hóa kiến trúc        | G07; chuyển theo nhóm domain, giữ public contract, dọn code lịch sử có kiểm kê                  | Toàn bộ regression pass sau từng nhóm; không đổi schema/collection ngoài migration đã review |
| 4. Hardening truy vấn/deploy  | G08–G09; projection/index/query plan, proxy config, log/provider health semantics               | Kiểm thử IP và query shape pass; staging query plan đạt yêu cầu                              |
| 5. Nghiệm thu persistence     | G11; test replica set riêng, seed-twice, inventory và xử lý migration/index nếu DB cũ           | DB suite không skip; invariant và rollback được chứng minh trên MongoDB thật                 |
| 6. Nghiệm thu tích hợp/mobile | G12; staging providers và từng mobile flow ở 13.17; cập nhật README/OpenAPI/matrix              | Có bằng chứng từng feature được bật, blocker còn lại được ghi chính xác                      |
| 7. Bàn giao                   | `format:check`, `test:run`, `docs:check`, `smoke`, DB suite; rà soát secret/ownership/dead code | Checklist Definition of Done đạt với giới hạn deployment được ghi rõ                         |

Các bước sửa code không phụ thuộc credential có thể làm trước. G11–G12 cần cấu hình test/staging thật; không chạy vào DB production hoặc coi mock là bằng chứng dịch vụ thật.

## Quy tắc kiểm thử khi sửa

- Bổ sung test tái hiện G01–G05 trước khi thay nghiệp vụ; kiểm thử hành vi HTTP, không chỉ số endpoint/schema.
- Thêm dataset vượt giới hạn page/candidate và nội dung pending cũ; kiểm tra thứ tự, tổng, không trùng, không thiếu.
- Bao phủ đầy đủ diet enum và quyền media/avatar; kiểm tra URL expiry và media delete race.
- Khi chỉnh persistence, chạy DB suite thật cho constraint/concurrency; memory repository không thay thế MongoDB semantics.
- Khi đổi API avatar hoặc query contract, regenerate docs và cập nhật dedicated HTTP test/API matrix cùng lúc.
- Chạy test phù hợp mỗi nhóm sửa; chạy toàn bộ các gate khi bàn giao. Không xóa endpoint hoặc nới test để che lỗi.

## Tiêu chí kết thúc

G01–G09 được xử lý, G10–G12 có bằng chứng hoặc blocker cấu hình được nêu rõ. Đủ 184 endpoint và các flow mobile bắt buộc vẫn hoạt động; số test có thể tăng nhưng cần kiểm tra đúng hành vi. Runtime Node 24, database transaction/index, provider feature đang bật và deployment configuration phải được xác minh ở mức tương ứng trước khi tuyên bố sẵn sàng production.

## Kết quả khắc phục

| Mục     | Thay đổi và bằng chứng                                                                                                                                                                                                                                                    |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| G01–G03 | Search/pending dùng aggregation union + facet; sort ổn định, mọi trang được quảng cáo đều truy cập được, bỏ cutoff pending mặc định. Test có 1.001 kết quả và draft cũ; kiểm tra casting/ObjectId thực trên MongoDB.                                                      |
| G04     | Dùng helper diet chung cho browse/search/recommendation và AI food verification. Vegetarian variants/pescatarian dùng tập vegetarian bảo thủ; chưa có dữ liệu egg/dairy/fish để phân biệt chi tiết.                                                                       |
| G05     | Avatar qua media ID, owner/readiness/image/purpose guard, link/unlink transactional, signed URL mới khi trả profile và chặn xóa media đang tham chiếu.                                                                                                                    |
| G06     | Cleanup default dry-run, scope owner hoặc all-owners rõ ràng, guard namespace/bucket/reference, CAS claim + audit và retry deleting. Test race và retry/idempotency.                                                                                                      |
| G07     | Xóa 244 file source lịch sử không reachable và 9 script generator/fix cũ. Controller thực sự được mount, shared helpers chuyển common, import domain qua public index; giữ đủ 184 endpoint.                                                                               |
| G08     | Card projection và MongoDB pagination thay fetch-prefix/full-document, bổ sung index shapes. Recommendation giữ pool 200 ứng viên có giới hạn; query plan/latency với dữ liệu production còn cần staging.                                                                 |
| G09     | Compose trust proxy mặc định 0; test spoofed forwarded headers và proxy được cấu hình.                                                                                                                                                                                    |
| G10     | Cài sạch Node 24.21.0 bằng Docker, lockfile sửa dependency audit, thêm CI/runtime pins; production Docker build đạt.                                                                                                                                                      |
| G11     | 8/8 test đạt trên MongoDB 8.0 replica set disposable. Thêm db:indexes dry-run/apply maintenance: build index, backfill slot, chỉ retire named legacy index khi chỉ định; test rollback/unique/concurrency/seed và index transition. Không chạy migration vào DB ứng dụng. |
| G12     | Thêm preflight có timeout/status redacted và staging checklist. Firebase/R2/FCM/AI thật chưa nghiệm thu vì cấu hình local còn placeholder; mobile/device cũng cần staging.                                                                                                |

Bản đặc tả được lưu trong repo ở source-requirements.md để contract/CI chạy độc lập. Parser chấp nhận khoảng trắng căn bảng Markdown sau format và vẫn kiểm tra đúng 184 operation/permission. OpenAPI và matrix được regenerate.

Bằng chứng nghiệm thu cuối: Node 24 offline suite 499 test; DB riêng 8 test; format, docs check, smoke và Docker build. Smoke provider dùng mock, không thay thế round trip dịch vụ thật. npm audit của lockfile sau sửa không còn vulnerability được báo tại thời điểm kiểm tra.

Các container test do phiên này tạo được dọn sau kiểm tra. Chưa deploy; việc commit/push được quản lý trong lịch sử Git. Hướng dẫn thao tác và giới hạn: README.md, persistence-mapping.md và staging-acceptance.md.
