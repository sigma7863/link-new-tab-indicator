const INDICATOR_CLASS = "nti-new-tab-indicator";
const ICON_CLASS = "nti-new-tab-icon";
const MARKED_ATTR = "data-nti-marked";
const OPEN_EVENT_NAME = "nti-window-open-detected";

let lastInteraction: { target: Element | null; at: number } = {
  target: null,
  at: 0,
};

function injectWindowOpenHook(): void {
  const script = document.createElement("script");
  script.textContent = `(() => {
    if ((window).__ntiOpenHookInstalled) {
      return;
    }

    (window).__ntiOpenHookInstalled = true;
    const originalOpen = window.open;

    window.open = function (...args) {
      try {
        document.dispatchEvent(new CustomEvent("${OPEN_EVENT_NAME}", {
          detail: {
            ts: Date.now()
          }
        }));
      } catch (_) {
        // no-op
      }

      return originalOpen.apply(this, args);
    };
  })();`;

  (document.documentElement || document.head || document.body).appendChild(script);
  script.remove();
}

function isHTMLElement(node: unknown): node is HTMLElement {
  return node instanceof HTMLElement;
}

function appendIndicator(el: Element): void {
  if (!isHTMLElement(el)) {
    return;
  }

  if (el.getAttribute(MARKED_ATTR) === "1") {
    return;
  }

  el.setAttribute(MARKED_ATTR, "1");
  el.classList.add(INDICATOR_CLASS);

  if (!el.getAttribute("title")) {
    el.setAttribute("title", "新しいタブで開く");
  }

  const icon = document.createElement("span");
  icon.className = ICON_CLASS;
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = "↗";

  el.appendChild(icon);
}

function markBlankTargetLinks(root: ParentNode): void {
  const links = root.querySelectorAll("a[href][target='_blank']");
  links.forEach((link) => appendIndicator(link));
}

function markInlineWindowOpen(root: ParentNode): void {
  const clickableNodes = root.querySelectorAll<HTMLElement>("[onclick*='window.open']");
  clickableNodes.forEach((node) => appendIndicator(node));
}

function nearestMarkableElement(start: Element | null): Element | null {
  if (!start) {
    return null;
  }

  return start.closest("a, button, [role='button'], [onclick]") ?? start;
}

function processNode(node: Node): void {
  if (!(node instanceof Element)) {
    return;
  }

  if (node.matches("a[href][target='_blank']")) {
    appendIndicator(node);
  }

  if (node instanceof HTMLElement && node.hasAttribute("onclick") && node.getAttribute("onclick")?.includes("window.open")) {
    appendIndicator(node);
  }

  markBlankTargetLinks(node);
  markInlineWindowOpen(node);
}

function observeDomChanges(): void {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => processNode(node));

      if (
        mutation.type === "attributes" &&
        mutation.target instanceof Element &&
        (mutation.attributeName === "target" || mutation.attributeName === "onclick")
      ) {
        processNode(mutation.target);
      }
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["target", "onclick"],
  });
}

function setupInteractionTracking(): void {
  const track = (event: Event): void => {
    const target = event.target instanceof Element ? event.target : null;
    lastInteraction = {
      target,
      at: Date.now(),
    };
  };

  document.addEventListener("pointerdown", track, true);
  document.addEventListener("click", track, true);
}

function setupWindowOpenListener(): void {
  document.addEventListener(OPEN_EVENT_NAME, () => {
    const now = Date.now();
    const withinRecentClickWindow = now - lastInteraction.at <= 1500;

    if (!withinRecentClickWindow) {
      return;
    }

    const candidate = nearestMarkableElement(lastInteraction.target);
    if (candidate) {
      appendIndicator(candidate);
    }
  });
}

function bootstrap(): void {
  markBlankTargetLinks(document);
  markInlineWindowOpen(document);
  setupInteractionTracking();
  setupWindowOpenListener();
  observeDomChanges();
  injectWindowOpenHook();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrap, { once: true });
} else {
  bootstrap();
}
