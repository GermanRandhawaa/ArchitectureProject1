let resumes = [];
let resumeResults = [];
let apiCallCount = 0;

getApiCallCount();
function addResume(resume) {
    resumes.push(resume);
}

async function getApiCallCount() {
    const res = await fetch(`http://localhost:3000/apiCallCount/${localStorage.getItem('username')}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
    })
    
    const count = await res.json();
    apiCallCount = count.count.api_calls;
    document.getElementById('apiCallCount').textContent = "Your api count is " + apiCallCount;

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

    clearInputs();
}

function sendDataToServer(jobDescription, resume) {
    if (apiCallCount > 10) {
        alert('You have exceeded the maximum number of API calls. Please try again later.');
        return;
    }
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
            fetch(`http://localhost:3000/incrementCount/${localStorage.getItem('username')}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });
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

function getResFeedback() {
    // Check if any resumes have been added
    if (resumes.length === 0) {
        alert('Please add at least one resume before getting feedback.');
        return;
    }

    // Send each resume for feedback
    resumes.forEach(resume => {
        const formData = new FormData();
        formData.append('resume', resume);

        fetch('http://127.0.0.1:5000/resume-feedback', {
            method: 'POST',
            body: formData
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok ' + response.statusText);
                }
                return response.json();
            })
            .then(data => {
                displayFriendlyResumeFeedback(data, resume.name);
                // Optionally, clear the resumes array if feedback should only be fetched once
                // resumes = [];
            })
            .catch(error => {
                document.getElementById('errorMessage').style.display = 'block';
                document.getElementById('errorMessage').textContent = 'Error: ' + error.message;
            });

    });
    clearInputs();
}

function getJobDesFeedback() {
    // Get Job Description text
    const jobDescription = document.getElementById('jobDescription').value;
    if (jobDescription.trim() === '') {
        alert('Please enter a job description.');
        return;
    }

    // Prepare FormData with job description
    const formData = new FormData();
    formData.append('job_description', jobDescription);

    // Send request to Flask for Job Description Analysis
    fetch('http://127.0.0.1:5000/job-description-analysis', {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            displayFriendlyJobDescFeedback(data);
        })
        .catch(error => {
            document.getElementById('errorMessage').style.display = 'block';
            document.getElementById('errorMessage').textContent = 'Error: ' + error;
        });

    clearInputs();
}

function displayFriendlyJobDescFeedback(data) {
    const resultsContainer = document.getElementById('resultsContainer');
    let message = 'All key sections were found in the job description.';
    let className = 'alert alert-success';

    const missing = [];
    for (const key in data) {
        if (data[key] === 'Not found') {
            missing.push(key.replace('_', ' '));
        }
    }

    if (missing.length > 0) {
        message = 'Missing sections: ' + missing.join(', ') + '.';
        className = 'alert alert-danger';
    }

    resultsContainer.innerHTML = `<h3>Job Description Feedback:</h3><div class="${className}">${message}</div>`;
}

function displayFriendlyResumeFeedback(data, resumeName) {
    const resultsContainer = document.getElementById('resultsContainer');
    const feedback = data.feedback;
    let message = `Resume '${resumeName}' looks good. No missing sections.`;
    let className = 'alert alert-success';

    if (feedback && feedback.length > 0) {
        message = `Feedback for '${resumeName}': ` + feedback.join(', ') + '.';
        className = 'alert alert-danger';
    }

    // Append the result to the results container
    resultsContainer.innerHTML = `<h3>Resume Feedback:</h3><div class="${className}">${message}</div>`;
}


function goLogin() {
    const choice = confirm("Are you sure you want to logout?");
    if (choice) window.location.href = 'Login.html';
}

function clearInputs() {
    // Clear the job description textarea
    document.getElementById('jobDescription').value = '';

    // Clear the added resumes display and the resumes array
    document.getElementById('addedResumes').innerHTML = '';
    resumes = [];
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