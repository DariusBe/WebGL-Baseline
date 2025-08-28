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
    //extract counter

    const counter = parseInt(uuid.slice(16, 24), 16);
    // extract random part
    const random = parseInt(uuid.slice(24, 32), 16);

    // spread counter into R and G channels, each taking 4 bits
    const r = (counter >> 4) & 0xff; // 8 bits
    const g = counter & 0xff; // 8 bits
    // fill B and A channels with random values
    const b = (random >> 4) & 0xff; // 8 bits
    const a = random & 0xff; // 8 bits

    return [r / 255, g / 255, b / 255, a / 255]; // Normalize to 0-1 range
  }

  equals(uuid) {
    return this === uuid || (typeof uuid === "string" && this === uuid);
  }
}
