// Get the HTML elements that the script needs to work with.
const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const message = document.getElementById("message");
const results = document.getElementById("results");
const year = document.getElementById("year");

year.textContent = new Date().getFullYear();

// Listen for the form submit so the page does not reload.
searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const searchTerm = searchInput.value.trim();

  // Handle blank input before making an API request.
  if (searchTerm === "") {
    showMessage("Please enter a book title, author, or keyword.", "error");
    results.innerHTML = "";
    searchInput.focus();
    return;
  }

  await searchBooks(searchTerm);
});

// Search Open Library for books that match the user's search term.
async function searchBooks(searchTerm) {
  const apiUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(searchTerm)}`;

  showMessage("Loading books...", "loading");
  results.innerHTML = "";

  try {
    const response = await fetch(apiUrl);

    // If the API returns a bad response, create an error.
    if (!response.ok) {
      throw new Error("The Open Library request failed.");
    }

    const data = await response.json();
    const books = data.docs.slice(0, 10);

    if (books.length === 0) {
      showMessage("No books found. Try a different search term.", "error");
      return;
    }

    showMessage(`Showing ${books.length} result(s) for "${searchTerm}".`, "success");
    displayBooks(books);
  } catch (error) {
    showMessage("Something went wrong. Please try again later.", "error");
  }
}

// Build the book result cards and place them on the page.
function displayBooks(books) {
  const bookCards = books.map((book) => {
    const title = book.title || "Title not available";
    const authors = book.author_name ? book.author_name.join(", ") : "Author not available";
    const firstYear = book.first_publish_year || "Year not available";
    const publisher = book.publisher ? book.publisher[0] : "Publisher not available";
    const subjects = book.subject ? book.subject.slice(0, 3).join(", ") : "Subjects not available";

    return `
      <article class="book-card">
        <h3>${escapeHTML(title)}</h3>
        <p><strong>Author:</strong> ${escapeHTML(authors)}</p>
        <p><strong>First published:</strong> ${escapeHTML(String(firstYear))}</p>
        <p><strong>Publisher:</strong> ${escapeHTML(publisher)}</p>
        <p><strong>Subjects:</strong> ${escapeHTML(subjects)}</p>
      </article>
    `;
  });

  results.innerHTML = bookCards.join("");
}

// Show a message to the user and apply a matching style.
function showMessage(text, type) {
  message.textContent = text;
  message.className = `message ${type}`;
}

// Escape text from the API before placing it into the HTML.
function escapeHTML(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
