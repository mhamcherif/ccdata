async function getExchangesWithGrades(grades) {
    const url = "https://min-api.cryptocompare.com/data/exchanges/general";
    const exclusions_list = [
        "yobit",
        "therocktrading",
        "tokenomy",
        "bkex",
        "liqnet",
        "cointiger",
        "zbg",
        "coinfield",
        "paribu",
        "etoro",
        "bitfex",
        "bithumbglobal",
        "btse",
        "bitbuy",
        "crosstower"
    ];
    const shouldExclude = document.getElementById('excludeToggle').checked;

    try {
        const apiKey = localStorage.getItem('apiKey') || '';
        const headers = { 'Authorization': `Apikey ${apiKey}` };

        const exchangeResponse = await fetch(url, { headers: headers }); // Fetch exchanges
        const data = await exchangeResponse.json();

        let exclusions = [];

        if (shouldExclude) {
            exclusions = exclusions_list;
        }

        return Object.values(data.Data)
            .filter(item => grades.includes(item.Grade) && (!shouldExclude || !exclusions.includes(item.InternalName.toLowerCase())))
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
        const relativeTime = getRelativeTime(mostLastTradeTs, grade);
        const badgeClass = getBadgeClass(Math.floor((new Date() - new Date(mostLastTradeTs * 1000)) / 1000), grade);

        if (badgeClass.includes('warning') || badgeClass.includes('danger')) {
            hasSummaryData = true;
            const newRow = summaryBody.insertRow();
            const cell1 = newRow.insertCell(0);
            const cell2 = newRow.insertCell(1);
            const cell3 = newRow.insertCell(2);

            cell1.textContent = exchange;
            cell2.innerHTML = relativeTime;
            cell3.textContent = grade;
        }
    });

    // Toggle the visibility of the summary section based on data
    summarySection.style.display = hasSummaryData ? 'block' : 'none';
}

// Function to fetch data for exchanges based on selected grades and update the table
async function fetchDataForSelectedGrades() {
    // Show loading message
    document.getElementById('loadingMessage').style.display = 'block';

    const selectedGrades = Array.from(document.querySelectorAll('#gradeSelection .form-check-input:checked'))
        .map(input => input.value);

    const exchangesWithGrades = await getExchangesWithGrades(selectedGrades);

    document.querySelector('#cryptoTable tbody').innerHTML = '';
    document.querySelector('#summaryTable tbody').innerHTML = '';
    document.querySelector('#summarySection').style.display = 'none';

    let summaryExchanges = [];

    // Prepare all fetch promises
    const fetchPromises = exchangesWithGrades.map(({ exchange, grade }) => {
        const apiKey = localStorage.getItem('apiKey') || '';
        const headers = { 'Authorization': `Apikey ${apiKey}` };
        const url = `https://min-api.cryptocompare.com/data/exchange/snapshot?e=${exchange}`;

        return fetch(url, { headers: headers }).then(response => response.json().then(data => ({ exchange, grade, data })));
    });

    // Execute all promises in parallel
    const results = await Promise.all(fetchPromises);

    for (const { exchange, grade, data } of results) {
        if (data && data.Data && data.Data.length > 0) {
            const mostRecentTrade = data.Data.reduce((prev, current) => {
                const prevTs = prev.split('~')[6];
                const currentTs = current.split('~')[6];
                return (prevTs > currentTs) ? prev : current;
            });

            updateTable(exchange, grade, data.Data);
            summaryExchanges.push({ exchange, grade, data: mostRecentTrade });
        }
    }

    // Hide loading message
    document.getElementById('loadingMessage').style.display = 'none';

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
        const relativeTime = getRelativeTime(mostLastTradeTs, grade);

        const newRow = tableBody.insertRow();
        const cell1 = newRow.insertCell(0);
        const cell2 = newRow.insertCell(1);
        const cell3 = newRow.insertCell(2); // New cell for grade

        cell1.textContent = exchange;
        cell2.innerHTML = relativeTime;
        cell3.textContent = grade; // Display the grade
    }
}

