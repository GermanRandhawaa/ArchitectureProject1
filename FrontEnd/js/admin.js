// Fetch user information from the server and populate the table
fetch("http://localhost:3000/get-all-users")
  .then((response) => response.json())
  .then((users) => {
    const tableBody = document.getElementById("userTableBody");
    users.forEach((user) => {
      const row = tableBody.insertRow();
      const cell1 = row.insertCell(0);
      const cell2 = row.insertCell(1);
      const cell3 = row.insertCell(2);
      cell1.textContent = user.username;
      cell2.textContent = user.email;

      const deleteButton = document.createElement("button");
      deleteButton.textContent = "Delete";
      deleteButton.addEventListener("click", () => handleDelete(user.username));
      cell3.appendChild(deleteButton);
      fetch(
        `http://localhost:3000/userinfos/${localStorage.getItem("username")}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );
    });
  })
  .catch((error) => console.error("Error fetching user information:", error));


  fetch("http://localhost:3000/get-calls")
  .then((response) => response.json())
  .then((users) => {
    const tableBody = document.getElementById("apiTableBody");
    users.forEach((user) => {
      const row = tableBody.insertRow();
      const cell1 = row.insertCell(0);
      const cell2 = row.insertCell(1);
      cell1.textContent = user.username;
      cell2.textContent = user.api_calls;
    });
  })
  .catch((error) => console.error("Error fetching api information:", error));

  fetch("http://localhost:3000/get-ep")
  .then((response) => response.json())
  .then((users) => {
    const tableBody = document.getElementById("epTableBody");
    users.forEach((user) => {
      const row = tableBody.insertRow();
      const cell1 = row.insertCell(0);
      const cell2 = row.insertCell(1);
      const cell3 = row.insertCell(2);
      const cell4 = row.insertCell(3);
      const cell5 = row.insertCell(4);
      const cell6 = row.insertCell(5);
      const cell7 = row.insertCell(6);
      const cell8 = row.insertCell(7);
      cell1.textContent = user.username;
      cell2.textContent = user.descAnalysis;
      cell3.textContent = user.resumeFeedback;
      cell4.textContent = user.jobFeedback;
      cell5.textContent = user.calls;
      cell6.textContent = user.login;
      cell7.textContent = user.userinfos;
      cell8.textContent = user.deleteCount;
    });
  })
  .catch((error) => console.error("Error fetching api information:", error));

function handleDelete(username) {
  // Confirm if the user wants to delete
  const confirmDelete = confirm(
    `Are you sure you want to delete the user ${username}?`
  );
  if (confirmDelete) {
    // Send a DELETE request to the server
    fetch(`http://localhost:3000/users/${username}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data.message);
        // Refresh the page or update the table after successful deletion
        location.reload();
      })
      .catch((error) => console.error("Error deleting user:", error));
  }
}
