//Page Elements
const backButton = document.getElementById("backButton");
const studentUsername = localStorage.getItem("studentUsername");
const studentUsernameDisplay = document.getElementById("studentName");
const confirmationMessage = document.getElementById("confirmationMessage");

//Table Body
const booksTableBody = document.getElementById("booksTableBody");

//Set the student username in the UI
studentUsernameDisplay.textContent = `Welcome, ${studentUsername}`;

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
  if (!books || books.length === 0) {
    booksTableBody.innerHTML = "<tr><td colspan='7'>No books available.</td></tr>";
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
      <button type="button" onclick="requestBook('${book.isbn}')">Request</button>
    </td>
  `;
  booksTableBody.appendChild(row);
}

async function requestBook(isbn) {
  const result = await window.electronAPI.requestBook(isbn);
  confirmationMessage.textContent = result.message;
  confirmationMessage.style.color = result.success ? "green" : "red";
  setTimeout(() => (confirmationMessage.textContent = ""), 3000); // Clear after 3s
}

backButton.addEventListener("click", () => {
  localStorage.removeItem("studentUsername");
  window.electronAPI.loadPage("views/student-register.html");
});