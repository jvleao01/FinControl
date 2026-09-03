document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");

    if (!link || event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (link.target && link.target !== "_self") return;

    const targetUrl = new URL(link.href, window.location.href);
    const currentUrl = new URL(window.location.href);

    if (targetUrl.origin !== currentUrl.origin) return;
    if (targetUrl.href === currentUrl.href) return;

    event.preventDefault();
    document.body.classList.add("page-exit");

    window.setTimeout(() => {
        window.location.href = targetUrl.href;
    }, 220);
});

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js")
            .then((registration) => {
                console.log("Service Worker registrado com sucesso.");
                if (registration.waiting) {
                    registration.waiting.postMessage({ type: "SKIP_WAITING" });
                }
            })
            .catch((error) => console.error("Falha ao registrar o Service Worker:", error));
    });
}

window.addEventListener("online", () => {
    console.log("Conexão restaurada");
});

window.addEventListener("offline", () => {
    console.log("App está offline");
});
