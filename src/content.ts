const INDICATOR_CLASS = "nti-link-indicator";
const NEW_TAB_INDICATOR_CLASS = "nti-new-tab-indicator";
const IMAGE_LINK_INDICATOR_CLASS = "nti-image-link-indicator";
const ICON_CLASS = "nti-link-icon";
const NEW_TAB_ICON_CLASS = "nti-new-tab-icon";
const IMAGE_LINK_ICON_CLASS = "nti-image-link-icon";
const NEW_TAB_MARKED_ATTR = "data-nti-new-tab-marked";
const IMAGE_LINK_MARKED_ATTR = "data-nti-image-link-marked";
const TITLE_OWNED_ATTR = "data-nti-title-owned";
const RECENT_INTERACTION_SUPPRESSION_MS = 1200;
const IMAGE_FILE_EXTENSION_RE =
  /\.(?:apng|avif|bmp|gif|heic|heif|ico|jpe?g|png|svg|tiff?|webp)$/i;

let lastInteraction: { target: Element | null; at: number } = {
  target: null,
  at: 0,
};

function isHTMLElement(node: unknown): node is HTMLElement {
  return node instanceof HTMLElement;
}

function appendBadge(
  el: Element,
  options: {
    className: string;
    markedAttr: string;
    text: string;
    title: string;
  }
): void {
  if (!isHTMLElement(el)) {
    return;
  }

  if (el.getAttribute(options.markedAttr) === "1") {
    return;
  }

  el.setAttribute(options.markedAttr, "1");
  el.classList.add(INDICATOR_CLASS);
  el.classList.add(options.className);

  if (!el.getAttribute("title") || el.getAttribute(TITLE_OWNED_ATTR) === "1") {
    const title = el.getAttribute("title");
    el.setAttribute("title", title ? `${title} / ${options.title}` : options.title);
    el.setAttribute(TITLE_OWNED_ATTR, "1");
  }

  const icon = document.createElement("span");
  icon.className = `${ICON_CLASS} ${
    options.markedAttr === NEW_TAB_MARKED_ATTR ? NEW_TAB_ICON_CLASS : IMAGE_LINK_ICON_CLASS
  }`;
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = options.text;

  el.appendChild(icon);
}

function appendNewTabIndicator(el: Element): void {
  appendBadge(el, {
    className: NEW_TAB_INDICATOR_CLASS,
    markedAttr: NEW_TAB_MARKED_ATTR,
    text: "↗",
    title: "新しいタブで開く",
  });
}

function appendImageLinkIndicator(el: Element): void {
  appendBadge(el, {
    className: IMAGE_LINK_INDICATOR_CLASS,
    markedAttr: IMAGE_LINK_MARKED_ATTR,
    text: "img",
    title: "画像ファイルへのリンク",
  });
}

function hasBlankTarget(link: HTMLAnchorElement): boolean {
  return link.target.toLowerCase() === "_blank";
}

function hasInlineWindowOpen(node: HTMLElement): boolean {
  return node.getAttribute("onclick")?.toLowerCase().includes("window.open") ?? false;
}

function hasImageMimeType(link: HTMLAnchorElement): boolean {
  return link.getAttribute("type")?.trim().toLowerCase().startsWith("image/") ?? false;
}

function hasImageHref(link: HTMLAnchorElement): boolean {
  const href = link.getAttribute("href")?.trim();

  if (!href) {
    return false;
  }

  if (/^data:image\//i.test(href)) {
    return true;
  }

  try {
    const url = new URL(href, window.location.href);
    return IMAGE_FILE_EXTENSION_RE.test(decodeURIComponent(url.pathname));
  } catch {
    return IMAGE_FILE_EXTENSION_RE.test(href.split(/[?#]/, 1)[0]);
  }
}

function isImageLink(link: HTMLAnchorElement): boolean {
  return hasImageMimeType(link) || hasImageHref(link);
}

function markBlankTargetLinks(root: ParentNode): void {
  const links = root.querySelectorAll<HTMLAnchorElement>("a[href][target]");
  links.forEach((link) => {
    if (hasBlankTarget(link)) {
      appendNewTabIndicator(link);
    }
  });
}

function markInlineWindowOpen(root: ParentNode): void {
  const clickableNodes = root.querySelectorAll<HTMLElement>("[onclick]");
  clickableNodes.forEach((node) => {
    if (hasInlineWindowOpen(node)) {
      appendNewTabIndicator(node);
    }
  });
}

function markImageLinks(root: ParentNode): void {
  const links = root.querySelectorAll<HTMLAnchorElement>("a[href], a[type]");
  links.forEach((link) => {
    if (isImageLink(link)) {
      appendImageLinkIndicator(link);
    }
  });
}

function nearestMarkableElement(start: Element | null): Element | null {
  if (!start) {
    return null;
  }

  return start.closest("a, button, [role='button'], [onclick]") ?? start;
}

function shouldSuppressRecentInteractionMutation(target: Element): boolean {
  if (Date.now() - lastInteraction.at > RECENT_INTERACTION_SUPPRESSION_MS) {
    return false;
  }

  const interacted = nearestMarkableElement(lastInteraction.target);

  if (!interacted) {
    return false;
  }

  return interacted === target || interacted.contains(target) || target.contains(interacted);
}

function processNode(node: Node): void {
  if (!(node instanceof Element)) {
    return;
  }

  if (node instanceof HTMLAnchorElement) {
    if (hasBlankTarget(node)) {
      appendNewTabIndicator(node);
    }

    if (isImageLink(node)) {
      appendImageLinkIndicator(node);
    }
  }

  if (node instanceof HTMLElement && hasInlineWindowOpen(node)) {
    appendNewTabIndicator(node);
  }

  markBlankTargetLinks(node);
  markInlineWindowOpen(node);
  markImageLinks(node);
}

function observeDomChanges(): void {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => processNode(node));

      if (
        mutation.type === "attributes" &&
        mutation.target instanceof Element &&
        mutation.attributeName
      ) {
        if (
          (mutation.attributeName === "target" || mutation.attributeName === "onclick") &&
          shouldSuppressRecentInteractionMutation(mutation.target)
        ) {
          continue;
        }

        processNode(mutation.target);
      }
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["href", "onclick", "target", "type"],
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

function bootstrap(): void {
  markBlankTargetLinks(document);
  markInlineWindowOpen(document);
  markImageLinks(document);
  setupInteractionTracking();
  observeDomChanges();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrap, { once: true });
} else {
  bootstrap();
}
