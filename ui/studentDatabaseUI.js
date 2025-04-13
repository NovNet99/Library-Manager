const backButton = document.getElementById("backButton");
const studentUsername = localStorage.getItem("studentUsername");
const studentUsernameDisplay = document.getElementById("studentName");
const confirmationMessage = document.getElementById("confirmationMessage");
const booksTableBody = document.getElementById("booksTableBody");
const requestedBooksList = document.getElementById("requestedBooksList");
const borrowedBooksList = document.getElementById("borrowedBooksList");
const finesDisplay = document.getElementById("finesDisplay"); // New element

studentUsernameDisplay.textContent = `Welcome, ${studentUsername}`;

// Search Book Form Elements
const searchBookForm = document.getElementById("searchBookForm");
const searchTitle = document.getElementById("titleInputSearchBook");
const searchAuthor = document.getElementById("authorInputSearchBook");
const searchIsbn = document.getElementById("isbnInputSearchBook");
const searchGenre = document.getElementById("searchGenreSelect");
const searchErrorMessage = document.getElementById("searchErrorMessage");
const clearSearchButton = document.getElementById("clearSearchButton");

displayBooks();
displayRequestedBooks();
displayBorrowedBooks();
displayFines(); // New function

async function displayBooks(books) {
  if (!books) books = await window.electronAPI.getBooks();
  booksTableBody.innerHTML = "";
  if (!books || books.length === 0) {
    booksTableBody.innerHTML = "<tr><td colspan='7'>No books available.</td></tr>";
    return;
  }
  const requestedBooks = await window.electronAPI.getStudentRequests(studentUsername);
  const borrowedBooks = await window.electronAPI.getBorrowedBooks(studentUsername);
  books.forEach((book, index) => addBookRow(book, index, requestedBooks, borrowedBooks));
}

function addBookRow(book, index, requestedBooks, borrowedBooks) {
  const row = document.createElement("tr");
  row.id = `row-${index + 1}`;
  const isRequested = requestedBooks.some((req) => req.isbn === book.isbn);
  const isBorrowed = borrowedBooks.some((bor) => bor.isbn === book.isbn);
  const buttonState = isBorrowed
    ? { text: "Borrowed", bg: "#00b7eb", disabled: true }
    : isRequested
    ? { text: "Requested", bg: "#00cc00", disabled: true }
    : { text: "Request", bg: "", disabled: false };
  row.innerHTML = `
    <td>${index + 1}</td>
    <td>${book.title}</td>
    <td>${book.author}</td>
    <td>${book.isbn}</td>
    <td>${book.genre}</td>
    <td>${book.available ? "Yes" : "No"}</td>
    <td>
      <button type="button" id="request-btn-${book.isbn}" 
              onclick="requestBook('${book.isbn}')" 
              ${buttonState.disabled ? "disabled" : ""} 
              style="background: ${buttonState.bg}">
        ${buttonState.text}
      </button>
    </td>
  `;
  booksTableBody.appendChild(row);
}

async function requestBook(isbn) {
  const result = await window.electronAPI.requestBook(isbn);
  confirmationMessage.textContent = result.message;
  confirmationMessage.style.color = result.success ? "green" : "red";
  setTimeout(() => (confirmationMessage.textContent = ""), 3000);
  if (result.success) {
    const button = document.getElementById(`request-btn-${isbn}`);
    if (button) {
      button.textContent = "Requested";
      button.style.background = "#00cc00";
      button.disabled = true;
    }
    displayRequestedBooks();
    displayBooks();
  }
}

async function unrequestBook(isbn) {
  const result = await window.electronAPI.unrequestBook(isbn);
  if (result.success) {
    const button = document.getElementById(`request-btn-${isbn}`);
    if (button) {
      button.textContent = "Request";
      button.style.background = "#573b8a";
      button.disabled = false;
    }
    displayRequestedBooks();
    displayBooks();
    confirmationMessage.textContent = result.message;
    confirmationMessage.style.color = "green";
    setTimeout(() => (confirmationMessage.textContent = ""), 3000);
  } else {
    confirmationMessage.textContent = "Failed to remove request.";
    confirmationMessage.style.color = "red";
    setTimeout(() => (confirmationMessage.textContent = ""), 3000);
  }
}

async function displayRequestedBooks() {
  const requestedBooks = await window.electronAPI.getStudentRequests(studentUsername);
  requestedBooksList.innerHTML = "";
  if (!requestedBooks || requestedBooks.length === 0) {
    requestedBooksList.innerHTML = "<p>No books requested yet.</p>";
    return;
  }
  requestedBooks.forEach((book) => {
    const item = document.createElement("div");
    item.className = "requested-book-item";
    item.innerHTML = `
      <div class="book-details">
        <p><strong>Title:</strong> ${book.title}</p>
        <p><strong>Author:</strong> ${book.author}</p>
        <p><strong>ISBN:</strong> ${book.isbn}</p>
        <p><strong>Genre:</strong> ${book.genre}</p>
      </div>
      <button type="button" onclick="unrequestBook('${book.isbn}')">Unrequest</button>
    `;
    requestedBooksList.appendChild(item);
  });
}

async function displayBorrowedBooks() {
  const borrowedBooks = await window.electronAPI.getDueDateStatus(studentUsername);
  borrowedBooksList.innerHTML = "";
  if (!borrowedBooks || borrowedBooks.length === 0) {
    borrowedBooksList.innerHTML = "<p>No books borrowed yet.</p>";
    return;
  }
  borrowedBooks.forEach((book) => {
    const item = document.createElement("div");
    item.className = "borrowed-book-item";
    item.innerHTML = `
      <div class="book-details">
        <p><strong>Title:</strong> ${book.title}</p>
        <p><strong>ISBN:</strong> ${book.isbn}</p>
        <p><strong>Approval Date:</strong> ${book.approvalDate}</p>
        <p><strong>Due Date:</strong> ${book.dueDate}</p>
        <p><strong>Status:</strong> <span style="color: ${book.notificationColor}">${book.daysUntilDue}</span></p>
      </div>
    `;
    borrowedBooksList.appendChild(item);
  });
}

async function displayFines() {
  const fines = await window.electronAPI.getFines(studentUsername);
  finesDisplay.textContent = `Pending Fines: $${fines}`;
  finesDisplay.style.color = fines > 0 ? "red" : "green";
}

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
  displayBooks();
  showConfirmation("Search cleared.", 1);
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
  localStorage.removeItem("studentUsername");
  window.electronAPI.loadPage("views/student-register.html");
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