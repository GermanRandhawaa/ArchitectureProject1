document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('http://localhost:3000/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
                credentials: 'include',
            });

            if (response.ok) {
                const { message, role } = await response.json();

                // Check the role of the user
                if (role === 'admin') {
                    window.location.href = 'index.html';
                } else {
                    window.location.href = 'home.html';
                }
            } else {
                console.error('Invalid credentials');
                alert('Invalid credentials');
                // Show an error message to the user or perform any other action
            }
        } catch (error) {
            console.error('Error:', error);
        }
    });
});
