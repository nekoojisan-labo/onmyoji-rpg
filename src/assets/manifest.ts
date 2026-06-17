// プレースホルダー資産マニフェスト。命名規則は C6 §4.1 準拠:
//   <category>_<id>_<variant>_<dir>_<action>_<frame>@<scale>.png
// Phase0 は単色/簡易ビルボードをコード生成（engine/placeholder.ts）。
// 実画像差し替え口 = fal.ai Nano Banana(image-to-image)。
export interface PlaceholderDef {
  id: string;
  color: number;
  worldSize: { w: number; h: number };
}

export const PLACEHOLDERS: Record<'pc_nagisa' | 'sk_gen' | 'en_onibidoji', PlaceholderDef> = {
  pc_nagisa: { id: 'pc_nagisa', color: 0xe6e8f0, worldSize: { w: 1, h: 1.8 } },
  sk_gen: { id: 'sk_gen', color: 0x3a7d6a, worldSize: { w: 1, h: 1.8 } },
  en_onibidoji: { id: 'en_onibidoji', color: 0xc5443a, worldSize: { w: 0.9, h: 1.5 } },
};
