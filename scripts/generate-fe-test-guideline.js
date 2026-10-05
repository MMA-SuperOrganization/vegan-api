import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalog = JSON.parse(fs.readFileSync(path.join(root, "tests/playwright/cases.json"), "utf8"));
const reportPath = process.argv[2];
const report = reportPath ? JSON.parse(fs.readFileSync(path.resolve(reportPath), "utf8")) : null;
const results = new Map();
function visit(suite) {
  for (const spec of suite.specs || []) {
    const id = spec.title.match(/\b(?:API|BIZ|NFR)-\d{4}\b/)?.[0];
    if (!id) continue;
    const test = spec.tests[0];
    const result = test?.results.at(-1);
    const status =
      result?.status === "passed"
        ? "Đạt"
        : result?.status === "skipped"
          ? "Chưa chạy (Blocked)"
          : "Không đạt";
    const reason = [...(test?.annotations || []), ...(result?.annotations || [])]
      .filter((a) => a.type === "skip" || a.type === "Blocked")
      .map((a) => a.description)
      .filter(Boolean);
    if (results.has(id)) throw new Error(`Duplicate report ID: ${id}`);
    results.set(id, { status, reason: [...new Set(reason)].join("; ") });
  }
  for (const child of suite.suites || []) visit(child);
}
for (const suite of report?.suites || []) visit(suite);
if (
  report &&
  (results.size !== catalog.cases.length || catalog.cases.some((c) => !results.has(c.id)))
) {
  throw new Error("Report must contain every catalog case exactly once.");
}
const groups = [
  {
    sheet: "API Cases",
    file: "API_CASES.md",
    title: "API — endpoint và các nhánh xử lý",
    spec: "api-cases.spec.js",
  },
  {
    sheet: "Backend E2E",
    file: "BUSINESS_CASES.md",
    title: "Business — luồng nghiệp vụ backend",
    spec: "business-cases.spec.js",
  },
  {
    sheet: "Security NFR",
    file: "SECURITY_NFR_CASES.md",
    title: "Security / NFR — bảo mật, chất lượng và vận hành",
    spec: "nfr-cases.spec.js",
  },
];
const cell = (value) =>
  String(value || "—")
    .replace(/\|/g, "\\|")
    .replace(/\r?\n/g, "<br>");
