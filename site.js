// Apply the saved theme, update the toggle button, and keep the footer year current.
const siteThemeKey = "site-theme";
const siteBody = document.body;
const themeButtons = document.querySelectorAll(".theme-toggle");
const savedSiteTheme = localStorage.getItem(siteThemeKey);
const yearElement = document.getElementById("year");

function updateThemeButtons(isDark) {
  themeButtons.forEach((button) => {
    button.textContent = isDark ? "Light Mode" : "Dark Mode";
    button.setAttribute(
      "aria-label",
      isDark ? "Switch to light mode" : "Switch to dark mode"
    );
  });
}

if (savedSiteTheme === "dark") {
  siteBody.classList.add("dark-theme");
}

updateThemeButtons(siteBody.classList.contains("dark-theme"));

themeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const isDark = siteBody.classList.toggle("dark-theme");
    localStorage.setItem(siteThemeKey, isDark ? "dark" : "light");
    updateThemeButtons(isDark);
  });
});

if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}
