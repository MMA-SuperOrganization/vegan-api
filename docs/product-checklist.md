# CHECKLIST TOÀN BỘ FEATURE VÀ API — VEGAN SUPPORT APP

> Checklist nghiệm thu tổng thể dành cho Mobile, Backend, Admin, AI và hạ tầng. Phạm vi hiện tại là ứng dụng Android hỗ trợ người ăn chay. Base URL của API: `/api/v1`.

---

## 1. Cách sử dụng checklist

Quy ước:

- `☐`: chưa kiểm tra hoặc chưa hoàn thành.
- `☑`: đã hoàn thành và có bằng chứng.
- `N/A`: không áp dụng, phải ghi rõ lý do.
- Không đánh dấu hoàn thành chỉ vì đã tạo file hoặc route rỗng.
- Một feature chỉ hoàn thành khi Backend, Mobile và QA đều đạt nếu feature đó cần cả ba.
- Một API chỉ hoàn thành khi route thật, validation, authorization, test và OpenAPI đều tồn tại.

Các bằng chứng nên lưu kèm:

- Link commit/PR hoặc tên branch.
- Screenshot/video màn hình mobile.
- Kết quả test hoặc Postman/curl.
- Endpoint trong Swagger/OpenAPI.
- Test case ID và lỗi đã xử lý.

### 1.1 Trạng thái tổng quan

| Hạng mục                            |                     Tổng |                      Hoàn thành |                                                  Còn lại | Người phụ trách          |
| ----------------------------------- | -----------------------: | ------------------------------: | -------------------------------------------------------: | ------------------------ |
| Functional features (toàn sản phẩm) |                      199 |         0 nghiệm thu end-to-end |                                        199 cần Mobile/QA | Chưa nghiệm thu frontend |
| Trách nhiệm functional của Backend  |                      184 |           184 code/test backend | 0 thiếu sót đã xác nhận chưa sửa; 15 mục client-only N/A | Backend                  |
| Mobile screens/flows                | Chưa kiểm kê mã nguồn FE |                        Chưa làm |                                    Ngoài phạm vi lần này | Mobile                   |
| Backend API operations              |                  **184** |                         **184** |                                                        0 | Backend                  |
| Integration flows                   |  Theo staging acceptance |             Local DB/backup đạt |    Firebase/R2/FCM/AI và deployment thật chưa nghiệm thu | Backend/Staging          |
| Automated tests backend             |                      531 |    522 offline + 9 MongoDB thật |           0 lỗi trong suite; provider thật chưa kiểm tra | Backend                  |
| Non-functional requirements         |               Chương 6–9 | Code/test: xem các mục đánh dấu |        Production env/monitoring/provider/secret history | Backend/Ops              |

---

## 2. Phạm vi và quy tắc sản phẩm

- [ ] Ứng dụng chỉ nhắm tới Android trong phiên bản hiện tại.
- [x] Có ba nhóm quyền: Guest, Authenticated User và Admin.
- [ ] Đăng ký, đăng nhập, đăng xuất, quên/đổi mật khẩu thực hiện qua Firebase Authentication phía mobile.
- [x] Backend xác minh Firebase ID token và đồng bộ tài khoản nội bộ.
- [x] MongoDB không lưu password, password hash, refresh token hoặc Firebase ID token.
- [ ] Cloudflare R2 lưu ảnh/video; mobile upload trực tiếp bằng presigned URL.
- [x] AI chỉ đưa ra gợi ý, không chẩn đoán bệnh hoặc thay thế chuyên gia y tế.
- [x] AI không tự sửa pantry hoặc kích hoạt meal plan khi user chưa xác nhận.
- [x] Không có Apple Sign In hoặc yêu cầu riêng cho iOS.
- [x] Không có nhà hàng, cửa hàng, địa điểm, bản đồ hoặc GPS trong phạm vi hiện tại.
- [x] Không có thanh toán, đơn hàng hoặc giao hàng.
- [x] Không dùng BullMQ, Redis hoặc distributed queue trong phiên bản hiện tại.
- [x] Nội dung draft, rejected, hidden hoặc deleted không xuất hiện ở API public.
- [x] User chỉ sửa dữ liệu của chính mình; admin mutation phải có audit log.

---

## 3. Checklist toàn bộ functional feature

### 3.1 Khởi động ứng dụng, cấu hình và Home

| ID       | Feature cần kiểm tra                                         | Backend | Mobile | QA  |
| -------- | ------------------------------------------------------------ | ------- | ------ | --- |
| F-APP-01 | Splash/loading khi khởi động                                 | N/A     | ☐      | ☐   |
| F-APP-02 | Lấy public app config và feature flags                       | ☑       | ☐      | ☐   |
| F-APP-03 | Bootstrap cho Guest                                          | ☑       | ☐      | ☐   |
| F-APP-04 | Bootstrap cho user đã đăng nhập                              | ☑       | ☐      | ☐   |
| F-APP-05 | Kiểm tra phiên đăng nhập Firebase khi mở app                 | N/A     | ☐      | ☐   |
| F-APP-06 | Home hiển thị recipe, video và blog nổi bật                  | ☑       | ☐      | ☐   |
| F-APP-07 | Home cá nhân hóa khi đã đăng nhập                            | ☑       | ☐      | ☐   |
| F-APP-08 | Pull-to-refresh và trạng thái loading/empty/error            | N/A     | ☐      | ☐   |
| F-APP-09 | Không hiển thị nội dung chưa publish                         | ☑       | ☐      | ☐   |
| F-APP-10 | Xử lý app version không còn được hỗ trợ nếu cấu hình yêu cầu | ☑       | ☐      | ☐   |

### 3.2 Authentication và tài khoản

| ID        | Feature cần kiểm tra                           | Backend | Mobile | QA  |
| --------- | ---------------------------------------------- | ------- | ------ | --- |
| F-AUTH-01 | Đăng ký bằng email/password qua Firebase       | N/A     | ☐      | ☐   |
| F-AUTH-02 | Đăng nhập bằng email/password qua Firebase     | N/A     | ☐      | ☐   |
| F-AUTH-03 | Đăng xuất và xóa trạng thái phiên local        | N/A     | ☐      | ☐   |
| F-AUTH-04 | Quên/đổi mật khẩu qua Firebase                 | N/A     | ☐      | ☐   |
| F-AUTH-05 | Đồng bộ Firebase user với user nội bộ          | ☑       | ☐      | ☐   |
| F-AUTH-06 | Tự đính kèm Bearer token vào request bảo vệ    | N/A     | ☐      | ☐   |
| F-AUTH-07 | Refresh/retry token hết hạn đúng một lần       | N/A     | ☐      | ☐   |
| F-AUTH-08 | Chuyển về đăng nhập khi token không còn hợp lệ | N/A     | ☐      | ☐   |
| F-AUTH-09 | Chặn user suspended/deleted                    | ☑       | ☐      | ☐   |
| F-AUTH-10 | Đăng ký và gỡ FCM device token                 | ☑       | ☐      | ☐   |
| F-AUTH-11 | Không log hoặc lưu token nhạy cảm              | ☑       | ☐      | ☐   |
| F-AUTH-12 | Soft-delete tài khoản nội bộ                   | ☑       | ☐      | ☐   |

### 3.3 Onboarding, profile và nutrition profile

| ID       | Feature cần kiểm tra                              | Backend | Mobile | QA  |
| -------- | ------------------------------------------------- | ------- | ------ | --- |
| F-PRO-01 | Onboarding theo từng bước                         | ☑       | ☐      | ☐   |
| F-PRO-02 | Chọn loại chế độ ăn chay                          | ☑       | ☐      | ☐   |
| F-PRO-03 | Chọn allergen cần tránh                           | ☑       | ☐      | ☐   |
| F-PRO-04 | Nhập chiều cao, cân nặng và activity level        | ☑       | ☐      | ☐   |
| F-PRO-05 | Chọn mục tiêu dinh dưỡng/cân nặng                 | ☑       | ☐      | ☐   |
| F-PRO-06 | Kiểm tra đủ dữ liệu trước khi hoàn tất onboarding | ☑       | ☐      | ☐   |
| F-PRO-07 | Xem và chỉnh sửa profile                          | ☑       | ☐      | ☐   |
| F-PRO-08 | Upload/cập nhật avatar qua R2                     | ☑       | ☐      | ☐   |
| F-PRO-09 | Xem public profile đã giới hạn field              | ☑       | ☐      | ☐   |
| F-PRO-10 | Xem/cập nhật nutrition profile                    | ☑       | ☐      | ☐   |
| F-PRO-11 | Tính lại BMI và mục tiêu dinh dưỡng               | ☑       | ☐      | ☐   |
| F-PRO-12 | Hiển thị disclaimer cho BMI/calorie estimate      | ☑       | ☐      | ☐   |
| F-PRO-13 | Không lộ medical notes qua public profile         | ☑       | ☐      | ☐   |
| F-PRO-14 | Xem nội dung và hoạt động của chính mình          | ☑       | ☐      | ☐   |

