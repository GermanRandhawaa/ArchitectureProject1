let resumes = [];
let resumeResults = [];
let apiCallCount = 0;


function addResume(resume) {
    resumes.push(resume);
}

function addResumeToList() {
    const resumeInput = document.getElementById('resume');
    const addedResumesDiv = document.getElementById('addedResumes');
    let hasValidFiles = false;

    for (let i = 0; i < resumeInput.files.length; i++) {
        const resume = resumeInput.files[i];

        if (resume.name.endsWith('.docx') && resume.size < 5000000) {
            addResume(resume);
            addedResumesDiv.innerHTML += `<p>${resume.name}</p>`;
            hasValidFiles = true;
        } else {
            alert('Invalid file type or size. Please upload .docx files less than 5MB.');
        }
    }

    if (!hasValidFiles) {
        return;
    }

    resumeInput.value = null;
}


function submitForm() {
    const jobDescription = document.getElementById('jobDescription').value;
    if (!jobDescription.trim() || resumes.length === 0) {
        alert("Please enter a job description and upload at least one resume.");
        return;
    }

    console.log('Job Description:', jobDescription);
    console.log('Resumes:', resumes);

    resumes.forEach(resume => {
        sendDataToServer(jobDescription, resume);
    });

    resumes = [];
}

function sendDataToServer(jobDescription, resume) {
    apiCallCount++; // Increment the counter for each API call

    console.log(`API Call Count: ${apiCallCount}`); // Log the API call count

    let formData = new FormData();

    formData.append('job_description', jobDescription);
    formData.append('resume', resume);

    

    fetch('http://127.0.0.1:5000/upload', {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
            resumeResults.push({ name: resume.name, similarity: data.similarity });
            displayResults();
            document.getElementById('errorMessage').style.display = 'none';
        })
        .catch(error => {
            console.error('Error:', error);

            document.getElementById('errorMessage').style.display = 'block';
            document.getElementById('errorMessage').textContent = 'Error: ' + error.message;
            document.getElementById('successMessage').style.display = 'none';
        });
}

function displayResults() {
    if (resumeResults.length > 0) {
        let defaultMessage = document.getElementById('defaultMessage');
        if (defaultMessage) {
            defaultMessage.remove();
        }
    }

    resumeResults.sort((a, b) => b.similarity - a.similarity);

    let resultsContainer = document.getElementById('resultsContainer');
    resultsContainer.innerHTML = '';

    resumeResults.forEach(result => {
        updateUIWithResumeResult(result.name, result.similarity);
    });
}


function updateUIWithResumeResult(name, similarity) {
    let resultsContainer = document.getElementById('resultsContainer');
    let roundedSimilarity = parseFloat(similarity).toFixed(2);

    let cardDiv = document.createElement('div');
    cardDiv.classList.add('card', 'mb-3', 'border-success');

    let cardHeader = document.createElement('h5');
    cardHeader.classList.add('card-header', 'bg-success', 'text-white');
    cardHeader.textContent = `Resume: ${name}`;

    let cardBody = document.createElement('div');
    cardBody.classList.add('card-body', 'bg-light');

    let similarityText = document.createElement('p');
    similarityText.classList.add('card-text');
    similarityText.innerHTML = `Similarity: <strong class="${getSimilarityColor(roundedSimilarity)}">${roundedSimilarity}%</strong>`; // Color based on similarity score

    cardDiv.appendChild(cardHeader);
    cardDiv.appendChild(cardBody);
    cardBody.appendChild(similarityText);

    resultsContainer.appendChild(cardDiv);
}

function getSimilarityColor(similarity) {
    if (similarity > 60) return 'text-success';
    else if (similarity > 50) return 'text-warning';
    return 'text-danger';
}

function goLogin() {
    const choice = confirm("Are you sure you want to logout?");
    if (choice) window.location.href = 'Login.html';
}

document.addEventListener('DOMContentLoaded', () => {
    const corporateSecretLink = document.getElementById('corporateSecretLink');

    corporateSecretLink.addEventListener('click', async (event) => {
        event.preventDefault();

        const username = prompt('Enter your username:');
        const password = prompt('Enter your password:');

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
                const { role } = await response.json();
                // Check the role of the user
                if (role === 'admin') {
                    window.location.href = 'admin.html';
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