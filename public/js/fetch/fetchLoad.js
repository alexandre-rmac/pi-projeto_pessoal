
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 2. Loading: Funções para exibir/esconder o pop-up de carregamento
function mostrarLoading() {
    let overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.classList.remove('hidden');
}

function esconderLoading() {
    let overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.classList.add('hidden');
}