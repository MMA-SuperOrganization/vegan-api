// Documentation annotations only. Runtime validation remains owned by Zod/services.
export const moduleNotes = {
  health:
    "Kiểm tra tiến trình và khả năng phục vụ. Liveness không chứng minh database đã sẵn sàng; readiness kiểm tra các dependency bắt buộc.",
  "app-config":
    "Cấu hình công khai gồm phiên bản ứng dụng, feature flags và enum. Bootstrap tổng hợp cấu hình và dữ liệu khởi động; dữ liệu cá nhân phụ thuộc token.",
  home: "Tổng hợp các mục trên trang chủ. Guest nhận nội dung công khai; người đăng nhập có thể nhận dữ liệu cá nhân hóa.",
  onboarding:
    "Đọc và cập nhật lựa chọn ban đầu về chế độ ăn, dị ứng, mục tiêu và thông tin cơ thể; hoàn tất yêu cầu các trường bắt buộc đã có.",
  auth: "Backend xác minh Firebase ID token. Đăng nhập và cấp token thực hiện ở Firebase; API sync đồng bộ tài khoản backend trước khi dùng API cá nhân.",
  users:
    "Quản lý tài khoản và hồ sơ. Hồ sơ công khai được giới hạn trường; API /me lấy chủ thể từ token, không nhận userId để đổi chủ sở hữu.",
  "nutrition-profiles":
    "Lưu mục tiêu dinh dưỡng và dị ứng của người dùng. Kết quả tính toán phụ thuộc dữ liệu hồ sơ và có cảnh báo khi thiếu dữ liệu.",
  categories:
    "Danh mục master data: public đọc, admin quản lý. Các thao tác ghi áp dụng kiểm tra tham chiếu và audit ở service.",
  allergens:
    "Danh mục chất gây dị ứng: public đọc, admin quản lý. ID được tham chiếu bởi thực phẩm và hồ sơ dinh dưỡng.",
  "food-items":
    "Thực phẩm chuẩn và dinh dưỡng trên 100 g. isVegan=true phải tương thích isVegetarian và không được chứa trứng/sữa; PATCH kiểm tra cả trạng thái sau khi ghép dữ liệu cũ.",
  recipes:
    "Công thức gồm nguyên liệu, bước thực hiện và dinh dưỡng tính từ thực phẩm chuẩn. Luồng nội dung sử dụng draft, pending_review, published và các trạng thái kiểm duyệt.",
  search:
    "Tìm kiếm nội dung có quyền truy cập; lịch sử tìm kiếm thuộc từng người dùng. Guest không có lịch sử cá nhân.",
  recommendations:
    "Gợi ý theo hồ sơ, chế độ ăn và dị ứng. Dị ứng từ hồ sơ được kết hợp với bộ lọc request; kiểm tra thực phẩm hiện tại để tránh dùng snapshot cũ không an toàn.",
  pantries:
    "Kho thực phẩm của chính người dùng; quantity đi cùng unit. Gợi ý công thức dựa trên nguyên liệu trong kho và ràng buộc chế độ ăn/dị ứng.",
  "meal-plans":
    "Kế hoạch ăn gồm các ngày và bữa ăn tham chiếu công thức. Ngày phải duy nhất trong tuần bắt đầu tại weekStartDate; mỗi bữa có ID riêng.",
  "grocery-lists":
    "Danh sách mua sắm riêng của người dùng. Các mục có số lượng, đơn vị và trạng thái checked; có thể tạo từ kế hoạch ăn.",
  diary:
    "Nhật ký dinh dưỡng lưu snapshot tại thời điểm ghi nhận, hỗ trợ recipe, food và custom. Bộ lọc dùng date hoặc from/to; không dùng đồng thời. Range phải có thứ tự và chênh lệch tối đa 366 ngày.",
  "weight-logs":
    "Nhật ký cân nặng theo người dùng, đơn vị kg; các API trend tổng hợp những bản ghi có quyền sở hữu trong phạm vi ngày.",
  "water-logs":
    "Nhật ký uống nước theo người dùng, đơn vị ml; ngày và timestamp có mục đích riêng, không đổi ml thành l trong payload.",
  media:
    "Upload hai bước: xin URL PUT có hạn, gửi binary trực tiếp đến storage với requiredHeaders, sau đó gọi confirm. Backend kiểm tra object/MIME/kích thước; chỉ media ready hợp lệ được liên kết nội dung.",
  posts:
    "Bài đăng cộng đồng theo luồng soạn thảo, gửi duyệt và xuất bản. Nội dung công khai phụ thuộc visibility, trạng thái và moderation.",
  comments:
    "Bình luận trên targetType/targetId có thể truy cập; parentCommentId chỉ dùng cho trả lời hợp lệ trên cùng target. Quyền sửa/xóa được kiểm tra ở service.",
  reactions:
    "Reaction theo người dùng và target. PUT tạo hoặc cập nhật reaction hiện tại; DELETE bỏ reaction của chính người gọi.",
  "saved-items":
    "Lưu/bỏ lưu nội dung của chính người dùng. Target phải hợp lệ và có thể truy cập; danh sách không tiết lộ nội dung đã bị ẩn hoặc không còn khả dụng.",
  ai: "Kết quả AI phải qua kiểm tra cấu trúc và tham chiếu. Tạo proposal chưa ghi kế hoạch/kho thực phẩm; chỉ confirm mới ghi. Proposal có hạn 1 giờ, xác nhận lại proposal đã consumed trả kết quả trước đó. Các thao tác gọi provider có thể trả 503 khi AI tắt/chưa cấu hình.",
  notifications:
    "Inbox và tùy chọn push của chính người dùng. Đánh dấu đã đọc/bỏ thông báo không gửi push mới; quietHours được diễn giải theo IANA timezone.",
  reminders:
    "Lịch nhắc once/daily/weekly theo múi giờ IANA. once dùng ISO datetime; daily/weekly dùng HH:mm. daysOfWeek là 0=Chủ nhật đến 6=Thứ bảy, không trùng.",
  reports:
    "Người dùng tạo và đọc báo cáo của mình; admin xem và xử lý báo cáo. Nội dung xử lý được ghi nhận cùng trạng thái và audit.",
  moderation:
    "Admin quản lý case kiểm duyệt và ẩn/khôi phục nội dung. Hành động kiểm tra loại target, trạng thái và ghi audit; khôi phục phụ thuộc tính hợp lệ của nội dung.",
  "audit-logs":
    "Tra cứu audit dành cho admin. Phân trang và bộ lọc giới hạn kết quả; thông tin nhạy cảm không được trả như payload gốc.",
  videos:
    "Video tham chiếu media đã upload/confirm, có transcript, chapters và tiến độ xem. VIDEOS_ENABLED có thể vô hiệu hóa tính năng. Chapter endSeconds phải lớn hơn startSeconds và phù hợp thời lượng video.",
  ratings:
    "Đánh giá theo người dùng và target được hỗ trợ. PUT thay đánh giá hiện tại; summary tổng hợp điểm và có thể kèm đánh giá của người gọi khi đăng nhập.",
  "view-history":
    "Lịch sử xem của chính người dùng; ghi nhận lượt xem áp dụng cơ chế chống đếm lặp. Xóa lịch sử không tương đương xóa nội dung gốc.",
  "admin-dashboard":
    "Dashboard admin tổng hợp dữ liệu trong phạm vi ngày/timestamp. Bucket hiện dùng UTC cố định, không nhận timezone query. Response definitions giải thích cách tính chỉ số. Range mặc định là 30 ngày đến hiện tại; from/to hỗ trợ YYYY-MM-DD hoặc ISO datetime có offset, khoảng chênh lệch tối đa 366 ngày.",
  "ai-monitoring":
    "Giám sát AI dành cho admin: runs, metrics và feedback. DTO được lọc để không công khai prompt, nội dung cá nhân hoặc thông tin provider nhạy cảm.",
};

const authNotes = {
  public: "Không yêu cầu token. Chỉ dữ liệu được phép công khai được trả về.",
  optional:
    "Có thể gọi không token. Nếu gửi Authorization: Bearer <Firebase ID token> thì token phải hợp lệ; token lỗi không được tự động coi là guest.",
  firebase:
    "Bắt buộc Authorization: Bearer <Firebase ID token> hợp lệ. Dùng token của Firebase client SDK, không dùng custom token hoặc refresh token.",
  user: "Bắt buộc Firebase ID token và tài khoản backend đang active; đồng bộ qua POST /auth/sync trước khi dùng API cá nhân.",
  owner:
    "Bắt buộc Firebase ID token, tài khoản active và quyền sở hữu resource. Backend lấy danh tính từ token; ID của người khác không cấp quyền truy cập.",
  admin:
    "Bắt buộc Firebase ID token của tài khoản backend active có role=admin; tài khoản user bị từ chối.",
};

