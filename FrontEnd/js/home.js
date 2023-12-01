
let resumes = [];

function addResume(resume) {
    resumes.push(resume);
}

function addResumeToList() {
    const resumeInput = document.getElementById('resume');
    const addedResumesDiv = document.getElementById('addedResumes');
    let hasValidFiles = false;

    for (let i = 0; i < resumeInput.files.length; i++) {
        const resume = resumeInput.files[i];
        
        // Validate file type and size here (example: .docx files and size < 5MB)
        if (resume.name.endsWith('.docx') && resume.size < 5000000) {
            addResume(resume);
            addedResumesDiv.innerHTML += `<p>${resume.name}</p>`;
            hasValidFiles = true;
        } else {
            alert('Invalid file type or size. Please upload .docx files less than 5MB.');
        }
    }

    if (!hasValidFiles) {
        // No valid files added
        return;
    }

    // Clear the file input to allow selecting the same files again
    resumeInput.value = null;
}


function submitForm() {
    const jobDescription = document.getElementById('jobDescription').value;
    if (!jobDescription.trim() || resumes.length === 0) {
        alert("Please enter a job description and upload at least one resume.");
        return;
    }

    // Process the job application data and resumes
    console.log('Job Description:', jobDescription);
    console.log('Resumes:', resumes);

    // Send data to server
    sendDataToServer(jobDescription, resumes);

    // Reset the resumes array for the next submission
    resumes = [];
}



function getUsage(){

}

function sendDataToServer(jobDescription, resumes) {
    let formData = new FormData();
    formData.append('job_description', jobDescription); // Ensure the name matches with Flask's expected key

    // Assuming you want to send only the first resume for simplicity
    if (resumes.length > 0) {
        formData.append('resume', resumes[0]);
    }

    fetch('http://127.0.0.1:5000/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
               // UI Update for Success
               document.getElementById('successMessage').style.display = 'block';
               document.getElementById('successMessage').textContent = 'Success: The similarity score is ' + data.similarity + '%';
       
               // Hide error message in case it was previously shown
               document.getElementById('errorMessage').style.display = 'none';
       
               // You might also want to update other parts of your UI, such as clearing the form or disabling the submit button
               // document.getElementById('jobApplicationForm').reset();
           })
           .catch(error => {
               console.error('Error:', error);
       
               // UI Update for Error
               document.getElementById('errorMessage').style.display = 'block';
               document.getElementById('errorMessage').textContent = 'Error: ' + error.message;
       
               // Hide success message in case it was previously shown
               document.getElementById('successMessage').style.display = 'none';
           });
       }
       

function goLogin(){
    const choice = confirm("Are you sure you want to logout?");
    if(choice) window.location.href = 'Login.html';
}