export const verifySession = async (sessionId, password) => {
    try {
      const response = await fetch('http://localhost:8000/api/codeCollab/verify-session', {
        method: 'POST',
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
        const response = await fetch('http://localhost:8000/api/codeCollab/create-session', {
            method: 'POST',
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