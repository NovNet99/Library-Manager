const UserManager = require("./UserManager");

//Authenticator Class.
class Authenticator {
  constructor(role) {
    //Creates a UserManager object.
    this.userManager = new UserManager(role);
  }

  //Handles user login logic.
  login(username, password) {
    //Checks if the user exists.
    const user = this.userManager.users.find(user => user.username === username);
    if (!user) return { success: false, message: "User not found." };

    //If the password is correct, login is successful. Otherwise, the password is incorrect.
    return user.password === password
      ? { success: true, message: "Login successful!", role: user.role }
      : { success: false, message: "Incorrect password." };
  }
}

module.exports = Authenticator;