export const operationNotes = {
  bootstrapApp:
    "Một request lấy config, master data và thông tin khởi động; authenticated cho biết nhánh guest/user, không dùng response guest để suy ra user đã đăng nhập.",
  getHomeFeed:
    "Các section trang chủ được tổng hợp trong một response; scope và kích thước section theo cấu hình, không tương đương toàn bộ dữ liệu của API list.",
  getOnboardingStatus:
    "Đọc missingFields, trạng thái các bước và readyToComplete để quyết định bước cần cập nhật trước khi complete.",
  updateOnboarding:
    "Gửi ít nhất một trường onboarding. ID dị ứng phải từ master data; dietType/goal/activityLevel theo enum, timezone IANA, chiều cao cm và cân nặng kg.",
  getMe:
    "Trả danh tính/tài khoản backend của token hiện tại; các quyền dựa trên role/status của backend.",
  getMyProfileSummary:
    "Trả thông tin tổng quan của tài khoản hiện tại, không phải tất cả dữ liệu của hồ sơ dinh dưỡng.",
  getPublicUserProfile:
    "userId là ObjectId backend, không phải firebaseUid. Chỉ trả DTO công khai, không chứa FCM token hoặc dữ liệu hồ sơ riêng.",
  getMyContent:
    "Lọc nội dung của tác giả hiện tại theo type và status, có phân trang; có thể dùng để quản lý bản nháp không xuất hiện trong public list.",
  getMyActivity:
    "Tổng hợp hoạt động của người gọi; các bộ đếm trong DTO không phải quyền truy cập tài khoản khác.",
  getMyFullProfile:
    "Trả hồ sơ cá nhân đầy đủ theo DTO; dùng endpoint này trước khi PUT thay đổi trường hồ sơ.",
  getMyNutritionProfile:
    "Trả hồ sơ dinh dưỡng và mục tiêu hiện tại; khi chưa có dữ liệu, kiểm tra null/default theo schema thay vì giả định các mục tiêu đã tính.",
  getCategories:
    "Đọc danh mục theo bộ lọc và thứ tự được validator hỗ trợ. ID kết quả dùng khi tạo thực phẩm/nội dung.",
  createCategory:
    "Admin tạo danh mục mới bằng name và các trường schema; ID/audit được server quản lý, trùng định danh có thể trả 409.",
  updateCategory:
    "Admin cập nhật ít nhất một trường; kiểm tra trùng định danh và tính hợp lệ trước khi ghi audit.",
  deleteCategory:
    "Admin chuyển status sang inactive và ghi audit, không xóa cứng bản ghi hoặc tự bỏ mọi tham chiếu cũ.",
  getAllergens:
    "Đọc danh mục dị ứng; dùng ID backend khi lưu hồ sơ/thực phẩm hoặc gửi bộ lọc loại trừ.",
  createAllergen:
    "Admin tạo chất gây dị ứng; tên/định danh phải đáp ứng schema và ràng buộc duy nhất.",
  updateAllergen:
    "Admin cập nhật ít nhất một trường; dữ liệu đã được thực phẩm/hồ sơ tham chiếu vẫn dùng ID cũ.",
  deleteAllergen:
    "Admin chuyển status sang inactive và ghi audit, không tự xóa dị ứng khỏi mọi hồ sơ hoặc thực phẩm tham chiếu.",
  searchFoodItems:
    "Lọc thực phẩm theo từ khóa/danh mục/vegan/vegetarian/dị ứng. Boolean query phải là chuỗi true/false. Bộ lọc dị ứng nhận dạng wire được khai báo trong schema.",
  getFoodItem:
    "id là ObjectId thực phẩm. Đọc defaultServing và nutritionPer100g để quy đổi lượng dùng, không coi dinh dưỡng này là cho một piece.",
  createFoodItem:
    "Admin cung cấp name, categoryId, defaultServing, nutritionPer100g và cờ chế độ ăn. NutritionPer100g có các đơn vị theo hậu tố trường; dữ liệu vegan không được mâu thuẫn với trứng/sữa.",
  updateFoodItem:
    "Admin gửi ít nhất một trường; kiểm tra vegan/vegetarian/trứng/sữa trên trạng thái ghép mới, không chỉ các trường trong payload.",
  deleteFoodItem:
    "Admin chuyển status sang inactive, cập nhật updatedBy và ghi audit; không xóa cứng thực phẩm. Snapshot lịch sử không tự sửa theo request này.",
  getRecipes:
    "Danh sách công thức công khai có phân trang và bộ lọc chế độ ăn, dị ứng, độ khó, thời gian và ẩm thực theo query.",
  getMyRecipes:
    "Danh sách công thức của tác giả hiện tại, hỗ trợ lọc trạng thái để quản lý draft/pending_review/rejected/published.",
  getRecipe:
    "Đọc bằng ObjectId hoặc slug. Guest chỉ đọc nội dung có quyền công khai; token có thể cho phép đọc nội dung riêng của owner và dữ liệu liên quan.",
  deleteRecipe:
    "Xóa công thức thuộc owner theo cơ chế service; không xóa snapshot công thức đã lưu trong nhật ký/kế hoạch bằng endpoint này.",
  submitRecipe:
    "Owner gửi công thức vào luồng duyệt. Công thức phải đủ nguyên liệu/bước và tham chiếu hợp lệ; draft chưa đầy đủ có thể bị 400/409.",
  publishRecipe:
    "Admin xuất bản công thức đủ điều kiện; dữ liệu và trạng thái được kiểm tra lại trước chuyển published.",
  rejectRecipe:
    "Admin từ chối công thức, bắt buộc reason để tác giả biết lý do; version hỗ trợ tránh xử lý trạng thái đã thay đổi.",
  searchContent:
    "Tìm trên các loại content được query cho phép; response có type để phân biệt recipe/post/video và có thể cá nhân hóa khi token hợp lệ.",
  getSearchSuggestions:
    "Lấy từ khóa/nội dung gợi ý theo q và giới hạn schema; không ghi lịch sử cá nhân cho guest.",
  getRecentSearches:
    "Chỉ đọc các truy vấn gần đây của owner; normalizedQuery phục vụ chống trùng/chuẩn hóa, query là nội dung lưu tương ứng.",
  clearRecentSearches:
    "Xóa toàn bộ lịch sử tìm kiếm của người gọi; không xóa content hoặc lịch sử của người khác.",
  deleteRecentSearch:
    "Xóa một bản ghi lịch sử theo id và owner; resource ngoài owner bị từ chối/không tìm thấy.",
  discoverContent:
    "Guest dùng bộ lọc công khai, user có thể áp dụng hồ sơ; response personalized/ranking giải thích nhánh và cơ sở gợi ý.",
  getRecipeRecommendations:
    "Gợi ý công thức theo hồ sơ người gọi và bộ lọc request. Lọc dị ứng không được làm yếu dị ứng đã lưu trong hồ sơ.",
  getContentRecommendations:
    "Gợi ý các loại nội dung được hỗ trợ; xem type của mỗi kết quả và metadata ranking, không coi mọi kết quả là công thức.",
  getPantry:
    "Trả kho của owner và các items. itemId là UUID nội bộ, foodItemId là ObjectId master data; dùng đúng ID khi PATCH/DELETE item.",
  addPantryItem:
    "Thêm thực phẩm chuẩn và số lượng/đơn vị; expiresAt là timestamp nullable, khác expiryDate kiểu ngày ở proposal AI.",
  updatePantryItem:
    "Cập nhật item UUID thuộc kho owner; không được đổi foodItemId bằng schema PATCH này. Ít nhất một trường quantity/unit/expiresAt/note hợp lệ.",
  deletePantryItem: "Bỏ item UUID khỏi kho owner; không xóa thực phẩm master data.",
  getMealPlans: "Liệt kê kế hoạch owner theo weekStartDate/status và phân trang.",
  getCurrentMealPlan:
    "Đọc kế hoạch active ứng với date nếu gửi; response có thể null khi không có kế hoạch hiện tại theo schema.",
  getMealPlan:
    "Đọc chi tiết kế hoạch owner bằng ObjectId; meals chứa UUID dùng ở endpoint cập nhật/xóa bữa.",
  updateMealPlan:
    "Chỉ sửa title và status draft/archived theo schema; kích hoạt dùng endpoint activate, không PATCH status=active.",
  deleteMealPlan:
    "Xóa kế hoạch owner và xử lý liên kết active theo service; không xóa công thức nguồn.",
  addMealToPlan:
    "Thêm bữa vào date thuộc tuần kế hoạch. Service tạo mealId UUID và chụp snapshot công thức/dinh dưỡng theo servings.",
  updateMealInPlan:
    "mealId là UUID trong kế hoạch; PATCH trường bữa được cho phép và service tính lại snapshot/tổng khi cần.",
  deleteMealFromPlan:
    "Xóa một bữa UUID trong kế hoạch owner; dinh dưỡng tổng kế hoạch được cập nhật theo trạng thái mới.",
  getGroceryLists:
    "Danh sách mua sắm owner, lọc status và phân trang; items nằm trong resource list theo response schema.",
  getGroceryList: "Đọc chi tiết danh sách owner; itemId UUID được dùng cho thao tác từng mục.",
  createGroceryList:
    "Tạo danh sách theo name, items có thể bỏ qua để dùng []; mỗi item phải có thực phẩm hoặc tên snapshot.",
  updateGroceryList:
    "PATCH name/status với ít nhất một trường; status chỉ active/completed/archived theo schema.",
  deleteGroceryList: "Xóa danh sách owner theo service, không xóa thực phẩm chuẩn trong items.",
  updateGroceryItem:
    "itemId là UUID. Cập nhật tên/số lượng/đơn vị/ghi chú/checked, không đổi foodItemId qua schema này.",
  deleteGroceryItem: "Bỏ một mục UUID khỏi danh sách owner, không ảnh hưởng master data.",
  clearCheckedGroceryItems:
    "Bỏ các mục checked khỏi danh sách owner, giữ các mục chưa checked; gửi {} hoặc không body.",
  getDiaryEntries:
    "Lấy bản ghi theo date hoặc from/to và timezone. Không kết hợp date với range; meta phân trang không thay cho tổng summary.",
  updateDiaryEntry:
    "Sửa các trường lượng/khẩu phần/ghi chú/thời điểm được schema cho phép; sourceType và nguồn tham chiếu không được thay qua PATCH này.",
  deleteDiaryEntry: "Xóa bản ghi owner; lần đọc summary tiếp theo dựa trên các bản ghi còn lại.",
  getWeightLogs:
    "Lấy cân nặng owner theo phạm vi ngày và phân trang; phân biệt weightKg với currentWeightKg của nutrition profile.",
  createWeightLog:
    "Ghi cân nặng kg với thời điểm/ngày theo schema; không gửi pound hoặc chuỗi số thay number trong JSON.",
  updateWeightLog:
    "Cập nhật bản ghi cân nặng owner bằng ít nhất một trường được phép; đọc trend lại để thấy tổng hợp mới.",
  deleteWeightLog: "Xóa bản ghi cân nặng owner, không xóa nutrition profile.",
  getWeightTrend:
    "Tổng hợp cân nặng trong range; xem first/latest/average/change và null khi thiếu đủ dữ liệu để tính.",
  getWaterLogs: "Đọc nhật ký uống nước owner theo query; amountMl là lượng từng bản ghi.",
  createWaterLog:
    "Thêm lượng uống amountMl và thời điểm theo schema; 1000 ml tương đương 1 l nhưng payload dùng ml.",
  updateWaterLog: "PATCH lượng/thời điểm được hỗ trợ, ít nhất một trường; không thay userId.",
  deleteWaterLog: "Xóa một bản ghi uống nước owner; không thay waterTargetMl trong hồ sơ.",
  getMyMedia:
    "Danh sách media owner theo status/purpose và phân trang, bao gồm pending nếu bộ lọc cho phép; pending không được coi là ready.",
  getPosts:
    "Danh sách bài đăng có quyền công khai, phân trang/bộ lọc query; bài draft/ẩn không tự xuất hiện ở public list.",
  getMyPosts:
    "Danh sách bài đăng tác giả hiện tại, lọc trạng thái để quản lý nội dung chưa xuất bản.",
  getPost:
    "Đọc bằng ObjectId của bài đăng, không nhận slug. Quyền guest/owner/admin được service kiểm tra dựa trên trạng thái và visibility.",
  createPost:
    "Tạo bài đăng theo schema ở trạng thái ban đầu của service; không tự cấp trạng thái published qua dữ liệu ngoài schema.",
  deletePost:
    "Xóa bài đăng owner theo service; không xóa tài khoản tác giả hoặc media master bằng request này.",
  submitPost: "Owner gửi bài vào luồng duyệt, yêu cầu nội dung và tham chiếu đủ điều kiện.",
  publishPost: "Admin xuất bản bài đủ điều kiện, có kiểm tra trạng thái nguồn và version nếu gửi.",
  rejectPost: "Admin từ chối bài, bắt buộc reason; lý do được lưu để tác giả quản lý nội dung.",
  getComments:
    "Lấy bình luận theo targetType/targetId, phân trang và bộ lọc được khai báo; target phải có thể truy cập.",
  createComment:
    "Gửi target và content; parentCommentId tùy chọn để trả lời, phải thuộc đúng target và không bị chặn bởi trạng thái cha.",
  updateComment:
    "Owner sửa content bình luận theo schema; không đổi target/parent bằng endpoint này.",
  deleteComment:
    "Xóa bình luận theo quyền service; bình luận con còn chịu trạng thái parentHidden khi trình bày.",
  upsertReaction:
    "PUT phản ứng của người gọi lên target được hỗ trợ; targetType/targetId trong request quyết định nội dung, không tự truyền ownerId.",
  deleteReaction:
    "Bỏ phản ứng của người gọi trên target đường dẫn, không bỏ phản ứng của mọi user.",
  getSavedItems:
    "Danh sách nội dung đã lưu của owner theo type/phân trang; resource không còn truy cập được được xử lý theo service.",
  saveItem:
    "Lưu target vào danh sách riêng người gọi; service bảo vệ tính duy nhất của user+target.",
  unsaveItem: "Bỏ lưu đúng targetType/targetId của người gọi; không xóa nội dung gốc.",
  getAiConversations:
    "Liệt kê conversation owner có phân trang; không trả messages của tất cả conversation trong một response.",
  createAiConversation:
    "Tạo conversation owner; title bỏ qua dùng New conversation. Tạo conversation chưa tương đương gửi message đến provider.",
  getAiMessages:
    "Lấy messages trong conversation id thuộc owner, phân trang; conversation ngoài owner bị từ chối/không tìm thấy.",
  sendAiMessage:
    "Gửi content vào conversation owner; AI chạy theo safety/structured-output policy và lưu kết quả/run. Provider lỗi có thể trả 502; không gửi secret trong nội dung.",
  getNotifications:
    "Inbox owner có phân trang; unread nhận chuỗi true/false. Mỗi notification có thông tin liên kết/route khi được service tạo.",
  getUnreadNotificationCount: "Trả unreadCount của owner, không cần lấy toàn bộ inbox để đếm.",
  markNotificationAsRead:
    "Đánh dấu một notification owner đã đọc; body rỗng hợp lệ. Không dùng id của người khác.",
  markAllNotificationsAsRead:
    "Đánh dấu inbox owner đã đọc theo service; không tạo push notification mới.",
  deleteNotification:
    "Bỏ notification khỏi inbox owner; không hủy reminder nguồn bằng endpoint này.",
  getNotificationPreferences:
    "Trả cấu hình push và quietHours hiện tại/default. Dùng timezone này để diễn giải giờ địa phương.",
  getReminders:
    "Danh sách reminder owner theo status/phân trang; nextRunAt là timestamp, schedule.at có định dạng theo mode.",
  updateReminder:
    "Ít nhất một trường title/body/type/schedule/status; status PATCH chỉ active/paused, hủy dùng DELETE. schedule gửi nguyên nhánh hợp lệ.",
  createReport:
    "Tạo report cho target được hỗ trợ, reason và các trường bằng schema; owner là người gọi, không tự truyền reporterId.",
  getMyReports:
    "Liệt kê report do owner tạo với bộ lọc/phân trang; không đọc toàn bộ report của hệ thống.",
  getMyReport:
    "Đọc report id thuộc người gọi; admin dùng các endpoint quản lý riêng khi cần phạm vi hệ thống.",
  getAdminReports: "Admin tra cứu report toàn hệ thống theo bộ lọc/phân trang để xử lý.",
  updateAdminReport:
    "Admin sửa trạng thái/ghi chú xử lý được schema cho phép; các chuyển trạng thái còn chịu kiểm tra service.",
  getModerationCases: "Admin liệt kê case theo bộ lọc và phân trang; khác report gốc do user tạo.",
  createModerationCase:
    "Admin mở case cho target hợp lệ, kèm báo cáo/liên kết/ghi chú theo schema; audit ghi người thực hiện.",
  updateModerationCase:
    "Admin PATCH ít nhất một trường xử lý/assignment/status hợp lệ, không tùy ý đổi target ngoài schema.",
  hideContent:
    "Admin ẩn target và ghi moderation/audit theo schema; visibility và trạng thái được service áp dụng cho public reads.",
  restoreContent:
    "Admin khôi phục target theo case/lý do; không bảo đảm mọi trạng thái đều có thể khôi phục, kiểm tra service có thể trả conflict.",
  suspendUser:
    "Admin đình chỉ tài khoản đích; lý do tùy chọn. Tài khoản bị đình chỉ không được gọi API yêu cầu active.",
  activateUser:
    "Admin kích hoạt tài khoản đích theo quy tắc service, body {} hoặc bỏ qua; không tương đương khôi phục mọi nội dung đã ẩn.",
  getAdminUsers:
    "Admin liệt kê tài khoản theo q/status/role và phân trang; DTO không công khai các FCM token.",
  getAuditLogs:
    "Admin đọc audit theo actor/action/resource/date và phân trang được query hỗ trợ; API đọc không sửa log.",
  getVideos:
    "Danh sách video công khai có phân trang; recipeId và maxDurationSeconds lọc video liên quan/thời lượng.",
  getMyVideos:
    "Danh sách video của owner, lọc trạng thái để quản lý draft/processing/pending_review/published.",
  getVideo:
    "Đọc bằng id/slug với quyền service; URL playback có thể có hạn, không lưu làm URL vĩnh viễn.",
  createVideo:
    "Tạo video bằng videoMediaId và durationSeconds cùng title; media phải đúng video/ready/quyền owner. Transcript/chapters có thể bổ sung theo schema.",
  deleteVideo:
    "Xóa video owner theo service, không thay đổi snapshot ở resource khác bằng request này.",
  submitVideo: "Owner gửi video vào luồng duyệt; media ready và các trường xuất bản phải hợp lệ.",
  publishVideo:
    "Admin xuất bản video đủ điều kiện; kiểm tra lại media/thumbnail/chapters và trạng thái trước khi published.",
  rejectVideo: "Admin từ chối video với reason bắt buộc, version tùy chọn chống xử lý đồng thời.",
  getRelatedVideos:
    "Liệt kê video liên quan đến id có quyền truy cập, có phân trang; không trả toàn bộ video bất kể trạng thái.",
  upsertRating:
    "PUT score nguyên 1–5, review tùy chọn cho recipe/video được phép truy cập; mỗi user có rating hiện tại trên target.",
  deleteRating:
    "Bỏ rating của người gọi trên recipe/video; summary sau thao tác dựa trên tập rating còn lại.",
  getViewHistory:
    "Danh sách lịch sử xem owner có phân trang và bộ lọc; không dùng để đọc lịch sử xem của tác giả khác.",
  clearViewHistory:
    "Xóa toàn bộ lịch sử xem của người gọi; không đặt lại viewCount của mọi nội dung.",
  deleteViewHistoryItem: "Xóa bản ghi lịch sử theo ID owner; không xóa resource đã xem.",
  recordView:
    "Ghi nhận xem target được hỗ trợ; response counted cho biết có tăng bộ đếm theo cơ chế chống lặp hay không.",
  getDashboardSummary:
    "Trả tổng quan users/content/reports/AI cho admin; đọc definitions để phân biệt bộ đếm toàn trạng thái với bộ đếm trong range.",
  getContentTrends:
    "Chuỗi content theo interval day/week/month trong UTC, gồm published/flagged theo từng type. flagged đếm các lần gửi report, không đếm target duy nhất; published theo timestamp xuất bản của content hiện còn tồn tại.",
  getUserTrends:
    "Bucket UTC day/week/month. activeUsers là user hiện active nhóm theo lần đăng nhập gần nhất, không phải DAU; suspendedUsers đếm target duy nhất trong mỗi bucket từ audit đình chỉ.",
  getPendingContent:
    "Danh sách content chờ duyệt có phân trang, type phân biệt recipe/post/video; không dùng DTO chung để giả định mọi trường chi tiết.",
  getAdminUserDetail:
    "Admin đọc chi tiết tài khoản và các phần tổng hợp được phép; không trả raw FCM token/secret.",
  getAiRuns:
    "Admin liệt kê runs theo feature/status/model/from/to và phân trang; provider là thông tin trả về, không phải query hỗ trợ. Dữ liệu đầu vào/đầu ra nhạy cảm được lọc.",
  getAiRunDetail: "Admin đọc SafeAiRun theo ID; DTO giám sát khác nội dung trò chuyện của user.",
  getAiMetrics:
    "Thống kê AI theo phạm vi query; không suy diễn accuracy khi accuracyAvailable=false, helpfulRate là phản hồi người dùng, không phải độ chính xác ground truth.",
  getAiFeedback:
    "Admin đọc SafeAiFeedback và summary; thông tin nhận diện/nội dung phản hồi riêng được lọc theo DTO.",
  checkLiveness:
    "Trả tình trạng tiến trình và uptime; dùng cho liveness probe, không dùng thay readiness.",
  checkReadiness:
    "Trả 200 khi dependency bắt buộc sẵn sàng; 503 khi database/provider bắt buộc chưa sẵn sàng.",
  getAppConfig:
    "minimum/latest/forceUpdate lấy từ cấu hình backend. Client sử dụng feature flags để hiển thị tính năng phù hợp.",
  syncAuth:
    "Tạo hoặc đồng bộ tài khoản theo UID/email do Firebase đã xác minh; không cho client tự cấp role=admin.",
  addFcmToken:
    "Đăng ký token thiết bị cho người dùng hiện tại; deviceName/platform mô tả thiết bị. Không đặt Firebase ID token vào trường token của FCM.",
  removeFcmToken: "tokenId là ID bản ghi thiết bị, không phải chuỗi FCM token.",
  updateMyProfile:
    "Dùng avatarMediaId để gắn avatar đã sẵn sàng, hoặc avatarUrl:null để xóa avatar legacy; không gửi đồng thời hai trường này.",
  deleteMyAccount:
    "Đánh dấu xóa tài khoản backend và thực hiện các bước xử lý liên quan ở service; đây là thao tác thay đổi trạng thái tài khoản.",
  completeOnboarding:
    "Chỉ hoàn tất khi hồ sơ đáp ứng các trường onboarding bắt buộc. Đọc status để biết missingFields/readyToComplete trước khi gọi.",
  upsertMyProfile:
    "Ít nhất một trường hồ sơ phải được gửi. dateOfBirth không được nằm trong tương lai; timezone phải là tên IANA hợp lệ.",
  upsertMyNutritionProfile:
    "Ít nhất một trường phải được gửi; allergenIds là ID master data. Các mục tiêu dinh dưỡng dùng đơn vị ghi trong tên trường.",
  recalculateNutritionTarget:
    "Tính lại mục tiêu từ hồ sơ hiện tại; đọc calculationWarnings và targetSource để biết dữ liệu thiếu và nguồn mục tiêu.",
  getRecipeNutrition:
    "Trả dinh dưỡng công thức được phép công khai; nutritionPerServing phụ thuộc số servings và gramEquivalent của nguyên liệu.",
  createRecipe:
    "Tạo bản nháp. ingredients/steps có thể bổ sung sau, nhưng gửi duyệt/xuất bản yêu cầu nội dung đáp ứng điều kiện service. order của các bước không được trùng.",
  updateRecipe:
    "Ít nhất một trường chỉnh sửa ngoài version. Nếu gửi version, dùng version đã đọc gần nhất; sai version trả 409. Snapshot và dinh dưỡng được cập nhật theo nguyên liệu hợp lệ.",
  updatePost:
    "Ít nhất một trường chỉnh sửa ngoài version; version tùy chọn giúp phát hiện cập nhật đồng thời (409).",
  updateVideo:
    "Ít nhất một trường chỉnh sửa ngoài version. Khi sửa video published, service kiểm tra lại điều kiện xuất bản; tham chiếu media và chapters phải còn hợp lệ.",
  getPantryRecipeSuggestions:
    "Chỉ gợi ý công thức phù hợp chế độ ăn/dị ứng của owner; thực phẩm được kiểm tra theo dữ liệu hiện tại. Snapshot trong kho không bị viết lại.",
  addPantryItemsBulk:
    "Gửi items (1–100 mục) và idempotencyKey. Dùng lại cùng key để retry request; mỗi mục phải có tham chiếu thực phẩm và số lượng/đơn vị hợp lệ. itemId trong kho là UUID, không phải ObjectId thực phẩm.",
  getExpiringPantryItems:
    "days là khoảng nhìn trước 0–90 ngày, mặc định 7; includeExpired=true để bao gồm cả mục đã hết hạn.",
  addGroceryItem:
    "Phải gửi foodItemId hoặc nameSnapshot cùng quantity/unit. itemId của mục mua sắm là UUID, khác ObjectId của grocery list.",
  createMealPlan:
    "days có tối đa 7 ngày; mỗi date duy nhất và nằm trong [weekStartDate, weekStartDate+7 ngày). meals có tối đa 12 bữa/ngày.",
  activateMealPlan:
    "Chuyển kế hoạch thuộc owner sang active theo các ràng buộc của service; dùng endpoint này thay việc PATCH status=active.",
  cloneMealPlan:
    "Sao chép kế hoạch owner sang tuần mới tại weekStartDate; ID kế hoạch/bữa ăn mới do backend tạo.",
  generateGroceryListFromPlan:
    "Tổng hợp nguyên liệu từ kế hoạch và số servings. subtractPantry=true yêu cầu trừ lượng nguyên liệu có trong kho theo đơn vị mà service chuyển đổi được.",
  createDiaryEntry:
    "Chọn đúng nhánh sourceType: recipe cần recipeId+servings; food cần foodItemId+quantity+unit; custom cần nameSnapshot+nutritionSnapshot. Không trộn trường giữa các nhánh.",
  getDiarySummary:
    "Trả tổng dinh dưỡng, dailyTargets và targetComparison. remaining=target-consumed; percentage so với target. Target thiếu trả null; tổng mục tiêu range tính cả ngày không có bản ghi, sử dụng mục tiêu hiện tại, không phải mục tiêu lịch sử.",
  createUploadRequest:
    "Gửi metadata JSON, không gửi file multipart. MIME hỗ trợ image/jpeg, image/png, image/webp, video/mp4, video/webm. Các purpose avatar/recipe_step/video_thumbnail/ai_ingredient yêu cầu image; video yêu cầu video. Giới hạn service còn phụ thuộc cấu hình.",
  confirmMediaUpload:
    "Gọi sau khi PUT binary thành công; backend kiểm tra object tồn tại, MIME và size trước khi đổi trạng thái sang ready. Không tự đặt objectKey hoặc status.",
  getMediaAsset:
    "URL đọc có thể có hạn; kiểm tra downloadUrl/playback và expiresAt theo response. Quyền đọc dựa trên owner và liên kết nội dung.",
  deleteMediaAsset:
    "Service kiểm tra quyền sở hữu và các liên kết đang sử dụng trước khi xóa; media còn được tham chiếu có thể trả conflict.",
  createMealPlanProposal:
    "Provider tạo dữ liệu đề xuất có cấu trúc; startDate và days giới hạn 1–7 ngày. Chưa lưu kế hoạch cho đến confirm.",
  confirmMealPlanProposal:
    "Có thể gửi title/days đã chọn và activate. Các ngày chọn phải thuộc ngày của proposal; recipe phải còn truy cập được và an toàn theo hồ sơ hiện tại. Ghi trong transaction. Retry proposal đã consumed trả kết quả lần đầu, không áp dụng body mới.",
  recognizeIngredients:
    "mediaId phải là ảnh owner được phép đọc, purpose/trạng thái hợp lệ; AI tạo pantry proposal, chưa thêm items vào kho.",
  confirmPantryProposal:
    "items tùy chọn cho phép chọn/sửa foodItemId, quantity, unit, expiryDate. Mỗi mục được chọn cần foodItemId đã giải quyết; tên lấy từ master data. Retry proposal đã consumed trả kết quả lần đầu.",
  generateVideoSummary:
    "Adapter mặc định tóm tắt từ transcript/context; không hỗ trợ đọc raw video khi thiếu transcript. Trả 422 AI_VIDEO_UNSUPPORTED khi không có transcript khả dụng; 502 khi provider lỗi/structured output sai.",
  generateVideoSummaryFromVideoId:
    "Dùng transcript/context của video có quyền truy cập; cùng giới hạn provider và mã 422 AI_VIDEO_UNSUPPORTED như API AI video summary.",
  submitAiFeedback:
    "runId phải thuộc người gọi; helpful/not_helpful phản hồi chất lượng, không sửa kết quả AI hoặc dữ liệu đã xác nhận.",
  createReminder:
    "schedule.mode quyết định payload: once có at ISO datetime; daily có at HH:mm; weekly thêm daysOfWeek không trùng. Backend tính nextRunAt theo timezone.",
  deleteReminder:
    "Hủy reminder theo service; response cancelled cho biết kết quả. Không dùng API này để xóa notification đã phát.",
  upsertNotificationPreferences:
    "Đây là PUT toàn bộ cấu hình theo schema: trường bỏ qua nhận default, không phải PATCH giữ nguyên mọi giá trị cũ.",
  updateVideoProgress:
    "progressSeconds là vị trí xem, không vượt durationSeconds thực tế. completed=true yêu cầu ít nhất 90% thời lượng; service suy ra completed từ ngưỡng này. Cập nhật tiến độ không đảm bảo tăng viewCount ở mọi lần gọi.",
  getVideoTranscript:
    "Chỉ trả transcript khi video có thể truy cập; không tự gọi AI để tạo transcript.",
  getRatingSummary:
    "Trả thống kê rating và myRating khi có token hợp lệ; guest vẫn đọc được thống kê công khai.",
  changeUserRole:
    "Đổi role tài khoản đích với các ràng buộc bảo vệ admin ở service; client không thể tự nâng quyền qua hồ sơ cá nhân.",
};

