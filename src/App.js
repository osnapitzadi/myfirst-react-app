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
    pressure: undefined,
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

      var sunset = data.sys.sunset;
      var date = new Date();
      console.log(date)
      date.setTime(sunset*1000);
      var sunset_date = date.getHours() + ":" + date.getMinutes();
      console.log(sunset_date)

      this.setState({
        temp: data.main.temp,
        city: data.name,
        country: data.sys.country,
        pressure: data.main.pressure,
        feel: data.main.feels_like,
        sunset: sunset_date,
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
        pressure={this.state.pressure}
        sunset={this.state.sunset}
        error={this.state.error}
      /> 
    </div>
  );
  }
}

export default App; 