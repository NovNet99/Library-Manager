/*const DatabaseController = require("../src/DatabaseController");
const Librarian = require("../src/Librarian");

const dbFilePath = path.join(__dirname, "../books1.json");
const databaseController = new DatabaseController(dbFilePath);

const librarianUsername = localStorage.getItem("librarianUsername");
const librarianCode = localStorage.getItem("librarianCode");
const librarian = new Librarian(
  librarianUsername,
  librarianCode,
  databaseController
);*/

const addBookForm = document.getElementById("addBookForm");
const booksTableBody = document.getElementById("booksTableBody");

const bookTitle = document.getElementById("titleInputAddBook");
const bookAuthor = document.getElementById("authorInputAddBook");
const bookIsbn = document.getElementById("isbnInputAddBook");

const backButton = document.getElementById("backButton");
const librarianUsername = localStorage.getItem("librarianUsername");
const librarianUsernameDisplay = document.getElementById("librarianName");
librarianUsernameDisplay.textContent = `Welcome, ${librarianUsername}`;

const errorMessage = document.getElementById("errorMessage");

displayBooks();

async function displayBooks(books) {
  if (!books) {
    books = await window.electronAPI.getBooks();
  }

  booksTableBody.innerHTML = books
    .map(
      (book, index) =>
        `<tr id="row-${book.isbn}">
          <td>${book.title}</td>
          <td>${book.author}</td>
          <td>${book.isbn}</td>
          <td>${book.available ? "Yes" : "No"}</td>
          <td>
            <button onclick="editBook('${book.isbn}')">Edit</button>
            <button onclick="removeBook('${book.isbn}')">Remove</button>
          </td>
        </tr>`
    )
    .join("");
}

async function editBook(isbn) {
  const row = document.getElementById(`row-${isbn}`);
  const book = (await window.electronAPI.getBooks()).find(b => b.isbn === isbn);

  // Replace table cells with inputs
  row.innerHTML = `
    <td><input type="text" value="${book.title}" id="edit-title-${isbn}" /></td>
    <td><input type="text" value="${book.author}" id="edit-author-${isbn}" /></td>
    <td><input type="text" value="${book.isbn}" id="edit-isbn-${isbn}" readonly /></td>
    <td>
      <select id="edit-available-${isbn}">
        <option value="true" ${book.available ? "selected" : ""}>Yes</option>
        <option value="false" ${!book.available ? "selected" : ""}>No</option>
      </select>
    </td>
    <td>
      <button onclick="saveBook('${isbn}')">Save</button>
      <button onclick="displayBooks()">Cancel</button>
    </td>
  `;
}

async function saveBook(isbn) {
  const title = document.getElementById(`edit-title-${isbn}`).value.trim();
  const author = document.getElementById(`edit-author-${isbn}`).value.trim();
  const newIsbn = document.getElementById(`edit-isbn-${isbn}`).value.trim(); // Kept readonly, but included for consistency
  const available = document.getElementById(`edit-available-${isbn}`).value === "true";

  const updatedBook = { title, author, isbn: newIsbn, available };

  // Validate inputs
  const errors = getAddBookErrors(title, author, newIsbn);
  if (errors.length > 0) {
    errorMessage.innerHTML = `<ul>${errors.map(error => `<li>${error}</li>`).join("")}</ul>`;
    return;
  }

  // Remove old book and add updated book
  await window.electronAPI.removeBook(isbn);
  const result = await window.electronAPI.addBook(updatedBook);

  if (result.success) {
    await displayBooks();
  } else {
    errorMessage.textContent = result.message;
  }
}

async function removeBook(isbn) {
  try {
    const result = await window.electronAPI.removeBook(isbn);
    if (result.success) {
      await displayBooks();
    } else {
      errorMessage.textContent = result.message;
    }
  } catch (error) {
    errorMessage.textContent = "Error removing book: " + error.message;
  }
}

addBookForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const bookTitleValue = bookTitle.value.trim();
  const bookAuthorValue = bookAuthor.value.trim();
  const bookIsbnValue = bookIsbn.value.trim();

  let errors = [];

  const book = {
    title: bookTitleValue,
    author: bookAuthorValue,
    isbn: bookIsbnValue,
  };

  errors = getAddBookErrors(bookTitleValue, bookAuthorValue, bookIsbnValue);

  if (errors.length > 0) {
    errorMessage.innerHTML = `<ul>${errors
      .map((error) => `<li>${error}</li>`)
      .join("")}</ul>`;
    return;
  }

  const result = await window.electronAPI.addBook(book);

  if (result.success) {
    await displayBooks();
    return;
  } else {
    errorMessage.innerHTML = result.message;
    return;
  }
});

function getAddBookErrors(title, author, isbn) {
  const errors = [];
  if (!title) {
    errors.push("Title is required.");
  }
  if (!author) {
    errors.push("Author is required.");
  }
  if (!isbn) {
    errors.push("ISBN is required.");
  }
  return errors;
}

const allAddBookInputs = [bookTitle, bookAuthor, bookIsbn].filter(
  (input) => input
);
allAddBookInputs.forEach((input) => {
  input.addEventListener("input", () => {
    errorMessage.innerHTML = "";
  });
});

backButton.addEventListener("click", () => {
  localStorage.removeItem("librarianUsername");
  localStorage.removeItem("librarianCode");
  console.log(localStorage.getItem("librarianUsername"));
  window.electronAPI.loadPage("views/librarian-register.html"); // Go back to the Sign In page
});
