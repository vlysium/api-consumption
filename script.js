"use strict";

import { API_KEY } from "./config.js";
/* inside config.js
const API_KEY = {
  "OPENWEATHERMAP": string,
  "MAPBOX": string,
  "TICKETMASTER": string
}
*/

// https://www.npmjs.com/package/latlon-geohash
import Geohash from 'https://cdn.jsdelivr.net/npm/latlon-geohash@2.0.0' // latitude longitude converter for geoPoint query parameter for TicketMaster

// initiate function on window load
document.addEventListener("DOMContentLoaded", () => {

  const input = {
    "query": "",
    "latitude": 0,
    "longitude": 0,
    "geohash": "",
    "countryCode": ""
  };

  const output = {
    "openweathermap": {},
    "mapbox": "",
    "ticketmaster": []
  };

  const form = document.querySelector("#form");
  form.addEventListener("submit", submitForm);

  // on form submit
  async function submitForm(e) {
    e.preventDefault();
    
    const rawQuery = this.search.value.trim(); // input value from the form

    const cleanedQuery = prettifyName(rawQuery);

    input.query = cleanedQuery;

    await convertGeoCoordinates(input.query);

    convertGeohash(input.latitude, input.longitude);

    await getAllData(input); // wait for the promise to resolve in convertGeoCoordinates

    this.reset();
  }

  // modify the string by capitalizing each letter after a space
  function prettifyName(string) {
    // split the input string into words using space as a separator
    const words = string.split(" ");

    // capitalize the first letter of each word
    const capitalizedWords = words.map(word => {
      if (word.length > 0) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      } else {
        return "";
      }
    });

    // join the capitalized words back together with spaces
    const cleanedQuery = capitalizedWords.join(" ");

    return cleanedQuery;
  }

  // convert to latitude and longitude values using OpenWeatherMap api
  async function convertGeoCoordinates(query) {
    try {
      const response = await fetch(`http://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=1&appid=${API_KEY.OPENWEATHERMAP}`, { method: "GET" });

      const [obj] = await response.json();

      input.latitude = obj.lat.toFixed(3);
      input.longitude = obj.lon.toFixed(3);

    } catch (error) {
      console.error(error);
    }
  }

  // geoPoint query parameter is more reliable than the city query parameter to search for events
  function convertGeohash(latitude, longitude) {
    input.geohash = Geohash.encode(latitude, longitude, 4); // (latitude, longitude, precision)
  }

  // get data from OpenWeatherMap
  async function getOpenWeatherMapData({ latitude, longitude }) {
    try {
      const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${API_KEY.OPENWEATHERMAP}`, { method: "GET" });
      const data = await response.json();

      input.countryCode = data.sys.country; // retrieve country code for query parameter filtering for TicketMaster

      return data;

    } catch (error) {
      console.error(error);
    }
  }

  // get image url from MapBox
  function getMapBoxData({ latitude, longitude }) {
    try {
      return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${longitude},${latitude},8,0/512x512?access_token=${API_KEY.MAPBOX}`;
    } catch (error) {
      console.error(error);
    }
  }

  // get data from TicketMaster
  async function getTicketMasterData({ geohash, countryCode }) {
    try {
      const response = await fetch(`https://app.ticketmaster.com/discovery/v2/events.json?size=10&geoPoint=${geohash}&unit=km&sort=distance,date,asc&countryCode=${countryCode}&apikey=${API_KEY.TICKETMASTER}`, { method: "GET" });
      const data = await response.json();

      const filteredData = data._embedded?.events ?? []; // get the relevant data only if there are events

      return filteredData;

    } catch (error) {
      console.error(error);
    }
  }

  // get all data from the api's
  async function getAllData(input) {
    output.openweathermap = await getOpenWeatherMapData(input);
    output.mapbox = getMapBoxData(input);
    output.ticketmaster = await getTicketMasterData(input);

    displayData(output);
  }

  function displayData({openweathermap, mapbox, ticketmaster}) {
    console.log(input);
    console.log(output);

    const forecastBox = document.querySelector("#display");
    if (!forecastBox.classList.contains("active")) {
      forecastBox.classList.add("active");
    }

    // OpenWeatherMap

    const cityName = document.querySelector("#city-name");
    cityName.textContent = `${input.query} - ${input.countryCode}`;

    const weather = document.querySelector("[data-forecast=\"weather\"]");
    const weatherText = openweathermap.weather[0].description;
    weather.textContent = weatherText.charAt(0).toUpperCase()+ weatherText.slice(1);

    const temperature = document.querySelector("[data-forecast=\"temperature\"]");
    temperature.innerHTML = `Temperature: ${openweathermap.main.temp} &deg;C`;

    const humidity = document.querySelector("[data-forecast=\"humidity\"]");
    humidity.textContent = `Humidity: ${openweathermap.main.humidity}%`;

    const wind = document.querySelector("[data-forecast=\"wind\"]");
    wind.textContent = `Wind speed: ${openweathermap.wind.speed} m/s`;

    const pressure = document.querySelector("[data-forecast=\"pressure\"]");
    pressure.textContent = `Pressure: ${openweathermap.main.pressure} hPa`;

    // MapBox

    const mapImg = document.querySelector("#map");
    mapImg.setAttribute("src", mapbox);
    mapImg.setAttribute("alt", input.query);

    // TicketMaster

    const eventList = document.querySelector("#event-list"); // parent element for the events
    const eventTemplate = document.querySelector("#event-template"); // template fragment for event
    
    if (ticketmaster.length > 0) {
      eventList.innerHTML = "";
    } else {
      eventList.textContent = `No events available in ${input.query}`;
    }

    if (ticketmaster) {
      ticketmaster.forEach((ticketmasterEvent) => {
        const eventClone = document.importNode(eventTemplate.content, true);

        const eventAnchorClone = eventClone.querySelector("a");
        eventAnchorClone.setAttribute("href", ticketmasterEvent.url);
        eventAnchorClone.setAttribute("title", ticketmasterEvent.name);
  
        const eventNameClone = eventClone.querySelector("[data-event=\"name\"]");
        eventNameClone.textContent = ticketmasterEvent.name;

        // ! the venue address is possibly unrelated to the event address, I don't know ¯\_(ツ)_/¯
        const eventAddressClone = eventClone.querySelector("[data-event=\"address\"]");
        eventAddressClone.textContent = ticketmasterEvent._embedded.venues[0].address.line1;

        const eventTimeClone = eventClone.querySelector("[data-event=\"time\"]");
        eventTimeClone.textContent = `${ticketmasterEvent.dates.start.localDate} ${ticketmasterEvent.dates.start.localTime ?? ""}`.trim();
  
        eventList.appendChild(eventClone);
      })
    }
  }

});