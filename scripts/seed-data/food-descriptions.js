// Culinary descriptions only. Regional harvest months require reviewed local data;
// an empty seasons array means unknown, rather than an invented harvest calendar.
export const FOOD_DESCRIPTIONS = Object.freeze({
  Almonds: "Hạnh nhân có vị bùi, dùng làm món ăn nhẹ, rắc lên cháo yến mạch hoặc xay thành bơ hạt.",
  Apple: "Táo có thịt giòn, vị ngọt hoặc chua tùy giống; có thể ăn tươi, làm salad hoặc nướng.",
  Avocado: "Quả bơ có thịt mềm và vị béo, thường dùng trong salad, bánh mì hoặc xay thành sốt.",
  Banana: "Chuối chín có vị ngọt và kết cấu mềm, thích hợp ăn trực tiếp, làm sinh tố hoặc bánh.",
  "Bell Pepper":
    "Ớt chuông có thịt giòn, thường có màu xanh, vàng, cam hoặc đỏ; dùng ăn sống, xào hoặc nướng.",
  "Black Beans":
    "Đậu đen có hạt nhỏ, vỏ sẫm màu; cần nấu chín trước khi dùng trong súp, cơm hoặc món hầm.",
  Blueberries:
    "Việt quất là quả mọng nhỏ màu xanh tím, dùng ăn tươi hoặc thêm vào yến mạch và sinh tố.",
  Broccoli: "Bông cải xanh gồm cụm hoa và thân non, thường được hấp, xào, nướng hoặc nấu súp.",
  "Brown Rice":
    "Gạo lứt giữ lại lớp cám, có kết cấu dai hơn gạo trắng và thường cần thời gian nấu lâu hơn.",
  Carrot: "Cà rốt là rau củ có vị ngọt nhẹ, có thể ăn sống, hấp, nướng hoặc dùng làm nền cho súp.",
  Cashews:
    "Hạt điều có vị bùi và kết cấu mềm khi ngâm, thường được dùng làm sốt kem chay hoặc bơ hạt.",
  Cauliflower:
    "Bông cải trắng có các cụm hoa màu trắng, dùng hấp, nướng, xào hoặc xay nhỏ thay cơm trong một số món.",
  "Chia Seeds":
    "Hạt chia là hạt nhỏ có khả năng tạo lớp gel khi ngâm trong chất lỏng, thường dùng làm pudding hoặc thêm vào yến mạch.",
  Chickpeas: "Đậu gà có hạt tròn và vị bùi; sau khi nấu chín có thể làm hummus, salad hoặc cà ri.",
  "Coconut Milk":
    "Nước cốt dừa được làm từ cơm dừa và nước, có kết cấu béo mịn, dùng trong cà ri, súp hoặc món tráng miệng.",
  Corn: "Bắp có hạt vị ngọt, có thể luộc, hấp, nướng hoặc tách hạt để làm salad và súp.",
  Cucumber: "Dưa leo có nhiều nước và kết cấu giòn, thường dùng ăn tươi, làm salad hoặc muối chua.",
  Edamame:
    "Edamame là đậu nành non, thường được luộc hoặc hấp rồi tách hạt để dùng trong salad và các món tô.",
  Flaxseeds:
    "Hạt lanh có màu nâu hoặc vàng; thường được xay trước khi thêm vào bánh, cháo hoặc hỗn hợp thay trứng trong làm bánh.",
  "Green Peas":
    "Đậu Hà Lan có hạt tròn màu xanh, vị ngọt nhẹ; dùng trong súp, cơm, salad hoặc món xào.",
  Kale: "Cải xoăn có lá dày, thường được xào, nướng hoặc vò nhẹ với sốt khi làm salad.",
  "Kidney Beans":
    "Đậu thận có hình quả thận, thường dùng trong món hầm và chili; đậu khô cần được sơ chế và nấu chín kỹ.",
  Lemon:
    "Chanh vàng có nước chua và vỏ thơm, dùng pha nước, làm sốt hoặc thêm hương vị cho món ăn.",
  Lentils: "Đậu lăng có hạt nhỏ, dẹt và nhiều màu; thường được nấu thành súp, cà ri hoặc món hầm.",
  Lime: "Chanh xanh có nước chua và hương thơm đặc trưng, dùng trong nước chấm, sốt hoặc đồ uống.",
  Mango:
    "Xoài có thịt quả thơm; xoài chín dùng ăn tươi và làm sinh tố, còn xoài xanh thường dùng trong salad.",
  Mushroom:
    "Nấm ăn có nhiều loại và kết cấu khác nhau, thường được dùng trong món xào, súp, sốt hoặc món nướng.",
  Mushrooms: "Nấm mỡ có mũ tròn và vị nhẹ, có thể thái lát để xào, nướng hoặc nấu cùng mì và súp.",
  Oats: "Yến mạch cán là hạt yến mạch được xử lý và cán dẹt, thường dùng nấu cháo, làm granola hoặc ngâm qua đêm.",
  Orange: "Cam là trái cây họ có múi, có thể ăn trực tiếp, ép nước hoặc dùng phần múi trong salad.",
  "Peanut Butter":
    "Bơ đậu phộng được làm từ đậu phộng xay, dùng phết bánh mì, pha sốt hoặc thêm vào sinh tố; thành phần bổ sung tùy sản phẩm.",
  Pumpkin: "Bí đỏ có thịt mềm khi nấu chín, thường dùng nấu súp, hấp, nướng hoặc làm bánh.",
  "Pumpkin Seeds": "Hạt bí có vị bùi, có thể dùng làm món ăn nhẹ hoặc rắc lên salad, súp và bánh.",
  Quinoa:
    "Diêm mạch là loại hạt dùng tương tự ngũ cốc; sau khi nấu có thể trộn salad hoặc dùng làm nền cho các món tô.",
  "Red Bell Pepper":
    "Ớt chuông đỏ có vị ngọt nhẹ và thịt giòn, thích hợp làm salad, xào, nướng hoặc xay thành sốt.",
  "Rice Noodles":
    "Mì hoặc bún gạo được làm chủ yếu từ gạo, dùng trong món nước, món xào hoặc cuốn; cách ngâm và nấu tùy dạng sản phẩm.",
  "Sesame Seeds":
    "Hạt mè có màu trắng hoặc đen, thường được rang để tăng hương thơm rồi dùng trong sốt, bánh và món trộn.",
  Spinach: "Cải bó xôi có lá mềm và nấu nhanh, dùng trong salad, súp, món xào hoặc sinh tố.",
  Strawberries:
    "Dâu tây là quả mọng màu đỏ, thường dùng ăn tươi, làm sinh tố, mứt hoặc món tráng miệng.",
  "Sweet Potato":
    "Khoai lang có vị ngọt tự nhiên và nhiều giống khác màu, thường được hấp, luộc, nướng hoặc làm súp.",
  Tahini:
    "Tahini là hỗn hợp mè xay mịn, thường dùng làm hummus, nước sốt salad hoặc sốt pha với chanh và nước.",
  Tempeh:
    "Tempeh là thực phẩm làm từ đậu nành lên men ép thành khối, có kết cấu chắc; thường được thái lát rồi áp chảo hoặc nướng.",
  Tofu: "Đậu hũ được làm từ sữa đậu nành đông tụ, có nhiều độ mềm; dùng trong món kho, xào, súp hoặc món tráng miệng.",
  Tomato: "Cà chua có vị chua ngọt tùy giống, dùng ăn tươi, làm sốt, nấu súp hoặc nướng.",
  Walnuts:
    "Hạt óc chó có nhân chia thùy, vị bùi hơi đắng; dùng làm món ăn nhẹ hoặc thêm vào salad và bánh.",
  "Whole Wheat Bread":
    "Bánh mì nguyên cám sử dụng bột mì giữ thành phần của hạt, thường dùng làm bánh mì kẹp hoặc nướng giòn; cần xem thành phần từng sản phẩm.",
  "Whole Wheat Pasta":
    "Mì ống nguyên cám làm từ bột lúa mì nguyên cám, có kết cấu chắc và dùng với nhiều loại sốt hoặc rau củ.",
  Zucchini: "Bí ngòi có vỏ mỏng và thịt mềm, thường dùng xào, nướng, nấu súp hoặc bào thành sợi.",
});
