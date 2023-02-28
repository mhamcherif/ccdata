function check_cccagg_pair() {
    const fsym = document.getElementById("fsym").value.toUpperCase();
    const tsym = document.getElementById("tsym").value.toUpperCase() || "BTC"; // Default value is BTC if tsym is not provided
    const url = `https://min-api.cryptocompare.com/data/v2/cccagg/pairs`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (fsym in data.Data.tsyms && tsym in data.Data.tsyms[fsym]) {
                document.getElementById("result").innerHTML = `${fsym}/${tsym} is a cccagg pair.`;
            } else {
                document.getElementById("result").innerHTML = `${fsym}/${tsym} is not a cccagg pair.`;
            }
        })
        .catch(error => {
            console.error(error);
            document.getElementById("result").innerHTML = "An error occurred while processing your request.";
        });
}
