import type { Genre, Novel, Chapter, Comment } from "./types"

// ============ GENRES ============
export const genres: Genre[] = [
  { id: "1", name: "Tiên Hiệp", slug: "tien-hiep", description: "Tu tiên, luyện đạo, thăng cấp thành tiên", icon: "Sparkles" },
  { id: "2", name: "Huyền Huyễn", slug: "huyen-huyen", description: "Thế giới huyền ảo, phép thuật, dị năng", icon: "Flame" },
  { id: "3", name: "Ngôn Tình", slug: "ngon-tinh", description: "Tình yêu lãng mạn, ngọt ngào", icon: "Heart" },
  { id: "4", name: "Kiếm Hiệp", slug: "kiem-hiep", description: "Giang hồ, võ lâm, kiếm khách", icon: "Sword" },
  { id: "5", name: "Đô Thị", slug: "do-thi", description: "Cuộc sống thành phố, hiện đại", icon: "Building" },
  { id: "6", name: "Khoa Huyễn", slug: "khoa-huyen", description: "Khoa học viễn tưởng, tương lai", icon: "Rocket" },
  { id: "7", name: "Lịch Sử", slug: "lich-su", description: "Bối cảnh lịch sử, cung đấu, chiến tranh", icon: "Crown" },
  { id: "8", name: "Hài Hước", slug: "hai-huoc", description: "Truyện vui, giải trí, nhẹ nhàng", icon: "Laugh" },
  { id: "9", name: "Trinh Thám", slug: "trinh-tham", description: "Phá án, bí ẩn, ly kỳ", icon: "Search" },
  { id: "10", name: "Quân Sự", slug: "quan-su", description: "Chiến tranh, quân đội, chiến lược", icon: "Shield" },
]

