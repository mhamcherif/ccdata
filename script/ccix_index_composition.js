// Set the number of items you want to display
const numberOfItems = 5; // Change this number to display more items

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
        const itemsList = data.Data.list; // Get all items
        const topItems = itemsList.slice(0, numberOfItems); // Get the top N items

        // Select the table body in the DOM
        const tableBody = document.querySelector('#itemsTable tbody');

        // Clear existing table rows
        tableBody.innerHTML = '';

        // Create and append the table rows
        topItems.forEach((item, index) => {
            const row = tableBody.insertRow();
            const idCell = row.insertCell(0);
            const createdByCell = row.insertCell(1);
            const implementedCell = row.insertCell(2);
            const statusCell = row.insertCell(3);
            const compareCell = row.insertCell(4);

            idCell.textContent = item.id;
            createdByCell.textContent = item.created_by_username;
            implementedCell.textContent = item.implemented_on;

            // Check if the 'Implemented on' date is in the past
            const implementedDate = new Date(item.implemented_on);
            const currentDate = new Date();
            statusCell.textContent = implementedDate < currentDate ? 'Published' : 'Scheduled';

            // Add a compare link if there is a next item in the list
            if (index < topItems.length - 1) {
                const nextItemId = itemsList[index + 1].id;
                const compareLink = document.createElement('a');
                compareLink.href = '#';
                compareLink.textContent = 'Compare';
                compareLink.dataset.bBlobId = item.id;
                compareLink.dataset.aBlobId = nextItemId;
                compareLink.onclick = function () {
                    compareBlobs(this.dataset.aBlobId, this.dataset.bBlobId);
                };
                compareCell.appendChild(compareLink);
            }
        });
    } catch (error) {
        console.error('Error fetching or processing data:', error);
    }
}

// Function to compare two blobs and display the results
async function compareBlobs(a_blob_id, b_blob_id) {
    const apiKey = localStorage.getItem('apiKey') || '';
    const headers = { 'Authorization': `Apikey ${apiKey}` };
    const comparisonUrl = `https://tools-api.cryptocompare.com/indexcomposition/vwap/get/differences-between-blobs?a_blob_id=${a_blob_id}&b_blob_id=${b_blob_id}`;

    try {
        const response = await fetch(comparisonUrl, { headers });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        const { included, excluded } = result.Data;

        const comparisonResultsDiv = document.getElementById('comparisonResults');
        comparisonResultsDiv.innerHTML = `
            <h2>Comparison Results</h2>
            <h3 style="color: green;">Included</h3>
            <p style="color: green;">${included.join('<br>')}</p>
            <h3 style="color: red;">Excluded</h3>
            <p style="color: red;">${excluded.join('<br>')}</p>`;
    } catch (error) {
        console.error('Error fetching or processing comparison data:', error);
    }
}


// Call the function when the page loads
document.addEventListener('DOMContentLoaded', fetchDataAndUpdateDOM);
