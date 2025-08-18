import React, { useState } from 'react';
import css from './App.module.css';

import Header from './components/Header';
import CategoryBar from './components/CategoryBar';
import LoginUI from './pages/LoginUI';
import MainLayout from './components/MainLayout';







function App() {
  const [showLogin, setShowLogin] = useState(false);

  return (
  <div className="App">
      <Header />
      <CategoryBar />     
      <MainLayout />
 
      <Header onLoginClick={() => setShowLogin(true)} />
       

      {showLogin && (
        <div className={css.modalOverlay}>
          <div className={css.modal}>
            <button className={css.closeBtn} onClick={() => setShowLogin(false)}>X </button>
            <LoginUI />
           
      
          </div>
        </div>
      )}
    </div>
  );
}


export default App;
