import { NavigationContainer } from "@react-navigation/native";
import AppProvider from "./src/providers/App";
import AppRoutes from "./src/Routes";

export default function App() {
  return (
    <NavigationContainer>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </NavigationContainer>
  );
}
