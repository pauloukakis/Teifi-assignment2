Teifi Assignment 2
This assignment is a full-stack Shopify app example that demonstrates the following functionality:

Integrates with the Shopify Admin GraphQL API.
Fetches and displays products, supporting pagination and only showing 5 products at a time.
Provides a form to create a new product and update its default variant’s SKU.
Uses modern technologies like Remix, TypeScript, React, Node.js, Polaris, and the Shopify GraphQL Admin API.
Features
Product Listing with Pagination:
Displays all products currently in the store, but shows only 5 per page on the frontend. Users can navigate through products using pagination controls without making additional requests for each page.

Product Creation and Variant Update:
Includes a form that allows you to create a new product (title, status) and then update its default variant’s SKU, demonstrating the use of the productCreate and productVariantUpdate GraphQL mutations.

Shopify Admin GraphQL Integration:
Interacts directly with the Shopify Admin API using admin.graphql, without referencing the store domain directly in the frontend code.

Remix + Polaris + App Bridge:
Built with:

Remix for the full-stack framework.
Polaris for consistent UI components.
App Bridge for embedded Shopify app functionalities.
TypeScript for type safety and maintainability.
Technologies Used
TypeScript
Node.js v20+
Remix
React v18
Shopify Admin GraphQL API (2024-07)
Shopify Polaris
Shopify App Bridge
Prerequisites
Node.js v20 or higher
A Shopify store with Admin API access.
A .env file (or environment variables) that contains:
SHOPIFY_API_KEY
SHOPIFY_API_SECRET
SCOPES (including write_products scope for variant updates)
HOST or APP_URL
Follow Shopify app authentication instructions for setting up these credentials.
Getting Started
Clone the repository:

bash
Copy code
git clone https://github.com/pauloukakis/Teifi-assignment2.git
cd Teifi-assignment2
Install dependencies:

bash
Copy code
npm install
or

bash
Copy code
yarn install
Set up environment variables: Create a .env file at the root of the project and populate it with the necessary environment variables:

env
Copy code
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SCOPES=write_products,read_products
HOST=https://your-ngrok-tunnel.ngrok.io
Make sure these values match your Shopify app configuration and development environment.

Run the app in development mode:

bash
Copy code
npm run dev
or

bash
Copy code
yarn dev
The Remix development server will start, and you should be able to access the app via the HOST specified (if using ngrok, ensure that your Shopify app is configured to point to that URL).

Authenticate and Load the App:

Navigate to your Shopify store’s admin page and install the app.
Once installed, the app will load within Shopify’s admin interface.
Using the App
Main Page:

Shows a list of products fetched from your store.
Displays only 5 products at a time.
Includes pagination controls at the bottom of the list to navigate through all products without additional requests.
Has a button leading to a form that creates a new product.
Create Product Form:

Allows you to enter a product title, status, and SKU.
On submission, it creates a new product and updates the default variant’s SKU.
Returns you to the main page after creation, where you can see the newly added product after a refresh.
Code Structure
app/routes/: Contains the Remix route files, including the main page (index.tsx) and the create product form page.
app/shopify.server.ts: Handles authentication and provides the admin GraphQL client.
app/components/ (if present): Additional UI components or abstractions.
app/services/ (if present): Code to interact with Shopify API or other backend logic.
remix.config.js and remix.env.d.ts: Remix configuration and type declarations.
Troubleshooting
GraphQL Errors:
Ensure the API version and scopes are correct. If productVariantUpdate doesn’t exist, confirm your Admin API version supports it and that your app’s scopes include write_products.

Pagination Issues:
If the store has more than 250 products, consider implementing multiple GraphQL queries or a different approach to fetch all products.

Styling and UI Issues:
Ensure that the Polaris AppProvider and TitleBar are correctly set up in app/root.tsx.

License
This project is provided as part of an assignment and does not include a specific license. Adjust licensing terms as needed.
