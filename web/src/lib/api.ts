import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 
  (process.env.NODE_ENV === 'development' ? 'http://localhost:3333/api/v1' : '');

export const api = axios.create({
  baseURL,
});
