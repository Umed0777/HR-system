import { App as AntApp } from "antd";
import { HRSystemRoutes } from "./Routes/HRSystemRoutes"

function App() {
  return (
    <AntApp>
      <HRSystemRoutes />
    </AntApp>
  )
}

export default App