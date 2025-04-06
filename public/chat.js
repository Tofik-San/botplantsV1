
const input = document.getElementById("input");
const chat = document.getElementById("chat");

let history = [];

function renderMessage(sender, content) {
  const message = document.createElement("div");
  message.className = "message " + sender;
  message.innerHTML = (content || "").replace(/\n/g, "<br>");
  chat.appendChild(message);
  return message;
}

async function sendMessage() {
  const userMessage = input.value.trim();
  if (!userMessage) return;

  renderMessage("user", userMessage);
  input.value = "";

  history.push({ role: "user", content: userMessage });

  const botElement = renderMessage("bot", "");

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history.slice(-15) })
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    let accumulated = "";
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      for (let char of buffer) {
  accumulated += char;
  botElement.innerHTML = accumulated.replace(/\n/g, "<br>");
  await new Promise(resolve => setTimeout(resolve, 33));
}

      buffer = "";
    }

    history.push({ role: "assistant", content: accumulated });
    if (history.length > 6) history = history.slice(-6);
  } catch (err) {
    botElement.innerText = "Ошибка соединения или сервера.";
  }
}
