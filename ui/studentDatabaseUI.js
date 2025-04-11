// Page Elements
const backButton = document.getElementById("backButton");
const studentUsername = localStorage.getItem("studentUsername");
const studentUsernameDisplay = document.getElementById("studentName");
const confirmationMessage = document.getElementById("confirmationMessage");
const booksTableBody = document.getElementById("booksTableBody");
const requestedBooksList = document.getElementById("requestedBooksList");

// Set the student username in the UI
studentUsernameDisplay.textContent = `Welcome, ${studentUsername}`;

// Initialize the table and requested books list
displayBooks();
displayRequestedBooks();

// Event listener for page reload
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
    booksTableBody.innerHTML = "<tr><td colspan='7'>No books available.</td></tr>";
    return;
  }
  const requestedBooks = await window.electronAPI.getStudentRequests(studentUsername);
  books.forEach((book, index) => addBookRow(book, index, requestedBooks));
}

// Function to add a book row to the table
function addBookRow(book, index, requestedBooks) {
  const row = document.createElement("tr");
  row.id = `row-${index + 1}`;
  const isRequested = requestedBooks.some((req) => req.isbn === book.isbn);
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
              ${isRequested ? "disabled" : ""} 
              style="background: ${isRequested ? '#00cc00' : ''}">
        ${isRequested ? "Requested" : "Request"}
      </button>
    </td>
  `;
  booksTableBody.appendChild(row);
}

// Function to request a book
async function requestBook(isbn) {
  const result = await window.electronAPI.requestBook(isbn);
  confirmationMessage.textContent = result.message;
  confirmationMessage.style.color = result.success ? "green" : "red";
  setTimeout(() => (confirmationMessage.textContent = ""), 3000);

  if (result.success) {
    const button = document.getElementById(`request-btn-${isbn}`);
    if (button) {
      button.textContent = "Requested";
      button.style.background = "#00cc00"; // Green
      button.disabled = true; // Unclickable
    }
    displayRequestedBooks(); // Refresh the list
  }
}

// Function to unrequest a book
async function unrequestBook(isbn) {
  const result = await window.electronAPI.unrequestBook(isbn);
  if (result.success) {
    const button = document.getElementById(`request-btn-${isbn}`);
    if (button) {
      button.textContent = "Request";
      button.style.background = "#573b8a"; // Reset to original color
      button.disabled = false;
    }
    displayRequestedBooks(); // Refresh the list
    confirmationMessage.textContent = result.message;
    confirmationMessage.style.color = "green";
    setTimeout(() => (confirmationMessage.textContent = ""), 3000);
  } else {
    confirmationMessage.textContent = "Failed to remove request.";
    confirmationMessage.style.color = "red";
    setTimeout(() => (confirmationMessage.textContent = ""), 3000);
  }
}

// Function to display requested books list
async function displayRequestedBooks() {
  const requestedBooks = await window.electronAPI.getStudentRequests(studentUsername);
  requestedBooksList.innerHTML = ""; // Clear existing list
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

backButton.addEventListener("click", () => {
  localStorage.removeItem("studentUsername");
  window.electronAPI.loadPage("views/student-register.html");
});