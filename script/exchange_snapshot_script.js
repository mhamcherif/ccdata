document.addEventListener('DOMContentLoaded', (event) => {
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        submitBtn.addEventListener('click', function (e) {
            e.preventDefault(); // Prevent the default form submission
            fetchData();
        });
    }
});

async function fetchData() {
    var exchange = document.getElementById('exchangeInput').value.trim().toLowerCase();
    const apiKey = localStorage.getItem('apiKey') || '';
    const headers = { 'Authorization': `Apikey ${apiKey}` };
    // fetch and create statusMapping
    const statusMapping = await fetchInstrumentStatus(exchange); // Fetch and process instrument status
    const url = `https://min-api.cryptocompare.com/data/exchange/snapshot?e=${exchange}`
    const response = await fetch(url, { headers: headers });
    const data = await response.json();

    // Find the most recent last trade timestamp
    let mostRecentTS = Math.max(...data.Data.map(item => parseInt(item.split('~')[6])));

    // Update the display
    updateLastTradeDisplay(exchange, mostRecentTS);

    clearTableData();
    document.getElementById('tableHeader').style.display = 'table-header-group';
    // Populate table with new data
    populateTable(data.Data, statusMapping);
}

function populateTable(data, statusMapping) {
    var table = $('#exchangeTable').DataTable({
        "destroy": true,
        "data": data.map(item => {
            const fields = item.split('~');
            const instrumentKey = `${fields[2]}-${fields[3]}`;
            const status = statusMapping[instrumentKey] || 'Unknown';
            const lastUpdateTS = parseInt(fields[6]) * 1000;
            const currentTime = new Date().getTime();
            const oneHour = 3600000; // One hour in milliseconds
            const oneMonth = 2629743000; // One month in milliseconds
            let flag = '';
            let instrument = '';
            let statusLink = '';

            // Check if status is RETIRED and Last Update TS is within the last hour
            if (status === 'RETIRED' && (currentTime - lastUpdateTS) <= oneHour) {
                flag = "Attention Needed"
                // Else check if status is ACTIVE and Last Update TS is over one month ago
            } else if (status === 'ACTIVE' && (currentTime - lastUpdateTS) >= oneMonth) {
                flag = "Attention Needed"
            }
            // Status Link to Tools
            if (status === 'RETIRED') {
                statusLink = `<a href="https://tools.cryptocompare.com/instrumentmap/spot/retired?filterMarket=${fields[1].toLowerCase()}&filterMappedInstrumentId=${instrumentKey}&page=1" target="_blank">RETIRED</a>`;
                // Else check if status is ACTIVE and Last Update TS is over one month ago
            } else if (status === 'ACTIVE') {
                statusLink = `<a href="https://tools.cryptocompare.com/instrumentmap/spot/mapped?filterMarket=${fields[1].toLowerCase()}&filterMappedInstrumentId=${instrumentKey}&page=1" target="_blank">ACTIVE</a>`;
            }
            //
            instrument = `<a href="https://data-api.cryptocompare.com/spot/v1/latest/tick?market=${fields[1].toLowerCase()}&instruments=${instrumentKey}&apply_mapping=true&groups=ID,MAPPING,VALUE,LAST_UPDATE,LAST_PROCESSED,CURRENT_WEEK,CURRENT_MONTH" target="_blank">${instrumentKey}</a>`;
            return [
                fields[1], // Market
                instrument, // Mapped Instrument: Base-Quote = fields[2]-fields[3]
                fields[2], // Base
                fields[3], // Quote
                fields[5], // Price
                fields[7], // Last Trade Quantity
                fields[6], // Last Update TS
                new Date(fields[6] * 1000).toISOString(), //use toLocaleString() to Converte to local time zone
                fields[9], // Last Trade ID
                statusLink,  // Instrument Status
                flag // Flag
            ];
        }),
        "columns": [
            { "title": "Market" },
            { "title": "Instrument" },
            { "title": "Base" },
            { "title": "Quote" },
            { "title": "Price" },
            { "title": "Last Trade Quantity" },
            { "title": "Last Update TS" },
            { "title": "Date (Read-able)" },
            { "title": "Last Trade ID" },
            { "title": "Instrument Status" },
            { "title": "Flag" }
        ],
        // specifies the dataTable options in the page length menu 
        "lengthMenu": [[10, 25, 50, -1], [10, 25, 50, "All"]], // Page length options
        "pageLength": 10 // Default number of rows to display
    });
}

// Function to clear table data
function clearTableData() {
    var tbody = document.querySelector('#exchangeTable tbody');
    tbody.innerHTML = ''; // Clear all rows
}


$(document).ready(function () {
    $('th').each(function (column) {
        $(this).click(function () {
            var rows = $('#exchangeTable tbody tr').get();

            rows.sort(function (a, b) {
                var val1 = $(a).children('td').eq(column).text();
                var val2 = $(b).children('td').eq(column).text();

                return val1.localeCompare(val2);
            });

            $.each(rows, function (index, row) {
                $('#exchangeTable tbody').append(row);
            });
        });
    });
});

async function fetchInstrumentStatus(exchange) {
    const apiKey = localStorage.getItem('apiKey') || '';
    const headers = { 'Authorization': `Apikey ${apiKey}` };
    const url = `https://data-api.cryptocompare.com/spot/v1/markets/instruments?market=${exchange}&instrument_status=ACTIVE,IGNORED,RETIRED,EXPIRED`;
    const response = await fetch(url, { headers: headers });
    const data = await response.json();

    let statusMapping = {};
    Object.entries(data.Data[exchange].instruments).forEach(([key, value]) => {
        statusMapping[key] = value.INSTRUMENT_STATUS;
    });

    return statusMapping;
}

function updateLastTradeDisplay(exchange, timestamp) {
    const relativeTime = timeSince(new Date(timestamp * 1000));
    let badgeClass = 'badge ';

    // Determine badge color based on recency
    const seconds = Math.floor((new Date() - new Date(timestamp * 1000)) / 1000);
    if (seconds < 1800) { // Less than 30 minutes
        badgeClass += 'badge-success';
    } else if (seconds < 3600) { // Less than 1 hours
        badgeClass += 'badge-info';
    } else if (seconds < 86400) { // Less than 1 day
        badgeClass += 'badge-warning';
    } else {
        badgeClass += 'badge-danger';
    }

    const formattedExchange = toTitleCase(exchange);
    document.getElementById('lastTradeInfo').innerHTML = `<h3>${formattedExchange} - Last Trade: <span class="${badgeClass}">${relativeTime}</span></h3>`;

}

function timeSince(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;

    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";

    return "Just Now";
}

function toTitleCase(str) {
    return str.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}