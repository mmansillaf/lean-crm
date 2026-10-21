import test from "node:test";
import assert from "node:assert/strict";
import { transcribeAudio } from "../../src/ai/audio/transcription.ts";
import { detectAudioFormat } from "../../src/ai/audio/transcode.ts";

test("TDD Suite: Audio & Transcripción de Notas de Voz WhatsApp", async (t) => {
  await t.test("Transcripción de buffer de audio con fallback seguro", async () => {
    const dummyAudioBuffer = Buffer.from("OggS" + "OpusHead" + "dummy_audio_bytes");
    const res = await transcribeAudio(dummyAudioBuffer, "nota.ogg");

    assert.equal(res.success, true);
    assert.ok(res.text && res.text.length > 0);
  });

  await t.test("Detección de formato OGG/Opus mediante magic bytes", () => {
    // 1. Buffer con cabecera OGG y OpusHead
    const oggOpusBuffer = Buffer.concat([
      Buffer.from([0x4f, 0x67, 0x67, 0x53]), // OggS
      Buffer.from(".......OpusHead......."),
    ]);

    const resOpus = detectAudioFormat(oggOpusBuffer);
    assert.equal(resOpus.isOggOpus, true);
    assert.ok(resOpus.mimeType.includes("codecs=opus"));

    // 2. Buffer MP3 simulado (ID3)
    const mp3Buffer = Buffer.from([0x49, 0x44, 0x33, 0x03, 0x00]);
    const resMp3 = detectAudioFormat(mp3Buffer);
    assert.equal(resMp3.isOggOpus, false);
    assert.equal(resMp3.mimeType, "audio/mpeg");
  });
});
