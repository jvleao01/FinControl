import sqlite3
import os

from flask import (
    Blueprint,
    jsonify,
    request
)

lancamentos_bp = Blueprint(
    "lancamentos",
    __name__
)

import os

BASE_DIR = os.path.dirname(
    os.path.dirname(__file__)
)

DATABASE = os.path.join(
    BASE_DIR,
    "database",
    "banco.db"
)

print("Banco:", DATABASE)


@lancamentos_bp.route(
    "/lancamentos",
    methods=["GET"]
)
def listar_lancamentos():

    conexao = sqlite3.connect(DATABASE)

    conexao.row_factory = sqlite3.Row

    cursor = conexao.cursor()

    cursor.execute(
        "SELECT * FROM lancamentos"
    )

    dados = [
        dict(item)
        for item in cursor.fetchall()
    ]

    conexao.close()

    return jsonify(dados)

@lancamentos_bp.route(
    "/lancamentos",
    methods=["POST"]
)
def criar_lancamento():

    dados = request.json

    conexao = sqlite3.connect(DATABASE)

    cursor = conexao.cursor()

    cursor.execute(
        """
        INSERT INTO lancamentos
        (
            usuario,
            tipo,
            categoria,
            descricao,
            valor,
            data
        )
        VALUES
        (?, ?, ?, ?, ?, ?)
        """,
        (
            dados["usuario"],
            dados["tipo"],
            dados["categoria"],
            dados["descricao"],
            dados["valor"],
            dados["data"]
        )
    )

    conexao.commit()

    conexao.close()

    return {
        "mensagem":
        "Lançamento criado"
    }, 201

@lancamentos_bp.route(
    "/lancamentos/<int:id>",
    methods=["DELETE"]
)
def excluir_lancamento(id):

    conexao = sqlite3.connect(DATABASE)

    cursor = conexao.cursor()

    cursor.execute(
        "DELETE FROM lancamentos WHERE id = ?",
        (id,)
    )

    conexao.commit()

    conexao.close()

    return {
        "mensagem":
        "Lançamento excluído"
    }

@lancamentos_bp.route(
    "/lancamentos/<int:id>",
    methods=["PUT"]
)
def atualizar_lancamento(id):

    dados = request.json

    conexao = sqlite3.connect(DATABASE)

    cursor = conexao.cursor()

    cursor.execute(
        """
        UPDATE lancamentos
        SET

            usuario = ?,
            tipo = ?,
            categoria = ?,
            descricao = ?,
            valor = ?,
            data = ?
        WHERE id = ?
        """,
        (
            dados["usuario"],
            dados["tipo"],
            dados["categoria"],
            dados["descricao"],
            dados["valor"],
            dados["data"],
            id
        )
    )

    conexao.commit()

    conexao.close()

    return {
        "mensagem":
        "Lançamento atualizado"
    }