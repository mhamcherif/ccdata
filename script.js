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
                            get_exchanges(fsym, tsyms)
                            //pairs.push(`<tr><td>${fsym}-${tsym}</td><td>&#x2717;</td><td></td></tr>`);
                        }
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

function get_exchanges(fsym, tsyms) {
    const url = `https://min-api.cryptocompare.com/data/v4/all/exchanges?fsym=${fsym}`;

    fetch(url)
        .then(response => response.json())
        .then(response => {
            const exchanges = [];
            for (const exchange in response.Data.exchanges) {
                const pairs = response.Data.exchanges[exchange].pairs;
                if (tsyms.every(tsym => tsym in pairs[fsym].tsyms)) {
                    exchanges.push(exchange);
                }
            }
            if (exchanges.length > 0) {
                const html = `
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Exchange</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${exchanges.map(exchange => `<tr><td>${exchange}</td></tr>`).join("")}
                        </tbody>
                    </table>
                `;
                document.getElementById("result").innerHTML = html;
            } else {
                document.getElementById("result").innerHTML = `<div class="alert alert-warning" role="alert">No exchanges found for ${fsym}/${tsyms.join(", ")}</div>`;
            }
        })
        .catch(error => {
            console.error(error);
            document.getElementById("result").innerHTML = `<div class="alert alert-danger" role="alert">An error occurred while processing your request.</div>`;
        });
}