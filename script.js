"use strict";

import { API_KEY } from "./config.js";
/* inside config.js
const API_KEY = {
  "OPENWEATHERMAP": string,
  "MAPBOX": string,
  "TICKETMASTER": string
}
*/

// initiate function on window load
document.addEventListener("DOMContentLoaded", () => {

  const input = { "query": "", "latitude": 0, "longitude": 0 };
  const output = {
    "openweathermap": [],
    "mapbox": [],
    "ticketmaster": []
  };

  const form = document.querySelector("#form");
  form.addEventListener("submit", submitForm);

  // on form submit
  function submitForm(e) {
    e.preventDefault();
    
    input.query = this.search.value; // input value from the form
    //console.log(input.query);

    getGeoCoordinates(input.query);
  }

  // convert to latitude and longitude values using OpenWeatherMap api
  async function getGeoCoordinates(query) {
    try {
      const response = await fetch(`http://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=1&appid=${API_KEY.OPENWEATHERMAP}`, { method: "GET" });
      const [obj] = await response.json(); // destructuring array

      input.latitude = obj.lat;
      input.longitude = obj.lon;
    } catch (error) {
      console.error(error);
    }
  }

});