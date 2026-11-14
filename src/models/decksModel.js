var database = require("../database/config");

function buscarDecksPorUsuario(fkUsuario) {
    var sql = "SELECT id, nome, commander, identidade, dt_criacao FROM deck WHERE fk_usuario = ?";
    return database.executar(sql, [fkUsuario]);
}

function buscarPorId(id) {
    var sql = "SELECT id, nome, commander, identidade, dt_criacao, fk_usuario FROM deck WHERE id = ?";
    return database.executar(sql, [id]);
}

function cadastrarDecks(nome, commander, identidade, fkUsuario) {
    var sql = "INSERT INTO deck (nome, commander, identidade, fk_usuario) VALUES (?, ?, ?, ?)";
    return database.executar(sql, [nome, commander, identidade, fkUsuario]);
}

// Cartas do deck (para edição)
function listarCartasDoDeck(idDeck) {
    var sql = `
        SELECT dc.fk_carta AS idCarta, c.nome, c.codigo, c.cmc, c.tipo, c.cores, c.identidade,
               dc.quantidade, b.descricao AS board
        FROM deck_carta dc
        INNER JOIN carta c ON c.id = dc.fk_carta
        INNER JOIN board b ON b.id = dc.fk_board
        WHERE dc.fk_deck = ?
    `;
    return database.executar(sql, [idDeck]);
}

function atualizarDeck(id, nome, commander, identidade, fkUsuario) {
    var sql = "UPDATE deck SET nome = ?, commander = ?, identidade = ? WHERE id = ? AND fk_usuario = ?";
    return database.executar(sql, [nome, commander, identidade, id, fkUsuario]);
}

function deletarDeck(id, fkUsuario) {
    var sql = "DELETE FROM deck WHERE id = ? AND fk_usuario = ?";
    return database.executar(sql, [id, fkUsuario]);
}

function adicionarCarta(idDeck, idCarta, idBoard, quantidade, fkUsuario) {
    // 1. Verifica se o deck pertence ao usuário antes de inserir
    var sqlCheck = "SELECT id FROM deck WHERE id = ? AND fk_usuario = ?";
    
    return database.executar(sqlCheck, [idDeck, fkUsuario]).then(function(resultado) {
        if (resultado.length === 0) {
            return Promise.reject(new Error("Acesso negado: deck não encontrado ou não pertence ao usuário."));
        }
        
        // 2. Se pertence, faz o UPSERT da carta
        var sql = `
            INSERT INTO deck_carta (fk_deck, fk_carta, fk_board, quantidade)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE quantidade = quantidade + VALUES(quantidade)
        `;
        return database.executar(sql, [idDeck, idCarta, idBoard, quantidade]);
    });
}

function removerCarta(idDeck, idCarta, idBoard, fkUsuario) {
    var sql = `
        DELETE dc FROM deck_carta dc
        INNER JOIN deck d ON d.id = dc.fk_deck
        WHERE dc.fk_deck = ? AND dc.fk_carta = ? AND dc.fk_board = ? AND d.fk_usuario = ?
    `;
    return database.executar(sql, [idDeck, idCarta, idBoard, fkUsuario]);
}

module.exports = {
    buscarDecksPorUsuario, buscarPorId, cadastrarDecks,
    atualizarDeck, deletarDeck, listarCartasDoDeck,
    adicionarCarta, removerCarta
};