/// <reference types="vite/client" />

interface Window {
  google?: {
    accounts: {
      id: {
        initialize: (config: any) => void;
        prompt: (momentListener?: any) => void;
        renderButton: (parent: HTMLElement, options: any) => void;
      };
    };
  };
}
