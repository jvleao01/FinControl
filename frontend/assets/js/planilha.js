let lancamentoEditando = null;
let lancamentos = [];

const filtroMes = document.getElementById("filtroMes");
const filtroAno = document.getElementById("filtroAno");
const filtroTipo = document.getElementById("filtroTipo");
const filtroUsuario = document.getElementById("filtroUsuario");
const tabela = document.getElementById("tabelaLancamentos");
const btnSalvar = document.getElementById("salvarLancamento");
const modal = document.getElementById("modalLancamento");
const toast = document.getElementById("toast");

const STORAGE_KEY = "fincontrol.lancamentos";

function safeStorage() {
    try {
        return window.localStorage;
    } catch {
        return null;
    }
}

function getLancamentosLocal() {
    const storage = safeStorage();
    if (!storage) return [];

    try {
        const raw = storage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveLancamentosLocal(items) {
    const storage = safeStorage();
    if (!storage) return;

    try {
        storage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
        console.warn("Não foi possível salvar localmente");
    }
}

function notificarAtualizacao() {
    window.dispatchEvent(new Event("fincontrol:updated"));
    try {
        window.localStorage.setItem("fincontrol:updated", String(Date.now()));
    } catch {}
}

function carregarMeses() {
    if (!filtroMes) return;

    filtroMes.innerHTML = '<option value="">Todos os Meses</option>';

    const meses = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    meses.forEach((mes, index) => {
        const option = document.createElement("option");
        option.value = index;
        option.textContent = mes;
        filtroMes.appendChild(option);
    });
}

function parseDataLocal(data) {
    if (!data) return null;

    if (typeof data === "string" && /^\d{4}-\d{2}-\d{2}$/.test(data)) {
        const [ano, mes, dia] = data.split("-").map(Number);
        return new Date(ano, mes - 1, dia);
    }

    const d = new Date(data);
    return Number.isNaN(d.getTime()) ? null : d;
}

function carregarAnos() {
    if (!filtroAno) return;

    const anos = [
        ...new Set(
            lancamentos
                .map(item => parseDataLocal(item.data))
                .filter(Boolean)
                .map(data => data.getFullYear())
        )
    ];

    filtroAno.innerHTML = '<option value="">Todos os Anos</option>';

    anos.sort((a, b) => a - b).forEach(ano => {
        const option = document.createElement("option");
        option.value = ano;
        option.textContent = ano;
        filtroAno.appendChild(option);
    });
}

function popularCategorias() {
    const tipoEl = document.getElementById("tipo");
    const categoriaEl = document.getElementById("categoria");
    const categoriaContainer = document.getElementById("categoriaContainer");

    if (!categoriaEl || !tipoEl) return;

    const tipo = tipoEl.value || "despesa";
    categoriaEl.innerHTML = "";

    if (tipo === "receita") {
        categoriaEl.value = "";
        if (categoriaContainer) categoriaContainer.hidden = true;
        return;
    }

    if (categoriaContainer) categoriaContainer.hidden = false;

    const categorias = ["Necessidades", "Desejos", "Investimentos", "Outros"];

    categorias.forEach((categoria) => {
        const option = document.createElement("option");
        option.value = categoria;
        option.textContent = categoria;
        categoriaEl.appendChild(option);
    });

    if (!categoriaEl.value) {
        categoriaEl.value = categorias[0];
    }
}

function obterLancamentosFiltrados() {
    return lancamentos.filter(item => {
        const data = parseDataLocal(item.data);
        const mes = data ? data.getMonth() : null;
        const ano = data ? data.getFullYear() : null;

        const filtroMesAtivo = !filtroMes?.value || mes === Number(filtroMes.value);
        const filtroAnoAtivo = !filtroAno?.value || ano === Number(filtroAno.value);
        const filtroTipoAtivo = !filtroTipo?.value || item.tipo === filtroTipo.value;
        const filtroUsuarioAtivo = !filtroUsuario?.value || item.usuario === filtroUsuario.value;

        return filtroMesAtivo && filtroAnoAtivo && filtroTipoAtivo && filtroUsuarioAtivo;
    });
}

function salvarLancamentoAPI(lancamento) {
    try {
        if (lancamentoEditando) {
            lancamentos = lancamentos.map(item =>
                item.id === lancamentoEditando
                    ? { ...item, ...lancamento }
                    : item
            );
        } else {
            lancamentos.unshift({
                ...lancamento,
                id: Date.now()
            });
        }

        saveLancamentosLocal(lancamentos);
        lancamentoEditando = null;

        if (modal) {
            modal.style.display = "none";
        }

        limparFormulario();
        renderizarTabela();
        notificarAtualizacao();
        mostrarToast("Lançamento salvo com sucesso");
    } catch (erro) {
        console.error(erro);
        mostrarToast("Erro ao salvar lançamento", true);
    }
}

function renderizarTabela() {
    if (!tabela) return;

    tabela.innerHTML = "";

    const filtrados = obterLancamentosFiltrados();

    filtrados.forEach(item => {
        const linha = document.createElement("tr");

        const tdData = document.createElement("td");
        tdData.textContent = formatarData(item.data);

        const tdUsuario = document.createElement("td");
        tdUsuario.textContent = item.usuario || "Não informado";

        const tdTipo = document.createElement("td");
        tdTipo.textContent = item.tipo === "receita" ? "Receita" : "Despesa";

        const tdCategoria = document.createElement("td");
        tdCategoria.textContent = item.categoria || "-";

        const tdDescricao = document.createElement("td");
        tdDescricao.textContent = item.descricao || "-";

        const tdValor = document.createElement("td");
        tdValor.textContent = formatarMoeda(item.valor);

        const tdAcoes = document.createElement("td");

        const btnEditar = document.createElement("button");
        btnEditar.textContent = "Editar";
        btnEditar.className = "btn-action btn-action--edit";
        btnEditar.type = "button";
        btnEditar.addEventListener("click", () => editar(item.id));

        const btnExcluir = document.createElement("button");
        btnExcluir.textContent = "Excluir";
        btnExcluir.className = "btn-action btn-action--delete";
        btnExcluir.type = "button";
        btnExcluir.addEventListener("click", () => excluir(item.id));

        tdAcoes.appendChild(btnEditar);
        tdAcoes.appendChild(document.createTextNode(" "));
        tdAcoes.appendChild(btnExcluir);

        linha.appendChild(tdData);
        linha.appendChild(tdUsuario);
        linha.appendChild(tdTipo);
        linha.appendChild(tdCategoria);
        linha.appendChild(tdDescricao);
        linha.appendChild(tdValor);
        linha.appendChild(tdAcoes);

        tabela.appendChild(linha);
    });

    atualizarResumo();
}

function excluir(id) {
    if (!confirm("Deseja realmente excluir este lançamento?")) {
        return;
    }

    try {
        lancamentos = lancamentos.filter(item => item.id !== id);
        saveLancamentosLocal(lancamentos);
        renderizarTabela();
        notificarAtualizacao();
        mostrarToast("Lançamento excluído");
    } catch (erro) {
        console.error(erro);
        mostrarToast("Erro ao excluir lançamento", true);
    }
}

function editar(id) {
    const item = lancamentos.find(x => x.id === id);
    if (!item) return;

    lancamentoEditando = id;

    const tipoEl = document.getElementById("tipo");
    const categoriaEl = document.getElementById("categoria");
    const usuarioEl = document.getElementById("usuario");
    const valorEl = document.getElementById("valor");
    const descricaoEl = document.getElementById("descricao");
    const dataEl = document.getElementById("data");

    if (usuarioEl) usuarioEl.value = item.usuario || "João";
    if (tipoEl) tipoEl.value = item.tipo || "despesa";
    if (categoriaEl) {
        popularCategorias();
        categoriaEl.value = item.categoria || "Necessidades";
    }
    if (valorEl) valorEl.value = item.valor;
    if (descricaoEl) descricaoEl.value = item.descricao;
    if (dataEl) dataEl.value = item.data;

    if (modal) {
        modal.style.display = "flex";
    }
}

function limparFormulario() {
    const tipoEl = document.getElementById("tipo");
    const categoriaEl = document.getElementById("categoria");
    const usuarioEl = document.getElementById("usuario");
    const valorEl = document.getElementById("valor");
    const descricaoEl = document.getElementById("descricao");
    const dataEl = document.getElementById("data");

    if (usuarioEl) usuarioEl.value = "João";
    if (tipoEl) tipoEl.value = "despesa";
    if (categoriaEl) {
        popularCategorias();
        categoriaEl.value = "Necessidades";
    }
    if (valorEl) valorEl.value = "";
    if (descricaoEl) descricaoEl.value = "";
    if (dataEl) dataEl.value = "";
}

function formatarData(data) {
    const d = parseDataLocal(data);
    return d ? d.toLocaleDateString("pt-BR") : "";
}

function carregarLancamentos() {
    lancamentos = getLancamentosLocal();
    carregarAnos();
    renderizarTabela();
}

function atualizarResumo() {
    let receitas = 0;
    let despesas = 0;

    const filtrados = obterLancamentosFiltrados();

    filtrados.forEach(item => {
        if (item.tipo === "receita") {
            receitas += Number(item.valor || 0);
        } else {
            despesas += Number(item.valor || 0);
        }
    });

    const totalReceitasEl = document.getElementById("totalReceitas");
    const totalDespesasEl = document.getElementById("totalDespesas");
    const saldoAtualEl = document.getElementById("saldoAtual");

    if (totalReceitasEl) totalReceitasEl.textContent = formatarMoeda(receitas);
    if (totalDespesasEl) totalDespesasEl.textContent = formatarMoeda(despesas);
    if (saldoAtualEl) saldoAtualEl.textContent = formatarMoeda(receitas - despesas);
}

function mostrarToast(mensagem, erro = false) {
    if (!toast) return;

    toast.textContent = mensagem;
    toast.className = "toast";

    if (erro) {
        toast.classList.add("error");
    }

    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function inicializarPlanilha() {
    carregarMeses();
    popularCategorias();

    if (filtroMes) {
        filtroMes.addEventListener("change", renderizarTabela);
    }

    if (filtroAno) {
        filtroAno.addEventListener("change", renderizarTabela);
    }

    if (filtroTipo) {
        filtroTipo.addEventListener("change", renderizarTabela);
    }

    if (filtroUsuario) {
        filtroUsuario.addEventListener("change", renderizarTabela);
    }

    const tipoEl = document.getElementById("tipo");
    if (tipoEl) {
        tipoEl.addEventListener("change", popularCategorias);
    }

    if (btnSalvar) {
        btnSalvar.addEventListener("click", () => {
            const tipo = document.getElementById("tipo")?.value;
            const usuario = document.getElementById("usuario")?.value;
            const categoria = tipo === "receita"
                ? ""
                : document.getElementById("categoria")?.value;
            const valor = document.getElementById("valor")?.value;
            const descricao = document.getElementById("descricao")?.value;
            const data = document.getElementById("data")?.value;

            if (!usuario || !tipo || (tipo !== "receita" && !categoria) || !valor || !descricao || !data) {
                mostrarToast("Preencha todos os campos", true);
                return;
            }

            const lancamento = {
                usuario,
                tipo,
                categoria,
                valor: Number(valor),
                descricao,
                data
            };

            salvarLancamentoAPI(lancamento);
        });
    }

    carregarLancamentos();
}

document.addEventListener("DOMContentLoaded", inicializarPlanilha);

window.carregarMeses = carregarMeses;
window.popularCategorias = popularCategorias;
window.addEventListener("fincontrol:updated", carregarLancamentos);