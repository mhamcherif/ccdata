document.addEventListener('DOMContentLoaded', () => {
    const marketSelect = document.getElementById('marketSelect');
    const loadIndexUndlerlyingPairsButton = document.getElementById('loadIndexUndlerlyingPairsButton');

    marketSelect.addEventListener('change', () => {
        const selectedMarket = marketSelect.value;
        if (selectedMarket === 'ccix') {
            loadIndexUndlerlyingPairsButton.disabled = false;
        } else {
            loadIndexUndlerlyingPairsButton.disabled = true;
        }
        if (selectedMarket === 'ccxrp') {
            // Set default: only few supported instruments currently.
            document.getElementById('instrumentsInput').value = "XRP-USD,USDT-USD,USDC-USD,BUSD-USDT,BUSD-USD"
        } else if (selectedMarket === 'ccxrpprep') {
            // Set default: only XRP-USD supported currently.
            document.getElementById('instrumentsInput').value = "XRP-USD"
        }

    });
});

// Utility function to chunk instruments
function chunkInstruments(instruments, chunkSize = 25) {
    let chunks = [];
    for (let i = 0; i < instruments.length; i += chunkSize) {
        chunks.push(instruments.slice(i, i + chunkSize).join(','));
    }
    return chunks;
}

// Fetch data for given instruments
async function fetchData(instruments) {
    const apiKey = localStorage.getItem('apiKey') || '';
    const headers = { 'Authorization': `Apikey ${apiKey}` };
    const market = document.getElementById('marketSelect').value;
    const url = `https://data-api.cryptocompare.com/index/cc/v1/latest/instrument/metadata?market=${market}&instruments=${instruments}&apply_mapping=true&groups=SOURCE,STATUS`;
    const tableBody = document.getElementById('table-body');

    try {
        const response = await fetch(url, { headers: headers });
        const data = await response.json();
        updateTable(data.Data);
    } catch (error) {
        console.error('Error fetching data:', error);
        alert('Error fetching data. Please try again later.');
    }
}

function formatPrice(price) {
    if (price === 0) {
        return '0.0000';
    }

    let formattedPrice = price.toFixed(6); // Default to 4 decimal places

    // If the price is less than 0.0001, use scientific notation with a higher precision
    if (price < 0.000001) {
        formattedPrice = price.toExponential(6);
    }

    return formattedPrice;
}

function extractMarketAndInstrument(key) {
    const regex = /~\{([^~]+)~([^}]+)\}/;
    const match = key.match(regex);
    if (match && match.length === 3) {
        return {
            market: match[1],
            instrumentId: match[2]
        };
    }
    return null;
}

// Update table with fetched data
function updateTable(data) {
    const tableBody = document.getElementById('table-body');
    for (let [instrument, details] of Object.entries(data)) {
        details = details.LAST_INDEX_UPDATE_FROM_CALCULATED;
        const lastUpdate = getRelativeTime(details.TIMESTAMP);
        const components = sortComponentsByPriceLastUpdate(details.METADATA.COMPONENTS);
        const refPrice = details.VALUE
        const updateTriggeredBy = details.METADATA.UPDATE_TRIGGERED_BY.split('~{')[1].split('~')[0];

        // Create the main row for the instrument
        let mainRow = tableBody.insertRow();
        let cellInstrument = mainRow.insertCell();
        cellInstrument.textContent = instrument;
        cellInstrument.setAttribute('data-toggle', 'collapse');
        cellInstrument.setAttribute('data-target', `#collapse${instrument}`);
        cellInstrument.classList.add('clickable');

        let cellUpdateTriggeredBy = mainRow.insertCell();
        cellUpdateTriggeredBy.textContent = updateTriggeredBy;

        let cellRefPrice = mainRow.insertCell();
        cellRefPrice.textContent = refPrice;

        let cellLastUpdate = mainRow.insertCell();
        cellLastUpdate.innerHTML = lastUpdate;

        // Insert a new row for the collapsible content
        let collapseRow = tableBody.insertRow();
        let collapseCell = collapseRow.insertCell();
        collapseCell.colSpan = 3;
        collapseCell.classList.add('collapse');
        collapseCell.id = `collapse${instrument}`;

        let componentTable = document.createElement('table');
        componentTable.classList.add('table', 'table-dark', 'mb-0');

        components.forEach(component => {
            const marketAndInstrumentId = extractMarketAndInstrument(component.key);
            let market = marketAndInstrumentId.market
            let instrumentId = marketAndInstrumentId.instrumentId
            let price = formatPrice(component.price);
            let priceLastUpdate = getRelativeTime(component.priceLastUpdateTS);

            let componentRow = componentTable.insertRow();
            let cellInstrumentId = componentRow.insertCell();
            let cellMarket = componentRow.insertCell();
            let cellPrice = componentRow.insertCell();
            let cellPriceLastUpdate = componentRow.insertCell();

            cellInstrumentId.textContent = instrumentId;
            cellMarket.textContent = market;
            cellPrice.textContent = price;
            cellPrice.classList.add('price-column');
            cellPriceLastUpdate.innerHTML = priceLastUpdate;

        });

        collapseCell.appendChild(componentTable);
    }
}

