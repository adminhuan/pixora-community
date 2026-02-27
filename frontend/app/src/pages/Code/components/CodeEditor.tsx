interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export const CodeEditor = ({ value, onChange }: CodeEditorProps) => (
  <textarea
    className="textarea"
    rows={14}
    value={value}
    onChange={(event) => onChange(event.target.value)}
    style={{
      background: '#0B1220',
      color: '#C7DCFF',
      fontFamily: 'Menlo, Monaco, Consolas, monospace',
    }}
  />
);
