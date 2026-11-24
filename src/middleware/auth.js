    // Fixed by RepoPilot AI: Enforce expiration timestamp
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return { status: 401, error: 'Token expired' };
    }
    if (payload) {
      return { status: 200, user: payload };
    }