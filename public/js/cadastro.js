
// Array para armazenar empresas cadastradas para validação de código de ativação 

const ipt_nome = document.getElementById('cadastro_nome_input')
const ipt_email = document.getElementById('cadastro_email_input')
const ipt_senha = document.getElementById('cadastro_senha_input')
const ipt_confirmacao = document.getElementById('cadastro_confirmar_senha_input')
const btn_cadastar = document.getElementById('btn_cadastrar')
btn_cadastar.addEventListener('click', cadastrar)

function cadastrar() {
    // aguardar();
    console.log(ipt_nome)

    //Recupere o valor da nova input pelo nome do id
    // Agora vá para o método fetch logo abaixo
    var nomeVar = ipt_nome.value;
    var emailVar = ipt_email.value;
    var senhaVar = ipt_senha.value;
    var confirmacaoSenhaVar = ipt_confirmacao.value;
    // var codigoVar = codigo_input.value;
    // var idEmpresaVincular

    // Verificando se há algum campo em branco
    if (
        nomeVar == "" ||
        emailVar == "" ||
        senhaVar == "" ||
        confirmacaoSenhaVar == ""
    ) {
        //   cardErro.style.display = "block";
        console.log("Mensagem de erro para todos os campos em branco"); // exibir msg de erro

        finalizarAguardar();
        return false;
    } else {
        sumirMensagem()
        // setInterval(sumirMensagem, 5000);
    }

    // Verificar o código de ativação -- possibly / maybe


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
                //   cardErro.style.display = "block";

                console.log(
                    "Cadastro realizado com sucesso! Redirecionando para tela de Login..."
                );

                setTimeout(() => {
                    window.location = "login.html";
                }, "2000");

                limparFormulario();
                finalizarAguardar();
            } else {
                throw "Houve um erro ao tentar realizar o cadastro!";
            }
        })
        .catch(function (resposta) {
            console.log(`#ERRO: ${resposta}`);
            finalizarAguardar();
        });

    return false;
}

function sumirMensagem() {
    // cardErro.style.display = "none";
    console.log('sumirMensagem')
}