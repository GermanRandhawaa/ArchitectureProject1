// Fetch user information from the server and populate the table
fetch('http://localhost:3000/get-all-users')
  .then(response => response.json())
  .then(users => {
    const tableBody = document.getElementById('userTableBody');
    users.forEach(user => {
      const row = tableBody.insertRow();
      const cell1 = row.insertCell(0);
      const cell2 = row.insertCell(1);
      const cell3 = row.insertCell(2); 
      cell1.textContent = user.username;
      cell2.textContent = user.email;

      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'Delete';
      deleteButton.addEventListener('click', () => handleDelete(user.username));
      cell3.appendChild(deleteButton);
    });
  })
  .catch(error => console.error('Error fetching user information:', error));

function handleDelete(username) {
  // Confirm if the user wants to delete
  const confirmDelete = confirm(`Are you sure you want to delete the user ${username}?`);
  if (confirmDelete) {
    // Send a DELETE request to the server
    fetch(`http://localhost:3000/users/${username}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .then(response => response.json())
    .then(data => {
      console.log(data.message);
      // Refresh the page or update the table after successful deletion
      location.reload();
    })
    .catch(error => console.error('Error deleting user:', error));
  }
}