const fields = {
  id: "ID resource trong đường dẫn.",
  _id: "MongoDB ObjectId của bản ghi.",
  idOrSlug: "MongoDB ObjectId hoặc slug nội dung; không gửi URL đầy đủ.",
  page: "Trang bắt đầu từ 1; bỏ qua dùng default trong schema.",
  limit: "Số bản ghi tối đa mỗi trang; default và giới hạn nằm trong schema.",
  total: "Tổng số bản ghi khớp bộ lọc.",
  totalPages: "Tổng số trang theo total và limit.",
  q: "Từ khóa tìm kiếm; chuỗi được trim và giới hạn độ dài.",
  sort: "Thứ tự sắp xếp; các giá trị hỗ trợ/default nằm trong schema.",
  from: "Mốc bắt đầu phạm vi, YYYY-MM-DD hoặc ISO datetime khi schema nhánh cho phép; dùng theo quy tắc từng API.",
  to: "Mốc kết thúc phạm vi, phải từ from trở đi. YYYY-MM-DD hoặc ISO datetime khi schema cho phép; với dashboard/monitoring, ngày to gồm đến 23:59:59.999 UTC.",
  date: "Ngày lịch YYYY-MM-DD; không phải timestamp UTC.",
  timezone: "Tên múi giờ IANA hợp lệ, ví dụ Asia/Ho_Chi_Minh; không dùng GMT+7.",
  weekStartDate: "Ngày bắt đầu tuần kế hoạch, YYYY-MM-DD.",
  startDate: "Ngày bắt đầu đề xuất, YYYY-MM-DD.",
  dateOfBirth: "Ngày sinh hợp lệ, không được nằm trong tương lai.",
  title: "Tiêu đề hiển thị.",
  name: "Tên hiển thị.",
  displayName: "Tên tài khoản hiển thị.",
  description: "Nội dung mô tả chi tiết.",
  summary: "Nội dung tóm tắt.",
  content: "Nội dung theo loại resource; xem schema nhánh tương ứng.",
  body: "Nội dung thông báo/nhắc nhở hoặc phần nội dung bản ghi.",
  note: "Ghi chú tùy chọn.",
  notes: "Các ghi chú bổ sung.",
  reason: "Lý do của hành động/đánh giá/xử lý.",
  slug: "Định danh dễ đọc gồm chữ/số và dấu gạch nối theo pattern.",
  status: "Trạng thái resource; chỉ dùng các enum cho phép ở endpoint này.",
  version: "Phiên bản đã đọc gần nhất, dùng kiểm tra cập nhật đồng thời; mismatch trả 409.",
  visibility:
    "Mức hiển thị public/private/unlisted; còn chịu kiểm tra trạng thái và quyền truy cập.",
  dietType:
    "Chế độ ăn theo enum; lacto_vegetarian loại trứng, ovo_vegetarian loại sữa khi lọc an toàn.",
  allergenIds: "Danh sách ID chất gây dị ứng trong master data.",
  excludeAllergenIds:
    "Loại thực phẩm/nội dung có chất gây dị ứng được chỉ định; API cá nhân còn áp dụng dị ứng hồ sơ.",
  allergenExclusion: "Bộ lọc loại dị ứng; xem schema để biết dạng chuỗi CSV hoặc array hỗ trợ.",
  category: "ID danh mục dùng lọc.",
  categoryId: "ID danh mục master data.",
  categoryIds: "Danh sách ID danh mục master data.",
  tags: "Nhãn nội dung; query có thể nhận chuỗi phân cách dấu phẩy khi validator hỗ trợ.",
  foodItemId: "ID thực phẩm chuẩn; phải tồn tại và hợp lệ theo kiểm tra service.",
  recipeId: "ID công thức; quyền truy cập và trạng thái được kiểm tra trước khi dùng.",
  mediaId: "ID media đã đăng ký; trạng thái/purpose/quyền đọc phải phù hợp.",
  mediaIds: "Danh sách media liên kết với nội dung.",
  avatarMediaId:
    "ID ảnh avatar sẵn sàng thuộc người dùng; null để bỏ liên kết khi schema cho phép.",
  avatarUrl: "URL avatar trả về; API cập nhật cá nhân chỉ cho avatarUrl:null để xóa legacy.",
  coverMediaId: "ID media ảnh bìa.",
  videoMediaId: "ID media video đã upload và confirm.",
  thumbnailMediaId: "ID media ảnh thumbnail.",
  targetType: "Loại resource đa hình; enum giới hạn theo endpoint.",
  targetId: "ID resource của targetType; target phải có thể truy cập.",
  parentCommentId: "ID bình luận cha khi trả lời; phải cùng target và hợp lệ.",
  quantity: "Số lượng dương, được diễn giải cùng unit.",
  unit: "Đơn vị quantity theo enum; không tự coi mọi đơn vị là gram.",
  gramEquivalent: "Khối lượng gram tương ứng để quy đổi dinh dưỡng.",
  amount: "Lượng của một khẩu phần, đi cùng unit.",
  amountMl: "Lượng nước, đơn vị milliliter.",
  servings: "Số khẩu phần công thức được sử dụng.",
  defaultServing: "Khẩu phần chuẩn gồm amount, unit và gramEquivalent.",
  nutritionPer100g: "Dinh dưỡng tính trên 100 gram thực phẩm.",
  nutritionPerServing: "Dinh dưỡng của một khẩu phần công thức.",
  nutritionSnapshot:
    "Dinh dưỡng được chụp tại thời điểm ghi nhận, không tự cập nhật theo master data mới.",
  isVegan: "Có phù hợp vegan không; vegan không được chứa trứng/sữa.",
  isVegetarian: "Có phù hợp vegetarian không; phải true khi isVegan=true.",
  containsEggs: "Có chứa trứng; dữ liệu chưa biết có thể null trong response theo schema.",
  containsDairy: "Có chứa sữa; dữ liệu chưa biết có thể null trong response theo schema.",
  expiryDate: "Ngày hết hạn của nguyên liệu, YYYY-MM-DD.",
  days: "Danh sách ngày hoặc số ngày tùy schema endpoint; không trộn hai dạng.",
  meals: "Các bữa ăn của ngày; gồm loại bữa, công thức và số khẩu phần.",
  mealId: "UUID bữa ăn bên trong kế hoạch, khác ObjectId kế hoạch.",
  mealType: "Loại bữa breakfast/lunch/dinner/snack.",
  slot: "Vị trí bữa ăn trong proposal AI.",
  sourceType: "Nguồn nhật ký recipe/food/custom, quyết định các trường bắt buộc.",
  ingredients: "Nguyên liệu công thức; mỗi mục tham chiếu thực phẩm chuẩn.",
  steps: "Các bước nấu; order phải duy nhất.",
  order: "Thứ tự bước/nguyên liệu theo schema.",
  instruction: "Hướng dẫn thực hiện bước.",
  subtractPantry:
    "Nếu true, tạo danh sách mua sắm có trừ nguyên liệu trong kho khi chuyển đổi được đơn vị.",
  checked: "Mục mua sắm đã được đánh dấu hoàn thành.",
  activate: "Nếu true, yêu cầu kích hoạt kế hoạch sau khi xác nhận proposal.",
  proposalId: "ID proposal của owner; phải còn hạn hoặc đã consumed để replay.",
  runId: "ID lần thực thi AI.",
  schedule: "Lịch theo nhánh mode once/daily/weekly.",
  mode: "Chế độ lịch, quyết định định dạng at và daysOfWeek.",
  at: "once: ISO datetime có offset; daily/weekly: giờ địa phương HH:mm.",
  daysOfWeek: "Ngày trong tuần: 0=Chủ nhật, 6=Thứ bảy; không trùng.",
  quietHours: "Khoảng hạn chế push trong múi giờ đã chọn; có thể qua nửa đêm.",
  filename: "Tên file gốc; objectKey lưu trữ do server tạo.",
  mimeType: "MIME file theo enum hỗ trợ; phải khớp file upload thực tế.",
  sizeBytes: "Kích thước file, đơn vị byte; giới hạn service có thể thấp hơn giới hạn schema.",
  purpose: "Mục đích media; quyết định loại file và nơi được phép liên kết.",
  uploadUrl: "URL PUT có hạn để gửi binary trực tiếp tới storage.",
  requiredHeaders: "Các HTTP header phải gửi nguyên giá trị khi PUT file vào uploadUrl.",
  downloadUrl: "URL đọc media có thể có hạn, không bảo đảm là URL public vĩnh viễn.",
  objectKey: "Khóa storage do server quản lý; client không tự tạo.",
  transcript: "Văn bản transcript, dùng cho tóm tắt; không phải binary video.",
  chapters: "Các đoạn video; endSeconds lớn hơn startSeconds, nằm trong thời lượng.",
  startSeconds: "Thời điểm bắt đầu chapter tính bằng giây.",
  endSeconds: "Thời điểm kết thúc chapter tính bằng giây.",
  durationSeconds: "Thời lượng video tính bằng giây.",
  progressSeconds: "Vị trí xem tính bằng giây, không vượt thời lượng video.",
  completed: "Trạng thái hoàn tất bữa ăn/video theo endpoint.",
  rating: "Điểm số hoặc enum helpful/not_helpful theo schema endpoint.",
  token: "FCM registration token của thiết bị; không phải Firebase ID token đăng nhập.",
  tokenId: "ID bản ghi FCM token cần xóa.",
  role: "Vai trò backend user/admin; chỉ admin endpoint được thay role.",
  requestId: "ID đối chiếu log, đồng nhất với X-Request-Id của response.",
  success: "true ở response thành công, false ở response lỗi.",
  data: "Dữ liệu kết quả theo schema riêng của operation.",
  meta: "Metadata gồm requestId và thông tin phân trang/tổng hợp khi có.",
  error: "Lỗi có code, message và details; không chứa stack trace/secret.",
  code: "Mã lỗi ổn định hoặc mã phân loại theo resource.",
  details: "Chi tiết validation; thường gồm location, path, code và message.",
  path: "Đường dẫn trường lỗi hoặc đường dẫn resource theo schema.",
  targetComparison:
    "So sánh consumed với mục tiêu hiện tại; thiếu target thì giá trị so sánh có thể null.",
  dailyTargets: "Mục tiêu dinh dưỡng ngày hiện tại; không phải lịch sử mục tiêu theo từng ngày.",
  consumed: "Lượng thực tế đã ghi nhận.",
  target: "Mục tiêu của chỉ số.",
  remaining: "target trừ consumed; có thể âm nếu vượt mục tiêu.",
  percentage: "Tỷ lệ consumed/target nhân 100, hoặc null khi không có target hợp lệ.",
  definitions: "Định nghĩa tính toán các chỉ số; dùng để hiểu scope/count/bucket.",
  start: "Giờ bắt đầu quiet hours HH:mm hoặc mốc bắt đầu theo schema.",
  end: "Giờ kết thúc quiet hours HH:mm hoặc mốc kết thúc theo schema.",
  locale: "Mã ngôn ngữ theo pattern, ví dụ vi-VN.",
  idempotencyKey:
    "Khóa retry cho cùng request bulk của owner; giữ nguyên khi gửi lại, tạo key mới cho hành động mới.",
  items: "Danh sách mục theo schema con; giới hạn số lượng và trường bắt buộc xem items schema.",
  nameSnapshot: "Tên được lưu tại thời điểm tạo, không tự đổi theo tên master data mới.",
  recipeSnapshot: "Thông tin công thức được chụp khi thêm bữa ăn/nhật ký.",
  foodNameSnapshot: "Tên thực phẩm được chụp tại thời điểm ghi nhận.",
  includeExpired: "Chuỗi query true/false: có bao gồm nguyên liệu đã hết hạn không.",
  minMatch: "Tỷ lệ khớp nguyên liệu tối thiểu, trong khoảng 0–1.",
  matchRatio: "Tỷ lệ nguyên liệu công thức khớp kho, trong khoảng 0–1.",
  matchedCount: "Số nguyên liệu khớp theo tiêu chí service.",
  missingIngredients: "Nguyên liệu thiếu để đáp ứng công thức.",
  sufficientCount: "Số nguyên liệu có đủ lượng theo phép quy đổi được hỗ trợ.",
  prepMinutes: "Thời gian chuẩn bị, phút.",
  cookMinutes: "Thời gian nấu, phút.",
  maxTotalMinutes: "Giới hạn tổng thời gian chuẩn bị+nấu khi lọc công thức, phút.",
  maxDurationSeconds: "Giới hạn thời lượng video khi lọc, giây.",
  timerSeconds: "Thời gian hẹn giờ bước nấu, giây.",
  difficulty: "Độ khó easy/medium/hard theo schema.",
  cuisine: "Ẩm thực hoặc vùng của công thức.",
  aliases: "Tên gọi khác để tìm kiếm thực phẩm.",
  preferredCuisines: "Danh sách ẩm thực ưu tiên của hồ sơ.",
  dislikedFoodItemIds: "ID thực phẩm không thích, dùng cá nhân hóa khi service hỗ trợ.",
  goal: "Mục tiêu dinh dưỡng/cân nặng theo enum.",
  activityLevel: "Mức vận động theo enum, dùng tính nhu cầu năng lượng.",
  dailyCalorieTarget: "Mục tiêu năng lượng mỗi ngày, kcal.",
  proteinTargetG: "Mục tiêu protein mỗi ngày, gram.",
  carbTargetG: "Mục tiêu carbohydrate mỗi ngày, gram.",
  fatTargetG: "Mục tiêu chất béo mỗi ngày, gram.",
  fiberTargetG: "Mục tiêu chất xơ mỗi ngày, gram.",
  waterTargetMl: "Mục tiêu uống nước mỗi ngày, ml.",
  weightKg: "Cân nặng đo được, kg.",
  heightCm: "Chiều cao, cm.",
  currentWeightKg: "Cân nặng hiện tại dùng cho hồ sơ, kg.",
  medicalNotes: "Ghi chú riêng trong hồ sơ dinh dưỡng; không phải chẩn đoán tự động.",
  bmi: "BMI tính từ chiều cao và cân nặng đủ dữ liệu; có thể null khi thiếu.",
  bmiCategory: "Nhóm BMI theo quy tắc tính của backend, không phải chẩn đoán.",
  calculationWarnings: "Cảnh báo về dữ liệu thiếu hoặc giả định của phép tính.",
  targetSource: "Nguồn mục tiêu (nhập thủ công/tính toán) theo response.",
  manualTargetFields: "Các mục tiêu được nhập thủ công.",
  enabled: "Bật/tắt chức năng của đối tượng hiện tại.",
  pushEnabled: "Có nhận push notification không.",
  mealReminderEnabled: "Có nhận push nhắc bữa ăn không.",
  waterReminderEnabled: "Có nhận push nhắc uống nước không.",
  contentEnabled: "Có nhận push nội dung không.",
  unread: "Chuỗi query true/false dùng lọc trạng thái chưa đọc.",
  unreadCount: "Số notification chưa đọc của owner.",
  readAt: "Thời điểm đã đọc, hoặc null khi chưa đọc.",
  nextRunAt: "Thời điểm UTC tiếp theo reminder đủ điều kiện chạy.",
  cancelled: "Reminder đã được hủy theo kết quả service.",
  channel: "Kênh thông báo theo enum/schema.",
  linkedEntityType: "Loại resource dùng điều hướng thông báo.",
  linkedEntityId: "ID resource liên kết; client vẫn cần kiểm tra quyền khi mở.",
  preferences: "Yêu cầu bổ sung cho AI hoặc cấu hình theo schema endpoint.",
  structuredData:
    "Kết quả AI đã kiểm tra cấu trúc; proposal chưa consumed chưa tương đương dữ liệu đã lưu.",
  result: "Kết quả đã lưu của proposal/hành động, dùng cho retry idempotent.",
  references: "Tham chiếu kết quả AI đã được backend giải quyết/kiểm tra.",
  keyPoints: "Các ý chính từ bản tóm tắt video.",
  feedback: "Phản hồi về kết quả AI theo phạm vi được phép đọc.",
  score: "Điểm đánh giá 1–5 ở API rating; ở bảng gợi ý là điểm ranking theo schema.",
  review: "Nhận xét kèm rating.",
  myRating: "Đánh giá của người gọi; null khi guest hoặc chưa đánh giá theo schema.",
  average: "Điểm trung bình của các đánh giá đủ điều kiện.",
  distribution: "Số đánh giá theo từng mức điểm.",
  reacted: "Người gọi đã reaction hay chưa theo response.",
  saved: "Trạng thái lưu của người gọi hoặc kết quả thao tác lưu.",
  removed: "Kết quả loại bỏ bản ghi/liên kết theo endpoint.",
  deleted: "Kết quả xóa theo endpoint; xem mô tả service để biết xóa mềm/trạng thái.",
  deletedCount: "Số bản ghi bị xóa bởi thao tác.",
  counted: "Lượt xem này đã được tính vào bộ đếm hay bị cơ chế chống lặp bỏ qua.",
  progress: "Tiến độ xem riêng của người dùng theo schema.",
  playback: "Thông tin phát video/URL có quyền truy cập, có thể có hạn.",
  expiresAt:
    "Thời điểm hết hạn ISO 8601; null khi schema cho phép không có hạn. Pantry thường dùng timestamp này thay expiryDate của AI input.",
  expiresIn: "Thời gian còn hiệu lực của signed URL, giây.",
  entityType: "Loại entity tham chiếu theo schema.",
  entityId: "ID entity tương ứng entityType.",
  actorId: "ID tài khoản thực hiện hành động audit.",
  actorRole: "Vai trò tài khoản tại thời điểm thực hiện.",
  action: "Mã hành động audit/kiểm duyệt.",
  before: "Thông tin được phép ghi audit trước thay đổi.",
  after: "Thông tin được phép ghi audit sau thay đổi.",
  assignedAdminId: "ID admin được giao xử lý.",
  resolution: "Kết quả/nội dung xử lý báo cáo hoặc case.",
  priority: "Mức ưu tiên theo enum.",
  interval: "Độ rộng bucket thời gian, theo enum của API thống kê.",
  bucket: "Mốc bucket thời gian trong timezone của truy vấn.",
  series: "Chuỗi chỉ số theo bucket; xem definitions để hiểu phép đếm.",
  range: "Khoảng thời gian backend đã áp dụng cho thống kê.",
  minimum: "Phiên bản ứng dụng tối thiểu được hỗ trợ.",
  latest: "Phiên bản ứng dụng mới nhất do backend cấu hình.",
  forceUpdate: "Có yêu cầu cập nhật phiên bản ứng dụng hay không.",
  features: "Feature flags công khai để client điều chỉnh UI.",
  authenticated: "Bootstrap đã xác thực người dùng hay đang trả dữ liệu guest.",
  personalized: "Kết quả có áp dụng hồ sơ người dùng hay không.",
  missingFields: "Danh sách trường onboarding/hồ sơ chưa đáp ứng điều kiện.",
  readyToComplete: "Đã đủ dữ liệu để gọi hoàn tất onboarding.",
  database: "Tình trạng kết nối database cho readiness.",
  uptimeSeconds: "Thời gian tiến trình đã chạy, giây.",
  requestId: "ID đối chiếu log, đồng nhất với X-Request-Id của response.",
  latencyMs: "Độ trễ lần chạy AI, millisecond.",
  averageLatencyMs: "Độ trễ AI trung bình, millisecond.",
  estimatedCost: "Chi phí AI ước tính theo cấu hình; không phải hóa đơn provider.",
  tokenUsage: "Thống kê token provider báo cáo hoặc backend chuẩn hóa.",
  inputTokens: "Số token đầu vào.",
  outputTokens: "Số token đầu ra.",
  totalTokens: "Tổng số token.",
  schemaValid: "Structured output đã qua kiểm tra schema hay chưa.",
  accuracyAvailable: "Có dữ liệu ground truth để tính accuracy hay không.",
  helpfulRate: "Tỷ lệ phản hồi helpful theo định nghĩa trong response.",
  coverageRate: "Tỷ lệ bao phủ đánh giá theo tập đủ điều kiện.",
  model: "Tên model AI do provider/cấu hình xác định.",
  provider: "Tên adapter/provider AI.",
  actions: "Các hành động/tổng hợp hành động theo schema của response.",
  active: "Số tài khoản/resource active trong phạm vi chỉ số.",
  activeUsers: "Chuỗi user hiện active nhóm theo lastLoginAt; xem definitions, không phải DAU.",
  activeAndSuspendedUsers: "Giải thích phạm vi bộ đếm tài khoản active/suspended.",
  afterStatus: "Trạng thái sau hành động.",
  beforeStatus: "Trạng thái trước hành động.",
  ai: "Cấu hình hoặc chỉ số AI theo schema của response hiện tại.",
  allergenExclusionsApplied: "Các loại trừ dị ứng backend đã áp dụng khi gợi ý.",
  allergenSelectionCompleted: "Bước chọn dị ứng đã hoàn tất hay chưa.",
  allergens: "Các bản ghi chất gây dị ứng trong master data.",
  app: "Tên ứng dụng hoặc cấu hình ứng dụng theo schema.",
  auth: "Thông tin xác thực/khởi động phiên backend theo schema.",
  averageChangeKgPerDay:
    "Thay đổi cân nặng trung bình mỗi ngày có khoảng đo, kg/ngày; null nếu không đủ dữ liệu.",
  basisQuantity: "Lượng cơ sở của phép quy đổi dinh dưỡng snapshot.",
  basisUnit: "Đơn vị của basisQuantity.",
  bio: "Giới thiệu cá nhân trong hồ sơ.",
  blocked: "Số lần chạy AI bị chặn theo policy trong thống kê.",
  bulkRequests: "Metadata retry của các lần thêm kho theo batch.",
  candidateLimitPerType: "Giới hạn ứng viên mỗi loại mà backend dùng trong ranking.",
  categories: "Danh mục master data hoặc dữ liệu tổng hợp danh mục theo schema.",
  categorySnapshot: "Thông tin danh mục được chụp tại thời điểm lưu.",
  changePercent: "Mức thay đổi theo phần trăm so với mốc cơ sở; null khi không tính được.",
  claimKey: "Khóa nội bộ chống xử lý trùng trong worker, không phải API token.",
  comment: "Nội dung phản hồi/bình luận theo schema endpoint.",
  commentCount: "Số bình luận đã được bộ đếm service ghi nhận.",
  comments: "Dữ liệu bình luận theo scope của response.",
  community: "Feature flag cộng đồng được công khai cho client.",
  config: "Cấu hình khởi động công khai của ứng dụng.",
  contentTypes: "Các loại nội dung được hỗ trợ trong scope hiện tại.",
  count: "Số lượng của chỉ số/bucket hiện tại, không âm.",
  counts: "Tập các bộ đếm theo tên chỉ số trong schema.",
  createdBy: "ID tài khoản tạo bản ghi.",
  updatedBy: "ID tài khoản cập nhật gần nhất.",
  deletionError: "Có lỗi xóa object storage cần xử lý lại hay không.",
  deliveryKey: "Khóa chống gửi trùng thông báo trong worker.",
  deviceName: "Tên thiết bị hiển thị cho bản ghi FCM token.",
  dietTypes: "Các chế độ ăn công thức/cấu hình hỗ trợ theo schema.",
  disclaimer: "Thông tin giới hạn áp dụng của kết quả AI/dinh dưỡng do backend trả.",
  dismissed: "Số report ở trạng thái dismissed trong scope thống kê.",
  email:
    "Email do identity/profile backend xác định; client không tự thay identity Firebase qua trường này.",
  entryCount: "Số bản ghi nhật ký được tính vào summary.",
  enums: "Các enum công khai để client xây dựng lựa chọn phù hợp backend.",
  errorCode: "Mã lỗi đã được lọc của lần chạy AI hoặc xử lý nền.",
  etag: "ETag metadata của object storage, không phải token xác thực.",
  evaluated: "Số trường hợp có dữ liệu đánh giá theo định nghĩa metrics.",
  failed: "Số lần chạy/hành động failed trong phạm vi thống kê.",
  failureCode: "Mã nguyên nhân thất bại của tác vụ nền.",
  failureReason: "Mô tả lỗi đã chuẩn hóa của tác vụ nền.",
  fcmTokens: "Bản ghi token thiết bị nội bộ; DTO tài khoản công khai không trả raw token.",
  fcmTokensVersion: "Phiên bản cập nhật danh sách token thiết bị nội bộ.",
  feature: "Tính năng AI chat/meal_plan/ingredient_recognition/video_summary theo enum.",
  featured: "Các mục nội dung được chọn nổi bật cho scope hiện tại.",
  feedbackCoverage: "Độ bao phủ feedback trên các runs đủ điều kiện theo metrics.",
  field: "Tên trường thuộc dữ liệu kiểm tra/lỗi.",
  firebaseUid: "UID identity từ Firebase, khác ObjectId tài khoản backend.",
  flagged: "Các lần gửi report theo bucket ở content trends, không phải số target duy nhất.",
  foodItems: "Các thực phẩm chuẩn theo scope của response.",
  gender: "Lựa chọn giới tính theo enum; nullable khi schema cho phép chưa cung cấp.",
  hash: "Giá trị băm nội bộ phục vụ kiểm tra/chống trùng, không phải secret client cần giải mã.",
  headers: "Metadata HTTP header theo schema; upload binary phải dùng requiredHeaders được trả.",
  helpful: "Số feedback helpful trong phạm vi tổng hợp.",
  hidden: "Số content hiện hidden trong scope thống kê.",
  homeSectionSize: "Kích thước section trang chủ do cấu hình công khai xác định.",
  imageUrl: "URL ảnh dùng cho master data; input yêu cầu HTTPS không chứa username/password.",
  inputMetadata: "Metadata đầu vào tác vụ được backend quản lý/lọc; không phải toàn bộ prompt gốc.",
  ipHash: "IP đã băm phục vụ audit/chống lạm dụng; không phải địa chỉ IP thuần.",
  isEstimate: "Dinh dưỡng/số lượng có tính ước lượng theo nguồn dữ liệu hay không.",
  key: "Khóa định danh của item metadata theo schema.",
  kind: "Loại media image/video theo enum.",
  limits: "Giới hạn tính năng công khai để client xây dựng request.",
  lockedBy: "Chủ thể worker đang giữ khóa xử lý nội bộ.",
  masterDataVersions: "Phiên bản master data phục vụ cache/đồng bộ client.",
  matched: "Thông tin nguyên liệu đã khớp kho theo schema.",
  message: "Thông báo đọc được bởi người dùng; phân loại xử lý bằng code thay vì so sánh message.",
  method: "HTTP method của hành động/resource được mô tả.",
  moderationCase: "Case kiểm duyệt liên quan đến kết quả hành động.",
  newInRange: "Số tài khoản mới có createdAt trong range, theo scope dashboard.",
  newUsers: "Chuỗi tài khoản mới nhóm theo createdAt.",
  normalizedName: "Tên được chuẩn hóa phục vụ tìm kiếm/chống trùng.",
  normalizedQuery: "Truy vấn đã chuẩn hóa cho lịch sử tìm kiếm.",
  nutrition: "Tập chỉ số dinh dưỡng theo schema, đơn vị nằm trong tên trường.",
  nutritionBasis: "Cơ sở lượng/khẩu phần của dinh dưỡng snapshot.",
  nutritionProfile: "Hồ sơ dinh dưỡng của người gọi trong response tổng hợp.",
  nutritionSummary: "Tổng dinh dưỡng của kế hoạch/ngày theo scope response.",
  onboarding: "Trạng thái onboarding trong dữ liệu tổng hợp.",
  onboardingCompleted: "Tài khoản đã hoàn tất onboarding hay chưa.",
  open: "Số report ở trạng thái open theo scope dashboard.",
  optional: "Nguyên liệu có thể bỏ qua trong công thức theo khai báo.",
  outputMetadata: "Metadata đầu ra đã được backend quản lý/lọc; không phải raw provider response.",
  pageSize: "Kích thước trang thực tế hoặc cấu hình trang theo schema response.",
  pantryMatch: "Kết quả khớp công thức với kho, gồm lượng đủ/thiếu và tỷ lệ.",
  parentHidden:
    "Bình luận cha không còn hiển thị; client dùng trạng thái này khi trình bày chuỗi trả lời.",
  pending: "Số content hiện pending_review theo scope dashboard.",
  pendingAndHidden: "Định nghĩa phạm vi của bộ đếm pending và hidden.",
  platform: "Nền tảng của thiết bị FCM; input hiện hỗ trợ android.",
  points: "Các điểm dữ liệu của chuỗi thời gian theo schema.",
  post: "Bài đăng hoặc thống kê bài đăng theo schema.",
  postType: "Loại bài community/blog khi validator hỗ trợ.",
  posts: "Danh sách bài đăng trong scope hiện tại.",
  profile: "Hồ sơ cá nhân theo scope của response, không đồng nghĩa hồ sơ public.",
  published: "Số content xuất bản theo bucket/phạm vi được definitions giải thích.",
  publishedInRange: "Content hiện published/public, chưa xóa, có publishedAt trong range.",
  pushLockedBy: "Worker đang giữ khóa gửi push nội bộ.",
  pushStatus: "Trạng thái gửi push theo enum/schema.",
  query: "Truy vấn gốc hoặc dữ liệu query đã lưu theo schema.",
  rangeCounts: "Định nghĩa các bộ đếm sử dụng phạm vi thời gian dashboard.",
  ranking: "Thông tin cách backend xếp hạng và phạm vi ứng viên.",
  ratingAverage: "Điểm rating trung bình của target.",
  ratingCount: "Số rating được tính cho target.",
  ratingSum: "Tổng điểm rating phục vụ tính trung bình.",
  ratings: "Các rating/metadata rating theo scope response.",
  reactionCount: "Tổng reaction được bộ đếm service ghi nhận.",
  reactions: "Reaction hoặc metadata reaction theo scope response.",
  reasons: "Các lý do/căn cứ gợi ý hoặc xử lý theo schema.",
  recentSearches: "Lịch sử tìm kiếm riêng trong response khởi động.",
  recipe: "Công thức hoặc chỉ số công thức theo schema.",
  recipes: "Danh sách công thức trong scope hiện tại.",
  recommendation: "Cấu hình/metadata gợi ý theo schema.",
  rejectionReason: "Lý do từ chối nội dung đã lưu bởi admin.",
  reportReasons: "Các lý do báo cáo được tổng hợp cho case kiểm duyệt.",
  reports: "Report hoặc chỉ số report theo schema.",
  resolved: "Số report ở trạng thái resolved theo scope dashboard.",
  resource: "Thông tin resource liên quan trong DTO audit/kết quả.",
  reviewing: "Số report ở trạng thái reviewing theo scope dashboard.",
  runs: "Tập lần thực thi AI hoặc số runs theo schema.",
  saveCount: "Số lượt lưu target được bộ đếm service ghi nhận.",
  savedItems: "Nội dung đã lưu riêng của owner theo scope response.",
  schemaValidRate: "Tỷ lệ output AI đạt schema theo tập runs đủ điều kiện.",
  searchSuggestions: "Các gợi ý tìm kiếm công khai theo scope cấu hình.",
  severityNote: "Ghi chú mức độ nghiêm trọng do người xử lý cung cấp.",
  sortOrder: "Thứ tự hiển thị theo schema master data.",
  successRate: "Tỷ lệ runs AI completed theo định nghĩa metrics, không phải accuracy.",
  suspended: "Số tài khoản hiện suspended trong scope thống kê.",
  suspendedUsers: "Target bị đình chỉ duy nhất mỗi bucket từ audit trong user trends.",
  text: "Nội dung văn bản theo schema.",
  timestamp: "Timestamp ISO 8601 của kết quả/kiểm tra.",
  type: "Loại resource/hành động theo enum của endpoint, không dùng chung enum giữa mọi API.",
  unavailable: "Thông tin hoặc số resource/dependency không khả dụng theo schema.",
  units: "Các đơn vị quantity được backend hỗ trợ.",
  url: "URL media có quyền truy cập khi do media service trả; có thể có hạn.",
  usage: "Thông tin sử dụng token/tài nguyên theo schema.",
  user: "Tài khoản đã lọc theo scope DTO; không chứa raw FCM tokens trong Account response.",
  users: "Tập tài khoản hoặc thống kê tài khoản theo schema.",
  versionPolicy: "Cấu hình minimum/latest/forceUpdate của ứng dụng.",
  video: "Video hoặc thống kê video theo schema.",
  videos: "Danh sách video trong scope hiện tại.",
  viewCount: "Số lượt xem sau cơ chế chống đếm lặp; không tăng ở mọi request đọc.",
  viewHistories: "Lịch sử xem riêng của owner trong scope response.",
  viewReceipts: "Receipt băm chống đếm lượt xem lặp, do backend quản lý.",
};