// ============ NOVELS ============
export const novels: Novel[] = [
  {
    id: "1",
    title: "Phàm Nhân Tu Tiên",
    slug: "pham-nhan-tu-tien",
    authorName: "Vong Ngữ",
    coverColor: "from-amber-500 to-orange-600",
    description: "Hàn Lập, một thiếu niên nghèo khó từ một ngôi làng nhỏ, tình cờ bước vào con đường tu tiên. Không có thiên phú xuất chúng, không có bối cảnh gia thế, chỉ bằng sự kiên trì và trí tuệ phi thường, hắn từng bước vượt qua muôn vàn khó khăn, chiến đấu với yêu ma quỷ quái, đối đầu với các thế lực lớn trong tu chân giới. Từ một phàm nhân bình thường, Hàn Lập dần dần khám phá ra bí mật của thiên địa, tìm kiếm con đường trường sinh bất lão.",
    genres: ["tien-hiep", "huyen-huyen"],
    status: "Hoàn thành",
    totalChapters: 2446,
    views: 5840000,
    rating: 4.8,
    ratingCount: 12500,
    bookmarkCount: 89000,
    lastUpdated: "2025-12-15",
    createdAt: "2020-01-15",
  },
  {
    id: "2",
    title: "Đấu Phá Thương Khung",
    slug: "dau-pha-thuong-khung",
    authorName: "Thiên Tằm Thổ Đậu",
    coverColor: "from-blue-500 to-indigo-600",
    description: "Tiêu Viêm, từng là thiên tài trẻ tuổi nhất Ô Thản thành, bỗng nhiên mất đi toàn bộ đấu khí vào năm 11 tuổi. Ba năm sau, cậu tình cờ khám phá ra bí mật ẩn giấu trong chiếc nhẫn truyền gia, từ đó bắt đầu hành trình tu luyện phi thường. Với sự giúp đỡ của Dược Lão, Tiêu Viêm quyết tâm lấy lại vinh quang đã mất và chinh phục đỉnh cao của thế giới đấu khí.",
    genres: ["huyen-huyen", "tien-hiep"],
    status: "Hoàn thành",
    totalChapters: 1648,
    views: 4920000,
    rating: 4.6,
    ratingCount: 10800,
    bookmarkCount: 75000,
    lastUpdated: "2025-11-20",
    createdAt: "2019-06-10",
  },
  {
    id: "3",
    title: "Hoa Thiên Cốt",
    slug: "hoa-thien-cot",
    authorName: "Fresh Quả Quả",
    coverColor: "from-pink-400 to-rose-500",
    description: "Hoa Thiên Cốt kể về câu chuyện tình yêu xuyên suốt ba kiếp giữa Hoa Thiên Cốt và Bạch Tử Họa. Nàng là đệ tử của Trường Lưu môn, chàng là chưởng môn Trường Lưu - sư phụ của nàng. Mối tình cấm đoán giữa sư đồ, những hiểu lầm, hy sinh và sự kiên trung trong tình yêu khiến độc giả không khỏi xúc động.",
    genres: ["ngon-tinh", "tien-hiep"],
    status: "Hoàn thành",
    totalChapters: 580,
    views: 3200000,
    rating: 4.5,
    ratingCount: 8900,
    bookmarkCount: 62000,
    lastUpdated: "2025-10-05",
    createdAt: "2021-03-22",
  },
  {
    id: "4",
    title: "Anh Hùng Xạ Điêu",
    slug: "anh-hung-xa-dieu",
    authorName: "Kim Dung",
    coverColor: "from-emerald-500 to-teal-600",
    description: "Câu chuyện về Quách Tĩnh, một chàng trai chất phác nhưng kiên trì, cùng Hoàng Dung, cô gái thông minh tuyệt đỉnh. Giữa bối cảnh đất nước bị xâm lăng, hai người cùng nhau trải qua bao sóng gió giang hồ, học được những tuyệt kỹ võ công, và cuối cùng trở thành anh hùng dân tộc.",
    genres: ["kiem-hiep", "lich-su"],
    status: "Hoàn thành",
    totalChapters: 240,
    views: 7800000,
    rating: 4.9,
    ratingCount: 15600,
    bookmarkCount: 120000,
    lastUpdated: "2025-08-10",
    createdAt: "2018-01-01",
  },
  {
    id: "5",
    title: "Toàn Chức Cao Thủ",
    slug: "toan-chuc-cao-thu",
    authorName: "Hồ Điệp Lam",
    coverColor: "from-cyan-500 to-blue-600",
    description: "Diệp Tu, đỉnh cao của giới game Glory, bị buộc phải rời đội tuyển chuyên nghiệp. Nhưng với mười năm kinh nghiệm và kỹ thuật vô song, anh bắt đầu lại từ đầu tại một quán net nhỏ. Với tài khoản mới và quyết tâm mãnh liệt, Diệp Tu từng bước quay trở lại đỉnh cao vinh quang.",
    genres: ["do-thi", "hai-huoc"],
    status: "Hoàn thành",
    totalChapters: 1728,
    views: 3600000,
    rating: 4.7,
    ratingCount: 9200,
    bookmarkCount: 68000,
    lastUpdated: "2025-09-28",
    createdAt: "2020-07-15",
  },
  {
    id: "6",
    title: "Thôn Phệ Tinh Không",
    slug: "thon-phe-tinh-khong",
    authorName: "Thần Đông",
    coverColor: "from-violet-500 to-purple-600",
    description: "Trong tương lai, khi Trái Đất trải qua biến cố lớn, con người phát hiện ra năng lực chiến đấu tiềm ẩn. La Phong, một thanh niên bình thường, tình cờ gặp được một sinh vật ngoài hành tinh đặc biệt, từ đó bắt đầu hành trình chinh phục vũ trụ bao la. Từ Trái Đất đến các vì sao, La Phong dần trở thành chiến sĩ mạnh nhất thiên hà.",
    genres: ["khoa-huyen", "huyen-huyen"],
    status: "Đang ra",
    totalChapters: 1890,
    views: 2800000,
    rating: 4.4,
    ratingCount: 7600,
    bookmarkCount: 52000,
    lastUpdated: "2026-03-01",
    createdAt: "2021-11-08",
  },
  {
    id: "7",
    title: "Khánh Dư Niên",
    slug: "khanh-du-nien",
    authorName: "Miêu Nị",
    coverColor: "from-yellow-500 to-amber-600",
    description: "Phạm Nhàn, một thanh niên từ thế giới hiện đại, xuyên không đến một thế giới cổ đại với ký ức về một nền văn minh đã mất. Với kiến thức từ kiếp trước, hắn dần vượt qua các âm mưu cung đình, chiến đấu với các thế lực ngầm, và khám phá ra bí mật kinh thiên về nguồn gốc của thế giới này.",
    genres: ["lich-su", "huyen-huyen"],
    status: "Hoàn thành",
    totalChapters: 1168,
    views: 4100000,
    rating: 4.7,
    ratingCount: 11200,
    bookmarkCount: 85000,
    lastUpdated: "2025-07-20",
    createdAt: "2019-12-01",
  },
  {
    id: "8",
    title: "Yêu Thần Ký",
    slug: "yeu-than-ky",
    authorName: "Phát Tiêu Đích Mao Nhi",
    coverColor: "from-red-500 to-rose-600",
    description: "Nhiếp Ly, vị Yêu Thần hùng mạnh nhất, bị phản bội và hy sinh trong trận chiến cuối cùng. Nhưng khi tỉnh dậy, hắn phát hiện mình đã quay trở lại thời niên thiếu. Với kinh nghiệm và kiến thức từ kiếp trước, Nhiếp Ly quyết tâm thay đổi vận mệnh, cứu lấy những người thân yêu và ngăn chặn thảm họa sắp xảy đến.",
    genres: ["huyen-huyen", "tien-hiep"],
    status: "Đang ra",
    totalChapters: 956,
    views: 2100000,
    rating: 4.3,
    ratingCount: 6500,
    bookmarkCount: 43000,
    lastUpdated: "2026-02-28",
    createdAt: "2022-05-10",
  },
  {
    id: "9",
    title: "Thiên Quan Tứ Phúc",
    slug: "thien-quan-tu-phuc",
    authorName: "Mặc Hương Đồng Khứu",
    coverColor: "from-sky-400 to-indigo-500",
    description: "Tạ Liên, thái tử triều đại Tiên Lạc, ba lần phi thăng thành thiên quan và ba lần bị đánh rơi. Tám trăm năm sau, ngài lại một lần nữa phi thăng, nhưng lần này không ai chào đón. Trong hành trình thu thập công đức, Tạ Liên gặp lại Hoa Thành - một Quỷ vương bí ẩn có mối quan hệ sâu xa với ngài từ tám trăm năm trước.",
    genres: ["ngon-tinh", "huyen-huyen"],
    status: "Hoàn thành",
    totalChapters: 244,
    views: 5200000,
    rating: 4.9,
    ratingCount: 14800,
    bookmarkCount: 98000,
    lastUpdated: "2025-06-15",
    createdAt: "2020-09-01",
  },
  {
    id: "10",
    title: "Thám Tử Lừng Danh",
    slug: "tham-tu-lung-danh",
    authorName: "Linh Vũ",
    coverColor: "from-slate-500 to-zinc-700",
    description: "Lâm Phong, một thanh tra cảnh sát trẻ tuổi với khả năng quan sát phi thường, liên tiếp phá giải những vụ án bí ẩn nhất thành phố. Mỗi vụ án đều ẩn chứa những bí mật đen tối, và càng đi sâu, Lâm Phong càng phát hiện ra một tổ chức tội phạm khổng lồ đang ẩn nấp trong bóng tối.",
    genres: ["trinh-tham", "do-thi"],
    status: "Đang ra",
    totalChapters: 678,
    views: 1800000,
    rating: 4.5,
    ratingCount: 5400,
    bookmarkCount: 35000,
    lastUpdated: "2026-03-02",
    createdAt: "2023-01-20",
  },
  {
    id: "11",
    title: "Đại Quân Sư",
    slug: "dai-quan-su",
    authorName: "Trần Phong",
    coverColor: "from-green-600 to-emerald-700",
    description: "Trương Lương, một thiên tài quân sự thời hiện đại, xuyên không về thời Tam Quốc. Với kiến thức chiến thuật vượt thời đại, hắn trở thành quân sư cho một thế lực nhỏ và từng bước thay đổi cục diện thiên hạ. Những trận chiến sử thi, những mưu kế thâm sâu, tất cả đều được tái hiện qua góc nhìn của một người hiện đại.",
    genres: ["quan-su", "lich-su"],
    status: "Đang ra",
    totalChapters: 420,
    views: 1500000,
    rating: 4.4,
    ratingCount: 4800,
    bookmarkCount: 28000,
    lastUpdated: "2026-03-03",
    createdAt: "2023-06-15",
  },
  {
    id: "12",
    title: "Vạn Giới Thần Chủ",
    slug: "van-gioi-than-chu",
    authorName: "Nhất Niệm Vĩnh Hằng",
    coverColor: "from-orange-500 to-red-600",
    description: "Lâm Phàm tình cờ có được một mảnh ngọc bội cổ xưa có thể mở cánh cửa đến vạn giới. Mỗi thế giới đều có quy tắc riêng, sức mạnh riêng, và nguy hiểm riêng. Lâm Phàm phải chinh phục từng thế giới, thu thập sức mạnh và trí tuệ, để cuối cùng trở thành bá chủ vạn giới.",
    genres: ["tien-hiep", "huyen-huyen"],
    status: "Đang ra",
    totalChapters: 1200,
    views: 2300000,
    rating: 4.2,
    ratingCount: 5800,
    bookmarkCount: 38000,
    lastUpdated: "2026-03-04",
    createdAt: "2022-08-20",
  },
]

