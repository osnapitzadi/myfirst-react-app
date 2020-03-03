import React from "react";  
import Info from "./components/info"
import Form from "./components/form"
import Weather from "./components/weather"

const API_KEY = "4c61b270f69a9186e3fb5ed85b49925b";
let city = "London";

class App extends React.Component {

  gettingWeather = async (e) => {
    e.preventDefault();
    const api_url = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}`);
    const data = await api_url.json();
    console.log(data)
  }

  render () {
  return (
    <div>
      <Info />
      <Form weatherMethod = {this.gettingWeather}/>
      <Weather /> 
    </div>
  );
  }
}

export default App; 