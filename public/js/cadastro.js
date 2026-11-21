
const ipt_nome = document.getElementById('cadastro_nome_input')
const ipt_email = document.getElementById('cadastro_email_input')
const ipt_senha = document.getElementById('cadastro_senha_input')
const ipt_confirmacao = document.getElementById('cadastro_confirmar_senha_input')
const msg_erro_senha = document.getElementById('erro_senha_msg')
const msg_erro_login = document.getElementById('erro_login_msg')
const btn_cadastar = document.getElementById('btn_cadastrar')
const tooltip_senha = document.getElementById('senha_tooltip')
const regex_nome = /^[a-zA-Z0-9]+$/;
const regex_email = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
var pontos;

window.addEventListener('pageshow', habilitarBtn)
btn_cadastar.addEventListener('click', cadastrar)
ipt_senha.addEventListener('input', verificarSenha)
tooltip_senha.addEventListener('mouseenter', exibirTooltip)
tooltip_senha.addEventListener('mouseleave', inibirTooltip)

function cadastrar() {
    btn_cadastar.disabled = true

    var erro = true
    var nomeVar = ipt_nome.value;
    var emailVar = ipt_email.value;
    var senhaVar = ipt_senha.value;
    var confirmacaoSenhaVar = ipt_confirmacao.value;

    if (
        nomeVar == "" ||
        emailVar == "" ||
        senhaVar == "" ||
        confirmacaoSenhaVar == ""
    ) {
        msg_erro_login.innerHTML = 'Preencha todos os campos.'
        return false;
    } else if (senhaVar != confirmacaoSenhaVar) {
        msg_erro_login.innerHTML = 'A senha e a confirmação de senha não confere.'
    } else if (!regex_nome.test(nomeVar)) {
        msg_erro_login.innerHTML = 'O nome de usuário só pode letras e números.'
    } else if (!regex_email.test(emailVar)) {
        msg_erro_login.innerHTML = 'O email digitado não é válido.'
    } else if (pontos < 5) {
        msg_erro_login.innerHTML = 'Insira uma senha forte.'
    } else {
        erro = false
    }

    if (erro) {
        habilitarBtn()
        setTimeout(sumirMensagem, 5000);
        return
    }
    // Enviando o valor da nova input
    fetch("/usuarios/cadastrar", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            // crie um atributo que recebe o valor recuperado aqui
            // Agora vá para o arquivo routes/usuario.js
            nomeServer: nomeVar,
            emailServer: emailVar,
            senhaServer: senhaVar
        }),
    })
        .then(function (resposta) {
            console.log("resposta: ", resposta);

            if (resposta.ok) {
                msg_erro_login.innerHTML = "Cadastro realizado com sucesso! Redirecionando para tela de Login..."
                console.log(
                    "Cadastro realizado com sucesso! Redirecionando para tela de Login..."
                );

                setTimeout(() => {
                    window.location = "login.html";
                }, "2000");

                // finalizarAguardar();
            } else {
                if (resposta.status === 409) {
                    throw "Este email já está cadastrado"
                } else {
                    throw "Houve um erro ao tentar realizar o cadastro!";
                }
            }
        })
        .catch(function (resposta) {
            msg_erro_login.innerHTML = `${resposta}`
            console.log(`#ERRO: ${resposta}`);
            // finalizarAguardar();
        });
    limparFormulario()
    sumirMensagem()
    return false;
}

function limparFormulario() {
    ipt_nome.value = ''
    ipt_email.value = ''
    ipt_senha.value = ''
    ipt_confirmacao.value = ''
    habilitarBtn()
}

function sumirMensagem() {
    msg_erro_login.innerHTML = ''
    msg_erro_senha.innerHTML = ''
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
        msg_erro_senha.style.color = getComputedStyle(document.documentElement).getPropertyValue('--destaque-vermelho')
        msg_erro_senha.innerHTML = 'Senha Fraca'
    } else if (pontos < 5) {
        msg_erro_senha.style.color = getComputedStyle(document.documentElement).getPropertyValue('--destaque-suave')
        msg_erro_senha.innerHTML = 'Senha Média'
    } else {
        msg_erro_senha.style.color = getComputedStyle(document.documentElement).getPropertyValue('--destaque-verde')
        msg_erro_senha.innerHTML = 'Senha Forte'
    }
    setTimeout(sumirMensagem, 5000)
}

function exibirTooltip() {
    const pop = document.getElementById('pop-up')
    pop.style.display = 'block'
}
function inibirTooltip() {
    const pop = document.getElementById('pop-up')
    pop.style.display = 'none'

}