// ============ SAMPLE CHAPTER CONTENT ============
const sampleContent = `
Buổi sáng hôm ấy, khi ánh nắng đầu tiên xuyên qua lớp sương mù dày đặc bao phủ ngọn núi, một bóng người mờ ảo xuất hiện trên con đường mòn dẫn lên đỉnh.

Gió thổi nhẹ, mang theo hương thơm của hoa dại hai bên đường. Những giọt sương còn đọng trên lá cỏ lấp lánh như những viên ngọc nhỏ dưới ánh mặt trời. Cảnh vật yên bình đến lạ thường, hoàn toàn trái ngược với tâm trạng hỗn loạn bên trong người thanh niên đang bước đi.

"Ta phải mạnh hơn nữa," hắn tự nhủ, đôi mắt nhìn thẳng về phía trước với ánh quyết tâm. "Chỉ có sức mạnh mới có thể bảo vệ được những người quan trọng."

Hắn dừng lại trước một tảng đá lớn, nơi có khắc một dòng chữ cổ đã mờ theo thời gian. Dù không đọc được hết, nhưng hắn hiểu ý nghĩa của nó - đây là ranh giới giữa thế giới phàm trần và cõi tu tiên.

Hít một hơi thật sâu, hắn bước qua tảng đá. Ngay lập tức, linh khí tràn ngập khắp cơ thể, mỗi tế bào đều rung động như được tiếp thêm sức sống mới. Cảm giác này... thật tuyệt vời.

"Chào mừng ngươi đến Thanh Vân Sơn," một giọng nói trầm ấm vang lên từ phía trước. Một vị lão nhân áo trắng xuất hiện, tóc bạc phơ nhưng khuôn mặt hồng hào, đôi mắt sáng như sao.

"Vãn bối bái kiến tiền bối," hắn vội vàng cúi đầu hành lễ.

Vị lão nhân mỉm cười, vẫy tay: "Không cần đa lễ. Ta đã chờ ngươi rất lâu rồi. Ngươi có muốn biết vì sao ta biết ngươi sẽ đến đây không?"

Hắn ngẩng đầu, đôi mắt tràn đầy tò mò. Đây chính là bước ngoặt thay đổi cuộc đời hắn mãi mãi.

Lão nhân quay người, bước chân nhẹ nhàng như lướt trên mặt đất: "Đi theo ta. Con đường phía trước còn rất dài, nhưng mỗi bước đi đều có ý nghĩa của nó."

Và thế là, câu chuyện về một phàm nhân bước chân vào thế giới tu tiên đã chính thức bắt đầu. Không ai biết được rằng, chàng trai trẻ bình thường này, một ngày nào đó sẽ khiến cả tam giới phải rung chuyển.

Hai người đi dọc theo con đường đá quanh co, xuyên qua những rừng trúc xanh mướt. Tiếng suối chảy róc rách đâu đó phía xa, hòa cùng tiếng chim hót líu lo tạo nên một bản nhạc thiên nhiên tuyệt đẹp.

"Thanh Vân Sơn có bảy đỉnh," vị lão nhân vừa đi vừa giải thích. "Mỗi đỉnh đại diện cho một phái tu luyện khác nhau. Ngươi sẽ được phân vào đỉnh phù hợp nhất với căn cốt của mình."

"Căn cốt?" hắn hỏi, không giấu được sự tò mò.

"Đúng vậy. Mỗi người đều có căn cốt khác nhau, quyết định con đường tu luyện của họ. Có người sinh ra với kim linh căn, thích hợp luyện kiếm. Có người mang mộc linh căn, giỏi về y thuật và đan dược. Và cũng có những người..."

Lão nhân dừng lại, nhìn hắn với ánh mắt đầy ý nghĩa: "...có những người mang trong mình căn cốt đặc biệt mà ngàn năm mới xuất hiện một lần."

Tim hắn đập nhanh hơn. Liệu mình có phải là người như vậy không? Hay chỉ là một phàm nhân bình thường giữa biết bao thiên tài?

Dù thế nào đi nữa, hắn đã quyết định rồi. Dù phải đối mặt với bao nhiêu khó khăn, dù con đường phía trước có gian nan đến đâu, hắn sẽ không bao giờ bỏ cuộc.

Bởi vì, đó là lời hứa hắn đã thề với bản thân mình.
`

