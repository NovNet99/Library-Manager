const userRegisterForm = document.getElementById("userRegisterForm");
const userLoginForm = document.getElementById("userLoginForm");

const usernameInputRegister = document.getElementById("usernameInputRegister");
const passwordInputRegister = document.getElementById("passwordInputRegister");
const repeatPasswordInputRegister = document.getElementById(
  "repeatPasswordInputRegister"
);

const usernameInputLogin = document.getElementById("usernameInputLogin");
const passwordInputLogin = document.getElementById("passwordInputLogin");

const errorMessage = document.getElementById("errorMessage");
const errorMessageLogin = document.getElementById("errorMessageLogin");

const backButton = document.getElementById("backButton");

userRegisterForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const usernameInputRegisterValue = usernameInputRegister.value.trim();
  const passwordInputRegisterValue = passwordInputRegister.value;
  const repeatPasswordInputRegisterValue = repeatPasswordInputRegister.value;

  let errors = [];

  const user = {
    username: usernameInputRegisterValue,
    password: passwordInputRegisterValue,
    repeatPassword: repeatPasswordInputRegisterValue,
    role: "student",
  };

  errors = getRegisterErrors(
    usernameInputRegisterValue,
    passwordInputRegisterValue
  );

  if (errors.length > 0) {
    errorMessage.innerHTML = `<ul>${errors
      .map((error) => `<li>${error}</li>`)
      .join("")}</ul>`;
    return;
  }

  const response = await window.electronAPI.registerUser(user);

  if (!response.success) {
    errors.push(response.message);
    errorMessage.innerHTML = errors
      .map((error) => `<li>${error}</li>`)
      .join("");
  } else {
    window.electronAPI.loadPage("./userDatabase.html");
  }
});

userLoginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const usernameInputLoginValue = usernameInputLogin.value.trim();
  const passwordInputLoginValue = passwordInputLogin.value;

  let errors = [];

  const user = {
    username: usernameInputLoginValue,
    password: passwordInputLoginValue,
    role: "student",
  };

  errors = getRegisterErrors(
    usernameInputLoginValue,
    passwordInputLoginValue
  );

  if (errors.length > 0) {
    errorMessageLogin.innerHTML = errors
      .map((error) => `<li>${error}</li>`)
      .join("");
    return;
  }

  const response = await window.electronAPI.loginUser(user);

  if (!response.success) {
    errors.push(response.message);
    errorMessageLogin.innerHTML = `<ul>${errors
      .map((error) => `<li>${error}</li>`)
      .join("")}</ul>`;
  } else {
    window.electronAPI.loadPage("./userDatabase.html");
  }
});

function getRegisterErrors(username, password) {
  let errors = [];

  if (!username) {
    errors.push("Username is required.");
  }

  if (!password) {
    errors.push("Password is required.");
  }

  return errors;
}

const allRegisterInputs = [
  usernameInputRegister,
  passwordInputRegister,
  repeatPasswordInputRegister,
].filter((input) => input != null);

const allLoginInputs = [
  usernameInputLogin,
  passwordInputLogin,
].filter((input) => input != null);

allRegisterInputs.forEach((input) => {
  input.addEventListener("input", () => {
    errorMessage.innerText = ""; // Clear error message dynamically
  });
});

allLoginInputs.forEach((input) => {
  input.addEventListener("input", () => {
    errorMessageLogin.innerText = ""; // Clear error message dynamically
  });
});

backButton.addEventListener("click", () => {
  window.electronAPI.loadPage("views/index.html"); // Go back to the main page
});
