document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("modalLancamento");
    const openBtn = document.getElementById("openModal");
    const closeBtn = modal?.querySelector(".close");
    const tipoEl = document.getElementById("tipo");
    const categoriaEl = document.getElementById("categoria");

    if (!modal) return;

    const popularCategorias = () => {
        if (!categoriaEl || !tipoEl) return;

        const tipo = tipoEl.value || "despesa";
        categoriaEl.innerHTML = "";

        const categorias = tipo === "receita"
            ? ["Investimentos", "Reserva", "Outros"]
            : ["Necessidades", "Desejos", "Investimentos", "Outros"];

        categorias.forEach((categoria) => {
            const option = document.createElement("option");
            option.value = categoria;
            option.textContent = categoria;
            categoriaEl.appendChild(option);
        });

        categoriaEl.value = categorias[0];
    };

    const resetarFormulario = () => {
        if (tipoEl) tipoEl.value = "despesa";

        popularCategorias();

        const valorEl = document.getElementById("valor");
        const descricaoEl = document.getElementById("descricao");
        const dataEl = document.getElementById("data");

        if (valorEl) valorEl.value = "";
        if (descricaoEl) descricaoEl.value = "";
        if (dataEl) dataEl.value = "";
    };

    const abrirModal = () => {
        modal.style.display = "flex";
        resetarFormulario();
    };

    const fecharModal = () => {
        modal.style.display = "none";
        resetarFormulario();
    };

    if (openBtn) {
        openBtn.addEventListener("click", abrirModal);
    }

    if (closeBtn) {
        closeBtn.addEventListener("click", fecharModal);
    }

    if (tipoEl) {
        tipoEl.addEventListener("change", popularCategorias);
    }

    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            fecharModal();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && modal.style.display === "flex") {
            fecharModal();
        }
    });
});