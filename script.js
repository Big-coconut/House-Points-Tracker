import { GAS_BASE_URL } from "./config.js";

document.addEventListener('DOMContentLoaded', () => {
    const url = GAS_BASE_URL;
    const statsDisplay = document.getElementById('stats-display');

    // Define the house names
    let houseNames = ["SALUS", "FIDES", "VERITAS", "PAX"];

    // Shuffle houses for initial order
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    shuffleArray(houseNames);

    // Store refs for house cards
    const houseCardElements = {};
    const houseScoreElements = {};

    houseNames.forEach(houseName => {
        const houseCard = document.createElement('div');
        houseCard.classList.add('house-card', `house-${houseName.toLowerCase()}`);

        const houseNameElement = document.createElement('div');
        houseNameElement.classList.add('house-name');
        houseNameElement.textContent = houseName;

        const houseScoreElement = document.createElement('div');
        houseScoreElement.classList.add('house-score');
        houseScoreElement.id = houseName;
        houseScoreElement.textContent = '...';

        houseCard.appendChild(houseNameElement);
        houseCard.appendChild(houseScoreElement);
        statsDisplay.appendChild(houseCard);

        houseCardElements[houseName] = houseCard;
        houseScoreElements[houseName] = houseScoreElement;
    });

    // --- API Fetch and Display Functions ---

    async function fetchPointsSummary() {
        const firstPositions = {};
        Object.keys(houseCardElements).forEach(houseName => {
            firstPositions[houseName] = houseCardElements[houseName].getBoundingClientRect();
        });

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();

            const houseDataForSorting = [];
			
			let score;
			
            for (const key in data) {
                const houseName = key.toUpperCase();
				if (data[key] == "?"){
					score = "?";
				} else {
					score = parseInt(data[key], 10);
				}

                const scoreElement = houseScoreElements[houseName];
                const cardElement = houseCardElements[houseName];

                if (scoreElement && cardElement) {
                    scoreElement.textContent = score;
                    houseDataForSorting.push({ name: houseName, score: score, element: cardElement });
                }
            }

            // Only sort if all scores are numbers
			const hasQuestion = houseDataForSorting.some(h => h.score === "?");

			if (!hasQuestion) {
				houseDataForSorting.sort((a, b) => b.score - a.score);
			}


            houseDataForSorting.forEach(house => {
                statsDisplay.appendChild(house.element);
            });

            houseDataForSorting.forEach(({ name, element }) => {
                const lastPosition = element.getBoundingClientRect();
                const firstPosition = firstPositions[name];
                const deltaX = firstPosition.left - lastPosition.left;
                const deltaY = firstPosition.top - lastPosition.top;

                element.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
                element.style.transition = 'transform 0s';

                element.addEventListener('transitionend', () => {
                    element.style.transition = '';
                }, { once: true });
            });

            requestAnimationFrame(() => {
                houseDataForSorting.forEach(({ element }) => {
                    element.style.transition = 'transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)';
                    element.style.transform = '';
                });

                setTimeout(() => {
                    document.querySelector('.container').classList.remove('disable-hover');
                }, 1050);
            });

        } catch (error) {
            console.error('Failed to fetch points summary:', error);
            const statsGrid = document.getElementById('stats-display');
            if (statsGrid) {
                statsGrid.innerHTML = '<p>Failed to load house points.</p>';
            }
        }
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        if (isNaN(date.getTime()) || (dateString && dateString.includes("?"))) {
            return dateString;
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

        const headers = ['Date', 'House', 'Event', 'Description', 'Points'];
        const trHead = document.createElement('tr');
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            trHead.appendChild(th);
        });
        thead.appendChild(trHead);

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
            pointsTd.textContent = entry.Points;
            pointsTd.setAttribute('data-label', 'Points');
            tr.appendChild(pointsTd);

            tbody.appendChild(tr);
        });

        table.appendChild(thead);
        table.appendChild(tbody);
        container.appendChild(table);
    }

    async function fetchLastEntries() {
        try {
            const response = await fetch(url + '?x=8');
            if (!response.ok) throw new Error('Network response was not ok');
            const entries = await response.json();
            createEntriesTable(entries);
        } catch (error) {
            console.error('Failed to fetch entries:', error);
            const container = document.querySelector('.entries');
            if (container) {
                container.textContent = 'Failed to load recent points.';
            }
        }
    }

    // Run both fetches on page load
    fetchPointsSummary();
    fetchLastEntries();
});
