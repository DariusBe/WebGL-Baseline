class ContextButton {
  constructor(action, isEnabled) {
    this.action = action;
    this.isEnabled = isEnabled;
  }
}

export class Topbar extends EventTarget {
  constructor() {
    super();
    this.element = document.querySelector(".topbar");
    this.height = this.element.clientHeight;
    this.eventRegistry = new Set();
    this.menu_popup = document.querySelector(".menu_popup");
    this.fileContext = new Map();
    this.editContext = new Map();
    this.selectionContext = new Map();
    this.viewContext = new Map();
    this.windowContext = new Map();
    this.helpContext = new Map();
    this.prepare();
  }

  prepare = () => {
    var menu_popupVisible = false;

    this.fileContext = new Map([
      [
        "New",
        new ContextButton(() => {
          this.dispatchEvent(new CustomEvent("file_new", { detail: {} }));
        }, true),
      ],
      [
        "Import",
        new ContextButton(() => {
          var input = document.createElement("input");
          input.setAttribute("type", "file");
          input.setAttribute("accept", ".obj,.gltf,.glb");
          input.dispatchEvent(new MouseEvent("click")); // opening dialog

          input.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
              const extension = file.name.split(".").pop().toLowerCase();
              const reader = new FileReader();
              reader.onload = (event) => {
                const contents = event.target.result;
                this.dispatchEvent(
                  new CustomEvent("file_import", {
                    detail: { contents, extension },
                  })
                );
              };
              reader.readAsText(file);
              // reset input
              e.target.value = null;
            }
            return false; // avoiding navigation
          });
        }, true),
      ],
    ]);

    this.editContext = new Map([
      [
        "Undo",
        new ContextButton(() => {
          this.dispatchEvent(new CustomEvent("edit_undo", { detail: {} }));
        }, true),
      ],
      [
        "Redo",
        new ContextButton(() => {
          this.dispatchEvent(new CustomEvent("edit_redo", { detail: {} }));
        }, true),
      ],
      [
        "Delete",
        new ContextButton(() => {
          this.dispatchEvent(new CustomEvent("edit_delete", { detail: {} }));
        }, true),
      ],
    ]);

    this.selectionContext = new Map([
      [
        "Select All",
        new ContextButton(() => {
          this.dispatchEvent(
            new CustomEvent("selection_select_all", { detail: {} })
          );
        }, true),
      ],
      [
        "Deselect All",
        new ContextButton(() => {
          this.dispatchEvent(
            new CustomEvent("selection_deselect_all", { detail: {} })
          );
        }, true),
      ],
    ]);

    this.viewContext = new Map([
      [
        "Toggle Wireframe",
        new ContextButton(() => {
          this.dispatchEvent(
            new CustomEvent("view_toggle_wireframe", { detail: {} })
          );
        }, true),
      ],
      [
        "Hide Extras",
        new ContextButton(() => {
          this.dispatchEvent(
            new CustomEvent("view_hide_extras", { detail: {} })
          );
        }, true),
      ],
      [
        "Hide Stats",
        new ContextButton(() => {
          this.dispatchEvent(
            new CustomEvent("view_hide_stats", { detail: {} })
          );
        }, true),
      ],
      [
        "Reset Camera",
        new ContextButton(() => {
          this.dispatchEvent(
            new CustomEvent("view_reset_camera", { detail: {} })
          );
        }, true),
      ],
    ]);

    this.windowContext = new Map([
      [
        "Split",
        new ContextButton(() => {
          this.dispatchEvent(new CustomEvent("window_split", { detail: {} }));
        }, true),
      ],
      [
        "Collapse",
        new ContextButton(() => {
          this.dispatchEvent(
            new CustomEvent("window_collapse", { detail: {} })
          );
        }, false),
      ],
    ]);

    this.helpContext = new Map([
      [
        "Documentation",
        new ContextButton(() => {
          // open link to github in new tab
          console.log("OPEN GITHUB");
          window.open(
            "https://github.com/DariusBe/WebGL-Baseline/blob/main/docs/documentation.md",
            "_blank"
          );
          this.dispatchEvent(
            new CustomEvent("window_split", {
              detail: { url: "https://github.com/your-repo" },
            })
          );
        }, true),
      ],
      [
        "About",
        new ContextButton(() => {
          console.log("// ADD FUNCTIONALITY FOR ABOUT HERE");
        }, true),
      ],
    ]);

    const prepareContext = (e, contextDescription) => {
      for (const [buttonLabel, buttonProps] of contextDescription) {
        const button = document.createElement("button");
        // set button inactive if action is not allowed
        button.disabled = !buttonProps.isEnabled;
        button.textContent = buttonLabel;

        button.addEventListener("click", buttonProps.action);
        // get event listener
        menu_popup[0].appendChild(button);
        // menu_popup to float below button (aligning either left or right, depending on available space)
        const menu_width = menu_popup[0].getBoundingClientRect().width;
        const button_rect = e.target.getBoundingClientRect();

        // Default: align left edge of popup with left edge of button
        let left = button_rect.left;

        // If not enough space to the right, align right edge of popup with right edge of button
        if (left + menu_width > window.innerWidth) {
          left = button_rect.right - menu_width;
          // Prevent negative left value
          if (left < 0) left = 0;
        }
        menu_popup[0].style.left = `${left}px`;
      }
    };

    const menu = document.getElementById("menu_items");
    const menu_popup = document.getElementsByClassName("menu_popup");
    for (const button of menu.children) {
      button.addEventListener("mouseenter", (e) => {
        // infer width of menu_popup
        menu_popup[0].innerHTML = "";

        switch (e.target.id) {
          case "file":
            prepareContext(e, this.fileContext);
            break;
          case "edit":
            prepareContext(e, this.editContext);
            break;
          case "selection":
            prepareContext(e, this.selectionContext);
            break;
          case "view":
            prepareContext(e, this.viewContext);
            break;
          case "window":
            prepareContext(e, this.windowContext);
            break;
          case "help":
            prepareContext(e, this.helpContext);
            break;
        }
      });
      button.addEventListener("click", (e) => {
        // set menu_popup visibility
        menu_popup[0].style.visibility = menu_popupVisible
          ? "hidden"
          : "visible";
        menu_popupVisible = !menu_popupVisible;
      });
      canvas.addEventListener("click", (e) => {
        menu_popup[0].style.visibility = "hidden";
        menu_popupVisible = false;
      });
    }
  };
}
