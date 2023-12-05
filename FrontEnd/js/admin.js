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
      cell3.textContent = user.role;
    });
  })
  .catch(error => console.error('Error fetching user information:', error));
