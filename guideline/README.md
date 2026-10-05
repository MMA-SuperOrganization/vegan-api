# Guideline dành cho Frontend

- [Danh mục đầy đủ 841 test case backend](BACKEND_TEST_CASES.md): tra cứu theo module, endpoint và ID; gồm điều kiện, dữ liệu, bước thực hiện, kết quả mong đợi và kết quả chạy Playwright được ghi nhận.
- [Đăng ký và đăng nhập bằng Firebase](AUTH_REGISTER_LOGIN.md): luồng xác thực và đồng bộ tài khoản với backend.
- [Cách chạy Playwright và giới hạn kiểm thử](../docs/playwright-testing.md): môi trường offline, staging và database.

Đọc trạng thái từng case trước khi dùng làm bằng chứng tích hợp. Case đã có test có thể chưa chạy do thiếu môi trường hoặc đang khác contract; kiểm thử màn hình FE vẫn cần thực hiện riêng.
