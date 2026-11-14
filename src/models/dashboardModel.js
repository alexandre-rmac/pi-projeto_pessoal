var database = require("../database/config");
var cardsModel = require("./cardsModel");

// Função auxiliar para calcular geração de mana no texto
function calcularGeracaoMana(text, identidadeDeck) {
    var gera = { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 };
    if (!text) return gera;

    var addMatches = text.match(/Add\s+((?:\{[^}]+\}\s*)+)/gi) || [];
    addMatches.forEach(bloco => {
        var syms = bloco.match(/\{[^}]+\}/g) || [];
        syms.forEach(sym => {
            var c = sym.replace(/[{}]/g, '').toUpperCase();
            if (gera[c] !== undefined) gera[c]++;
        });
    });

    // "Add one mana of any color" conta apenas as cores da identidade
    if (/Add\s+one\s+mana\s+of\s+any\s+color/i.test(text)) {
        var cores = identidadeDeck === "C" ? "WUBRG" : identidadeDeck; 
        for (var i = 0; i < cores.length; i++) {
            if (gera[cores[i]] !== undefined) gera[cores[i]]++;
        }
    }
    return gera;
}

function perfil(fkUsuario) {
    var sqlDecks = "SELECT id, nome, identidade FROM deck WHERE fk_usuario = ?";
    var sqlMainboard = `
        SELECT dc.fk_deck, COALESCE(SUM(dc.quantidade), 0) AS total
        FROM deck_carta dc
        INNER JOIN board b ON b.id = dc.fk_board
        WHERE b.descricao = 'Mainboard' AND dc.fk_deck IN (SELECT id FROM deck WHERE fk_usuario = ?)
        GROUP BY dc.fk_deck
    `;

    return Promise.all([
        database.executar(sqlDecks, [fkUsuario]),
        database.executar(sqlMainboard, [fkUsuario])
    ]).then(function (rs) {
        var decks = rs[0];
        var totalPorDeck = {};
        rs[1].forEach(r => totalPorDeck[r.fk_deck] = Number(r.total));

        var coresFreq = { W: 0, U: 0, B: 0, R: 0, G: 0 };
        var decksStatus = decks.map(d => {
            var identidadeDeck = d.identidade || "C";
            if (identidadeDeck !== "C") {
                for (var i = 0; i < identidadeDeck.length; i++) {
                    if (coresFreq[identidadeDeck[i]] !== undefined) coresFreq[identidadeDeck[i]]++;
                }
            }
            var total = totalPorDeck[d.id] || 0;
            var status = total < 100 ? "incompleto" : (total === 100 ? "completo" : "invalido");
            return { id: d.id, nome: d.nome, identidade: identidadeDeck, status: status, totalMainboard: total };
        });

        var utilizadas = Object.keys(coresFreq).filter(c => coresFreq[c] > 0);
        var maxFreq = 0;
        utilizadas.forEach(c => { if (coresFreq[c] > maxFreq) maxFreq = coresFreq[c]; });
        var maisUtilizadas = utilizadas.filter(c => coresFreq[c] === maxFreq);

        return {
            totalDecks: decks.length,
            coresFreq: coresFreq,
            totalCoresUtilizadas: utilizadas.length,
            coresMaisUtilizadas: maisUtilizadas,
            decks: decksStatus
        };
    });
}

function deck(idDeck, fkUsuario) {
    var sqlDeck = "SELECT id, nome, commander, identidade, dt_criacao FROM deck WHERE id = ? AND fk_usuario = ?";
    var sqlCartas = `
        SELECT c.codigo AS uuid, c.cmc, c.tipo, dc.quantidade
        FROM deck_carta dc
        INNER JOIN carta c ON c.id = dc.fk_carta
        INNER JOIN board b ON b.id = dc.fk_board
        WHERE dc.fk_deck = ? AND b.descricao = 'Mainboard'
    `;

    return database.executar(sqlDeck, [idDeck, fkUsuario]).then(decks => {
        if (!decks || decks.length === 0) return null;
        var deckInfo = decks[0];
        var identidadeDeck = deckInfo.identidade || "C";

        return database.executar(sqlCartas, [idDeck]).then(cartasDb => {
            var uuids = [...new Set(cartasDb.map(c => c.uuid))]; // Únicos
            
            return cardsModel.detalhesPorUuids(uuids).then(cartasJson => {
                var jsonMap = new Map();
                cartasJson.forEach(c => jsonMap.set(c.uuid, c));

                var totalCartas = 0, cmcPonderado = 0, totalTerrenos = 0;
                var cmcMap = {}, tiposMap = {}, manaGenTotal = { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 };

                cartasDb.forEach(db => {
                    var qtd = Number(db.quantidade);
                    var json = jsonMap.get(db.uuid);
                    
                    totalCartas += qtd;
                    cmcPonderado += Number(db.cmc) * qtd;
                    cmcMap[db.cmc] = (cmcMap[db.cmc] || 0) + qtd;

                    if (json) {
                        // 1. Contagem de Tipos (Types, Subtypes, Supertypes)
                        var todosTipos = [].concat(json.types || [], json.subtypes || [], json.supertypes || []);
                        todosTipos.forEach(t => { tiposMap[t] = (tiposMap[t] || 0) + qtd; });

                        // 2. Total de Terrenos
                        if ((json.types || []).includes("Land")) totalTerrenos += qtd;

                        // 3. Geração de Mana
                        var geracao = calcularGeracaoMana(json.text, identidadeDeck);
                        Object.keys(geracao).forEach(cor => {
                            manaGenTotal[cor] += geracao[cor] * qtd;
                        });
                    }
                });

                var cmcMedio = totalCartas > 0 ? cmcPonderado / totalCartas : 0;
                var cmcDist = Object.keys(cmcMap).map(k => ({ cmc: Number(k), quantidade: cmcMap[k] })).sort((a,b) => a.cmc - b.cmc);
                var tiposDist = Object.keys(tiposMap).map(t => ({ tipo: t, quantidade: tiposMap[t] })).sort((a,b) => b.quantidade - a.quantidade);
                
                var status = totalCartas < 100 ? "incompleto" : (totalCartas === 100 ? "completo" : "invalido");

                return {
                    deck: deckInfo,
                    status: status,
                    totalCartas: totalCartas,
                    totalTerrenos: totalTerrenos,
                    cmcMedio: Number(cmcMedio.toFixed(2)),
                    cmcDistribuicao: cmcDist,
                    tiposDistribuicao: tiposDist,
                    geracaoMana: manaGenTotal
                };
            });
        });
    });
}

module.exports = { perfil, deck };