// ============ CHAPTERS ============
function generateChapters(novelId: string, count: number): Chapter[] {
  const chapterTitles: Record<string, string[]> = {
    "1": ["Thiếu niên nhập môn", "Mặc Đại Phu", "Bảy Huyền Môn", "Luyện khí kỳ", "Thất tinh kiếm", "Đại chiến đầu tiên", "Bí mật chiếc nhẫn", "Huyết sắc thí luyện", "Thiên cơ bất khả lộ", "Kim đan kỳ"],
    "2": ["Thiên tài sụp đổ", "Dược Lão bí ẩn", "Đấu khí hồi phục", "Thi đấu gia tộc", "Vân Lam tông", "Xà mãng thôn", "Hỏa diễm cốc", "Thiên giai đấu kỹ", "Hắc giác vực", "Đấu đế truyền thừa"],
    "3": ["Trường Lưu sơn", "Sư phụ bí ẩn", "Kiếm pháp nhập môn", "Thi luyện bắt đầu", "Yêu thần xuất hiện", "Ký ức tiền kiếp", "Huyết lệ chi hoa", "Đại chiến ma tộc", "Tam sinh duyên", "Tình kiếp luân hồi"],
    "4": ["Gió tanh mưa máu", "Quách Tĩnh luyện công", "Hoàng Dung xuất hiện", "Đào Hoa Đảo", "Cửu Âm Chân Kinh", "Hoa Sơn luận kiếm", "Tương Dương thành", "Đại chiến Kim quốc", "Anh hùng hội", "Thiên hạ đệ nhất"],
    "5": ["Vinh quang đánh mất", "Quán net nhỏ", "Tài khoản mới", "Đồng đội cũ", "Giải đấu mùa xuân", "Chiến thuật mới", "Đối thủ xứng tầm", "Bán kết kịch tính", "Vinh quang trở lại", "Đỉnh cao Glory"],
    "6": ["Trái Đất biến cố", "Năng lực thức tỉnh", "Sinh vật ngoài hành tinh", "Hành tinh số 9", "Chiến binh tinh cầu", "Vương quốc băng giá", "Đại chiến thiên hà", "Hố đen vũ trụ", "Siêu cấp tiến hóa", "Bá chủ tinh không"],
    "7": ["Xuyên không kỳ duyên", "Đan Miếu kỳ ngộ", "Kinh đô phong vân", "Bắc Tề sứ đoàn", "Giám Sát Viện", "Ám sát chi vương", "Đại Đông Sơn", "Thiên tử thủ đoạn", "Khánh quốc phong vân", "Nhất niệm vĩnh hằng"],
    "8": ["Quay ngược thời gian", "Khởi đầu mới", "Ngọn lửa Yêu Linh", "Yêu Thần truyền thừa", "Hắc Hỏa gia tộc", "Thánh linh sơn", "Ma thú rừng s��u", "Đại chiến Yêu tộc", "Linh hồn thức tỉnh", "Đỉnh cao Yêu Thần"],
    "9": ["Ba lần phi thăng", "Phế thần rơi rụng", "Thu rác kiếm tiền", "Quỷ vương xuất hiện", "Bàn Ty động", "Bán Nguyệt Quan", "Cổ thư bí mật", "Tứ đại hại", "Thiên đình gió mây", "Hoa nở thành đôi"],
    "10": ["Vụ án đầu tiên", "Dấu vết bí ẩn", "Nhân chứng im lặng", "Bóng tối rình rập", "Sự thật phơi bày", "Kẻ chủ mưu", "Mạng lưới tội ác", "Đối mặt quỷ dữ", "Công lý phán xét", "Ánh sáng cuối đường"],
    "11": ["Xuyên về Tam Quốc", "Quân sư nhỏ", "Trận chiến đầu tiên", "Liên minh bất ngờ", "Xích Bích phong vân", "Mưu kế thâm sâu", "Thiên hạ tam phân", "Bắc phạt đại kế", "Long tranh hổ đấu", "Thống nhất thiên hạ"],
    "12": ["Ngọc bội cổ xưa", "Thế giới đầu tiên", "Quy tắc dị giới", "Sức mạnh nguyên thủy", "Cánh cửa thứ hai", "Vạn giới chi bí", "Tử thần thế giới", "Linh hồn bất diệt", "Vạn giới đại chiến", "Thần chủ giáng lâm"],
  }

  const titles = chapterTitles[novelId] || chapterTitles["1"]
  const displayCount = Math.min(count, 10)
  const chapters: Chapter[] = []

  for (let i = 1; i <= displayCount; i++) {
    chapters.push({
      id: `${novelId}-${i}`,
      novelId,
      number: i,
      title: titles[(i - 1) % titles.length],
      content: sampleContent,
      views: ((parseInt(novelId) * 7919 + i * 6131) % 50000) + 5000,
      createdAt: new Date(2025, 0, i * 3).toISOString().split("T")[0],
    })
  }
  return chapters
}

