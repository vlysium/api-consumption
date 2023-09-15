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

  const input = { "query": "", "latitude": 0, "longitude": 0, "geohash": "" };
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
    
    input.query = this.search.value; // input value from the form
    //console.log(input.query);

    await convertGeoCoordinates(input.query);

    convertGeohash(input.latitude, input.longitude);

    await getAllData(input); // wait for the promise to resolve in convertGeoCoordinates
  }

  // convert to latitude and longitude values using OpenWeatherMap api
  async function convertGeoCoordinates(query) {
    try {
      const response = await fetch(`http://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=1&appid=${API_KEY.OPENWEATHERMAP}`, { method: "GET" });

      const [obj] = await response.json();

      input.latitude = obj.lat;
      input.longitude = obj.lon;

    } catch (error) {
      console.error(error);
    }
  }

  // geoPoint query parameter is more reliable than the city query parameter to search for events
  function convertGeohash(latitude, longitude) {
    input.geohash = Geohash.encode(latitude, longitude, 3); // (latitude, longitude, precision)
  }

  // get data from OpenWeatherMap
  async function getOpenWeatherMapData({ latitude, longitude }) {
    try {
      const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY.OPENWEATHERMAP}`, { method: "GET" });
      const data = await response.json();

      return data;

    } catch (error) {
      console.error(error);
    }
  }

  // get image url from MapBox
  function getMapBoxData({ latitude, longitude }) {
    try {
      return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${longitude},${latitude},8,0/360x280?access_token=${API_KEY.MAPBOX}`;
    } catch (error) {
      console.error(error);
    }
  }

  // get data from TicketMaster
  async function getTicketMasterData({ geohash }) {
    try {
      const response = await fetch(`https://app.ticketmaster.com/discovery/v2/events.json?size=10&geoPoint=${geohash}&apikey=${API_KEY.TICKETMASTER}&sort=distance,date,asc`, { method: "GET" });
      const data = await response.json();

      const filteredData = data._embedded.events;

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

  function displayData() {

  }

});