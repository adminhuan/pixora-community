import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { useDarkMode } from './hooks/useDarkMode';

const App = () => {
  const { mode, applyMode } = useDarkMode();

  useEffect(() => {
    applyMode(mode);
  }, [applyMode, mode]);

  return <RouterProvider router={router} />;
};

export default App;
