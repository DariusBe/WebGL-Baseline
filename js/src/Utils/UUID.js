export class UUID {
  static _counter = 1;

  /**
   * Generates a UUID (Universally Unique Identifier).
   * @returns {string} A UUID string.
   */
  static generate() {
    // warrant a 32-bit compatible UUID-format: [16 Bits: DATE][8 Bits: COUNTER][8 Bits: RANDOM] of equal length, no dashes, no zeros
    // RGBA format: [16 Bits: DATE][8 Bits: COUNTER][8 Bits: RANDOM]
    const date = new Date().getTime().toString(16).padStart(16, "0"); // 16 bits for date
    const counter = (UUID._counter++).toString(16).padStart(8, "0"); // 8 bits for counter
    const random = Math.floor(Math.random() * 0xffffffff)
      .toString(16)
      .padStart(8, "0"); // 8 bits for random
    const uuid = date + counter + random; // Concatenate to form UUID
    return uuid;
  }

  /**
   * Converts a UUID to an RGBA color array.
   * @param {Object} object - The object with a getUUID method.
   * @returns {number[]} An array of RGBA values (ranging 0-1).
   */
  static uuidToRGBA(object) {
    if (typeof object.getUUID !== "function") {
      throw new Error("Object does not have a getUUID method.");
    }
    const uuid = object.getUUID();

    // Convert UUID to RGBA
    // [16 Bits: DATE][8 Bits: COUNTER][8 Bits: RANDOM]
    const r = parseInt(uuid.slice(0, 8), 16) % 256; // First 8 hex digits for red
    const g = parseInt(uuid.slice(8, 12), 16) % 256; // Next 4 hex digits for green
    const b = parseInt(uuid.slice(12, 16), 16) % 256; // Next 4 hex digits for blue
    const a = parseInt(uuid.slice(16, 24), 16) % 256; // Last 8 hex digits for alpha
    return [r / 255, g / 255, b / 255, a / 255];
  }

  equals(uuid) {
    return this === uuid || (typeof uuid === "string" && this === uuid);
  }
}
