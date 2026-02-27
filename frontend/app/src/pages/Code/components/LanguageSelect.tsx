interface LanguageSelectProps {
  value: string;
  onChange: (value: string) => void;
}

const languages = ['typescript', 'javascript', 'python', 'go', 'java', 'rust', 'sql'];

export const LanguageSelect = ({ value, onChange }: LanguageSelectProps) => (
  <select className="select" value={value} onChange={(event) => onChange(event.target.value)}>
    {languages.map((language) => (
      <option key={language} value={language}>
        {language}
      </option>
    ))}
  </select>
);
