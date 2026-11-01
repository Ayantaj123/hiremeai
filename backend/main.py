from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import os
from pathlib import Path
from dotenv import load_dotenv
from groq import Groq
from pydantic import BaseModel
from pypdf import PdfReader
import json 

load_dotenv()

my_api_key = os.getenv("GROQ_API_KEY")
if not my_api_key:
    raise ValueError("api error")

client = Groq(api_key=my_api_key)
model = "openai/gpt-oss-120b"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Experience(BaseModel):
    company: str | None = None
    role: str | None = None
    duration: str | None = None
    description: str | None = None
    skills_used: list[str] = []

class Resume(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    total_experience_years: float | None = None
    skills: list[str] = []
    experiences: list[Experience] = []
    education: list[str] = []
    projects: list[str] = []
    certifications: list[str] = []

resume_schema = Resume.model_json_schema()

class ChatRequest(BaseModel):
    question: str

# Cache the parsed resume AND the file's last modified time
CACHED_RESUME: Resume | None = None
LAST_MODIFIED_TIME: float | None = None

def read_pdf(file_path: Path):
    reader = PdfReader(file_path)
    text = ""
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text + "\n"
    return text

def parse_resume(resume_text: str) -> Resume:
    system_prompt = f"""
    You are an expert resume parser.
    Extract information from the resume based on its meaning, not only exact headings.
    Return ONLY valid JSON matching this schema:
    {resume_schema}

    Important rules:
    1. Do not invent information.
    2. If a value is not available, return null.
    3. If a list has no information, return an empty list.
    4. Include internships inside experiences.
    5. Extract skills mentioned across the entire resume.
    """
    response = client.chat.completions.create(
        model=model, 
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Parse the following resume:\n\n{resume_text}"}
        ], 
        response_format={"type": "json_object"}
    )
    data = json.loads(response.choices[0].message.content)
    return Resume(**data)

def get_resume() -> Resume:
    """Automatically detects if resume.pdf was replaced and re-parses it."""
    global CACHED_RESUME, LAST_MODIFIED_TIME
    pdf_path = Path("resume.pdf")
    current_mtime = os.path.getmtime(pdf_path)

    if CACHED_RESUME is None or LAST_MODIFIED_TIME != current_mtime:
        resume_text = read_pdf(pdf_path)
        CACHED_RESUME = parse_resume(resume_text)
        LAST_MODIFIED_TIME = current_mtime

    return CACHED_RESUME

def stream_candidate_answer(question: str, resume: Resume):
    system_prompt = f"""
    You are an AI assistant that answers questions about a candidate's resume.

    Below is everything you know about the candidate's resume. Answer the question based on this information.
    {resume.model_dump_json(indent=2)}

    RULES:
    1. Answer the question based on the information in the resume.
    2. NEVER make up information that is not present in the resume.
    3. Never Hallucinate. If you don't know the answer, say "The candidate does not command the following skill but is looking forward to explore it".
    4. Answer concisely and use clean Markdown formatting (bolding, bullet points, or tables where appropriate).
    """
    stream = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": question}
        ],
        stream=True
    )
    for chunk in stream:
        content = chunk.choices[0].delta.content
        if content:
            yield content

@app.get("/")
def home():
    return {"message": "System is running!"}

@app.get("/resume")
def get_current_resume():
    """Sends the parsed resume details to the frontend so the UI updates automatically."""
    return get_resume()

@app.post("/chat")
def chat(request: ChatRequest):
    resume = get_resume()
    return StreamingResponse(
        stream_candidate_answer(request.question, resume), 
        media_type="text/plain"
    )