async function check_cccagg_pair() {
    try {
        const fsym = document.getElementById("fsym").value.trim().toUpperCase();
        const tsyms = document.getElementById("tsyms").value.toUpperCase().split(",").map(tsym => tsym.trim());
        const cccagg_url = `https://min-api.cryptocompare.com/data/v2/cccagg/pairs?fsym=${fsym}`;
        const apiKey = localStorage.getItem('apiKey') || '';
        const headers = { 'Authorization': `Apikey ${apiKey}` };
        const exchangeGrades = await fetchExchangeGrades();

        // Clear data
        document.getElementById("coin").innerHTML = "";
        document.getElementById("result").innerHTML = "";
        await get_coin_info(fsym);

        const response = await fetch(cccagg_url, { headers: headers });
        const data = await response.json();
        fetch(cccagg_url, { headers: headers })
            .then(response => response.json())
            .then(response => {
                if (Object.keys(response.Data).length === 0) {
                    document.getElementById("result").innerHTML = `<div class="alert alert-warning" role="alert">${fsym} is not currently included in CCCAGG.</div>`;
                } else {
                    if (tsyms.join("") === "") {
                        const resp_tsyms = response.Data.tsyms;
                        let promises = [];
                        let table = `<table class="table table-bordered">
                                    <thead>
                                        <tr>
                                        <th>Pair</th>
                                        <th>Last Update</th>
                                        <th>Histo. Minute Start</th>
                                        <th>Exchanges</th>
                                        </tr>
                                    </thead>
                                    <tbody>`;

                        for (const tsym in resp_tsyms) {
                            const exchanges = [];
                            for (const exchange in resp_tsyms[tsym].exchanges) {
                                const grade = exchangeGrades[exchange] || 'Unknown';
                                exchanges.push(`${exchange} (${grade})`);
                            }
                            const exchangeStr = exchanges.join(", ");
                            const histo_minute_start = resp_tsyms[tsym].histo_minute_start;
                            const promise = getLastUpdate(fsym, tsym, exchanges)
                                .then(lastUpdate => {
                                    return `<tr>
                                                            <td>${fsym}-${tsym}</td>
                                                            <td>${lastUpdate}</td>
                                                            <td>${histo_minute_start}</td>
                                                            <td>${exchangeStr}</td>
                                                        </tr>`;
                                });
                            promises.push(promise);
                        }
                        Promise.all(promises).then(values => {
                            table += values.join("");
                            table += `</tbody></table>`;
                            document.getElementById("result").innerHTML = table;
                        });
                    } else {
                        // the case of given fsym & tsyms
                        const pairs = [];
                        const availExchanges = []
                        for (const tsym of tsyms) {
                            if (tsym in response.Data.tsyms) {
                                const histo_minute_start = response.Data.tsyms[tsym].histo_minute_start;
                                //const exchanges = Object.keys(response.Data.tsyms[tsym].exchanges).join(", ");
                                // Modify this line to include grades
                                const exchangesWithGrades = Object.keys(data.Data.tsyms[tsym].exchanges).map(exchange => {
                                    const grade = exchangeGrades[exchange] || 'Unknown';
                                    return `${exchange} (${grade})`;
                                }).join(", ");
                                get_exchanges(fsym, tsym, function (exchanges) {
                                    const exchangesElem = document.getElementById(`${fsym}-${tsym}-exchanges`);
                                    exchangesElem.textContent = exchanges.join(", ");
                                });
                                pairs.push(`<tr><td>${fsym}-${tsym}</td><td>&#x2713;</td><td>${histo_minute_start}</td><td>${exchangesWithGrades}</td><td id="${fsym}-${tsym}-exchanges"></td></tr>`);
                                console.info(histo_minute_start)
                            } else {
                                get_exchanges(fsym, tsym, function (exchanges) {
                                    const exchangesElem = document.getElementById(`${fsym}-${tsym}-exchanges`);
                                    exchangesElem.textContent = exchanges.join(", ");
                                });
                                pairs.push(`<tr><td>${fsym}-${tsym}</td><td>&#x2717;</td><td></td><td>${availExchanges.join(", ")}</td><td id="${fsym}-${tsym}-exchanges"></td></tr>`)
                            }
                        }
                        console.info(pairs)
                        console.info(pairs.join(""))
                        const table = `
                            <table class="table table-striped">
                                <thead>
                                    <tr>
                                        <th>Pair</th>
                                        <th>Included</th>
                                        <th>Histo. Minute Start</th>
                                        <th>CCCAGG Exchanges</th>
                                        <th>Supported Exchanges</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${pairs.join()}
                                </tbody>
                            </table>
                        `;
                        console.info(availExchanges)
                        console.info(availExchanges.join(" | "))
                        document.getElementById("result").innerHTML = table;
                    }
                }
            })
            .catch(error => {
                console.error(error);
                document.getElementById("result").innerHTML = `<div class="alert alert-danger" role="alert">An error occurred while processing your request.</div>`;
            });

    } catch (error) {
        // ... error handling ...
        console.error(error);
    }
}

