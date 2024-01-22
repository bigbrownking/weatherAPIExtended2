const express = require('express')
const https = require('https')
const bodyParser = require('body-parser')
const mapboxgl = require('mapbox-gl')
const api = "ded43f556692a549ddcaeb57f76e48c9";

const app = express()
app.use(bodyParser.urlencoded({extended:true}))
app.use(express.static('public'));

app.get("/", function(req, res){
    res.sendFile(__dirname + '/index.html');
});

app.get("/front.js", function (req, res) {
    res.sendFile(__dirname + '/front.js', { headers: { 'Content-Type': 'application/javascript' } });
});


app.post("/", function(req, res){
    const city = req.body.city;
    const extended = req.body.extended === 'true';
    let url = "https://api.openweathermap.org/data/2.5/weather?q=" + city + "&appid=" + api + "&units=metric";
    if(extended){
        url = "https://api.openweathermap.org/data/2.5/forecast/daily?q=" + city + "&appid=" + api + "&units=metric&cnt=14";
    }
    https.get(url, function(response){
        response.on("data", function(data){
            const weatherData = JSON.parse(data)
            if(extended){
                responseData = extendedWeather(weatherData);
            }else{
                responseData = currentWeather(weatherData);
            }
            console.log(responseData);
            res.json(responseData);
        })
    })
});

function currentWeather(weatherData){
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
app.listen(3000, function(){
    console.log("Server is running on 3000 port");
})