export function fieldDescription(name, schema = {}) {
  let description = fields[name];
  if (name === "at" && schema.format === "date-time")
    description = "Mốc thời gian ISO 8601 có offset hoặc UTC; không phải giờ HH:mm của lịch lặp.";
  if (name === "version" && schema.type === "string")
    description = "Phiên bản phần mềm theo response (khác version số dùng CAS cập nhật nội dung).";
  if (/^[1-5]$/.test(name)) description = `Số lượt đánh giá ${name} sao trong distribution.`;
  if (!description && /(?:Id|Ids)$/.test(name))
    description = `ID tham chiếu ${name}; xem resource tương ứng và kiểm tra quyền ở service.`;
  if (!description && /(?:At)$/.test(name))
    description = `Timestamp ${name}, ISO 8601 khi schema khai báo date-time.`;
  if (!description && /(?:Kcal|G|Mg|Mcg|Kg|Cm|Ml|Seconds|Minutes)$/.test(name)) {
    const unit = name.match(/Kcal|Mcg|Mg|Kg|Cm|Ml|Seconds|Minutes|G$/)?.[0];
    description = `${name}: giá trị tính bằng ${{ Kcal: "kcal", G: "gram", Mg: "mg", Mcg: "microgram", Kg: "kg", Cm: "cm", Ml: "ml", Seconds: "giây", Minutes: "phút" }[unit]}.`;
  }
  description ??= `Trường ${name.replace(/([a-z])([A-Z])/g, "$1 $2")} trong đối tượng hiện tại; kiểu và giới hạn được khai báo trong schema.`;
  if (schema.default !== undefined) description += ` Mặc định: ${JSON.stringify(schema.default)}.`;
  if (schema.enum) description += ` Giá trị cho phép: ${schema.enum.join(", ")}.`;
  if (schema.pattern === "^[a-fA-F0-9]{24}$" || /a-f.*24/i.test(schema.pattern ?? ""))
    description += " ObjectId gồm 24 ký tự hexadecimal.";
  return description;
}

