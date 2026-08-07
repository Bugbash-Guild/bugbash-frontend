/**
 * モーダル表示中に背後のページがスクロールしてしまうのを止める。
 *
 * 単純に開いたら overflow:hidden、閉じたら戻す、にすると多重表示で壊れる
 * （/pass の年齢確認 → 解約確認のように2枚重なる画面が実在する）。
 * 片方が閉じただけでロックが解けて背後が動き出すので、参照カウントで管理する。
 *
 * DOM に直接触らず「スタイルを持つ何か」を受け取るのは、テスト可能にするため
 * （このプロジェクトのテストは node --test で DOM が無い）。
 */
export type LockableElement = { style: { overflow: string } };

export type ScrollLock = {
  /** ロックを1つ取得する。戻り値を呼ぶと解放（同じ解放は2回効かない）。 */
  acquire: (element: LockableElement) => () => void;
  /** 現在のロック数（テスト・デバッグ用）。 */
  count: () => number;
};

export function createScrollLock(): ScrollLock {
  let holders = 0;
  let previousOverflow: string | null = null;

  return {
    acquire(element) {
      if (holders === 0) {
        // 最初のロックだけが元の値を覚える。2枚目以降が覚えると
        // 「hidden」を復元してしまい、全部閉じても戻らなくなる。
        previousOverflow = element.style.overflow;
        element.style.overflow = "hidden";
      }
      holders += 1;

      let released = false;
      return () => {
        // 同じ解放関数が2回呼ばれてもカウントを二重に減らさない
        // （React 18 の StrictMode は effect を2回流す）
        if (released) return;
        released = true;
        holders -= 1;
        if (holders === 0) {
          element.style.overflow = previousOverflow ?? "";
          previousOverflow = null;
        }
      };
    },
    count: () => holders,
  };
}

/** アプリ全体で1つのロック（モーダルは document.body を共有するため）。 */
export const bodyScrollLock = createScrollLock();