### 3.4 Master data: category, allergen và food item

| ID       | Feature cần kiểm tra                         | Backend | Mobile/Admin | QA  |
| -------- | -------------------------------------------- | ------- | ------------ | --- |
| F-MAS-01 | Guest/user xem category active               | ☑       | ☐            | ☐   |
| F-MAS-02 | Guest/user xem allergen active               | ☑       | ☐            | ☐   |
| F-MAS-03 | Tìm và lọc food item                         | ☑       | ☐            | ☐   |
| F-MAS-04 | Xem nutrition per 100g của food item         | ☑       | ☐            | ☐   |
| F-MAS-05 | Admin CRUD/inactivate category               | ☑       | ☐            | ☐   |
| F-MAS-06 | Admin CRUD/inactivate allergen               | ☑       | ☐            | ☐   |
| F-MAS-07 | Admin CRUD/inactivate food item              | ☑       | ☐            | ☐   |
| F-MAS-08 | Không xóa cứng master data đang được sử dụng | ☑       | ☐            | ☐   |
| F-MAS-09 | Snapshot lịch sử không đổi khi food item đổi | ☑       | ☐            | ☐   |

### 3.5 Recipe, search, discover và recommendation

| ID       | Feature cần kiểm tra                              | Backend | Mobile | QA  |
| -------- | ------------------------------------------------- | ------- | ------ | --- |
| F-REC-01 | Browse recipe published/public                    | ☑       | ☐      | ☐   |
| F-REC-02 | Search recipe/food/post/video                     | ☑       | ☐      | ☐   |
| F-REC-03 | Autocomplete search                               | ☑       | ☐      | ☐   |
| F-REC-04 | Lưu/xem/xóa recent search                         | ☑       | ☐      | ☐   |
| F-REC-05 | Filter category, cuisine, difficulty, time và tag | ☑       | ☐      | ☐   |
| F-REC-06 | Loại trừ allergen/diet không phù hợp              | ☑       | ☐      | ☐   |
| F-REC-07 | Xem recipe detail, ingredients và steps           | ☑       | ☐      | ☐   |
| F-REC-08 | Xem nutrition per serving                         | ☑       | ☐      | ☐   |
| F-REC-09 | Discover content nổi bật                          | ☑       | ☐      | ☐   |
| F-REC-10 | Recommendation theo profile/pantry/mục tiêu       | ☑       | ☐      | ☐   |
| F-REC-11 | User tạo recipe draft                             | ☑       | ☐      | ☐   |
| F-REC-12 | User sửa/xóa recipe của mình                      | ☑       | ☐      | ☐   |
| F-REC-13 | User gửi recipe chờ duyệt                         | ☑       | ☐      | ☐   |
| F-REC-14 | Admin publish/reject recipe có lý do              | ☑       | ☐      | ☐   |
| F-REC-15 | Xem danh sách recipe của chính mình theo status   | ☑       | ☐      | ☐   |
| F-REC-16 | Không đề xuất recipe chứa allergen bị chặn        | ☑       | ☐      | ☐   |

### 3.6 Pantry

| ID       | Feature cần kiểm tra                  | Backend | Mobile | QA  |
| -------- | ------------------------------------- | ------- | ------ | --- |
| F-PAN-01 | Xem pantry cá nhân                    | ☑       | ☐      | ☐   |
| F-PAN-02 | Thêm một pantry item                  | ☑       | ☐      | ☐   |
| F-PAN-03 | Thêm nhiều item cùng lúc              | ☑       | ☐      | ☐   |
| F-PAN-04 | Sửa quantity, unit, expiry và note    | ☑       | ☐      | ☐   |
| F-PAN-05 | Xóa pantry item                       | ☑       | ☐      | ☐   |
| F-PAN-06 | Xem item sắp hết hạn                  | ☑       | ☐      | ☐   |
| F-PAN-07 | Gợi ý recipe theo nguyên liệu hiện có | ☑       | ☐      | ☐   |
| F-PAN-08 | Không tự trừ pantry khi chưa xác nhận | ☑       | ☐      | ☐   |
| F-PAN-09 | Chỉ owner truy cập pantry             | ☑       | ☐      | ☐   |

### 3.7 Meal plan

| ID       | Feature cần kiểm tra                     | Backend | Mobile | QA  |
| -------- | ---------------------------------------- | ------- | ------ | --- |
| F-MEA-01 | Xem danh sách meal plan theo tuần/status | ☑       | ☐      | ☐   |
| F-MEA-02 | Xem meal plan active hiện tại            | ☑       | ☐      | ☐   |
| F-MEA-03 | Xem chi tiết ngày và bữa ăn              | ☑       | ☐      | ☐   |
| F-MEA-04 | Tạo meal plan thủ công                   | ☑       | ☐      | ☐   |
| F-MEA-05 | Sửa/archive/delete plan hợp lệ           | ☑       | ☐      | ☐   |
| F-MEA-06 | Thêm/sửa/xóa meal                        | ☑       | ☐      | ☐   |
| F-MEA-07 | Đánh dấu meal hoàn thành                 | ☑       | ☐      | ☐   |
| F-MEA-08 | Kích hoạt đúng một plan cho một tuần     | ☑       | ☐      | ☐   |
| F-MEA-09 | Clone plan sang tuần khác                | ☑       | ☐      | ☐   |
| F-MEA-10 | Sinh grocery list từ meal plan           | ☑       | ☐      | ☐   |
| F-MEA-11 | Hiển thị nutrition summary snapshot      | ☑       | ☐      | ☐   |
| F-MEA-12 | Chỉ owner truy cập meal plan             | ☑       | ☐      | ☐   |

### 3.8 Grocery list

| ID       | Feature cần kiểm tra                       | Backend | Mobile | QA  |
| -------- | ------------------------------------------ | ------- | ------ | --- |
| F-GRO-01 | Xem list và chi tiết grocery list          | ☑       | ☐      | ☐   |
| F-GRO-02 | Tạo grocery list thủ công                  | ☑       | ☐      | ☐   |
| F-GRO-03 | Tạo grocery list từ meal plan              | ☑       | ☐      | ☐   |
| F-GRO-04 | Thêm/sửa/xóa item                          | ☑       | ☐      | ☐   |
| F-GRO-05 | Check/uncheck item                         | ☑       | ☐      | ☐   |
| F-GRO-06 | Clear checked items idempotently           | ☑       | ☐      | ☐   |
| F-GRO-07 | Cộng gộp quantity khi có thể quy đổi unit  | ☑       | ☐      | ☐   |
| F-GRO-08 | Không cộng sai các unit không quy đổi được | ☑       | ☐      | ☐   |
| F-GRO-09 | Archive/completed grocery list             | ☑       | ☐      | ☐   |

### 3.9 Diary, nutrition summary, weight và water

| ID       | Feature cần kiểm tra                       | Backend | Mobile | QA  |
| -------- | ------------------------------------------ | ------- | ------ | --- |
| F-TRA-01 | Xem diary theo ngày/range                  | ☑       | ☐      | ☐   |
| F-TRA-02 | Ghi recipe/food/custom item đã ăn          | ☑       | ☐      | ☐   |
| F-TRA-03 | Sửa/xóa diary entry của mình               | ☑       | ☐      | ☐   |
| F-TRA-04 | Lưu nutrition snapshot tại thời điểm ghi   | ☑       | ☐      | ☐   |
| F-TRA-05 | Tổng calories/macros theo ngày/range       | ☑       | ☐      | ☐   |
| F-TRA-06 | So sánh với daily target                   | ☑       | ☐      | ☐   |
| F-TRA-07 | CRUD weight log                            | ☑       | ☐      | ☐   |
| F-TRA-08 | Hiển thị weight trend                      | ☑       | ☐      | ☐   |
| F-TRA-09 | CRUD water log                             | ☑       | ☐      | ☐   |
| F-TRA-10 | Tổng nước theo ngày và target              | ☑       | ☐      | ☐   |
| F-TRA-11 | Giới hạn date range để tránh query quá lớn | ☑       | ☐      | ☐   |
| F-TRA-12 | Chỉ owner truy cập health tracking         | ☑       | ☐      | ☐   |

