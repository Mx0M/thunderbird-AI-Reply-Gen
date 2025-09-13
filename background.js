console.log(
  "Background script loaded at",
  new Date().toISOString(),
  "ID:",
  browser.runtime.id
);

browser.runtime.onInstalled.addListener(() => {
  console.log("AI Email Reply Generator extension installed");
});

browser.compose.onAfterSave.addListener((tab, info) => {
  console.log("Compose saved", tab, info);
});

browser.runtime.onMessage.addListener(async (message, sender) => {
  console.log("Received message at", new Date().toISOString(), ":", message);
  if (message.action === "generateReply") {
    try {
      console.log("Processing generateReply with data:", message.data);
      const result = await generateAIReply(message.data);
      return Promise.resolve({ success: true, reply: result });
    } catch (error) {
      console.error("Error generating reply:", error);
      return Promise.resolve({ success: false, error: error.message });
    }
  }
  console.log("Ignoring unknown message action:", message.action);
});

async function generateAIReply(data) {
  const {
    instructions,
    composeDetails,
    originalMessageId,
    emailType,
    llmProvider,
    llmModel,
    ollamaHostname,
  } = data;
  const server = "http://localhost:8000";
  const apiEndpoint = server + "/generate-reply";
  const apiComposeEndpoint = server + "/compose";

  console.log("Using FastAPI endpoint:", apiEndpoint);

  let originalMessage = null;
  if (originalMessageId && (emailType === "reply" || emailType === "thread")) {
    try {
      const fullMessage = await browser.messages.getFull(originalMessageId);
      const textPart = fullMessage.parts.find(
        (part) =>
          part.contentType === "text/plain" || part.contentType === "text/html"
      );
      originalMessage = {
        subject: (await browser.messages.get(originalMessageId)).subject,
        body: textPart
          ? (
              await browser.messages.listInlineTextParts(originalMessageId, [
                textPart.partId,
              ])
            )[0]?.content || ""
          : "",
      };
      if (emailType === "thread") {
        const message = await browser.messages.get(originalMessageId);
        const threadMessages = await browser.messages.list(message.folder, {
          threadId: message.threadId,
        });
        originalMessage.body = threadMessages.messages
          .map((msg) => `Subject: ${msg.subject}\nBody: ${msg.snippet}`)
          .join("\n\n");
      }
    } catch (error) {
      console.warn("Could not fetch original message:", error);
    }
  }

  const prompt = constructPrompt(
    originalMessage,
    composeDetails,
    instructions,
    emailType
  );

  const headers = { "Content-Type": "application/json" };

  const payload = {
    instructions,
    // llmProvider,
    // llmModel,
    // ollamaHostname,
    emailType,
    subject: composeDetails.subject,
    body: originalMessage?.body || composeDetails?.plainTextBody || "",
    sender: "",
  };
  console.log("Sending to FastAPI with payload:", payload);

  const response = await fetch(
    emailType === "new" ? apiComposeEndpoint : apiEndpoint,
    {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    throw new Error(
      `FastAPI request failed: ${response.status} ${response.statusText}`
    );
  }

  const result = await response.json();
  const reply = result.reply || result.response || result.text;
  if (!reply) {
    throw new Error("No valid reply received from FastAPI");
  }
  console.log("Received reply from FastAPI:", reply);
  return reply;
}

function constructPrompt(
  originalMessage,
  composeDetails,
  instructions,
  emailType
) {
  let prompt = `Compose an email of type: ${emailType}\n`;
  if (
    originalMessage &&
    originalMessage.body &&
    (emailType === "reply" || emailType === "thread")
  ) {
    prompt += `Original email${emailType === "thread" ? " thread" : ""}:\n`;
    prompt += `Subject: ${originalMessage.subject || composeDetails.subject}\n`;
    prompt += `Body: ${originalMessage.body}\n\n`;
  }
  prompt += `Instructions: ${instructions}\n\n`;
  prompt += `Please generate an appropriate email ${
    emailType === "new" ? "body" : "reply"
  } based on the above information.`;
  return prompt;
}
