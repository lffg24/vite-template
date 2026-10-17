import { createContext, useContext, type ReactNode } from "react";

import type { WebDirectApplicationContext } from "./types";

const WebDirectSupportContext = createContext<WebDirectApplicationContext>({});

export function WebDirectSupportProvider({
  value,
  children,
}: {
  value: WebDirectApplicationContext;
  children: ReactNode;
}) {
  return (
    <WebDirectSupportContext.Provider value={value}>
      {children}
    </WebDirectSupportContext.Provider>
  );
}

export function useWebDirectSupport() {
  return useContext(WebDirectSupportContext);
}
