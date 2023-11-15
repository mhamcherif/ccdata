// List of exchanges to loop through
const exchanges = ['Bitstamp', 'BitTrex', 'OKCoin', 'Kraken', 'Bitfinex', 'Cexio', 'Coinbase', 'itBit', 'Gemini', 'Exmo', 'Korbit', 'BTCMarkets', 'Coincheck', 'Bitso', 'bitFlyer', 'Luno', 'Coinone', 'Bithumb', 'Binance', 'Lykke', 'HuobiPro', 'OKEX', 'Gateio', 'Kucoin', 'BitBank', 'CoinEx', 'Upbit', 'IndependentReserve', 'Bitmex', 'CoinJar', 'P2PB2B', 'Bitkub', 'NDAX', 'DigiFinex', 'bybit', 'huobijapan', 'huobikorea', 'gopax', 'binanceusa', 'bitflyerus', 'bitflyereu', 'lmax', 'blockchaincom', 'indodax', 'bitpanda', 'etoro', 'currency', 'bequant', 'bithumbglobal', 'btse', 'bitbuy', 'crosstower', 'cryptodotcom', 'erisx', 'mexc', 'bullish', 'bitget'];

// Function to fetch data for each exchange and update the table
async function fetchDataForExchanges() {
    for (const exchange of exchanges) {
        try {
            const url = `https://min-api.cryptocompare.com/data/exchange/snapshot?e=${exchange}`;
            const response = await fetch(url);
            const data = await response.json();
            updateTable(exchange, data.Data);
        } catch (error) {
            console.error(`Error fetching data for ${exchange}:`, error);
        }
    }
}

// Function to update the table with fetched data
function updateTable(exchange, data) {
    const tableBody = document.getElementById('cryptoTable').getElementsByTagName('tbody')[0];

    if (data && data.length > 0) {
        // Find the trade with the most recent 'mostLastTradeTs'
        const mostRecentTrade = data.reduce((prev, current) => {
            const prevTs = prev.split('~')[6];
            const currentTs = current.split('~')[6];
            return (prevTs > currentTs) ? prev : current;
        });

        const mostLastTradeTs = mostRecentTrade.split('~')[6];
        const relativeTime = getRelativeTime(mostLastTradeTs);

        // Create a new row and cells
        const newRow = tableBody.insertRow();
        const cell1 = newRow.insertCell(0);
        const cell2 = newRow.insertCell(1);

        // Update cell content
        cell1.textContent = exchange;
        cell2.innerHTML = relativeTime; // Changed from textContent to innerHTML
    }
}

// Function to determine badge class based on time difference
function getBadgeClass(differenceInSeconds) {
    if (differenceInSeconds < 1800) { // Less than 30 minutes
        return 'badge badge-success';
    } else if (differenceInSeconds < 3600) { // Less than 1 hour
        return 'badge badge-info';
    } else if (differenceInSeconds < 86400) { // Less than 1 day
        return 'badge badge-warning';
    } else { // Over 1 day
        return 'badge badge-danger';
    }
}

// Updated function to convert timestamp to relative time string with badge
function getRelativeTime(timestamp) {
    const tradeDate = new Date(timestamp * 1000);
    const now = new Date();
    const difference = Math.floor((now - tradeDate) / 1000);

    let timeString;
    if (difference < 60) {
        timeString = `Just now`;
    } else if (difference < 3600) {
        timeString = `${Math.floor(difference / 60)} minutes ago`;
    } else if (difference < 86400) {
        timeString = `${Math.floor(difference / 3600)} hours ago`;
    } else if (difference < 2629743) {
        timeString = `${Math.floor(difference / 86400)} days ago`;
    } else {
        timeString = `${Math.floor(difference / 2629743)} months ago`;
    }

    return `<span class="${getBadgeClass(difference)}">${timeString}</span>`;
}

// Call the function to fetch and display data
fetchDataForExchanges();
