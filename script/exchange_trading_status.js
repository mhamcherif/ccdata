// Function to fetch exchanges with grades
async function getExchangesWithGrades(grades) {
    const url = "https://min-api.cryptocompare.com/data/exchanges/general";
    try {
        // Include appropriate headers if required
        const response = await fetch(url); // Add headers { headers: /* your headers here */ }
        const data = await response.json();

        return Object.values(data.Data)
            .filter(item => grades.includes(item.Grade))
            .map(item => ({ exchange: item.InternalName, grade: item.Grade }));
    } catch (error) {
        console.error('Error fetching exchange data:', error);
        return [];
    }
}

// Function to update the summary table
function updateSummaryTable(exchanges) {
    const summarySection = document.getElementById('summarySection');
    const summaryBody = document.getElementById('summaryTable').getElementsByTagName('tbody')[0];
    summaryBody.innerHTML = ''; // Clear existing summary data

    let hasSummaryData = false;

    exchanges.forEach(({ exchange, grade, data }) => {
        const mostLastTradeTs = data.split('~')[6];
        const relativeTime = getRelativeTime(mostLastTradeTs);
        const badgeClass = getBadgeClass(Math.floor((new Date() - new Date(mostLastTradeTs * 1000)) / 1000));

        if (badgeClass.includes('warning') || badgeClass.includes('danger')) {
            hasSummaryData = true;
            const newRow = summaryBody.insertRow();
            const cell1 = newRow.insertCell(0);
            const cell2 = newRow.insertCell(1);
            const cell3 = newRow.insertCell(2);
            //const cell4 = newRow.insertCell(3); // New cell for status

            cell1.textContent = exchange;
            cell2.innerHTML = relativeTime;
            cell3.textContent = grade;
            //cell4.innerHTML = `<span class="${badgeClass}">${badgeClass.split('-')[2]}</span>`; // Display the status
        }
    });

    // Toggle the visibility of the summary section based on data
    summarySection.style.display = hasSummaryData ? 'block' : 'none';
}

// Function to fetch data for exchanges based on selected grades and update the table
// Modified fetchDataForSelectedGrades function
async function fetchDataForSelectedGrades() {
    const selectedGrades = Array.from(document.querySelectorAll('#gradeSelection .form-check-input:checked'))
        .map(input => input.value);

    const exchangesWithGrades = await getExchangesWithGrades(selectedGrades);

    document.querySelector('#cryptoTable tbody').innerHTML = '';
    document.querySelector('#summaryTable tbody').innerHTML = ''; // Clear existing summary data

    let summaryExchanges = [];

    for (const { exchange, grade } of exchangesWithGrades) {
        try {
            const url = `https://min-api.cryptocompare.com/data/exchange/snapshot?e=${exchange}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data && data.Data && data.Data.length > 0) {
                const mostRecentTrade = data.Data.reduce((prev, current) => {
                    const prevTs = prev.split('~')[6];
                    const currentTs = current.split('~')[6];
                    return (prevTs > currentTs) ? prev : current;
                });

                updateTable(exchange, grade, data.Data);
                summaryExchanges.push({ exchange, grade, data: mostRecentTrade });
            }
        } catch (error) {
            console.error(`Error fetching data for ${exchange}:`, error);
        }
    }

    updateSummaryTable(summaryExchanges);
}

// Function to update the table with fetched data
function updateTable(exchange, grade, data) {
    const tableBody = document.getElementById('cryptoTable').getElementsByTagName('tbody')[0];

    if (data && data.length > 0) {
        const mostRecentTrade = data.reduce((prev, current) => {
            const prevTs = prev.split('~')[6];
            const currentTs = current.split('~')[6];
            return (prevTs > currentTs) ? prev : current;
        });

        const mostLastTradeTs = mostRecentTrade.split('~')[6];
        const relativeTime = getRelativeTime(mostLastTradeTs);

        const newRow = tableBody.insertRow();
        const cell1 = newRow.insertCell(0);
        const cell2 = newRow.insertCell(1);
        const cell3 = newRow.insertCell(2); // New cell for grade

        cell1.textContent = exchange;
        cell2.innerHTML = relativeTime;
        cell3.textContent = grade; // Display the grade
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

// Event listener for the "Fetch Exchanges" button
document.getElementById('fetchExchanges').addEventListener('click', fetchDataForSelectedGrades);

// Initial fetch with default grades
fetchDataForSelectedGrades();