export function annotateSchemas(schemas) {
  const copy = structuredClone(schemas);
  function visit(schema, name) {
    schema.description ??= fieldDescription(name, schema);
    for (const [key, value] of Object.entries(schema.properties ?? {})) visit(value, key);
    for (const option of schema.anyOf ?? schema.oneOf ?? []) visit(option, name);
    if (schema.items) visit(schema.items, `${name} item`);
    if (typeof schema.additionalProperties === "object")
      visit(schema.additionalProperties, `${name} value`);
  }
  for (const [name, schema] of Object.entries(copy)) {
    visit(schema, name);
    if (/Response$/.test(name))
      schema.description = `Envelope thành công của ${name.replace(/Response$/, "")}; data là kết quả nghiệp vụ, meta chứa requestId và metadata được khai báo.`;
    else if (/(Body|Query|Params)$/.test(name))
      schema.description = `Dữ liệu ${name.match(/Body|Query|Params$/)[0]} của ${name.replace(/Body$|Query$|Params$/, "")}; required/default/enum/giới hạn theo validator thật, các quy tắc kiểm tra chéo xem description của operation.`;
  }
  return copy;
}

// Stable synthetic values: IDs/URLs are illustrative and must be replaced with real records.
export function schemaExample(schema, schemas, name = "", depth = 0) {
  if (depth > 15) throw new Error(`Recursive example: ${name}`);
  if (schema.$ref)
    return schemaExample(schemas[schema.$ref.split("/").at(-1)], schemas, name, depth + 1);
  if (schema.const !== undefined) return schema.const;
  if (schema.enum && schema.default !== undefined && !schema.enum.includes(schema.default))
    return schema.enum.includes(String(schema.default)) ? String(schema.default) : schema.enum[0];
  if (schema.default !== undefined) return structuredClone(schema.default);
  if (schema.enum) return schema.enum[0];
  if (schema.anyOf || schema.oneOf) {
    const options = schema.anyOf ?? schema.oneOf;
    const option =
      name === "requestId"
        ? options.find((s) => s.type === "string")
        : options.find((s) => s.type === "null");
    return schemaExample(option ?? options[0], schemas, name, depth + 1);
  }
  const type = Array.isArray(schema.type) ? schema.type.find((t) => t !== "null") : schema.type;
  if (type === "null") return null;
  if (type === "object" || schema.properties) {
    return Object.fromEntries(
      (schema.required ?? []).map((key) => [
        key,
        schemaExample(schema.properties[key], schemas, key, depth + 1),
      ]),
    );
  }
  if (type === "array")
    return Array.from(
      { length: Math.min(schema.maxItems ?? Infinity, Math.max(schema.minItems ?? 0, 1)) },
      () => schemaExample(schema.items, schemas, name, depth + 1),
    );
  if (type === "boolean") return name === "isVegetarian" || name === "enabled";
  if (type === "number" || type === "integer") {
    let value = Math.max(
      schema.minimum ?? 0,
      schema.exclusiveMinimum != null ? schema.exclusiveMinimum + 1 : 1,
    );
    if (name === "endSeconds") value = Math.max(value, 60);
    if (schema.maximum != null) value = Math.min(value, schema.maximum);
    if (schema.exclusiveMaximum != null) value = Math.min(value, schema.exclusiveMaximum - 1);
    return type === "integer" ? Math.ceil(value) : value;
  }
  if (type === "string" || schema.pattern || schema.format) {
    let value = "Ví dụ";
    if (/a-f.*24/i.test(schema.pattern ?? "") || /^(?:_id|id)$|Ids?$/.test(name))
      value = "507f1f77bcf86cd799439011";
    if (name === "allergenExclusion") value = "507f1f77bcf86cd799439011";
    if (schema.format === "uuid") value = "123e4567-e89b-42d3-a456-426614174000";
    if (schema.format === "date-time") value = "2026-10-04T08:00:00+07:00";
    if (schema.format !== "date-time") {
      if (schema.format === "date" || /\\d\{4\}.*\\d\{2\}/.test(schema.pattern ?? ""))
        value = "2026-10-04";
      if (/\[01\]|2\[0-3\]/.test(schema.pattern ?? "")) value = "08:00";
    }
    if (name === "dateOfBirth") value = "1995-01-01";
    if (name === "timezone") value = "Asia/Ho_Chi_Minh";
    if (name === "locale") value = "vi-VN";
    if (schema.format === "uri" || schema.format === "url" || /Url$|^url$/.test(name))
      value = "https://example.com/media/example.jpg";
    if (schema.format === "email" || name === "email") value = "user@example.com";
    if (name === "slug" || name === "idOrSlug") value = "dau-hu-rau-cu";
    if (name === "requestId") value = "swagger-example-request";
    if (name === "filename") value = "dau-hu.jpg";
    if (name === "token") value = "example-fcm-registration-token";
    if (name === "firebaseUid") value = "example-firebase-uid";
    if (schema.maxLength != null) value = value.slice(0, schema.maxLength);
    if (schema.minLength != null) value = value.padEnd(schema.minLength, "a");
    return value;
  }
  throw new Error(`Unsupported example schema: ${name}`);
}

