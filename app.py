import os
import sqlite3
from flask import Flask, jsonify, request, send_from_directory

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")
DB_PATH = os.path.join(BASE_DIR, "fincontrol.db")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS lancamentos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tipo TEXT NOT NULL,
            categoria TEXT NOT NULL,
            valor REAL NOT NULL,
            descricao TEXT NOT NULL,
            data TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()

@app.before_request
def ensure_db():
    init_db()

@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    return response

@app.route("/health", methods=["GET", "OPTIONS"])
def health():
    if request.method == "OPTIONS":
        return "", 204
    return jsonify({"ok": True})

@app.route("/", methods=["GET"])
def index():
    return send_from_directory(FRONTEND_DIR, "index.html")

@app.route("/<path:path>", methods=["GET"])
def serve_frontend(path):
    safe_path = path.replace("..", "")
    full_path = os.path.join(FRONTEND_DIR, safe_path)

    if os.path.isfile(full_path):
        return send_from_directory(FRONTEND_DIR, safe_path)

    return send_from_directory(FRONTEND_DIR, "index.html")

@app.route("/lancamentos", methods=["GET", "POST", "OPTIONS"])
def lancamentos():
    if request.method == "OPTIONS":
        return "", 204

    if request.method == "GET":
        conn = get_db()
        rows = conn.execute("""
            SELECT id, tipo, categoria, valor, descricao, data
            FROM lancamentos
            ORDER BY id DESC
        """).fetchall()
        conn.close()

        return jsonify([{
            "id": row["id"],
            "tipo": row["tipo"],
            "categoria": row["categoria"],
            "valor": row["valor"],
            "descricao": row["descricao"],
            "data": row["data"]
        } for row in rows])

    payload = request.get_json(silent=True) or {}
    tipo = payload.get("tipo")
    categoria = payload.get("categoria")
    valor = payload.get("valor")
    descricao = payload.get("descricao")
    data = payload.get("data")

    if not tipo or not categoria or valor is None or not descricao or not data:
        return jsonify({"error": "Campos obrigatórios: tipo, categoria, valor, descricao, data"}), 400

    try:
        valor = float(valor)
    except (TypeError, ValueError):
        return jsonify({"error": "Campo valor deve ser numérico"}), 400

    conn = get_db()
    cursor = conn.execute("""
        INSERT INTO lancamentos (tipo, categoria, valor, descricao, data)
        VALUES (?, ?, ?, ?, ?)
    """, (tipo, categoria, valor, descricao, data))
    conn.commit()

    lancamento_id = cursor.lastrowid
    row = conn.execute("""
        SELECT id, tipo, categoria, valor, descricao, data
        FROM lancamentos
        WHERE id = ?
    """, (lancamento_id,)).fetchone()
    conn.close()

    return jsonify({
        "id": row["id"],
        "tipo": row["tipo"],
        "categoria": row["categoria"],
        "valor": row["valor"],
        "descricao": row["descricao"],
        "data": row["data"]
    }), 201

@app.route("/lancamentos/<int:lancamento_id>", methods=["PUT", "DELETE", "OPTIONS"])
def lancamento_detail(lancamento_id):
    if request.method == "OPTIONS":
        return "", 204

    conn = get_db()

    if request.method == "DELETE":
        conn.execute("DELETE FROM lancamentos WHERE id = ?", (lancamento_id,))
        conn.commit()
        conn.close()
        return jsonify({"ok": True})

    payload = request.get_json(silent=True) or {}
    tipo = payload.get("tipo")
    categoria = payload.get("categoria")
    valor = payload.get("valor")
    descricao = payload.get("descricao")
    data = payload.get("data")

    if not tipo or not categoria or valor is None or not descricao or not data:
        conn.close()
        return jsonify({"error": "Campos obrigatórios: tipo, categoria, valor, descricao, data"}), 400

    try:
        valor = float(valor)
    except (TypeError, ValueError):
        conn.close()
        return jsonify({"error": "Campo valor deve ser numérico"}), 400

    conn.execute("""
        UPDATE lancamentos
        SET tipo = ?, categoria = ?, valor = ?, descricao = ?, data = ?
        WHERE id = ?
    """, (tipo, categoria, valor, descricao, data, lancamento_id))
    conn.commit()

    row = conn.execute("""
        SELECT id, tipo, categoria, valor, descricao, data
        FROM lancamentos
        WHERE id = ?
    """, (lancamento_id,)).fetchone()
    conn.close()

    if not row:
        return jsonify({"error": "Lançamento não encontrado"}), 404

    return jsonify({
        "id": row["id"],
        "tipo": row["tipo"],
        "categoria": row["categoria"],
        "valor": row["valor"],
        "descricao": row["descricao"],
        "data": row["data"]
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)