### 3.10 Media và Cloudflare R2

| ID       | Feature cần kiểm tra                     | Backend | Mobile | QA  |
| -------- | ---------------------------------------- | ------- | ------ | --- |
| F-MED-01 | Chọn/chụp ảnh và chọn video trên Android | N/A     | ☐      | ☐   |
| F-MED-02 | Xin quyền thư viện/camera đúng thời điểm | N/A     | ☐      | ☐   |
| F-MED-03 | Tạo presigned upload request             | ☑       | ☐      | ☐   |
| F-MED-04 | Validate MIME, size và purpose           | ☑       | ☐      | ☐   |
| F-MED-05 | Upload trực tiếp từ mobile lên R2        | ☑       | ☐      | ☐   |
| F-MED-06 | Hiển thị upload progress/retry/cancel    | N/A     | ☐      | ☐   |
| F-MED-07 | Confirm upload bằng HeadObject           | ☑       | ☐      | ☐   |
| F-MED-08 | Chỉ media ready mới gắn được vào entity  | ☑       | ☐      | ☐   |
| F-MED-09 | Xem media của chính mình                 | ☑       | ☐      | ☐   |
| F-MED-10 | Xóa media không còn được sử dụng         | ☑       | ☐      | ☐   |
| F-MED-11 | Dọn pending upload quá hạn               | ☑       | N/A    | ☐   |
| F-MED-12 | Không proxy binary upload qua Express    | ☑       | ☐      | ☐   |

### 3.11 Blog, community post, comment, reaction và saved item

| ID       | Feature cần kiểm tra                    | Backend | Mobile | QA  |
| -------- | --------------------------------------- | ------- | ------ | --- |
| F-SOC-01 | Feed post/blog published                | ☑       | ☐      | ☐   |
| F-SOC-02 | Xem post/blog detail                    | ☑       | ☐      | ☐   |
| F-SOC-03 | User tạo/sửa/xóa draft của mình         | ☑       | ☐      | ☐   |
| F-SOC-04 | User gửi post chờ duyệt                 | ☑       | ☐      | ☐   |
| F-SOC-05 | Admin publish/reject post có lý do      | ☑       | ☐      | ☐   |
| F-SOC-06 | Xem nội dung của mình theo status/type  | ☑       | ☐      | ☐   |
| F-SOC-07 | List comment theo target                | ☑       | ☐      | ☐   |
| F-SOC-08 | Tạo comment và reply một cấp            | ☑       | ☐      | ☐   |
| F-SOC-09 | Sửa/xóa comment của mình                | ☑       | ☐      | ☐   |
| F-SOC-10 | Admin ẩn/xóa comment vi phạm            | ☑       | ☐      | ☐   |
| F-SOC-11 | Upsert/remove reaction                  | ☑       | ☐      | ☐   |
| F-SOC-12 | Lưu/bỏ lưu recipe, post và video        | ☑       | ☐      | ☐   |
| F-SOC-13 | Xem danh sách saved item theo type      | ☑       | ☐      | ☐   |
| F-SOC-14 | Counter comment/reaction/save nhất quán | ☑       | ☐      | ☐   |

### 3.12 Video hướng dẫn

| ID       | Feature cần kiểm tra                  | Backend | Mobile | QA  |
| -------- | ------------------------------------- | ------- | ------ | --- |
| F-VID-01 | Browse/search/filter video published  | ☑       | ☐      | ☐   |
| F-VID-02 | Xem video detail và playback URL      | ☑       | ☐      | ☐   |
| F-VID-03 | Phát/pause/seek video                 | N/A     | ☐      | ☐   |
| F-VID-04 | Lưu watch progress và completed       | ☑       | ☐      | ☐   |
| F-VID-05 | Xem transcript và chapters            | ☑       | ☐      | ☐   |
| F-VID-06 | Xem related videos/recipes            | ☑       | ☐      | ☐   |
| F-VID-07 | User upload video qua R2              | ☑       | ☐      | ☐   |
| F-VID-08 | User tạo/sửa/xóa video draft          | ☑       | ☐      | ☐   |
| F-VID-09 | User gửi video chờ duyệt              | ☑       | ☐      | ☐   |
| F-VID-10 | Admin publish/reject video            | ☑       | ☐      | ☐   |
| F-VID-11 | AI tạo transcript/summary khi bật     | ☑       | ☐      | ☐   |
| F-VID-12 | View count chống tăng lặp mù quáng    | ☑       | ☐      | ☐   |
| F-VID-13 | Chỉ video có media ready được publish | ☑       | ☐      | ☐   |

### 3.13 Rating, vote và view history

| ID       | Feature cần kiểm tra                   | Backend | Mobile | QA  |
| -------- | -------------------------------------- | ------- | ------ | --- |
| F-RAT-01 | Reaction/vote nhanh tách biệt rating   | ☑       | ☐      | ☐   |
| F-RAT-02 | Rating recipe/video từ 1–5             | ☑       | ☐      | ☐   |
| F-RAT-03 | Cập nhật/xóa rating của mình           | ☑       | ☐      | ☐   |
| F-RAT-04 | Xem average/count/distribution         | ☑       | ☐      | ☐   |
| F-RAT-05 | Mỗi user chỉ có một rating trên target | ☑       | ☐      | ☐   |
| F-RAT-06 | Ghi view history recipe/post/video     | ☑       | ☐      | ☐   |
| F-RAT-07 | Xem/xóa một hoặc toàn bộ view history  | ☑       | ☐      | ☐   |
| F-RAT-08 | View history chỉ owner truy cập        | ☑       | ☐      | ☐   |

### 3.14 AI features

| ID      | Feature cần kiểm tra                                  | Backend | Mobile | QA  |
| ------- | ----------------------------------------------------- | ------- | ------ | --- |
| F-AI-01 | Tạo/list AI conversation                              | ☑       | ☐      | ☐   |
| F-AI-02 | Xem message history                                   | ☑       | ☐      | ☐   |
| F-AI-03 | Chat về ăn chay/dinh dưỡng                            | ☑       | ☐      | ☐   |
| F-AI-04 | Hiển thị loading, retry và lỗi AI an toàn             | ☑       | ☐      | ☐   |
| F-AI-05 | Sinh meal-plan proposal có cấu trúc                   | ☑       | ☐      | ☐   |
| F-AI-06 | Preview/chỉnh lựa chọn trước khi confirm              | ☑       | ☐      | ☐   |
| F-AI-07 | Confirm proposal idempotently                         | ☑       | ☐      | ☐   |
| F-AI-08 | Nhận diện nguyên liệu từ ảnh ready                    | ☑       | ☐      | ☐   |
| F-AI-09 | User xác nhận trước khi thêm pantry                   | ☑       | ☐      | ☐   |
| F-AI-10 | Tóm tắt/transcript video khi provider hỗ trợ          | ☑       | ☐      | ☐   |
| F-AI-11 | Helpful/not-helpful feedback                          | ☑       | ☐      | ☐   |
| F-AI-12 | Validate structured output bằng Zod                   | ☑       | N/A    | ☐   |
| F-AI-13 | Rate limit riêng cho AI                               | ☑       | ☐      | ☐   |
| F-AI-14 | AI disabled trả lỗi có kiểm soát                      | ☑       | ☐      | ☐   |
| F-AI-15 | Medical safety disclaimer và refusal an toàn          | ☑       | ☐      | ☐   |
| F-AI-16 | Không gửi dữ liệu/secret không cần thiết vào provider | ☑       | N/A    | ☐   |

### 3.15 Notification và reminder

