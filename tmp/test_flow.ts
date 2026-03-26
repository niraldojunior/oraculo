import fetch from 'node-fetch';

async function test() {
  const email = 'niraldojunior@gmail.com';
  const password = '123456';
  
  console.log(`--- Testing Login for ${email} ---`);
  const loginRes = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  if (!loginRes.ok) {
    const errorBody = await loginRes.text();
    console.log(`Login failed with status ${loginRes.status}: ${errorBody}`);
    return;
  }
  
  const loginData = await loginRes.json();
  console.log('Login successful:', JSON.stringify(loginData, null, 2));
  
  const { type } = loginData;
  const dataUrl = type === 'admin' 
    ? `http://localhost:3001/api/users/email/${encodeURIComponent(email)}`
    : `http://localhost:3001/api/collaborators/email/${encodeURIComponent(email)}`;
    
  console.log(`--- Testing Fetch User Data: ${dataUrl} ---`);
  const dataRes = await fetch(dataUrl);
  
  if (!dataRes.ok) {
    const errorBody = await dataRes.text();
    console.log(`Fetch data failed with status ${dataRes.status}: ${errorBody}`);
  } else {
    const userData = await dataRes.json();
    console.log('Fetch data successful:', JSON.stringify(userData, null, 2));
  }
}

test().catch(console.error);
