const btn_entrar = document.getElementById('btn_entrar')
const msg_erro_login = document.getElementById('erro_login_msg')

btn_entrar.addEventListener('click', entrar)
window.addEventListener('pageshow', () => {
    btn_entrar.disabled = false
})

async function entrar(event) {
    event.preventDefault()
    btn_entrar.disabled = true
    // aguardar();

    const ipt_email = document.getElementById('email_input').value
    const ipt_senha = document.getElementById('senha_input').value

    if (ipt_email == "" || ipt_senha == "") {
        msg_erro_login.innerHTML = 'Insira seu email e sua senha'
        btn_entrar.disabled = false
        // finalizarAguardar();
        return false;
    }
    else {
        setTimeout(sumirMensagem, 5000)
    }

    console.log("FORM LOGIN: ", ipt_email);
    console.log("FORM SENHA: ", ipt_senha);

    await fetch("/usuarios/autenticar", {
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

            return resposta.json().then(json => {
                console.log(json);
                console.log(JSON.stringify(json));
                sessionStorage.EMAIL_USUARIO = json.email;
                sessionStorage.NOME_USUARIO = json.nome;
                sessionStorage.ID_USUARIO = json.id;
                sessionStorage.DECKS_USUARIO = JSON.stringify(json.decks)

                if (json.decks.length === 0) {
                    setTimeout(function () { 
                        window.location = './usuario/criarDeck.html';
                    }, 1000)
                } else {
                    setTimeout(function () {
                        window.location = "./usuario/perfil.html";
                    }, 1000);
                }

            });

        } else {

            console.log("Houve um erro ao tentar realizar o login!");

            return resposta.text().then(texto => {
                console.error(texto);
                finalizarAguardar(texto);
            });
        }

    }).catch(function (erro) {
        console.log(erro);
    })
}

function sumirMensagem() {
    msg_erro_login.innerHTML = ''
}
