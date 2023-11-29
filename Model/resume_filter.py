import docx2txt
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity

job_description = docx2txt.process("job_description.docx")
resume = docx2txt.process("resume.docx")

content = [resume, job_description]
cv = CountVectorizer()

count_matrix = cv.fit_transform(content)
simirlarity_matrix = cosine_similarity(count_matrix)

print("Resume matches by : " + str(simirlarity_matrix[1][0].round(2)*100) + "%")
