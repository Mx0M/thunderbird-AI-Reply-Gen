#Thunderbird AI Reply Generator
Thunderbird AI Reply Generator is a Thunderbird extension that integrates an AI-powered email reply generator using the Ollama language model. It allows users to generate professional, context-aware email replies directly within Thunderbird by leveraging a FastAPI backend powered by LangChain and Ollama.
Features

AI-Powered Replies: Generate professional email replies using the Ollama language model (default: llama3.1:latest).
Seamless Integration: Adds a "Generate AI Reply" button to Thunderbird's email composer.
Customizable Instructions: Provide specific instructions to tailor the tone and content of replies.
HTML Handling: Strips HTML tags from incoming emails for cleaner processing.
Open Source: Licensed under the MIT License for free use and modification.

Installation
Prerequisites

Thunderbird: Version 102 or later.
Python: Version 3.8 or higher.
Ollama: Installed and running locally or on a server (default model: llama3.1:latest).
FastAPI Backend: A running instance of the FastAPI server (see Backend Setup).

Installing the Extension

Clone or download this repository

In Thunderbird, go to Tools > Add-ons and Themes.
Click the gear icon and select Install Add-on From File.
Navigate to the repository folder and select the xpi file (or package the extension using web-ext if not pre-built).
Follow the prompts to install the extension.

Backend Setup
The extension communicates with a FastAPI backend that processes email content and generates replies using Ollama.

Install Dependencies:pip install fastapi uvicorn langchain langchain-ollama pydantic


Run Ollama:Ensure Ollama is running with the desired model:ollama run llama3.1:latest


Start the FastAPI Server:Navigate to the backend directory in the repository and run:uvicorn main:app --host 0.0.0.0 --port 8000


Configure the Extension:
Open Thunderbird’s Add-on settings for the AI Reply Generator.
Enter the FastAPI server URL (e.g., http://localhost:8000/generate-reply).
Optionally, provide an API key if configured in the backend.



Usage

Open an email in Thunderbird.
Click the Generate AI Reply button in the email composer toolbar.
Optionally, add custom instructions (e.g., "Reply formally" or "Keep it concise").
The extension sends the email’s subject, body, and sender to the FastAPI backend.
Receive a generated reply with a subject, body, and sender, which you can edit before sending.

Development
To modify or build the extension:

Install Node.js and web-ext:npm install -g web-ext


Navigate to the extension directory and build:web-ext build


Test locally:web-ext run



Backend Details
The backend is a FastAPI application that uses LangChain and Ollama to process emails and generate replies. Key components:

FastAPI: Handles HTTP requests from the Thunderbird extension.
LangChain: Constructs prompts and chains for the Ollama model.
Pydantic: Validates input and output data structures.
Ollama: Provides the language model for generating replies.

To customize the backend:

Modify the main.py file in the backend directory.
Adjust the prompt template or model settings (e.g., switch to deepseek-r1:8b).
Update the EmailRequestv1 model to support additional parameters.

Troubleshooting

Invalid JSON Output: If the backend returns invalid JSON, ensure the Ollama model is running and the prompt template is correctly formatted. Check logs in the backend for details.
Connection Issues: Verify that the FastAPI server is running and accessible from Thunderbird (e.g., check firewall settings or CORS configuration).
Parsing Errors: If replies fail to parse, update the extract_json_from_text function or try a different Ollama model optimized for structured output.

Contributing
Contributions are welcome! Please:

Fork the repository.
Create a feature branch (git checkout -b feature/your-feature).
Commit changes (git commit -m "Add your feature").
Push to the branch (git push origin feature/your-feature).
Open a pull request.

License
This project is licensed under the MIT License. See the LICENSE file for details.
Contact
For issues or suggestions, open an issue on GitHub or contact [your-email@example.com].
