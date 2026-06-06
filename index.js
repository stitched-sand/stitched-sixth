const form = document.querySelector(".search__form");

form.addEventListener("submit", function(event){
    event.preventDefault();

    const query =
        document.querySelector("#site-search").value.trim();

    if (!query) return;

    window.location.href = `browse.html?q=${query}`;
});