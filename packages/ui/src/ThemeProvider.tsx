import React from 'react';
import './theme.css';

type ThemeProviderProps = {
    children: React.ReactNode;
    theme?: 'light' | 'dark';
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children, theme = 'light' }) => (
    <div className={`nbz-theme nbz-theme--${theme}`}>{children}</div>
);
