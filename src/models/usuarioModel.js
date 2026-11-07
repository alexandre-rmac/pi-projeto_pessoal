var database = require("../database/config")

// login
async function autenticar(email, senha) {
    console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function entrar(): ", email, senha)

    var instrucaoSql = `
        SELECT c.id, c.email, c.senha, u.id AS usuarioId, u.nome
        FROM cadastro c
        JOIN usuario u ON u.fk_cadastro = c.id
        WHERE c.email = ? AND c.senha = ?;`
    return await database.executar(
        instrucaoSql,
        [email, senha]
    )

}

// Coloque os mesmos parâmetros aqui. Vá para a var instrucaoSql
async function cadastrar(nome, email, senha) {
    console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function cadastrar():", nome, email, senha);
    // registrar cadastro
    const resultadoCadastro = await database.executar(
        'INSERT INTO cadastro (email, senha) VALUES (?, ?);', [email, senha]
    )

    // registrar usuario com fk_cadastro correto
    await database.executar(
        'INSERT INTO usuario (nome, fk_cadastro) VALUES (?, ?);', [nome, resultadoCadastro.insertId]
    )
}

module.exports = {
    autenticar,
    cadastrar
};