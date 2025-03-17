//--------DATABASE.HTML CODE FUNCTIONALITY--------
// Get references to elements
const bookFormContainer = document.getElementById("bookFormContainer");
const backBtn = document.getElementById("goBack");

let loggedInUser = localStorage.getItem("loggedInUser") || null;

const welcomeMessage = document.getElementById("welcomeMessage");
if (loggedInUser) {
  welcomeMessage.innerText = `Welcome, ${loggedInUser}`;
}

// Event listener to handle the back button
backBtn.addEventListener("click", () => {
  window.electronAPI.loadPage("index.html"); // Go back to the main page
});

const bookList = document.getElementById("bookList");

//Loads saved books so user can see them on the page.
async function loadBooks() {
  const books = await window.electronAPI.getBooks();
  const tableBody = document.querySelector("#bookTable tbody");

  if (books.length === 0) {
    tableBody.innerHTML = "<tr><td colspan='3'>No books found.</td></tr>";
  } else {
    tableBody.innerHTML = books
      .map(
        (book, index) =>
          `<tr>
            <td>${index + 1}</td>
            <td>${book.title}</td>
            <td>${book.author}</td>
            <td><button class="save-btn dark-button" data-title="${
              book.title
            }" data-author="${book.author}">Borrow</button></td>
          </tr>`
      )
      .join("");
  }

  const saveButtons = document.querySelectorAll(".save-btn");
  saveButtons.forEach((button) => {
    button.addEventListener("click", async (event) => {
      const title = event.target.getAttribute("data-title");
      const author = event.target.getAttribute("data-author");

      if (loggedInUser) {
        const response = await window.electronAPI.saveUserBook(loggedInUser, {
          title,
          author,
        });
        // Show success or duplicate message
        window.electronAPI.showMessageBox(response.message);
        if (response.success) {
          loadUserSavedBooks(); // Reload user's saved books only if added
        }
      }
    });
  });
}

// Load books when page loads
document.addEventListener("DOMContentLoaded", loadBooks);

// Function to load user's saved books
async function loadUserSavedBooks() {
  if (!loggedInUser) return;

  const savedBooks = await window.electronAPI.getUserBooks(loggedInUser);
  const savedBooksTable = document.querySelector("#savedBooksTable tbody");

  if (savedBooks.length === 0) {
    savedBooksTable.innerHTML =
      "<tr><td colspan='4'>No saved books found.</td></tr>";
  } else {
    savedBooksTable.innerHTML = savedBooks
      .map(
        (book, index) =>
          `<tr>
            <td>${index + 1}</td>
            <td>${book.title}</td>
            <td>${book.author}</td>
            <td><button class="delete-btn dark-button" data-title="${
              book.title
            }" data-author="${book.author}">Return</button></td>
          </tr>`
      )
      .join("");
  }

  // Event listeners for delete buttons
  const deleteButtons = document.querySelectorAll(".delete-btn");
  deleteButtons.forEach((button) => {
    button.addEventListener("click", async (event) => {
      const title = event.target.getAttribute("data-title");
      const author = event.target.getAttribute("data-author");

      if (loggedInUser) {
        // Remove the book from the logged-in user's saved books
        const response = await window.electronAPI.deleteUserBook(loggedInUser, {
          title,
          author,
        });
        if (response.success) {
          loadUserSavedBooks(); // Reload user's saved books
        } else {
          alert("Failed to delete the book.");
        }
      }
    });
  });
}

// Load user's saved books when the page loads
document.addEventListener("DOMContentLoaded", loadUserSavedBooks);
