// Set up the saved color theme before the user interacts with the page.
const body = document.body;
const themeToggle = document.querySelector(".theme-toggle");
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector("#primary-navigation");
const savedTheme = localStorage.getItem("focusforge-theme");

if (savedTheme === "dark") {
    body.classList.add("dark-theme");
    themeToggle.setAttribute("aria-label", "Switch to light theme");
}

// Toggle the mobile navigation and keep aria-expanded accurate.
navToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
});

navLinks.addEventListener("click", (event) => {
    if (event.target.tagName === "A") {
        navLinks.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
    }
});

// Toggle light and dark themes, then save the choice in localStorage.
themeToggle.addEventListener("click", () => {
    const isDark = body.classList.toggle("dark-theme");

    if (isDark) {
        localStorage.setItem("focusforge-theme", "dark");
        themeToggle.setAttribute("aria-label", "Switch to light theme");
    } else {
        localStorage.setItem("focusforge-theme", "light");
        themeToggle.setAttribute("aria-label", "Switch to dark theme");
    }
});
