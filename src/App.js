import React from "react";  
import Info from "./components/info"
import Form from "./components/form"
import Weather from "./components/weather"

const API_KEY = "4c61b270f69a9186e3fb5ed85b49925b";


class App extends React.Component {

  
  state = {
    temp: undefined,
    city: undefined,
    country: undefined,
    feel: undefined,
    sunset: undefined,
    error: undefined
  }

  gettingWeather = async (e) => {
    
    e.preventDefault();
    var CITY = e.target.elements.city.value;

    if (CITY) {
      const api_url = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${CITY}&appid=${API_KEY}&units=metric`);
      const data = await api_url.json();
      console.log(data);

      this.setState({
        tepm: data.main.temp,
        city: data.name,
        country: data.sys.country,
        feel: data.main.feel,
        sunset: data.sys.sunset,
        error: ""
      });
    }
  }

  render () {
  return (
    <div>
      <Info />
      <Form weatherMethod = {this.gettingWeather}/>
      <Weather 
      temp={this.state.temp}
      city={this.state.city}
      country={this.state.country}
      feel={this.state.feel}
      sunset={this.state.sunset}
      error={this.state.error}
      /> 
    </div>
  );
  }
}

export default App; 