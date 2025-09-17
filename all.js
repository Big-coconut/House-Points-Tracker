import { GAS_BASE_URL } from "./config.js";

document.addEventListener('DOMContentLoaded', () => {
    const url = GAS_BASE_URL;

    function formatDate(dateString) {
        const date = new Date(dateString);
        if (isNaN(date.getTime()) || (dateString && dateString.includes("?"))) {
            return dateString; // fallback for invalid date
        }
        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    function createEntriesTable(entries) {
        const container = document.querySelector('.entries');
        if (!container) return;

        container.innerHTML = '';

        const table = document.createElement('table');
        table.classList.add('entries-table');
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');

        // Headers
        const headers = ['Date', 'House', 'Event', 'Description', 'Points'];
        const trHead = document.createElement('tr');
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            trHead.appendChild(th);
        });
        thead.appendChild(trHead);

        // Rows
        entries.forEach(entry => {
            const tr = document.createElement('tr');

            const dateTd = document.createElement('td');
            dateTd.textContent = formatDate(entry.Date);
            dateTd.setAttribute('data-label', 'Date');
            tr.appendChild(dateTd);

            const houseTd = document.createElement('td');
            houseTd.textContent = entry.House;
            houseTd.setAttribute('data-label', 'House');
            tr.appendChild(houseTd);

            const eventTd = document.createElement('td');
            eventTd.textContent = entry.Event;
            eventTd.setAttribute('data-label', 'Event');
            tr.appendChild(eventTd);

            const descTd = document.createElement('td');
            descTd.textContent = entry.Description;
            descTd.setAttribute('data-label', 'Description');
            tr.appendChild(descTd);

            const pointsTd = document.createElement('td');
			let points = entry.Points;

			// Handle placeholder values
			if (points === "?" || points === undefined || points === null) {
			  pointsTd.textContent = "?";   // or "0" if you prefer numeric
			} else {
			  pointsTd.textContent = points;
			}
			pointsTd.setAttribute('data-label', 'Points');
			tr.appendChild(pointsTd);


            tbody.appendChild(tr);
        });

        table.appendChild(thead);
        table.appendChild(tbody);
        container.appendChild(table);
    }

    async function fetchAllEntries() {
        try {
            const response = await fetch(url + '?all=true');
            if (!response.ok) throw new Error('Network response was not ok');
            let entries = await response.json();

            // --- Apply house filter if set ---
            if (window.houseFilter) {
                entries = entries.filter(entry =>
					entry.House.toUpperCase().includes(window.houseFilter.toUpperCase())
				);
            }

            createEntriesTable(entries);
        } catch (error) {
            console.error('Failed to fetch all entries:', error);
            const container = document.querySelector('.entries');
            if (container) {
                container.textContent = 'Failed to load entries.';
            }
        }
    }

    fetchAllEntries();
});
