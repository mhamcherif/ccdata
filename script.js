function check_cccagg_pair() {
    const fsym = document.getElementById("fsym").value.toUpperCase();
    const tsyms = document.getElementById("tsyms").value.toUpperCase().split(",").map(tsym => tsym.trim());
    const url = `https://min-api.cryptocompare.com/data/v2/cccagg/pairs?fsym=${fsym}`;

    fetch(url)
        .then(response => response.json())
        .then(response => {
            if (Object.keys(response.Data).length === 0) {
                document.getElementById("result").innerHTML = `<span style="color:red">&#x2718; ${fsym} is not currently included in CCCAGG.</span>`;
            } else {
                if (tsyms.join("") === "") {
                    console.info(tsyms);
                    document.getElementById("result").innerHTML = `<span style="color:green">&#x2714; ${fsym}: [${Object.keys(response.Data.tsyms).join(", ")}]</span>`;
                } else {
                    const pairs = [];
                    console.info(tsyms);
                    for (const tsym of tsyms) {
                        if (tsym in response.Data.tsyms) {
                            pairs.push(`<span style="color:green">&#x2714; ${fsym}/${tsym}</span>`);
                        } else {
                            pairs.push(`<span style="color:red">&#x2718; ${fsym}/${tsym}</span>`);
                        }
                    }
                    document.getElementById("result").innerHTML = pairs.join("<br>");
                }
            }
        })
        .catch(error => {
            console.error(error);
            document.getElementById("result").innerHTML = '<span style="color:red">An error occurred while processing your request.</span>';
        });
}

function clear_result() {
    document.getElementById("result").innerHTML = "";
}