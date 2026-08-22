const INDICATOR_CLASS = "nti-link-indicator";
const NEW_TAB_INDICATOR_CLASS = "nti-new-tab-indicator";
const IMAGE_LINK_INDICATOR_CLASS = "nti-image-link-indicator";
const ICON_CLASS = "nti-link-icon";
const IMAGE_LINK_ICON_CLASS = "nti-image-link-icon";
const ICON_BADGE_ATTR = "data-nti-badge";
const NEW_TAB_MARKED_ATTR = "data-nti-new-tab-marked";
const IMAGE_LINK_MARKED_ATTR = "data-nti-image-link-marked";
const TITLE_OWNED_ATTR = "data-nti-title-owned";
const NEW_TAB_TITLE = "新しいタブで開く";
const IMAGE_LINK_TITLE = "画像ファイルへのリンク";
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
    iconClass?: string;
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

  if (!el.getAttribute("title") || ownsTitle(el)) {
    el.setAttribute(TITLE_OWNED_ATTR, "1");
    syncOwnedTitle(el);
  }

  const icon = document.createElement("span");
  icon.className = options.iconClass ? `${ICON_CLASS} ${options.iconClass}` : ICON_CLASS;
  icon.setAttribute(ICON_BADGE_ATTR, options.markedAttr);
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = options.text;

  el.appendChild(icon);
}

function removeBadge(
  el: Element,
  options: {
    className: string;
    markedAttr: string;
  }
): void {
  if (!isHTMLElement(el) || el.getAttribute(options.markedAttr) !== "1") {
    return;
  }

  el.removeAttribute(options.markedAttr);
  el.classList.remove(options.className);

  Array.from(el.children)
    .find(
      (child) =>
        child.classList.contains(ICON_CLASS) &&
        child.getAttribute(ICON_BADGE_ATTR) === options.markedAttr
    )
    ?.remove();

  if (!hasAnyBadge(el)) {
    el.classList.remove(INDICATOR_CLASS);
  }

  syncOwnedTitle(el);
}

function appendNewTabIndicator(el: Element): void {
  appendBadge(el, {
    className: NEW_TAB_INDICATOR_CLASS,
    markedAttr: NEW_TAB_MARKED_ATTR,
    text: "↗",
  });
}

function appendImageLinkIndicator(el: Element): void {
  appendBadge(el, {
    className: IMAGE_LINK_INDICATOR_CLASS,
    markedAttr: IMAGE_LINK_MARKED_ATTR,
    text: "img",
    iconClass: IMAGE_LINK_ICON_CLASS,
  });
}

function removeNewTabIndicator(el: Element): void {
  removeBadge(el, {
    className: NEW_TAB_INDICATOR_CLASS,
    markedAttr: NEW_TAB_MARKED_ATTR,
  });
}

function removeImageLinkIndicator(el: Element): void {
  removeBadge(el, {
    className: IMAGE_LINK_INDICATOR_CLASS,
    markedAttr: IMAGE_LINK_MARKED_ATTR,
  });
}

function hasAnyBadge(el: HTMLElement): boolean {
  return (
    el.getAttribute(NEW_TAB_MARKED_ATTR) === "1" ||
    el.getAttribute(IMAGE_LINK_MARKED_ATTR) === "1"
  );
}

function ownsTitle(el: HTMLElement): boolean {
  return el.getAttribute(TITLE_OWNED_ATTR) === "1";
}

function syncOwnedTitle(el: HTMLElement): void {
  if (!ownsTitle(el)) {
    return;
  }

  const titles: string[] = [];

  if (el.getAttribute(NEW_TAB_MARKED_ATTR) === "1") {
    titles.push(NEW_TAB_TITLE);
  }

  if (el.getAttribute(IMAGE_LINK_MARKED_ATTR) === "1") {
    titles.push(IMAGE_LINK_TITLE);
  }

  if (titles.length === 0) {
    el.removeAttribute("title");
    el.removeAttribute(TITLE_OWNED_ATTR);
    return;
  }

  el.setAttribute("title", titles.join(" / "));
}

function hasBlankTarget(link: HTMLAnchorElement): boolean {
  return link.hasAttribute("href") && link.target.toLowerCase() === "_blank";
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
  if (!link.hasAttribute("href")) {
    return false;
  }

  return hasImageMimeType(link) || hasImageHref(link);
}

function isNewTabElement(el: Element): boolean {
  if (el instanceof HTMLAnchorElement && hasBlankTarget(el)) {
    return true;
  }

  return el instanceof HTMLElement && hasInlineWindowOpen(el);
}

function syncNewTabIndicator(el: Element): void {
  if (isNewTabElement(el)) {
    appendNewTabIndicator(el);
    return;
  }

  removeNewTabIndicator(el);
}

function syncImageLinkIndicator(link: HTMLAnchorElement): void {
  if (isImageLink(link)) {
    appendImageLinkIndicator(link);
    return;
  }

  removeImageLinkIndicator(link);
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
  const links = root.querySelectorAll<HTMLAnchorElement>("a[href]");
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

  syncNewTabIndicator(node);

  if (node instanceof HTMLAnchorElement) {
    syncImageLinkIndicator(node);
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
