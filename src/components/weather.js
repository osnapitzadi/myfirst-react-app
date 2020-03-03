import React from 'react';

class Weather extends React.Component {

    render() {
      return (
        <div>
          {this.props.city && 
            <div>
              <p>Location: {this.props.city}, {this.props.country}</p>
              <p>Temperature: {this.props.temp}</p>
              <p>Feels like: {this.props.feel}</p>
              <p>Sunset: {this.props.sunset}</p>
            </div>
          }
        </div>
      );
    }

}

export default Weather;