// Function to determine badge class based on time difference and grade
function getBadgeClass(differenceInSeconds, grade) {
    const thresholds = {
        // ------------------------ Top Tier [5-10] --------------------------------
        // // 5 minutes for warning, 10 minutes for danger
        'AA': { warning: 300, danger: 600 },
        'A': { warning: 300, danger: 600 },
        // ------------------------ Second Tier [10-20] -------------------------------
        // 10 minutes for warning, 20 minutes for danger
        'BB': { warning: 600, danger: 1200 },
        'B': { warning: 600, danger: 1200 },
        // ------------------------ Third Tier [15-30] -------------------------------
        // 15 minutes for warning, 30 minutes for danger
        'C': { warning: 900, danger: 1800 },
        // ------------------------- Lower Tier [20-60]-------------------------------
        // 20 minutes for warning, 60 minutes for danger
        'D': { warning: 1200, danger: 3600 },
        'E': { warning: 1200, danger: 3600 },
        'F': { warning: 1200, danger: 3600 },
    };

    // Default threshold if grade not in the list -> 5 years for warning, 10 years for danger for no grade
    const defaultThreshold = { warning: 157784630, danger: 315569260 };

    const gradeThreshold = thresholds[grade] || defaultThreshold;

    if (differenceInSeconds < gradeThreshold.warning) {
        return 'badge badge-success';
    } else if (differenceInSeconds < gradeThreshold.danger) {
        return 'badge badge-warning';
    } else {
        return 'badge badge-danger';
    }
}

// Updated function to convert timestamp to relative time string with badge
function getRelativeTime(timestamp, grade) {
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

    return `<span class="${getBadgeClass(difference, grade)}">${timeString}</span>`;
}

// Function to save auto-refresh interval
function saveAutoRefreshPreference() {
    const autoRefreshInterval = document.getElementById('autoRefresh').value;
    sessionStorage.setItem('autoRefreshInterval', autoRefreshInterval);
    setupAutoRefresh(); // Update the auto-refresh setup
}

// Function to save user preferences
function saveUserPreferences() {
    const selectedGrades = Array.from(document.querySelectorAll('#gradeSelection .form-check-input:checked'))
        .map(input => input.value);
    sessionStorage.setItem('selectedGrades', JSON.stringify(selectedGrades));
}

// Function to load and apply user preferences
function applyUserPreferences() {
    const selectedGrades = JSON.parse(sessionStorage.getItem('selectedGrades'));
    if (selectedGrades) {
        document.querySelectorAll('#gradeSelection .form-check-input').forEach(input => {
            input.checked = selectedGrades.includes(input.value);
        });
        fetchDataForSelectedGrades(); // Fetch data with these preferences
    }
}

function setupAutoRefresh() {
    const savedInterval = sessionStorage.getItem('autoRefreshInterval');
    const refreshInterval = savedInterval ? parseInt(savedInterval, 10) * 1000 : 0;

    if (refreshInterval > 0) {
        setTimeout(() => {
            saveUserPreferences(); // Save preferences before refreshing
            location.reload(); // Refresh the page
        }, refreshInterval);
    }
}

// Function to apply auto-refresh preference on page load
function applyAutoRefreshPreference() {
    const savedInterval = sessionStorage.getItem('autoRefreshInterval');
    if (savedInterval) {
        document.getElementById('autoRefresh').value = savedInterval;
        setupAutoRefresh();
    }
}

// Event listeners for grade selection changes
document.querySelectorAll('#gradeSelection .form-check-input').forEach(input => {
    input.addEventListener('change', saveUserPreferences);
});
// Event listeners for  refresh option changes
document.getElementById('autoRefresh').addEventListener('change', saveAutoRefreshPreference);

// Event listener to the checkbox to trigger a data refresh when its state changes:
document.getElementById('excludeToggle').addEventListener('change', () => {
    saveUserPreferences(); // Save current user preferences
    // fetchDataForSelectedGrades(); // Fetch data again with new exclusion settings
});

// On page load
applyUserPreferences(); // Apply saved preferences
applyAutoRefreshPreference();

// Event listener for the "Fetch Exchanges" button
document.getElementById('fetchExchanges').addEventListener('click', fetchDataForSelectedGrades);

// Initial fetch with default grades
fetchDataForSelectedGrades();
