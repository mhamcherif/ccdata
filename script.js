fetch('./monitors.json')
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
            slackCell.textContent = monitor.slack;
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
