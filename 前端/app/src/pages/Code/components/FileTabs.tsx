interface FileTabsProps {
  files: string[];
  active: string;
  onChange: (filename: string) => void;
}

export const FileTabs = ({ files, active, onChange }: FileTabsProps) => (
  <div className="vsc-tabs">
    {files.map((file) => (
      <button
        key={file}
        type="button"
        className={`vsc-tab${file === active ? ' vsc-tab--active' : ''}`}
        onClick={() => onChange(file)}
      >
        {file}
      </button>
    ))}
  </div>
);
