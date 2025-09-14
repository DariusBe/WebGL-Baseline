export class Separator extends EventTarget {
  constructor(offset) {
    super();
    this.element = document.createElement("div");
    this.element.id = "separator";
    this.dirty = false; // = needs redrawing

    // Add class for styling
    this.element.classList.add("separator");
    this.setOffset(offset || 200, 0); // Default position if none provided
    document.body.appendChild(this.element);
    this.width = this.element.offsetWidth;

    const stop = document.createElement("div");
    stop.classList.add("separator-stop");
    this.element.appendChild(stop);
    this.element.appendChild(stop.cloneNode(true));
    this.element.appendChild(stop.cloneNode(true));

    // when dirty changes, dispatch an event
    Object.defineProperty(this, "dirty", {
      set(value) {
        this._dirty = value;
        this.element.dispatchEvent(new CustomEvent("dirty", { detail: value }));
      },
      get() {
        return this._dirty;
      },
    });

    let dragging = false;

    this.element.addEventListener("mousedown", (e) => {
      dragging = true;
      document.body.style.cursor = "col-resize";
      e.preventDefault();

      const onMouseMove = (e) => {
        if (!dragging) return;
        const newX = Math.max(0, e.clientX); // Clamp to left edge
        this.setOffset(newX);
        this.element.dispatchEvent(
          new CustomEvent("separator-move", { detail: { offset: newX } })
        );
      };

      const onMouseUp = () => {
        dragging = false;
        document.body.style.cursor = "";
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
        this.element.dispatchEvent(
          new CustomEvent("separator-stop", {
            detail: { offset: this.element.offsetLeft },
          })
        );
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    });
  }

  setOffset = (offset) => {
    this.element.style.left = `${offset}px`;
  };

  remove = () => {
    this.element.remove();
  };
}
