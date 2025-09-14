# 📧 Thunderbird AI Reply Generator

Thunderbird AI Reply Generator is a Thunderbird extension that integrates an **AI-powered email reply generator** using the **Ollama language model**.  
It allows users to generate professional, context-aware email replies directly within Thunderbird by leveraging a **FastAPI backend** powered by **LangChain** and **Ollama**.

---

## ✨ Features

- **AI-Powered Replies**: Generate professional email replies using the Ollama language model (default: `llama3.1:latest`).
- **Seamless Integration**: Adds a "Generate AI Reply" button to Thunderbird's email composer.
- **Customizable Instructions**: Provide specific instructions to tailor the tone and content of replies.
- **HTML Handling**: Strips HTML tags from incoming emails for cleaner processing.
- **Open Source**: Licensed under the **MIT License** for free use and modification.

---

## 🛠 Installation

### Prerequisites

- **Thunderbird**: Version 102 or later  
- **Python**: Version 3.8 or higher  
- **Ollama**: Installed and running locally or on a server (default model: `llama3.1:latest`)  
- **FastAPI Backend**: A running instance of the FastAPI server (see [Backend Setup](#-backend-setup))  

---

### Installing the Extension

1. Clone or download this repository:
   ```bash
   git clone https://github.com/Mx0M/thunderbird-AI-Reply-Gen.git
In Thunderbird, go to Tools > Add-ons and Themes.

Click the gear icon and select Install Add-on From File.

Navigate to the repository folder and select the .xpi file
(or package the extension using web-ext if not pre-built).

Follow the prompts to install the extension.

⚙️ Backend Setup

The extension communicates with a FastAPI backend that processes email content and generates replies using Ollama.

1. Install Dependencies
pip install fastapi uvicorn langchain langchain-ollama pydantic

2. Run Ollama

Ensure Ollama is running with the desired model:

ollama run llama3.1:latest

3. Start the FastAPI Server

Navigate to the backend directory in the repository and run:

uvicorn main:app --host 0.0.0.0 --port 8000

4. Configure the Extension

Open Thunderbird’s Add-on settings for the AI Reply Generator.

Enter the FastAPI server URL (e.g., http://localhost:8000/generate-reply).

Optionally, provide an API key if configured in the backend.

🚀 Usage

Open an email in Thunderbird.

Click the Generate AI Reply button in the email composer toolbar.

(Optional) Add custom instructions (e.g., "Reply formally" or "Keep it concise").

The extension sends the email’s subject, body, and sender to the backend.

Receive a generated reply (subject, body, sender), which you can edit before sending.



Key Components

FastAPI: Handles HTTP requests from Thunderbird

LangChain: Constructs prompts and chains for Ollama

Pydantic: Validates input/output data

Ollama: Provides the language model

Customization

Modify main.py in the backend directory

Adjust prompt templates or switch models (e.g., deepseek-r1:8b)

Update the EmailRequestv1 model to support additional parameters
