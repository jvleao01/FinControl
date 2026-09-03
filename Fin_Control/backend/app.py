from flask import Flask
from flask_cors import CORS

from routes.lancamentos import lancamentos_bp

app = Flask(__name__)

CORS(app)

app.register_blueprint(lancamentos_bp)

@app.route("/")
def home():
    return {
        "status": "FinControl Online"
    }

if __name__ == "__main__":
    app.run(debug=True)
