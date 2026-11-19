import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { routes } from "@/routes";
import OrientationLock from "@/components/layout/OrientationLock";

const router = createBrowserRouter(routes);

function App() {
  return (
    <OrientationLock>
      <RouterProvider router={router} />
    </OrientationLock>
  );
}

export default App;
