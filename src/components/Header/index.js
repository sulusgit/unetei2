import React from 'react';
import css from './style.module.css';

const Header = ({ onLoginClick }) => (
  <header className={css.Header}>
    <div className={css.Logo}>UNEGUI.CLONE</div>
    <input
      type="text"
      placeholder="Хайх......."
      className={css.SearchBar}
    />
    <button className={css.LoginBtn} onClick={onLoginClick}>
      Нэвтрэх
    </button>
  </header>
);

export default Header;

/* import LoginUI from '../../pages/LoginUI';  */// Adjust the path if needed
/* class ShowLoginButton extends Component {
  render() {
    return (
      <button onClick={this.props.onClick}>
        Open Login
      </button>
    );
  }
} */
/* 
const Header = () => 
  (
    <header className={css.Header}>
      <div className={css.Logo}>UNEGUI.CLONE</div>
      <input type="text" placeholder="Хайх..." className={css.SearchBar} />
      <button className={css.LoginBtn}>Нэвтрэх</button>
      </header>
   );
export default Header; 
 */