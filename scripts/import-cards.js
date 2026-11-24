var ambiente_processo = 'desenvolvimento';
var caminho_env = ambiente_processo === 'producao' ? '.env' : '.env.dev';
require('dotenv').config({ path: caminho_env });

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const mysql = require('mysql2/promise');

const INDEX_FILE = path.join(__dirname, '..', 'data', 'cards-index.json');
const BATCH_SIZE = 100;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

const RETRIABLE_ERRORS = new Set([
    'ER_LOCK_DEADLOCK', 'ER_LOCK_WAIT_TIMEOUT',
    'PROTOCOL_CONNECTION_LOST', 'ER_CON_COUNT_ERROR'
]);

const asArray = v => (Array.isArray(v) ? v : []);
const normalizeTypes = arr => arr.map(t => String(t).trim()).filter(Boolean);
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function withRetry(label, fn) {
    let lastErr;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try { return await fn(); }
        catch (err) {
            lastErr = err;
            if (!RETRIABLE_ERRORS.has(err.code) || attempt === MAX_RETRIES) throw err;
            console.warn(`\n[${label}] tentativa ${attempt}/${MAX_RETRIES} falhou (${err.code}). Retentando...`);
            await sleep(RETRY_DELAY_MS * attempt);
        }
    }
    throw lastErr;
}

function clearLine() {
    if (process.stdout.isTTY) {
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0);
    }
}

function validateCarta(c, idx) {
    const p = [];
    if (!c || typeof c !== 'object') p.push('carta não é objeto');
    else {
        if (!c.uuid) p.push('uuid ausente');
        if (!c.name) p.push('nome ausente');
        ['types', 'subtypes', 'supertypes', 'colors', 'colorId', 'faces'].forEach(k => {
            if (c[k] != null && !Array.isArray(c[k])) p.push(`${k} não é array`);
        });
    }
    if (p.length) throw new Error(`Carta inválida no índice ${idx}: ${p.join(', ')}`);
}

if (!fs.existsSync(INDEX_FILE)) {
    console.error('cards-index.json não encontrado. Rode `npm run build-index` antes de continuar.');
    process.exit(1);
}

