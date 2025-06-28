export default function FeatureIntro() {
  return (
    <section className="py-12 text-center max-w-2xl mx-auto space-y-4">
      <p className="text-lg">
        PR Checklistfy は、Pull Request のレビューを AI が支援する Chrome 拡張です。
        <br />
        過去の PR やコメントを元に、レビューチェックリストを生成し、レビューの質とスピードを向上させます。
      </p>
      <ul className="list-disc list-inside text-left space-y-2">
        <li>PRのサマリ情報の提供</li>
        <li>ファイルごとに重要レビュー箇所を箇条書きで生成</li>
        <li>ファイルごとにチャットで質問可能</li>
      </ul>
    </section>
  );
}
