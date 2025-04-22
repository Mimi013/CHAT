// Sélection des éléments
const chatBody = document.querySelector(".chat-body");
const messageInput = document.querySelector(".message-input");
const sendMessageButton = document.querySelector("#send-message");
const closeButton = document.querySelector("#close-chatbot");
const chatbotPopup = document.querySelector("#chatbotPopup");
const voiceButton = document.querySelector(".voice-button");
const toggleVoiceButton = document.querySelector("#toggle-voice");
const voiceIcon = document.querySelector("#voice-icon");

let isVoiceEnabled = false;
const userData = { message: null };

// Scroll automatique vers le bas
const scrollToBottom = () => {
    requestAnimationFrame(() => {
        chatBody.scrollTop = chatBody.scrollHeight;
    });
};

// Création d'un message HTML
const createMessageElement = (content, ...classes) => {
    const div = document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML = content;
    return div;
};

// Animation du texte lettre par lettre
const typeText = (element, text, speed = 40) => {
    let index = 0;
    element.innerHTML = '';
    (function typing() {
        if (index < text.length) {
            element.innerHTML += text.charAt(index++);
            setTimeout(typing, speed);
        }
    })();
};

// Lecture vocale du texte
const speak = (text) => {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    const frenchVoice = speechSynthesis.getVoices().find(v => v.lang.includes('fr'));
    if (frenchVoice) utterance.voice = frenchVoice;
    speechSynthesis.speak(utterance);
};

// Gestion de l'envoi du message
const handleOutgoingMessage = (e) => {
    e.preventDefault();
    const message = messageInput.value.trim();
    if (!message) return;

    userData.message = message;

    // Affichage du message utilisateur
    const userDiv = createMessageElement(`<div class="message-text">${message}</div>`, "user-message");
    chatBody.appendChild(userDiv);
    messageInput.value = "";
    scrollToBottom();

    // Affichage de l'indicateur de réflexion du bot
    const botDiv = createMessageElement(`
        <div class="message-text">
            <div class="thinking-indicator">
                <div class="dot"></div><div class="dot"></div><div class="dot"></div>
            </div>
        </div>`, "bot-message", "thinking");
    chatBody.appendChild(botDiv);
    scrollToBottom();

    // Génération de la réponse du bot
    generateBotResponse(botDiv);
};

// Communication avec l'API Flask
const generateBotResponse = async (incomingDiv) => {
    const messageTextDiv = incomingDiv.querySelector(".message-text");

    try {
        const response = await fetch('/chatbot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: userData.message })
        });

        const data = await response.json();
        const botResponse = data.response;

        incomingDiv.classList.remove("thinking");
        messageTextDiv.innerHTML = '';
        typeText(messageTextDiv, botResponse);

        if (isVoiceEnabled) {
            setTimeout(() => speak(botResponse), botResponse.length * 50 + 500);
        }
    } catch (error) {
        console.error("Erreur serveur :", error);
        incomingDiv.classList.remove("thinking");
        messageTextDiv.innerHTML = "Désolé, une erreur s'est produite. Veuillez réessayer.";
    }
};

// Reconnaissance vocale
if (window.SpeechRecognition || window.webkitSpeechRecognition) {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "fr-FR";
    recognition.interimResults = false;

    voiceButton.addEventListener("click", () => {
        recognition.start();
        voiceButton.style.backgroundColor = "#3d39ac";
        voiceButton.style.color = "#fff";
    });

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        messageInput.value = transcript;
        adjustTextAreaHeight();
        setTimeout(() => handleOutgoingMessage(new Event('submit')), 100);
    };

    recognition.onerror = () => {
        voiceButton.style.backgroundColor = "";
        voiceButton.style.color = "";
    };

    recognition.onend = () => {
        voiceButton.style.backgroundColor = "";
        voiceButton.style.color = "";
    };
} else {
    alert("La reconnaissance vocale n'est pas prise en charge sur ce navigateur.");
    voiceButton.style.display = "none";
}

// Ajuste dynamiquement la hauteur de la zone de texte
const adjustTextAreaHeight = () => {
    messageInput.style.height = 'auto';
    messageInput.style.height = messageInput.scrollHeight + 'px';
};

// Envoyer avec Entrée
messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleOutgoingMessage(e);
});

// Envoyer avec le bouton
sendMessageButton.addEventListener("click", handleOutgoingMessage);

// Fermer le chatbot
closeButton.addEventListener("click", () => {
    chatbotPopup.classList.toggle('active');
});

// Activer/Désactiver la voix
toggleVoiceButton.addEventListener("click", () => {
    isVoiceEnabled = !isVoiceEnabled;
    voiceIcon.textContent = isVoiceEnabled ? "volume_up" : "volume_off";
});

// Chargement des voix disponibles
window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
};

// Ouvrir le chatbot
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('open-chatbot')?.addEventListener('click', () => {
        chatbotPopup.style.display = 'block';
    });
    window.speechSynthesis.getVoices();
});
