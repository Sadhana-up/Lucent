import { createContext, useContext } from 'react';

/** True once the splash has fully left, so the home screen can enter. */
export const SplashDoneContext = createContext(false);
export const useSplashDone = () => useContext(SplashDoneContext);
