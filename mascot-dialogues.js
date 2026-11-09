/* 会話の編集場所。旅行日程は trip-data.js の departureDate を参照します。 */
window.MASCOT_DIALOGUES = {
  settings: { displayMs: 4000, seasonalProbability: 0.2, tapWindowMs: 3000, angerTapCount: 10, cooldownMs: 8000 },
  pages: {
    index: [
      { speaker: 'girl', text: 'もうすぐ旅行だね！' },
      { speaker: 'boy', text: 'あと何回寝たら旅行？' },
      { speaker: 'girl', text: 'はやく旅行いきたーい！' },
      { speaker: 'girl', text: '雪ふるかなぁ？' },
      { speaker: 'boy', text: 'いっぱい遊ぼうね！' },
      { speaker: 'boy', text: 'マイクラやりたい！' },
      { speaker: 'boy', text: 'ダイヤ見つけた！！' },
      { speaker: 'boy', text: 'クリーパーだー！逃げろー！' },
      { speaker: 'girl', text: 'ねえねえ、こっちきて！' },
      { speaker: 'girl', text: '今日はなにして遊ぶ？' }
    ],
    hotel: [
      { speaker: 'girl', text: '温泉たのしみ〜！' },
      { speaker: 'boy', text: 'おっきいお風呂だー！' },
      { speaker: 'girl', text: 'お部屋ひろーい！' },
      { speaker: 'girl', text: 'お布団ならべよー！' },
      { speaker: 'boy', text: '旅館ってお城みたい！' },
      { speaker: 'boy', text: 'バイキングだー！！' },
      { speaker: 'girl', text: 'アイスあるかな？' },
      { speaker: 'boy', text: 'おかわりくださーい！' },
      { speaker: 'girl', text: 'おなかすいた〜！' },
      { speaker: 'boy', text: 'もう一回お風呂いこ！' }
    ],
    schedule: [
      { speaker: 'boy', text: 'しゅっぱーつ！！' },
      { speaker: 'girl', text: 'まだ着かないの〜？' },
      { speaker: 'boy', text: '次はどこ行くの？' },
      { speaker: 'girl', text: '道の駅ってなに？' },
      { speaker: 'boy', text: 'あぶらげ食べてみたい！' },
      { speaker: 'girl', text: 'ねえ、まってよー！' },
      { speaker: 'girl', text: 'おやつの時間？' },
      { speaker: 'boy', text: 'まだ帰りたくなーい！' },
      { speaker: 'girl', text: 'おみやげ買おうよ！' },
      { speaker: 'boy', text: '車で寝ちゃおっかな〜' }
    ],
    budget: [
      { speaker: 'boy', text: 'おこづかいちょうだい！' },
      { speaker: 'girl', text: 'これいくらなの？' },
      { speaker: 'boy', text: 'お金いっぱいかかる？' },
      { speaker: 'girl', text: 'おみやげ買って〜！' },
      { speaker: 'boy', text: 'アイス代は別だよね？' },
      { speaker: 'boy', text: 'ぼくのお財布どこ？' },
      { speaker: 'girl', text: '100円で買えるかな？' },
      { speaker: 'boy', text: 'エメラルドで払える？' },
      { speaker: 'boy', text: 'ダイヤならいっぱいあるよ！' },
      { speaker: 'girl', text: 'えへへ、ないしょ！' }
    ],
    packing: [
      { speaker: 'girl', text: 'もう準備できたよ！' },
      { speaker: 'boy', text: 'お菓子もってきた？' },
      { speaker: 'girl', text: 'あったかい服もってこ！' },
      { speaker: 'girl', text: '忘れ物ないかな？' },
      { speaker: 'boy', text: 'くつした何個いる？' },
      { speaker: 'boy', text: 'ゲーム持っていっていい？' },
      { speaker: 'girl', text: '充電器わすれないでね！' },
      { speaker: 'boy', text: 'ぼくのおもちゃは？' },
      { speaker: 'boy', text: 'おやつはぜったい必要！' },
      { speaker: 'girl', text: 'ぜんぶチェックしたー？' }
    ]
  },
  anger: [
    { speaker: 'boy', text: 'もーっ！しつこいよ！' },
    { speaker: 'boy', text: 'ねえ！やめてってばー！' },
    { speaker: 'boy', text: 'なんでそんなにさわるの！' },
    { speaker: 'boy', text: 'ぼく、おこったからね！' },
    { speaker: 'boy', text: 'もぉ〜！ぷんぷん！' },
    { speaker: 'boy', text: 'こらー！やめろー！' },
    { speaker: 'boy', text: 'ぼくで遊ばないでよー！' },
    { speaker: 'boy', text: 'もー！わざとでしょ！' },
    { speaker: 'boy', text: 'うわーん！しつこいー！' },
    { speaker: 'boy', text: 'もう知らないもん！' },
    { speaker: 'boy', text: 'ちょっと！押しすぎだよ！' },
    { speaker: 'boy', text: 'ぼく、怒ってるんだからねっ！' },
    { speaker: 'girl', text: 'もぉ〜！やだぁ！' },
    { speaker: 'girl', text: 'しつこいよぉ〜！' },
    { speaker: 'girl', text: 'もうっ！ぷいっ！' },
    { speaker: 'girl', text: 'さわっちゃダメー！' },
    { speaker: 'girl', text: 'おこっちゃうからね！' },
    { speaker: 'girl', text: 'もー！知らないっ！' },
    { speaker: 'girl', text: 'いーっだ！' },
    { speaker: 'girl', text: 'ねえねえ！やめてよぉ！' },
    { speaker: 'girl', text: 'そんなに押さないでぇ！' },
    { speaker: 'girl', text: 'むぅ〜！ぷんぷん！' },
    { speaker: 'girl', text: 'もうあそんであげないっ！' },
    { speaker: 'girl', text: 'おこったもん！ふんっ！' }
  ],
  // remaining は日本時間の暦日による出発までの日数。{days} は実際の日数に置換。
  seasonal: [
    { min: 8, max: 30, speaker: 'boy', text: 'あと{days}日で旅行だよ！' },
    { min: 2, max: 7, speaker: 'girl', text: 'もうすぐだー！' },
    { min: 1, max: 1, speaker: 'girl', text: 'あした旅行だー！！' },
    { min: 0, max: 0, speaker: 'boy', text: 'いよいよ今日だね！' },
    { min: -1, max: -1, speaker: 'girl', text: '今日もいっぱい遊ぼ！' },
    { min: -Infinity, max: -2, speaker: 'boy', text: 'またみんなで行こうね！' }
  ]
};
