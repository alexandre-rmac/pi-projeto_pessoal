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
    var sqlCheck = "SELECT id FROM deck WHERE id = ? AND fk_usuario = ?";

    return database.executar(sqlCheck, [idDeck, fkUsuario]).then(function (resultado) {
        if (resultado.length === 0) {
            return Promise.reject(new Error("Acesso negado: deck não encontrado."));
        }

        var sql = `
            INSERT INTO deck_carta (fk_deck, fk_carta, fk_board, quantidade)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE quantidade = quantidade + VALUES(quantidade)
        `;
        return database.executar(sql, [idDeck, idCarta, idBoard, quantidade]);
    });
}

function removerCarta(idDeck, idCarta, idBoard, fkUsuario, quantidade) {
    var qtdRemover = parseInt(quantidade) || 1;
    var sqlCheck = `
        SELECT dc.quantidade FROM deck_carta dc 
        INNER JOIN deck d ON d.id = dc.fk_deck 
        WHERE dc.fk_deck = ? AND dc.fk_carta = ? AND dc.fk_board = ? AND d.fk_usuario = ?
    `;

    return database.executar(sqlCheck, [idDeck, idCarta, idBoard, fkUsuario]).then(res => {
        if (res.length === 0) return Promise.reject(new Error("Carta não encontrada."));

        const qtdAtual = res[0].quantidade;

        if (qtdAtual > qtdRemover) {
            var sqlUpdate = "UPDATE deck_carta SET quantidade = quantidade - ? WHERE fk_deck = ? AND fk_carta = ? AND fk_board = ?";
            return database.executar(sqlUpdate, [qtdRemover, idDeck, idCarta, idBoard]);
        } else {
            var sqlDelete = "DELETE FROM deck_carta WHERE fk_deck = ? AND fk_carta = ? AND fk_board = ?";
            return database.executar(sqlDelete, [idDeck, idCarta, idBoard]);
        }
    });
}

function buscarDeckCompleto(idDeck, fkUsuario) {
    var sqlDeck = "SELECT id, nome, commander, identidade FROM deck WHERE id = ? AND fk_usuario = ?";
    var sqlCartas = `
        SELECT dc.fk_carta AS idCarta, 
               c.nome AS name, c.codigo AS uuid, c.cmc, c.cores AS colorsStr, c.identidade,
               c.custo_mana AS manaCost, c.texto AS text, c.poder AS power, c.resistencia AS toughness,
               (SELECT GROUP_CONCAT(t.descricao SEPARATOR ' ') 
                FROM tipo_carta tc 
                INNER JOIN tipo t ON t.id = tc.fk_tipo 
                WHERE tc.fk_carta = c.id) AS type,
               dc.quantidade, b.id AS idBoard, b.descricao AS nomeBoard
        FROM deck_carta dc
        INNER JOIN carta c ON c.id = dc.fk_carta
        INNER JOIN board b ON b.id = dc.fk_board
        WHERE dc.fk_deck = ?
        `;

    
    return database.executar(sqlDeck, [idDeck, fkUsuario]).then(function (decks) {
        if (!decks || decks.length === 0) return null;

        return database.executar(sqlCartas, [idDeck]).then(function (cartas) {
            return { deck: decks[0], cartas: cartas };
        });
    });
}

function adicionarCartasLote(idDeck, cartas, idBoard, fkUsuario) {
    var sqlCheck = "SELECT id FROM deck WHERE id = ? AND fk_usuario = ?";

    return database.executar(sqlCheck, [idDeck, fkUsuario]).then(function (resultado) {
        if (resultado.length === 0) {
            return Promise.reject(new Error("Acesso negado."));
        }

        // Prepara os valores para um INSERT múltiplo
        var values = [];
        var placeholders = cartas.map(function (c) {
            values.push(idDeck, c.idCarta, idBoard, c.quantidade);
            return "(?, ?, ?, ?)";
        }).join(", ");

        var sql = `
            INSERT INTO deck_carta (fk_deck, fk_carta, fk_board, quantidade)
            VALUES ${placeholders}
            ON DUPLICATE KEY UPDATE quantidade = quantidade + VALUES(quantidade)
        `;
        return database.executar(sql, values);
    });
}

module.exports = {
    buscarDecksPorUsuario, buscarPorId, cadastrarDecks,
    atualizarDeck, deletarDeck, listarCartasDoDeck,
    adicionarCarta, removerCarta, buscarDeckCompleto, adicionarCartasLote
};