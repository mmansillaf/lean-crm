export function detectAudioFormat(buffer: Buffer): { isOggOpus: boolean; mimeType: string } {
  if (buffer.length < 4) {
    return { isOggOpus: false, mimeType: "application/octet-stream" };
  }

  // OGG container magic bytes: 0x4F 0x67 0x67 0x53 ("OggS")
  const isOgg = buffer[0] === 0x4f && buffer[1] === 0x67 && buffer[2] === 0x67 && buffer[3] === 0x53;

  if (!isOgg) {
    // MP3 ID3 header o MPEG frame
    if ((buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) || (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0)) {
      return { isOggOpus: false, mimeType: "audio/mpeg" };
    }
    // WAV header "RIFF"
    if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
      return { isOggOpus: false, mimeType: "audio/wav" };
    }
    return { isOggOpus: false, mimeType: "application/octet-stream" };
  }

  // Comprobar si contiene cabecera "OpusHead" en los primeros 100 bytes
  const headerSlice = buffer.subarray(0, 100).toString("ascii");
  const isOpus = headerSlice.includes("OpusHead");

  return {
    isOggOpus: isOpus,
    mimeType: isOpus ? "audio/ogg; codecs=opus" : "audio/ogg",
  };
}
