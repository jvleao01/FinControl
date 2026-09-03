let grafico = null;
let graficoComparativo = null;
let lancamentos = [];

const STORAGE_KEY = "fincontrol.lancamentos";
const usuarioSelecionado = document.body.dataset.usuario;

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

function formatCurrency(value) {
    return Number(value || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function calcularResumo(items) {
    let receitas = 0;
    let despesas = 0;
    let necessidades = 0;
    let desejos = 0;
    let investimentos = 0;

    items.forEach((item) => {
        const valor = Number(item.valor || 0);

        if (item.tipo === "receita") {
            receitas += valor;
        } else {
            despesas += valor;

            if (item.categoria === "Necessidades") {
                necessidades += valor;
            } else if (item.categoria === "Desejos") {
                desejos += valor;
            } else if (item.categoria === "Investimentos") {
                investimentos += valor;
            }
        }
    });

    const dinheiroDisponivel = receitas - despesas;
    const patrimonioTotal = dinheiroDisponivel + investimentos;

    return {
        receitas,
        despesas,
        dinheiroDisponivel,
        dinheiroInvestido: investimentos,
        patrimonioTotal,
        necessidades,
        desejos,
        investimentos
    };
}

function atualizarCards(resumo) {
    const elementos = {
        disponible: document.getElementById("dinheiroDisponivel"),
        investido: document.getElementById("dinheiroInvestido"),
        total: document.getElementById("patrimonioTotal")
    };

    if (elementos.disponible) {
        elementos.disponible.textContent = formatCurrency(resumo.dinheiroDisponivel);
    }

    if (elementos.investido) {
        elementos.investido.textContent = formatCurrency(resumo.dinheiroInvestido);
    }

    if (elementos.total) {
        elementos.total.textContent = formatCurrency(resumo.patrimonioTotal);
    }

    const cardDisponivel = elementos.disponible?.closest(".stat-card");
    const cardTotal = elementos.total?.closest(".stat-card");
    const saldoNegativo = resumo.dinheiroDisponivel < 0;

    cardDisponivel?.classList.toggle("is-negative", saldoNegativo);
    cardTotal?.classList.toggle("is-negative", saldoNegativo);
}

function atualizarBarras(resumo) {
    const totalDespesas = resumo.necessidades + resumo.desejos + resumo.investimentos;

    const valores = [
        totalDespesas > 0 ? (resumo.necessidades / totalDespesas) * 100 : 0,
        totalDespesas > 0 ? (resumo.desejos / totalDespesas) * 100 : 0,
        totalDespesas > 0 ? (resumo.investimentos / totalDespesas) * 100 : 0
    ];

    const barras = [
        document.getElementById("barNecessidades"),
        document.getElementById("barDesejos"),
        document.getElementById("barInvestimentos")
    ];

    const textos = [
        document.getElementById("valorNecessidades"),
        document.getElementById("valorDesejos"),
        document.getElementById("valorInvestimentos")
    ];

    barras.forEach((barra, index) => {
        if (barra) {
            barra.style.width = `${valores[index].toFixed(0)}%`;
        }
    });

    textos.forEach((texto, index) => {
        if (texto) {
            texto.textContent = `${valores[index].toFixed(0)}%`;
        }
    });
}

function atualizarGrafico(resumo) {
    const canvas = document.getElementById("graficoDespesas");

    if (!canvas || !window.Chart) return;

    if (grafico) {
        grafico.destroy();
    }

    grafico = new Chart(canvas, {
        type: "doughnut",
        data: {
            labels: ["Necessidades", "Desejos", "Investimentos"],
            datasets: [{
                data: [resumo.necessidades, resumo.desejos, resumo.investimentos],
                backgroundColor: ["#ef4444", "#a855f7", "#22c55e"],
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "72%",
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        color: "#e2e8f0",
                        padding: 16,
                        boxWidth: 12,
                        boxHeight: 12,
                        font: {
                            size: 13
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const value = Number(context.raw || 0);
                            const total = context.dataset.data.reduce((sum, item) => sum + Number(item || 0), 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(0) : 0;
                            return `${context.label}: R$ ${value.toLocaleString("pt-BR")} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function calcularComparativoUsuarios(items) {
    const porUsuario = {};

    items.forEach((item) => {
        const usuario = item.usuario || "Sem usuário";
        const valor = Number(item.valor || 0);

        if (!porUsuario[usuario]) {
            porUsuario[usuario] = { receitas: 0, despesas: 0 };
        }

        if (item.tipo === "receita") {
            porUsuario[usuario].receitas += valor;
        } else {
            porUsuario[usuario].despesas += valor;
        }
    });

    return porUsuario;
}

function atualizarGraficoComparativo(porUsuario) {
    const canvas = document.getElementById("graficoComparativoUsuarios");

    if (!canvas || !window.Chart) return;

    if (graficoComparativo) {
        graficoComparativo.destroy();
    }

    const usuarios = Object.keys(porUsuario);

    graficoComparativo = new Chart(canvas, {
        type: "bar",
        data: {
            labels: usuarios,
            datasets: [
                {
                    label: "Receitas",
                    data: usuarios.map((usuario) => porUsuario[usuario].receitas),
                    backgroundColor: "#22c55e",
                    borderRadius: 6
                },
                {
                    label: "Gastos",
                    data: usuarios.map((usuario) => porUsuario[usuario].despesas),
                    backgroundColor: "#ef4444",
                    borderRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    ticks: { color: "#e2e8f0" },
                    grid: { display: false }
                },
                y: {
                    beginAtZero: true,
                    ticks: { color: "#e2e8f0" },
                    grid: { color: "rgba(148, 163, 184, 0.12)" }
                }
            },
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        color: "#e2e8f0",
                        padding: 16,
                        boxWidth: 12,
                        boxHeight: 12,
                        font: { size: 13 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const value = Number(context.raw || 0);
                            return `${context.dataset.label}: R$ ${value.toLocaleString("pt-BR")}`;
                        }
                    }
                }
            }
        }
    });
}

function carregarDadosDashboard() {
    const todosLancamentos = getLancamentosLocal();
    lancamentos = usuarioSelecionado
        ? todosLancamentos.filter(item => item.usuario === usuarioSelecionado)
        : todosLancamentos;
    const resumo = calcularResumo(lancamentos);

    atualizarCards(resumo);
    atualizarBarras(resumo);
    atualizarGrafico(resumo);
    atualizarGraficoComparativo(calcularComparativoUsuarios(todosLancamentos));
}

document.addEventListener("DOMContentLoaded", () => {
    carregarDadosDashboard();
});

window.addEventListener("fincontrol:updated", carregarDadosDashboard);