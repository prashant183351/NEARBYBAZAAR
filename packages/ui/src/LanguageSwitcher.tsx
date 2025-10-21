import React from 'react';

interface Props {
    language: string;
    setLanguage: (lang: string) => void;
}

export const LanguageSwitcher: React.FC<Props> = ({ language, setLanguage }) => (
    <select value={language} onChange={e => setLanguage(e.target.value)} style={{ marginLeft: 8 }}>
        <option value="en">English</option>
        <option value="hi">हिन्दी</option>
    </select>
);
