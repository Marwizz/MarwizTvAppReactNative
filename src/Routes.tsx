import {
  createStackNavigator,
  StackNavigationOptions,
} from "@react-navigation/stack";
import React from "react";
import Auth from "./screen/Auth";
import Media from "./screen/Media";
import { useAppStore } from "./store";

export type IRootStackParamList = {
  auth: undefined;
  media: undefined;
};

const screenOptions: StackNavigationOptions = {
  headerShown: false,
};

const Stack = createStackNavigator<IRootStackParamList>();

const AppRoutes = () => {
  const { isAuth } = useAppStore();

  return (
    <Stack.Navigator
      screenOptions={screenOptions}
      initialRouteName={isAuth ? "media" : "auth"}
    >
      {isAuth ? (
        <>
          <Stack.Screen name="media" component={Media} />
        </>
      ) : (
        <>
          <Stack.Screen name="auth" component={Auth} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppRoutes;
