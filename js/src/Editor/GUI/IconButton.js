export class IconButton extends HTMLElement {
  // Define observed attributes for the custom element
  static get observedAttributes() {
    return ["icon", "title", "className", "onClick"];
  }

  connectedCallback() {
    this.render();
    this.addEventListener("click", () => {
      const onClick = this.getAttribute("onClick");
      if (onClick) {
        onClick();
      }
    });
  }

  // Handle attribute changes
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
    }
  }

  render() {
    const icon = this.getAttribute("icon");
    const title = this.getAttribute("title") || "";
    const className = this.getAttribute("className") || "";
    const onClick = this.getAttribute("onClick");
    this.innerHTML = `
        <img src="${icon}" alt="${title}" class="${className}"/>
    `;
  }
}
customElements.define("icon-button", IconButton);
