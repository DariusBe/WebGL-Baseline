export class UUID {
  static _counter = 0;
  /**
   * Generates a UUID (Universally Unique Identifier).
   * @returns {string} A UUID string.
   */
  static generate() {
    this._counter = (this._counter || 0) + 1;
    const timestamp = Date.now().toString(16);
    const randomPart = Math.floor(Math.random() * 0x100000000).toString(16);
    const counterPart = this._counter.toString(16).padStart(8, "0");
    return `${timestamp}-${randomPart}-${counterPart}`;
  }

  equals(uuid) {
    return this === uuid || (typeof uuid === "string" && this === uuid);
  }
}
