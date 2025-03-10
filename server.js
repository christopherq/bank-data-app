const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080; // Koyeb uses port 8080 by default

// Middleware
app.use(cors({
  origin: ['https://bank-data-app.koyeb.app', 'http://localhost:8080', 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// GoCardless API configuration
const BASE_URL = 'https://bankaccountdata.gocardless.com/api/v2';
const SECRET_ID = process.env.SECRET_ID;
const SECRET_KEY = process.env.SECRET_KEY;
let accessToken = null;
let tokenExpiry = null;

// Get access token
async function getAccessToken() {
  // Check if we have a valid token
  if (accessToken && tokenExpiry && new Date() < tokenExpiry) {
    console.log('Using existing access token');
    return accessToken;
  }

  console.log('Requesting new access token...');
  console.log('Using SECRET_ID:', SECRET_ID ? 'Provided' : 'Missing');
  console.log('Using SECRET_KEY:', SECRET_KEY ? 'Provided' : 'Missing');

  try {
    const response = await fetch(`${BASE_URL}/token/new/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secret_id: SECRET_ID,
        secret_key: SECRET_KEY,
      }),
    });

    console.log('Token API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token API error response:', errorText);
      throw new Error(`Failed to get access token: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Token API response data:', JSON.stringify(data, null, 2));
    
    accessToken = data.access;
    
    // Calculate token expiry (usually 24 hours)
    tokenExpiry = new Date();
    tokenExpiry.setSeconds(tokenExpiry.getSeconds() + data.access_expires);
    
    console.log('Access token obtained successfully, expires:', tokenExpiry);
    return accessToken;
  } catch (error) {
    console.error('Error getting access token:', error);
    throw error;
  }
}

// Get Dutch banks
app.get('/api/banks', async (req, res) => {
  try {
    console.log('Fetching Dutch banks...');
    const token = await getAccessToken();
    console.log('Access token obtained successfully');
    
    const response = await fetch(`${BASE_URL}/institutions/?country=NL`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log('API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error response:', errorText);
      throw new Error(`Failed to get banks: ${response.statusText}`);
    }

    const banks = await response.json();
    console.log(`Retrieved ${banks.length} Dutch banks`);
    res.json(banks);
  } catch (error) {
    console.error('Error fetching banks:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a requisition (bank connection)
app.post('/api/requisitions', async (req, res) => {
  try {
    const { institutionId, redirectUrl } = req.body;
    
    if (!institutionId || !redirectUrl) {
      return res.status(400).json({ error: 'Institution ID and redirect URL are required' });
    }
    
    const token = await getAccessToken();
    
    const response = await fetch(`${BASE_URL}/requisitions/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        redirect: redirectUrl,
        institution_id: institutionId,
        reference: Date.now().toString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create requisition: ${response.statusText}`);
    }

    const requisition = await response.json();
    res.json(requisition);
  } catch (error) {
    console.error('Error creating requisition:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get accounts for a requisition
app.get('/api/requisitions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const token = await getAccessToken();
    
    const response = await fetch(`${BASE_URL}/requisitions/${id}/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get requisition: ${response.statusText}`);
    }

    const requisition = await response.json();
    res.json(requisition);
  } catch (error) {
    console.error('Error fetching requisition:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get transactions for an account
app.get('/api/accounts/:id/transactions', async (req, res) => {
  try {
    const { id } = req.params;
    const token = await getAccessToken();
    
    const response = await fetch(`${BASE_URL}/accounts/${id}/transactions/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get transactions: ${response.statusText}`);
    }

    const transactions = await response.json();
    
    // Filter for McDonald's transactions
    // This is a simple filter that looks for "McDonald's" in the transaction description
    // You might need to adjust this based on how McDonald's appears in the transaction data
    const mcdonaldsTransactions = transactions.transactions.booked.filter(transaction => {
      const description = transaction.remittanceInformationUnstructured || 
                          transaction.additionalInformation || 
                          transaction.creditorName || 
                          '';
      
      return description.toLowerCase().includes('mcdonald') || 
             description.toLowerCase().includes('mcdonalds') ||
             description.toLowerCase().includes('mc donald');
    });
    
    res.json({
      transactions: {
        booked: mcdonaldsTransactions,
        pending: []
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Serve the main HTML file for any other route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Start the server
try {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Access the application at http://localhost:${PORT}`);
    console.log(`API endpoints:`);
    console.log(`- GET /api/banks - Get Dutch banks`);
    console.log(`- POST /api/requisitions - Create a requisition`);
    console.log(`- GET /api/requisitions/:id - Get requisition details`);
    console.log(`- GET /api/accounts/:id/transactions - Get McDonald's transactions`);
  });
} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled promise rejection:', reason);
});