export function requestExamples(route, registry) {
  const schema = registry.schemas[route.request.body];
  const validator = registry.container.validation[route.operationId].body;
  const options = schema.anyOf ?? schema.oneOf ?? [schema];
  const examples = {};
  for (const [index, option] of options.entries()) {
    let value = schemaExample(option, registry.schemas);
    if (!validator.safeParse(value).success && option.properties) {
      for (const [name, property] of Object.entries(option.properties)) {
        if (name === "version") continue;
        const candidate = { ...value, [name]: schemaExample(property, registry.schemas, name) };
        if (validator.safeParse(candidate).success) {
          value = candidate;
          break;
        }
      }
    }
    const result = validator.safeParse(value);
    if (!result.success)
      throw new Error(
        `Invalid Swagger request example ${route.operationId}: ${JSON.stringify(result.error.issues)}`,
      );
    const branch = value.sourceType ?? value.schedule?.mode ?? `example${index + 1}`;
    examples[branch] = {
      summary: `Payload hợp lệ${options.length > 1 ? ` (${branch})` : ""}`,
      description:
        "Dữ liệu minh họa qua validator; thay ID bằng bản ghi thật có quyền truy cập. Ví dụ không chứng minh resource/provider tồn tại.",
      value,
    };
  }
  for (const [key, value] of Object.entries(curatedRequests[route.operationId] ?? {})) {
    const result = validator.safeParse(value);
    if (!result.success)
      throw new Error(
        `Invalid curated Swagger example ${route.operationId}.${key}: ${JSON.stringify(result.error.issues)}`,
      );
    examples[key] = {
      summary: key.replace(/_/g, " "),
      description:
        "Ví dụ nghiệp vụ hợp lệ theo validator. Thay ID và thời điểm bằng resource/dữ liệu thật; service vẫn kiểm tra quyền, trạng thái, dị ứng và dependency.",
      value,
    };
  }
  return examples;
}

