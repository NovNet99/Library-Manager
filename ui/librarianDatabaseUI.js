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

const errorMessage = document.getElementById("errorMessage");

displayBooks();

async function displayBooks(books) {
  if (!books) {
    books = await window.electronAPI.getBooks();
  }

  booksTableBody.innerHTML = books
    .map(
      (book, index) =>
        `<tr>
          <td>${book.title}</td>
          <td>${book.author}</td>
          <td>${book.isbn}</td>
          <td>${book.available ? "Yes" : "No"}</td>
          <td><button onclick="removeBook('${book.isbn}')">Remove</button></td>
        </tr>`
    )
    .join("");
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
