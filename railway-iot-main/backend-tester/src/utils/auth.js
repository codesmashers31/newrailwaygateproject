export const decodeJWT = (token) => {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Failed to decode JWT", error);
    return null;
  }
};

export const getUserRole = () => {
  const token = localStorage.getItem('accessToken');
  const decoded = decodeJWT(token);
  return decoded?.role || null;
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('accessToken');
};
