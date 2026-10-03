function List({ items }: { items: string[] }) {
  return (
    <ul className="m-0 mt-2 space-y-1 pl-5">
      {items.map((i) => (
        <li key={i}>{i}</li>
      ))}
    </ul>
  );
}

export function About() {
  return (
    <div className="max-w-xl">
      <h1 className="m-0 text-2xl font-bold">記録について</h1>
      <p className="mt-3">
        きづきタイムは、YouTubeをやめさせるものではありません。使っている途中で、「今なぜ見ているか」にそっと気づくための道具です。
        止めることも、続けることも、いつもあなたが決めます。
      </p>

      <h2 className="mb-0 mt-8 text-lg font-bold">記録していること</h2>
      <List items={['YouTubeを使った時間（画面に表示されていた時間）', 'YouTubeを開いた日時と、閉じた日時', 'あなたが選んだ・入力した目的', '気づきの質問への、あなたの答え']} />

      <h2 className="mb-0 mt-8 text-lg font-bold">記録していないこと</h2>
      <List items={['動画のタイトルやURL', '検索した言葉や視聴履歴', '動画の内容（AIなどによる判定もしません）', 'YouTube以外のサイトの利用']} />

      <h2 className="mb-0 mt-8 text-lg font-bold">データの保存場所</h2>
      <p className="mt-2">
        記録はお使いのChromeの中（拡張機能の保存領域）にだけあり、サーバーには送られません。このページは、その記録を読み取って表示しています。
        設定画面からいつでも全部削除できます。
      </p>
    </div>
  );
}
