/*
  【旅行データの編集場所】
  このファイルを書き換えると、サイトの文章や予定が変わります。
  文字は "..." の間に入力してください。
  項目の最後のカンマ , や、波括弧 { } を誤って消さないよう注意。
  編集後に Ctrl + S で保存 → index.html を開いて F5 で更新。
*/
window.TRIP_DATA = {
  updatedAt: "2026.11.04",
  status: "旅行先・宿泊先は家族で相談中",
  destination: "検討中",
  stayName: "未定",
  transport: "アルファード1台（予定）",
  members: "大人5人 ＋ 子供2人",
  membersDetail: "大人5人と子供2人、計7人で行く1泊2日の家族旅行。",
  duration: "1泊2日",
  dates: [
    {
      label: "OPTION A",
      range: "12月4日(金) 〜 5日(土)",
      badge: "候補日",
      detail: "2026年。家族の予定と宿の空き状況を確認中。"
    },
    {
      label: "OPTION B",
      range: "12月11日(金) 〜 12日(土)",
      badge: "有力候補",
      detail: "2026年。仕事の都合ではこちらが有力。"
    }
  ],
  // 旅行先や宿が決まるまでは空 [] のままでOK。
  // 例：{ name: "○○温泉旅館", area: "新潟県", status: "検討中", memo: "露天風呂あり", url: "https://example.com" }
  lodgingCandidates: [],
  itinerary: [
    {
      name: "1日目｜出発して、旅行先へ",
      steps: [
        { title: "集合・出発", detail: "場所・時刻はこれから相談" },
        { title: "道中で休憩・立ち寄り", detail: "子供たちの休憩も考えて計画" },
        { title: "宿泊先へ到着", detail: "宿が決まったらチェックイン時刻を記入" },
        { title: "夕食・自由時間", detail: "宿泊プランに合わせて決める" }
      ]
    },
    {
      name: "2日目｜旅先を楽しんで、帰宅",
      steps: [
        { title: "朝食・朝の時間", detail: "宿泊先に合わせて調整" },
        { title: "チェックアウト", detail: "時間は予約内容を確認" },
        { title: "観光・休憩", detail: "行き先が決まってから検討" },
        { title: "帰宅", detail: "無理のない帰宅時間を設定" }
      ]
    }
  ],
  packing: [
    { id: "coat", label: "防寒着" },
    { id: "clothes", label: "着替え" },
    { id: "phone", label: "スマホ・充電器" },
    { id: "med", label: "常備薬・日用品" },
    { id: "kids", label: "子供用品" },
    { id: "car", label: "車の冬装備の確認" }
  ],
  updates: [
    {
      date: "2026.11.04",
      text: "当初の宿泊候補は希望日程が満室だったため、家族で行き先・宿泊先を再検討しています。日程も現在調整中です。"
    }
  ]
};