const exampleId = "507f1f77bcf86cd799439011";
const exampleRecipeId = "507f191e810c19729de860ea";
const curatedRequests = {
  createFoodItem: {
    Thuc_pham_vegan: {
      name: "Đậu hũ",
      categoryId: exampleId,
      defaultServing: { amount: 100, unit: "g", gramEquivalent: 100 },
      nutritionPer100g: { caloriesKcal: 76, proteinG: 8, carbsG: 2, fatG: 4, fiberG: 1 },
      isVegan: true,
      isVegetarian: true,
      containsEggs: false,
      containsDairy: false,
    },
  },
  updateFoodItem: {
    Cap_nhat_thanh_phan: {
      isVegan: false,
      isVegetarian: true,
      containsEggs: true,
      containsDairy: false,
    },
  },
  updateMyProfile: {
    Doi_ten: { displayName: "Người dùng Vegan" },
    Xoa_avatar_legacy: { avatarUrl: null },
  },
  upsertMyProfile: {
    Ho_so_ca_nhan: {
      bio: "Yêu thích nấu món thuần chay",
      dietType: "vegan",
      dateOfBirth: "1995-01-01",
      locale: "vi-VN",
      timezone: "Asia/Ho_Chi_Minh",
    },
  },
  upsertMyNutritionProfile: {
    Muc_tieu_ngay: {
      heightCm: 170,
      currentWeightKg: 65,
      activityLevel: "moderate",
      goal: "maintain",
      dailyCalorieTarget: 2000,
      proteinTargetG: 80,
      carbTargetG: 250,
      fatTargetG: 60,
      fiberTargetG: 30,
      waterTargetMl: 2000,
      allergenIds: [exampleId],
    },
  },
  updateOnboarding: {
    Lua_chon_ban_dau: {
      dietType: "vegan",
      allergenIds: [exampleId],
      goal: "maintain",
      activityLevel: "moderate",
      heightCm: 170,
      currentWeightKg: 65,
      timezone: "Asia/Ho_Chi_Minh",
    },
  },
  addFcmToken: {
    Dang_ky_thiet_bi: {
      token: "example-fcm-registration-token",
      platform: "android",
      deviceName: "Android của tôi",
    },
  },
  createRecipe: {
    Cong_thuc_co_nguyen_lieu: {
      title: "Đậu hũ áp chảo",
      summary: "Món thuần chay đơn giản",
      servings: 2,
      prepMinutes: 10,
      cookMinutes: 15,
      difficulty: "easy",
      ingredients: [
        { foodItemId: exampleId, quantity: 200, unit: "g", gramEquivalent: 200, order: 1 },
      ],
      steps: [{ order: 1, instruction: "Cắt đậu hũ và áp chảo đến vàng đều.", timerSeconds: 600 }],
      visibility: "public",
    },
  },
  updateRecipe: { Cap_nhat_co_version: { title: "Đậu hũ áp chảo mới", version: 0 } },
  addPantryItem: {
    Nguyen_lieu_co_han: {
      foodItemId: exampleId,
      quantity: 500,
      unit: "g",
      expiresAt: "2026-10-11T23:59:59+07:00",
      note: "Bảo quản trong tủ lạnh",
    },
  },
  addPantryItemsBulk: {
    Nhieu_nguyen_lieu_retry: {
      idempotencyKey: "pantry-bulk-example-001",
      items: [{ foodItemId: exampleId, quantity: 500, unit: "g" }],
    },
  },
  createMealPlan: {
    Ke_hoach_co_bua: {
      title: "Kế hoạch tuần",
      weekStartDate: "2026-10-05",
      days: [
        { date: "2026-10-05", meals: [{ type: "lunch", recipeId: exampleRecipeId, servings: 2 }] },
      ],
    },
  },
  generateGroceryListFromPlan: { Tru_kho_hien_tai: { name: "Mua sắm tuần", subtractPantry: true } },
  createGroceryList: {
    Danh_sach_co_muc_tu_nhap: {
      name: "Đi chợ",
      items: [{ nameSnapshot: "Rau theo mùa", quantity: 500, unit: "g" }],
    },
  },
  addGroceryItem: {
    Thuc_pham_chuan: { foodItemId: exampleId, quantity: 200, unit: "g" },
    Muc_tu_nhap: { nameSnapshot: "Rau theo mùa", quantity: 500, unit: "g" },
  },
  createDiaryEntry: {
    Mon_tu_nhap: {
      sourceType: "custom",
      date: "2026-10-04",
      mealType: "lunch",
      nameSnapshot: "Bữa trưa tự nhập",
      servings: 1,
      nutritionSnapshot: { caloriesKcal: 450, proteinG: 20, carbsG: 60, fatG: 15, fiberG: 8 },
    },
  },
  createUploadRequest: {
    Anh_cong_thuc: {
      filename: "dau-hu.jpg",
      mimeType: "image/jpeg",
      sizeBytes: 102400,
      purpose: "recipe",
    },
    Video: { filename: "nau-an.mp4", mimeType: "video/mp4", sizeBytes: 10485760, purpose: "video" },
  },
  createVideo: {
    Video_co_transcript: {
      title: "Cách nấu đậu hũ",
      videoMediaId: exampleId,
      durationSeconds: 120,
      transcript: "Chuẩn bị đậu hũ, cắt miếng, áp chảo rồi trình bày.",
      chapters: [
        { title: "Chuẩn bị", startSeconds: 0, endSeconds: 60 },
        { title: "Nấu", startSeconds: 60, endSeconds: 120 },
      ],
    },
  },
  updateVideoProgress: { Tien_do_xem: { progressSeconds: 60, completed: false } },
  createMealPlanProposal: {
    De_xuat_ba_ngay: {
      startDate: "2026-10-05",
      days: 3,
      preferences: "Món thuần chay dễ nấu trong 30 phút",
    },
  },
  confirmMealPlanProposal: {
    Chon_bua_va_kich_hoat: {
      title: "Kế hoạch đã chọn",
      activate: true,
      days: [
        { date: "2026-10-05", meals: [{ slot: "lunch", recipeId: exampleRecipeId, servings: 2 }] },
      ],
    },
  },
  confirmPantryProposal: {
    Chon_nguyen_lieu: {
      items: [{ foodItemId: exampleId, quantity: 300, unit: "g", expiryDate: "2026-10-11" }],
    },
  },
  generateVideoSummary: {
    Tom_tat_tu_transcript: {
      mediaId: exampleId,
      transcript: "Video hướng dẫn sơ chế và áp chảo đậu hũ.",
    },
  },
  createReminder: {
    Nhac_mot_lan: {
      type: "custom",
      title: "Đi chợ",
      body: "Mua nguyên liệu cho tuần tới",
      schedule: { mode: "once", at: "2026-10-11T08:00:00+07:00", timezone: "Asia/Ho_Chi_Minh" },
    },
    Nhac_hang_ngay: {
      type: "water",
      title: "Uống nước",
      body: "Ghi nhận lượng nước vừa uống",
      schedule: { mode: "daily", at: "08:00", timezone: "Asia/Ho_Chi_Minh" },
    },
    Nhac_hang_tuan: {
      type: "meal",
      title: "Chuẩn bị bữa ăn",
      body: "Kiểm tra kế hoạch tuần",
      schedule: {
        mode: "weekly",
        at: "18:00",
        daysOfWeek: [1, 3, 5],
        timezone: "Asia/Ho_Chi_Minh",
      },
    },
  },
};

