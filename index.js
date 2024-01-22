const express = require('express');
const https = require('https');
const bodyParser = require('body-parser');
const mapboxgl = require('mapbox-gl');
const api = "ded43f556692a549ddcaeb57f76e48c9";
const newsApiKey = '7361d494737b4842af46de48d7f18efe';
const exchangeRateApiKey = '47c235dc2ff646eb84df0027158a209c';

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get("/", function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.get("/front.js", function (req, res) {
    res.sendFile(__dirname + '/front.js', { headers: { 'Content-Type': 'application/javascript' } });
});

app.post("/", function (req, res) {
    const city = req.body.city;
    const extended = req.body.extended === 'true';
    let weatherUrl = "https://api.openweathermap.org/data/2.5/weather?q=" + city + "&appid=" + api + "&units=metric";
    let newsUrl = "https://newsapi.org/v2/everything?q=" + city + "&apiKey=" + newsApiKey;
    let exchangeRateUrl = `https://open.er-api.com/v6/latest/KZT?apikey=${exchangeRateApiKey}`;

    if (extended) {
        weatherUrl = "https://api.openweathermap.org/data/2.5/forecast/daily?q=" + city + "&appid=" + api + "&units=metric&cnt=14";
    }
    Promise.all([
        fetchData(weatherUrl),
        fetchData(newsUrl),
        fetchData(exchangeRateUrl)
    ]).then(([weatherData, newsData, exchangeRateData]) => {
        const responseData = {
            weather: extended ? extendedWeather(weatherData) : currentWeather(weatherData),
            news: newsData.articles,
            exchangeRates: exchangeRateData
        };
        res.json(responseData);
    }).catch(error => {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    });
});

function fetchData(url) {
    return new Promise((resolve, reject) => {
        https.get(url, function (response) {
            let data = '';
            response.on("data", function (chunk) {
                data += chunk;
            });
            response.on("end", function () {
                try {
                    resolve(JSON.parse(data));
                } catch (parseError) {
                    reject(parseError);
                }
            });
        }).on('error', function (error) {
            reject(error);
        });
    });
}

function currentWeather(weatherData) {
    return {
        lat: weatherData.coord.lat,
        lon: weatherData.coord.lon,
        temp: weatherData.main.temp,
        humidity: weatherData.main.humidity,
        pressure: weatherData.main.pressure,
        windSpeed: weatherData.wind.speed,
        country: weatherData.sys.country,
        rainVolume: weatherData.rain ? weatherData.rain['3h'] : 0,
        description: weatherData.weather[0].description,
        icon: weatherData.weather[0].icon
    };
}

function extendedWeather(weatherData) {
    return weatherData.list.map(item => {
        return {
            temp: item.main.temp,
            humidity: item.main.humidity,
            pressure: item.main.pressure,
            windSpeed: item.wind.speed,
            country: item.sys.country,
            rainVolume: item.rain ? item.rain['3h'] : 0,
            description: item.weather[0].description,
            icon: item.weather[0].icon,
            date: item.dt_txt,
            maxTemp: item.main.temp_max,
            minTemp: item.main.temp_min,
            windDirection: item.wind.deg,
            sunrise: item.sys.sunrise,
            sunset: item.sys.sunset
        };
    });
}

app.listen(3000, function () {
    console.log("Server is running on 3000 port");
});
