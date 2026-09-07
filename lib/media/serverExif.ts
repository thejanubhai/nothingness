/**
 * Server-Side EXIF & Geolocation Metadata Scrubber
 *
 * Scans image binary buffers and strips APP1 segments (0xFF, 0xE1)
 * which contain EXIF GPS coordinates, camera maker metadata, and XMP payloads.
 * Leaves standard JFIF markers (0xFF, 0xE0), DQT, DHT, and image scan data intact.
 */

export function stripServerExif(buffer: Buffer, mimeType?: string): Buffer {
  if (!buffer || buffer.length < 4) {
    return buffer;
  }

  // Check for JPEG Start Of Image marker (0xFF, 0xD8)
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    try {
      const chunks: Buffer[] = [buffer.subarray(0, 2)]; // Keep SOI
      let offset = 2;
      let strippedAny = false;

      while (offset < buffer.length - 1) {
        if (buffer[offset] !== 0xff) {
          // Reached non-marker data or entropy scan; keep the remainder
          chunks.push(buffer.subarray(offset));
          break;
        }

        const marker = buffer[offset + 1];

        // 0xDA is Start Of Scan (SOS), 0xD9 is End Of Image (EOI)
        if (marker === 0xda || marker === 0xd9) {
          chunks.push(buffer.subarray(offset));
          break;
        }

        // Check if there is enough data for marker + 2-byte length
        if (offset + 4 > buffer.length) {
          chunks.push(buffer.subarray(offset));
          break;
        }

        const segmentLength = buffer.readUInt16BE(offset + 2);
        const segmentEnd = offset + 2 + segmentLength;

        if (segmentEnd > buffer.length) {
          chunks.push(buffer.subarray(offset));
          break;
        }

        // Marker 0xE1 = APP1 (EXIF / GPS / XMP)
        if (marker === 0xe1) {
          strippedAny = true;
          // Skip the APP1 segment
          offset = segmentEnd;
        } else {
          chunks.push(buffer.subarray(offset, segmentEnd));
          offset = segmentEnd;
        }
      }

      if (strippedAny) {
        return Buffer.concat(chunks);
      }
    } catch (err) {
      console.warn('[stripServerExif] Parse fallback to original buffer:', err);
      return buffer;
    }
  }

  return buffer;
}
