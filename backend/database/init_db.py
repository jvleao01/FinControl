import sqlite3
import os

BASE_DIR = os.path.dirname(__file__)

DATABASE = os.path.join(
    BASE_DIR,
    "banco.db"
)

conexao = sqlite3.connect(DATABASE)

cursor = conexao.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS lancamentos(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario TEXT NOT NULL,
    tipo TEXT NOT NULL,
    categoria TEXT,
    descricao TEXT NOT NULL,
    valor REAL NOT NULL,
    data TEXT NOT NULL
)
""")

conexao.commit()
conexao.close()

print("Banco criado com sucesso")