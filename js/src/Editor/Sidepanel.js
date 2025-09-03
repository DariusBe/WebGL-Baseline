import { IconButton } from "./IconButton.js";

export class Sidepanel extends EventTarget {
  constructor() {
    super();
    // get GUI
    const gui = document.querySelector(".gui");
    // add side panel
    this.element = document.createElement("div");
    this.element.className = "sidepanel";
    this.offset = 0;
    gui.appendChild(this.element);

    this.state = {
      minimized: true,
      currentSection: null,
    };
    this.buttons = {};
    this.prepareButtons();

    this.update();
  }

  prepareButtons() {
    const buttonTitles = ["Solid", "Wireframe", "Shaded", "Grid"];
    buttonTitles.forEach((title) => {
      const button = document.createElement("icon-button");
      button.setAttribute(
        "icon",
        `resources/img/icon_${title.toLowerCase()}.svg`
      );
      button.setAttribute("title", title);
      button.setAttribute("className", "icon");
      button.onClick = () => {
        console.warn(`${title} button not yet implemented`);
      };
      button.addEventListener("click", () => {
        button.onClick();
      });
      this.buttons[title] = button;
      this.element.appendChild(button);
    });
  }

  setOffset(offset) {
    this.offset = offset || 0;
    this.element.style.left = `${offset}px`;
  }

  update() {
    if (this.state.minimized) {
      this.element.classList.add("minimized");
    } else {
      this.element.classList.remove("minimized");
    }
  }

  addSection(title) {
    const section = document.createElement("div");
    section.className = "sidepanel-section";
    section.innerHTML = `<h3>${title}</h3>`;
    this.element.appendChild(section);
    return section;
  }

  destroy() {
    this.element.remove();
  }
}
