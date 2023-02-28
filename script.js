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
                const pairs = [];
                for (const tsym of tsyms) {
                    if (tsym in response.Data.tsyms) {
                        pairs.push(`<span class="text-success">&#x2714; ${fsym}/${tsym}</span>`);
                    } else {
                        pairs.push(`<span class="text-danger">&#x2718; ${fsym}/${tsym}</span>`);
                    }
                }
                if (pairs.length === 0) {
                    document.getElementById("result").innerHTML = `<div class="alert alert-info" role="alert">${fsym} is included in CCCAGG.</div>`;
                } else {
                    document.getElementById("result").innerHTML = pairs.join("<br>");
                }
            }
        })
        .catch(error => {
            console.error(error);
            document.getElementById("result").innerHTML = `<div class="alert alert-danger" role="alert">An error occurred while processing your request.</div>`;
        });
}