export function operationDescription(route, summary, registry) {
  const validator = registry.container.validation[route.operationId];
  const sections = [
    summary + ".",
    `**Quyền truy cập:** ${authNotes[route.auth]}`,
    `**Nghiệp vụ:** ${moduleNotes[route.module]}`,
  ];
  if (operationNotes[route.operationId]) sections.push(operationNotes[route.operationId]);
  if (/^(submit|publish|reject)(Recipe|Post|Video)$/.test(route.operationId)) {
    sections.push(
      "Chuyển trạng thái qua endpoint chuyên biệt; trạng thái nguồn phải hợp lệ. version tùy chọn để phát hiện xung đột; reject yêu cầu reason. Xuất bản còn kiểm tra tính đầy đủ và media/tham chiếu.",
    );
  }
  if (route.request.body) {
    sections.push(
      `**Request:** application/json; ${validator.body.safeParse({}).success ? "có thể bỏ body hoặc gửi {} để dùng hành vi/default theo schema" : "body bắt buộc, các trường bắt buộc được đánh dấu trong schema"}. Không gửi trường ngoài schema khi additionalProperties=false.`,
    );
    if (route.method === "PATCH" && !validator.body.safeParse({}).success)
      sections.push(
        "PATCH phải gửi ít nhất một trường được chỉnh sửa; bỏ qua trường để giữ nguyên, null chỉ hợp lệ khi schema cho phép.",
      );
  }
  if (route.request.query)
    sections.push(
      "**Query:** xem danh sách tham số để biết bộ lọc, default và giới hạn. page bắt đầu từ 1 nếu endpoint phân trang; không gửi chuỗi 'undefined' hoặc 'null' thay cho tham số bị bỏ qua.",
    );
  sections.push(
    `**Response:** HTTP ${route.status}; envelope {success:true,data,meta}. data theo schema ${route.response}; meta.requestId khớp X-Request-Id. Danh sách có metadata phân trang khi schema khai báo.`,
  );
  sections.push(
    "**Lỗi:** envelope {success:false,error:{code,message,details},meta:{requestId}}. 400 là dữ liệu/điều kiện nghiệp vụ không hợp lệ; 404 có thể che resource không được phép truy cập. Xem responses cho lỗi xác thực, xung đột, giới hạn và dependency. Các mã lỗi chung là khả năng của middleware, không bảo đảm mọi nhánh xuất hiện ở mọi request.",
  );
  return sections.join("\n\n");
}

export const requestIdHeader = {
  description:
    "ID đối chiếu request/log, bằng meta.requestId. Server giữ X-Request-Id đầu vào nếu hợp lệ (1–64 ký tự chữ/số/gạch dưới/gạch nối), nếu không tạo ID mới.",
  schema: { type: "string", maxLength: 64 },
  example: "swagger-example-request",
};

export function errorExample(status) {
  const errors = {
    400: ["VALIDATION_ERROR", "Validation failed"],
    401: ["UNAUTHORIZED", "Authentication required"],
    403: ["FORBIDDEN", "Access denied"],
    404: ["NOT_FOUND", "Resource not found"],
    409: ["CONFLICT", "Resource state conflict"],
    413: ["PAYLOAD_TOO_LARGE", "Request payload too large"],
    422: ["AI_VIDEO_UNSUPPORTED", "Video summary requires a transcript"],
    429: ["TOO_MANY_REQUESTS", "Too many requests"],
    500: ["INTERNAL_ERROR", "Internal server error"],
    502: ["AI_PROVIDER_ERROR", "AI provider request failed"],
    503: ["SERVICE_UNAVAILABLE", "Required dependency unavailable"],
  };
  const [code, message] = errors[status];
  return {
    success: false,
    error: {
      code,
      message,
      details:
        status === "400" || status === 400
          ? [
              {
                location: "body",
                path: "exampleField",
                code: "invalid_type",
                message: "Invalid field value",
              },
            ]
          : [],
    },
    meta: { requestId: "swagger-example-request" },
  };
}
