export class IconButton extends HTMLElement {
  connectedCallback() {
    const icon = this.getAttribute("icon");
    const title = this.getAttribute("title") || "";
    const className = this.getAttribute("className") || "";
    const onClick = this.getAttribute("onClick");

    this.innerHTML = `
        <img src="${icon}" alt="${title}" class="${className}"/>
    `;
    this.addEventListener("click", () => {
      if (onClick) {
        onClick();
      }
    });
  }
}
customElements.define("icon-button", IconButton);
