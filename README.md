# OCR Comparison Application

A Node.js web application for OCR and image value extraction with comparison features using OpenAI's Vision API.

## Features

- Upload and compare two images (HPUX and Linux)
- Extract text and data from images using OpenAI Vision API
- Compare and highlight differences between extracted data
- Store comparison results in MySQL database
- View history of previous comparisons
- Responsive and modern UI

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- OpenAI API key

## Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd ocr-comparison-app
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up the database**

Run the SQL script to create the database and tables:

```bash
mysql -u root -p < database-setup.sql
```

4. **Configure environment variables**

Rename `.env.example` to `.env` and update the values:

```
# Application
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_USER=root
DB_PASS=your_mysql_password
DB_NAME=ocr_comparison
DB_PORT=3306
DB_DIALECT=mysql

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# File Upload
MAX_FILE_SIZE=5242880  # 5MB
```

5. **Create upload directories**

```bash
mkdir -p public/uploads/hpux
mkdir -p public/uploads/linux
touch public/uploads/hpux/.gitkeep
touch public/uploads/linux/.gitkeep
```

## Running the Application

Start the server in development mode:

```bash
npm run dev
```

Or for production:

```bash
npm start
```

The application will be available at `http://localhost:3000` (or the port you specified in your `.env` file).

## Usage

1. Enter a test case name in the "TEST CASE" field
2. Upload two images for comparison:
   - HPUX image
   - Linux image
3. Click the "Check" button to process the images
4. View the comparison results, with differences highlighted
5. Check the history of previous comparisons in the "Recent Comparisons" section

## Tech Stack

- **Backend**: Node.js, Express
- **Database**: MySQL with Sequelize ORM
- **Frontend**: HTML, CSS, JavaScript
- **OCR Engine**: OpenAI Vision API
- **UI Framework**: Tailwind CSS
- **Template Engine**: EJS

## Project Structure

```
ocr-comparison-app/
│
├── config/             # Configuration files
├── controllers/        # MVC controllers
├── models/             # Database models
├── public/             # Static assets
├── routes/             # Express routes
├── services/           # Business logic services
├── utils/              # Utility functions
├── views/              # EJS templates
├── .env                # Environment variables
├── app.js              # Application entry point
└── package.json        # Dependencies
```

## License

[MIT](LICENSE)