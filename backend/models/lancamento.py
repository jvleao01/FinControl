class Lancamento:

    def __init__(
        self,
        usuario,
        tipo,
        categoria,
        descricao,
        valor,
        data
    ):
        self.usuario = usuario
        self.tipo = tipo
        self.categoria = categoria
        self.descricao = descricao
        self.valor = valor
        self.data = data