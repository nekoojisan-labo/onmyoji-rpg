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
