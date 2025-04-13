// Page Elements
const backButton = document.getElementById("backButton");
const librarianUsername = localStorage.getItem("librarianUsername");
const librarianUsernameDisplay = document.getElementById("librarianName");
const confirmationMessage = document.getElementById("confirmationMessage");

// Add Book Form Elements
const addBookForm = document.getElementById("addBookForm");
const bookTitle = document.getElementById("titleInputAddBook");
const bookAuthor = document.getElementById("authorInputAddBook");
const bookIsbn = document.getElementById("isbnInputAddBook");
const bookGenre = document.getElementById("genreSelect");
const errorMessage = document.getElementById("errorMessage");

// Search Book Form Elements
const searchBookForm = document.getElementById("searchBookForm");
const searchTitle = document.getElementById("titleInputSearchBook");
const searchAuthor = document.getElementById("authorInputSearchBook");
const searchIsbn = document.getElementById("isbnInputSearchBook");
const searchGenre = document.getElementById("searchGenreSelect");
const searchErrorMessage = document.getElementById("searchErrorMessage");
const clearSearchButton = document.getElementById("clearSearchButton");

const manageRequestsButton = document.getElementById("manageRequestsButton");
const manageBorrowedBooksButton = document.getElementById("manageBorrowedBooksButton");
const issueBookButton = document.getElementById("issueBookButton");

// Table Body
const booksTableBody = document.getElementById("booksTableBody");

// Set the librarian username in the UI
librarianUsernameDisplay.textContent = `Welcome, ${librarianUsername}`;

// Initialize the table with existing books
displayBooks();

window.addEventListener("beforeunload", () => {
  console.log("Page is reloading!");
});

// Function to display books in the table
async function displayBooks(books) {
  if (!books) {
    books = await window.electronAPI.getBooks();
  }

  booksTableBody.innerHTML = ""; // Clear existing rows
  if (!books || books.length === 0) {
    booksTableBody.innerHTML = "<tr><td colspan='7'>No books found.</td></tr>";
    return;
  }
  books.forEach((book, index) => addBookRow(book, index));
}

// Function to add a book row to the table
function addBookRow(book, index) {
  const row = document.createElement("tr");
  row.id = `row-${index + 1}`;
  row.innerHTML = `
    <td>${index + 1}</td>
    <td>${book.title}</td>
    <td>${book.author}</td>
    <td>${book.isbn}</td>
    <td>${book.genre}</td>
    <td>${book.available ? "Yes" : "No"}</td>
    <td>
      <button type="button" onclick="editBook('${index}')">Edit</button>
      <button type="button" onclick="removeBook('${book.isbn}')">Remove</button>
    </td>
  `;
  booksTableBody.appendChild(row);
}

// Function to edit a book in the table
async function editBook(index) {
  const row = document.getElementById(`row-${parseInt(index) + 1}`);
  if (!row) {
    console.error(`Row with ID row-${parseInt(index) + 1} not found`);
    showConfirmation("Error: Row not found.", 0);
    return;
  }

  const books = await window.electronAPI.getBooks();
  const book = books[index];
  if (!book) {
    console.error(`Book at index ${index} not found in data`);
    showConfirmation("Error: Book not found in database.", 0);
    return;
  }

  row.innerHTML = `
    <td>${parseInt(index) + 1}</td>
    <td><input type="text" value="${
      book.title
    }" id="edit-title-${index}" /></td>
    <td><input type="text" value="${
      book.author
    }" id="edit-author-${index}" /></td>
    <td><input type="text" value="${book.isbn}" id="edit-isbn-${index}" /></td>
    <td>
      <select id="edit-genre-${index}">
        <option value="None" ${
          book.genre === "None" ? "selected" : ""
        }>None</option>
        <option value="Fiction" ${
          book.genre === "Fiction" ? "selected" : ""
        }>Fiction</option>
        <option value="Non-Fiction" ${
          book.genre === "Non-Fiction" ? "selected" : ""
        }>Non-Fiction</option>
        <option value="Science Fiction" ${
          book.genre === "Science Fiction" ? "selected" : ""
        }>Science Fiction</option>
        <option value="Fantasy" ${
          book.genre === "Fantasy" ? "selected" : ""
        }>Fantasy</option>
        <option value="Mystery" ${
          book.genre === "Mystery" ? "selected" : ""
        }>Mystery</option>
        <option value="Biography" ${
          book.genre === "Biography" ? "selected" : ""
        }>Biography</option>
      </select>
    </td>
    <td>
      <select id="edit-available-${index}">
        <option value="true" ${book.available ? "selected" : ""}>Yes</option>
        <option value="false" ${!book.available ? "selected" : ""}>No</option>
      </select>
    </td>
    <td>
      <button type="button" onclick="saveBook('${index}', '${
    book.isbn
  }')">Save</button>
      <button type="button" onclick="displayBooks()">Cancel</button>
    </td>
  `;
}

// Function to save the edited book
async function saveBook(index, originalIsbn) {
  const title = document.getElementById(`edit-title-${index}`).value.trim();
  const author = document.getElementById(`edit-author-${index}`).value.trim();
  const isbn = document.getElementById(`edit-isbn-${index}`).value.trim();
  const available =
    document.getElementById(`edit-available-${index}`).value === "true";
  const genre = document.getElementById(`edit-genre-${index}`).value;

  const updatedBook = { title, author, isbn, available, genre };

  const errors = getAddBookErrors(title, author, isbn, genre);
  if (errors.length > 0) {
    const message = `<ul>${errors
      .map((error) => `<li>${error}</li>`)
      .join("")}</ul>`;
    showConfirmation(message, 0);
    return;
  }

  const result = await window.electronAPI.editBook(originalIsbn, updatedBook);

  if (result.success) {
    // Refresh the table to reflect the updated book
    const books = await window.electronAPI.getBooks();
    displayBooks(books);
    showConfirmation("Book updated successfully.", 1);
  } else {
    showConfirmation(result.message, 0);
  }
}

