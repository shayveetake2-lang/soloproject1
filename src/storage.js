const endpoint = '/api/storage';

export const storage = {
  async load() {
    const response = await fetch(endpoint);
    if (!response.ok) throw new Error('Database unavailable');
    return response.json();
  },
  async set(key, value) {
    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value })
    });
    if (!response.ok) throw new Error('Could not save data');
  },
  async remove(key) {
    await fetch(`${endpoint}/${encodeURIComponent(key)}`, { method: 'DELETE' });
  }
};