// ============ COMMENTS ============
export const comments: Comment[] = [
  { id: "c1", userId: "u1", username: "BookLover99", avatarColor: "bg-blue-500", novelId: "1", content: "Truyện hay quá! Phàm Nhân Tu Tiên là kinh điển của thể loại tiên hiệp.", createdAt: "2026-02-15" },
  { id: "c2", userId: "u2", username: "TienHiepFan", avatarColor: "bg-green-500", novelId: "1", content: "Đọc đi đọc lại mấy lần vẫn thấy hay. Hàn Lập là nhân vật nam chính được xây dựng tốt nhất.", createdAt: "2026-02-20" },
  { id: "c3", userId: "u3", username: "MeowReader", avatarColor: "bg-pink-500", novelId: "1", content: "Plot twist ở phần sau quá đỉnh, không đoán được luôn.", createdAt: "2026-03-01" },
  { id: "c4", userId: "u4", username: "NightOwl", avatarColor: "bg-amber-500", novelId: "2", content: "Tiêu Viêm quá bá đạo, mê truyện này từ lâu rồi.", createdAt: "2026-01-10" },
  { id: "c5", userId: "u5", username: "StoryHunter", avatarColor: "bg-violet-500", novelId: "2", content: "Thích nhất đoạn Tiêu Viêm thi đấu ở Gia Mã đế quốc.", createdAt: "2026-02-05" },
  { id: "c6", userId: "u1", username: "BookLover99", avatarColor: "bg-blue-500", novelId: "3", content: "Ngôn tình hay nhất tôi từng đọc. Khóc hết nước mắt.", createdAt: "2026-01-25" },
  { id: "c7", userId: "u3", username: "MeowReader", avatarColor: "bg-pink-500", novelId: "4", content: "Kim Dung viết kiếm hiệp đỉnh nhất, không ai sánh bằng.", createdAt: "2026-02-10" },
  { id: "c8", userId: "u2", username: "TienHiepFan", avatarColor: "bg-green-500", novelId: "9", content: "Thiên Quan Tứ Phúc quá hay, đọc xong muốn đọc lại ngay.", createdAt: "2026-03-02" },
  { id: "c9", userId: "u4", username: "NightOwl", avatarColor: "bg-amber-500", novelId: "7", content: "Khánh Dư Niên xây dựng thế giới quá tốt, mỗi chi tiết đều có ý nghĩa.", createdAt: "2026-02-28" },
  { id: "c10", userId: "u5", username: "StoryHunter", avatarColor: "bg-violet-500", novelId: "5", content: "Ai thích game thì phải đọc Toàn Chức Cao Thủ, cực kỳ hấp dẫn.", createdAt: "2026-01-15" },
  { id: "c11", userId: "u1", username: "BookLover99", avatarColor: "bg-blue-500", novelId: "1", chapterId: "1-1", content: "Chương mở đầu rất cuốn hút!", createdAt: "2026-02-18" },
  { id: "c12", userId: "u3", username: "MeowReader", avatarColor: "bg-pink-500", novelId: "1", chapterId: "1-1", content: "Cách miêu tả cảnh vật rất sinh động.", createdAt: "2026-02-19" },
]

