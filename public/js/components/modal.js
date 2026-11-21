function mostrarModal(titulo, mensagemHtml) {
    const modal = document.getElementById('modal-alerta');
    if (!modal) return;
    
    const msgBox = document.getElementById('modal-mensagem');
    const btnContainer = document.getElementById('modal-botoes');
    
    document.getElementById('modal-titulo').innerText = titulo;
    msgBox.innerHTML = mensagemHtml;
    
    // Recria o botão padrão de fechar
    btnContainer.innerHTML = `<button class="btn" style="width: 100%;" onclick="document.getElementById('modal-alerta').classList.add('hidden')">Fechar</button>`;
    
    modal.classList.remove('hidden');
}

function mostrarModalConfirmacao(titulo, mensagemHtml, onConfirm) {
    const modal = document.getElementById('modal-alerta');
    const btnContainer = document.getElementById('modal-botoes');
    
    document.getElementById('modal-titulo').innerText = titulo;
    document.getElementById('modal-mensagem').innerHTML = mensagemHtml;
    
    // Cria os botões de Cancelar e Confirmar
    btnContainer.innerHTML = `
        <div style="display: flex; gap: 1rem; width: 100%;">
            <button class="btn-outline" style="flex: 1;" onclick="document.getElementById('modal-alerta').classList.add('hidden')">Cancelar</button>
            <button class="btn" style="flex: 1; background: var(--destaque-vermelho); color: var(--fundo); border-color: var(--destaque-vermelho);" id="btn-confirmar-exclusao">Confirmar</button>
        </div>
    `;
    
    document.getElementById('btn-confirmar-exclusao').onclick = () => {
        modal.classList.add('hidden');
        onConfirm();
    };
    
    modal.classList.remove('hidden');
}