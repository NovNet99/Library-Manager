const backButton = document.getElementById("backButton");
const studentUsername = localStorage.getItem("studentUsername");
const studentUsernameDisplay = document.getElementById("studentName");
const confirmationMessage = document.getElementById("confirmationMessage");
const booksTableBody = document.getElementById("booksTableBody");
const requestedBooksList = document.getElementById("requestedBooksList");
const borrowedBooksList = document.getElementById("borrowedBooksList");

studentUsernameDisplay.textContent = `Welcome, ${studentUsername}`;

displayBooks();
displayRequestedBooks();
displayBorrowedBooks();

window.addEventListener("beforeunload", () => {
  console.log("Page is reloading!");
});

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
  const borrowedBooks = await window.electronAPI.getBorrowedBooks(studentUsername);
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
      </div>
    `;
    borrowedBooksList.appendChild(item);
  });
}

backButton.addEventListener("click", () => {
  localStorage.removeItem("studentUsername");
  window.electronAPI.loadPage("views/student-register.html");
});