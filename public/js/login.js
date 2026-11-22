// public/js/login.js

const btn_entrar = document.getElementById('btn_entrar')
const form_login = document.getElementById('form-login')

form_login.addEventListener('submit', entrar)
window.addEventListener('pageshow', () => { btn_entrar.disabled = false })

async function entrar(event) {
    if (event) event.preventDefault()
    btn_entrar.disabled = true
    mostrarLoading()

    const ipt_email = document.getElementById('email_input').value
    const ipt_senha = document.getElementById('senha_input').value

    if (ipt_email === "" || ipt_senha === "") {
        esconderLoading()
        btn_entrar.disabled = false
        mostrarModal('Erro ao entrar', 'Insira seu email e sua senha.')
        return false;
    }

    try {
        const resposta = await fetch("/usuarios/autenticar", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                emailServer: ipt_email,
                senhaServer: ipt_senha
            })
        })

        if (resposta.ok) {
            const json = await resposta.json()
            sessionStorage.EMAIL_USUARIO = json.email;
            sessionStorage.NOME_USUARIO = json.nome;
            sessionStorage.ID_USUARIO = json.id;
            sessionStorage.DECKS_USUARIO = JSON.stringify(json.decks)

            const decks = json.decks ?? []
            const destino = decks.length === 0
                ? './usuario/criar-deck.html'
                : './usuario/perfil.html';

            esconderLoading()
            btn_entrar.disabled = false
            mostrarModal(
                'Login realizado!',
                'Bem-vindo de volta.',
                {
                    texto: 'Continuar',
                    callback: () => { window.location = destino }
                }
            )
        } else {
            let texto;
            try {
                texto = await resposta.text();
            } catch (e) {
                texto = '';
            }
            esconderLoading()
            btn_entrar.disabled = false
            mostrarModal('Erro ao entrar', texto || 'Houve um erro ao tentar realizar o login.')
        }
    } catch (erro) {
        esconderLoading()
        btn_entrar.disabled = false
        mostrarModal('Erro ao entrar', 'Houve um erro ao tentar realizar o login.')
    }
}