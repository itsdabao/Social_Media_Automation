const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

export function detectImageType(
  bytes: Uint8Array,
): "image/jpeg" | "image/png" | null {
  if (JPEG_SIGNATURE.every((byte, index) => bytes[index] === byte)) {
    return "image/jpeg";
  }

  if (PNG_SIGNATURE.every((byte, index) => bytes[index] === byte)) {
    return "image/png";
  }

  return null;
}
