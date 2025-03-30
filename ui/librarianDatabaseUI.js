const addBookForm = document.getElementById("addBookForm");
const booksTableBody = document.getElementById("booksTableBody");
const confirmationMessage = document.getElementById("confirmationMessage");

const bookTitle = document.getElementById("titleInputAddBook");
const bookAuthor = document.getElementById("authorInputAddBook");
const bookIsbn = document.getElementById("isbnInputAddBook");
const bookGenre = document.getElementById("genreSelect");

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
        `<tr id="row-${index}">
          <td>${index}</td>
          <td>${book.title}</td>
          <td>${book.author}</td>
          <td>${book.isbn}</td>
          <td>${book.genre}</td>
          <td>${book.available ? "Yes" : "No"}</td>
          <td>
            <button onclick="editBook('${index}')">Edit</button>
            <button onclick="removeBook('${book.isbn}')">Remove</button>
          </td>
        </tr>`
    )
    .join("");
}

async function editBook(index) {
  const row = document.getElementById(`row-${index}`);
  if (!row) {
    console.error(`Row with ID row-${index} not found`);
    errorMessage.textContent = "Error: Book row not found.";
    return;
  }

  const books = await window.electronAPI.getBooks();
  const book = books[index];
  if (!book) {
    console.error(`Book at index ${index} not found in data`);
    errorMessage.textContent = "Error: Book not found in database.";
    return;
  }

  row.innerHTML = `
    <td>${index}</td>
    <td><input type="text" value="${book.title}" id="edit-title-${index}" /></td>
    <td><input type="text" value="${book.author}" id="edit-author-${index}" /></td>
    <td><input type="text" value="${book.isbn}" id="edit-isbn-${index}" /></td>
    <td>
      <select id="edit-genre-${index}">
        <option value="None" ${book.genre === "None" ? "selected" : ""}>None</option>
        <option value="Fiction" ${book.genre === "Fiction" ? "selected" : ""}>Fiction</option>
        <option value="Non-Fiction" ${book.genre === "Non-Fiction" ? "selected" : ""}>Non-Fiction</option>
        <option value="Science Fiction" ${book.genre === "Science Fiction" ? "selected" : ""}>Science Fiction</option>
        <option value="Fantasy" ${book.genre === "Fantasy" ? "selected" : ""}>Fantasy</option>
        <option value="Mystery" ${book.genre === "Mystery" ? "selected" : ""}>Mystery</option>
        <option value="Biography" ${book.genre === "Biography" ? "selected" : ""}>Biography</option>
      </select>
    </td>
    <td>
      <select id="edit-available-${index}">
        <option value="true" ${book.available ? "selected" : ""}>Yes</option>
        <option value="false" ${!book.available ? "selected" : ""}>No</option>
      </select>
    </td>
    <td>
      <button onclick="saveBook('${index}', '${book.isbn}')">Save</button>
      <button onclick="displayBooks()">Cancel</button>
    </td>
  `;
}

async function saveBook(index, originalIsbn) {
  const title = document.getElementById(`edit-title-${index}`).value.trim();
  const author = document.getElementById(`edit-author-${index}`).value.trim();
  const isbn = document.getElementById(`edit-isbn-${index}`).value.trim();
  const available = document.getElementById(`edit-available-${index}`).value === "true";
  const genre = document.getElementById(`edit-genre-${index}`).value;

  const updatedBook = { title, author, isbn, available, genre };

  const errors = getAddBookErrors(title, author, isbn, genre);
  if (errors.length > 0) {
    errorMessage.innerHTML = `<ul>${errors.map(error => `<li>${error}</li>`).join("")}</ul>`;
    return;
  }

  const result = await window.electronAPI.editBook(originalIsbn, updatedBook);

  if (result.success) {
    await displayBooks();
    showConfirmation("Book updated successfully.");
  } else {
    errorMessage.textContent = result.message;
  }
}

async function removeBook(isbn) {
  try {
    const result = await window.electronAPI.removeBook(isbn);
    if (result.success) {
      await displayBooks();
      showConfirmation("Book removed successfully.");
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
  const bookAvailable =
    document.querySelector('input[name="availability"]:checked').value === "true";
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

  const result = await window.electronAPI.addBook(book);

  if (result.success) {
    await displayBooks();
    showConfirmation("Book added successfully.");
    bookTitle.value = "";
    bookAuthor.value = "";
    bookIsbn.value = "";
    document.getElementById("availableYes").checked = true;
    bookGenre.value = "Fiction";
  } else {
    errors.push(result.message);
    errorMessage.innerHTML = `<ul>${errors
      .map((error) => `<li>${error}</li>`)
      .join("")}</ul>`;
  }
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

backButton.addEventListener("click", () => {
  localStorage.removeItem("librarianUsername");
  localStorage.removeItem("librarianCode");
  console.log(localStorage.getItem("librarianUsername"));
  window.electronAPI.loadPage("views/librarian-register.html");
});

function showConfirmation(message) {
  confirmationMessage.textContent = message;
  setTimeout(() => {
    confirmationMessage.textContent = "";
  }, 3000);
}