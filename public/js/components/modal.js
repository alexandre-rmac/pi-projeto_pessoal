function mostrarModal(titulo, mensagemHtml) {
    const modal = document.getElementById('modal-alerta');
    if (!modal) return;
    
    document.getElementById('modal-titulo').innerText = titulo;
    document.getElementById('modal-mensagem').innerHTML = mensagemHtml;
    modal.classList.remove('hidden');
}