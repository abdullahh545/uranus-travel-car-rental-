import React from 'react'
import { NavLink } from 'react-router-dom'
import styles from './BottomNav.module.css'

export default function BottomNav() {
  return (
    <nav className={styles.nav}>
      <NavLink to="/home" className={({ isActive }) => isActive ? `${styles.link} ${styles.active}` : styles.link}>
        <span className={styles.icon}>🏠</span>
        <span className={styles.label}>Home</span>
      </NavLink>
      <NavLink to="/rides" className={({ isActive }) => isActive ? `${styles.link} ${styles.active}` : styles.link}>
        <span className={styles.icon}>🚗</span>
        <span className={styles.label}>My Rides</span>
      </NavLink>
    </nav>
  )
}
