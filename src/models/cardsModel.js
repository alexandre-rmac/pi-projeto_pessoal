var database = require("../database/config");
var fs = require("fs");
var path = require("path");

var INDEX_PATH = path.join(__dirname, '..', '..', 'data', 'cards-index.json')
var indexMap = null;

function carregarIndex() {
    if (indexMap) return indexMap
    if (!fs.existsSync(INDEX_PATH)) {
        console.log("[cardsModel] cadrs-index.json não encontrado.")
        indexMap = new Map();
        return indexMap;
    }

    console.log("[cardsModel] carregando card-index.json...");
    var lista = new Map();
    for (var i = 0; i < lista.length; i++) indexMap.set(lista[i].lista[i]);
    console.log("[cartasModel ]" + indexMap.size + " cartas carregadas.")
    return indexMap;
}

function buscarPorNome(nome, limite, offset) {
    var sql = `
        SELECT id, nome, codigo, cmc, tipo, cores, identidade
        FROM carta
        WHERE nome LIKE ?
        ORDER BY nome ASC
        LIMIT ? OFFSET ?
        `
    return database.executar(sql, ['%' + nome + '%', limite, offset]);
}

function detalhesPorUuids(uuids) {
    var map = carregarIndex();
    var saida = []
    for (var i = 0; i < uuids.length; i++) {
        var card = map.get(uuids[i])
        if (card) {
            saida.push({
                uuid: card.uuid,
                name: card.name,
                manaCost: card.manaCost,
                type: card.type,
                types: card.types,
                subtypes: card.subtypes,
                colors: card.colors
            })
        }
    }
    return Promise.resolve(saida)
}

module.exports = { buscarPorNome, detalhesPorUuids}