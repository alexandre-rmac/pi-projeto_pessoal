const fs = require('fs');
const path = require('path');

const INPUT_FILE = path.join(__dirname, '..', 'data', 'AtomicCards.json');
const OUTPUT_FILE = path.join(__dirname, '..', 'data', 'cards-index.json');

if (!fs.existsSync(INPUT_FILE)) {
    // console.log(INPUT_FILE)
    console.error('AtomicCards.json não encontrado. Baixe de https://mtgjson.com/downloads/all-files/#atomiccards');
    process.exit(1);
}

console.log('Lendo AtomicCards.json...');
const rawData = fs.readFileSync(INPUT_FILE, 'utf8');
const atomicCards = JSON.parse(rawData);

// O AtomicCards tem a estrutura { data: { "Card Name": [ ... ] } }
const cardsMap = atomicCards.data || atomicCards;

const index = [];
let ignoradasList = [];

for (const [key, cardList] of Object.entries(cardsMap)) {
    // Cada chave pode ter múltiplas faces (split cards), pegamos a primeira para simplificar
    const card = cardList[0];
    if (!card || !card.name) {
        ignoradasList.push(cardList[key]);
        continue
    };
    const uuid = card.identifiers.scryfallOracleId;
    if(!uuid) {
        ignoradasList.push(card)
        continue
    }

    index.push({
        name: card.name,
        uuid,
        manaCost: card.manaCost || '',
        manaValue: card.manaValue || 0,
        type: card.type || '',
        text: card.text || '',
        power: card.power || '',
        toughness: card.toughness || '',
        colors: card.colors || [],
        colorId: card.colorIdentity || [],
        keywords: card.keywords || [], 
        types: card.types || [],
        subtypes: card.subtypes || [],
        supertypes: card.supertypes || []
    });
}

console.log(`Processadas ${index.length} cartas.\nIgnoradas ${ignoradasList.length} cartas.`);
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(index), 'utf8');
console.log('Índice gerado em data/cards-index.json');
