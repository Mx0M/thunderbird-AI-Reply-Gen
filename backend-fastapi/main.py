# import multiprocessing
# import time
from fastapi import FastAPI
from pydantic import BaseModel
from langchain_ollama import OllamaLLM
from langchain.prompts import PromptTemplate
from fastapi.middleware.cors import CORSMiddleware
from langchain_core.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field, field_validator
from typing import Optional, Any
import re

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def remove_html(text):
    return re.sub(r'<[^>]*>', '', text)


class Email(BaseModel):
    subject: Optional[str] = Field(
        description="get subject for email", default=None)
    body: str = Field(description="email body content")
    sender: Optional[str] = Field(description="email sender", default=None)

    @field_validator("subject", "body", "sender", mode="before")
    @classmethod
    def unwrap_text_dict(cls, v: Any, info) -> Any:
        # If nested under "properties"
        if isinstance(v, dict):
            # If the whole dict is wrapped inside "properties"
            if "properties" in v:
                props = v["properties"]

                fld = info.field_name  # e.g. "subject", "body", or "sender"
                if fld in props:
                    return props[fld]
            # If it has "text" key
            if "text" in v:
                return v["text"]
        if isinstance(v, str):
            stripped = v.strip()
            if stripped == "":
                return None
            return stripped
        return v


parser = PydanticOutputParser(pydantic_object=Email)
llm = OllamaLLM(model="llama3.1:latest", temperature=0.3,)

prompt_gen_template = """
You are a prompt engineering expert.

Your task is to take a human instruction and rewrite it into a highly optimized, clear, and effective prompt for use with a large language model (LLM).

The optimized prompt should:

- Be unambiguous and specific
- Include the desired tone, format, or role if relevant
- Be structured and complete
- Improve the original instruction where necessary
- Clearly specify the expected output type (e.g., list, summary, code, email)

---

Original Instruction:
"{raw_instructions}"

---

Generate the optimized prompt only. Do not include commentary or extra explanations.

"""


prompt_reply_template = """
You are a professional email assistant. Carefully read and analyze the entire email. Based on the email content below, write a professional and helpful reply.



Tone: Professional 

Instructions: {instructions}



original email:

subject: {subject} body: {body}  from: {sender}




Give professional reply of above orginal mail or threaded mail . Return ONLY a valid JSON object matching the below format. subject value should be same as orginal mail contain.

{format_instruction}

⚠️ Do NOT include any explanation or commentary.
⚠️ Only return the JSON object — no markdown, no headings, no comments.

"""

prompt_compose_template = """
You are a professional email assistant. Compose a clear, professional email based on the following instructions:

Tone: Professional 
Instructions: {instructions}


Write professional email. Return ONLY a valid JSON object matching the below format. subject value should be same as orginal mail contain. if subject is not mention please genrate based on context.

{format_instruction}

⚠️ Do NOT include any explanation or commentary.
⚠️ Only return the JSON object — no markdown, no headings, no comments.

"""
prompt_thread_template = """
You are a professional email assistant. 
Consider the entire conversation history below and generate the next reply based on the user’s intent.
Note that the threaded mail is arranged bottom to top, with the initial message at the bottom and the latest message at the top. Focus primarily on the latest message on top, but take into account the full context from all previous emails to fully understand the conversation flow, tone, actionable tasks, status updates, and key points. Identify any questions, requests, or next steps mentioned throughout the thread. Compose a clear, concise, and polite reply that appropriately addresses the latest message while maintaining awareness of the overall context. Ensure the response aligns with the tone of the original email thread—whether formal, friendly, urgent, or neutral—and maintains professionalism throughout. Include clarifications, confirmations, or suggested actions as necessary. Avoid unnecessary verbosity while ensuring completeness and clarity. Your reply should facilitate smooth communication and effective resolution.

Tone: Professional 
Instructions: {instructions}

email with thread:

subject: {subject} body: {body}  from: {sender}



Write professional email of User’s Intent for Reply. Return ONLY a valid JSON object matching the below format. subject value should be same as orginal mail contain. if subject is not mention please genrate based on context.

{format_instruction}

⚠️ Do NOT include any explanation or commentary.
⚠️ Only return the JSON object — no markdown, no headings, no comments.

"""
reply_template = PromptTemplate(
    input_variables=["instructions", "subject", "sender", "body"],
    template=prompt_reply_template.strip(),
    partial_variables={
        'format_instruction':  parser.get_format_instructions()},
)
compose_template = PromptTemplate(
    input_variables=["instructions"],
    template=prompt_compose_template.strip(),
    partial_variables={
        'format_instruction':  parser.get_format_instructions()},
)
gen_template = PromptTemplate(
    input_variables=["raw_instructions"],
    template=prompt_gen_template.strip(),

)
thread_template = PromptTemplate(
    input_variables=["instructions", "subject", "sender", "body"],
    template=prompt_thread_template.strip(),
    partial_variables={
        'format_instruction':  parser.get_format_instructions()},
)


class EmailRequest(BaseModel):
    subject: str
    sender: str
    body: Any
    instructions: str = ""


class EmailRequestv1(BaseModel):
    emailType: str
    instructions: str = ""
    subject: str
    body: Any
    sender: str


class EmailCompose(BaseModel):
    emailType: str
    instructions: str


@app.post("/generate-reply")
def generate_reply(email: EmailRequestv1):

    new_prompt = gen_prompt(email.instructions)
    template = reply_template
    if email.emailType == "thread":
        template = thread_template
    chain = template | llm | parser

    reply = chain.invoke({
        "instructions": remove_html(new_prompt),
        "subject": remove_html(email.subject).strip(),
        "sender": remove_html(email.sender),
        "body": remove_html(email.body)
    })
    # print(reply)

    return {"reply": reply}


@app.post("/compose")
def compose(email: EmailCompose):
    new_prompt = gen_prompt(email.instructions)
    chain = compose_template | llm | parser

    reply = chain.invoke({
        "instructions": remove_html(new_prompt),

    })
    print(reply)
    return {"reply": reply}


def gen_prompt(instruction: str):
    chain = gen_template | llm
    return chain.invoke({
        "raw_instructions": remove_html(instruction),

    })


@app.get("/health")
async def health_check(Email):
    return {"status": "healthy", "message": "AI Email Reply Generator API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
