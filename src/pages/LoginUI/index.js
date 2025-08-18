import React, { Component } from 'react';
import './style.module.css';

class LogUI extends Component {
  constructor(props) {
    super(props);
    this.state = {
      username: '',
      password: ''
    };
  }

  handleChange = (event) => {
    this.setState({ [event.target.name]: event.target.value });
  }

  handleSubmit = (event) => {
    event.preventDefault();
    console.log('Login submitted:', this.state);
    // Here you can call API or authentication logic
  }

  render() {
    return (
      <div className="login-container">
        <h2>Login</h2>
        <form onSubmit={this.handleSubmit}>
          <div className="form-group">
            <label>Username:</label>
            <input
              type="text"
              name="username"
              value={this.state.username}
              onChange={this.handleChange}
              placeholder="Enter username"
              required
            />
          </div>

          <div className="form-group">
            <label>Password:</label>
            <input
              type="password"
              name="password"
              value={this.state.password}
              onChange={this.handleChange}
              placeholder="Enter password"
              required
            />
          </div>

          <button type="submit">Login</button>
        </form>
      </div>
    );
  }
}

export default LogUI;


/* import React from 'react';
import css from './style.module.css';
const LoginUI = () => (
  <div className={css.LoginUI}>
   </div>
);
export default LoginUI; */