function clear_result() {
    // Reset the toggle
    document.getElementById("toggleSwitch").checked = false;
    updateLabel();
    // Clear tsyms
    document.getElementById("tsyms").value = "";
    // Clear Coin Listing Info
    document.getElementById("coin").innerHTML = "";
    // Clear Result Listing
    document.getElementById("result").innerHTML = "";
}

async function get_exchanges(fsym, tsym, callback) {
    const exchangeGrades = await fetchExchangeGrades();
    const apiKey = localStorage.getItem('apiKey') || '';
    const headers = { 'Authorization': `Apikey ${apiKey}` };
    // Construct the API endpoint URL with the given parameters
    const exchanges_url = `https://min-api.cryptocompare.com/data/v4/all/exchanges?fsym=${fsym}`;

    // Make a GET request to the API endpoint using the Fetch API
    fetch(exchanges_url, { headers: headers })
        .then(response => response.json())
        .then(data => {
            // Extract the list of exchanges that support the given pair
            const exchanges = [];
            const exchangePairs = data.Data.exchanges;
            for (const exchange in exchangePairs) {
                const pairs = exchangePairs[exchange].pairs;
                if (pairs.hasOwnProperty(fsym)) {
                    const tsyms = pairs[fsym].tsyms;
                    if (tsyms.hasOwnProperty(tsym)) {
                        const grade = exchangeGrades[exchange] || 'Unknown';
                        exchanges.push(`${exchange} (${grade})`);
                    }
                }
            }
            console.info(fsym, tsym, exchanges);

            // Call the provided callback function with the list of exchanges
            callback(exchanges);
        })
        .catch(error => {
            // Handle any errors that occur during the request or response
            console.error(`Failed to fetch exchanges for ${fsym}-${tsym}: ${error}`);
        });
}


function get_coin_info(fsym) {
    const apiKey = localStorage.getItem('apiKey') || '';
    const headers = { 'Authorization': `Apikey ${apiKey}` };
    const coinlist_url = `https://min-api.cryptocompare.com/data/all/coinlist?fsym=${fsym}`;

    fetch(coinlist_url, { headers: headers })
        .then((response) => {
            if (response.status !== 200) {
                console.log(`Error: ${response.status}`);
                return;
            }
            response.json().then((data) => {
                const coin = [];
                if (data.Response === "Success" && Object.keys(data.Data).length !== 0) {
                    const coinInfo = data.Data[fsym];
                    const coinFullName = coinInfo.FullName;
                    const Url = coinInfo.Url;
                    const launchedDate = coinInfo.AssetLaunchDate;
                    const contentCreatedOn = new Date(coinInfo.ContentCreatedOn * 1000).toISOString().slice(0, 10);

                    const output = `Coin: <a href="https://cryptocompare.com${coinInfo.Url}">${coinFullName}</a><br>
                                    Launched: ${launchedDate}<br>
                                    Content Created On: ${contentCreatedOn}<br><br>`;

                    document.getElementById("coin").innerHTML = output;

                }
            });
        })
        .catch((err) => {
            console.log(`Error: ${err}`);
        });


}

function getLastUpdate(fsym, tsym) {
    const apiKey = localStorage.getItem('apiKey') || '';
    const headers = { 'Authorization': `Apikey ${apiKey}` };
    const url = `https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${fsym}&tsyms=${tsym}&tryConversion=false&e=CCCAGG`
    return fetch(url, { headers: headers })
        .then(resp => resp.json())
        .then(resp => resp.DISPLAY[fsym][tsym].LASTUPDATE)
        .catch(() => "");
}

function updateLabel() {
    var toggleLabel = document.getElementById("toggleLabel");
    var useDefault = document.getElementById("toggleSwitch").checked;
    toggleLabel.innerHTML = useDefault ? "Default" : "Custom";
    var tsymsInput = document.getElementById("tsyms");
    tsymsInput.value = useDefault ? "BTC,ETH,WETH,BNB,USDT" : "";

}

async function fetchExchangeGrades() {
    const url = 'https://min-api.cryptocompare.com/data/exchanges/general';
    try {
        const response = await fetch(url);
        const data = await response.json();
        const grades = {};
        Object.values(data.Data).forEach(exchange => {
            grades[exchange.InternalName] = exchange.Grade;
        });
        return grades;
    } catch (error) {
        console.error('Error fetching exchange grades:', error);
        return {};
    }
}
