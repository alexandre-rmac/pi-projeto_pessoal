const btn_entrar = document.getElementById('btn_entrar')
btn_entrar.addEventListener('click', entrar)

function entrar() {
    aguardar();

    const ipt_email = document.getElementById('email_input').value
    const msg_email = document.getElementById('email_msg')
    const ipt_senha = document.getElementById('senha_input').value
    const msg_senha = document.getElementById('senha_msg')

    if (ipt_email == "") {
        msg_email.innerHTML = 'Insira seu email'
        finalizarAguardar();
        return false;
    } else if (ipt_senha == "") {
        msg_senha.innerHTML = 'Insira sua senha'
        finalizarAguardar();
        return false;
    }
    else {
        setInterval(sumirMensagem, 5000)
    }

    console.log("FORM LOGIN: ", ipt_email);
    console.log("FORM SENHA: ", ipt_senha);

    fetch("/usuarios/autenticar", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            emailServer: ipt_email,
            senhaServer: ipt_senha
        })
    }).then(function (resposta) {
        console.log("ESTOU NO THEN DO entrar()!")

        if (resposta.ok) {
            console.log(resposta);

            resposta.json().then(json => {
                console.log(json);
                console.log(JSON.stringify(json));
                sessionStorage.EMAIL_USUARIO = json.email;
                sessionStorage.NOME_USUARIO = json.nome;
                sessionStorage.ID_USUARIO = json.id;
                sessionStorage.AQUARIOS = JSON.stringify(json.aquarios)

                setTimeout(function () {
                    window.location = "./dashboard/cards.html";
                }, 1000); // apenas para exibir o loading

            });

        } else {

            console.log("Houve um erro ao tentar realizar o login!");

            resposta.text().then(texto => {
                console.error(texto);
                finalizarAguardar(texto);
            });
        }

    }).catch(function (erro) {
        console.log(erro);
    })

    return false;
}

function sumirMensagem() {
    cardErro.style.display = "none"
}
