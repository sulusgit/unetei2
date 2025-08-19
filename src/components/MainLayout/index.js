import React from 'react';
import css from './style.module.css';

const MainLayout = () => (
  <div /* className= {css.PageContainer} */>
    <div className={css.MainLayout}>
      <div className={css.Sidebar}>Banner section</div>
    {/*   <div className={css.CenterContent}> */}
        <div className={css.MainSection}>
          <h2>Main ads here will be...</h2>
        </div>
  {/*     </div> */}
      <div className={css.Sidebar}>Banner section</div>
    </div>

    <footer className={css.Footer}>
      <p>© 2025 UNEGUI.CLONE. All rights reserved.</p>
    </footer>
  </div>
);
export default MainLayout;


/*

const MainLayout = () => (
   <div className="page-container">     
    <div className="main-layout">
      <aside className="sidebar left">
       {/*  <div className="banner-ad">Banner section</div> */
    /*  </aside>
      <main className="center-content">
        <div className="main-section">
          <h2>Main ads here will be...</h2>
         
        </div>
      </main>
      <aside className="sidebar right">
       {/*  <div className="banner-ad">Banner section</div> */
    /*  </aside>
    </div>
  <footer className="footer" >
    <p>© 2025 UNEGUI.CLONE. All rights reserved.</p>
    </footer>
  </div>
);
*/