| ID       | Feature cần kiểm tra                             | Backend | Mobile | QA  |
| -------- | ------------------------------------------------ | ------- | ------ | --- |
| F-NOT-01 | Xin quyền push notification trên Android         | N/A     | ☐      | ☐   |
| F-NOT-02 | Đăng ký/gỡ FCM token theo thiết bị               | ☑       | ☐      | ☐   |
| F-NOT-03 | Inbox notification có pagination                 | ☑       | ☐      | ☐   |
| F-NOT-04 | Unread badge/count                               | ☑       | ☐      | ☐   |
| F-NOT-05 | Đánh dấu một/tất cả đã đọc                       | ☑       | ☐      | ☐   |
| F-NOT-06 | Xóa/ẩn notification của mình                     | ☑       | ☐      | ☐   |
| F-NOT-07 | Xem/cập nhật notification preferences            | ☑       | ☐      | ☐   |
| F-NOT-08 | CRUD/pause/resume/cancel reminder                | ☑       | ☐      | ☐   |
| F-NOT-09 | Hỗ trợ once/daily/weekly và timezone             | ☑       | ☐      | ☐   |
| F-NOT-10 | Quiet hours                                      | ☑       | ☐      | ☐   |
| F-NOT-11 | In-app notification vẫn hoạt động khi push tắt   | ☑       | ☐      | ☐   |
| F-NOT-12 | Scheduler claim/lock/idempotency không gửi trùng | ☑       | N/A    | ☐   |
| F-NOT-13 | Deep-link notification tới đúng màn hình         | ☑       | ☐      | ☐   |

### 3.16 Report, moderation và audit

| ID       | Feature cần kiểm tra                        | Backend | Mobile/Admin | QA  |
| -------- | ------------------------------------------- | ------- | ------------ | --- |
| F-MOD-01 | User báo cáo post/recipe/video/comment/user | ☑       | ☐            | ☐   |
| F-MOD-02 | User xem danh sách/chi tiết report của mình | ☑       | ☐            | ☐   |
| F-MOD-03 | Admin xem/assign/resolve report queue       | ☑       | ☐            | ☐   |
| F-MOD-04 | Admin tạo/gộp/cập nhật moderation case      | ☑       | ☐            | ☐   |
| F-MOD-05 | Admin hide/restore content                  | ☑       | ☐            | ☐   |
| F-MOD-06 | Admin suspend/activate user                 | ☑       | ☐            | ☐   |
| F-MOD-07 | Nội dung hidden biến mất khỏi public API    | ☑       | ☐            | ☐   |
| F-MOD-08 | Mọi admin mutation ghi audit before/after   | ☑       | ☐            | ☐   |
| F-MOD-09 | Audit log read-only và đã redact            | ☑       | ☐            | ☐   |

### 3.17 Admin dashboard và AI monitoring

| ID       | Feature cần kiểm tra                                | Backend | Admin UI | QA  |
| -------- | --------------------------------------------------- | ------- | -------- | --- |
| F-ADM-01 | Dashboard tổng quan user/content/report/AI          | ☑       | ☐        | ☐   |
| F-ADM-02 | Content trend theo range                            | ☑       | ☐        | ☐   |
| F-ADM-03 | User trend theo range                               | ☑       | ☐        | ☐   |
| F-ADM-04 | Pending-content queue chung                         | ☑       | ☐        | ☐   |
| F-ADM-05 | List/search/detail user                             | ☑       | ☐        | ☐   |
| F-ADM-06 | Đổi role có guard admin cuối cùng                   | ☑       | ☐        | ☐   |
| F-ADM-07 | AI run list/detail đã redact                        | ☑       | ☐        | ☐   |
| F-ADM-08 | AI success/schema-valid/helpful rate                | ☑       | ☐        | ☐   |
| F-ADM-09 | AI latency/usage theo model/feature/time            | ☑       | ☐        | ☐   |
| F-ADM-10 | Không gọi metric là accuracy nếu thiếu ground truth | ☑       | ☐        | ☐   |
| F-ADM-11 | Chỉ admin truy cập toàn bộ admin API                | ☑       | ☐        | ☐   |

---

## 4. Checklist mobile UX và kỹ thuật chung

### 4.1 Navigation và trạng thái màn hình

- [ ] Navigation tách Guest, User và Admin flow.
- [ ] Protected screen tự chuyển tới login khi chưa xác thực.
- [ ] Back navigation không đưa user trở lại màn hình nhạy cảm sau logout.
- [ ] Mọi màn hình data có loading, empty, error và retry state.
- [ ] Form hiển thị validation error đúng field.
- [ ] Submit button chống double tap/double request.
- [ ] Pull-to-refresh không tạo dữ liệu trùng.
- [ ] Pagination/infinite scroll không tải lặp hoặc bỏ item.
- [ ] Search có debounce và hủy request cũ.
- [ ] Android keyboard không che input/button quan trọng.
- [ ] Deep link từ notification mở đúng màn hình hoặc fallback an toàn.

### 4.2 Local state, cache và network

- [ ] Không lưu Firebase ID token thủ công trong plain AsyncStorage nếu SDK đã quản lý phiên.
- [ ] Không lưu secret/API key trong app bundle.
- [ ] Dữ liệu cache được invalidate sau create/update/delete.
- [ ] User A logout không để cache riêng tư xuất hiện cho User B.
- [ ] Hiển thị trạng thái offline/network error rõ ràng.
- [ ] Retry chỉ áp dụng cho request an toàn hoặc có idempotency.
- [ ] Không duplicate optimistic update khi server trả về.
- [ ] Upload lớn có progress, retry và cleanup trạng thái.

### 4.3 Form và dữ liệu

- [ ] Trim input và giới hạn độ dài giống backend.
- [ ] Quantity, unit, date và timezone được nhập đúng định dạng.
- [ ] Date hiển thị theo timezone user nhưng gửi ISO 8601.
- [ ] Không cho client tự gửi role, ownerId, counters hoặc system status.
- [ ] Picker category/allergen/food dùng master data từ API.
- [ ] Confirm dialog trước delete, cancel, activate hoặc AI apply.
- [ ] Hiển thị server validation message thân thiện.

### 4.4 Accessibility và giao diện

- [ ] Touch target đủ lớn.
- [ ] Text có contrast dễ đọc.
- [ ] Icon có accessibility label.
- [ ] Không chỉ dùng màu để biểu thị lỗi/trạng thái.
- [ ] Hỗ trợ font scaling hợp lý.
- [ ] Ảnh có placeholder/fallback.
- [ ] Video có trạng thái loading/error và control rõ ràng.
- [ ] Nội dung dài có layout/scroll ổn định.

---

## 5. Checklist toàn bộ 184 API operations

Mỗi dòng chỉ đánh dấu `Done` khi đạt đủ: route/controller/service/repository cần thiết, Zod validation, authentication/authorization/ownership, error mapping, automated test và OpenAPI.

### 5.1 Auth — 4 APIs

|   # | Method và path                     | Mục đích                       | BE  | Mobile | Test | OpenAPI |
| --: | ---------------------------------- | ------------------------------ | --- | ------ | ---- | ------- |
|   1 | `POST /auth/sync`                  | Đồng bộ user từ Firebase token | ☑   | ☐      | ☑    | ☑       |
|   2 | `GET /auth/me`                     | Lấy identity/role/status       | ☑   | ☐      | ☑    | ☑       |
|   3 | `POST /auth/fcm-tokens`            | Đăng ký/cập nhật FCM token     | ☑   | ☐      | ☑    | ☑       |
|   4 | `DELETE /auth/fcm-tokens/:tokenId` | Gỡ FCM token                   | ☑   | ☐      | ☑    | ☑       |

### 5.2 App, Home và Onboarding — 6 APIs

|   # | Method và path              | Mục đích                    | BE  | Mobile | Test | OpenAPI |
| --: | --------------------------- | --------------------------- | --- | ------ | ---- | ------- |
|   5 | `GET /app/config`           | Public config/feature flags | ☑   | ☐      | ☑    | ☑       |
|   6 | `GET /app/bootstrap`        | Payload khởi động           | ☑   | ☐      | ☑    | ☑       |
|   7 | `GET /home`                 | Home feed                   | ☑   | ☐      | ☑    | ☑       |
|   8 | `GET /onboarding/status`    | Trạng thái onboarding       | ☑   | ☐      | ☑    | ☑       |
|   9 | `PUT /onboarding`           | Lưu từng bước onboarding    | ☑   | ☐      | ☑    | ☑       |
|  10 | `POST /onboarding/complete` | Hoàn tất onboarding         | ☑   | ☐      | ☑    | ☑       |

