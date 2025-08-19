import React from 'react';
import css from './style.module.css';

const Header = ({ onLoginClick }) => (
  <header className={css.Header}>
    <div className={css.Logo}>UNEGUI.CLONE</div>
    <input
      type="text"
      placeholder="Хайх..."
      className={css.SearchBar}
    />
    <button className={css.LoginBtn} onClick={onLoginClick}>
      Нэвтрэх
    </button>
  </header>
);

export default Header;
