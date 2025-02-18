import * as Carousel from "./Carousel.js";


const breedSelect = document.getElementById("breedSelect");
const infoDump = document.getElementById("infoDump");
const progressBar = document.getElementById("progressBar");
const getFavouritesBtn = document.getElementById("getFavouritesBtn");


const API_KEY = "live_mFsiSVx3ThUtmCuNFXjdNJfvYTmB0gdVrBUAjZ6ivAqMFNH1MLjXkQnx4wfYYpfL";
axios.defaults.baseURL = "https://api.thecatapi.com/v1";
axios.defaults.headers.common["x-api-key"] = API_KEY;


axios.interceptors.request.use(config => {
    console.log(`Request started: ${config.url}`);
    config.metadata = { startTime: new Date() };
    progressBar.style.width = "0%";
    document.body.style.cursor = "progress";
    return config;
});

axios.interceptors.response.use(response => {
    const timeTaken = new Date() - response.config.metadata.startTime;
    console.log(`Response received (${response.config.url}) in ${timeTaken} ms`);
    progressBar.style.width = "100%";
    setTimeout(() => {
        progressBar.style.width = "0%";
        document.body.style.cursor = "default";
    }, 500);
    return response;
});


async function initialLoad() {
    try {
        const res = await axios.get("/breeds");
        const breeds = res.data;
        breedSelect.innerHTML = breeds.map(breed => `<option value="${breed.id}">${breed.name}</option>`).join("");
        if (breeds.length > 0) {
            loadBreedImages(breeds[0].id);
        }
    } catch (error) {
        console.error("Error loading breeds:", error);
    }
}


async function loadBreedImages(breedId) {
    try {
        Carousel.clear();
        infoDump.innerHTML = "";
        const res = await axios.get(`/images/search?breed_ids=${breedId}&limit=5`, {
            onDownloadProgress: updateProgress
        });
        const images = res.data;
        if (images.length === 0) {
            infoDump.innerHTML = "<p>No images available for this breed.</p>";
            return;
        }
        images.forEach(img => {
            const carouselItem = Carousel.createCarouselItem(img.url, "Cat Image", img.id);
            Carousel.appendCarousel(carouselItem);
        });
        const breedInfo = images[0].breeds[0];
        infoDump.innerHTML = `
            <h3>${breedInfo.name}</h3>
            <p>${breedInfo.description}</p>
            <p><strong>Temperament:</strong> ${breedInfo.temperament}</p>
            <p><strong>Origin:</strong> ${breedInfo.origin}</p>
            <p><strong>Life Span:</strong> ${breedInfo.life_span} years</p>
        `;
        Carousel.start();
    } catch (error) {
        console.error("Error loading breed images:", error);
    }
}


function updateProgress(event) {
    if (event.lengthComputable) {
        const percentComplete = (event.loaded / event.total) * 100;
        progressBar.style.width = `${percentComplete}%`;
    }
}


export async function favourite(imgId) {
    try {
        const favResponse = await axios.post("/favourites", { image_id: imgId });
        console.log("Favorited image:", favResponse.data);
    } catch (error) {
        console.error("Error favoriting image:", error);
    }
}


async function getFavourites() {
    try {
        const res = await axios.get("/favourites");
        const favourites = res.data;
        Carousel.clear();
        infoDump.innerHTML = "<h3>Your Favorites</h3>";
        favourites.forEach(fav => {
            const carouselItem = Carousel.createCarouselItem(fav.image.url, "Favorite Cat", fav.image_id);
            Carousel.appendCarousel(carouselItem);
        });
        Carousel.start();
    } catch (error) {
        console.error("Error getting favourites:", error);
    }
}


breedSelect.addEventListener("change", (e) => {
    loadBreedImages(e.target.value);
});
getFavouritesBtn.addEventListener("click", getFavourites);


initialLoad();