### 5.3 Health — 2 APIs

|   # | Method và path      | Mục đích  | BE  | Mobile | Test | OpenAPI |
| --: | ------------------- | --------- | --- | ------ | ---- | ------- |
|  11 | `GET /health`       | Liveness  | ☐   | N/A    | ☐    | ☐       |
|  12 | `GET /health/ready` | Readiness | ☐   | N/A    | ☐    | ☐       |

### 5.4 User và Profile — 11 APIs

|   # | Method và path                            | Mục đích                     | BE  | Mobile | Test | OpenAPI |
| --: | ----------------------------------------- | ---------------------------- | --- | ------ | ---- | ------- |
|  13 | `GET /users/me`                           | Tài khoản/profile tổng hợp   | ☑   | ☐      | ☑    | ☑       |
|  14 | `PATCH /users/me`                         | Cập nhật display name/avatar | ☑   | ☐      | ☑    | ☑       |
|  15 | `DELETE /users/me`                        | Soft-delete tài khoản        | ☑   | ☐      | ☑    | ☑       |
|  16 | `GET /users/:userId/public`               | Public profile               | ☑   | ☐      | ☑    | ☑       |
|  17 | `GET /users/me/content`                   | Nội dung của mình            | ☑   | ☐      | ☑    | ☑       |
|  18 | `GET /users/me/activity`                  | Hoạt động của mình           | ☑   | ☐      | ☑    | ☑       |
|  19 | `GET /profiles/me`                        | Xem user profile             | ☑   | ☐      | ☑    | ☑       |
|  20 | `PUT /profiles/me`                        | Upsert user profile          | ☑   | ☐      | ☑    | ☑       |
|  21 | `GET /nutrition-profiles/me`              | Xem nutrition profile        | ☑   | ☐      | ☑    | ☑       |
|  22 | `PUT /nutrition-profiles/me`              | Upsert nutrition profile     | ☑   | ☐      | ☑    | ☑       |
|  23 | `POST /nutrition-profiles/me/recalculate` | Tính lại BMI/target          | ☑   | ☐      | ☑    | ☑       |

### 5.5 Category, Allergen và Food Item — 13 APIs

|   # | Method và path           | Mục đích                   | BE  | Mobile/Admin | Test | OpenAPI |
| --: | ------------------------ | -------------------------- | --- | ------------ | ---- | ------- |
|  24 | `GET /categories`        | List category active       | ☑   | ☐            | ☑    | ☑       |
|  25 | `POST /categories`       | Admin tạo category         | ☑   | ☐            | ☑    | ☑       |
|  26 | `PATCH /categories/:id`  | Admin sửa category         | ☑   | ☐            | ☑    | ☑       |
|  27 | `DELETE /categories/:id` | Admin inactivate category  | ☑   | ☐            | ☑    | ☑       |
|  28 | `GET /allergens`         | List allergen active       | ☑   | ☐            | ☑    | ☑       |
|  29 | `POST /allergens`        | Admin tạo allergen         | ☑   | ☐            | ☑    | ☑       |
|  30 | `PATCH /allergens/:id`   | Admin sửa allergen         | ☑   | ☐            | ☑    | ☑       |
|  31 | `DELETE /allergens/:id`  | Admin inactivate allergen  | ☑   | ☐            | ☑    | ☑       |
|  32 | `GET /food-items`        | Search/filter food item    | ☑   | ☐            | ☑    | ☑       |
|  33 | `GET /food-items/:id`    | Chi tiết food/nutrition    | ☑   | ☐            | ☑    | ☑       |
|  34 | `POST /food-items`       | Admin tạo food item        | ☑   | ☐            | ☑    | ☑       |
|  35 | `PATCH /food-items/:id`  | Admin sửa food item        | ☑   | ☐            | ☑    | ☑       |
|  36 | `DELETE /food-items/:id` | Admin inactivate food item | ☑   | ☐            | ☑    | ☑       |

### 5.6 Recipe, Search và Recommendation — 18 APIs

|   # | Method và path                 | Mục đích                  | BE  | Mobile | Test | OpenAPI |
| --: | ------------------------------ | ------------------------- | --- | ------ | ---- | ------- |
|  37 | `GET /recipes`                 | List recipe public        | ☑   | ☐      | ☑    | ☑       |
|  38 | `GET /recipes/mine`            | Recipe của mình           | ☑   | ☐      | ☑    | ☑       |
|  39 | `GET /recipes/:idOrSlug`       | Recipe detail             | ☑   | ☐      | ☑    | ☑       |
|  40 | `POST /recipes`                | Tạo recipe draft          | ☑   | ☐      | ☑    | ☑       |
|  41 | `PATCH /recipes/:id`           | Sửa recipe                | ☑   | ☐      | ☑    | ☑       |
|  42 | `DELETE /recipes/:id`          | Soft-delete recipe        | ☑   | ☐      | ☑    | ☑       |
|  43 | `POST /recipes/:id/submit`     | Gửi recipe chờ duyệt      | ☑   | ☐      | ☑    | ☑       |
|  44 | `POST /recipes/:id/publish`    | Admin publish recipe      | ☑   | ☐      | ☑    | ☑       |
|  45 | `POST /recipes/:id/reject`     | Admin reject recipe       | ☑   | ☐      | ☑    | ☑       |
|  46 | `GET /recipes/:id/nutrition`   | Nutrition per serving     | ☑   | ☐      | ☑    | ☑       |
|  47 | `GET /search`                  | Global search             | ☑   | ☐      | ☑    | ☑       |
|  48 | `GET /search/suggestions`      | Autocomplete              | ☑   | ☐      | ☑    | ☑       |
|  49 | `GET /search/recent`           | Recent search             | ☑   | ☐      | ☑    | ☑       |
|  50 | `DELETE /search/recent`        | Xóa toàn bộ recent search | ☑   | ☐      | ☑    | ☑       |
|  51 | `DELETE /search/recent/:id`    | Xóa một recent search     | ☑   | ☐      | ☑    | ☑       |
|  52 | `GET /discover`                | Discover content          | ☑   | ☐      | ☑    | ☑       |
|  53 | `GET /recommendations/recipes` | Recipe recommendation     | ☑   | ☐      | ☑    | ☑       |
|  54 | `GET /recommendations/content` | Content recommendation    | ☑   | ☐      | ☑    | ☑       |

### 5.7 Pantry — 7 APIs

|   # | Method và path                   | Mục đích           | BE  | Mobile | Test | OpenAPI |
| --: | -------------------------------- | ------------------ | --- | ------ | ---- | ------- |
|  55 | `GET /pantry`                    | Xem pantry         | ☑   | ☐      | ☑    | ☑       |
|  56 | `POST /pantry/items`             | Thêm một item      | ☑   | ☐      | ☑    | ☑       |
|  57 | `POST /pantry/items/bulk`        | Thêm nhiều item    | ☑   | ☐      | ☑    | ☑       |
|  58 | `PATCH /pantry/items/:itemId`    | Sửa pantry item    | ☑   | ☐      | ☑    | ☑       |
|  59 | `DELETE /pantry/items/:itemId`   | Xóa pantry item    | ☑   | ☐      | ☑    | ☑       |
|  60 | `GET /pantry/expiring`           | Item sắp hết hạn   | ☑   | ☐      | ☑    | ☑       |
|  61 | `GET /pantry/recipe-suggestions` | Recipe theo pantry | ☑   | ☐      | ☑    | ☑       |

### 5.8 Meal Plan — 12 APIs

