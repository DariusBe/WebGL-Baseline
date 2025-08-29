export class Sidepanel extends EventTarget {
  constructor() {
    super();
    this.element = document.querySelector(".sidepanel");
    this.state = {
      minimized: true,
      currentSection: null,
    };
    this.update();
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
}
