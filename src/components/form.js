import React from 'react';

class Form extends React.Component {

    render() {
      return (
        <form onSubmit={this.props.weatherMethod}>
            <input type="text" name="city" placeholder="Enter your city"/>
            <button >Submsqdqsit</button>
            
        </form>
      );
    }

}

export default Form;