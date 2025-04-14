//Form Elements
const userRegisterForm = document.getElementById("userRegisterForm");
const userLoginForm = document.getElementById("userLoginForm");

//Register Input Elements
const usernameInputRegister = document.getElementById("usernameInputRegister");
const passwordInputRegister = document.getElementById("passwordInputRegister");
const repeatPasswordInputRegister = document.getElementById(
  "repeatPasswordInputRegister"
);
const librarianCodeInputRegister = document.getElementById(
  "librarianCodeInputRegister"
);

//Login Input Elements
const usernameInputLogin = document.getElementById("usernameInputLogin");
const passwordInputLogin = document.getElementById("passwordInputLogin");

//Sets username and password for development convenience.
usernameInputLogin.value = "Librarian0";
passwordInputLogin.value = "password";

//Register and Login error message elements.
const errorMessage = document.getElementById("errorMessage");
const errorMessageLogin = document.getElementById("errorMessageLogin");

//Back Button Element
const backButton = document.getElementById("backButton");

//Registration Submission Functionality
userRegisterForm.addEventListener("submit", async (event) => {
  //Prevents the form from submitting without the user clicking the button.
  event.preventDefault();

  //Gets the registration input values
  const usernameInputRegisterValue = usernameInputRegister.value.trim();
  const passwordInputRegisterValue = passwordInputRegister.value;
  const repeatPasswordInputRegisterValue = repeatPasswordInputRegister.value;
  const librarianCodeInputRegisterValue = librarianCodeInputRegister.value;

  let errors = [];

  //Sets the librarian object with the inputted values data.
  const librarian = {
    username: usernameInputRegisterValue,
    password: passwordInputRegisterValue,
    repeatPassword: repeatPasswordInputRegisterValue,
    role: "librarian",
    extraData: { librarianCode: librarianCodeInputRegisterValue },
  };

  //Checks for any errors with the inputted values e.g. no username inputted, passwords don't match etc.
  errors = getRegisterErrors(
    usernameInputRegisterValue,
    passwordInputRegisterValue,
    librarianCodeInputRegisterValue
  );

  //If there are any errors, adds them to a list and displays them on screen.
  if (errors.length > 0) {
    errorMessage.innerHTML = `<ul>${errors
      .map((error) => `<li>${error}</li>`)
      .join("")}</ul>`;
    return;
  }

  //Once there are no errors, it sends the librarian object to be registered.
  const response = await window.electronAPI.registerUser(librarian);

  //If the response fails, it gets the error (defined in UserManager.js) and displays it.
  if (!response.success) {
    errors.push(response.message);
    errorMessage.innerHTML = errors
      .map((error) => `<li>${error}</li>`)
      .join("");
  } else {
    //Otherwise, this means the registration was successful. 
    //The librarian username and librarian code are added to local storage to be accessed throughout the application e.g displaying librarian username.
    //Loads librarian-database.html
    localStorage.setItem("librarianUsername", usernameInputRegisterValue);
    localStorage.setItem("librarianCode", librarianCodeInputRegisterValue);
    window.electronAPI.loadPage("views/librarian-database.html");
  }
});

userLoginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  //Gets the login input values
  const usernameInputLoginValue = usernameInputLogin.value.trim();
  const passwordInputLoginValue = passwordInputLogin.value;

  let errors = [];

  //Sets the librarian object with the inputted values data.
  const librarian = {
    username: usernameInputLoginValue,
    password: passwordInputLoginValue,
    role: "librarian",
  };

  //Checks for any errors with the inputted values e.g. no username inputted etc.
  errors = getLoginErrors(usernameInputLoginValue, passwordInputLoginValue);

  //If there are any errors, adds them to a list and displays them on screen.
  if (errors.length > 0) {
    errorMessageLogin.innerHTML = errors
      .map((error) => `<li>${error}</li>`)
      .join("");
    return;
  }

  //Once there are no errors, it sends the librarian object to be logged in.
  const response = await window.electronAPI.loginUser(librarian);

  //If the response fails, it gets the error (defined in Authenticator.js) and displays it.
  if (!response.success) {
    errors.push(response.message);
    errorMessageLogin.innerHTML = `<ul>${errors
      .map((error) => `<li>${error}</li>`)
      .join("")}</ul>`;
  } else {
    //Otherwise, this means the login was successful. 
    //The librarian username is added to local storage to be accessed throughout the application e.g displaying librarian username.
    //Loads librarian-database.html
    localStorage.setItem("librarianUsername", usernameInputLoginValue);
    //Since the librarian code isn't in the login form, it is grabbed from the librarian.
    const librarianDataResponse = window.electronAPI.getLibrarianData(usernameInputLoginValue);
    if (librarianDataResponse.success) {
      localStorage.setItem("librarianCode", librarianDataResponse.librarianCode);
    }

    window.electronAPI.loadPage("views/librarian-database.html");
  }
});

function getRegisterErrors(username, password, librarianCode) {
  let errors = [];

  if (!username) {
    errors.push("Username is required.");
  }

  if (!password) {
    errors.push("Password is required.");
  }

  if (!librarianCode) {
    errors.push("Librarian Code is required.");
  }

  return errors;
}

function getLoginErrors(username, password) {
  let errors = [];

  if (!username) {
    errors.push("Username is required.");
  }

  if (!password) {
    errors.push("Password is required.");
  }

  return errors;
}

//Gets all the register and login inputs.
const allRegisterInputs = [
  usernameInputRegister,
  passwordInputRegister,
  repeatPasswordInputRegister,
  librarianCodeInputRegister,
].filter((input) => input != null);

const allLoginInputs = [usernameInputLogin, passwordInputLogin].filter(
  (input) => input != null
);

//Clears the error message fields when the user starts typing.
allRegisterInputs.forEach((input) => {
  input.addEventListener("input", () => {
    errorMessage.innerText = "";
  });
});

allLoginInputs.forEach((input) => {
  input.addEventListener("input", () => {
    errorMessageLogin.innerText = ""; 
  });
});

//Back Button Functionality
backButton.addEventListener("click", () => {
  window.electronAPI.loadPage("views/index.html"); // Go back to the main page
});
