const THEME_KEY = "pf-theme";
const DARK = "dark";
const LIGHT = "light";

document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("themeToggleBtn");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");

  let theme = readSavedTheme();
  if (!theme) {
    theme = prefersDark.matches ? DARK : LIGHT;
  }
  applyTheme(theme, false);

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme") === DARK ? DARK : LIGHT;
      applyTheme(current === DARK ? LIGHT : DARK, true);
    });
  }

  if (typeof prefersDark.addEventListener === "function") {
    prefersDark.addEventListener("change", (event) => {
      if (readSavedTheme()) return;
      applyTheme(event.matches ? DARK : LIGHT, false);
    });
  }
});

function readSavedTheme() {
  try {
    const value = localStorage.getItem(THEME_KEY);
    return value === DARK || value === LIGHT ? value : "";
  } catch (error) {
    return "";
  }
}

function applyTheme(theme, persist) {
  const normalized = theme === DARK ? DARK : LIGHT;
  document.documentElement.setAttribute("data-theme", normalized);

  if (persist) {
    try {
      localStorage.setItem(THEME_KEY, normalized);
    } catch (error) {}
  }

  updateThemeToggleButton(normalized);
  updateThemeMeta(normalized);
}

function updateThemeToggleButton(theme) {
  const toggleBtn = document.getElementById("themeToggleBtn");
  if (!toggleBtn) return;

  const icon = toggleBtn.querySelector("i");
  const label = toggleBtn.querySelector("span");

  if (theme === DARK) {
    if (icon) icon.className = "fas fa-sun";
    if (label) label.textContent = "Light";
  } else {
    if (icon) icon.className = "fas fa-moon";
    if (label) label.textContent = "Dark";
  }
}

function updateThemeMeta(theme) {
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (!themeMeta) return;
  themeMeta.setAttribute("content", theme === DARK ? "#0d2015" : "#166534");
}
