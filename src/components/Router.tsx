/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, createContext, useContext } from 'react';

interface RouterContextProps {
  path: string;
  params: { [key: string]: string };
  navigate: (to: string) => void;
}

const RouterContext = createContext<RouterContextProps>({
  path: window.location.pathname,
  params: {},
  navigate: () => {}
});

export function RouterProvider({ children }: { children: React.ReactNode }) {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (to: string) => {
    window.history.pushState(null, '', to);
    setPath(to);
  };

  // Helper to parse dynamic segments (e.g., /@username or /messages/:id)
  const getParams = (): { [key: string]: string } => {
    const params: { [key: string]: string } = {};
    
    // Check if path starts with /@
    if (path.startsWith('/@')) {
      params.username = path.substring(2);
    }
    
    return params;
  };

  return (
    <RouterContext.Provider value={{ path, params: getParams(), navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  return useContext(RouterContext);
}
