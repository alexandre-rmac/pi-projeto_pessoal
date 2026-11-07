var database = require("../database/config");

function buscarDecksPorId(id) {
  let instrucaoSql = `
    SELECT id, nome, fk_usuario
    FROM deck
    WHERE id = ?;`
  return database.executar(instrucaoSql,[id]);
}

function buscarDecksPorUsuario(fkUsuario) {
  let instrucaoSql = `
    SELECT id, nome, fk_usuario
    FROM deck
    WHERE fk_usuario = ?;`
  return database.executar(instrucaoSql,[fkUsuario])
}

function buscarDecksPorNome(nome, fkUsuario) {
  var instrucaoSql = `
    SELECT * FROM deck WHERE nome = ? AND fk_usuario = ?;`;
  
  return database.executar(instrucaoSql, [nome, fkUsuario]);
}

function listarDecks(fkUsuario) {
  var instrucaoSql = `
    SELECT * FROM deck WHERE fk_usuario = ?;`;

  return database.executar(instrucaoSql, fkUsuario);
}

function cadastrarDecks(nome, commander, cores, fkUsuario) {
  var instrucaoSql = `
    INSERT INTO deck (nome, commander, cores, fk_usuario) VALUES (?, ?, ?, ?);`;

  return database.executar(instrucaoSql, [nome, commander, cores, fkUsuario]);
}

module.exports = { buscarDecksPorId, buscarDecksPorUsuario, buscarDecksPorNome, listarDecks, cadastrarDecks };
