// Name: CSS Injector
// ID: mrk20200cssInject
// Description: Modify the page's styling with the power of CSS.
// By: Mrk20200 <https://scratch.mit.edu/users/Mrk20200/>
// License: MPL-2.0

(function (Scratch) {
  "use strict";

  if (!Scratch.extensions.unsandboxed) {
    throw new Error("The CSS Injector extension must run unsandboxed");
  }

  let replaceableStyle;
  const isPackaged = typeof scaffolding !== "undefined";
  const URLregexp = /url\((?:'|")?(.*?)(?:'|")?\)/g; // matches with url("...")
  const presetQueries = {
    stageCanvas: isPackaged
      ? "canvas.sc-canvas"
      : 'div[class^="stage_stage_"] > div > canvas',
    stageMonitors: isPackaged
      ? "div.sc-monitor-root"
      : 'div[class^="monitor_monitor-container_"] > div',
    stagePrompt: isPackaged
      ? "div.sc-question-inner"
      : 'div[class^="question_question-container_"]',
    greenFlag: isPackaged
      ? "img.green-flag-button"
      : 'img[class^="green-flag_green-flag_"]',
    pause: isPackaged ? "img.pause-button" : "img.pause-btn",
    stop: isPackaged
      ? "img.stop-all-button"
      : 'img[class^="stop-all_stop-all_"]',
    fullScreen: isPackaged
      ? "img.fullscreen-button"
      : 'div[class^="controls_controls-container_"] ~ div > div:not([class^="stage-header_stage-size-toggle-group_"])',
    controlsHeader: isPackaged
      ? "div.sc-controls-bar"
      : 'div[class^="stage-header_stage-menu-wrapper_"]',
    contentArea: "#app > *",
    scratchblocks: ".blocklyBlockBackground",
  };

  /**
   * (NOTE: only the more complicated selectors will be documented)
   * stageMonitors: The parent of the element with the outer padding
   * stagePrompt: The element with all of the outer padding and outer margin
   * controlsHeader: Parent of the parent of the green flag button (not a typo!)
   * contentArea: (should only be used for fullscreen effects, rotations, or positioning)
   * scratchblocks: The body of the blocks
   */

  const Cast = Scratch.Cast;
  const BlockType = Scratch.BlockType;
  const ArgumentType = Scratch.ArgumentType;

  class cssInject {
    getInfo() {
      return {
        id: "mrk20200cssInject",
        name: "Inject CSS",
        color1: "#2965F1",
        color2: "#264DE4",
        color3: "#264DE4",
        blocks: [
          {
            opcode: "injectDocumentStyle",
            blockType: BlockType.COMMAND,
            text: Scratch.translate("inject style [CSS] as separate element"),
            arguments: {
              CSS: {
                type: ArgumentType.STRING,
              },
            },
          },
          {
            opcode: "replaceReplaceableStyle",
            blockType: BlockType.COMMAND,
            text: Scratch.translate("replace replaceable style with [CSS]"),
            arguments: {
              CSS: {
                type: ArgumentType.STRING,
              },
            },
          },
          {
            opcode: "getReplaceableStyle",
            blockType: BlockType.REPORTER,
            text: Scratch.translate("replaceable style content"),
          },
          "---",
          {
            opcode: "replaceStyleByQuery",
            blockType: BlockType.COMMAND,
            text: Scratch.translate(
              "replace style of CSS selector [QUERY] with [CSS]"
            ),
            arguments: {
              CSS: {
                type: ArgumentType.STRING,
              },
              QUERY: {
                type: ArgumentType.STRING,
              },
            },
          },
          {
            opcode: "replaceAllStylesByQuery",
            blockType: BlockType.COMMAND,
            text: Scratch.translate(
              "replace all styles of CSS selector [QUERY] with [CSS]"
            ),
            arguments: {
              CSS: {
                type: ArgumentType.STRING,
              },
              QUERY: {
                type: ArgumentType.STRING,
              },
            },
          },
          {
            opcode: "getPresetQuery",
            blockType: BlockType.REPORTER,
            text: Scratch.translate("selector for [PRESET]"),
            disableMonitor: true,
            arguments: {
              PRESET: {
                type: ArgumentType.STRING,
                menu: "presetQueries",
              },
            },
          },
          {
            opcode: "checkQuery",
            blockType: BlockType.BOOLEAN,
            text: Scratch.translate("selector [QUERY] matches element?"),
            disableMonitor: true,
            arguments: {
              QUERY: {
                type: ArgumentType.STRING,
              },
            },
          },
          "---",
          {
            opcode: "getScreenSize",
            blockType: BlockType.REPORTER,
            text: Scratch.translate("screen [LENGTH]"),
            disableMonitor: true,
            arguments: {
              LENGTH: {
                type: ArgumentType.STRING,
                menu: "length",
              },
            },
          },
          {
            opcode: "getViewportSize",
            blockType: BlockType.REPORTER,
            text: Scratch.translate("viewport [LENGTH]"),
            disableMonitor: true,
            arguments: {
              LENGTH: {
                type: ArgumentType.STRING,
                menu: "length",
              },
            },
          },
          {
            opcode: "checkIfPackaged",
            blockType: BlockType.BOOLEAN,
            text: Scratch.translate("is packaged?"),
            disableMonitor: true,
          },
        ],
        menus: {
          length: {
            acceptReporters: true,
            items: [
              {
                text: Scratch.translate("width"),
                value: "width",
              },
              {
                text: Scratch.translate("height"),
                value: "height",
              },
            ],
          },
          presetQueries: {
            acceptReporters: true,
            items: [
              {
                text: Scratch.translate("stage canvas"),
                value: "stageCanvas",
              },
              {
                text: Scratch.translate("variable/list monitors"),
                value: "stageMonitors",
              },
              {
                text: Scratch.translate("ask prompt"),
                value: "stagePrompt",
              },
              {
                text: Scratch.translate("green flag button"),
                value: "greenFlag",
              },
              {
                text: Scratch.translate("pause button"),
                value: "pause",
              },
              {
                text: Scratch.translate("stop button"),
                value: "stop",
              },
              {
                text: Scratch.translate("full screen button"),
                value: "fullScreen",
              },
              {
                text: Scratch.translate("controls header"),
                value: "controlsHeader",
              },
              {
                text: Scratch.translate("entire screen"),
                value: "contentArea",
              },
              {
                text: Scratch.translate("all editor blocks"),
                value: "scratchblocks",
              },
            ],
          },
        },
      };
    }

    // Global style-related functions
    injectDocumentStyle(args) {
      let castedCSS = Cast.toString(args.CSS);
      if (this.detectRemoteURLs(castedCSS)) {
        let styleElement = document.createElement("style");
        styleElement.innerText = Cast.toString(castedCSS);
        document.head.appendChild(styleElement);
      }
      return;
    }

    replaceReplaceableStyle(args) {
      let castedCSS = Cast.toString(args.CSS);
      if (this.detectRemoteURLs(castedCSS)) {
        if (replaceableStyle) {
          replaceableStyle.textContent = castedCSS;
          if (!document.head.contains(replaceableStyle)) {
            document.head.appendChild(replaceableStyle);
          }
        } else {
          replaceableStyle = document.createElement("style");
          replaceableStyle.id = "_replaceableStyle";
          replaceableStyle.textContent = castedCSS;
          document.head.appendChild(replaceableStyle);
        }
      }
      return;
    }

    getReplaceableStyle() {
      return replaceableStyle ? replaceableStyle.textContent : "";
    }

    // Query-related functions
    replaceStyleByQuery(args) {
      let castedCSS = Cast.toString(args.CSS);
      let targetElement = document.querySelector(Cast.toString(args.QUERY));
      if (this.detectRemoteURLs(castedCSS)) {
        if (targetElement) {
          targetElement["style"] = castedCSS;
        }
      }
      return;
    }

    replaceAllStylesByQuery(args) {
      let castedCSS = Cast.toString(args.CSS);
      let targetElements = document.querySelectorAll(Cast.toString(args.QUERY));
      if (this.detectRemoteURLs(castedCSS)) {
        targetElements.forEach((element) => {
          element["style"] = castedCSS;
        });
      }
      return;
    }

    getPresetQuery(args) {
      return presetQueries[args.PRESET];
    }

    checkQuery(args) {
      return document.querySelector(Cast.toString(args.QUERY)) !== null;
    }

    // Information-related functions
    getScreenSize(args) {
      return args.LENGTH == "width"
        ? window.screen.width
        : window.screen.height;
    }

    getViewportSize(args) {
      return args.LENGTH == "width" ? window.innerWidth : window.innerHeight;
    }

    // Included because CSS rules change between non-packaged and packaged interfaces
    checkIfPackaged() {
      return isPackaged;
    }

    // Blocks remote URLs, allows offline data URIs
    // The URLs are blocked before injection because the requests are handled by the browser
    detectRemoteURLs(css) {
      for (const match of css.matchAll(URLregexp)) {
        let url;
        try {
          url = new URL(match[1], location.href);
        } catch (error) {
          console.error(error);
        }

        if (url.protocol !== "data:") {
          alert(
            `Direct remote resources aren't supported in this extension. Please either use another extension to convert a costume into a data URI (such as Looks PLUS) or encode this resource into a data URI using an online converter.\n\nThe URL that triggered this message:\n${url.href} (at index ${match.index})`
          );
          // stop injection
          return false;
        }
      }
      // proceed with injection
      return true;
    }
  }
  // VSCode seems to not like the below line on every extension, so it is set to be ignored.
  // @ts-ignore
  Scratch.extensions.register(new cssInject());
})(Scratch);
