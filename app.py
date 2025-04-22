from flask import Flask, render_template, request, jsonify
import joblib
import random
import os

app = Flask(__name__)

svm_model = joblib.load('svm_model.pkl')
vectorizer = joblib.load('tfidf_vectorizer.pkl')

responses = {
    "Joie": [
        "Je suis tellement content(e) pour toi ! 😊",
        "Quelle bonne nouvelle ! 😄",
        "Tu rayonnes de joie, j’adore ça ! 🌟"
    ],
    "Tristesse": [
        "Je suis là pour toi, courage ❤️",
        "Tu peux m’en parler si tu veux 🤗",
        "Parfois, parler aide. Je t’écoute."
    ],
    "Colère": [
        "Calmons-nous ensemble. Je t’écoute 😌",
        "Tu as le droit d’être en colère. Que s’est-il passé ?",
        "Respirons ensemble... on va gérer ça."
    ],
    "Peur": [
        "N’aie pas peur, tu n’es pas seule 💪",
        "Je suis avec toi, ça va aller 🙏",
        "Dis-moi ce qui t’inquiète, je suis là."
    ],
    "Neutre": [
        "Merci de me parler. Dis-m’en plus 🧘",
        "Je t’écoute attentivement.",
        "On peut discuter de ce que tu veux 🙂"
    ]
}

def generate_response(emotion):
    return random.choice(responses.get(emotion, ["Je suis là pour toi."]))

# Page principale
@app.route('/')
def index():
    return render_template('index.html')

# API pour le chatbot
@app.route('/chatbot', methods=['POST'])
def chatbot():
    data = request.get_json()
    message = data.get("message", "")
    print("Message reçu :", message)
    # Transformation du message avec le vectorizer
    vect = vectorizer.transform([message])

    # Prédiction de l'émotion avec le modèle
    probs = svm_model.predict_proba(vect)[0]
    predicted_emotion = svm_model.classes_[probs.argmax()]

    response = generate_response(predicted_emotion)

    return jsonify({
        "emotion": predicted_emotion,
        "response": response
    })

if __name__ == "__main__":
    # Modification du port pour utiliser celui défini par Render
    port = int(os.environ.get('PORT', 5010))  # Si la variable d'environnement PORT est absente, utiliser 5010 par défaut
    app.run(debug=True, host='0.0.0.0', port=port)
