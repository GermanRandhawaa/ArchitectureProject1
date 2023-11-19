document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    console.log(registerForm);

    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        console.log(username, email, password);

        try {
            const response = await fetch('http://localhost:3000/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password }),
            });

            if (response.ok) {
                // Handle successful registration
                window.location.href = 'login.html'; // Redirect to login page
            } else {
                console.error('Registration failed');
                
            }
        } catch (error) {
            console.error('Error:', error);
        }
    });
});