// Sort components by their last price update timestamp
function sortComponentsByPriceLastUpdate(components) {
    let componentArray = Object.entries(components).map(([key, value]) => ({
        key: key,
        market: value.MARKET,
        price: value.PRICE,
        priceLastUpdateTS: value.PRICE_LAST_UPDATE_TS
    }));

    componentArray.sort((a, b) => b.priceLastUpdateTS - a.priceLastUpdateTS);

    return componentArray;
}

// Fetch the top 25 instruments
async function fetchTop25Instruments() {
    const market = document.getElementById('marketSelect').value;
    const apiUrl = `https://data-api.cryptocompare.com/index/cc/v1/markets/instruments?market=${market}&instrument_status=ACTIVE`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        let instrumentsArray = Object.entries(data.Data.ccix.instruments).map(([key, value]) => ({
            instrument: key,
            totalIndexUpdates: value.TOTAL_INDEX_UPDATES
        }));

        instrumentsArray.sort((a, b) => b.totalIndexUpdates - a.totalIndexUpdates);

        return instrumentsArray.slice(0, 25);
    } catch (error) {
        console.error('Error fetching top 25 instruments:', error);
        return [];
    }
}

// Fetch all index underlying pairs
async function fetchAllIndexUnderlyingPairs() {
    const apiKey = localStorage.getItem('apiKey') || '';
    const headers = { 'Authorization': `Apikey ${apiKey}` };
    const url = 'https://min-api.cryptocompare.com/data/index/underlying/list';

    try {
        const response = await fetch(url, { headers: headers });
        const data = await response.json();

        let pairs = new Set();
        for (let indexKey in data.Data) {
            for (let base in data.Data[indexKey].base) {
                for (let quote in data.Data[indexKey].base[base].quote) {
                    pairs.add(`${base}-${quote}`);
                }
            }
        }

        return Array.from(pairs);
    } catch (error) {
        console.error('Error fetching unique currency pairs:', error);
        return [];
    }
}

// Load data for a list of instruments
async function loadData(instrumentList) {
    const instrumentChunks = chunkInstruments(instrumentList);
    for (const chunk of instrumentChunks) {
        await fetchData(chunk);
    }
}

// Event listener for loading all index underlying pairs
document.getElementById('loadIndexUndlerlyingPairsButton').addEventListener('click', async () => {
    const indexUnderlyingPairs = await fetchAllIndexUnderlyingPairs();
    const tableBody = document.getElementById('table-body');
    tableBody.innerHTML = '';
    loadData(indexUnderlyingPairs);
});

// Event listener for loading user-defined pairs
document.getElementById('loadUserPairsButton').addEventListener('click', () => {
    const userInput = document.getElementById('instrumentsInput').value;
    const userInstruments = userInput ? userInput.split(',').map(instr => instr.trim()) : [];
    const tableBody = document.getElementById('table-body');
    tableBody.innerHTML = '';
    loadData(userInstruments);
});

// Convert timestamp to relative time
function getRelativeTime(timestamp) {
    const tradeDate = new Date(timestamp * 1000);
    const now = new Date();
    const difference = Math.floor((now - tradeDate) / 1000);

    let timeString;
    if (difference < 60) {
        timeString = 'Just now';
    } else if (difference < 3600) {
        const minutes = Math.floor(difference / 60);
        timeString = `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (difference < 86400) {
        const hours = Math.floor(difference / 3600);
        timeString = `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (difference < 2629743) {
        const days = Math.floor(difference / 86400);
        timeString = `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (difference < 31536000) {
        const months = Math.floor(difference / 2629743);
        timeString = `${months} month${months > 1 ? 's' : ''} ago`;
    } else {
        const years = Math.floor(difference / 31536000);
        timeString = `${years} year${years > 1 ? 's' : ''} ago`;
    }

    return `<span class="${getBadgeClass(difference)}">${timeString}</span>`;
}

// Get badge class based on time difference
function getBadgeClass(differenceInSeconds) {
    if (differenceInSeconds < 120) {
        return 'badge badge-success';
    } else if (differenceInSeconds < 600) {
        return 'badge badge-warning';
    } else {
        return 'badge badge-danger';
    }
}
