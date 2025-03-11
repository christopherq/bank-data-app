document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const bankSelector = document.getElementById('bank-selector');
    const transactionsContainer = document.getElementById('transactions-container');
    const transactionsList = document.getElementById('transactions-list');
    const loadingElement = document.getElementById('loading');
    const errorMessage = document.getElementById('error-message');
    const backButton = document.getElementById('back-button');
    const step1 = document.getElementById('step-1');
    const step2 = document.getElementById('step-2');
    const step3 = document.getElementById('step-3');

    // Application state
    let requisitionId = null;
    let accountId = null;

    // Check if we're returning from bank authentication
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    const reqId = urlParams.get('requisitionId');
    
    if (ref && reqId) {
        // We're returning from bank authentication
        handleBankCallback(ref, reqId);
    } else {
        // Initial load - fetch banks
        fetchDutchBanks();
    }

    // Event listeners
    backButton.addEventListener('click', () => {
        // Reset the UI to bank selection
        bankSelector.style.display = 'block';
        transactionsContainer.style.display = 'none';
        backButton.style.display = 'none';
        loadingElement.style.display = 'none';
        errorMessage.style.display = 'none';
        
        // Reset steps
        step1.classList.add('active');
        step1.classList.remove('completed');
        step2.classList.remove('active', 'completed');
        step3.classList.remove('active', 'completed');
        
        // Clear URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
    });

    // Fetch Dutch banks from our backend
    async function fetchDutchBanks() {
        try {
            console.log('Fetching Dutch banks from backend...');
            showLoading('Loading Dutch banks...');
            
            const response = await fetch('/api/banks');
            console.log('Bank API response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API error response:', errorText);
                throw new Error('Failed to fetch banks');
            }
            
            const banks = await response.json();
            console.log('Banks data received:', banks);
            
            hideLoading();
            initializeBankSelector(banks);
        } catch (error) {
            console.error('Error fetching banks:', error);
            showError('Failed to load banks. Please try again later.');
            hideLoading();
        }
    }

    // Initialize the bank selector UI
    function initializeBankSelector(banks) {
        console.log('Initializing bank selector with banks:', banks);
        
        // Check if banks is an array or if it has a different structure
        if (!Array.isArray(banks)) {
            console.warn('Banks data is not an array:', banks);
            // If banks is not an array but has a property that might contain the banks
            if (banks && typeof banks === 'object') {
                // Try to find the banks array in the response
                for (const key in banks) {
                    if (Array.isArray(banks[key])) {
                        console.log(`Found banks array in property '${key}'`);
                        banks = banks[key];
                        break;
                    }
                }
            }
            
            // If we still don't have an array, create an empty one
            if (!Array.isArray(banks)) {
                console.error('Could not find banks array in response, using empty array');
                banks = [];
            }
        }
        
        const config = {
            redirectUrl: `${window.location.origin}?ref=`,
            logoUrl: 'https://cdn-logos.gocardless.com/ais/Nordigen_Logo_Black.svg',
            text: 'Connect to your Dutch bank to view your McDonald\'s transactions.',
            countryFilter: false, // We're already filtering for Dutch banks
            styles: {
                fontFamily: 'https://fonts.googleapis.com/css2?family=Roboto&display=swap',
                fontSize: '16',
                backgroundColor: '#F5F5F5',
                textColor: '#333333',
                headingColor: '#333333',
                linkColor: '#2196F3',
                modalTextColor: '#333333',
                modalBackgroundColor: '#FFFFFF',
                buttonColor: '#2196F3',
                buttonTextColor: '#FFFFFF'
            }
        };

        console.log('Bank selector config:', config);
        
        // Initialize the bank selector
        try {
            new institutionSelector(banks, 'institution-content-wrapper', config);
            console.log('Bank selector initialized successfully');
        } catch (error) {
            console.error('Error initializing bank selector:', error);
            showError('Failed to initialize bank selector. Please try again later.');
        }

        // Add custom event listener for bank selection
        setTimeout(() => {
            const institutionList = Array.from(document.querySelectorAll('.ob-list-institution > a'));
            
            institutionList.forEach((institution) => {
                institution.addEventListener('click', async (e) => {
                    e.preventDefault();
                    const institutionId = institution.getAttribute('data-institution');
                    await createRequisition(institutionId);
                });
            });
        }, 1000); // Give the library time to render
    }

    // Create a requisition when a bank is selected
    async function createRequisition(institutionId) {
        try {
            showLoading('Connecting to bank...');
            
            // Update steps
            step1.classList.remove('active');
            step1.classList.add('completed');
            step2.classList.add('active');
            
            // Include a placeholder for the requisitionId in the redirect URL
            const redirectUrl = `${window.location.origin}?ref=&requisitionId=REQUISITION_ID_PLACEHOLDER`;
            
            const response = await fetch('/api/requisitions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    institutionId,
                    redirectUrl,
                }),
            });
            
            if (!response.ok) {
                throw new Error('Failed to create bank connection');
            }
            
            const data = await response.json();
            
            // For backup/fallback, still store in sessionStorage
            sessionStorage.setItem('requisitionId', data.id);
            
            // Replace the placeholder with the actual requisitionId
            const authLink = data.link.replace('REQUISITION_ID_PLACEHOLDER', data.id);
            
            // Redirect to bank authentication
            window.location.href = authLink;
        } catch (error) {
            console.error('Error creating requisition:', error);
            showError('Failed to connect to bank. Please try again.');
            hideLoading();
            
            // Reset steps
            step1.classList.add('active');
            step2.classList.remove('active');
            step1.classList.remove('completed');
        }
    }

    // Handle callback after bank authentication
    async function handleBankCallback(ref, reqId) {
        try {
            showLoading('Retrieving your account information...');
            
            // Update steps
            step1.classList.remove('active');
            step1.classList.add('completed');
            step2.classList.remove('active');
            step2.classList.add('completed');
            step3.classList.add('active');
            
            // Hide bank selector
            bankSelector.style.display = 'none';
            
            // Get requisition ID from URL parameter
            requisitionId = reqId;
            
            // Fallback to session storage if URL parameter is not available
            if (!requisitionId) {
                requisitionId = sessionStorage.getItem('requisitionId');
                if (!requisitionId) {
                    throw new Error('Bank connection information not found');
                }
            }
            
            console.log('Using requisition ID:', requisitionId);
            
            // Get requisition details
            const response = await fetch(`/api/requisitions/${requisitionId}`);
            
            if (!response.ok) {
                throw new Error('Failed to get bank connection details');
            }
            
            const requisition = await response.json();
            
            // Check if we have accounts
            if (!requisition.accounts || requisition.accounts.length === 0) {
                throw new Error('No bank accounts found');
            }
            
            // Use the first account
            accountId = requisition.accounts[0];
            
            // Fetch transactions
            await fetchTransactions(accountId);
            
            // Show back button
            backButton.style.display = 'block';
        } catch (error) {
            console.error('Error handling callback:', error);
            showError('Failed to retrieve your account information. Please try again.');
            hideLoading();
            
            // Reset steps and show bank selector
            step1.classList.add('active');
            step2.classList.remove('active', 'completed');
            step3.classList.remove('active');
            step1.classList.remove('completed');
            bankSelector.style.display = 'block';
        }
    }

    // Fetch McDonald's transactions
    async function fetchTransactions(accountId) {
        try {
            showLoading('Fetching your McDonald\'s transactions...');
            
            const response = await fetch(`/api/accounts/${accountId}/transactions`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch transactions');
            }
            
            const data = await response.json();
            
            // Display transactions
            displayTransactions(data.transactions.booked);
            
            hideLoading();
            transactionsContainer.style.display = 'block';
        } catch (error) {
            console.error('Error fetching transactions:', error);
            showError('Failed to fetch your transactions. Please try again.');
            hideLoading();
        }
    }

    // Display transactions in the UI
    function displayTransactions(transactions) {
        transactionsList.innerHTML = '';
        
        if (!transactions || transactions.length === 0) {
            transactionsList.innerHTML = `
                <div class="no-transactions">
                    <p>No McDonald's transactions found in your account.</p>
                </div>
            `;
            return;
        }
        
        // Sort transactions by date (newest first)
        transactions.sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate));
        
        transactions.forEach(transaction => {
            const date = new Date(transaction.bookingDate).toLocaleDateString();
            const amount = parseFloat(transaction.transactionAmount.amount);
            const currency = transaction.transactionAmount.currency;
            const description = transaction.remittanceInformationUnstructured || 
                               transaction.additionalInformation || 
                               transaction.creditorName || 
                               'McDonald\'s Transaction';
            
            const isPositive = amount > 0;
            
            const transactionElement = document.createElement('div');
            transactionElement.className = 'transaction-item';
            transactionElement.innerHTML = `
                <div class="transaction-date">${date}</div>
                <div class="transaction-description">${description}</div>
                <div class="transaction-amount ${isPositive ? 'positive' : ''}">${amount.toFixed(2)} ${currency}</div>
            `;
            
            transactionsList.appendChild(transactionElement);
        });
    }

    // Helper functions
    function showLoading(message) {
        loadingElement.innerHTML = `<p>${message || 'Loading...'}</p>`;
        loadingElement.style.display = 'block';
    }
    
    function hideLoading() {
        loadingElement.style.display = 'none';
    }
    
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    }
    
    function hideError() {
        errorMessage.style.display = 'none';
    }
});
