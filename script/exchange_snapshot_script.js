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
    var exchange = document.getElementById('exchangeInput').value;

    // fetch and create statusMapping
    const statusMapping = await fetchInstrumentStatus(exchange); // Fetch and process instrument status

    const response = await fetch(`https://min-api.cryptocompare.com/data/exchange/snapshot?e=${exchange}`);
    const data = await response.json();

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

            // Check if status is RETIRED and Last Update TS is within the last hour
            if (status === 'RETIRED' && (currentTime - lastUpdateTS) <= oneHour) {
                flag = `<a href="https://tools.cryptocompare.com/instrumentmap/spot/retired?filterMarket=${fields[1].toLowerCase()}&filterMappedInstrumentId=${instrumentKey}&page=1" target="_blank">Attention Needed</a>`;
                // Else check if status is ACTIVE and Last Update TS is over one month ago
            } else if (status === 'ACTIVE' && (currentTime - lastUpdateTS) >= oneMonth) {
                flag = `<a href="https://tools.cryptocompare.com/instrumentmap/spot/mapped?filterMarket=${fields[1].toLowerCase()}&filterMappedInstrumentId=${instrumentKey}&page=1" target="_blank">Attention Needed</a>`;
            }
            return [
                fields[1], // Market
                fields[2], // Base
                fields[3], // Quote
                fields[5], // Price
                fields[7], // Last Trade Quantity
                fields[6], // Last Update TS
                new Date(fields[6] * 1000).toISOString(), //use toLocaleString() to Converte to local time zone
                fields[9], // Last Trade ID
                status,  // Instrument Status
                flag // Flag
            ];
        }),
        "columns": [
            { "title": "Market" },
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
    const url = `https://data-api.cryptocompare.com/spot/v1/markets/instruments?market=${exchange}&instrument_status=ACTIVE,IGNORED,RETIRED,EXPIRED`;
    const response = await fetch(url);
    const data = await response.json();

    let statusMapping = {};
    Object.entries(data.Data[exchange].instruments).forEach(([key, value]) => {
        statusMapping[key] = value.INSTRUMENT_STATUS;
    });

    return statusMapping;
}
