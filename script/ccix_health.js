function chunkInstruments(instruments, chunkSize = 25) {
    let chunks = [];
    for (let i = 0; i < instruments.length; i += chunkSize) {
        chunks.push(instruments.slice(i, i + chunkSize).join(','));
    }
    return chunks;
}

async function fetchData(instruments) {
    const apiKey = localStorage.getItem('apiKey') || '';
    const headers = { 'Authorization': `Apikey ${apiKey}` };
    const url = `https://data-api.cryptocompare.com/index/cc/v1/latest/instrument/metadata?market=ccix&instruments=${instruments}&apply_mapping=true&groups=SOURCE,STATUS`;
    const tableBody = document.getElementById('table-body');

    fetch(url, { headers: headers })
        .then(response => response.json())
        .then(data => {
            // tableBody.innerHTML = ''; // Clear the table

            // Iterate through the instruments
            for (let [instrument, details] of Object.entries(data.Data)) {
                details = details.LAST_INDEX_UPDATE_FROM_CALCULATED;
                const lastUpdate = getRelativeTime(details.TIMESTAMP);
                const components = sortComponentsByPriceLastUpdate(details.METADATA.COMPONENTS);
                // Get market from "UPDATE_TRIGGERED_BY" e.g. "706~{cryptodotcom~BTC_USD}"
                const updateTriggeredBy = details.METADATA.UPDATE_TRIGGERED_BY.split('~{')[1].split('~')[0];

                // Create the main row for the instrument
                let mainRow = tableBody.insertRow();
                let cellInstrument = mainRow.insertCell();
                cellInstrument.textContent = instrument;
                cellInstrument.setAttribute('data-toggle', 'collapse');
                cellInstrument.setAttribute('data-target', `#collapse${instrument}`);
                cellInstrument.classList.add('clickable');

                let cellUpdateTigerredBy = mainRow.insertCell();
                cellUpdateTigerredBy.textContent = updateTriggeredBy;

                let cellLastUpdate = mainRow.insertCell();
                cellLastUpdate.innerHTML = lastUpdate;


                // Insert a new row for the collapsible content
                let collapseRow = tableBody.insertRow();
                let collapseCell = collapseRow.insertCell();
                collapseCell.colSpan = 4;
                collapseCell.classList.add('collapse');
                collapseCell.id = `collapse${instrument}`;

                let componentTable = document.createElement('table');
                componentTable.classList.add('table', 'table-dark', 'mb-0'); // Bootstrap classes

                // Fill the component table
                // Components have been sorted by price last update
                components.forEach(component => {
                    let market = component.market || key.split('~')[1];
                    let priceLastUpdate = getRelativeTime(component.priceLastUpdateTS);

                    let componentRow = componentTable.insertRow();
                    let cellMarket = componentRow.insertCell();
                    let cellPriceLastUpdate = componentRow.insertCell();

                    cellMarket.textContent = market;
                    cellPriceLastUpdate.innerHTML = priceLastUpdate;
                });

                collapseCell.appendChild(componentTable);
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            // Handle the error, maybe display a message to the user
        });
}

function sortComponentsByPriceLastUpdate(components) {
    // Convert object to array and extract the keys and values
    let componentArray = Object.entries(components).map(([key, value]) => {
        return {
            key: key,
            market: value.MARKET,
            price: value.PRICE,
            priceLastUpdateTS: value.PRICE_LAST_UPDATE_TS
        };
    });

    // Sort the array by PRICE_LAST_UPDATE_TS in descending order (most recent first)
    componentArray.sort((a, b) => b.priceLastUpdateTS - a.priceLastUpdateTS);

    return componentArray;
}

async function fetchTop25Instruments() {
    const apiUrl = 'https://data-api.cryptocompare.com/index/cc/v1/markets/instruments?market=ccix&instrument_status=ACTIVE';

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        // Extract instruments and convert to array
        let instrumentsArray = Object.entries(data.Data.ccix.instruments).map(([key, value]) => ({
            instrument: key,
            totalIndexUpdates: value.TOTAL_INDEX_UPDATES
        }));

        // Sort the array based on total index updates in descending order
        instrumentsArray.sort((a, b) => b.totalIndexUpdates - a.totalIndexUpdates);

        // Get the top 25 instruments
        return instrumentsArray.slice(0, 25);
    } catch (error) {
        console.error('Error fetching top 25 instruments:', error);
        return []; // Return an empty array in case of error
    }
}

// Usage example:
fetchTop25Instruments().then(topInstruments => {
    console.log('Top 25 Instruments:', topInstruments);
    // Further processing or display in your webpage
});

async function fetchAllIndexUnderlyingPairs() {
    const apiKey = localStorage.getItem('apiKey') || '';
    const headers = { 'Authorization': `Apikey ${apiKey}` };
    const url = 'https://min-api.cryptocompare.com/data/index/underlying/list';

    try {
        const response = await fetch(url, { headers: headers });
        const data = await response.json();

        let pairs = new Set();  // Using a Set to store unique pairs

        // Iterate through the Data object
        for (let indexKey in data.Data) {
            for (let base in data.Data[indexKey].base) {
                for (let quote in data.Data[indexKey].base[base].quote) {
                    pairs.add(`${base}-${quote}`);  // Add pair to the Set
                }
            }
        }

        return Array.from(pairs);  // Convert Set back to Array
    } catch (error) {
        console.error('Error fetching unique currency pairs:', error);
        return []; // Return an empty array in case of error
    }
}
// This func load the data of all the chucks (i.e 1 chunk = 25 instruments at a time) 
async function loadData(instrumentList) {
    const instrumentChunks = chunkInstruments(instrumentList);

    try {
        for (const chunk of instrumentChunks) {
            await fetchData(chunk); // Wait for each chunk to be processed
        }
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// For loading all data
document.getElementById('loadIndexUndlerlyingPairsButton').addEventListener('click', async () => {
    const indexUnderlyingPairs = await fetchAllIndexUnderlyingPairs();
    const tableBody = document.getElementById('table-body');
    tableBody.innerHTML = ''; // Clear the table
    loadData(indexUnderlyingPairs);
});

// For loading user data
document.getElementById('loadUserPairsButton').addEventListener('click', () => {
    const userInput = document.getElementById('instrumentsInput').value;
    const userInstruments = userInput ? userInput.split(',').map(instr => instr.trim()) : [];
    const tableBody = document.getElementById('table-body');
    tableBody.innerHTML = ''; // Clear the table
    loadData(userInstruments);
});

function getRelativeTime(timestamp) {
    const tradeDate = new Date(timestamp * 1000);
    const now = new Date();
    const difference = Math.floor((now - tradeDate) / 1000);

    let timeString;
    if (difference < 60) {
        timeString = `Just now`;
    } else if (difference < 3600) {
        const minutes = Math.floor(difference / 60);
        // Use singular for 1 e.g. 1 minute
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

function getBadgeClass(differenceInSeconds) {

    if (differenceInSeconds < 120) {
        return 'badge badge-success';
    } else if (differenceInSeconds < 600) {
        return 'badge badge-warning';
    } else {
        return 'badge badge-danger';
    }
}