|   # | Method và path                         | Mục đích            | BE  | Mobile | Test | OpenAPI |
| --: | -------------------------------------- | ------------------- | --- | ------ | ---- | ------- |
|  62 | `GET /meal-plans`                      | List meal plan      | ☑   | ☐      | ☑    | ☑       |
|  63 | `GET /meal-plans/current`              | Plan hiện tại       | ☑   | ☐      | ☑    | ☑       |
|  64 | `GET /meal-plans/:id`                  | Plan detail         | ☑   | ☐      | ☑    | ☑       |
|  65 | `POST /meal-plans`                     | Tạo plan            | ☑   | ☐      | ☑    | ☑       |
|  66 | `PATCH /meal-plans/:id`                | Sửa plan            | ☑   | ☐      | ☑    | ☑       |
|  67 | `DELETE /meal-plans/:id`               | Archive/delete plan | ☑   | ☐      | ☑    | ☑       |
|  68 | `POST /meal-plans/:id/meals`           | Thêm meal           | ☑   | ☐      | ☑    | ☑       |
|  69 | `PATCH /meal-plans/:id/meals/:mealId`  | Sửa/completed meal  | ☑   | ☐      | ☑    | ☑       |
|  70 | `DELETE /meal-plans/:id/meals/:mealId` | Xóa meal            | ☑   | ☐      | ☑    | ☑       |
|  71 | `POST /meal-plans/:id/activate`        | Kích hoạt plan      | ☑   | ☐      | ☑    | ☑       |
|  72 | `POST /meal-plans/:id/clone`           | Clone plan          | ☑   | ☐      | ☑    | ☑       |
|  73 | `POST /meal-plans/:id/grocery-list`    | Sinh grocery list   | ☑   | ☐      | ☑    | ☑       |

### 5.9 Grocery List — 9 APIs

|   # | Method và path                            | Mục đích            | BE  | Mobile | Test | OpenAPI |
| --: | ----------------------------------------- | ------------------- | --- | ------ | ---- | ------- |
|  74 | `GET /grocery-lists`                      | List grocery list   | ☑   | ☐      | ☑    | ☑       |
|  75 | `GET /grocery-lists/:id`                  | Grocery detail      | ☑   | ☐      | ☑    | ☑       |
|  76 | `POST /grocery-lists`                     | Tạo grocery list    | ☑   | ☐      | ☑    | ☑       |
|  77 | `PATCH /grocery-lists/:id`                | Sửa name/status     | ☑   | ☐      | ☑    | ☑       |
|  78 | `DELETE /grocery-lists/:id`               | Archive/delete list | ☑   | ☐      | ☑    | ☑       |
|  79 | `POST /grocery-lists/:id/items`           | Thêm item           | ☑   | ☐      | ☑    | ☑       |
|  80 | `PATCH /grocery-lists/:id/items/:itemId`  | Sửa/check item      | ☑   | ☐      | ☑    | ☑       |
|  81 | `DELETE /grocery-lists/:id/items/:itemId` | Xóa item            | ☑   | ☐      | ☑    | ☑       |
|  82 | `POST /grocery-lists/:id/clear-checked`   | Clear checked       | ☑   | ☐      | ☑    | ☑       |

### 5.10 Diary, Weight và Water — 14 APIs

|   # | Method và path            | Mục đích              | BE  | Mobile | Test | OpenAPI |
| --: | ------------------------- | --------------------- | --- | ------ | ---- | ------- |
|  83 | `GET /diary`              | Diary theo ngày/range | ☑   | ☐      | ☑    | ☑       |
|  84 | `POST /diary`             | Tạo diary entry       | ☑   | ☐      | ☑    | ☑       |
|  85 | `PATCH /diary/:id`        | Sửa diary entry       | ☑   | ☐      | ☑    | ☑       |
|  86 | `DELETE /diary/:id`       | Xóa diary entry       | ☑   | ☐      | ☑    | ☑       |
|  87 | `GET /diary/summary`      | Nutrition summary     | ☑   | ☐      | ☑    | ☑       |
|  88 | `GET /weight-logs`        | Weight history        | ☑   | ☐      | ☑    | ☑       |
|  89 | `POST /weight-logs`       | Ghi cân nặng          | ☑   | ☐      | ☑    | ☑       |
|  90 | `PATCH /weight-logs/:id`  | Sửa weight log        | ☑   | ☐      | ☑    | ☑       |
|  91 | `DELETE /weight-logs/:id` | Xóa weight log        | ☑   | ☐      | ☑    | ☑       |
|  92 | `GET /weight-logs/trend`  | Weight trend          | ☑   | ☐      | ☑    | ☑       |
|  93 | `GET /water-logs`         | Water history/total   | ☑   | ☐      | ☑    | ☑       |
|  94 | `POST /water-logs`        | Ghi lượng nước        | ☑   | ☐      | ☑    | ☑       |
|  95 | `PATCH /water-logs/:id`   | Sửa water log         | ☑   | ☐      | ☑    | ☑       |
|  96 | `DELETE /water-logs/:id`  | Xóa water log         | ☑   | ☐      | ☑    | ☑       |

### 5.11 Media — 5 APIs

|   # | Method và path                | Mục đích              | BE  | Mobile | Test | OpenAPI |
| --: | ----------------------------- | --------------------- | --- | ------ | ---- | ------- |
|  97 | `POST /media/upload-requests` | Xin presigned PUT URL | ☑   | ☐      | ☑    | ☑       |
|  98 | `GET /media/mine`             | Media của mình        | ☑   | ☐      | ☑    | ☑       |
|  99 | `POST /media/:id/confirm`     | Confirm object R2     | ☑   | ☐      | ☑    | ☑       |
| 100 | `GET /media/:id`              | Media metadata        | ☑   | ☐      | ☑    | ☑       |
| 101 | `DELETE /media/:id`           | Xóa media             | ☑   | ☐      | ☑    | ☑       |

### 5.12 Post, Comment, Reaction và Saved Item — 18 APIs

|   # | Method và path                              | Mục đích                 | BE  | Mobile | Test | OpenAPI |
| --: | ------------------------------------------- | ------------------------ | --- | ------ | ---- | ------- |
| 102 | `GET /posts`                                | Feed public              | ☑   | ☐      | ☑    | ☑       |
| 103 | `GET /posts/mine`                           | Post/blog của mình       | ☑   | ☐      | ☑    | ☑       |
| 104 | `GET /posts/:id`                            | Post detail              | ☑   | ☐      | ☑    | ☑       |
| 105 | `POST /posts`                               | Tạo draft                | ☑   | ☐      | ☑    | ☑       |
| 106 | `PATCH /posts/:id`                          | Sửa post                 | ☑   | ☐      | ☑    | ☑       |
| 107 | `DELETE /posts/:id`                         | Soft-delete post         | ☑   | ☐      | ☑    | ☑       |
| 108 | `POST /posts/:id/submit`                    | Gửi chờ duyệt            | ☑   | ☐      | ☑    | ☑       |
| 109 | `POST /posts/:id/publish`                   | Admin publish            | ☑   | ☐      | ☑    | ☑       |
| 110 | `POST /posts/:id/reject`                    | Admin reject             | ☑   | ☐      | ☑    | ☑       |
| 111 | `GET /comments`                             | List comment theo target | ☑   | ☐      | ☑    | ☑       |
| 112 | `POST /comments`                            | Tạo comment/reply        | ☑   | ☐      | ☑    | ☑       |
| 113 | `PATCH /comments/:id`                       | Sửa comment              | ☑   | ☐      | ☑    | ☑       |
| 114 | `DELETE /comments/:id`                      | Soft-delete comment      | ☑   | ☐      | ☑    | ☑       |
| 115 | `PUT /reactions/:targetType/:targetId`      | Upsert reaction          | ☑   | ☐      | ☑    | ☑       |
| 116 | `DELETE /reactions/:targetType/:targetId`   | Bỏ reaction              | ☑   | ☐      | ☑    | ☑       |
| 117 | `GET /saved-items`                          | List saved item          | ☑   | ☐      | ☑    | ☑       |
| 118 | `PUT /saved-items/:targetType/:targetId`    | Lưu item                 | ☑   | ☐      | ☑    | ☑       |
| 119 | `DELETE /saved-items/:targetType/:targetId` | Bỏ lưu item              | ☑   | ☐      | ☑    | ☑       |

### 5.13 AI — 10 APIs