(async () => {
    console.log('Lendo cards-index.json...');
    const cartas = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));

    if (!Array.isArray(cartas) || cartas.length === 0) {
        console.log('Nada a importar. Encerrando.');
        return;
    }

    cartas.forEach(validateCarta);

    let conn;
    try {
        conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_DATABASE,
            port: Number(process.env.DB_PORT),
            charset: 'utf8mb4'
        });

        // ===== TIPOS =====
        console.log('Coletando tipos únicos...');
        const tiposSet = new Set();
        cartas.forEach(c => {
            normalizeTypes([
                ...asArray(c.types),
                ...asArray(c.subtypes),
                ...asArray(c.supertypes)
            ]).forEach(t => tiposSet.add(t));
        });
        const tiposArray = Array.from(tiposSet);

        let tiposInseridos = 0;
        if (tiposArray.length > 0) {
            const ph = tiposArray.map(() => '?').join(', ');
            const [existentes] = await conn.query(
                `SELECT descricao FROM tipo WHERE descricao IN (${ph})`,
                tiposArray
            );
            const existentesSet = new Set(existentes.map(r => r.descricao));
            const novos = tiposArray.filter(t => !existentesSet.has(t));

            if (novos.length > 0) {
                const phIns = novos.map(() => '(?)').join(', ');
                const [res] = await conn.query(
                    `INSERT INTO tipo (descricao) VALUES ${phIns}`,
                    novos
                );
                tiposInseridos = res.affectedRows;
            }
            console.log(`Tipos: ${tiposInseridos} novos, ${tiposArray.length - tiposInseridos} já existentes.`);
        }

        const [tiposDb] = await conn.query('SELECT id, descricao FROM tipo');
        const tipoMap = new Map(tiposDb.map(t => [t.descricao, t.id]));

        // ===== CARTAS =====
        console.log('Importando cartas em lotes...');
        let totalInseridas = 0, totalAtualizadas = 0;
        let assocInseridas = 0, assocExistentes = 0;
        let facesInseridas = 0, facesAtualizadas = 0;
        const tiposFaltantes = new Set();

        for (let i = 0; i < cartas.length; i += BATCH_SIZE) {
            const batch = cartas.slice(i, i + BATCH_SIZE);

            const r = await withRetry(`lote ${i}`, async () => {
                await conn.beginTransaction();
                try {
                    const codigos = batch.map(c => c.uuid);
                    const phCodigos = codigos.map(() => '?').join(', ');

                    // 1. pré-seleção para contagem
                    const [pre] = await conn.query(
                        `SELECT codigo FROM carta WHERE codigo IN (${phCodigos})`,
                        codigos
                    );
                    const preSet = new Set(pre.map(r => r.codigo));

                    // 2. UPSERT de cartas (AS new: MySQL >= 8.0.19)
                    const phCarta = batch.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
                    const valuesCarta = [];
                    batch.forEach(c => {
                        const cor = asArray(c.colors).length ? c.colors.join('') : 'C';
                        const ident = asArray(c.colorId).length ? c.colorId.join('') : 'C';
                        valuesCarta.push(
                            c.name, c.uuid, c.layout || 'normal', c.manaValue || 0,
                            cor, ident, c.edhRank || 0, c.manaCost || '',
                            c.text || '', c.power || '', c.toughness || ''
                        );
                    });

                    await conn.query(
                        `INSERT INTO carta (nome, codigo, layout, cmc, cores, identidade, edhRank, custo_mana, texto, poder, resistencia)
                         VALUES ${phCarta} AS new
                         ON DUPLICATE KEY UPDATE
                           nome = new.nome,
                           layout = new.layout,
                           cmc = new.cmc,
                           cores = new.cores,
                           identidade = new.identidade,
                           edhRank = new.edhRank,
                           custo_mana = new.custo_mana,
                           texto = new.texto,
                           poder = new.poder,
                           resistencia = new.resistencia`,
                        valuesCarta
                    );

                    // 3. IDs das cartas do lote
                    const [cartasDb] = await conn.query(
                        `SELECT id, codigo FROM carta WHERE codigo IN (${phCodigos})`,
                        codigos
                    );
                    const cartaMap = new Map(cartasDb.map(r => [r.codigo, r.id]));

                    // 4. tipos + faces
                    const associacoesSet = new Set();
                    const facesInsert = [];
                    let loteFacesAtualizadas = 0;

                    for (const c of batch) {
                        const cartaId = cartaMap.get(c.uuid);
                        if (!cartaId) continue;

                        // 4a. tipos da união de todas as faces
                        const tiposDaCarta = new Set();
                        (c.faces || []).forEach(f => {
                            normalizeTypes([/* tipos por face não estão no índice */]).forEach(() => {});
                        });
                        // fallback: usa os tipos agregados da face 0
                        normalizeTypes([
                            ...asArray(c.types),
                            ...asArray(c.subtypes),
                            ...asArray(c.supertypes)
                        ]).forEach(t => tiposDaCarta.add(t));

                        tiposDaCarta.forEach(t => {
                            const tipoId = tipoMap.get(t);
                            if (tipoId) associacoesSet.add(`${cartaId}|${tipoId}`);
                            else tiposFaltantes.add(t);
                        });

                        // 4b. faces (só se houver mais de uma)
                        if (Array.isArray(c.faces) && c.faces.length > 1) {
                            c.faces.forEach(f => {
                                facesInsert.push([
                                    cartaId, f.ordem, f.side, f.nome,
                                    f.custo_mana, f.tipo_linha, f.texto,
                                    f.poder, f.resistencia
                                ]);
                            });
                        }
                    }

                    // 5. UPSERT de faces (por chave (fk_carta, ordem))
                    if (facesInsert.length > 0) {
                        const phFace = facesInsert.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
                        const [resFace] = await conn.query(
                            `INSERT INTO carta_face
                               (fk_carta, ordem, side, nome, custo_mana, tipo_linha, texto, poder, resistencia)
                             VALUES ${phFace} AS new
                             ON DUPLICATE KEY UPDATE
                               side = new.side,
                               nome = new.nome,
                               custo_mana = new.custo_mana,
                               tipo_linha = new.tipo_linha,
                               texto = new.texto,
                               poder = new.poder,
                               resistencia = new.resistencia`,
                            facesInsert.flat()
                        );
                        // affectedRows: 1 = insert, 2 = update (MySQL)
                        const linhasFace = resFace.affectedRows;
                        const inseridasFace = facesInsert.length - (linhasFace - facesInsert.length);
                        // contagem aproximada; o importante é saber que houve upsert
                        loteFacesAtualizadas = Math.max(0, facesInsert.length - inseridasFace);
                    }

                    // 6. associações tipo_carta (apenas as novas)
                    let loteAssocInseridas = 0, loteAssocExistentes = 0;
                    const associacoes = Array.from(associacoesSet).map(k => k.split('|').map(Number));
                    if (associacoes.length > 0) {
                        const phPairs = associacoes.map(() => '(?, ?)').join(', ');
                        const flatPairs = associacoes.flat();

                        const [preAssoc] = await conn.query(
                            `SELECT fk_carta, fk_tipo FROM tipo_carta
                             WHERE (fk_carta, fk_tipo) IN (${phPairs})`,
                            flatPairs
                        );
                        const preAssocSet = new Set(preAssoc.map(r => `${r.fk_carta}|${r.fk_tipo}`));
                        const novasAssoc = associacoes.filter(([a, b]) => !preAssocSet.has(`${a}|${b}`));
                        loteAssocExistentes = associacoes.length - novasAssoc.length;
                        loteAssocInseridas = novasAssoc.length;

                        if (novasAssoc.length > 0) {
                            const phIns = novasAssoc.map(() => '(?, ?)').join(', ');
                            await conn.query(
                                `INSERT INTO tipo_carta (fk_carta, fk_tipo) VALUES ${phIns}`,
                                novasAssoc.flat()
                            );
                        }
                    }

                    // 7. contagem de cartas
                    let loteInseridas = 0, loteAtualizadas = 0;
                    batch.forEach(c => preSet.has(c.uuid) ? loteAtualizadas++ : loteInseridas++);

                    await conn.commit();
                    return {
                        inseridas: loteInseridas,
                        atualizadas: loteAtualizadas,
                        assocInseridas: loteAssocInseridas,
                        assocExistentes: loteAssocExistentes,
                        facesAtualizadas: loteFacesAtualizadas,
                        facesTotal: facesInsert.length
                    };
                } catch (err) {
                    try { await conn.rollback(); } catch (_) {}
                    console.error(`\nErro no lote ${i}. Rollback efetuado.`);
                    throw err;
                }
            });

            totalInseridas += r.inseridas;
            totalAtualizadas += r.atualizadas;
            assocInseridas += r.assocInseridas;
            assocExistentes += r.assocExistentes;
            facesAtualizadas += r.facesAtualizadas;
            facesInseridas += r.facesTotal - r.facesAtualizadas;

            clearLine();
            process.stdout.write(`\rProcessadas ${Math.min(i + BATCH_SIZE, cartas.length)}/${cartas.length}`);
        }

        clearLine();
        console.log('Importação concluída.');
        console.log(`Cartas: ${totalInseridas} novas, ${totalAtualizadas} atualizadas.`);
        console.log(`Faces: ${facesInseridas} novas, ${facesAtualizadas} atualizadas.`);
        console.log(`Associações tipo_carta: ${assocInseridas} novas, ${assocExistentes} já existentes.`);
        if (tiposFaltantes.size > 0) {
            console.warn(`⚠ Tipos não encontrados no banco (${tiposFaltantes.size}): ${[...tiposFaltantes].join(', ')}`);
        }
    } catch (err) {
        console.error('\nErro fatal na importação:');
        console.error(err);
        process.exitCode = 1;
    } finally {
        if (conn) try { await conn.end(); } catch (_) {}
    }
})();