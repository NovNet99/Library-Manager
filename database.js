//--------DATABASE.HTML CODE FUNCTIONALITY--------
// Get references to elements
const bookFormContainer = document.getElementById("bookFormContainer");
const backBtn = document.getElementById("goBack");
const addBookBtn = document.getElementById("addBookBtn");
const saveBookBtn = document.getElementById("saveBookBtn");
const cancelBookBtn = document.getElementById("cancelBookBtn");
const bookTitle = document.getElementById("bookTitle");
const bookAuthor = document.getElementById("bookAuthor");

bookTitle.addEventListener("focus", () => {
  console.log("Title field focused");
});
bookAuthor.addEventListener("focus", () => {
  console.log("Author field focused");
});

// Event listener to handle the back button
backBtn.addEventListener("click", () => {
  window.electronAPI.loadPage("index.html"); // Go back to the main page
});

// Function to clear input fields
function removeInnerText() {
  bookTitle.value = "";
  bookAuthor.value = "";
}

//Toggles the hidden class on elements to make them appear/dissapear when a button is clicked.
function toggleHiddeness() {
  bookFormContainer.classList.toggle("hidden");
  addBookBtn.classList.toggle("hidden");
}

// Event listener to handle Add Book button click
addBookBtn.addEventListener("click", () => {
  // Toggle visibility of the book form
  toggleHiddeness();
});

// Event listener for the save button
saveBookBtn.addEventListener("click", () => {
  const title = bookTitle.value;
  const author = bookAuthor.value;

  if (title && author) {
    window.electronAPI.saveBook({ title, author });

    // Hide the form and show the add book button
    toggleHiddeness();

    // Clear input fields after save
    removeInnerText();
    document.getElementById("error-message").style.display = "none";
  } else {
    document.getElementById("error-message").style.display = "block";
    //alert("Please fill in both title and author!");

    // Focus on the first empty input field for user convenience
    if (!title) {
      bookTitle.focus();
    } else if (!author) {
      bookAuthor.focus();
    }
  }
});

// Event listener for the cancel button
cancelBookBtn.addEventListener("click", () => {
  // Hide the form and show the add book button
  toggleHiddeness();

  // Clear input fields after cancellation
  removeInnerText();
  document.getElementById("error-message").style.display = "none";
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
          </tr>`
      )
      .join("");
  }
}

// Load books when page loads
document.addEventListener("DOMContentLoaded", loadBooks);
