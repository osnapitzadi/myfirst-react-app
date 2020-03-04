import React from 'react';

class Weather extends React.Component {

    render() {
      return (
        <div>
          {this.props.city && 
            <div>
              <p>Location: {this.props.city}, {this.props.country}</p>
              <p>Temperature: {this.props.temp} C°</p>
              <p>Feels like: {this.props.feel} C°</p>
              <p>Pressure: {this.props.pressure}</p>
              <p>Sunset: {this.props.sunset}</p>
            </div>
          }
        </div>
      );
    }

}

export default Weather;