|   # | Method và path                                     | Mục đích                 | BE  | Mobile | Test | OpenAPI |
| --: | -------------------------------------------------- | ------------------------ | --- | ------ | ---- | ------- |
| 120 | `GET /ai/conversations`                            | List conversation        | ☑   | ☐      | ☑    | ☑       |
| 121 | `POST /ai/conversations`                           | Tạo conversation         | ☑   | ☐      | ☑    | ☑       |
| 122 | `GET /ai/conversations/:id/messages`               | Message history          | ☑   | ☐      | ☑    | ☑       |
| 123 | `POST /ai/conversations/:id/messages`              | Gửi câu hỏi AI           | ☑   | ☐      | ☑    | ☑       |
| 124 | `POST /ai/meal-plan-proposals`                     | Sinh meal-plan proposal  | ☑   | ☐      | ☑    | ☑       |
| 125 | `POST /ai/meal-plan-proposals/:proposalId/confirm` | Confirm meal plan        | ☑   | ☐      | ☑    | ☑       |
| 126 | `POST /ai/ingredient-recognition`                  | Nhận diện nguyên liệu    | ☑   | ☐      | ☑    | ☑       |
| 127 | `POST /ai/pantry-proposals/:proposalId/confirm`    | Confirm pantry proposal  | ☑   | ☐      | ☑    | ☑       |
| 128 | `POST /ai/video-summaries`                         | Tóm tắt/transcript video | ☑   | ☐      | ☑    | ☑       |
| 129 | `PUT /ai/runs/:runId/feedback`                     | AI feedback              | ☑   | ☐      | ☑    | ☑       |

### 5.14 Notification và Reminder — 11 APIs

|   # | Method và path                    | Mục đích            | BE  | Mobile | Test | OpenAPI |
| --: | --------------------------------- | ------------------- | --- | ------ | ---- | ------- |
| 130 | `GET /notifications`              | Notification inbox  | ☑   | ☐      | ☑    | ☑       |
| 131 | `GET /notifications/unread-count` | Unread count        | ☑   | ☐      | ☑    | ☑       |
| 132 | `PATCH /notifications/:id/read`   | Đánh dấu đã đọc     | ☑   | ☐      | ☑    | ☑       |
| 133 | `POST /notifications/read-all`    | Đọc tất cả          | ☑   | ☐      | ☑    | ☑       |
| 134 | `DELETE /notifications/:id`       | Xóa/ẩn notification | ☑   | ☐      | ☑    | ☑       |
| 135 | `GET /notification-preferences`   | Xem preferences     | ☑   | ☐      | ☑    | ☑       |
| 136 | `PUT /notification-preferences`   | Upsert preferences  | ☑   | ☐      | ☑    | ☑       |
| 137 | `GET /reminders`                  | List reminder       | ☑   | ☐      | ☑    | ☑       |
| 138 | `POST /reminders`                 | Tạo reminder        | ☑   | ☐      | ☑    | ☑       |
| 139 | `PATCH /reminders/:id`            | Sửa/pause/resume    | ☑   | ☐      | ☑    | ☑       |
| 140 | `DELETE /reminders/:id`           | Cancel reminder     | ☑   | ☐      | ☑    | ☑       |

### 5.15 Report, Moderation và Audit — 14 APIs

|   # | Method và path                                         | Mục đích                     | BE  | Mobile/Admin | Test | OpenAPI |
| --: | ------------------------------------------------------ | ---------------------------- | --- | ------------ | ---- | ------- |
| 141 | `POST /reports`                                        | Tạo report                   | ☑   | ☐            | ☑    | ☑       |
| 142 | `GET /reports/mine`                                    | Reports của mình             | ☑   | ☐            | ☑    | ☑       |
| 143 | `GET /reports/mine/:id`                                | Report detail của mình       | ☑   | ☐            | ☑    | ☑       |
| 144 | `GET /admin/reports`                                   | Admin report queue           | ☑   | ☐            | ☑    | ☑       |
| 145 | `PATCH /admin/reports/:id`                             | Assign/status/resolve report | ☑   | ☐            | ☑    | ☑       |
| 146 | `GET /admin/moderation-cases`                          | List moderation case         | ☑   | ☐            | ☑    | ☑       |
| 147 | `POST /admin/moderation-cases`                         | Tạo/gộp case                 | ☑   | ☐            | ☑    | ☑       |
| 148 | `PATCH /admin/moderation-cases/:id`                    | Cập nhật case                | ☑   | ☐            | ☑    | ☑       |
| 149 | `POST /admin/moderation/:targetType/:targetId/hide`    | Hide target                  | ☑   | ☐            | ☑    | ☑       |
| 150 | `POST /admin/moderation/:targetType/:targetId/restore` | Restore target               | ☑   | ☐            | ☑    | ☑       |
| 151 | `POST /admin/users/:id/suspend`                        | Suspend user                 | ☑   | ☐            | ☑    | ☑       |
| 152 | `POST /admin/users/:id/activate`                       | Activate user                | ☑   | ☐            | ☑    | ☑       |
| 153 | `GET /admin/users`                                     | List/search user             | ☑   | ☐            | ☑    | ☑       |
| 154 | `GET /admin/audit-logs`                                | Audit log read-only          | ☑   | ☐            | ☑    | ☑       |

### 5.16 Video — 13 APIs

|   # | Method và path                      | Mục đích            | BE  | Mobile/Admin | Test | OpenAPI |
| --: | ----------------------------------- | ------------------- | --- | ------------ | ---- | ------- |
| 155 | `GET /videos`                       | List video public   | ☑   | ☐            | ☑    | ☑       |
| 156 | `GET /videos/mine`                  | Video của mình      | ☑   | ☐            | ☑    | ☑       |
| 157 | `GET /videos/:idOrSlug`             | Video detail        | ☑   | ☐            | ☑    | ☑       |
| 158 | `POST /videos`                      | Tạo video draft     | ☑   | ☐            | ☑    | ☑       |
| 159 | `PATCH /videos/:id`                 | Sửa video           | ☑   | ☐            | ☑    | ☑       |
| 160 | `DELETE /videos/:id`                | Soft-delete video   | ☑   | ☐            | ☑    | ☑       |
| 161 | `POST /videos/:id/submit`           | Gửi video chờ duyệt | ☑   | ☐            | ☑    | ☑       |
| 162 | `POST /videos/:id/publish`          | Admin publish video | ☑   | ☐            | ☑    | ☑       |
| 163 | `POST /videos/:id/reject`           | Admin reject video  | ☑   | ☐            | ☑    | ☑       |
| 164 | `GET /videos/:id/related`           | Related content     | ☑   | ☐            | ☑    | ☑       |
| 165 | `PUT /videos/:id/progress`          | Watch progress      | ☑   | ☐            | ☑    | ☑       |
| 166 | `GET /videos/:id/transcript`        | Transcript/chapters | ☑   | ☐            | ☑    | ☑       |
| 167 | `POST /videos/:id/generate-summary` | Generate AI summary | ☑   | ☐            | ☑    | ☑       |

### 5.17 Rating và View History — 7 APIs

|   # | Method và path                               | Mục đích             | BE  | Mobile | Test | OpenAPI |
| --: | -------------------------------------------- | -------------------- | --- | ------ | ---- | ------- |
| 168 | `PUT /ratings/:targetType/:targetId`         | Upsert rating        | ☑   | ☐      | ☑    | ☑       |
| 169 | `DELETE /ratings/:targetType/:targetId`      | Xóa rating           | ☑   | ☐      | ☑    | ☑       |
| 170 | `GET /ratings/:targetType/:targetId/summary` | Rating summary       | ☑   | ☐      | ☑    | ☑       |
| 171 | `GET /view-history`                          | List view history    | ☑   | ☐      | ☑    | ☑       |
| 172 | `DELETE /view-history`                       | Xóa toàn bộ history  | ☑   | ☐      | ☑    | ☑       |
| 173 | `DELETE /view-history/:targetType/:targetId` | Xóa một history item | ☑   | ☐      | ☑    | ☑       |
| 174 | `PUT /view-history/:targetType/:targetId`    | Ghi nhận view        | ☑   | ☐      | ☑    | ☑       |

### 5.18 Admin Dashboard và AI Monitoring — 10 APIs

