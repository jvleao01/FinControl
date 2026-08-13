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
