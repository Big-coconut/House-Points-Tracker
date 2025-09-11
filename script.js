import { GAS_BASE_URL } from "./config.js";

fetch(`${GAS_BASE_URL}?action=getData`)
  .then(res => res.json())

document.addEventListener('DOMContentLoaded', () => {
    const url = GAS_BASE_URL;

    const statsDisplay = document.getElementById('stats-display');

    // Define the house names to create initial cards.
    let houseNames = ["SALUS", "FIDES", "VERITAS", "PAX"];

    // Function to shuffle an array in-place (Fisher-Yates shuffle)
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // Randomize the initial order of house cards
    shuffleArray(houseNames);

    // Store references to the house card elements and their score elements
    // This allows us to update scores and reorder cards later.
    const houseCardElements = {};
    const houseScoreElements = {};

    houseNames.forEach(houseName => {
        const houseCard = document.createElement('div');
        houseCard.classList.add('house-card');
        
        // Add specific class based on house name for styling
        const houseClass = `house-${houseName.toLowerCase()}`;
        houseCard.classList.add(houseClass);

        const houseNameElement = document.createElement('div');
        houseNameElement.classList.add('house-name');
        houseNameElement.textContent = houseName;

        const houseScoreElement = document.createElement('div');
        houseScoreElement.classList.add('house-score');
        houseScoreElement.id = houseName; // Assign ID (though we'll use direct references mostly)
        houseScoreElement.textContent = '...'; // Placeholder until data is fetched

        houseCard.appendChild(houseNameElement);
        houseCard.appendChild(houseScoreElement);
        statsDisplay.appendChild(houseCard); // Append initially to create the DOM structure

        // Store references for later manipulation
        houseCardElements[houseName] = houseCard;
        houseScoreElements[houseName] = houseScoreElement;
    });

    // --- API Fetch and Display Functions ---

    async function fetchPointsSummary() {
        // FLIP Animation: First - record initial positions
        const firstPositions = {};
        Object.keys(houseCardElements).forEach(houseName => {
            firstPositions[houseName] = houseCardElements[houseName].getBoundingClientRect();
        });

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json(); // Parse JSON

            const houseDataForSorting = []; // Array to hold {name, score, cardElement} for sorting

            // Update each house points number and collect data for sorting
            for (const key in data) {
                const houseName = key.toUpperCase();
                const score = parseInt(data[key], 10); // Ensure score is a number

                const scoreElement = houseScoreElements[houseName];
                const cardElement = houseCardElements[houseName];

                if (scoreElement && cardElement) {
                    scoreElement.textContent = score; // Update the displayed score on the card
                    houseDataForSorting.push({ name: houseName, score: score, element: cardElement });
                }
            }

            // Sort houses by score in descending order (greatest on the left)
            houseDataForSorting.sort((a, b) => b.score - a.score);

            // FLIP Animation: Last - Reorder the DOM to get final positions
            // The appendChild method moves the elements to the end of the container,
            // effectively re-ordering them according to the sorted array.
            houseDataForSorting.forEach(house => {
                statsDisplay.appendChild(house.element);
            });

            // FLIP Animation: Invert & Play
            houseDataForSorting.forEach(({ name, element }) => {
                const lastPosition = element.getBoundingClientRect();
                const firstPosition = firstPositions[name];

                // Calculate the difference between the initial and final positions
                const deltaX = firstPosition.left - lastPosition.left;
                const deltaY = firstPosition.top - lastPosition.top;

                // Invert: Apply a transform to move the element back to its starting
                // position without animation.
                element.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
                element.style.transition = 'transform 0s';

                // Add a listener to clean up inline styles after the animation completes
                element.addEventListener('transitionend', () => {
                    element.style.transition = '';
                }, { once: true });
            });

            // Play: In the next frame, add the transition and remove the transform.
            // This causes the cards to animate smoothly to their new, final positions.
            requestAnimationFrame(() => {
                houseDataForSorting.forEach(({ element }) => {
                    element.style.transition = 'transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)';
                    element.style.transform = '';
                });

                // Set a timeout to enable hover effects after the animation (800ms)
                // plus an additional 250ms delay as requested.
                setTimeout(() => {
                    document.querySelector('.container').classList.remove('disable-hover');
                }, 800 + 250);
            });

        } catch (error) {
            console.error('Failed to fetch points summary:', error);
            // Optionally, display an error message on the page
            const statsGrid = document.getElementById('stats-display');
            if (statsGrid) {
                statsGrid.innerHTML = '<p>Failed to load house points.</p>';
            }
        }
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        // Check for invalid date (NaN for date.getTime()) or specific placeholder string
        if (isNaN(date.getTime()) || (dateString && dateString.includes("?"))) {
            return dateString;      // fallback for invalid date like "4/?/24"
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

        container.innerHTML = ''; // Clear previous content

        const table = document.createElement('table');
        table.classList.add('entries-table'); // Add class for styling
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

            // Date formatted
            const dateTd = document.createElement('td');
            dateTd.textContent = formatDate(entry.Date);
            dateTd.setAttribute('data-label', 'Date'); // For responsive table styling
            tr.appendChild(dateTd);

            // House
            const houseTd = document.createElement('td');
            houseTd.textContent = entry.House;
            houseTd.setAttribute('data-label', 'House');
            tr.appendChild(houseTd);

            // Event
            const eventTd = document.createElement('td');
            eventTd.textContent = entry.Event;
            eventTd.setAttribute('data-label', 'Event');
            tr.appendChild(eventTd);

            // Description
            const descTd = document.createElement('td');
            descTd.textContent = entry.Description;
            descTd.setAttribute('data-label', 'Description');
            tr.appendChild(descTd);

            // Points
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

    async function fetchLastFiveEntries() {
        try {
            const response = await fetch(url + '?x=8'); // Assuming '?x=8' is the parameter for last entries
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
    fetchLastFiveEntries();
});