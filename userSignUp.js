const form =
  document.getElementById("userSignUpForm") ||
  document.getElementById("userLoginForm");
const usernameInput = document.getElementById("usernameInput");
const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");
const repeatPasswordInput = document.getElementById("repeatPasswordInput");
const errorMessage = document.getElementById("errorMessage");
const backBtn = document.getElementById("goBack");

const isSignUpPage = form && usernameInput && passwordInput && repeatPasswordInput;
const isLoginPage = form && usernameInput && passwordInput && !repeatPasswordInput;

form.addEventListener("submit", async (event) => {
  event.preventDefault(); // Always prevent form submission until validation is done

  const usernameInputValue = usernameInput.value.trim();
  const passwordInputValue = passwordInput.value;
  
  const emailInputValue = isSignUpPage ? emailInput.value.trim() : null;
  const repeatPasswordInputValue = isSignUpPage ? repeatPasswordInput.value : null;

  let errors = [];

  const user = {
    username: usernameInputValue,
    email: emailInputValue,
    password: passwordInputValue,
    repeatPassword: repeatPasswordInputValue,
  };

  if (form.id === "userSignUpForm") {
    // Get errors from the Sign Up form validation
    errors = getSignUpFormErrors(usernameInputValue, emailInputValue, passwordInputValue, repeatPasswordInputValue);

    // If there are any errors, display them and stop the process
    if (errors.length > 0) {
      errorMessage.innerHTML = errors.map(error => `<li>${error}</li>`).join('');
      return; // Stop execution if there are errors
    }

    // Proceed to Sign Up logic only if no errors exist
    const response = await window.electronAPI.saveUser(user);

    if (!response.success) {
      errors.push(response.message);
      errorMessage.innerHTML = errors.map(error => `<li>${error}</li>`).join('');
    } else {
      errors.push(response.message);
      errorMessage.innerHTML = errors.map(error => `<li>${error}</li>`).join('');
      localStorage.setItem("loggedInUser", user.username);
      window.electronAPI.loadPage("userDatabase.html");
    }
  } else if (form.id === "userLoginForm") {
    // Get errors from the Login form validation
    errors = getLogInFormErrors(usernameInputValue, passwordInputValue);

    // If there are any errors, display them and stop the process
    if (errors.length > 0) {
      errorMessage.innerHTML = errors.map(error => `<li>${error}</li>`).join('');
      return; // Stop execution if there are errors
    }

    // Proceed to Login logic only if no errors exist
    const response = await window.electronAPI.loginUser(user);

    if (!response.success) {
      errors.push(response.message);
      errorMessage.innerHTML = errors.map(error => `<li>${error}</li>`).join('');
    } else {
      errors.push(response.message);
      errorMessage.innerHTML = errors.map(error => `<li>${error}</li>`).join('');
      localStorage.setItem("loggedInUser", user.username);
      window.electronAPI.loadPage("userDatabase.html");
    }
  }

  if (errors.length > 0) {
    // This check might seem redundant now but can be useful in some situations
    errorMessage.innerText = errors.join(". ");
  }
});

function getSignUpFormErrors(username, email, password, repeatPassword) {
  let errors = [];

  if (!username) {
    errors.push("Username is required.");
    usernameInput.parentElement.classList.add("incorrect");
  }

  if (!email) {
    errors.push("Email is required.");
    emailInput.parentElement.classList.add("incorrect");
  }

  if (!password) {
    errors.push("Password is required.");
    passwordInput.parentElement.classList.add("incorrect");
  }

  if (password !== repeatPassword) {
    errors.push("Passwords do not match.");
    repeatPasswordInput.parentElement.classList.add("incorrect");
  }

  return errors;
}

function getLogInFormErrors(username, password) {
  let errors = [];

  if (!username) {
    errors.push("Username is required.");
    usernameInput.parentElement.classList.add("incorrect");
  }

  if (!password) {
    errors.push("Password is required.");
    passwordInput.parentElement.classList.add("incorrect");
  }

  return errors;
}

const allInputs = [
  usernameInput,
  emailInput,
  passwordInput,
  repeatPasswordInput,
].filter((input) => input != null);

allInputs.forEach((input) => {
  input.addEventListener("input", () => {
    input.parentElement.classList.remove("incorrect");
    errorMessage.innerText = ""; // Clear error message dynamically
  });
});

backBtn.addEventListener("click", () => {
  window.electronAPI.loadPage("index.html"); // Go back to the main page
});
