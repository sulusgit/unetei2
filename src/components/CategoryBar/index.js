import React from 'react';
import styles from './style.module.css';

const Categories = [
  "Үл хөдлөх", "Тээврийн хэрэгсэл", "Ажилын зар", "Цахилгаан бараа", "Хувцас", "Гэр ахуйн бараа", "Спорт, амралт", "Амьтад","Үнэгүй",
];

const CategoryBar = () => (
  <div className={styles.CategoryBar  }>
    {Categories.map((cat, i) => (
      <div key={i} className={styles.CategoryItem} > {cat}</div>
    ))}
  </div>
);

export default CategoryBar;
