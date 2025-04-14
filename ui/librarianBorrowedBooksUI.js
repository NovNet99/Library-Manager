const backButton = document.getElementById("backButton");
const librarianUsername = localStorage.getItem("librarianUsername");
const librarianNameDisplay = document.getElementById("librarianName");
const confirmationMessage = document.getElementById("confirmationMessage");
const borrowedBooksList = document.getElementById("borrowedBooksList");

// Set librarian name
librarianNameDisplay.textContent = `Welcome, ${librarianUsername}`;

// Display borrowed books on load
displayBorrowedBooks();

async function displayBorrowedBooks() {
  const borrowedBooks = await window.electronAPI.getAllBorrowedBooksWithFines();
  borrowedBooksList.innerHTML = "";
  if (borrowedBooks.length === 0) {
    borrowedBooksList.innerHTML = "<p>No borrowed books.</p>";
    return;
  }
  // Group books by username
  const booksByUser = borrowedBooks.reduce((acc, book) => {
    const { username } = book;
    acc[username] = acc[username] || [];
    acc[username].push(book);
    return acc;
  }, {});
  // Render each user's books
  Object.entries(booksByUser).forEach(([username, books]) => {
    if (books.length > 0) {
      const section = document.createElement("div");
      section.className = "borrowed-section";
      const totalFines = books.reduce((sum, book) => sum + (book.fine || 0), 0);
      section.innerHTML = `
        <h3>${username} (Total Fines: $${totalFines})</h3>
      `;
      const list = document.createElement("div");
      list.className = "borrowed-items";
      books.forEach((book) => {
        const item = document.createElement("div");
        item.className = "borrowed-item";
        const statusColor = book.fine > 0 ? "red" : book.daysUntilDue === 0 ? "yellow" : "green";
        // Conditional buttons with CSS classes
        const actionButtons = book.fine === 0
          ? `<button type="button" class="button-return" onclick="confirmReturn('${book.username}', '${book.isbn}', ${book.fine})">Confirm Return</button>`
          : `
              <button type="button" class="button-payment" onclick="confirmPayment('${book.username}', '${book.isbn}')">Confirm Payment</button>
              <button type="button" class="button-payment-return" onclick="confirmPaymentAndReturn('${book.username}', '${book.isbn}')">Confirm Payment & Return</button>
            `;
        item.innerHTML = `
          <div class="borrowed-details">
            <p><strong>Title:</strong> ${book.title}</p>
            <p><strong>ISBN:</strong> ${book.isbn}</p>
            <p><strong>Approval Date:</strong> ${book.approvalDate}</p>
            <p><strong>Due Date:</strong> ${book.dueDate}</p>
            <p><strong>Status:</strong> ${book.daysUntilDue >= 0 ? `Due in ${book.daysUntilDue} day(s)` : `Overdue by ${Math.abs(book.daysUntilDue)} day(s)`}</p>
            <p><strong>Fine:</strong> $${book.fine}</p>
          </div>
          <div class="borrowed-actions">
            ${actionButtons}
          </div>
        `;
        list.appendChild(item);
      });
      section.appendChild(list);
      borrowedBooksList.appendChild(section);
    }
  });
}

async function confirmReturn(username, isbn, fine) {
  if (fine > 0) {
    showConfirmation("Cannot return book: Outstanding fines must be cleared.", false);
    return;
  }
  const result = await window.electronAPI.confirmBookReturn({ username, isbn });
  showConfirmation(result.message, result.success);
  if (result.success) displayBorrowedBooks();
}

async function confirmPayment(username, isbn) {
  const result = await window.electronAPI.confirmPayment({ username, isbn });
  showConfirmation(result.message, result.success);
  if (result.success) displayBorrowedBooks();
}

async function confirmPaymentAndReturn(username, isbn) {
  const result = await window.electronAPI.confirmPaymentAndReturn({ username, isbn });
  showConfirmation(result.message, result.success);
  if (result.success) displayBorrowedBooks();
}

backButton.addEventListener("click", () => {
  window.electronAPI.loadPage("views/librarian-database.html");
});

function showConfirmation(message, success) {
  confirmationMessage.textContent = message;
  confirmationMessage.style.color = success ? "green" : "red";
  setTimeout(() => (confirmationMessage.textContent = ""), 3000);
}