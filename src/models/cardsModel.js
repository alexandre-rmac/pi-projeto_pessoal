var database = require("../database/config");
var fs = require("fs");
var path = require("path");

var INDEX_PATH = path.join(__dirname, "..", "..", "data", "cards-index.json");
var indexMap = null;

function carregarIndex() {
    if (indexMap) return indexMap;
    if (!fs.existsSync(INDEX_PATH)) {
        console.warn("[cardsModel] cards-index.json não encontrado.");
        indexMap = new Map();
        return indexMap;
    }
    var lista = JSON.parse(fs.readFileSync(INDEX_PATH, "utf8"));
    indexMap = new Map();
    lista.forEach(c => indexMap.set(c.uuid, c));
    return indexMap;
}

// 1. Comandantes (Lendários + Criatura)
function buscarComandantes(nome) {
    var sql = `
        SELECT c.id, c.nome, c.codigo, c.cmc, c.tipo, c.cores, c.identidade
        FROM carta c
        INNER JOIN tipo_carta tc1 ON c.id = tc1.fk_carta
        INNER JOIN tipo t1 ON tc1.fk_tipo = t1.id
        INNER JOIN tipo_carta tc2 ON c.id = tc2.fk_carta
        INNER JOIN tipo t2 ON tc2.fk_tipo = t2.id
        WHERE t1.descricao = 'Creature' 
          AND t2.descricao = 'Legendary'
          AND c.nome LIKE ?
        ORDER BY c.nome ASC
    `;
    return database.executar(sql, ["%" + nome + "%"]);
}

// 2. Lista em Lote (CSV)
function buscarPorNomes(nomes) {
    if (!nomes || nomes.length === 0) return Promise.resolve([]);
    var placeholders = nomes.map(() => '?').join(', ');
    var sql = `SELECT id, nome, codigo, cmc, tipo, cores, identidade FROM carta WHERE nome IN (${placeholders})`;
    return database.executar(sql, nomes);
}

// 3. Busca por Nome (com limite dinâmico)
function buscarPorNome(nome, limite, offset) {
    var sql = `
        SELECT id, nome, codigo, cmc, tipo, cores, identidade
        FROM carta WHERE nome LIKE ?
        ORDER BY nome ASC LIMIT ? OFFSET ?
    `;
    return database.executar(sql, ["%" + nome + "%", limite, offset]);
}

// 4. Busca Avançada (com filtros SQL + filtro de texto via JSON em memória)
function buscarAvancada(filtros, limite, offset) {
    var sql = `
        SELECT DISTINCT c.id, c.nome, c.codigo, c.cmc, c.tipo, c.cores, c.identidade
        FROM carta c
    `;
    var joins = [];
    var where = [];
    var params = [];

    if (filtros.tipo) {
        joins.push("INNER JOIN tipo_carta tc ON c.id = tc.fk_carta");
        joins.push("INNER JOIN tipo t ON tc.fk_tipo = t.id");
        where.push("t.descricao = ?");
        params.push(filtros.tipo);
    }

    if (filtros.nome) { where.push("c.nome LIKE ?"); params.push("%" + filtros.nome + "%"); }
    if (filtros.cmc !== undefined) { where.push("c.cmc = ?"); params.push(filtros.cmc); }
    
    // Filtro de cores/identidade (verifica se as letras estão contidas na string)
    if (filtros.cores) { 
        filtros.cores.split(',').forEach(cor => {
            where.push("c.cores LIKE ?"); 
            params.push("%" + cor + "%"); 
        });
    }
    if (filtros.identidade) {
        filtros.identidade.split(',').forEach(cor => {
            where.push("c.identidade LIKE ?"); 
            params.push("%" + cor + "%"); 
        });
    }

    // Filtro de texto (JSON em memória)
    if (filtros.texto) {
        var map = carregarIndex();
        var uuidsComTexto = [];
        var regex = new RegExp(filtros.texto, "i");
        map.forEach(card => {
            if (card.text && regex.test(card.text)) uuidsComTexto.push(card.uuid);
        });
        
        if (uuidsComTexto.length === 0) return Promise.resolve([]); // Nenhum resultado
        where.push(`c.codigo IN (${uuidsComTexto.map(() => '?').join(', ')})`);
        params.push(...uuidsComTexto);
    }

    if (joins.length > 0) sql += " " + joins.join(" ");
    if (where.length > 0) sql += " WHERE " + where.join(" AND ");
    sql += " ORDER BY c.nome ASC LIMIT ? OFFSET ?";
    params.push(limite, offset);

    return database.executar(sql, params);
}

// 5. Detalhes por UUID (para dashboard)
function detalhesPorUuids(uuids) {
    var map = carregarIndex();
    var saida = [];
    uuids.forEach(uuid => {
        var card = map.get(uuid);
        if (card) {
            saida.push({
                uuid: card.uuid, name: card.name, manaCost: card.manaCost,
                text: card.text, type: card.type, types: card.types, 
                subtypes: card.subtypes, supertypes: card.supertypes
            });
        }
    });
    return Promise.resolve(saida);
}

module.exports = { buscarComandantes, buscarPorNomes, buscarPorNome, buscarAvancada, detalhesPorUuids };