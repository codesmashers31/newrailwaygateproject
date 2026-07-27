import React, { createContext, useState, useContext } from 'react';

const NavigationContext = createContext();

export function NavigationProvider({ children, initialScreen = 'SPLASH' }) {
  const [currentScreen, setCurrentScreen] = useState(initialScreen);
  const [params, setParams] = useState({});
  const [history, setHistory] = useState([initialScreen]);

  const [isDarkMode, setIsDarkMode] = useState(false);

  const navigate = (screenName, screenParams = {}) => {
    setParams(screenParams);
    setCurrentScreen(screenName);
    setHistory((prev) => [...prev, screenName]);
  };

  const goBack = () => {
    if (history.length > 1) {
      const newHistory = [...history];
      newHistory.pop(); // Remove current screen
      const prevScreen = newHistory[newHistory.length - 1];
      setHistory(newHistory);
      setCurrentScreen(prevScreen);
    }
  };

  const reset = (screenName, screenParams = {}) => {
    setParams(screenParams);
    setCurrentScreen(screenName);
    setHistory([screenName]);
  };

  return (
    <NavigationContext.Provider
      value={{
        currentScreen,
        params,
        navigate,
        goBack,
        reset,
        canGoBack: history.length > 1,
        isDarkMode,
        setIsDarkMode,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
