function check_cccagg_pair() {
    const fsym = document.getElementById("fsym").value.toUpperCase();
    const tsyms = document.getElementById("tsyms").value.toUpperCase().split(",").map(tsym => tsym.trim());
    const url = `https://min-api.cryptocompare.com/data/v2/cccagg/pairs?fsym=${fsym}&tsyms=${tsyms.join(",")}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            const pairs = [];
            for (const tsym of tsyms) {
                if (tsym in data.Data.tsyms) {
                    pairs.push(`${fsym}/${tsym} is a cccagg pair.`);
                } else {
                    pairs.push(`${fsym}/${tsym} is not a cccagg pair.`);
                }
            }
            document.getElementById("result").innerHTML = pairs.join("<br>");
        })
        .catch(error => {
            console.error(error);
            document.getElementById("result").innerHTML = "An error occurred while processing your request.";
        });
}
