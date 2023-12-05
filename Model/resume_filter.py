from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin  # Import CORS and cross_origin
import docx2txt
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

def calculate_similarity(job_description, resume):
    content = [resume, job_description]
    cv = CountVectorizer()
    count_matrix = cv.fit_transform(content)
    similarity_matrix = cosine_similarity(count_matrix)
    return similarity_matrix[1][0].round(2) * 100

@app.route('/')
@cross_origin()
def welcome():
    welcome_message = "Welcome to the Resume and Job Description Similarity Model!"
    instructions = """
    To use this model, send a POST request to /upload with two files:
    1. 'job_description': A .docx file containing the job description.
    2. 'resume': A .docx file containing the resume.
    The model will return the similarity percentage between the job description and the resume.
    """
    return welcome_message + instructions

@app.route('/upload', methods=['POST'])
@cross_origin()  # Enable CORS only for this route

def upload_files():
    if 'resume' not in request.files:
        return 'Missing resume file', 400
    
    job_description_text = request.form.get('job_description', '')
    if not job_description_text:
        return 'Job description is required.', 400

    resume_file = request.files['resume']

    if not resume_file.filename.endswith('.docx'):
        return 'Invalid resume file format. Only .docx files are accepted.', 400

    try:
        resume_text = docx2txt.process(resume_file)
        similarity_score = calculate_similarity(job_description_text, resume_text)
        return jsonify({'similarity': similarity_score})
    except Exception as e:
        return f'Error processing file: {str(e)}', 500
    
@app.route('/job-description-analysis', methods=['POST'])
@cross_origin()
def job_description_analysis():
    job_description_text = request.form.get('job_description', '')
    if not job_description_text:
        return 'Job description is required.', 400

    key_phrases = ['required qualifications', 'responsibilities', 'skills']
    summary = {}

    for phrase in key_phrases:
        if phrase in job_description_text.lower():
            summary[phrase] = "Present"
        else:
            summary[phrase] = "Not found"

    return jsonify(summary)

@app.route('/resume-feedback', methods=['POST'])
@cross_origin()
def resume_feedback():
    if 'resume' not in request.files:
        return 'Missing resume file', 400

    resume_file = request.files['resume']
    resume_text = docx2txt.process(resume_file)

    # Simple checks for sections and length
    sections = ['Education', 'Experience', 'Skills']
    feedback = []

    for section in sections:
        if section not in resume_text:
            feedback.append(f"Missing section: {section}")

    if len(resume_text.split()) > 1000:
        feedback.append("Resume might be too long. Consider condensing it.")

    return jsonify({'feedback': feedback})

if __name__ == '__main__':
    app.run(debug=True)



