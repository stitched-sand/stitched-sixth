const form = document.querySelector(".search__form");
const statusText = document.querySelector(".search__status");
const artworksContainer = document.querySelector(".artworks");
const sortSelect = document.querySelector("#sort-select");

const params = new URLSearchParams(window.location.search);
const initialQuery = params.get("q"); // from homepage

let currentArtworks = [];
let loadingIndex = 0;
let loadingInterval;

/* ---------------------------
   LOADING STATES
---------------------------- */

const loadingStates = [
    "QUERYING MET ARCHIVE...",
    "Dusting off the frames...",
    "Removing 300 years of yellowed varnish...",
    "Convincing the digital night guard not to turn off the lights...",
    "Waiting for Dali's clocks to melt..."
];

function startLoadingAnimation() {
    loadingIndex = 0;
    statusText.textContent = loadingStates[0];

    loadingInterval = setInterval(() => {
        loadingIndex = (loadingIndex + 1) % loadingStates.length;
        statusText.textContent = loadingStates[loadingIndex];
    }, 1200);
}

function stopLoadingAnimation(text) {
    clearInterval(loadingInterval);
    statusText.textContent = text;
}

/* ---------------------------
   RENDER FUNCTION
---------------------------- */

function renderArtworks(artworks) {
    const html = artworks.map(artwork => {
        return `
            <div class="artwork">
                <img 
                    src="${artwork.primaryImageSmall}"
                    alt="${artwork.title}"
                    class="artwork__img"
                />
                <div class="artwork__info">
                    <h3>${artwork.title}</h3>
                    <p>${artwork.artistDisplayName}</p>
                    <p>${artwork.objectDate}</p>
                </div>
            </div>
        `;
    });

    artworksContainer.innerHTML = html.join("");
}

/* ---------------------------
   CORE SEARCH FUNCTION
---------------------------- */

async function searchArtworks(query) {
    if (!query) return;

    artworksContainer.innerHTML = "";
    startLoadingAnimation();

    try {
        const res = await fetch(
            `https://collectionapi.metmuseum.org/public/collection/v1/search?q=${query}`
        );

        const data = await res.json();

        if (!data.objectIDs || data.objectIDs.length === 0) {
            stopLoadingAnimation("NO RECORDS FOUND");
            return;
        }

        const artworks = [];
        let index = 0;

        while (artworks.length < 6 && index < data.objectIDs.length) {
            const id = data.objectIDs[index];

            try {
                const res = await fetch(
                    `https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`
                );

                const artwork = await res.json();

                if (artwork.primaryImageSmall) {
                    artworks.push(artwork);
                }
            } catch (err) {
                console.log("Skipping:", id);
            }

            index++;
        }

        currentArtworks = artworks;

        renderArtworks(currentArtworks);

        stopLoadingAnimation(
            `${data.total} RECORDS FOUND • DISPLAYING ${artworks.length}`
        );

    } catch (err) {
        console.error(err);
        stopLoadingAnimation("ERROR LOADING DATA");
    }
}

/* ---------------------------
   SORTING
---------------------------- */

sortSelect.addEventListener("change", function () {
    if (sortSelect.value === "title-asc") {
        currentArtworks.sort((a, b) =>
            a.title.localeCompare(b.title)
        );
    } else if (sortSelect.value === "title-desc") {
        currentArtworks.sort((a, b) =>
            b.title.localeCompare(a.title)
        );
    } else if (sortSelect.value === "date-new") {
        currentArtworks.sort((a, b) =>
            b.objectBeginDate - a.objectBeginDate
        );
    } else if (sortSelect.value === "date-old") {
        currentArtworks.sort((a, b) =>
            a.objectBeginDate - b.objectBeginDate
        );
    }

    renderArtworks(currentArtworks);
});

/* ---------------------------
   FORM SEARCH
---------------------------- */

form.addEventListener("submit", function (e) {
    e.preventDefault();

    const q = document.querySelector("#site-search").value.trim();
    searchArtworks(q);
});

/* ---------------------------
   AUTO SEARCH FROM HOMEPAGE
---------------------------- */

if (initialQuery) {
    searchArtworks(initialQuery);
}