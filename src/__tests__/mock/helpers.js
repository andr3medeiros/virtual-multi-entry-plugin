// Mock helper functions for testing
export const createElement = (tag, attributes = {}, children = []) => {
  const element = document.createElement(tag);
  
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'onClick') {
      element.addEventListener('click', value);
    } else {
      element.setAttribute(key, value);
    }
  });
  
  children.forEach(child => {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else {
      element.appendChild(child);
    }
  });
  
  return element;
};

export const querySelector = (selector, parent = document) => {
  return parent.querySelector(selector);
};

export const querySelectorAll = (selector, parent = document) => {
  return Array.from(parent.querySelectorAll(selector));
};

export const addClass = (element, className) => {
  if (element && element.classList) {
    element.classList.add(className);
  }
};

export const removeClass = (element, className) => {
  if (element && element.classList) {
    element.classList.remove(className);
  }
};

export const toggleClass = (element, className) => {
  if (element && element.classList) {
    element.classList.toggle(className);
  }
};

export const hasClass = (element, className) => {
  return element && element.classList && element.classList.contains(className);
};

export const getElementById = (id) => {
  return document.getElementById(id);
};

export const createEvent = (type, detail = {}) => {
  return new CustomEvent(type, { detail });
};

export const dispatchEvent = (element, event) => {
  if (element && element.dispatchEvent) {
    element.dispatchEvent(event);
  }
};

export const waitForElement = (selector, timeout = 5000) => {
  return new Promise((resolve, reject) => {
    const element = querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }
    
    const observer = new MutationObserver((mutations, obs) => {
      const element = querySelector(selector);
      if (element) {
        obs.disconnect();
        resolve(element);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found within ${timeout}ms`));
    }, timeout);
  });
};

export const mockFetch = (response, delay = 0) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        ok: true,
        json: () => Promise.resolve(response),
        text: () => Promise.resolve(JSON.stringify(response)),
        status: 200,
      });
    }, delay);
  });
};
