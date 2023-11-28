
let resumes = [];

function addResume(resume) {
    resumes.push(resume);
}

function addResumeToList() {
    const resumeInput = document.getElementById('resume');
    const addedResumesDiv = document.getElementById('addedResumes');

    for (let i = 0; i < resumeInput.files.length; i++) {
        const resume = resumeInput.files[i];
        addResume(resume);
        addedResumesDiv.innerHTML += `<p>${resume.name}</p>`;
    }

    // Clear the file input to allow selecting the same files again
    resumeInput.value = null;
}

function submitForm() {
    const jobDescription = document.getElementById('jobDescription').value;

    // Process the job application data and resumes
    console.log('Job Description:', jobDescription);
    console.log('Resumes:', resumes);

    // Reset the resumes array for the next submission
    resumes = [];
    
    // You can now submit the form data to your server using AJAX or other methods
    // Example using fetch:
    // fetch('/submit-form', {
    //     method: 'POST',
    //     body: formData,
    // })
    // .then(response => response.json())
    // .then(data => console.log('Success:', data))
    // .catch(error => console.error('Error:', error));
}

function getUsage(){

}

function goLogin(){
    const choice = confirm("Are you sure you want to logout?");
    if(choice) window.location.href = 'Login.html';
}