# Bank Data App

A web application that displays Dutch retail bank transactions from McDonald's using the nordigen-bank-ui library and GoCardless Bank Account Data API.

## Features

- Connect to Dutch retail banks using nordigen-bank-ui
- Authenticate with bank credentials through GoCardless API
- View McDonald's transactions from connected bank accounts
- Clean, responsive UI for easy navigation

## Technologies

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js and Express
- **Bank UI**: nordigen-bank-ui for bank selection interface
- **API**: GoCardless Bank Account Data API for secure bank connections
- **Deployment**: Koyeb for hosting

## Setup

### Prerequisites

- Node.js (v14 or higher)
- GoCardless API credentials (Secret ID and Secret Key)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/YOUR_USERNAME/bank-data-app.git
   cd bank-data-app
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with your GoCardless API credentials:
   ```
   SECRET_ID=your_secret_id
   SECRET_KEY=your_secret_key
   ```

4. Start the application:
   ```
   npm start
   ```

5. Open your browser and navigate to `http://localhost:8080`

## Usage

1. Select your Dutch bank from the list
2. Authenticate with your bank credentials
3. View your McDonald's transactions

## License

MIT

## Acknowledgements

- [nordigen-bank-ui](https://github.com/nordigen/nordigen-bank-ui) for the bank selection UI
- [GoCardless](https://developer.gocardless.com/bank-account-data/quick-start-guide) for the Bank Account Data API
