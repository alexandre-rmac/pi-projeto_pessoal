const COLOR_MAP = {
    W: { cls: 'color-white', hex: '#fed' },
    U: { cls: 'color-blue', hex: '#55f' },
    B: { cls: 'color-black', hex: '#313' },
    R: { cls: 'color-red', hex: '#A33' },
    G: { cls: 'color-green', hex: '#373' }
};

const COLOR_ORDER = ['W', 'U', 'B', 'R', 'G'];
const COLOR_ICONS = {
    W: { icon: 'fa-sun', cls: 'mana-white' },
    U: { icon: 'fa-droplet', cls: 'mana-blue' },
    B: { icon: 'fa-skull', cls: 'mana-black' },
    R: { icon: 'fa-fire', cls: 'mana-red' },
    G: { icon: 'fa-tree', cls: 'mana-green' }
};

function getColorInfo(colors) {
    if (!colors || colors.length === 0) return { colorClass: 'color-devoid', inlineStyle: '' };
    if (colors.length === 1) {
        const info = COLOR_MAP[colors[0]];
        return { colorClass: info ? info.cls : 'color-devoid', inlineStyle: '' };
    }
    if (colors.length === 2) {
        const c1 = COLOR_MAP[colors[0]];
        const c2 = COLOR_MAP[colors[1]];
        if (c1 && c2) {
            return {
                colorClass: '',
                inlineStyle: `background: linear-gradient(95deg, ${c1.hex} 30%, ${c2.hex} 70%);`
            };
        }
    }
    return { colorClass: 'color-multi', inlineStyle: '' };
}

function renderManaCost(manaCost) {
    if (!manaCost) return '';
    const symbols = manaCost.match(/\{[^}]+\}/g) || [];
    const parts = [];

    symbols.forEach(sym => {
        const inner = sym.replace(/[{}]/g, '');
        if (/^\d+$/.test(inner) || inner === 'X') {
            parts.push(`<span class="mana-symbol mana-generic">${inner}</span>`);
        } else if (inner.includes('/')) {
            const [first, second] = inner.split('/');
            if (second === 'P') {
                parts.push(`<i class="fa-solid fa-circle-minus mana-symbol mana-phyrexian"></i>`);
            } else {
                parts.push(`<span class="mana-symbol mana-hybrid">H</span>`);
            }
        } else {
            const iconMap = {
                W: { icon: 'fa-sun', cls: 'mana-white' },
                U: { icon: 'fa-droplet', cls: 'mana-blue' },
                B: { icon: 'fa-skull', cls: 'mana-black' },
                R: { icon: 'fa-fire', cls: 'mana-red' },
                G: { icon: 'fa-tree', cls: 'mana-green' },
                C: { icon: 'fa-diamond', cls: 'mana-generic' }
            };
            const info = iconMap[inner];
            if (info) {
                parts.push(`<i class="fa-solid ${info.icon} mana-symbol ${info.cls}"></i>`);
            } else {
                parts.push(`<span class="mana-symbol mana-generic">${inner}</span>`);
            }
        }
    });
    return parts.join('');
}

function renderCardText(text, keywords) {
    if (!text) return '';
    let html = text.replace(/\{[^}]+\}/g, (match) => {
        const inner = match.replace(/[{}]/g, '');
        if (/^\d+$/.test(inner) || inner === 'X') {
            return `<span class="mana-symbol mana-generic mana-inline">${inner}</span>`;
        }
        if (inner.includes('/') && !inner.includes('P')) {
            return `<span class="mana-symbol mana-hybrid mana-inline" title="${inner}">H</span>`;
        }
        const iconMap = {
            W: { icon: 'fa-sun', cls: 'mana-white' },
            U: { icon: 'fa-droplet', cls: 'mana-blue' },
            B: { icon: 'fa-skull', cls: 'mana-black' },
            R: { icon: 'fa-fire', cls: 'mana-red' },
            G: { icon: 'fa-tree', cls: 'mana-green' },
            T: { icon: 'fa-diamond-turn-right', cls: 'mana-tap' },
            C: { icon: 'fa-diamond', cls: 'mana-colorless' },
            P: { icon: 'fa-circle-minus', cls: 'mana-phyrexian' }
        };
        const info = iconMap[inner];
        if (info) {
            return `<i class="fa-solid ${info.icon} mana-symbol ${info.cls} mana-inline"></i>`;
        }
        return `<span class="mana-symbol mana-generic mana-inline">${inner}</span>`;
    });

    if (keywords && keywords.length > 0) {
        keywords.forEach(keyword => {
            const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`\\b(${escaped})\\b`, 'gi');
            html = html.replace(regex, '<span class="keyword-highlight">$1</span>');
        });
    }
    return html;
}

function renderColorPie(colors) {
    const activeColors = colors || [];
    const size = 120;
    const radius = size * 0.36;
    const center = size / 2;
    const symbolSize = size * 0.22;

    const symbols = COLOR_ORDER.map((color, i) => {
        const angle = (-90 + i * 72) * (Math.PI / 180);
        const x = center + radius * Math.cos(angle);
        const y = center + radius * Math.sin(angle);
        const info = COLOR_ICONS[color];
        const isActive = activeColors.includes(color);
        const activeClass = isActive ? info.cls : 'mana-inactive';
        
        return `<i class="fa-solid ${info.icon} color-pie-symbol ${activeClass}" style="left: ${x}px; top: ${y}px; width: ${symbolSize}px; height: ${symbolSize}px; font-size: ${symbolSize * 0.75}px;"></i>`;
    }).join('');
    
    return `
        <div class="card-image-area">
            <div class="color-pie" style="width: ${size}px; height: ${size}px;">
                ${symbols}
            </div>
        </div>
    `;
}

// FUNÇÃO PRINCIPAL DE RENDERIZAÇÃO (Agora aceita string ou elemento DOM)
function renderizarCarta(card, idContainerOuElemento) {
    const container = typeof idContainerOuElemento === 'string' 
        ? document.getElementById(idContainerOuElemento) 
        : idContainerOuElemento;
        
    if (!container) {
        console.error(`Container não encontrado para a carta ${card.name}`);
        return;
    }

    const { colorClass, inlineStyle } = getColorInfo(card.colors || card.colorsId);
    const manaHtml = renderManaCost(card.manaCost);
    const textHtml = renderCardText(card.text || '', card.keywords);
    const ptHtml = (card.power && card.toughness) ? `<div class="card-pt">${card.power}/${card.toughness}</div>` : '';
    

    const colorPieHtml = renderColorPie(card.colorsId || []);

    let finalHtml = textHtml.replaceAll('\n', '<br>').replace(/<br>\s*<span class="keyword-highlight">/g, '<br><span class="keyword-highlight">');

    container.innerHTML = `
        <div class="mtg-card ${colorClass}" style="${inlineStyle}">
            <div class="card-header">
                <div class="card-name">${card.name}</div>
                <div class="card-mana">${manaHtml}</div>
            </div>
            ${colorPieHtml}
            <div class="card-type">${card.type}</div>
            <div class="card-text-box">
                <div>${finalHtml}</div>
                ${ptHtml}
            </div>
        </div>
    `;
}