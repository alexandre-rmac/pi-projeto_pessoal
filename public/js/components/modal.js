let modalRequerDecisao = false;

function mostrarModal(titulo, mensagemHtml, onAcao) {
    const modal = document.getElementById('modal-alerta');
    if (!modal) return;

    document.getElementById('modal-titulo').innerText = titulo;
    document.getElementById('modal-mensagem').innerHTML = mensagemHtml;

    modalRequerDecisao = false;

    const textoBotao = onAcao && onAcao.texto ? onAcao.texto : 'Fechar';
    const btnContainer = document.getElementById('modal-botoes');
    btnContainer.innerHTML = `<button class="btn" id="btn-confirmar" style="width: 100%;">${textoBotao}</button>`;

    document.getElementById('btn-confirmar').onclick = () => {
        fecharModal();
        if (onAcao && typeof onAcao.callback === 'function') onAcao.callback();
    };

    modal.classList.remove('hidden');
}

function mostrarModalConfirmacao(titulo, mensagemHtml, onConfirm) {
    const modal = document.getElementById('modal-alerta');
    if (!modal) return;

    document.getElementById('modal-titulo').innerText = titulo;
    document.getElementById('modal-mensagem').innerHTML = mensagemHtml;

    modalRequerDecisao = true;

    const btnContainer = document.getElementById('modal-botoes');
    btnContainer.innerHTML = `
        <div style="display: flex; gap: 1rem; width: 100%;">
            <button class="btn-outline" style="flex: 1;" id="btn-cancelar-modal">Cancelar</button>
            <button class="btn" style="flex: 1; background: var(--destaque-vermelho); color: var(--fundo); border-color: var(--destaque-vermelho);" id="btn-confirmar-exclusao">Confirmar</button>
        </div>
    `;

    document.getElementById('btn-cancelar-modal').onclick = () => fecharModal();
    document.getElementById('btn-confirmar-exclusao').onclick = () => {
        fecharModal();
        onConfirm();
    };

    modal.classList.remove('hidden');
}

function fecharModal() {
    const modal = document.getElementById('modal-alerta');
    if (modal) modal.classList.add('hidden');
    modalRequerDecisao = false;
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modalRequerDecisao) {
        const modal = document.getElementById('modal-alerta');
        if (modal && !modal.classList.contains('hidden')) fecharModal();
    }
});

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay') && !modalRequerDecisao) {
        fecharModal();
    }
});