document.addEventListener("DOMContentLoaded", async () => {
  console.log("Popup script loaded at", new Date().toISOString());

  const generateBtn = document.getElementById("generateReply");
  const emailTypeSelect = document.getElementById("emailType");
  const instructionsTextarea = document.getElementById("instructions");
  const statusDiv = document.getElementById("status");

  if (!statusDiv || !generateBtn || !emailTypeSelect || !instructionsTextarea) {
    console.error("Missing critical elements:", {
      generateBtn,
      emailTypeSelect,
      instructionsTextarea,
      statusDiv,
    });
    if (statusDiv) showStatus("Error: Missing UI elements.", "error");
    return;
  }

  // Set default email type
  emailTypeSelect.value = "reply";
  statusDiv.classList.add("hidden");

  // Validate compose tab
  let activeTab;
  try {
    const tabs = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });
    activeTab = tabs[0];
    if (!activeTab || activeTab.type !== "messageCompose") {
      showStatus("Error: This is not a compose window.", "error");
      generateBtn.disabled = true;
      console.error("Invalid compose tab:", activeTab);
      return;
    }
  } catch (error) {
    console.error("Error checking compose tab:", error);
    showStatus("Error accessing compose window.", "error");
    generateBtn.disabled = true;
    return;
  }

  generateBtn.addEventListener("click", async () => {
    const instructions = instructionsTextarea.value.trim();
    if (!instructions) {
      showStatus("Please enter instructions for the AI reply.", "error");
      console.warn("No instructions provided");
      return;
    }

    try {
      generateBtn.disabled = true;
      showStatus("Generating AI reply...", "info");
      console.log("Generating reply with instructions:", instructions);

      const composeDetails = await browser.compose.getComposeDetails(
        activeTab.id
      );

      const message = {
        action: "generateReply",
        data: {
          instructions,
          composeDetails,
          originalMessageId: composeDetails.relatedMessageId,
          emailType: emailTypeSelect.value,
          llmProvider: "ollama",
          llmModel: "llama2",
          ollamaHostname: "http://localhost:11434",
        },
      };
      console.log(
        "Sending message at",
        new Date().toISOString(),
        "to",
        browser.runtime.id,
        ":",
        message
      );

      const response = await browser.runtime.sendMessage(message);
      console.log("Received response:", response);

      if (browser.runtime.lastError) {
        throw new Error(`Runtime error: ${browser.runtime.lastError.message}`);
      }

      if (!response) {
        throw new Error("No response received from background script");
      }

      if (response.success) {
        await insertReplyIntoCompose(
          activeTab.id,
          response.reply,
          composeDetails.body
        );
        showStatus("AI reply generated and inserted!", "success");
        setTimeout(() => window.close(), 1500);
      } else {
        showStatus(`Error: ${response.error}`, "error");
      }
    } catch (error) {
      console.error(
        "Error in sendMessage at",
        new Date().toISOString(),
        ":",
        error
      );
      showStatus(`Error: ${error.message}`, "error");
    } finally {
      generateBtn.disabled = false;
    }
  });

  async function insertReplyIntoCompose(tabId, aiReply, currentBody) {
    try {
      const f_aiReply =
        aiReply.subject +
        "<br><br>" +
        aiReply.body.replace(/\n/g, "<br>").replace(/\n\n/g, "<br><br>");
      const bodyRegex = /<body[^>]*>((.|[\n\r])*)<\/body>/im;
      const match = bodyRegex.exec(currentBody);
      const bodyContent = match ? match[1] : currentBody;

      const newContent = `
      <p style="margin-bottom: 1em;">${f_aiReply}</p>
      <hr style="margin: 1em 0;" />
      ${bodyContent}
    `;

      const wrapped = `
      <!DOCTYPE html>
      <html>
      <body>
        ${newContent}
      </body>
      </html>
    `;
      await browser.compose.setComposeDetails(tabId, {
        body: wrapped,
        isPlainText: false,
      });
      console.log("Reply inserted successfully");
    } catch (error) {
      console.error("Error inserting reply:", error);
      throw error;
    }
  }

  function showStatus(message, type) {
    console.log("Showing status:", message, type);
    statusDiv.textContent = message;
    statusDiv.classList.remove("success", "error", "info", "hidden");
    statusDiv.classList.add("status", type);

    if (type === "success") {
      setTimeout(() => {
        statusDiv.classList.add("hidden");
        console.log("Status hidden after timeout");
      }, 3000);
    }
  }
});