// ============ DATA ACCESS FUNCTIONS ============
export function getNovelById(id: string): Novel | undefined {
  return novels.find((n) => n.id === id)
}

export function getNovelBySlug(slug: string): Novel | undefined {
  return novels.find((n) => n.slug === slug)
}

export function getNovelsByGenre(genreSlug: string): Novel[] {
  return novels.filter((n) => n.genres.includes(genreSlug))
}

export function getGenreBySlug(slug: string): Genre | undefined {
  return genres.find((g) => g.slug === slug)
}

export function getChaptersByNovelId(novelId: string): Chapter[] {
  const novel = novels.find((n) => n.id === novelId)
  if (!novel) return []
  return generateChapters(novelId, novel.totalChapters)
}

export function getChapter(novelId: string, chapterNumber: number): Chapter | undefined {
  const chapters = getChaptersByNovelId(novelId)
  return chapters.find((c) => c.number === chapterNumber)
}

export function getCommentsByNovelId(novelId: string): Comment[] {
  return comments.filter((c) => c.novelId === novelId && !c.chapterId)
}

export function getCommentsByChapterId(chapterId: string): Comment[] {
  return comments.filter((c) => c.chapterId === chapterId)
}

export function searchNovels(query: string): Novel[] {
  const q = query.toLowerCase()
  return novels.filter(
    (n) =>
      n.title.toLowerCase().includes(q) ||
      n.authorName.toLowerCase().includes(q) ||
      n.description.toLowerCase().includes(q)
  )
}

export function getPopularNovels(limit = 6): Novel[] {
  return [...novels].sort((a, b) => b.views - a.views).slice(0, limit)
}

export function getLatestNovels(limit = 6): Novel[] {
  return [...novels].sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()).slice(0, limit)
}

export function getTopRatedNovels(limit = 6): Novel[] {
  return [...novels].sort((a, b) => b.rating - a.rating).slice(0, limit)
}

export function formatViews(views: number): string {
  if (views >= 1000000) return (views / 1000000).toFixed(1) + "M"
  if (views >= 1000) return (views / 1000).toFixed(1) + "K"
  return views.toString()
}
