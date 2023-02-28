function check_cccagg_pair() {
    const fsym = document.getElementById("fsym").value.toUpperCase();
    const tsyms = document.getElementById("tsyms").value.toUpperCase() || "BTC"; // Default value is BTC if tsyms is not provided
    const url = `https://min-api.cryptocompare.com/data/v2/cccagg/pairs?fsym=${fsym}&tsyms=${tsyms}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (tsyms.split(",").every(tsym => tsym in data.Data.tsyms[fsym])) {
                document.getElementById("result").innerHTML = `${fsym}/${tsyms} is a cccagg pair.`;
            } else {
                document.getElementById("result").innerHTML = `${fsym}/${tsyms} is not a cccagg pair.`;
            }
        })
        .catch(error => {
            console.error(error);
            document.getElementById("result").innerHTML = "An error occurred while processing your request.";
        });
}
