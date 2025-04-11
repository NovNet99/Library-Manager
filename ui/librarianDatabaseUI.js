//Page Elements
const backButton = document.getElementById("backButton");
const librarianUsername = localStorage.getItem("librarianUsername");
const librarianUsernameDisplay = document.getElementById("librarianName");
const confirmationMessage = document.getElementById("confirmationMessage");

//Add Book Form Elements
const addBookForm = document.getElementById("addBookForm");

const bookTitle = document.getElementById("titleInputAddBook");
const bookAuthor = document.getElementById("authorInputAddBook");
const bookIsbn = document.getElementById("isbnInputAddBook");
const bookGenre = document.getElementById("genreSelect");

const errorMessage = document.getElementById("errorMessage");

const manageRequestsButton = document.getElementById("manageRequestsButton");

//Table Body
const booksTableBody = document.getElementById("booksTableBody");

//Set the librarian username in the UI
librarianUsernameDisplay.textContent = `Welcome, ${librarianUsername}`;

//Initialize the table with existing books
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
// This function is called when the "Edit" button is clicked for a book
async function editBook(index) {
  // Check if the row exists before trying to access it
  const row = document.getElementById(`row-${parseInt(index) + 1}`);
  if (!row) {
    console.error(`Row with ID row-${parseInt(index) + 1} not found`);
    showConfirmation("Error: Row not found.", 0);
    return;
  }

  // Get the book data from the database using the index
  // This assumes that the index corresponds to the book's position in the database
  const books = await window.electronAPI.getBooks();
  const book = books[index];
  if (!book) {
    console.error(`Book at index ${index} not found in data`);
    showConfirmation("Error: Book not found in database.", 0);
    return;
  }

  //Changes the row to editable fields
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
// This function is called when the "Save" button is clicked after editing a book
async function saveBook(index, originalIsbn) {
  //Get the values from the input fields according to the index
  const title = document.getElementById(`edit-title-${index}`).value.trim();
  const author = document.getElementById(`edit-author-${index}`).value.trim();
  const isbn = document.getElementById(`edit-isbn-${index}`).value.trim();
  const available =
    document.getElementById(`edit-available-${index}`).value === "true";
  const genre = document.getElementById(`edit-genre-${index}`).value;

  //Stores the updated book data in an object
  const updatedBook = { title, author, isbn, available, genre };

  //Get the errors from the input fields
  //This function checks if the input fields are empty and returns an array of errors
  const errors = getAddBookErrors(title, author, isbn, genre);
  if (errors.length > 0) {
    const message = `<ul>${errors
      .map((error) => `<li>${error}</li>`)
      .join("")}</ul>`;
    showConfirmation(message, 0);
    return;
  }

  //Adds the updated book to the database using the original ISBN
  const result = await window.electronAPI.editBook(originalIsbn, updatedBook);

  //Check if the result is successful
  //If successful, update the row in the table with the new data
  if (result.success) {
    //await displayBooks();
    const updatedRow = document.getElementById(`row-${parseInt(index) + 1}`);
    if (updatedRow) {
      updatedRow.innerHTML = `
      <td>${parseInt(index) + 1}</td>
      <td>${title}</td>
      <td>${author}</td>
      <td>${isbn}</td>
      <td>${genre}</td>
      <td>${available ? "Yes" : "No"}</td>
      <td>
        <button type="button" onclick="editBook('${index}')">Edit</button>
        <button type="button" onclick="removeBook('${isbn}')">Remove</button>
      </td>
    `;
    }
    showConfirmation("Book updated successfully.", 1);
  } else {
    showConfirmation(result.message, 0);
  }
}

async function removeBook(isbn) {
  try {
    const result = await window.electronAPI.removeBook(isbn);
    if (result.success) {
      //await displayBooks();
      const row = [...booksTableBody.rows].find(
        (r) => r.cells[3].textContent === isbn
      );
      if (row) row.remove();
      updateRowIndices();
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

addBookForm.addEventListener("submit", async (event) => {
  event.preventDefault();
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

  const result = await window.electronAPI.addBook(book);

  if (result.success) {
    //await displayBooks();
    addBookRow(book, booksTableBody.children.length + 1);
    showConfirmation("Book added successfully.", 1);
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

manageRequestsButton.addEventListener("click", () => {
  window.electronAPI.loadPage("views/librarian-requests.html");
});

function showConfirmation(message, errorCode) {
  if (errorCode == 0) {
    confirmationMessage.style.color = "red";
  } else {
    confirmationMessage.style.color = "green";
  }

  confirmationMessage.textContent = message;
  setTimeout(() => {
    confirmationMessage.textContent = "";
  }, 3000);
}
