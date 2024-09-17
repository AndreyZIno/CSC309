document.getElementById('addItemButton').addEventListener('click', addListItem);

function addListItem() {
  // Get the input field and the list
  const itemInput = document.getElementById('itemInput');
  const itemList = document.getElementById('itemList');

  // Get the value from the input field
  const newItemText = itemInput.value.trim(); // Trim to remove any leading/trailing whitespace

  // Check if the input is not empty
  if (newItemText !== '') {
    // Create a new <li> element
    const newItem = document.createElement('li');
    newItem.textContent = newItemText;

    // Append the new item to the list
    itemList.appendChild(newItem);

    // Clear the input field
    itemInput.value = '';
  }
}

document.getElementById('submitButton').addEventListener('click', validateForm);

function validateForm() {
  // Get form fields and error spans
  const nameField = document.getElementById('name');
  const emailField = document.getElementById('email');
  const passwordField = document.getElementById('password');
  const repeatPasswordField = document.getElementById('repeatPassword');
  const nameError = document.getElementById('nameError');
  const emailError = document.getElementById('emailError');
  const passwordError = document.getElementById('passwordError');
  const repeatPasswordError = document.getElementById('repeatPasswordError');
  const successMessage = document.getElementById('successMessage');

  // Clear previous error messages
  nameError.textContent = '';
  emailError.textContent = '';
  passwordError.textContent = '';
  repeatPasswordError.textContent = '';
  successMessage.textContent = '';

  // Reset border styles
  nameField.style.border = '';
  emailField.style.border = '';
  passwordField.style.border = '';
  repeatPasswordField.style.border = '';

  let isValid = true;

  // Name validation
  if (nameField.value.trim() === '') {
    nameError.textContent = 'Name is required';
    nameField.style.border = '2px solid red';
    isValid = false;
  }

  // Email validation (simple regex for basic validation)
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(emailField.value)) {
    emailError.textContent = 'Please enter a valid email';
    emailField.style.border = '2px solid red';
    isValid = false;
  }

  // Password validation (minimum 8 characters, at least one uppercase, one lowercase, one digit)
  const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  if (!passwordPattern.test(passwordField.value)) {
    passwordError.textContent = 'Password must be at least 8 characters, contain one uppercase letter, one lowercase letter, and one digit';
    passwordField.style.border = '2px solid red';
    isValid = false;
  }

  // Repeat Password validation
  if (repeatPasswordField.value !== passwordField.value) {
    repeatPasswordError.textContent = 'Passwords do not match';
    repeatPasswordField.style.border = '2px solid red';
    isValid = false;
  }

  // If the form is valid, display success message
  if (isValid) {
    successMessage.textContent = 'Form submitted successfully!';
    successMessage.style.color = 'green';
  }
}

document.addEventListener('DOMContentLoaded', todoApp);

function todoApp() {
  const addTodoButton = document.getElementById('addTodoButton');
  const newTodoInput = document.getElementById('newTodo');
  const todoList = document.getElementById('todoList');

  // Event listener for adding a new to-do item
  addTodoButton.addEventListener('click', function() {
    const todoText = newTodoInput.value.trim();

    if (todoText !== '') {
      const newTodoItem = document.createElement('li'); // This is the <li> element

      // Create the checkbox
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.addEventListener('change', toggleComplete); // Add event listener for toggle

      // Create the span for the to-do text
      const todoTextSpan = document.createElement('span');
      todoTextSpan.textContent = todoText;

      // Create the delete button
      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'Remove';
      deleteButton.addEventListener('click', function() {
        todoList.removeChild(newTodoItem);
      });

      // Append checkbox, text, and delete button to the new list item (<li>)
      newTodoItem.appendChild(checkbox);
      newTodoItem.appendChild(todoTextSpan);
      newTodoItem.appendChild(deleteButton);

      // Append the new item (<li>) to the to-do list
      todoList.appendChild(newTodoItem);

      // Clear the input field after adding
      newTodoInput.value = '';
    }
  });

  function toggleComplete(event) {
    const listItem = event.target.parentElement;  // The parent <li> element

    // Toggle the "line-through" text decoration for the entire <li> element
    if (event.target.checked) {
      listItem.style.textDecoration = 'line-through'; // Apply line-through to <li>
    } else {
      listItem.style.textDecoration = 'none'; // Remove line-through from <li>
    }
  }
}