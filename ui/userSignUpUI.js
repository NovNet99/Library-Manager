const userRegisterForm = document.getElementById("userRegisterForm");

const usernameInputRegister = document.getElementById("usernameInputRegister");
const passwordInputRegister = document.getElementById("passwordInputRegister");
const repeatPasswordInputRegister = document.getElementById(
  "repeatPasswordInputRegister"
);

const errorMessage = document.getElementById("errorMessage");
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
  };

  errors = getRegisterErrors(
    usernameInputRegisterValue,
    passwordInputRegisterValue
  );

  if (errors.length > 0) {
    errorMessage.innerHTML = errors
      .map((error) => `<li>${error}</li>`)
      .join("");
    return;
  }

  const response = await window.electronAPI.registerUser(user);

  if (!response.success) {
    errors.push(response.message);
    errorMessage.innerHTML = errors
      .map((error) => `<li>${error}</li>`)
      .join("");
  } else {
    window.electronAPI.loadPage("../userDatabase.html");
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

const allInputs = [
  usernameInputRegister,
  passwordInputRegister,
  repeatPasswordInputRegister,
].filter((input) => input != null);

allInputs.forEach((input) => {
  input.addEventListener("input", () => {
    errorMessage.innerText = ""; // Clear error message dynamically
  });
});

backButton.addEventListener("click", () => {
  window.electronAPI.loadPage("views/index.html"); // Go back to the main page
});
