// 全定数の集約点。契約 §2 Global Constraints の数値をここに一元化する。
// 後続群（camera / move / damage / kegare / chinkon / billboard）はここを参照する。
export const CONFIG = {
  // 内部解像度（CSS等比フィット）
  internalWidth: 1280,
  internalHeight: 720,

  // カメラ（オルソ・yaw45/pitch30固定・回転しない）
  camera: {
    yawDeg: 45,
    pitchDeg: 30,
    clipNear: -1000,
    clipFar: 1000,
    // 画面に収めるワールド幅（unit）。後続 G2 IsoCamera が viewWorldWidth に使う
    viewWorldWidth: 18,
    // 追従デッドゾーン半径（unit）
    deadZone: 1.5,
    // 追従lerp係数（0..1・フレーム毎）
    followLerp: 0.12,
  },

  // fog（藍墨）と環境光
  fog: {
    color: 0x10131c,
    near: 12,
    far: 40,
  },

  // 移動（A2-1 / B1.2）
  move: {
    baseMoveSpeed: 4.0, // unit/s
  },

  // 回避 i-frame（B1.2）
  iframe: {
    dashDistance: 2.5,        // unit
    totalSec: 0.45,           // 全体
    invincibleStartSec: 0.05, // 無敵開始
    invincibleEndSec: 0.28,   // 無敵終了
    cooldownSec: 0.6,         // クールダウン
  },

  // 五行倍率（00b §3）
  element: {
    shoseiMul: 0.85,  // 相生（不利方向）
    sokokuMul: 1.25,  // 相克（攻撃側有利）
    neutralMul: 1.0,  // 無関係・同属性
  },

  // 穢ゲージ段階閾値（00b §2.3）
  kegare: {
    light: 40,
    heavy: 70,
    berserk: 100,
  },

  // 鎮魂（00b §2.4）
  chinkon: {
    hpRatio: 0.30,    // HP30%以下で窓
    channelSec: 1.5,  // チャネル
  },

  // ビルボード既定（足元アンカー）
  billboard: {
    defaultWidth: 1.0,
    defaultHeight: 1.8,
  },
} as const;

export const INTERNAL_WIDTH = CONFIG.internalWidth;
export const INTERNAL_HEIGHT = CONFIG.internalHeight;

export const CAMERA_YAW_DEG = CONFIG.camera.yawDeg;
export const CAMERA_PITCH_DEG = CONFIG.camera.pitchDeg;
export const CAMERA_NEAR = CONFIG.camera.clipNear;
export const CAMERA_FAR = CONFIG.camera.clipFar;
export const CAMERA_VIEW_WORLD_WIDTH = CONFIG.camera.viewWorldWidth;
export const CAMERA_DEADZONE_X = CONFIG.camera.deadZone;
export const CAMERA_DEADZONE_Z = 1.0;
export const CAMERA_FOLLOW_LERP = CONFIG.camera.followLerp;

export const FOG_COLOR = CONFIG.fog.color;
export const FOG_NEAR = CONFIG.fog.near;
export const FOG_FAR = CONFIG.fog.far;

export const AMBIENT_COLOR = 0x8898b0 as const;
export const AMBIENT_INTENSITY = 0.9 as const;

export const BASE_MOVE_SPEED = CONFIG.move.baseMoveSpeed;

// 回避 i-frame（B1.2 / G6.3）
export const IFRAME_TOTAL_SEC = CONFIG.iframe.totalSec;            // 回避モーション全体 0.45s
export const IFRAME_ACTIVE_FROM_SEC = CONFIG.iframe.invincibleStartSec; // 無敵開始 0.05s
export const IFRAME_ACTIVE_TO_SEC = CONFIG.iframe.invincibleEndSec;     // 無敵終了 0.28s
export const DODGE_DISTANCE = CONFIG.iframe.dashDistance;          // 回避移動距離 2.5unit
export const DODGE_COOLDOWN_SEC = CONFIG.iframe.cooldownSec;       // 回避クールダウン 0.6s

// 式神「玄」追従AI（G6.4）
export const GEN_FOLLOW_DISTANCE = 1.6;   // 主人公の後方に保つ距離(unit)。これ以内は静止（横滑り防止）
export const GEN_REGROUP_DISTANCE = 4.0;  // これより離れたら regroup（急いで寄る）
export const GEN_ATTACK_RANGE = 2.2;      // 敵がこの距離内なら attack 意図へ
export const GEN_MOVE_SPEED = 5.0;        // 玄の移動速度(unit/s・主人公より速く再合流できる)

// 鬼火童子（火）AI（G6.5）
export const ONIBIDOJI_SIGHT_RANGE = 7.0;       // 視界（前方優位の発見距離）
export const ONIBIDOJI_SENSE_RANGE = 3.0;       // 背後含む感知距離
export const ONIBIDOJI_ATTACK_RANGE = 1.4;      // 攻撃を仕掛ける距離
export const ONIBIDOJI_MOVE_SPEED = 3.2;        // 追跡移動速度(unit/s)
export const ONIBIDOJI_LEASH_RANGE = 12.0;      // 出現地点からの離脱限界（超えたら帰還）
export const ONIBIDOJI_ATTACK_WINDUP_SEC = 0.4; // 攻撃予兆時間（alert→attack 発生まで）
export const ONIBIDOJI_RECOVER_SEC = 0.6;       // 攻撃後の後隙
export const ONIBIDOJI_HURT_SEC = 0.25;         // 被弾硬直
