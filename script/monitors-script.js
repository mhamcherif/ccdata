// DONE: Add link to slack channel -> https://cryptocompare.slack.com/archives/<slack_channel_id>
// Or even better https://cryptocompare.slack.com/archives/<slack_channel_name>

// TODO: Add link to argocd -> https://argocd.prod.epic-robot.club/applications/<app_name>
// e.g. https://argocd.prod.epic-robot.club/applications/qa-orderbook-vs-trade
fetch('script/monitors.json')
    .then(response => response.json())
    .then(data => {
        const monitorsTableBody = document.getElementById('monitorsTableBody');
        data.monitors.forEach(monitor => {
            const row = document.createElement('tr');
            const nameCell = document.createElement('td');
            nameCell.textContent = monitor.name;
            row.appendChild(nameCell);
            const descriptionCell = document.createElement('td');
            descriptionCell.textContent = monitor.description;
            row.appendChild(descriptionCell);
            const slackCell = document.createElement('td');
            const slackLink = document.createElement('a');
            slackLink.href = `https://cryptocompare.slack.com/archives/${monitor.slack}`;
            slackLink.textContent = monitor.slack;
            slackCell.appendChild(slackLink);
            row.appendChild(slackCell);
            const scheduleCell = document.createElement('td');
            scheduleCell.textContent = monitor.schedule;
            row.appendChild(scheduleCell);
            const authorsCell = document.createElement('td');
            authorsCell.textContent = monitor.authors.join(', ');
            row.appendChild(authorsCell);
            monitorsTableBody.appendChild(row);
        });
    });
