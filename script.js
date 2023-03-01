function check_cccagg_pair() {
    const fsym = document.getElementById("fsym").value.toUpperCase();
    const tsyms = document.getElementById("tsyms").value.toUpperCase().split(",").map(tsym => tsym.trim());
    const url = `https://min-api.cryptocompare.com/data/v2/cccagg/pairs?fsym=${fsym}`;

    fetch(url)
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
                        table += `<tr>
                                  <td>${fsym}-${tsym}</td>
                                  <td>${exchangeStr}</td>
                                </tr>`;
                    }

                    table += `</tbody></table>`;
                    document.getElementById("result").innerHTML = table;
                } else {
                    const pairs = [];
                    for (const tsym of tsyms) {
                        if (tsym in response.Data.tsyms) {
                            const exchanges = Object.keys(response.Data.tsyms[tsym].exchanges).join(", ");
                            pairs.push(`<tr><td>${fsym}-${tsym}</td><td>&#x2713;</td><td>${exchanges}</td></tr>`);
                        } else {
                            get_exchanges(fsym, tsym, function (exchanges) {
                                pairs.push(`<tr><td>${fsym}-${tsym}</td><td>&#x2717;</td><td>${exchanges}</td></tr>`); //exchanges.join(', ')
                            });
                        }
                        console.info(pairs)
                    }
                    const table = `
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th>Pair</th>
                                    <th>Included</th>
                                    <th>Exchanges</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${pairs.join("")}
                            </tbody>
                        </table>
                    `;
                    document.getElementById("result").innerHTML = table;
                }
            }
        })
        .catch(error => {
            console.error(error);
            document.getElementById("result").innerHTML = `<div class="alert alert-danger" role="alert">An error occurred while processing your request.</div>`;
        });
}

function clear_result() {
    document.getElementById("result").innerHTML = "";
}

function get_exchanges(fsym, tsym, callback) {
    // Construct the API endpoint URL with the given parameters
    const url = `https://min-api.cryptocompare.com/data/v4/all/exchanges?fsym=${fsym}`;

    // Make a GET request to the API endpoint using the Fetch API
    fetch(url)
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
                        console.info(exchanges)
                    }
                }
            }
            console.info(exchanges)
            // Call the provided callback function with the list of exchanges
            callback(exchanges);
        })
        .catch(error => {
            // Handle any errors that occur during the request or response
            console.error(`Failed to fetch exchanges for ${fsym}-${tsym}: ${error}`);
        });
}
