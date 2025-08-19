/* Not connected anywhere we will use this component  it appers when the user LOGIN*/
import React, { useState } from 'react';
import styles from './style.module.css';

const UserUI = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(true); // Simulate login
  const user = {
    name: 'Sara',
    email: 'sara@example.com',
    ads: [
      { title: 'iPhone 13 for sale', price: '$600' },
      { title: 'Apartment for rent', price: '$450/month' },
    ],
    social: {
      facebook: 'https://facebook.com/sara',
      instagram: 'https://instagram.com/sara',
      twitter: 'https://x.com/sara',
    },
  };

  if (!isLoggedIn) {
    return <button onClick={() => setIsLoggedIn(true)}>Login</button>;
  }

  return (
    <div className={styles.userPanel}>
      <h2>👤 Welcome, {user.name}</h2>
      <p>Email: {user.email}</p>

      <div className={styles.adsSection}>
        <h3>Your Ads</h3>
        {user.ads.map((ad, i) => (
          <div key={i} className={styles.adCard}>
            <strong>{ad.title}</strong>
            <span>{ad.price}</span>
          </div>
        ))}
      </div>

      <div className={styles.socialLinks}>
        <h3>Social Profiles</h3>
        <a href={user.social.facebook} target="_blank" rel="noreferrer">Facebook</a>
        <a href={user.social.instagram} target="_blank" rel="noreferrer">Instagram</a>
        <a href={user.social.twitter} target="_blank" rel="noreferrer">X (Twitter)</a>
      </div>
    </div>
  );
};

export default UserUI;