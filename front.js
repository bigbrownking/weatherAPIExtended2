$(document).ready(function () {
    mapboxgl.accessToken = 'pk.eyJ1IjoicGF3bi10by1raW5nIiwiYSI6ImNscm4xZWNycDAwbHUyam1pYXFwY2w5YjEifQ.biJBx5TRtjS2oRyZJhOHSQ';

    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [0, 0],
        zoom: 1
    });

    $('#search-form').submit(function (event) {
        event.preventDefault();
        const city = $('#search').val();
        const extended = $('#extended').prop('checked');

        clearData();

        $.post('/', { city, extended }, function (data) {
            if (data.weather instanceof Array) {
                displayExtendedWeather(data.weather, map);
            } else {
                displayCurrentWeather(data.weather, map);
            }
        });
    });

    $('#news-button').click(function () {
        clearData();

        const city = $('#search').val();
        const newsApiKey = '7361d494737b4842af46de48d7f18efe';
        const newsApiUrl = "https://newsapi.org/v2/everything?q=" + city + "&apiKey=" + newsApiKey;

        $.get(newsApiUrl, function (newsData) {
            displayNewsArticles(newsData.articles);
        });
    });

    $('#currency').click(function () {
        clearData();

        const currencyCode = 'KZT';
        const exchangeRateApiKey = '47c235dc2ff646eb84df0027158a209c';

        $.get(`https://open.er-api.com/v6/latest/${currencyCode}?apikey=${exchangeRateApiKey}`, function (exchangeRateData) {
            displayExchangeRates(exchangeRateData);
        }).fail(function (error) {
            console.error('Error fetching exchange rates:', error);
            $('#currency-info').html('<p>Error: Unable to retrieve exchange rates for the specified currency.</p>');
        });
    });

    function clearData() {
        $('#weather-info').empty();
        $('#news-info').empty();
        $('#currency-info').empty();
    }

    function displayNewsArticles(articles) {
        $('#news-info').html('<h2>Latest News</h2>');
        const newsListHtml = `
            <ul>
                ${articles.slice(0, 5).map(article => `
                    <li>
                        <strong>${article.title}</strong>
                        <p>${article.description}</p>
                        <a href="${article.url}" target="_blank">Read more</a>
                    </li>
                `).join('')}
            </ul>
        `;
        $('#news-info').append(newsListHtml);
    }

    function displayExchangeRates(exchangeRates) {
        $('#currency-info').html('<h2>Exchange Rates</h2>');
        const tableHtml = `
            <table>
                <thead>
                    <tr>
                        <th>Currency</th>
                        <th>Rate (KZT)</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(exchangeRates.rates).map(([currency, rate]) => `
                        <tr>
                            <td>${currency}</td>
                            <td>${(1 / rate).toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        $('#currency-info').append(tableHtml);
    }

    function displayCurrentWeather(data, map) {
        const { lat, lon, temp, humidity, pressure, windSpeed, country, rainVolume, description, icon } = data;

        map.setZoom(7);
        map.setCenter([lon, lat]);

        new mapboxgl.Marker()
            .setLngLat([lon, lat])
            .addTo(map);

        $('#weather-info').html(`
            <h2>Weather Information</h2>
            <table>
                <tr>
                    <td><strong>Coordinates:</strong></td>
                    <td>${lat.toFixed(2)}, ${lon.toFixed(2)}</td>
                </tr>
                <tr>
                    <td><strong>Temperature:</strong></td>
                    <td>${temp.toFixed(1)}°C</td>
                </tr>
                <tr>
                    <td><strong>Humidity:</strong></td>
                    <td>${humidity}%</td>
                </tr>
                <tr>
                    <td><strong>Pressure:</strong></td>
                    <td>${pressure} hPa</td>
                </tr>
                <tr>
                    <td><strong>Wind Speed:</strong></td>
                    <td>${windSpeed} m/s</td>
                </tr>
                <tr>
                    <td><strong>Country:</strong></td>
                    <td>${country}</td>
                </tr>
                <tr>
                    <td><strong>Rain Volume:</strong></td>
                    <td>${rainVolume} mm</td>
                </tr>
                <tr>
                    <td><strong>Description:</strong></td>
                    <td>${description}</td>
                </tr>
            </table>
            <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="Weather Icon">
        `);
    }

    function displayExtendedWeather(data, map) {
        $('#weather-info').html('<h2>Extended Weather Forecast</h2>');
        const tableHtml = `
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Max Temperature (°C)</th>
                        <th>Min Temperature (°C)</th>
                        <th>Humidity (%)</th>
                        <th>Pressure (hPa)</th>
                        <th>Wind Speed (m/s)</th>
                        <th>Rain Volume (mm)</th>
                        <th>Sunrise Time</th>
                        <th>Sunset Time</th>
                        <th>Description</th>
                        <th>Weather Icon</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(dayData => `
                        <tr>
                            <td>${dayData.date}</td>
                            <td>${dayData.maxTemp.toFixed(1)}</td>
                            <td>${dayData.minTemp.toFixed(1)}</td>
                            <td>${dayData.humidity}%</td>
                            <td>${dayData.pressure}</td>
                            <td>${dayData.windSpeed}</td>
                            <td>${dayData.rainVolume}</td>
                            <td>${dayData.sunrise}</td>
                            <td>${dayData.sunset}</td>
                            <td>${dayData.description}</td>
                            <td><img src="https://openweathermap.org/img/wn/${dayData.icon}@2x.png" alt="Weather Icon"></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        $('#weather-info').append(tableHtml);
    }
});
