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
            });

            if (response.ok) {
                const { token } = await response.json();
                localStorage.setItem('token', token);
                window.location.href = 'index.html'; // Redirect to dashboard or another page
            } else {
                console.error('Invalid credentials');
                // Show an error message to the user or perform any other action
            }
        } catch (error) {
            console.error('Error:', error);
        }
    });
});
