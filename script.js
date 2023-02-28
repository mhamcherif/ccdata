function check_cccagg_pair() {
    const fsym = document.getElementById("fsym").value.toUpperCase();
    const tsyms = document.getElementById("tsyms").value.toUpperCase().split(",");

    fetch(`https://min-api.cryptocompare.com/data/v2/cccagg/pairs?fsym=${fsym}`)
        .then(response => response.json())
        .then(response => {
            if (Object.keys(response.Data).length === 0) {
                alert(`The symbol ${fsym} is not included in cccagg.`);
            } else {
                tsyms.forEach(tsym => {
                    fetch(`https://min-api.cryptocompare.com/data/v2/cccagg/pairs?fsym=${fsym}`)
                        .then(response => response.json())
                        .then(response => {
                            const result = document.createElement("li");
                            if (Object.keys(response.Data).length === 0) {
                                result.innerText = `${fsym}/${tsym} ❌`;
                                result.classList.add("red");
                            } else {
                                result.innerText = `${fsym}/${tsym} ✅`;
                                result.classList.add("green");
                            }
                            document.getElementById("results").appendChild(result);
                        })
                        .catch(error => {
                            alert("An error occurred while processing your request.");
                            console.error(error);
                        });
                });
            }
        })
        .catch(error => {
            alert("An error occurred while processing your request.");
            console.error(error);
        });
}
