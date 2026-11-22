const ipt_nome = document.getElementById('cadastro_nome_input')
const ipt_email = document.getElementById('cadastro_email_input')
const ipt_senha = document.getElementById('cadastro_senha_input')
const ipt_confirmacao = document.getElementById('cadastro_confirmar_senha_input')
const forca_senha_msg = document.getElementById('forca_senha_msg')
const msg_erro_cadastro = document.getElementById('msg_erro_cadastro')
const btn_cadastar = document.getElementById('btn_cadastrar')
const tooltip_senha = document.getElementById('senha_tooltip')
const form_cadastro = document.getElementById('form-cadastro')

const regex_nome = /^[a-zA-Z0-9]+$/;
const regex_email = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
var pontos;

window.addEventListener('pageshow', habilitarBtn)
form_cadastro.addEventListener('submit', cadastrar)
ipt_senha.addEventListener('input', verificarSenha)
tooltip_senha.addEventListener('mouseenter', exibirTooltip)
tooltip_senha.addEventListener('mouseleave', inibirTooltip)

async function cadastrar(event) {
    if (event) event.preventDefault()
    btn_cadastar.disabled = true
    mostrarLoading()

    var nomeVar = ipt_nome.value;
    var emailVar = ipt_email.value;
    var senhaVar = ipt_senha.value;
    var confirmacaoSenhaVar = ipt_confirmacao.value;

    var mensagemErro = '';

    if (nomeVar === "" || emailVar === "" || senhaVar === "" || confirmacaoSenhaVar === "") {
        mensagemErro = 'Preencha todos os campos.';
    } else if (senhaVar !== confirmacaoSenhaVar) {
        mensagemErro = 'A senha e a confirmação de senha não conferem.';
    } else if (!regex_nome.test(nomeVar)) {
        mensagemErro = 'O nome de usuário só pode conter letras e números.';
    } else if (!regex_email.test(emailVar)) {
        mensagemErro = 'O email digitado não é válido.';
    } else if (pontos < 5) {
        mensagemErro = 'Insira uma senha forte.';
    }

    if (mensagemErro) {
        esconderLoading()
        habilitarBtn()
        mostrarModal('Não foi possível cadastrar', mensagemErro)
        return
    }

    try {
        const resposta = await fetch("/usuarios/cadastrar", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                nomeServer: nomeVar,
                emailServer: emailVar,
                senhaServer: senhaVar
            }),
        })

        if (resposta.ok) {
            esconderLoading()
            limparFormulario()
            habilitarBtn()
            mostrarModal(
                'Cadastro realizado!',
                'Sua conta foi criada com sucesso.',
                {
                    texto: 'Ir para login',
                    callback: () => { window.location = 'login.html' }
                }
            )
            return
        }

        let texto;
        try {
            texto = await resposta.text();
        } catch (e) {
            texto = '';
        }
        if (!texto) {
            texto = resposta.status === 409
                ? 'Este email já está cadastrado.'
                : 'Houve um erro ao tentar realizar o cadastro.';
        }
        throw new Error(texto)
    } catch (err) {
        esconderLoading()
        habilitarBtn()
        mostrarModal('Não foi possível cadastrar', err.message || 'Houve um erro ao tentar realizar o cadastro.')
    }
}

function limparFormulario() {
    ipt_nome.value = ''
    ipt_email.value = ''
    ipt_senha.value = ''
    ipt_confirmacao.value = ''
}

function habilitarBtn() {
    btn_cadastar.disabled = false
}

function verificarSenha() {
    const senhaVar = ipt_senha.value
    const numeroTeste = /[0-9]/
    const maiusculaTeste = /[A-Z]/
    const minusculaTeste = /[a-z]/
    const simboloTeste = /[!@#$%&*?]/
    const testes = {
        tamanho: senhaVar.length >= 8,
        numero: numeroTeste.test(senhaVar),
        maiuscula: maiusculaTeste.test(senhaVar),
        minuscula: minusculaTeste.test(senhaVar),
        simbolo: simboloTeste.test(senhaVar)
    }
    pontos = 0
    if (testes.tamanho) pontos++
    if (testes.numero) pontos++
    if (testes.maiuscula) pontos++
    if (testes.minuscula) pontos++
    if (testes.simbolo) pontos++
    if (pontos < 2) {
        forca_senha_msg.style.color = getComputedStyle(document.documentElement).getPropertyValue('--destaque-vermelho')
        forca_senha_msg.innerHTML = 'Senha Fraca'
    } else if (pontos < 5) {
        forca_senha_msg.style.color = getComputedStyle(document.documentElement).getPropertyValue('--destaque-suave')
        forca_senha_msg.innerHTML = 'Senha Média'
    } else {
        forca_senha_msg.style.color = getComputedStyle(document.documentElement).getPropertyValue('--destaque-verde')
        forca_senha_msg.innerHTML = 'Senha Forte'
    }
}

function exibirTooltip() {
    const pop = document.getElementById('pop-up')
    pop.style.display = 'block'
}

function inibirTooltip() {
    const pop = document.getElementById('pop-up')
    pop.style.display = 'none'
}