|   # | Method và path                        | Mục đích                 | BE  | Admin UI | Test | OpenAPI |
| --: | ------------------------------------- | ------------------------ | --- | -------- | ---- | ------- |
| 175 | `GET /admin/dashboard/summary`        | Dashboard summary        | ☑   | ☐        | ☑    | ☑       |
| 176 | `GET /admin/dashboard/content-trends` | Content trends           | ☑   | ☐        | ☑    | ☑       |
| 177 | `GET /admin/dashboard/user-trends`    | User trends              | ☑   | ☐        | ☑    | ☑       |
| 178 | `GET /admin/content/pending`          | Pending-content queue    | ☑   | ☐        | ☑    | ☑       |
| 179 | `GET /admin/users/:id`                | Admin user detail        | ☑   | ☐        | ☑    | ☑       |
| 180 | `PATCH /admin/users/:id/role`         | Đổi role có guard        | ☑   | ☐        | ☑    | ☑       |
| 181 | `GET /admin/ai/runs`                  | List AI runs             | ☑   | ☐        | ☑    | ☑       |
| 182 | `GET /admin/ai/runs/:id`              | AI run detail            | ☑   | ☐        | ☑    | ☑       |
| 183 | `GET /admin/ai/metrics`               | AI metrics               | ☑   | ☐        | ☑    | ☑       |
| 184 | `GET /admin/ai/feedback`              | AI feedback list/summary | ☑   | ☐        | ☑    | ☑       |

---

## 6. Checklist API contract và business rules

- [x] `src/routes/api-manifest.js` chứa đủ 184 operations.
- [x] Express đã mount đủ 184 operations.
- [x] OpenAPI có đủ 184 operations.
- [x] Mỗi OpenAPI operation có `operationId` duy nhất.
- [x] `docs/api-matrix.md` map mọi màn hình/use case tới API hoặc `CLIENT_ONLY` hợp lệ.
- [x] Contract test phát hiện route thiếu hoặc OpenAPI thừa/thiếu.
- [x] Route cụ thể như `/recipes/mine` được mount trước route động `/:idOrSlug`.
- [x] Tất cả params/query/body được validate bằng Zod.
- [x] PATCH chỉ nhận field được phép và cần ít nhất một field.
- [x] Client không thể gửi `userId`, `role`, counters hoặc system status để chiếm quyền.
- [x] Pagination mặc định/hard limit áp dụng cho mọi collection tăng trưởng.
- [x] Sort/filter field có whitelist.
- [x] Search input được trim, giới hạn và escape.
- [x] Ownership được kiểm tra trong service, không chỉ middleware/controller.
- [x] Polymorphic target được kiểm tra tồn tại và đúng loại.
- [x] Reaction/saved/rating unique theo user và target.
- [x] Confirm/activate/save/reaction có tính idempotent.
- [x] Historical snapshot không bị thay đổi khi master data đổi.
- [x] Counters có transaction/atomic update hoặc reconcile strategy.
- [x] Các thao tác nhiều document quan trọng dùng transaction khi cần.

---

## 7. Checklist bảo mật và quyền riêng tư

- [x] Firebase token được verify bằng Firebase Admin.
- [x] Không lưu password hoặc token nhạy cảm trong MongoDB/log.
- [x] CORS dùng allowlist, không dùng wildcard với authorization.
- [x] Helmet được bật.
- [x] JSON body có giới hạn.
- [x] Global/auth/upload/AI rate limit hoạt động.
- [x] NoSQL injection bị chặn bằng Zod và field whitelist.
- [x] Không truyền trực tiếp object raw vào Mongo filter/update.
- [x] Error production không trả stack hoặc raw provider error.
- [x] Pino redact Authorization, key, FCM token và dữ liệu sức khỏe nhạy cảm.
- [x] R2 key không đoán được; presigned URL hết hạn ngắn.
- [x] Chỉ MIME/size được cho phép mới upload.
- [x] Admin API luôn yêu cầu admin role.
- [x] Suspended/deleted user bị chặn.
- [x] Private health/history/AI data chỉ owner truy cập.
- [x] Audit log immutable và đã redact.
- [x] Secret chỉ nằm trong `.env`, `.env` đã gitignore.

---

## 8. Checklist test và QA

### 8.1 Backend automated tests

- [x] Unit test env parsing và conditional credentials.
- [x] Unit test auth/authorize/ownership.
- [x] Unit test validation/error mapping.
- [x] Unit test nutrition calculation và snapshot.
- [x] Unit test pantry matching.
- [x] Unit test meal plan invariant.
- [x] Unit test grocery unit merge.
- [x] Unit test reaction/saved/rating uniqueness.
- [x] Unit test R2 MIME/size/key.
- [x] Unit test AI structured output và disabled state.
- [x] Unit test reminder timezone/claim/idempotency.
- [x] Unit test video progress/view deduplication.
- [x] Integration test happy path cho mọi module.
- [x] Integration test 401/403/404/409/422-or-400/429/500 representative.
- [x] Integration test User A không truy cập dữ liệu User B.
- [x] Integration test user không gọi được admin API.
- [x] Contract test đủ 184 APIs.
- [x] Test không gọi Firebase/R2/FCM/AI thật.

### 8.2 Mobile/manual QA

- [ ] Happy path của toàn bộ feature chương 3.
- [ ] Invalid form và server validation.
- [ ] Slow network, mất mạng và timeout.
- [ ] Token hết hạn giữa phiên.
- [ ] User bị suspend khi đang đăng nhập.
- [ ] Double tap/double submit.
- [ ] Upload ảnh/video thất bại giữa chừng.
- [ ] AI disabled/provider timeout/invalid output.
- [ ] Notification permission denied.
- [ ] Timezone và reminder qua ngày mới.
- [ ] Large list/pagination.
- [ ] Empty state cho user mới.
- [ ] Logout/login bằng user khác không rò cache.
- [ ] Thiết bị Android màn hình nhỏ và lớn.

---

## 9. Checklist vận hành và triển khai

- [x] `.env.example` chứa đủ biến nhưng không có secret thật.
- [ ] Production env không còn `CHANGE_ME` cho integration được bật.
- [ ] MongoDB connection/pool/timeout cấu hình đúng.
- [ ] Production indexes đã được tạo.
- [ ] Firebase Admin credentials hoạt động.
- [ ] Cloudflare R2 bucket/CORS/public domain hoạt động.
- [ ] FCM gửi được tới thiết bị test.
- [ ] AI provider/model/timeout/rate limit cấu hình đúng.
- [ ] Health và readiness endpoint được monitoring.
- [x] Graceful shutdown đóng HTTP, scheduler và MongoDB.
- [ ] Scheduler chỉ chạy theo mô hình single-instance đã chốt.
- [x] Swagger production bật/tắt đúng chính sách.
- [x] Seed script idempotent và không xóa dữ liệu có sẵn.
- [x] Log production là JSON và có request ID.
- [x] Backup/restore MongoDB đã được kiểm thử ở mức môi trường dự án.
- [ ] Không có secret trong Git history hoặc mobile bundle.

---

## 10. Release gate cuối cùng

Chỉ đánh dấu release khi toàn bộ điều kiện sau đạt:

- [ ] Tất cả feature bắt buộc đã hoàn thành hoặc có `N/A` được phê duyệt.
- [x] Đủ **184/184 API operations** trong manifest, Express, OpenAPI và contract test.
- [x] Không còn route rỗng, TODO hoặc mock trong production flow.
- [ ] Firebase Auth, MongoDB Atlas, Cloudflare R2 và FCM đã test end-to-end.
- [x] AI flow có fallback an toàn khi disabled hoặc provider lỗi.
- [x] Không lưu mật khẩu trong database.
- [x] Không có lỗi phân quyền owner/admin đã biết.
- [x] Không có draft/hidden/deleted content lọt vào public API.
- [x] Test suite và format check chạy thành công.
- [ ] Các luồng quan trọng đã test trên thiết bị Android thật.
- [x] README, OpenAPI và API matrix đã cập nhật đúng code hiện tại.
- [ ] Người phụ trách Backend, Mobile và QA cùng ký xác nhận.

### Xác nhận

| Vai trò       | Họ tên | Ngày kiểm tra | Kết quả              | Ghi chú |
| ------------- | ------ | ------------- | -------------------- | ------- |
| Backend       |        |               | ☐ Pass / ☐ Fail      |         |
| Mobile        |        |               | ☐ Pass / ☐ Fail      |         |
| Admin         |        |               | ☐ Pass / ☐ Fail      |         |
| QA/Tester     |        |               | ☐ Pass / ☐ Fail      |         |
| Project owner |        |               | ☐ Approve / ☐ Reject |         |
