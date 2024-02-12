# Weather Map App

## Overview

Weather Map App is a simple web application that allows users to get current weather information, extended weather forecasts, latest news, and exchange rates for a specific city. The application integrates with various APIs to provide valuable data to users.

## Features

- Display current weather information including temperature, humidity, pressure, wind speed, and more.
- Show extended weather forecast for up to 14 days.
- Retrieve and display the latest news articles related to the specified city.
- Provide exchange rates for a specific currency.

## Technologies Used

- Node.js
- Express.js
- Mapbox API for maps
- OpenWeather API for weather data
- News API for news articles
- ExchangeRate-API for exchange rates

## Prerequisites

Before running the application, ensure you have the following installed:

- Node.js: [Download Node.js](https://nodejs.org/)
- npm (Node Package Manager): Included with Node.js installation

## Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd weather-map-app

## API Usage Details

All API's uses it's own api keys to provide some information.
News API returns 5 relevant news for provided city.
ExchangeRate API returns all current currencies.

## Key Design Decisions

### Frontend and Backend Separation

The application is structured with a clear separation between the frontend and backend components. 
This decision allows for better maintainability, scalability, and flexibility. 
The frontend, implemented in `front.js`, handles user interactions and visualizations using Mapbox and jQuery. 
The backend, implemented in `server.js`, manages API requests, data processing, and serves static files.

### Dynamic Display of Data

The application dynamically displays weather information, news articles, and currency exchange rates based on user input. 
This design decision enhances user experience by providing relevant and up-to-date information without requiring page reloads. 
The dynamic updates are achieved through the manipulation of DOM elements in response to API responses.

### Clearing Previous Data

Before making a new request, the application clears previous data from the display. 
This decision ensures that the user receives fresh and relevant information without the clutter of previous search results. 
The `clearData` function in `front.js` is responsible for clearing the weather, news, and currency information.

### Modular Code Structure

The code is organized into modular functions, promoting code reuse, readability, and ease of maintenance. 
Each function has a specific responsibility, such as fetching data, processing data, displaying weather information, and handling errors. 
This design decision supports a more scalable and extensible codebase.
