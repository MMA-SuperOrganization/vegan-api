const placeholder = /change_me|placeholder|example|your[_ -]?(email|password)/i;

export function validateCommunitySeedConfig(seed = {}) {
  const email = seed.email?.trim().toLowerCase();
  const password = seed.password?.trim();
  const displayName = seed.displayName?.trim() || "Minh Ăn Xanh";

  if (!email || !/^\S+@\S+\.\S+$/.test(email) || placeholder.test(email))
    throw new Error("Set SEED_COMMUNITY_EMAIL to a real test login email");
  if (!password || password.length < 12 || placeholder.test(password))
    throw new Error("Set SEED_COMMUNITY_PASSWORD to at least 12 non-placeholder characters");
  if (displayName.length > 100) throw new Error("SEED_COMMUNITY_DISPLAY_NAME is too long");

  return { email, password, displayName };
}

export function buildCommunityDemoPosts({
  authorId,
  recipeIds = [],
  foodItemIds = [],
  categoryIds = [],
  now,
}) {
  const shared = {
    authorId,
    categoryIds,
    mediaIds: [],
    postType: "community",
    visibility: "public",
    deletedAt: null,
    rejectionReason: null,
  };
  const posts = [
    [
      "crispy-tofu",
      "3 mẹo giúp đậu hũ giòn lâu mà không cần chiên ngập dầu",
      "Mình ép bớt nước trong đậu hũ khoảng 15 phút, áo một lớp bột bắp thật mỏng rồi nướng ở nhiệt độ cao. Khi trộn sốt, hãy chờ đến sát lúc ăn để lớp vỏ vẫn giòn. Cách này hợp cho những hôm muốn ăn nhẹ nhưng vẫn đủ đạm.",
      ["đậu-hũ", "mẹo-bếp", "giàu-đạm"],
      0,
    ],
    [
      "weekly-meal",
      "Chuẩn bị bữa chay cho cả tuần trong 90 phút",
      "Mình chia việc thành ba nhóm: nấu một loại ngũ cốc, sơ chế hai loại rau và chuẩn bị hai phần sốt. Trong tuần chỉ cần phối lại theo khẩu vị nên bữa ăn không bị lặp và cũng giảm lãng phí thực phẩm.",
      ["meal-prep", "ăn-xanh", "tiết-kiệm"],
      null,
    ],
    [
      "leftovers",
      "Biến rau củ còn lại thành một bữa tối dễ ăn",
      "Rau củ còn ít trong tủ lạnh có thể nướng chung, thêm đậu gà và một phần sốt chanh. Mình ưu tiên cắt các nguyên liệu cùng kích thước để chín đều và tận dụng hết thực phẩm trong tuần.",
      ["không-lãng-phí", "rau-củ", "bữa-tối"],
      1,
    ],
    [
      "grain-salad",
      "Cách cân bằng vị cho món salad ngũ cốc",
      "Một bát salad dễ ăn thường cần đủ bốn vị: chua từ chanh, béo từ bơ hạt, ngọt nhẹ từ rau củ nướng và mặn vừa từ nước tương. Thêm hạt rang sau cùng để giữ độ giòn.",
      ["salad", "ngũ-cốc", "mẹo-bếp"],
      2,
    ],
    [
      "chickpea-lunch",
      "Đậu gà là cứu tinh cho bữa trưa bận rộn",
      "Mình luôn để sẵn một hộp đậu gà luộc trong tủ lạnh. Chỉ cần trộn cùng cà chua, dưa leo, rau thơm và sốt mè là có bữa trưa nhiều chất xơ, đủ no mà chuẩn bị chưa tới mười phút.",
      ["đậu-gà", "bữa-trưa", "nhanh-gọn"],
      null,
    ],
    [
      "mushroom-umami",
      "Tạo vị umami cho món chay bằng nấm",
      "Nấm được áp chảo riêng ở nhiệt cao sẽ thơm và đậm vị hơn khi cho thẳng vào nồi. Mình thường kết hợp nấm hương với một chút tương miso để nước dùng có chiều sâu mà không cần nhiều muối.",
      ["nấm", "umami", "mẹo-nấu"],
      0,
    ],
    [
      "vegan-noodles",
      "Bún chay nhanh cho buổi tối ít thời gian",
      "Nước dùng rau củ có thể nấu sẵn rồi chia hộp đông lạnh. Khi ăn chỉ cần thêm bún, đậu hũ, nấm và rau xanh. Một ít chanh cùng rau thơm giúp bát bún chay tươi vị hơn.",
      ["bún-chay", "đậu-hũ", "bữa-tối"],
      1,
    ],
    [
      "lentil-protein",
      "Tăng protein thực vật với đậu lăng",
      "Đậu lăng đỏ chín nhanh, hợp nấu súp và cà ri; đậu lăng xanh giữ hình tốt hơn cho salad. Mình nấu một lần nhiều phần rồi thêm vào từng bữa để tăng đạm và chất xơ.",
      ["đậu-lăng", "protein", "dinh-dưỡng"],
      null,
    ],
    [
      "oat-breakfast",
      "Yến mạch qua đêm không bị ngán",
      "Mình thay đổi phần topping theo mùa: chuối và bơ đậu phộng, xoài với dừa, hoặc táo quế. Hạt chia giúp hỗn hợp sánh hơn và bổ sung chất xơ cho bữa sáng.",
      ["yến-mạch", "hạt-chia", "bữa-sáng"],
      2,
    ],
    [
      "tempeh-marinade",
      "Ướp tempeh sao cho thấm vị mà không bị khô",
      "Hấp tempeh năm phút trước khi ướp giúp giảm vị đắng và hút sốt tốt hơn. Hỗn hợp nước tương, gừng, tỏi và một chút đường thốt nốt phù hợp cả áp chảo lẫn nướng.",
      ["tempeh", "ướp", "protein"],
      0,
    ],
    [
      "tofu-sauce",
      "Ba loại sốt đơn giản đi cùng đậu hũ",
      "Sốt mè rang cho vị béo, sốt chanh ớt cho vị tươi và sốt cà chua cay cho bữa tối ấm bụng. Chỉ cần đổi phần sốt là cùng một mẻ đậu hũ có thể thành nhiều món khác nhau.",
      ["đậu-hũ", "nước-sốt", "meal-prep"],
      null,
    ],
    [
      "broccoli-stems",
      "Đừng bỏ phần thân bông cải xanh",
      "Gọt lớp vỏ xơ bên ngoài rồi thái mỏng, phần thân bông cải có vị ngọt và giòn. Mình dùng để xào, làm dưa góp hoặc bào sợi trộn salad, vừa ngon vừa giảm rác bếp.",
      ["bông-cải", "không-lãng-phí", "rau-củ"],
      1,
    ],
    [
      "plant-milk",
      "Chọn sữa thực vật theo từng món",
      "Sữa đậu nành hợp món cần nhiều đạm, sữa yến mạch tạo độ sánh cho cà phê và sốt, còn sữa dừa phù hợp cà ri. Nên chọn loại không đường khi dùng để nấu.",
      ["sữa-thực-vật", "đậu-nành", "mẹo-bếp"],
      null,
    ],
    [
      "bean-storage",
      "Bảo quản các loại đậu đã nấu đúng cách",
      "Đậu sau khi nguội nên chia thành phần nhỏ cùng một ít nước luộc. Ngăn mát dùng trong ba ngày, phần còn lại cấp đông. Cách này giúp hạt đậu không bị khô và tiện dùng cho súp, salad.",
      ["các-loại-đậu", "bảo-quản", "meal-prep"],
      2,
    ],
    [
      "vegan-hotpot",
      "Nồi lẩu chay ngon nhờ rau củ nướng",
      "Hành tây, cà rốt và củ cải được nướng sơ sẽ tạo vị ngọt sâu cho nước lẩu. Thêm nấm hương, ngô và một ít tương miso ở cuối để giữ hương thơm.",
      ["lẩu-chay", "rau-củ", "nấm"],
      0,
    ],
    [
      "herb-rescue",
      "Cứu rau thơm sắp héo bằng sốt xanh",
      "Rau mùi, húng quế hoặc ngò rí có thể xay với hạt, chanh và dầu ô liu thành sốt xanh. Sốt dùng cho mì, bánh mì hoặc rau củ nướng và giữ được vài ngày trong tủ lạnh.",
      ["rau-thơm", "nước-sốt", "không-lãng-phí"],
      null,
    ],
    [
      "brown-rice",
      "Nấu gạo lứt mềm hơn mà vẫn tơi",
      "Ngâm gạo lứt trước khi nấu giúp hạt chín đều. Sau khi nồi chuyển sang giữ ấm, mình để nghỉ thêm mười phút rồi mới xới để hơi nước phân bố lại.",
      ["gạo-lứt", "ngũ-cốc", "mẹo-nấu"],
      1,
    ],
    [
      "banana-dessert",
      "Chuối chín làm món tráng miệng không cần thêm đường",
      "Chuối đông lạnh xay cùng bột cacao tạo thành kem mềm tự nhiên. Có thể thêm bơ đậu phộng hoặc hạt rang để tăng độ béo và protein.",
      ["chuối", "tráng-miệng", "không-đường"],
      null,
    ],
    [
      "sesame-dressing",
      "Sốt mè cho rau luộc và salad",
      "Mè rang xay cùng nước tương, giấm gạo và một chút gừng tạo thành sốt sánh, thơm. Nếu quá đặc, thêm từng thìa nước ấm đến khi đạt độ loãng mong muốn.",
      ["mè", "salad", "nước-sốt"],
      2,
    ],
    [
      "seasonal-shopping",
      "Đi chợ theo mùa giúp bữa chay ngon hơn",
      "Rau củ đúng mùa thường tươi, ngọt và có giá dễ chịu hơn. Mình chọn hai loại rau lá, hai loại củ và một loại quả mỗi tuần rồi xây bữa ăn quanh chúng.",
      ["đi-chợ", "rau-củ", "ăn-theo-mùa"],
      null,
    ],
    [
      "pumpkin-soup",
      "Súp bí đỏ béo mịn không cần kem sữa",
      "Bí đỏ nướng cùng hành tây rồi xay với đậu trắng sẽ tạo độ sánh và tăng protein. Một chút nhục đậu khấu hoặc tiêu đen giúp món súp thơm hơn.",
      ["bí-đỏ", "súp", "đậu-trắng"],
      0,
    ],
    [
      "sprouts-safety",
      "Rửa và bảo quản rau mầm an toàn",
      "Rau mầm cần được rửa dưới vòi nước sạch, để thật ráo và dùng sớm. Người có sức đề kháng yếu nên làm chín rau mầm thay vì ăn sống.",
      ["rau-mầm", "an-toàn-thực-phẩm", "mẹo-bếp"],
      null,
    ],
    [
      "avocado-toast",
      "Bánh mì bơ thêm đậu để no lâu hơn",
      "Nghiền bơ cùng đậu trắng, chanh và tiêu tạo lớp phết vừa béo vừa nhiều chất xơ. Thêm cà chua, hạt bí hoặc rau mầm để bữa sáng cân bằng hơn.",
      ["bơ", "đậu-trắng", "bữa-sáng"],
      1,
    ],
    [
      "curry-balance",
      "Cân bằng một nồi cà ri chay bị quá cay",
      "Thêm nước cốt dừa hoặc khoai tây giúp làm dịu vị cay. Một chút chanh ở cuối làm món cà ri bớt ngấy, còn rau xanh nên cho vào sát lúc tắt bếp.",
      ["cà-ri", "nước-cốt-dừa", "mẹo-nấu"],
      2,
    ],
  ];

  return posts.map(([key, title, content, tags, recipeIndex], index) => {
    const marker = `community-demo-${key}`;
    const recipeId = recipeIndex == null ? null : (recipeIds[recipeIndex] ?? null);
    const foodItemId = foodItemIds[index % foodItemIds.length];
    if (!recipeId && !foodItemId)
      throw new Error("Community demo posts require published recipes or active ingredients");
    return {
      marker,
      document: {
        ...shared,
        title,
        content,
        tags: [marker, ...tags],
        recipeId,
        foodItemIds: recipeId ? [] : [foodItemId],
        status: "published",
        publishedAt: new Date(now.getTime() - index * 15 * 60 * 1000),
      },
    };
  });
}
