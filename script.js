document.getElementById('weatherForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const cityName = document.getElementById('cityInput').value;
    fetchWeather(cityName);
});

const API_URL = "https://api.open-meteo.com/v1/forecast";
let weatherChart; // Variabile globale per il grafico

async function fetchWeather(city) {
    const weatherResults = document.getElementById('weatherResults');
    weatherResults.innerHTML = '<p>Caricamento...</p>';

    try {
        const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}`);
        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            weatherResults.innerHTML = '<p>Città non trovata. Riprova.</p>';
            return;
        }

        const { latitude, longitude, name, country } = geoData.results[0];

        const weatherResponse = await fetch(
            `${API_URL}?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max&current_weather=true&timezone=auto`
        );
        const weatherData = await weatherResponse.json();

        displayWeatherWithChartAndForecast(weatherData, name, country);
    } catch (error) {
        weatherResults.innerHTML = '<p>Errore nel recupero dei dati. Riprova più tardi.</p>';
        console.error(error);
    }
}

function displayWeatherWithChartAndForecast(data, city, country) {
    const weatherResults = document.getElementById('weatherResults');
    weatherResults.innerHTML = '';

    const currentWeather = data.current_weather;
    const daily = data.daily;

    function getBackgroundColor(precipitation) {
        if (precipitation === 0) {
            return 'linear-gradient(to bottom, #FFD700, #FFECB3)';
        } else if (precipitation < 10) {
            return 'linear-gradient(to bottom, #ADD8E6, #87CEEB)';
        } else {
            return 'linear-gradient(to bottom, #00008B, #1E90FF)';
        }
    }

    const currentCard = document.createElement('div');
    currentCard.className = 'weather-card col-12 col-md-6 mx-auto';
    currentCard.style.background = getBackgroundColor(currentWeather.precipitation || 0);
    currentCard.innerHTML = `
        <h4>Condizioni attuali a ${city}, ${country}</h4>
        <p><span class="icon">🌡️</span>Temperatura attuale: ${currentWeather.temperature}°C</p>
        <p><span class="icon">🌬️</span>Vento: ${currentWeather.windspeed} km/h</p>
        <p><span class="icon">🌧️</span>Precipitazioni: ${currentWeather.precipitation ?? 'N/A'} mm</p>
    `;
    weatherResults.appendChild(currentCard);

    const chartContainer = document.createElement('div');
    chartContainer.className = 'col-12 mt-4';
    chartContainer.innerHTML = `
        <canvas id="weatherChart" style="max-width: 90%; height: 200px; margin: auto;"></canvas>
    `;
    weatherResults.appendChild(chartContainer);

    const chartContext = document.getElementById('weatherChart').getContext('2d');
    renderChart(chartContext, data.hourly.temperature_2m);

    const dailyContainerTop = document.createElement('div');
    dailyContainerTop.className = 'row justify-content-center mt-4';

    const dailyContainerBottom = document.createElement('div');
    dailyContainerBottom.className = 'row justify-content-center mt-4';

    daily.time.forEach((date, index) => {
        if (index === 0) return;

        const maxTemp = daily.temperature_2m_max[index];
        const minTemp = daily.temperature_2m_min[index];
        const precipitation = daily.precipitation_sum[index];
        const windSpeed = daily.wind_speed_10m_max[index];

        const weatherCard = document.createElement('div');
        weatherCard.className = 'weather-card col-12 col-md-3 p-2';
        weatherCard.style.background = getBackgroundColor(precipitation);
        weatherCard.innerHTML = `
            <h6>${new Date(date).toLocaleDateString()}</h6>
            <p><span class="icon">🌡️</span>Max: ${maxTemp}°C</p>
            <p><span class="icon">❄️</span>Min: ${minTemp}°C</p>
            <p><span class="icon">🌬️</span>Vento: ${windSpeed ?? 'N/A'} km/h</p>
            <p><span class="icon">🌧️</span>Precipitazioni: ${precipitation} mm</p>
        `;

        if (index <= 3) {
            dailyContainerTop.appendChild(weatherCard);
        } else {
            dailyContainerBottom.appendChild(weatherCard);
        }
    });

    weatherResults.appendChild(dailyContainerTop);
    weatherResults.appendChild(dailyContainerBottom);
}

function renderChart(ctx, hourlyTemperatures) {
    if (weatherChart) {
        weatherChart.destroy();
    }

    weatherChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
            datasets: [
                {
                    label: "Temperature (°C)",
                    data: hourlyTemperatures.slice(0, 24),
                    borderColor: "#ffffff",
                    backgroundColor: "rgba(255, 255, 255, 0.3)",
                    fill: true,
                    tension: 0.4,
                },
            ],
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true },
            },
            maintainAspectRatio: false,
        },
    });
}
