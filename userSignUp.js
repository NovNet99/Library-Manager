const form = document.getElementById("userSignUpForm");
const usernameInput = document.getElementById("usernameInput");
const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");
const repeatPasswordInput = document.getElementById("repeatPasswordInput");
const errorMessage = document.getElementById("errorMessage");

form.addEventListener("submit", async (event) => {
  event.preventDefault(); // Always prevent form submission until validation is done

  const usernameInputValue = usernameInput.value.trim();
  const emailInputValue = emailInput.value.trim();
  const passwordInputValue = passwordInput.value;
  const repeatPasswordInputValue = repeatPasswordInput.value;

  let errors = getSignUpFormErrors(
    usernameInputValue,
    emailInputValue,
    passwordInputValue,
    repeatPasswordInputValue
  );

  if (errors.length > 0) {
    errorMessage.innerText = errors.join(". ");
    return; // Stop execution if there are errors
  }

  const user = { 
    username: usernameInputValue, 
    email: emailInputValue, 
    password: passwordInputValue, 
    repeatPassword: repeatPasswordInputValue 
  };

  const response = await window.electronAPI.saveUser(user);

  if (!response.success) {
    errors.push(response.message);
    errorMessage.innerText = errors.join(". ");
  } else {
    errors.push(response.message);
    errorMessage.innerText = errors.join(". ");
    window.location.href = "userlogin.html";
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

const allInputs = [usernameInput, emailInput, passwordInput, repeatPasswordInput];

allInputs.forEach((input) => {
  input.addEventListener("input", () => {
    input.parentElement.classList.remove("incorrect");
    errorMessage.innerText = ""; // Clear error message dynamically
  });
});