async function removeBook(isbn) {
  try {
    const result = await window.electronAPI.removeBook(isbn);
    if (result.success) {
      // Refresh the table
      const books = await window.electronAPI.getBooks();
      displayBooks(books);
      showConfirmation("Book removed successfully.", 1);
    } else {
      showConfirmation(result.message, 0);
    }
  } catch (error) {
    showConfirmation("Error removing book: " + error.message, 0);
  }
}

function updateRowIndices() {
  [...booksTableBody.rows].forEach((row, i) => {
    row.cells[0].textContent = i + 1;
    row.id = `row-${i + 1}`;
  });
}

// Add Book Form Submission
addBookForm.addEventListener("submit", async (event) => {
  console.log("Add book form submitted");
  event.preventDefault(); // Prevent page reload
  const bookTitleValue = bookTitle.value.trim();
  const bookAuthorValue = bookAuthor.value.trim();
  const bookIsbnValue = bookIsbn.value.trim();
  const bookAvailable =
    document.querySelector('input[name="availability"]:checked').value ===
    "true";
  const bookGenreValue = bookGenre.value;

  let errors = [];

  const book = {
    title: bookTitleValue,
    author: bookAuthorValue,
    isbn: bookIsbnValue,
    available: bookAvailable,
    genre: bookGenreValue,
  };

  errors = getAddBookErrors(
    bookTitleValue,
    bookAuthorValue,
    bookIsbnValue,
    bookGenreValue
  );

  if (errors.length > 0) {
    errorMessage.innerHTML = `<ul>${errors
      .map((error) => `<li>${error}</li>`)
      .join("")}</ul>`;
    return;
  }

  try {
    const result = await window.electronAPI.addBook(book);

    if (result.success) {
      // Refresh the table with the updated book list
      const books = await window.electronAPI.getBooks();
      displayBooks(books);
      showConfirmation("Book added successfully.", 1);
      // Reset form
      bookTitle.value = "";
      bookAuthor.value = "";
      bookIsbn.value = "";
      document.getElementById("availableYes").checked = true;
      bookGenre.value = "Fiction";
      errorMessage.innerHTML = "";
    } else {
      errors.push(result.message);
      errorMessage.innerHTML = `<ul>${errors
        .map((error) => `<li>${error}</li>`)
        .join("")}</ul>`;
    }
  } catch (error) {
    errorMessage.innerHTML = `<ul><li>Error adding book: ${error.message}</li></ul>`;
    showConfirmation("Error adding book.", 0);
  }
});

// Search Book Form Submission
searchBookForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const title = searchTitle.value.trim();
  const author = searchAuthor.value.trim();
  const isbn = searchIsbn.value.trim();
  const genre = searchGenre.value;
  const availabilityValue = document.querySelector(
    'input[name="searchAvailability"]:checked'
  ).value;
  const available =
    availabilityValue === "all" ? null : availabilityValue === "true";

  const searchParams = { title, author, isbn, genre, available };

  try {
    const books = await window.electronAPI.searchBooks(searchParams);
    displayBooks(books);
    searchErrorMessage.innerHTML = "";
    showConfirmation(
      books.length > 0
        ? `Found ${books.length} book(s).`
        : "No books found.",
      books.length > 0 ? 1 : 0
    );
  } catch (error) {
    searchErrorMessage.innerHTML = `<ul><li>Error searching books: ${error.message}</li></ul>`;
    showConfirmation("Error searching books.", 0);
  }
});

// Clear Search Button
clearSearchButton.addEventListener("click", () => {
  searchTitle.value = "";
  searchAuthor.value = "";
  searchIsbn.value = "";
  searchGenre.value = "None";
  document.getElementById("searchAvailableAll").checked = true;
  searchErrorMessage.innerHTML = "";
  displayBooks(); // Reset to full book list
  showConfirmation("Search cleared.", 1);
});

function getAddBookErrors(title, author, isbn, genre) {
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
  if (!genre) {
    errors.push("Genre is required.");
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

const allSearchBookInputs = [searchTitle, searchAuthor, searchIsbn].filter(
  (input) => input
);
allSearchBookInputs.forEach((input) => {
  input.addEventListener("input", () => {
    searchErrorMessage.innerHTML = "";
  });
});

backButton.addEventListener("click", () => {
  localStorage.removeItem("librarianUsername");
  localStorage.removeItem("librarianCode");
  window.electronAPI.loadPage("views/librarian-register.html");
});

manageRequestsButton.addEventListener("click", () => {
  window.electronAPI.loadPage("views/librarian-requests.html");
});

manageBorrowedBooksButton.addEventListener("click", () => {
  window.electronAPI.loadPage("views/librarian-borrowed-books.html");
});

issueBookButton.addEventListener("click", () => {
  window.electronAPI.loadPage("views/librarian-issue-book.html");
});

function showConfirmation(message, errorCode) {
  if (errorCode === 0) {
    confirmationMessage.style.color = "red";
  } else {
    confirmationMessage.style.color = "green";
  }

  confirmationMessage.textContent = message;
  setTimeout(() => {
    confirmationMessage.textContent = "";
  }, 3000);
}