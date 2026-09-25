// lib/voice.ts — 面接官レベルごとの読み上げ音声
// レベルを変えたことが体感できるよう、声・速さ・ピッチを変える。
// edge-tts の日本語音声は Keita（男性）と Nanami（女性）の 2 つだけなので、
// 速さとピッチを組み合わせて差を作る。
import { LEVELS, isKeyOf, type LevelKey } from "./options";

export type VoiceSetting = {
    voice: string;   // edge-tts の ShortName
    rate: string;    // 速さ（"+10%" など）
    pitch: string;   // ピッチ（"-15Hz" など）
};

// クライアントから声名を受け取らず、ここで決めた組み合わせだけを使う
export const VOICE_BY_LEVEL: Record<LevelKey, VoiceSetting> = {
    kind: { voice: "ja-JP-NanamiNeural", rate: "0%", pitch: "0Hz" },     // 女性・標準
    strict: { voice: "ja-JP-KeitaNeural", rate: "+10%", pitch: "0Hz" },  // 男性・やや早口
    harsh: { voice: "ja-JP-KeitaNeural", rate: "+15%", pitch: "-15Hz" }, // 男性・低め・早口
};

export const DEFAULT_VOICE = VOICE_BY_LEVEL.kind;

// リクエストの level（信用できない値）から声を決める。不正なら既定に落とす
export function voiceFor(level: unknown): VoiceSetting {
    return isKeyOf(LEVELS, level) ? VOICE_BY_LEVEL[level] : DEFAULT_VOICE;
}
