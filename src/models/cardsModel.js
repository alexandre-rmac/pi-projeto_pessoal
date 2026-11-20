var database = require("../database/config");

// 1. Comandantes
function buscarComandantes(nome) {
    var sql = `
        SELECT c.id, c.nome AS name, c.codigo AS uuid, c.cmc, c.cores AS colorsStr, c.identidade,
               c.custo_mana AS manaCost, c.texto AS text, c.poder AS power, c.resistencia AS toughness,
               GROUP_CONCAT(t.descricao SEPARATOR ', ') AS type
        FROM carta c
        INNER JOIN tipo_carta tc1 ON c.id = tc1.fk_carta
        INNER JOIN tipo t1 ON tc1.fk_tipo = t1.id
        INNER JOIN tipo_carta tc2 ON c.id = tc2.fk_carta
        INNER JOIN tipo t2 ON tc2.fk_tipo = t2.id
        LEFT JOIN tipo_carta tc ON c.id = tc.fk_carta
        LEFT JOIN tipo t ON tc.fk_tipo = t.id
        WHERE t1.descricao = 'Creature' AND t2.descricao = 'Legendary' AND c.nome LIKE ?
        GROUP BY c.id
        ORDER BY c.nome ASC
        LIMIT 20
    `;
    return database.executar(sql, ["%" + nome + "%"]);
}

// 2. Lista em Lote (CSV)
function buscarPorNomes(nomes) {
    if (!nomes || nomes.length === 0) return Promise.resolve([]);
    var placeholders = nomes.map(() => '?').join(', ');
    var sql = `
        SELECT c.id, c.nome AS name, c.codigo AS uuid, c.cmc, c.cores AS colorsStr, c.identidade,
               c.custo_mana AS manaCost, c.texto AS text, c.poder AS power, c.resistencia AS toughness,
               GROUP_CONCAT(t.descricao SEPARATOR ', ') AS type
        FROM carta c
        LEFT JOIN tipo_carta tc ON c.id = tc.fk_carta
        LEFT JOIN tipo t ON tc.fk_tipo = t.id
        WHERE c.nome IN (${placeholders})
        GROUP BY c.id
    `;
    return database.executar(sql, nomes);
}

// 3. Busca por Nome (com filtro de identidade)
function buscarPorNome(nome, identidadeDeck, limite, offset) {
    var sql = `
        SELECT c.id, c.nome AS name, c.codigo AS uuid, c.cmc, c.cores AS colorsStr, c.identidade,
               c.custo_mana AS manaCost, c.texto AS text, c.poder AS power, c.resistencia AS toughness,
               GROUP_CONCAT(t.descricao SEPARATOR ', ') AS type
        FROM carta c
        LEFT JOIN tipo_carta tc ON c.id = tc.fk_carta
        LEFT JOIN tipo t ON tc.fk_tipo = t.id
        WHERE c.nome LIKE ? 
    `;
    var params = ["%" + nome + "%"];

    if (identidadeDeck && identidadeDeck !== 'C') {
        var placeholders = identidadeDeck.split('').map(() => 'c.identidade LIKE ?').join(' OR ');
        sql += ` AND (c.identidade = 'C' OR ${placeholders}) `;
        identidadeDeck.split('').forEach(cor => params.push(`%${cor}%`));
    }

    sql += ` GROUP BY c.id ORDER BY c.nome ASC LIMIT ? OFFSET ?`;
    params.push(limite, offset);

    return database.executar(sql, params);
}

// 4. Busca Avançada (agora com LIKE no texto, direto no SQL)
function buscarAvancada(filtros, limite, offset) {
    var sql = `
        SELECT c.id, c.nome AS name, c.codigo AS uuid, c.cmc, c.cores AS colorsStr, c.identidade,
               c.custo_mana AS manaCost, c.texto AS text, c.poder AS power, c.resistencia AS toughness,
               GROUP_CONCAT(t.descricao SEPARATOR ', ') AS type
        FROM carta c
        LEFT JOIN tipo_carta tc ON c.id = tc.fk_carta
        LEFT JOIN tipo t ON tc.fk_tipo = t.id
    `;
    var where = [];
    var params = [];

    if (filtros.tipo) {
        where.push("t.descricao = ?");
        params.push(filtros.tipo);
    }
    if (filtros.nome) { where.push("c.nome LIKE ?"); params.push("%" + filtros.nome + "%"); }
    if (filtros.cmc !== undefined) { where.push("c.cmc = ?"); params.push(filtros.cmc); }
    if (filtros.cores) { filtros.cores.split(',').forEach(cor => { where.push("c.cores LIKE ?"); params.push("%" + cor + "%"); }); }
    if (filtros.identidade) { filtros.identidade.split(',').forEach(cor => { where.push("c.identidade LIKE ?"); params.push("%" + cor + "%"); }); }
    if (filtros.texto) { where.push("c.texto LIKE ?"); params.push("%" + filtros.texto + "%"); }

    if (where.length > 0) sql += " WHERE " + where.join(" AND ");
    sql += " GROUP BY c.id ORDER BY c.nome ASC LIMIT ? OFFSET ?";
    params.push(limite, offset);

    return database.executar(sql, params);
}

module.exports = { buscarComandantes, buscarPorNomes, buscarPorNome, buscarAvancada };