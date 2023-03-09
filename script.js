function check_cccagg_pair() {
    const fsym = document.getElementById("fsym").value.trim().toUpperCase();
    const tsyms = document.getElementById("tsyms").value.toUpperCase().split(",").map(tsym => tsym.trim());
    const cccagg_url = `https://min-api.cryptocompare.com/data/v2/cccagg/pairs?fsym=${fsym}`;

    // Clear data
    document.getElementById("coin").innerHTML = "";
    document.getElementById("result").innerHTML = "";
    document.getElementById("extra").innerHTML = "";

    get_coin_info(fsym)

    fetch(cccagg_url)
        .then(response => response.json())
        .then(response => {
            if (Object.keys(response.Data).length === 0) {
                document.getElementById("result").innerHTML = `<div class="alert alert-warning" role="alert">${fsym} is not currently included in CCCAGG.</div>`;
            } else {
                if (tsyms.join("") === "") {
                    const resp_tsyms = response.Data.tsyms;
                    let table = `<table class="table table-bordered">
                                  <thead>
                                    <tr>
                                      <th>Pair</th>
                                      <th>Histo. Minute Start</th>
                                      <th>Exchanges</th>
                                    </tr>
                                  </thead>
                                  <tbody>`;

                    for (const tsym in resp_tsyms) {
                        const exchanges = [];
                        for (const exchange in resp_tsyms[tsym].exchanges) {
                            if (resp_tsyms[tsym].exchanges[exchange].isActive) {
                                exchanges.push(exchange);
                            }
                        }
                        const exchangeStr = exchanges.join(", ");
                        const histo_minute_start = resp_tsyms[tsym].histo_minute_start;
                        table += `<tr>
                                  <td>${fsym}-${tsym}</td>
                                  <td>${histo_minute_start}</td>
                                  <td>${exchangeStr}</td>
                                </tr>`;
                    }

                    table += `</tbody></table>`;
                    document.getElementById("result").innerHTML = table;
                } else {
                    const pairs = [];
                    const availExchanges = []
                    for (const tsym of tsyms) {
                        if (tsym in response.Data.tsyms) {
                            const histo_minute_start = response.Data.tsyms[tsym].histo_minute_start;
                            const exchanges = Object.keys(response.Data.tsyms[tsym].exchanges).join(", ");
                            pairs.push(`<tr><td>${fsym}-${tsym}</td><td>&#x2713;</td><td>${histo_minute_start}</td><td>${exchanges}</td></tr>`);
                            console.info(histo_minute_start)
                            get_exchanges(fsym, tsym, function (exchanges) {
                                availExchanges.push(`${exchanges}<br>`);
                            });
                        } else {
                            get_exchanges(fsym, tsym, function (exchanges) {
                                availExchanges.push(`${exchanges}<br>`);
                            });
                            pairs.push(`<tr><td>${fsym}-${tsym}</td><td>&#x2717;</td><td></td><td>${availExchanges.join(", ")}</td></tr>`)
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
                                    <th>Exchanges</th>
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
                    // document.getElementById("extra").innerHTML = "TEST" //`${availExchanges.join("\n")}`;
                }
            }
        })
        .catch(error => {
            console.error(error);
            document.getElementById("result").innerHTML = `<div class="alert alert-danger" role="alert">An error occurred while processing your request.</div>`;
        });
}

function clear_result() {
    document.getElementById("tsyms").value = "";
    // Coin Listing Info
    document.getElementById("coin").innerHTML = "";
    document.getElementById("result").innerHTML = "";
    document.getElementById("extra").innerHTML = "";
}

function get_exchanges(fsym, tsym, callback) {
    // Construct the API endpoint URL with the given parameters
    const exchanges_url = `https://min-api.cryptocompare.com/data/v4/all/exchanges?fsym=${fsym}`;

    // Make a GET request to the API endpoint using the Fetch API
    fetch(exchanges_url)
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
                        exchanges.push(exchange);
                    }
                }
            }
            console.info(fsym, tsym, exchanges);
            // Get the reference to the "extra" element
            let extraElement = document.getElementById("extra");

            // Check if the exchanges array is not empty
            if (exchanges.length > 0) {
                // Check if the table has already been created
                let tableElement = extraElement.querySelector(`table[data-fsym='${fsym}']`);
                if (!tableElement) {
                    // Create a new table element
                    tableElement = document.createElement("table");
                    tableElement.classList.add("table", "table-striped");
                    tableElement.setAttribute("data-fsym", fsym);
                    tableElement.innerHTML = `
                        <thead>
                            <tr>
                                <th>Pair</th>
                                <th>Available Exchanges</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    `;
                    extraElement.insertAdjacentElement("beforeend", tableElement);
                }

                // Add a new row to the table
                let tbodyElement = tableElement.querySelector("tbody");
                let newRowElement = document.createElement("tr");
                newRowElement.innerHTML = `
                    <td>${fsym}-${tsym}</td>
                    <td>${exchanges.join(", ")}</td>
                `;
                tbodyElement.insertAdjacentElement("beforeend", newRowElement);
            }

            // Call the provided callback function with the list of exchanges
            callback(exchanges);
        })
        .catch(error => {
            // Handle any errors that occur during the request or response
            console.error(`Failed to fetch exchanges for ${fsym}-${tsym}: ${error}`);
        });
}




function get_coin_info(fsym) {
    const coinlist_url = `https://min-api.cryptocompare.com/data/all/coinlist?fsym=${fsym}`;

    fetch(coinlist_url)
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

