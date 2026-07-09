// The SPA is served from a single origin and embedded by both the Chrome and the
// Firefox extension shells, so it detects the host browser at runtime rather than
// at build time. navigator.userAgent inside the iframe reflects the real browser.
export const isFirefox = (): boolean =>
    typeof navigator !== "undefined" && /firefox/i.test(navigator.userAgent)

// Where the user manages extension keyboard shortcuts. Chrome exposes a linkable
// page; Firefox only has about:addons (then ⚙ → "Manage Extension Shortcuts").
export const shortcutsLabel = (): string =>
    isFirefox() ? "about:addons" : "chrome://extensions/shortcuts"
