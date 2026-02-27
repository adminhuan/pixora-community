import { ConfigProvider } from 'antd';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';

const App = () => (
  <ConfigProvider
    theme={{
      token: {
        colorPrimary: '#2563EB',
        colorLink: '#2563EB',
        borderRadius: 10,
      },
    }}
  >
    <RouterProvider router={router} />
  </ConfigProvider>
);

export default App;
