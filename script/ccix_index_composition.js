// Function to fetch data and update the DOM
async function fetchDataAndUpdateDOM() {
    const apiKey = localStorage.getItem('apiKey') || '';
    const headers = { 'Authorization': `Apikey ${apiKey}` };
    const url = 'https://tools-api.cryptocompare.com/indexcomposition/common/list/blob?id=-1&index_code=ccix';

    try {
        const response = await fetch(url, { headers });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const topThreeItems = data.Data.list.slice(0, 3); // Get the top 3 items

        // Select the table body in the DOM
        const tableBody = document.querySelector('#itemsTable tbody');

        // Clear existing table rows
        tableBody.innerHTML = '';

        // Create and append the table rows
        topThreeItems.forEach(item => {
            const row = tableBody.insertRow();
            const idCell = row.insertCell(0);
            const createdByCell = row.insertCell(1);
            const implementedCell = row.insertCell(2);
            const statusCell = row.insertCell(3);

            idCell.textContent = item.id;
            createdByCell.textContent = item.created_by_username;
            implementedCell.textContent = item.implemented_on;

            // Check if the 'Implemented on' date is in the past
            const implementedDate = new Date(item.implemented_on);
            const currentDate = new Date();
            statusCell.textContent = implementedDate < currentDate ? 'Published' : 'Scheduled';
        });
    } catch (error) {
        console.error('Error fetching or processing data:', error);
    }
}

// Call the function when the page loads
document.addEventListener('DOMContentLoaded', fetchDataAndUpdateDOM);