const block = (value) => {
  const text = String(value || "Không nêu trong Excel.");
  const fence = "`".repeat(Math.max(3, ...[...text.matchAll(/`+/g)].map((m) => m[0].length + 1)));
  return `${fence}text\n${text}\n${fence}`;
};
const status = (c) => results.get(c.id)?.status || "Chưa có kết quả";
const date = report
  ? new Intl.DateTimeFormat("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      dateStyle: "short",
      timeStyle: "medium",
    }).format(new Date(report.stats.startTime)) + " (Asia/Ho_Chi_Minh)"
  : "Chưa cung cấp báo cáo chạy";
const output = path.join(root, "guideline/test-cases");
fs.mkdirSync(output, { recursive: true });
let main = `# Danh mục test case backend dành cho FE\n\nCó **${catalog.cases.length} test case** từ \`${catalog.source}\`: 764 API, 53 nghiệp vụ và 24 Security/NFR. Mỗi case bên dưới giữ nguyên ID, module, chức năng, loại test, ưu tiên, actor, điều kiện, dữ liệu, bước thực hiện và kết quả mong đợi của Excel; kèm trạng thái Playwright để FE phân biệt case đã có với case đã chạy đạt.\n\nNguồn đối chiếu: [catalog JSON](../tests/playwright/cases.json), SHA-256 workbook: \`${catalog.sha256}\`.\n\n## Cách dùng khi làm FE\n\n1. Tìm module/endpoint trong bảng bên dưới rồi mở danh sách ID tương ứng.\n2. Đọc điều kiện và dữ liệu test trước khi gọi API; thay ID mẫu bằng ID fixture thật, dùng đúng vai trò và chủ sở hữu.\n3. Dùng kết quả mong đợi để xác định nhánh UI cần xử lý: thành công, lỗi validation, thiếu/hết hạn token, thiếu quyền, dữ liệu rỗng, phân trang và xung đột. Các bước trong catalog là kiểm thử backend; FE vẫn cần kiểm thử màn hình, điều hướng và trạng thái tải riêng.\n4. Khi báo lỗi, ghi ID case, request/response và requestId nếu có; đối chiếu OpenAPI và [hướng dẫn chạy Playwright](../docs/playwright-testing.md) khi cần chi tiết contract hiện tại.\n\nP0/P1/P2 và actor giữ nguyên ký hiệu Excel. User A/User B là các tài khoản fixture khác nhau; chú ý case cross-user trước khi hiển thị hoặc sửa dữ liệu của người khác.\n\n## Kết quả chạy được ghi nhận\n\nThời điểm bắt đầu: **${date}**. Đây là ảnh chụp kết quả tại thời điểm chạy, không tự cập nhật khi backend thay đổi.\n\n`;
if (report) {
  main += `| Trạng thái | Số case | Ý nghĩa |\n| --- | ---: | --- |\n| Đạt | ${[...results.values()].filter((r) => r.status === "Đạt").length} | Assertion Playwright đạt trong môi trường chạy đã cấu hình. |\n| Không đạt | ${[...results.values()].filter((r) => r.status === "Không đạt").length} | Cần đối chiếu yêu cầu Excel với contract backend. |\n| Chưa chạy (Blocked) | ${[...results.values()].filter((r) => r.status === "Chưa chạy (Blocked)").length} | Có test nhưng thiếu môi trường/biến cấu hình để thực thi. |\n\n`;
} else main += "Chưa cung cấp report; các case được đánh dấu **Chưa có kết quả**.\n\n";
main +=
  "Các test offline dùng HTTP server thật với repository/provider giả lập. Trạng thái Đạt không xác nhận Firebase, MongoDB, R2, AI, FCM thật hoặc UI FE đã đạt acceptance. Phạm vi mô phỏng và các yêu cầu staging/replica set được ghi trong [tài liệu kiểm thử](../docs/playwright-testing.md).\n\n";
main +=
  "### Hai case cần chốt contract với BE\n\n- [API-0014](test-cases/API_CASES.md#api-0014): Excel mong 403/404 khi B xóa FCM token của A. Backend trả 200 theo cơ chế xóa idempotent trong tập token của B; token của A không bị xóa. FE cần thống nhất cách hiểu response thành công.\n- [API-0682](test-cases/API_CASES.md#api-0682): Excel mong 403/404 khi B cập nhật progress cho video của A. Backend cho phép xem video công khai và lưu progress/history của B. FE cần thống nhất quyền xem và việc lưu tiến độ riêng của từng người.\n\nHai khác biệt này được ghi nhận trong lần chạy trên; không sửa kỳ vọng Excel để biến test thành đạt.\n\n## Tra cứu theo module\n\n";
for (const group of groups) {
  const cases = catalog.cases.filter((c) => c.sheet === group.sheet);
  const modules = [...new Set(cases.map((c) => c.module))];
  main += `### ${group.title}\n\n[Chi tiết toàn bộ ${cases.length} case](test-cases/${group.file}) · [Mã Playwright](../tests/playwright/${group.spec})\n\n| Module | Số case | Danh sách ID |\n| --- | ---: | --- |\n`;
  let detail = `# ${group.title}\n\n[Quay lại danh mục FE](../BACKEND_TEST_CASES.md) · [Mã Playwright](../../tests/playwright/${group.spec})\n\nTổng cộng **${cases.length} case**. Dữ liệu yêu cầu dưới đây giữ nguyên từ sheet \`${group.sheet}\`; kết quả chạy: **${date}**. Xem phạm vi mô phỏng và khác biệt contract trong danh mục FE trước khi dùng trạng thái để đánh giá tích hợp.\n\n## Mục lục\n\n`;
  for (const [i, module] of modules.entries()) {
    const items = cases.filter((c) => c.module === module);
    main += `| ${cell(module)} | ${items.length} | [${items[0].id} → ${items.at(-1).id}](test-cases/${group.file}#module-${i + 1}) |\n`;
    detail += `- [${module} (${items.length} case)](#module-${i + 1})\n`;
  }
  for (const [i, module] of modules.entries()) {
    const items = cases.filter((c) => c.module === module);
    detail += `\n<a id="module-${i + 1}"></a>\n\n## ${module}\n\n| ID | Chức năng / endpoint | Loại test | Ưu tiên | Actor | Kết quả chạy |\n| --- | --- | --- | --- | --- | --- |\n`;
    for (const c of items)
      detail += `| [${c.id}](#${c.id.toLowerCase()}) | ${cell(c.feature)} | ${cell(c.type)} | ${cell(c.priority)} | ${cell(c.actor)} | ${status(c)} |\n`;
    for (const c of items) {
      detail += `\n<a id="${c.id.toLowerCase()}"></a>\n\n### ${c.id}\n\n**Chức năng:** ${cell(c.feature)}\n\n**Module:** ${cell(c.module)} · **Loại:** ${cell(c.type)} · **Ưu tiên:** ${cell(c.priority)} · **Actor:** ${cell(c.actor)}\n\n**Nguồn Excel:** ${c.sheet}, hàng ${c.row} · **Kết quả chạy:** ${status(c)}\n\n`;
      if (results.get(c.id)?.reason)
        detail += `**Lý do chưa chạy:**\n\n${block(results.get(c.id).reason)}\n\n`;
      for (const [key, label] of [
        ["preconditions", "Điều kiện trước khi test"],
        ["data", "Dữ liệu test"],
        ["steps", "Các bước thực hiện"],
        ["expected", "Kết quả mong đợi (Excel)"],
      ])
        detail += `**${label}:**\n\n${block(c[key])}\n\n`;
    }
  }
  fs.writeFileSync(path.join(output, group.file), detail);
  main += "\n";
}
main +=
  "## Cập nhật danh mục\n\nCác trang chi tiết được sinh từ catalog để không bỏ sót hoặc viết lại sai yêu cầu Excel. Sau khi import lại workbook hoặc chạy lại suite, dùng Node 24 tại thư mục repository:\n\n```powershell\nnode scripts/generate-fe-test-guideline.js test-results/playwright.json\n```\n\nNếu chỉ muốn sinh danh mục chưa có kết quả chạy, bỏ đối số report. Đối số report phải là JSON của lần chạy đủ toàn bộ case; script từ chối report thiếu ID. Không chỉnh tay các trang được sinh: cập nhật workbook/catalog và sinh lại.\n";
fs.writeFileSync(path.join(root, "guideline/BACKEND_TEST_CASES.md"), main);
console.log(
  `Generated FE guideline: ${catalog.cases.length} cases, ${results.size} recorded results.`,
);
