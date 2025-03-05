export const verifySession = async (sessionId, password) => {
    try {
      const response = await fetch(import.meta.env.VITE_WEBSOCKET_URL + '/api/validateSession/verify-session', {
        method: 'POST',
        mode: "cors",
        // credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, password })
      });
      
      if (!response.ok) throw new Error('Verification failed');
      return await response.json();
    } catch (error) {
      console.error('Session verification error:', error);
      return { valid: false, error: error.message };
    }
  };

  export const createNewSession = async (sessionId, password, owner) => {
    try {
        const response = await fetch(import.meta.env.VITE_WEBSOCKET_URL + '/api/validateSession/create-session', {
            method: 'POST',
            mode: "cors",
            // credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, password, owner })
        });

        if (!response.ok) throw new Error('Session Creation failed');
        return await response.json();


    } catch (error) {
        console.error('Session creation error:', error);
        return { valid: false, error: error.message };
      }
  }