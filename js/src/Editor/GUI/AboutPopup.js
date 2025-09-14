export class AboutPopup extends EventTarget {
  constructor() {
    super();
    this.element = document.querySelector(".about_popup");
    this.closeButton = this.element.querySelector(".about_close");
    this.aboutTitle = this.element.querySelector(".about_title");
    this.aboutText = this.element.querySelector(".about_body");
    this.aboutTitle.textContent = "About";
    // as multiline string; Newlines by using \n
    this.aboutText.textContent = `
    Overt is a lightweight open-source 3D editor based on WebGL2. It's the result of initial tests for a library to abstract the state machine of the graphics framework, but grew into a toolset to load models, create scenes, transform objects and render based on materials. 
    
    While these features are (for the most part) implemented, they still wait to be fully integrated into editor's GUI.
    
    Stay tuned for more!
    `;

    this.isVisible = false;
    this.setVisible(this.isVisible);

    this.closeButton.addEventListener("click", () => {
      this.setVisible(false);
    });
    this.closeButton.addEventListener("mouseover", () => {
      this.closeButton.style.content =
        "url('../resources/img/icon_close_hover.svg')";
    });
    this.closeButton.addEventListener("mouseout", () => {
      this.closeButton.style.content = "url('../resources/img/icon_close.svg')";
    });
  }

  setVisible(isVisible) {
    this.isVisible = isVisible;
    if (this.isVisible) {
      this.element.height = "auto";
      this.element.style.display = "flex";
    } else {
      this.element.height = "0px";
      this.element.style.display = "none";
    }
  }
}
